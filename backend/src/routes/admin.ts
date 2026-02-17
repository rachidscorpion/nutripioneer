import { Hono } from 'hono';
import { signAdminToken } from '@/lib/admin-auth';
import { adminMiddleware } from '@/middleware/admin.middleware';
import { adminService } from '@/services/admin.service';
import { adminDbService } from '@/services/admin-db.service';

const admin = new Hono();

// ============================================
// Public: Admin Login
// ============================================

admin.post('/login', async (c) => {
    const { email, password } = await c.req.json();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        return c.json({
            success: false,
            error: 'Admin credentials not configured on server',
        }, 500);
    }

    if (email !== adminEmail || password !== adminPassword) {
        return c.json({
            success: false,
            error: 'Invalid credentials',
        }, 401);
    }

    const token = signAdminToken(email);

    return c.json({
        success: true,
        data: { token, email },
    });
});

// ============================================
// Protected: All routes below require admin JWT
// ============================================

admin.use('/*', adminMiddleware);

// ============================================
// Analytics Endpoints
// ============================================

admin.get('/analytics/overview', async (c) => {
    const data = await adminService.getOverview();
    return c.json({ success: true, data });
});

admin.get('/analytics/signups', async (c) => {
    const days = parseInt(c.req.query('days') || '30', 10);
    const data = await adminService.getSignups(days);
    return c.json({ success: true, data });
});

admin.get('/analytics/conditions', async (c) => {
    const data = await adminService.getConditionDistribution();
    return c.json({ success: true, data });
});

admin.get('/analytics/meals', async (c) => {
    const data = await adminService.getMealCompletionRates();
    return c.json({ success: true, data });
});

admin.get('/analytics/recipes', async (c) => {
    const limit = parseInt(c.req.query('limit') || '10', 10);
    const data = await adminService.getPopularRecipes(limit);
    return c.json({ success: true, data });
});

admin.get('/analytics/subscriptions', async (c) => {
    const data = await adminService.getSubscriptionStats();
    return c.json({ success: true, data });
});

admin.get('/analytics/onboarding', async (c) => {
    const data = await adminService.getOnboardingFunnel();
    return c.json({ success: true, data });
});

admin.get('/analytics/feedback', async (c) => {
    const data = await adminService.getFeedbackOverview();
    return c.json({ success: true, data });
});

admin.get('/analytics/metrics', async (c) => {
    const days = parseInt(c.req.query('days') || '30', 10);
    const data = await adminService.getMetricTrends(days);
    return c.json({ success: true, data });
});

// ============================================
// Database Management Endpoints
// ============================================

admin.get('/db/models', async (c) => {
    const models = adminDbService.getAvailableModels();
    return c.json({ success: true, data: models });
});

admin.get('/db/:model', async (c) => {
    const model = c.req.param('model');
    const query = c.req.query();

    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '25', 10);
    const sort = query.sort || 'id';
    const order = (query.order === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';
    const search = query.search || undefined;

    const result = await adminDbService.list(model, page, limit, sort, order, search);
    return c.json({ success: true, ...result });
});

admin.get('/db/:model/:id', async (c) => {
    const model = c.req.param('model');
    const id = c.req.param('id');

    const data = await adminDbService.getById(model, id);
    return c.json({ success: true, data });
});

admin.patch('/db/:model/:id', async (c) => {
    const model = c.req.param('model');
    const id = c.req.param('id');
    const body = await c.req.json();

    const data = await adminDbService.update(model, id, body);
    return c.json({ success: true, data });
});

admin.delete('/db/:model/:id', async (c) => {
    const model = c.req.param('model');
    const id = c.req.param('id');

    const result = await adminDbService.deleteRecord(model, id);
    return c.json({ success: true, ...result });
});

admin.post('/db/query', async (c) => {
    const { sql, allowWrite } = await c.req.json();

    if (!sql || typeof sql !== 'string') {
        return c.json({ success: false, error: 'SQL query is required' }, 400);
    }

    const result = await adminDbService.executeQuery(sql, allowWrite === true);
    return c.json({ success: true, data: result });
});

export default admin;
