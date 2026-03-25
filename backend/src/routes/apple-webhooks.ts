import { Hono } from 'hono';
import prisma from '@/db/client';

const appleWebhooks = new Hono();

/**
 * Apple App Store Server-to-Server Webhook
 * Handles subscription cancellations, refunds, and renewals
 * 
 * NOTE: In a production environment, you MUST verify the JWS signature.
 * Apple sends a signed payload (JWS). For now, we are implementing the logic
 * to handle the notification types.
 */
appleWebhooks.post('/', async (c) => {
    console.log('[Apple Webhook] Received request at', new Date().toISOString());
    try {
        const body = await c.req.json();
        console.log('[Apple Webhook] Body Keys:', Object.keys(body));

        // Apple App Store notifications (v2) are sent as a JWS (JSON Web Signature)
        // inside a field called 'signedPayload'.
        const signedPayload = body.signedPayload;

        if (signedPayload) {
            console.log('[Apple Webhook] Processing signedPayload');
            // In dev/mocking, if we are sending manual JSON without JWS signature,
            // we check if the signedPayload is actually just a JSON string or if we need to decode.
            try {
                // Try to treat it as a JWS (parts separated by dots)
                const parts = signedPayload.split('.');
                if (parts.length === 3) {
                    // This is likely real JWS from Apple
                    const payloadBase64 = parts[1];
                    const decodedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
                    console.log('[Apple Webhook] Decoded JWS Type:', decodedPayload.notificationType);
                    await processNotification(decodedPayload);
                } else {
                    // Fallback: Check if it's already an object or raw JSON
                    await processNotification(body);
                }
            } catch (e) {
                console.error('[Apple Webhook] JWS Decode Failed:', e);
                // Last ditch effort: process the raw body
                await processNotification(body);
            }
        } else {
            console.log('[Apple Webhook] No signedPayload found, processing body directly');
            await processNotification(body);
        }

        return c.json({ success: true });
    } catch (error) {
        console.error('[Apple Webhook] Error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

async function processNotification(payload: any) {
    const { notificationType, data, notificationUUID } = payload;
    console.log(`[Apple Webhook] Type: ${notificationType}, UUID: ${notificationUUID}`);

    if (!data) {
        console.warn('[Apple Webhook] No data field in payload');
        return;
    }

    // data.signedTransactionInfo is ALSO a JWS string in production
    let transactionInfo = data;
    if (typeof data.signedTransactionInfo === 'string') {
        try {
            const parts = data.signedTransactionInfo.split('.');
            transactionInfo = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            console.log('[Apple Webhook] Decoded transactionInfo for:', transactionInfo.originalTransactionId);
        } catch (e) {
            console.error('[Apple Webhook] Failed to decode transactionInfo JWS');
        }
    } else if (data.signedTransactionInfo) {
        transactionInfo = data.signedTransactionInfo;
    }

    const transactionId = transactionInfo.originalTransactionId || transactionInfo.transactionId;
    if (!transactionId) {
        console.warn('[Apple Webhook] Could not determine transactionId');
        return;
    }

    switch (notificationType) {
        case 'EXPIRED':
        case 'DID_FAIL_TO_RENEW':
        case 'REFUND':
        case 'REVOKE':
            console.log(`[Apple Webhook] Deactivating user for transaction: ${transactionId}`);
            await updateSubscriptionStatus(transactionId, 'inactive');
            break;

        case 'DID_RENEW':
        case 'SUBSCRIBED':
            console.log(`[Apple Webhook] Activating user for transaction: ${transactionId}`);
            await updateSubscriptionStatus(transactionId, 'active');
            break;

        case 'GRACE_PERIOD_EXPIRED':
            await updateSubscriptionStatus(transactionId, 'inactive');
            break;
            
        default:
            console.log(`[Apple Webhook] Ignored notification type: ${notificationType}`);
    }
}

async function updateSubscriptionStatus(transactionId: string, status: string) {
    // Find the user who has this transaction stored in their polarSubscriptionId
    // (Since we used `ios_${productId}_${timestamp}` earlier, we should ideally use originalTransactionId)

    // In our mobile code, we currently send a generic placeholder or the receipt.
    // For a robust system, we should store the 'originalTransactionId' in the User model.
    // For now, let's search for any user where polarSubscriptionId contains the context of this transaction
    // Or simpler: match by the user who was granted access.

    // Recommendation: Update the backend validate-receipt route to store the actual originalTransactionId!

    const user = await prisma.user.findFirst({
        where: {
            polarSubscriptionId: {
                contains: transactionId
            }
        }
    });

    if (user) {
        await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: status }
        });
        console.log(`Updated user ${user.id} to ${status} based on Apple Notification`);
    }
}

export default appleWebhooks;
