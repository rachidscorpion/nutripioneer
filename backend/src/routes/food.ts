import { Hono } from 'hono';
import { foodController } from '@/controllers/food.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

const food = new Hono();

// Apply auth middleware to all food routes
food.use('*', authMiddleware);

// GET /api/food/analyze?q= - Analyze food by query
food.get('/analyze', (c) => foodController.analyze(c));

// GET /api/food/search?q=&type= - Search/Suggestions
food.get('/search', (c) => foodController.search(c));

// GET /api/food/barcode/:code - Analyze food by barcode
food.get('/barcode/:code', (c) => foodController.analyzeBarcode(c));

export default food;
