import { Hono } from 'hono';
import { groceryController } from '@/controllers/grocery.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

const grocery = new Hono();

// ============================================
// Session-based routes (authenticated)
// ============================================

// GET /api/grocery - List user's grocery items
grocery.get('/', authMiddleware, (c) => groceryController.list(c));

// POST /api/grocery - Add single item
grocery.post('/', authMiddleware, (c) => groceryController.add(c));

// DELETE /api/grocery/all - Clear all items
grocery.delete('/all', authMiddleware, (c) => groceryController.clearAllSession(c));

// POST /api/grocery/seed - Seed grocery items
grocery.post('/seed', authMiddleware, (c) => groceryController.seed(c));

// POST /api/grocery/ingredients - Add multiple ingredients
grocery.post('/ingredients', authMiddleware, (c) => groceryController.addIngredients(c));

// POST /api/grocery/generate - Generate shopping list from Edamam
grocery.post('/generate', authMiddleware, (c) => groceryController.generateShoppingList(c));

// PATCH /api/grocery/:id/toggle - Toggle checked status
grocery.patch('/:id/toggle', authMiddleware, (c) => groceryController.toggleWithBody(c));

// DELETE /api/grocery/:id - Remove item
grocery.delete('/:id', authMiddleware, (c) => groceryController.delete(c));

// ============================================
// Legacy routes (with userId in path)
// ============================================

// GET /api/grocery/user/:userId - Get grocery items for a user
grocery.get('/user/:userId', (c) => groceryController.getByUser(c));

// POST /api/grocery/user/:userId/batch - Create multiple items
grocery.post('/user/:userId/batch', (c) => groceryController.createMany(c));

// DELETE /api/grocery/user/:userId/checked - Clear checked items
grocery.delete('/user/:userId/checked', (c) => groceryController.clearChecked(c));

// DELETE /api/grocery/user/:userId/all - Clear all items
grocery.delete('/user/:userId/all', (c) => groceryController.clearAll(c));

// GET /api/grocery/:id - Get item by ID
grocery.get('/:id', (c) => groceryController.getById(c));

// PATCH /api/grocery/:id - Update item
grocery.patch('/:id', (c) => groceryController.update(c));

export default grocery;
