import { Hono } from 'hono';

import users from './users';
import recipes from './recipes';
import plans from './plans';
import conditions from './conditions';
import metrics from './metrics';
import grocery from './grocery';
import food from './food';
import products from './products';

import drugs from './drugs';

const api = new Hono();

// Mount all route modules
api.route('/users', users);
api.route('/recipes', recipes);
api.route('/plans', plans);
api.route('/conditions', conditions);
api.route('/metrics', metrics);
api.route('/grocery', grocery);
api.route('/food', food);
api.route('/drugs', drugs);
api.route('/products', products);

export default api;

