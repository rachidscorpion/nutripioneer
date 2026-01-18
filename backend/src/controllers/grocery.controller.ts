import type { Context } from 'hono';
import { groceryService } from '@/services/grocery.service';
import { createGroceryItemSchema, updateGroceryItemSchema } from '@/schemas';

export class GroceryController {
    async getByUser(c: Context) {
        const userId = c.req.param('userId');
        const grouped = c.req.query('grouped') === 'true';

        if (grouped) {
            const items = await groceryService.getByUserGrouped(userId);
            return c.json({
                success: true,
                data: items,
            });
        }

        const items = await groceryService.getByUser(userId);
        return c.json({
            success: true,
            data: items,
        });
    }

    async getById(c: Context) {
        const id = c.req.param('id');
        const item = await groceryService.getById(id);

        return c.json({
            success: true,
            data: item,
        });
    }

    async create(c: Context) {
        const body = await c.req.json();
        const data = createGroceryItemSchema.parse(body);

        const item = await groceryService.create(data);

        return c.json({
            success: true,
            data: item,
        }, 201);
    }

    async createMany(c: Context) {
        const userId = c.req.param('userId');
        const { items } = await c.req.json();

        const result = await groceryService.createMany(userId, items);

        return c.json({
            success: true,
            data: result,
        }, 201);
    }

    async update(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const data = updateGroceryItemSchema.parse(body);

        const item = await groceryService.update(id, data);

        return c.json({
            success: true,
            data: item,
        });
    }

    async toggleChecked(c: Context) {
        const id = c.req.param('id');
        const item = await groceryService.toggleChecked(id);

        return c.json({
            success: true,
            data: item,
        });
    }

    async delete(c: Context) {
        const id = c.req.param('id');
        await groceryService.delete(id);

        return c.json({
            success: true,
            message: 'Item deleted successfully',
        });
    }

    async clearChecked(c: Context) {
        const userId = c.req.param('userId');
        const items = await groceryService.clearChecked(userId);

        return c.json({
            success: true,
            data: items,
        });
    }

    async clearAll(c: Context) {
        const userId = c.req.param('userId');
        await groceryService.clearAll(userId);

        return c.json({
            success: true,
            message: 'All items cleared',
        });
    }

    // ============================================
    // Session-based endpoints
    // ============================================

    /**
     * GET /grocery - List current user's grocery items
     */
    async list(c: Context) {
        const userId = c.get('userId');
        const items = await groceryService.getByUser(userId);

        return c.json({
            success: true,
            data: items,
        });
    }

    /**
     * POST /grocery - Add single item with name in body
     */
    async add(c: Context) {
        const userId = c.get('userId');
        const { name } = await c.req.json();

        const item = await groceryService.create({
            userId,
            name,
        });

        return c.json({
            success: true,
            data: item,
        }, 201);
    }

    /**
     * PATCH /grocery/:id/toggle - Toggle with isChecked in body
     */
    async toggleWithBody(c: Context) {
        const id = c.req.param('id');
        const { isChecked } = await c.req.json();

        const item = await groceryService.update(id, { isChecked });

        return c.json({
            success: true,
            data: item,
        });
    }

    /**
     * DELETE /grocery/all - Clear all items for current user
     */
    async clearAllSession(c: Context) {
        const userId = c.get('userId');
        await groceryService.clearAll(userId);

        return c.json({
            success: true,
            message: 'All items cleared',
        });
    }

    /**
     * POST /grocery/seed - Seed grocery items for current user
     */
    async seed(c: Context) {
        const userId = c.get('userId');
        const items = await groceryService.seed(userId);

        return c.json({
            success: true,
            data: items,
        });
    }

    /**
     * POST /grocery/ingredients - Add multiple ingredients
     */
    async addIngredients(c: Context) {
        const userId = c.get('userId');
        const { ingredients } = await c.req.json();

        const items = await groceryService.addIngredients(userId, ingredients);

        return c.json({
            success: true,
            data: items,
        });
    }

    /**
     * POST /grocery/generate - Generate shopping list from recipes (Edamam)
     */
    async generateShoppingList(c: Context) {
        const userId = c.get('userId');
        const body = await c.req.json();
        /*
           Body expected:
           {
             entries: [ { item: "recipe_uri", quantity: 1 } ]
           }
        */

        // Assuming direct pass-through to service for now, or we can validate
        // In a real app we might want to validate 'body' with Zod

        try {
            const { edamamService } = await import('@/integrations/edamam/edamam.service');

            const result = await edamamService.generateShoppingList(body, userId);

            return c.json({
                success: true,
                data: result
            });
        } catch (e: any) {
            return c.json({
                success: false,
                message: e.message
            }, 500);
        }
    }
}

export const groceryController = new GroceryController();

