import { Hono } from 'hono';
import { usersController } from '@/controllers/users.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

const users = new Hono();

// ============================================
// Session-based profile routes (authenticated)
// ============================================

// GET /api/users/profile - Get current user profile
users.get('/profile', authMiddleware, (c) => usersController.getProfile(c));

// PATCH /api/users/profile - Update current user profile
users.patch('/profile', authMiddleware, (c) => usersController.updateProfile(c));

// GET /api/users/profile/nutrition-limits - Get nutrition limits
users.get('/profile/nutrition-limits', authMiddleware, (c) => usersController.getNutritionLimits(c));

// PUT /api/users/profile/nutrition-limits - Update nutrition limits
users.put('/profile/nutrition-limits', authMiddleware, (c) => usersController.updateNutritionLimits(c));

// POST /api/users/profile/generate-limits - Generate nutrition limits via AI
users.post('/profile/generate-limits', authMiddleware, (c) => usersController.generateNutritionLimits(c));

// DELETE /api/users/test-account - Delete test account
users.delete('/test-account', authMiddleware, (c) => usersController.deleteTestAccount(c));

// ============================================
// Admin/legacy routes (no auth for backward compatibility)
// ============================================

// GET /api/users - Get all users
users.get('/', (c) => usersController.getAll(c));

// GET /api/users/:id - Get user by ID
users.get('/:id', (c) => usersController.getById(c));

// POST /api/users - Create user
users.post('/', (c) => usersController.create(c));

// PATCH /api/users/:id - Update user
users.patch('/:id', (c) => usersController.update(c));

// DELETE /api/users/:id - Delete user
users.delete('/:id', (c) => usersController.delete(c));

// GET /api/users/:id/recipes - Get saved recipes
users.get('/:id/recipes', (c) => usersController.getSavedRecipes(c));

// POST /api/users/:id/recipes - Save a recipe
users.post('/:id/recipes', (c) => usersController.saveRecipe(c));

// DELETE /api/users/:id/recipes/:recipeId - Unsave a recipe
users.delete('/:id/recipes/:recipeId', (c) => usersController.unsaveRecipe(c));

export default users;
