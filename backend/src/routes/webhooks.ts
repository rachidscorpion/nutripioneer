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

        return c.json({
            success: true,
            message: 'Webhook endpoint is working!',
            received: body
        });
    } catch (error) {

        return c.json({ error: 'Test webhook failed' }, 500);
    }
});

/**
 * Polar webhook endpoint
 * Handles all Polar webhook events to update user subscription status and data
 *
 * Subscription Events:
 * - subscription.created: New subscription created
 * - subscription.updated: Subscription updated (any status change)
 * - subscription.active: Subscription activated (after successful payment)
 * - subscription.past_due: Subscription payment past due
 * - subscription.uncanceled: Subscription cancellation undone
 * - subscription.canceled: Subscription canceled
 * - subscription.revoked: Subscription revoked
 *
 * Order Events:
 * - order.created: New order created
 * - order.updated: Order updated
 * - order.paid: Order paid successfully
 * - order.refunded: Order refunded
 *
 * Checkout Events:
 * - checkout.created: Checkout session created
 * - checkout.updated: Checkout updated
 * - checkout.completed: Checkout completed
 *
 * Customer Events:
 * - customer.created: Customer created
 * - customer.updated: Customer updated
 * - customer.deleted: Customer deleted
 * - customer.state_changed: Customer state changed
 *
 * Refund Events:
 * - refund.created: Refund created
 * - refund.updated: Refund updated
 *
 * Benefit Grant Events:
 * - benefit_grant.created: Benefit granted
 * - benefit_grant.updated: Benefit grant updated
 * - benefit_grant.cycled: Benefit grant cycled
 * - benefit_grant.revoked: Benefit grant revoked
 *
 * Customer Seat Events:
 * - customer_seat.assigned: Seat assigned
 * - customer_seat.claimed: Seat claimed
 * - customer_seat.revoked: Seat revoked
 *
 * Informational Events:
 * - benefit.created: Benefit created
 * - benefit.updated: Benefit updated
 * - product.created: Product created
 * - product.updated: Product updated
 * - organization.updated: Organization updated
 */
