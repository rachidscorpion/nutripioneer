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
 * - subscription.updated: Subscription updated (any status change)
 * - subscription.active: Subscription activated (after successful payment)
 * - subscription.past_due: Subscription payment past due
 * - subscription.uncanceled: Subscription cancellation undone
 * - subscription.canceled: Subscription canceled
 * - subscription.revoked: Subscription revoked
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

        // Handle different event types
        switch (body.type) {
            case 'subscription.created':
            case 'subscription.updated':
            case 'subscription.active':
            case 'subscription.past_due':
            case 'subscription.uncanceled':
                await handleSubscriptionUpdate(body.data);
                break;

            case 'subscription.canceled':
            case 'subscription.revoked':
                await handleSubscriptionCanceled(body.data);
                break;

            case 'checkout.completed':
                // Checkout completed, subscription might be created
                break;

            default:
                break;
        }

        return c.json({ success: true });

    } catch (error) {
        console.error('Webhook error:', error);
        return c.json({ error: 'Webhook processing failed' }, 500);
    }
});

/**
 * Handle subscription update (active, trialing, past_due, etc.)
 */
async function handleSubscriptionUpdate(data: any) {
    const customerId = data.customer_id;
    const subscriptionId = data.id;
    const status = data.status; // active, trialing, canceled, past_due, etc.

    // Try to find user by customer.externalId (from checkout externalCustomerId)
    // This solves the chicken-and-egg problem where polarCustomerId isn't set yet
    let user = null;

    if (data.customer?.externalId) {
        user = await prisma.user.findUnique({
            where: { id: data.customer.externalId }
        });
        if (user) {
        }
    }

    // Try metadata.userId as fallback (for old checkouts)
    if (!user && data.metadata?.userId) {
        user = await prisma.user.findUnique({
            where: { id: data.metadata.userId }
        });
        if (user) {
        }
    }

    // Fall back to finding by polarCustomerId (for already-linked users)
    if (!user && customerId) {
        user = await prisma.user.findUnique({
            where: { polarCustomerId: customerId }
        });
        if (user) {
        }
    }

    // Try finding by customer email as last resort
    if (!user && data.customer?.email) {
        user = await prisma.user.findUnique({
            where: { email: data.customer.email }
        });
        if (user) {
        }
    }

    if (!user) {
        console.error('✗ User not found - tried:', {
            customerExternalId: data.customer?.externalId,
            metadataUserId: data.metadata?.userId,
            polarCustomerId: customerId,
            customerEmail: data.customer?.email
        });
        return;
    }

    // Determine if subscription should be considered active
    // Active statuses: active, trialing, past_due (still has access until period ends)
    const isActive = status === 'active' || status === 'trialing' || status === 'past_due';

    // Determine subscription status for our database
    let subscriptionStatus = 'inactive';
    if (isActive) {
        subscriptionStatus = 'active';
    } else if (status === 'canceled' || status === 'revoked' || status === 'ended') {
        subscriptionStatus = 'canceled';
    }

    // Update user with all subscription fields
    await prisma.user.update({
        where: { id: user.id },
        data: {
            polarCustomerId: customerId,
            polarSubscriptionId: subscriptionId,
            subscriptionStatus: subscriptionStatus
        }
    });
}

/**
 * Handle canceled/revoked subscription
 */
async function handleSubscriptionCanceled(data: any) {
    const customerId = data.customer_id;
    const subscriptionId = data.id;
    const status = data.status;

    // Try to find user by customer.externalId (from checkout externalCustomerId)
    let user = null;

    if (data.customer?.externalId) {
        user = await prisma.user.findUnique({
            where: { id: data.customer.externalId }
        });
        if (user) {
        }
    }

    // Try metadata.userId as fallback (for old checkouts)
    if (!user && data.metadata?.userId) {
        user = await prisma.user.findUnique({
            where: { id: data.metadata.userId }
        });
        if (user) {
        }
    }

    // Fall back to finding by polarCustomerId (for already-linked users)
    if (!user && customerId) {
        user = await prisma.user.findUnique({
            where: { polarCustomerId: customerId }
        });
        if (user) {
        }
    }

    // Try finding by customer email as last resort
    if (!user && data.customer?.email) {
        user = await prisma.user.findUnique({
            where: { email: data.customer.email }
        });
        if (user) {
        }
    }

    if (!user) {
        console.error('✗ User not found - tried:', {
            customerExternalId: data.customer?.externalId,
            metadataUserId: data.metadata?.userId,
            polarCustomerId: customerId,
            customerEmail: data.customer?.email
        });
        return;
    }

    // Update user with canceled subscription status
    await prisma.user.update({
        where: { id: user.id },
        data: {
            subscriptionStatus: 'canceled'
        }
    });
}

export default webhooks;
