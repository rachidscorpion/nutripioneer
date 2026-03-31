import type { Context } from 'hono';
import { mealAnalysisService } from '@/services/mealAnalysis.service';
import type { RecipeData } from '@/integrations/gemini/gemini.service';

export class MealAnalysisController {
    async analyzeMeal(c: Context) {
        try {
            const userId = c.get('userId');

            if (!userId) {
                return c.json({
                    success: false,
                    error: 'Unauthorized',
                    message: 'Please sign in to analyze meals'
                }, 401);
            }

            const body = await c.req.json();

            if (!body || !body.name) {
                return c.json({
                    success: false,
                    error: 'Missing recipe data',
                    message: 'Recipe name is required'
                }, 400);
            }

            const recipeData: RecipeData = {
                name: body.name,
                calories: body.calories,
                protein: body.protein,
                carbs: body.carbs,
                fat: body.fat,
                sodium: body.sodium,
                sugar: body.sugar,
                fiber: body.fiber,
                servingSize: body.servingSize,
                servingSizeUnit: body.servingSizeUnit,
                ingredients: body.ingredients,
                prepTime: body.prepTime,
                tags: body.tags,
            };

            const analysis = await mealAnalysisService.analyze({
                userId,
                recipeData
            });

            return c.json({
                success: true,
                data: analysis
            });

        } catch (error) {
            console.error('[MealAnalysisController] Analyze error:', error);
            return c.json({
                success: false,
                error: 'Failed to analyze meal',
                message: error instanceof Error ? error.message : 'Unknown error'
            }, 500);
        }
    }
}

export const mealAnalysisController = new MealAnalysisController();