webhooks.post('/polar', async (c) => {
    try {
        // Get raw body for signature verification
        const rawBody = await c.req.text();

        if (!rawBody) {

            return c.json({ error: 'Empty request body' }, 400);
        }


        // Determine which webhook secret to use based on environment
        // Check multiple possible environment variable names
        const polarEnv = process.env.POLAR_ENV || process.env.NEXT_PUBLIC_POLAR_ENV || 'development';
        const webhookSecret = polarEnv === 'production'
            ? process.env.POLAR_WEBHOOK_SECRET!
            : process.env.POLAR_SANDBOX_WEBHOOK_SECRET!;


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

        let event;
        try {
            event = validateEvent(rawBody, headers, webhookSecret);
        } catch (error) {
            // Polar SDK doesn't support all event types (e.g., member.*)
            // For unsupported events, return 200 OK to stop retries
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('Unknown event type') && parsedEventType) {

                // Return 200 OK so Polar stops retrying
                return c.json({ success: true, unsupportedEvent: parsedEventType });
            }
            throw error; // Re-throw other errors
        }

        console.log(event.type);
        if ((event.type === 'subscription.canceled' || event.type === 'subscription.revoked' || event.type === 'customer.state_changed') && (event.data as any).customerCancellationReason) {
            console.log('Cancellation reason:', (event.data as any).customerCancellationReason);
        }

        // Handle different event types
        switch (event.type) {
            case 'subscription.created':
            case 'subscription.updated':
            case 'subscription.active':
            // case 'subscription.past_due': // Not supported in SDK
            case 'subscription.uncanceled':
                await handleSubscriptionUpdate(event.data);
                break;

            case 'subscription.canceled':
            case 'subscription.revoked':
                await handleSubscriptionCanceled(event.data);
                break;

            case 'order.created':
                // Order created - may contain subscription data
                if (event.data.subscription) {
                    await handleSubscriptionUpdate(event.data.subscription);
                }
                break;

            case 'order.updated':
                // Order updated - check if paid or refunded
                if (event.data.subscription) {
                    await handleSubscriptionUpdate(event.data.subscription);
                }
                if (event.data.status === 'paid') {
                    await handleOrderPaid(event.data);
                }
                if (event.data.status === 'refunded') {
                    await handleOrderRefunded(event.data);
                }
                break;

            case 'order.paid':
                await handleOrderPaid(event.data);
                if (event.data.subscription) {
                    await handleSubscriptionUpdate(event.data.subscription);
                }
                break;

            case 'order.refunded':
                await handleOrderRefunded(event.data);
                break;

            case 'checkout.created':
            // case 'checkout.completed': // Not supported in SDK
            case 'checkout.updated':
                // Checkout events - may contain customer/subscription data
                // Note: The current Checkout type definition does not include 'subscription' or 'customer' objects
                // We rely on subscription.* and order.* events to handle these updates
                /*
                if (event.data.subscription) {
                    await handleSubscriptionUpdate(event.data.subscription);
                }
                if (event.data.customer) {
                    await handleCustomerUpdate(event.data.customer);
                }
                */
                break;

            case 'customer.created':
            case 'customer.state_changed':
            case 'customer.updated':
                await handleCustomerUpdate(event.data);
                break;

            case 'customer.deleted':
                await handleCustomerDeleted(event.data);
                break;

            case 'refund.created':
            case 'refund.updated':
                await handleRefund(event.data);
                break;

            case 'benefit_grant.created':
            case 'benefit_grant.updated':
            case 'benefit_grant.cycled':
            case 'benefit_grant.revoked':
                await handleBenefitGrant(event.type, event.data);
                break;

            case 'customer_seat.assigned':
            case 'customer_seat.claimed':
            case 'customer_seat.revoked':
                await handleCustomerSeat(event.type, event.data);
                break;

            case 'benefit.created':
            case 'benefit.updated':
            case 'product.created':
            case 'product.updated':
            case 'organization.updated':
                // Informational events - log for tracking

                break;

            // case 'member.created':
            // case 'member.updated':
            // case 'member.deleted':
            // Member events - not currently used for subscription updates
            // handleMemberDeleted(event.data);

            // break;

            default:

                break;
        }

        return c.json({ success: true });

    } catch (error) {



        // Handle Polar webhook verification errors
        if (error instanceof WebhookVerificationError) {
            return c.json({ error: 'Invalid webhook signature' }, 401);
        }

        return c.json({ error: 'Webhook processing failed' }, 500);
    }
});

/**
 * Handle subscription update (active, trialing, past_due, etc.)
 * Implements idempotency to prevent status downgrades
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

        return;
    }

    // Determine if subscription should be considered active
    // Active statuses: active, trialing, past_due (still has access until period ends)
    const isActive = status === 'active' || status === 'trialing' || status === 'past_due';

    // Determine subscription status for our database
    let newSubscriptionStatus = 'inactive';
    if (isActive) {
        newSubscriptionStatus = 'active';
    } else if (status === 'canceled' || status === 'revoked' || status === 'ended') {
        newSubscriptionStatus = 'canceled';
    }

    // IDEMPOTENCY CHECK: Prevent status downgrades and race conditions
    const currentStatus = user.subscriptionStatus;

    // Check if subscription is set to cancel at period end (still active until period ends)
    const cancelsAtPeriodEnd = data.cancel_at_period_end === true;

    // Status hierarchy: 'active' > 'canceled' (only if not currently active) > 'inactive'/'null'
    // IMPORTANT: 'active' always wins over 'canceled' to prevent webhook race conditions
    // This handles cases where 'subscription.canceled' arrives after 'subscription.active'
    const shouldUpdateStatus =
        // Always update to 'active' - highest priority to ensure instant activation after payment
        newSubscriptionStatus === 'active' && currentStatus !== 'active' ||
        // Only update to 'canceled' if:
        // - Not currently 'active' (prevents race conditions)
        // - OR explicitly canceling at period end and not currently 'active'
        (newSubscriptionStatus === 'canceled' && currentStatus !== 'active' && !cancelsAtPeriodEnd) ||
        // Update to 'inactive' only if current is also 'inactive' or 'null'
        (newSubscriptionStatus === 'inactive' && (currentStatus === 'inactive' || currentStatus === null));



    // Always update polarCustomerId and polarSubscriptionId (they may have changed)
    const updateData: any = {
        polarCustomerId: customerId,
        polarSubscriptionId: subscriptionId
    };

    // Only update subscriptionStatus if idempotency check passes
    if (shouldUpdateStatus) {
        updateData.subscriptionStatus = newSubscriptionStatus;
    }

    // Update user with all subscription fields


    const updated = await prisma.user.update({
        where: { id: user.id },
        data: updateData
    });


}

/**
 * Handle canceled/revoked subscription
 * Only sets to 'canceled' if Polar status is actually canceled/revoked/ended
 * If subscription is still 'active' in Polar, keeps it 'active' (handles cancel_at_period_end)
 */
