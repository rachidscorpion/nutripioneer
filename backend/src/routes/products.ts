import { Hono } from 'hono';
import { Polar } from '@polar-sh/sdk';

const products = new Hono();

// Initialize Polar SDK
const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    server: process.env.POLAR_ENV === 'production' ? 'production' : 'sandbox',
});

/**
 * GET /products
 * List all available subscription products from Polar
 */
products.get('/', async (c) => {
    try {
        const organizationId = process.env.POLAR_ORGANIZATION_ID;

        if (!organizationId) {
            return c.json({
                success: false,
                error: 'Organization ID not configured',
            }, 500);
        }

        const result = await polar.products.list({
            organizationId,
            isRecurring: true, // Only get subscription products
        });

        return c.json({
            success: true,
            data: result.result.items.map(product => ({
                id: product.id,
                name: product.name,
                description: product.description,
                isRecurring: product.isRecurring,
                prices: product.prices.map(price => ({
                    id: price.id,
                    type: price.type,
                    recurringInterval: price.recurringInterval,
                    priceAmount: (price as Record<string, unknown>).priceAmount ?? null,
                    priceCurrency: (price as Record<string, unknown>).priceCurrency ?? null,
                })),
                benefits: product.benefits.map(benefit => ({
                    id: benefit.id,
                    description: benefit.description,
                    type: benefit.type,
                })),
            })),
        });
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return c.json({
            success: false,
            error: 'Failed to fetch products',
            message: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});

/**
 * GET /products/:id
 * Get a specific product by ID
 */
products.get('/:id', async (c) => {
    try {
        const productId = c.req.param('id');

        const product = await polar.products.get({
            id: productId,
        });

        return c.json({
            success: true,
            data: {
                id: product.id,
                name: product.name,
                description: product.description,
                isRecurring: product.isRecurring,
                prices: product.prices.map(price => ({
                    id: price.id,
                    type: price.type,
                    recurringInterval: price.recurringInterval,
                    priceAmount: (price as Record<string, unknown>).priceAmount ?? null,
                    priceCurrency: (price as Record<string, unknown>).priceCurrency ?? null,
                })),
                benefits: product.benefits.map(benefit => ({
                    id: benefit.id,
                    description: benefit.description,
                    type: benefit.type,
                })),
            },
        });
    } catch (error) {
        console.error('Failed to fetch product:', error);
        return c.json({
            success: false,
            error: 'Failed to fetch product',
            message: error instanceof Error ? error.message : 'Unknown error',
        }, 404);
    }
});

export default products;
