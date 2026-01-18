import type { Context } from 'hono';
import { recipesService } from '@/services/recipes.service';
import { createRecipeSchema, updateRecipeSchema, paginationSchema, searchSchema } from '@/schemas';

export class RecipesController {
    async getAll(c: Context) {
        const query = c.req.query();
        const { page, limit } = paginationSchema.parse(query);
        const { q: search, category, tags } = searchSchema.parse(query);

        const result = await recipesService.getAll({
            page,
            limit,
            search,
            category,
            tags: tags ? tags.split(',') : undefined,
        });

        return c.json({
            success: true,
            data: result.recipes,
            pagination: result.pagination,
        });
    }

    async getById(c: Context) {
        const id = c.req.param('id');
        const recipe = await recipesService.getById(id);

        return c.json({
            success: true,
            data: recipe,
        });
    }

    async getCategories(c: Context) {
        const categories = await recipesService.getCategories();

        return c.json({
            success: true,
            data: categories,
        });
    }

    async create(c: Context) {
        const body = await c.req.json();
        const data = createRecipeSchema.parse(body);

        const recipe = await recipesService.create(data);

        return c.json({
            success: true,
            data: recipe,
        }, 201);
    }

    async update(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const data = updateRecipeSchema.parse(body);

        const recipe = await recipesService.update(id, data);

        return c.json({
            success: true,
            data: recipe,
        });
    }

    async delete(c: Context) {
        const id = c.req.param('id');
        await recipesService.delete(id);

        return c.json({
            success: true,
            message: 'Recipe deleted successfully',
        });
    }

    async deleteAll(c: Context) {
        await recipesService.deleteAll();
        return c.json({
            success: true,
            message: 'All recipes deleted',
        });
    }

    async regenerateAll(c: Context) {
        const result = await recipesService.regenerateAll();
        return c.json({
            success: true,
            data: result,
            message: `Regenerated ${result.count} recipes`,
        });
    }
}

export const recipesController = new RecipesController();