async function handleSubscriptionCanceled(data: any) {
    const customerId = data.customer_id;
    const subscriptionId = data.id;
    const status = data.status; // Check Polar's actual status
    const cancelsAtPeriodEnd = data.cancel_at_period_end === true;

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

        return;
    }

    // Determine what status to set based on Polar's actual status
    // If Polar says 'active', 'trialing', or 'past_due', keep it 'active'
    // Only set to 'canceled' if Polar's status is actually 'canceled', 'revoked', or 'ended'
    const isActiveInPolar = status === 'active' || status === 'trialing' || status === 'past_due';
    const isActuallyCanceled = status === 'canceled' || status === 'revoked' || status === 'ended';

    let newStatus = user.subscriptionStatus; // Keep current by default

    if (isActiveInPolar) {
        newStatus = 'active';
    } else if (isActuallyCanceled) {
        newStatus = 'canceled';
    }

    // Log what we're doing
    if (newStatus !== user.subscriptionStatus) {

        await prisma.user.update({
            where: { id: user.id },
            data: {
                subscriptionStatus: newStatus
            }
        });
    }
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

        return;
    }

    // Update customer email if changed
    if (email && user.email !== email) {

        await prisma.user.update({
            where: { id: user.id },
            data: { email: email }
        });
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

        return;
    }

    // Clear Polar customer and subscription data

    await prisma.user.update({
        where: { id: user.id },
        data: {
            polarCustomerId: null,
            polarSubscriptionId: null,
            subscriptionStatus: 'inactive'
        }
    });


}

/**
 * Handle order paid event
 */
async function handleOrderPaid(data: any) {
    const orderId = data.id;
    const customerId = data.customer_id;
    const subscriptionId = data.subscription_id;
    const amount = data.amount;
    const currency = data.currency;



    // If order has subscription, ensure user has latest subscription data
    if (data.subscription) {
        await handleSubscriptionUpdate(data.subscription);
    }

    // Optionally track order in your database
    // Could store order history, invoices, etc.
}

/**
 * Handle order refunded event
 */
async function handleOrderRefunded(data: any) {
    const orderId = data.id;
    const customerId = data.customer_id;
    const subscriptionId = data.subscription_id;
    const amount = data.amount;
    const currency = data.currency;



    // If order has subscription, check if refund affects subscription status
    if (data.subscription) {
        const subscription = data.subscription;
        // If subscription is canceled/revoked due to refund, update accordingly
        if (subscription.status === 'canceled' || subscription.status === 'revoked') {
            await handleSubscriptionCanceled(subscription);
        } else {
            await handleSubscriptionUpdate(subscription);
        }
    }

    // Optionally track refunds in your database
}

/**
 * Handle refund events (created/updated)
 */
