import type { Context } from 'hono';
import { plansService } from '@/services/plans.service';
import { createPlanSchema, updatePlanSchema } from '@/schemas';

export class PlansController {
    async getByUser(c: Context) {
        const userId = c.req.param('userId');
        const query = c.req.query();

        const options: { startDate?: Date; endDate?: Date } = {};
        if (query.startDate) options.startDate = new Date(query.startDate);
        if (query.endDate) options.endDate = new Date(query.endDate);

        const plans = await plansService.getByUser(userId, options);

        return c.json({
            success: true,
            data: plans,
        });
    }

    async getById(c: Context) {
        const id = c.req.param('id');
        const plan = await plansService.getById(id);

        return c.json({
            success: true,
            data: plan,
        });
    }

    async getByDate(c: Context) {
        const userId = c.req.param('userId');
        const dateStr = c.req.param('date');
        const date = new Date(dateStr);

        const plan = await plansService.getByUserAndDate(userId, date);

        return c.json({
            success: true,
            data: plan,
        });
    }

    async create(c: Context) {
        const body = await c.req.json();
        const data = createPlanSchema.parse(body);

        const plan = await plansService.create(data);

        return c.json({
            success: true,
            data: plan,
        }, 201);
    }

    async update(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const data = updatePlanSchema.parse(body);

        const plan = await plansService.update(id, data);

        return c.json({
            success: true,
            data: plan,
        });
    }

    async delete(c: Context) {
        const id = c.req.param('id');
        await plansService.delete(id);

        return c.json({
            success: true,
            message: 'Plan deleted successfully',
        });
    }

    async updateMealStatus(c: Context) {
        const id = c.req.param('id');
        const meal = c.req.param('meal') as 'breakfast' | 'lunch' | 'dinner';
        const { status } = await c.req.json();

        const plan = await plansService.updateMealStatus(id, meal, status);

        return c.json({
            success: true,
            data: plan,
        });
    }

    async markCompleted(c: Context) {
        const id = c.req.param('id');
        const plan = await plansService.markCompleted(id);

        return c.json({
            success: true,
            data: plan,
        });
    }

    // ============================================
    // Session-based endpoints
    // ============================================

    /**
     * GET /plans/daily?date= - Get daily plan by date
     */
    async getDaily(c: Context) {
        const userId = c.get('userId');
        const dateStr = c.req.query('date');

        if (!dateStr) {
            return c.json({
                success: false,
                error: 'Date query parameter is required',
            }, 400);
        }

        const date = new Date(dateStr);
        const plan = await plansService.getByUserAndDate(userId, date);

        return c.json({
            success: true,
            data: plan,
        });
    }

    /**
     * POST /plans/generate - Generate plan for a date
     */
    async generate(c: Context) {
        const userId = c.get('userId');
        const { date } = await c.req.json();

        const plan = await plansService.generatePlan(userId, new Date(date));

        return c.json({
            success: true,
            data: plan,
        }, 201);
    }

    /**
     * PATCH /plans/:id/status - Update meal status (type and status in body)
     */
    async updateStatusFromBody(c: Context) {
        const id = c.req.param('id');
        const { type, status } = await c.req.json();

        const meal = type as 'breakfast' | 'lunch' | 'dinner';
        const plan = await plansService.updateMealStatus(id, meal, status);

        return c.json({
            success: true,
            data: plan,
        });
    }

    /**
     * DELETE /plans/daily?date= - Delete plan by date
     */
    async deleteDaily(c: Context) {
        const userId = c.get('userId');
        const dateStr = c.req.query('date');

        if (!dateStr) {
            return c.json({
                success: false,
                error: 'Date query parameter is required',
            }, 400);
        }

        await plansService.deleteByDate(userId, new Date(dateStr));

        return c.json({
            success: true,
            message: 'Plan deleted successfully',
        });
    }

    /**
     * POST /plans/external-meal - Add external/restaurant meal
     */
    async addExternalMeal(c: Context) {
        const userId = c.get('userId');
        const body = await c.req.json();

        const plan = await plansService.addExternalMeal(userId, body);

        return c.json({
            success: true,
            data: plan,
        });
    }

    /**
     * POST /plans/:id/meals/:type/swap - Swap a meal
     */
    async swapMeal(c: Context) {
        const planId = c.req.param('id');
        const mealType = c.req.param('type') as 'breakfast' | 'lunch' | 'dinner';

        const plan = await plansService.swapMeal(planId, mealType);

        return c.json({
            success: true,
            data: plan,
        });
    }

    /**
     * DELETE /plans/:id/meals/:type - Remove a meal
     */
    async removeMeal(c: Context) {
        const planId = c.req.param('id');
        const mealType = c.req.param('type') as 'breakfast' | 'lunch' | 'dinner';

        const plan = await plansService.removeMeal(planId, mealType);

        return c.json({
            success: true,
            data: plan,
        });
    }
}

export const plansController = new PlansController();

