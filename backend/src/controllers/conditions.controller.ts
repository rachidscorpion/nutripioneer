import type { Context } from 'hono';
import { conditionsService } from '@/services/conditions.service';
import { createConditionSchema } from '@/schemas';

export class ConditionsController {
    async getAll(c: Context) {
        const conditions = await conditionsService.getAll();

        return c.json({
            success: true,
            data: conditions,
        });
    }

    async getById(c: Context) {
        const id = c.req.param('id');
        const condition = await conditionsService.getById(id);

        return c.json({
            success: true,
            data: condition,
        });
    }

    async getBySlug(c: Context) {
        const slug = c.req.param('slug');
        const condition = await conditionsService.getBySlug(slug);

        return c.json({
            success: true,
            data: condition,
        });
    }

    async create(c: Context) {
        const body = await c.req.json();
        const data = createConditionSchema.parse(body);

        const condition = await conditionsService.create(data);

        return c.json({
            success: true,
            data: condition,
        }, 201);
    }

    async getNutrientLimits(c: Context) {
        const id = c.req.param('id');
        const limits = await conditionsService.getNutrientLimits(id);

        return c.json({
            success: true,
            data: limits,
        });
    }

    async getExclusions(c: Context) {
        const id = c.req.param('id');
        const exclusions = await conditionsService.getExclusions(id);

        return c.json({
            success: true,
            data: exclusions,
        });
    }


    async getAggregatedRestrictions(c: Context) {
        const body = await c.req.json();
        const { conditionIds } = body;

        if (!Array.isArray(conditionIds)) {
            return c.json({
                success: false,
                error: 'conditionIds must be an array',
            }, 400);
        }

        const restrictions = await conditionsService.getAggregatedRestrictions(conditionIds);

        return c.json({
            success: true,
            data: restrictions,
        });
    }
}

export const conditionsController = new ConditionsController();
