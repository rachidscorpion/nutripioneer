import { Hono } from 'hono';
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import prisma from '@/db/client';

const webhooks = new Hono();

/**
 * Debug endpoint to see all headers Polar sends
 * Use this to check what headers are actually being received
 */
webhooks.get('/polar/debug', async (c) => {
    try {
        const allHeaders: Record<string, string> = {};
        // Use Object.fromEntries with spread operator for Headers object
        const headers = c.req.header();
        for (const [key, value] of Object.entries(headers)) {
            allHeaders[key] = value as string;
        }

        return c.json({
            message: 'Headers received',
            headers: allHeaders,
            count: Object.keys(allHeaders).length
        });
    } catch (error) {
        return c.json({
            error: 'Debug failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

/**
 * Test webhook endpoint (no signature required)
 * Use this to verify your webhook URL is accessible from Polar.sh
 */
webhooks.post('/polar/test', async (c) => {
    try {
        const body = await c.req.json();
        console.log('🧪 Test webhook received:', body);

        return c.json({
            success: true,
            message: 'Webhook endpoint is working!',
            received: body
        });
    } catch (error) {
        console.error('Test webhook error:', error);
        return c.json({ error: 'Test webhook failed' }, 500);
    }
});

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
    try {
        // Get raw body for signature verification
        const rawBody = await c.req.text();

        if (!rawBody) {
            console.error('❌ Request body is empty or undefined');
            return c.json({ error: 'Empty request body' }, 400);
        }

        console.log('📄 Raw body length:', rawBody.length);
        console.log('📄 Raw body preview:', rawBody.substring(0, 200));

        // Determine which webhook secret to use based on environment
        // Check multiple possible environment variable names
        const polarEnv = process.env.POLAR_ENV || process.env.NEXT_PUBLIC_POLAR_ENV || 'development';
        const webhookSecret = polarEnv === 'production'
            ? process.env.POLAR_WEBHOOK_SECRET!
            : process.env.POLAR_SANDBOX_WEBHOOK_SECRET!;

        console.log('🔐 Environment:', polarEnv);
        console.log('🔐 Using webhook secret:', webhookSecret?.substring(0, 20) + '...');

        // Get all headers for signature verification
        const headers = c.req.header();
        
        // Parse event type early to check if SDK supports it
        let parsedEventType: string | null = null;
        try {
            const parsed = JSON.parse(rawBody);
            parsedEventType = parsed.type;
        } catch {
            // Will be handled by validateEvent
        }

        // Use Polar's SDK to validate webhook
        // This handles signature verification properly
        console.log('🔍 About to call validateEvent with rawBody type:', typeof rawBody);
        
        let event;
        try {
            event = validateEvent(rawBody, headers, webhookSecret);
        } catch (error) {
            // Polar SDK doesn't support all event types (e.g., member.*)
            // For unsupported events, return 200 OK to stop retries
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('Unknown event type') && parsedEventType) {
                console.log('⚠️ SDK does not support event type:', parsedEventType);
                console.log('✅ Returning 200 OK to acknowledge receipt');
                // Return 200 OK so Polar stops retrying
                return c.json({ success: true, unsupportedEvent: parsedEventType });
            }
            throw error; // Re-throw other errors
        }

        console.log('✅ Webhook received:', event.type);
        console.log('📦 Webhook data:', JSON.stringify(event.data, null, 2));

        // Handle different event types
        switch (event.type) {
            case 'subscription.created':
            case 'subscription.updated':
            case 'subscription.active':
            case 'subscription.past_due':
            case 'subscription.uncanceled':
                await handleSubscriptionUpdate(event.data);
                break;

            case 'subscription.canceled':
            case 'subscription.revoked':
                await handleSubscriptionCanceled(event.data);
                break;

            case 'order.updated':
                // Order updated (e.g., payment successful)
                // Contains subscription data in event.data.subscription
                if (event.data.subscription) {
                    await handleSubscriptionUpdate(event.data.subscription);
                }
                break;

            case 'checkout.completed':
                // Checkout completed, subscription might be created
                break;

            case 'member.created':
            case 'member.updated':
            case 'member.deleted':
                // Member events - not currently used for subscription updates
                console.log('ℹ️ Member event received (not handled):', event.type);
                break;

            case 'customer.state_changed':
            case 'customer.updated':
                await handleCustomerUpdate(event.data);
                break;

            case 'customer.deleted':
                await handleCustomerDeleted(event.data);
                break;

            default:
                console.log('ℹ️ Unhandled webhook event:', event.type);
                break;
        }

        return c.json({ success: true });

    } catch (error) {
        console.error('Webhook error:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.constructor.name : 'Unknown'
        });

        // Handle Polar webhook verification errors
        if (error instanceof WebhookVerificationError) {
            return c.json({ error: 'Invalid webhook signature' }, 401);
        }

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
    console.log('🔄 Updating user:', user.id);
    console.log('  polarCustomerId:', customerId);
    console.log('  polarSubscriptionId:', subscriptionId);
    console.log('  subscriptionStatus:', subscriptionStatus);

    const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
            polarCustomerId: customerId,
            polarSubscriptionId: subscriptionId,
            subscriptionStatus: subscriptionStatus
        }
    });

    console.log('✅ User updated successfully');
    console.log('  Updated subscriptionStatus:', updated.subscriptionStatus);
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

/**
 * Handle customer state changed (e.g., email updated, billing info changed)
 */
async function handleCustomerUpdate(data: any) {
    const customerId = data.id;
    const email = data.email;
    const externalId = data.externalId;

    // Try to find user by external ID first
    let user = null;

    if (externalId) {
        user = await prisma.user.findUnique({
            where: { id: externalId }
        });
    }

    // Fall back to finding by polarCustomerId
    if (!user && customerId) {
        user = await prisma.user.findUnique({
            where: { polarCustomerId: customerId }
        });
    }

    // Try finding by customer email as last resort
    if (!user && email) {
        user = await prisma.user.findUnique({
            where: { email: email }
        });
    }

    if (!user) {
        console.error('✗ User not found for customer update:', {
            customerId,
            externalId,
            email
        });
        return;
    }

    // Update customer email if changed
    if (email && user.email !== email) {
        console.log('🔄 Updating user email:', user.id, '->', email);
        await prisma.user.update({
            where: { id: user.id },
            data: { email: email }
        });
    } else {
        console.log('ℹ️ Customer data unchanged:', user.id);
    }
}

/**
 * Handle customer deleted (remove customer reference from user)
 */
async function handleCustomerDeleted(data: any) {
    const customerId = data.id;
    const email = data.email;
    const externalId = data.externalId;

    // Try to find user by external ID first
    let user = null;

    if (externalId) {
        user = await prisma.user.findUnique({
            where: { id: externalId }
        });
    }

    // Fall back to finding by polarCustomerId
    if (!user && customerId) {
        user = await prisma.user.findUnique({
            where: { polarCustomerId: customerId }
        });
    }

    // Try finding by customer email as last resort
    if (!user && email) {
        user = await prisma.user.findUnique({
            where: { email: email }
        });
    }

    if (!user) {
        console.error('✗ User not found for customer deletion:', {
            customerId,
            externalId,
            email
        });
        return;
    }

    // Clear Polar customer and subscription data
    console.log('🗑️ Clearing Polar customer data for user:', user.id);
    await prisma.user.update({
        where: { id: user.id },
        data: {
            polarCustomerId: null,
            polarSubscriptionId: null,
            subscriptionStatus: 'inactive'
        }
    });

    console.log('✅ Customer data cleared successfully');
}

export default webhooks;
