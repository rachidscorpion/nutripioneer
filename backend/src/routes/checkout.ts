import { Hono } from 'hono';
import { Polar } from '@polar-sh/sdk';
import { ApiError } from '@/types';
import { auth } from '@/lib/auth';

const checkoutRoutes = new Hono();

const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
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
            customerEmail?: string;
            customerName?: string;
            metadata?: Record<string, string>;
        } = {
            products: [products],
            successUrl: successUrl || `${process.env.BETTER_AUTH_URL}/home?success=true`,
        };

        if (session?.user) {
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

export default checkoutRoutes;