async function handleRefund(data: any) {
    const refundId = data.id;
    const orderId = data.order_id;
    const amount = data.amount;
    const currency = data.currency;
    const status = data.status;



    // Find user by customer
    let user = null;
    const customerId = data.customer_id;

    if (data.customer?.externalId) {
        user = await prisma.user.findUnique({
            where: { id: data.customer.externalId }
        });
    }

    if (!user && customerId) {
        user = await prisma.user.findUnique({
            where: { polarCustomerId: customerId }
        });
    }

    if (!user && data.customer?.email) {
        user = await prisma.user.findUnique({
            where: { email: data.customer.email }
        });
    }

    if (user) {

        // Optionally track refund on user record
        // Could store total refunded amount, refund count, etc.
    } else {

    }
}

/**
 * Handle benefit grant events
 */
async function handleBenefitGrant(eventType: string, data: any) {
    const grantId = data.id;
    const benefitId = data.benefit_id;
    const customerId = data.customer_id;
    const userId = data.user_id;



    // Find user associated with this benefit grant
    let user = null;

    if (data.customer?.externalId) {
        user = await prisma.user.findUnique({
            where: { id: data.customer.externalId }
        });
    }

    if (!user && customerId) {
        user = await prisma.user.findUnique({
            where: { polarCustomerId: customerId }
        });
    }

    if (!user && data.customer?.email) {
        user = await prisma.user.findUnique({
            where: { email: data.customer.email }
        });
    }

    if (!user) {
        return;
    }

    // Log benefit grant activity
    const isRevoked = eventType === 'benefit_grant.revoked';
    const isCycled = eventType === 'benefit_grant.cycled';



    // Optionally track benefits in your database
    // Could create a UserBenefits table to track:
    // - Which benefits each user has
    // - When they were granted/revoked
    // - Benefit metadata for access control
}

/**
 * Handle customer seat events
 */
async function handleCustomerSeat(eventType: string, data: any) {
    const seatId = data.id;
    const customerId = data.customer_id;
    const subscriptionId = data.subscription_id;
    const userId = data.user_id;
    const email = data.email;



    // Find user associated with this seat
    let user = null;

    // Try by external ID first
    if (data.customer?.externalId) {
        user = await prisma.user.findUnique({
            where: { id: data.customer.externalId }
        });
    }

    // Try by customer ID
    if (!user && customerId) {
        user = await prisma.user.findUnique({
            where: { polarCustomerId: customerId }
        });
    }

    // Try by email
    if (!user && email) {
        user = await prisma.user.findUnique({
            where: { email: email }
        });
    }

    if (!user) {
        return;
    }

    // Log seat activity
    const isAssigned = eventType === 'customer_seat.assigned';
    const isClaimed = eventType === 'customer_seat.claimed';
    const isRevoked = eventType === 'customer_seat.revoked';



    // Optionally track seats in your database
    // Could create a UserSeats table to track:
    // - Which seats each user has
    // - Seat assignment status
    // - Seat metadata for team management
}

/**
 * Handle member deleted event
 * Clears Polar data when member is deleted
 */
async function handleMemberDeleted(data: any) {
    const userId = data.user_id;
    const email = data.email;



    // Find user associated with this member
    let user = null;

    // Try by external ID first
    if (data.customer?.externalId) {
        user = await prisma.user.findUnique({
            where: { id: data.customer.externalId }
        });
    }

    // Try by customer ID
    if (!user && data.customer_id) {
        user = await prisma.user.findUnique({
            where: { polarCustomerId: data.customer_id }
        });
    }

    // Try by email
    if (!user && email) {
        user = await prisma.user.findUnique({
            where: { email: email }
        });
    }

    if (!user) {
        return;
    }

    // Clear all Polar data for this user

    await prisma.user.update({
        where: { id: user.id },
        data: {
            polarCustomerId: null,
            polarSubscriptionId: null,
            subscriptionStatus: 'inactive'
        }
    });


}

export default webhooks;
