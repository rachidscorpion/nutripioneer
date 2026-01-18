import { Hono } from 'hono';
import { recipesController } from '@/controllers/recipes.controller';

const recipes = new Hono();

// GET /api/recipes - Get all recipes with optional search/filter
recipes.get('/', (c) => recipesController.getAll(c));

// GET /api/recipes/categories - Get unique categories
recipes.get('/categories', (c) => recipesController.getCategories(c));

// GET /api/recipes/:id - Get recipe by ID
recipes.get('/:id', (c) => recipesController.getById(c));

// POST /api/recipes - Create recipe
recipes.post('/', (c) => recipesController.create(c));

// PATCH /api/recipes/:id - Update recipe
recipes.patch('/:id', (c) => recipesController.update(c));

// DELETE /api/recipes/all - Delete ALL recipes
recipes.delete('/storage/all', (c) => recipesController.deleteAll(c));

// DELETE /api/recipes/:id - Delete recipe
recipes.delete('/:id', (c) => recipesController.delete(c));

// POST /api/recipes/regenerate-all - Regenerate all recipes
recipes.post('/regenerate-all', (c) => recipesController.regenerateAll(c));

export default recipes;
