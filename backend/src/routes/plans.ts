import { Hono } from 'hono';
import { plansController } from '@/controllers/plans.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

const plans = new Hono();

// ============================================
// Session-based routes (authenticated)
// ============================================

// GET /api/plans/daily?date= - Get plan for specific date
plans.get('/daily', authMiddleware, (c) => plansController.getDaily(c));

// POST /api/plans/generate - Generate plan for a date
plans.post('/generate', authMiddleware, (c) => plansController.generate(c));

// PATCH /api/plans/:id/status - Update meal status (type and status in body)
plans.patch('/:id/status', authMiddleware, (c) => plansController.updateStatusFromBody(c));

// DELETE /api/plans/daily?date= - Delete plan by date
plans.delete('/daily', authMiddleware, (c) => plansController.deleteDaily(c));

// POST /api/plans/external-meal - Add external meal
plans.post('/external-meal', authMiddleware, (c) => plansController.addExternalMeal(c));

// POST /api/plans/:id/meals/:type/swap - Swap a meal
plans.post('/:id/meals/:type/swap', authMiddleware, (c) => plansController.swapMeal(c));

// DELETE /api/plans/:id/meals/:type - Remove a meal
plans.delete('/:id/meals/:type', authMiddleware, (c) => plansController.removeMeal(c));

// PATCH /api/plans/:id - Update plan
plans.patch('/:id', authMiddleware, (c) => plansController.update(c));

// ============================================
// Legacy routes (with userId in path)
// ============================================

// GET /api/plans/user/:userId - Get plans for a user
plans.get('/user/:userId', (c) => plansController.getByUser(c));

// GET /api/plans/user/:userId/date/:date - Get plan for specific date
plans.get('/user/:userId/date/:date', (c) => plansController.getByDate(c));

// GET /api/plans/:id - Get plan by ID
plans.get('/:id', (c) => plansController.getById(c));

// POST /api/plans - Create plan
plans.post('/', (c) => plansController.create(c));

// PATCH /api/plans/:id/meal/:meal/status - Update meal status
plans.patch('/:id/meal/:meal/status', (c) => plansController.updateMealStatus(c));

// POST /api/plans/:id/complete - Mark plan as completed
plans.post('/:id/complete', (c) => plansController.markCompleted(c));

// DELETE /api/plans/:id - Delete plan
plans.delete('/:id', (c) => plansController.delete(c));

export default plans;
