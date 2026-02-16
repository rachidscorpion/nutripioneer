import { Hono } from 'hono';
import { Polar } from '@polar-sh/sdk';
import { ApiError } from '@/types';
import { auth } from '@/lib/auth';

const checkoutRoutes = new Hono();

const polar = new Polar({
    accessToken: process.env.POLAR_ENV === 'production' ? process.env.POLAR_ACCESS_TOKEN! : process.env.POLAR_SANDBOX_ACCESS_TOKEN!,
    server: process.env.POLAR_ENV === 'production' ? 'production' : 'sandbox',
});


checkoutRoutes.post('/polar/checkout', async (c) => {
    try {
        const body = await c.req.json();
        const { products, successUrl } = body;

        if (!products) {
            throw new ApiError(400, 'Product ID is required');
        }

        const session = await auth.api.getSession({ headers: c.req.header() });

        const checkoutData: {
            products: string[];
            successUrl: string;
            externalCustomerId?: string;
            customerEmail?: string;
            customerName?: string;
            metadata?: Record<string, string>;
        } = {
            products: [products],
            successUrl: successUrl || `${process.env.BETTER_AUTH_URL}/home?success=true`,
        };

        if (session?.user) {
            checkoutData.externalCustomerId = session.user.id;
            checkoutData.customerEmail = session.user.email;
            checkoutData.customerName = session.user.name;
            checkoutData.metadata = {
                userId: session.user.id,
            };
        }

        const result = await polar.checkouts.create(checkoutData);

        return c.json({
            url: result.url,
            checkoutId: result.id,
        });
    } catch (error) {
        console.error('Checkout error:', error);
        throw new ApiError(500, error instanceof Error ? error.message : 'Failed to create checkout');
    }
});

checkoutRoutes.get('/polar/subscription-status', async (c) => {
    try {
        const session = await auth.api.getSession({ headers: c.req.header() });

        if (!session?.user) {
            throw new ApiError(401, 'Unauthorized');
        }

        const user = session.user;
        const prisma = (await import('@/db/client')).default;

        if (!user.polarCustomerId) {
            return c.json({
                subscriptionStatus: user.subscriptionStatus || 'inactive',
                message: 'No Polar customer found'
            });
        }

        const subscriptions = await polar.subscriptions.list({
            customerId: user.polarCustomerId,
            isActive: true,
        });

        if (subscriptions.rows && subscriptions.rows.length > 0) {
            const subscription = subscriptions.rows[0];
            const isActive = subscription.status === 'active' || subscription.status === 'trialing';
            
            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: {
                    polarSubscriptionId: subscription.id,
                    subscriptionStatus: isActive ? 'active' : 'inactive',
                }
            });

            return c.json({
                subscriptionStatus: updatedUser.subscriptionStatus,
                message: 'Subscription status updated'
            });
        }

        return c.json({
            subscriptionStatus: user.subscriptionStatus || 'inactive',
            message: 'No active subscriptions found'
        });
    } catch (error) {
        console.error('Subscription status error:', error);
        throw new ApiError(500, error instanceof Error ? error.message : 'Failed to check subscription status');
    }
});

export default checkoutRoutes;
