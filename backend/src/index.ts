import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { errorHandler } from '@/middleware/errorHandler';
import api from '@/routes';
import authRoutes from '@/routes/auth';
import menuRoutes from '@/routes/menu';
import checkoutRoutes from '@/routes/checkout';

const app = new Hono();

// Global middleware
app.use('*', logger());

// Dynamic CORS configuration based on environment
const corsOrigins = (() => {
    const origins = [];

    // Always allow localhost in development
    if (process.env.NODE_ENV !== 'production') {
        origins.push(
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001'
        );
    }

    // Add production URLs from environment
    const frontendUrl = process.env.BETTER_AUTH_URL || process.env.FRONTEND_URL;
    if (frontendUrl) {
        try {
            const url = new URL(frontendUrl);
            origins.push(frontendUrl);

            // Add www and protocol variants
            const hostname = url.hostname;
            if (!hostname.startsWith('www.')) {
                origins.push(`https://www.${hostname}`, `http://www.${hostname}`);
            } else {
                origins.push(`https://${hostname.replace('www.', '')}`, `http://${hostname.replace('www.', '')}`);
            }
        } catch (e) {
            console.warn('Invalid frontend URL in CORS config:', frontendUrl);
        }
    }

    return origins;
})();

app.use('*', cors({
    origin: corsOrigins,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposeHeaders: ['Set-Cookie'],
}));

// Log CORS configuration in development
if (process.env.NODE_ENV === 'development') {
    console.log('🔧 CORS Configuration:', {
        NODE_ENV: process.env.NODE_ENV,
        corsOrigins
    });
}

app.use('*', errorHandler);

// Health check endpoint
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Mount checkout routes before auth routes (so specific routes are matched first)
app.route('/api/auth', checkoutRoutes);
// Mount auth routes (not under /api for Better Auth compatibility)
app.route('/api/auth', authRoutes);

// Mount API routes
app.route('/api', api);

// Mount menu routes
app.route('/api/menu', menuRoutes);

// 404 fallback
app.notFound((c) => {
    return c.json({
        success: false,
        error: 'Not Found',
        message: `Route ${c.req.method} ${c.req.path} not found`,
    }, 404);
});

// Export for the entry point
export default app;
