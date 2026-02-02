import { Hono } from 'hono';
import crypto from 'crypto';
import prisma from '@/db/client';

const webhooks = new Hono();

/**
 * Polar webhook endpoint
 * Handles subscription events to update user subscription status
 * 
 * Events handled:
 * - subscription.created: New subscription created
 * - subscription.updated: Subscription updated (active, canceled, etc.)
 * - subscription.active: Subscription activated
 * - subscription.canceled: Subscription canceled
 */
webhooks.post('/polar', async (c) => {
    const signature = c.req.header('x-polar-signature-256');
    
    if (!signature) {
        return c.json({ error: 'Missing signature' }, 401);
    }

    try {
        // Get raw body for signature verification
        const rawBody = await c.req.text();
        
        // Verify webhook signature using HMAC-SHA256
        const hmac = crypto.createHmac('sha256', process.env.POLAR_WEBHOOK_SECRET!);
        const digest = hmac.update(rawBody).digest('base64');
        const expectedSignature = `sha256=${digest}`;
        
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
            console.error('Invalid webhook signature');
            console.error('Expected:', expectedSignature);
            console.error('Received:', signature);
            return c.json({ error: 'Invalid signature' }, 401);
        }

        const body = JSON.parse(rawBody);
        console.log('Webhook event received:', body.type);

        // Handle different event types
        switch (body.type) {
            case 'subscription.created':
            case 'subscription.updated':
                await handleSubscriptionUpdate(body.data);
                break;
            
            case 'subscription.canceled':
                await handleSubscriptionCanceled(body.data);
                break;
            
            case 'checkout.completed':
                // Checkout completed, subscription might be created
                console.log('Checkout completed:', body.data);
                break;
            
            default:
                console.log('Unhandled event type:', body.type);
        }

        return c.json({ success: true });

    } catch (error) {
        console.error('Webhook error:', error);
        return c.json({ error: 'Webhook processing failed' }, 500);
    }
});

/**
 * Handle subscription update (active or trialing)
 */
async function handleSubscriptionUpdate(data: any) {
    const customerId = data.customer_id;
    const subscriptionId = data.id;
    const status = data.status; // active, trialing, canceled, etc.
    
    console.log('Processing subscription update:', { customerId, subscriptionId, status });

    // Find user by Polar customer ID
    const user = await prisma.user.findUnique({
        where: { polarCustomerId: customerId }
    });

    if (!user) {
        console.error('User not found for customer ID:', customerId);
        return;
    }

    // Determine if subscription should be considered active
    const isActive = status === 'active' || status === 'trialing';
    
    // Update user with subscription status
    await prisma.user.update({
        where: { id: user.id },
        data: {
            polarSubscriptionId: subscriptionId,
            subscriptionStatus: isActive ? 'active' : 'inactive'
        }
    });

    console.log(`Updated user subscription to ${isActive ? 'active' : 'inactive'}:`, user.email);
}

/**
 * Handle canceled subscription
 */
async function handleSubscriptionCanceled(data: any) {
    const customerId = data.customer_id;
    
    console.log('Processing canceled subscription:', customerId);

    // Find user by Polar customer ID
    const user = await prisma.user.findUnique({
        where: { polarCustomerId: customerId }
    });

    if (!user) {
        console.error('User not found for customer ID:', customerId);
        return;
    }

    // Update user with canceled subscription
    await prisma.user.update({
        where: { id: user.id },
        data: {
            subscriptionStatus: 'canceled'
        }
    });

    console.log('Updated user subscription to canceled:', user.email);
}

export default webhooks;
