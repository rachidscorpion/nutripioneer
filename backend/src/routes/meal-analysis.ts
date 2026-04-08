import { Hono } from 'hono';
import { mealAnalysisController } from '@/controllers/mealAnalysis.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

const mealAnalysis = new Hono();

mealAnalysis.use('*', authMiddleware);

mealAnalysis.post('/analyze', (c) => mealAnalysisController.analyzeMeal(c));

export default mealAnalysis;
