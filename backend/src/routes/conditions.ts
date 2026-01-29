import { Hono } from 'hono';
import { conditionsController } from '@/controllers/conditions.controller';

const conditions = new Hono();

// GET /api/conditions - Get all conditions
conditions.get('/', (c) => conditionsController.getAll(c));

// GET /api/conditions/search?q=... - Search ICD-11 for medical conditions
conditions.get('/search', (c) => conditionsController.searchICDConditions(c));

// POST /api/conditions/onboard - Onboard a new condition from ICD-11
conditions.post('/onboard', (c) => conditionsController.onboardCondition(c));

// POST /api/conditions/restrictions - Get aggregated restrictions for multiple conditions
conditions.post('/restrictions', (c) => conditionsController.getAggregatedRestrictions(c));

// GET /api/conditions/slug/:slug - Get condition by slug
conditions.get('/slug/:slug', (c) => conditionsController.getBySlug(c));

// GET /api/conditions/:id - Get condition by ID
conditions.get('/:id', (c) => conditionsController.getById(c));

// POST /api/conditions - Create condition
conditions.post('/', (c) => conditionsController.create(c));

// GET /api/conditions/:id/nutrient-limits - Get nutrient limits
conditions.get('/:id/nutrient-limits', (c) => conditionsController.getNutrientLimits(c));

// GET /api/conditions/:id/exclusions - Get ingredient exclusions
conditions.get('/:id/exclusions', (c) => conditionsController.getExclusions(c));

export default conditions;
