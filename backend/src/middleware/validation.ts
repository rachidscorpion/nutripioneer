import type { Context, Next } from 'hono';
import type { ZodSchema } from 'zod';

/**
 * Creates a validation middleware for request body
 */
export function validateBody<T>(schema: ZodSchema<T>) {
    return async (c: Context, next: Next) => {
        const body = await c.req.json();
        const result = schema.safeParse(body);

        if (!result.success) {
            return c.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: result.error.errors.map(e => ({
                        path: e.path.join('.'),
                        message: e.message,
                    })),
                },
                400
            );
        }

        c.set('validatedBody', result.data);
        await next();
    };
}

/**
 * Creates a validation middleware for query parameters
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
    return async (c: Context, next: Next) => {
        const query = c.req.query();
        const result = schema.safeParse(query);

        if (!result.success) {
            return c.json(
                {
                    success: false,
                    error: 'Invalid query parameters',
                    details: result.error.errors.map(e => ({
                        path: e.path.join('.'),
                        message: e.message,
                    })),
                },
                400
            );
        }

        c.set('validatedQuery', result.data);
        await next();
    };
}
