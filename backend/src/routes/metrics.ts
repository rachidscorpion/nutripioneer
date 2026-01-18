import { Hono } from 'hono';
import { metricsController } from '@/controllers/metrics.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

const metrics = new Hono();

// ============================================
// Session-based routes (authenticated)
// ============================================

// POST /api/metrics - Log a metric
metrics.post('/', authMiddleware, (c) => metricsController.log(c));

// GET /api/metrics - Get metrics history
metrics.get('/', authMiddleware, (c) => metricsController.history(c));

// ============================================
// Legacy routes (with userId in path)
// ============================================

// GET /api/metrics/user/:userId - Get metrics for a user
metrics.get('/user/:userId', (c) => metricsController.getByUser(c));

// GET /api/metrics/user/:userId/latest - Get latest metric of each type
metrics.get('/user/:userId/latest', (c) => metricsController.getLatest(c));

// GET /api/metrics/user/:userId/stats/:type - Get stats for a metric type
metrics.get('/user/:userId/stats/:type', (c) => metricsController.getStats(c));

// GET /api/metrics/:id - Get metric by ID
metrics.get('/:id', (c) => metricsController.getById(c));

// DELETE /api/metrics/:id - Delete metric
metrics.delete('/:id', (c) => metricsController.delete(c));

export default metrics;
