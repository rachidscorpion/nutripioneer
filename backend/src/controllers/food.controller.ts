import type { Context } from 'hono';
import { foodService } from '@/services/food.service';
import { usersService } from '@/services/users.service';

export class FoodController {
    private async getLimits(c: Context) {
        const userId = c.get('userId');
        if (!userId) return null;

        try {
            const user = await usersService.getById(userId);
            if (user && (user as any).nutritionLimits) {
                return JSON.parse((user as any).nutritionLimits as string);
            }
        } catch (e) {
            console.error('[FoodController] Failed to parse nutrition limits', e);
        }
        return null;
    }

    /**
     * GET /food/analyze?q= - Analyze food by query
     */
    async analyze(c: Context) {
        const query = c.req.query('q');
        const type = c.req.query('type') as 'Brand' | 'Generic' | undefined;

        if (!query) {
            return c.json({
                success: false,
                error: 'Query parameter "q" is required',
            }, 400);
        }

        const limits = await this.getLimits(c);
        const result = await foodService.analyze(query, limits, type);
        return c.json({
            success: true,
            data: result,
        });
    }

    /**
     * GET /food/search?q=&type= - Search/Suggestions
     */
    async search(c: Context) {
        const query = c.req.query('q');
        const type = c.req.query('type') as 'Brand' | 'Generic' | undefined;
        console.log(query, type);
        if (!query) return c.json({ success: true, data: [] });

        const results = await foodService.search(query, type);
        return c.json({ success: true, data: results });
    }

    /**
     * GET /food/barcode/:code - Analyze food by barcode
     */
    async analyzeBarcode(c: Context) {
        const code = c.req.param('code');

        if (!code) {
            return c.json({
                success: false,
                error: 'Barcode parameter is required',
            }, 400);
        }

        const limits = await this.getLimits(c);
        const result = await foodService.analyzeBarcode(code, limits);

        return c.json({
            success: true,
            data: result,
        });
    }
}

export const foodController = new FoodController();
