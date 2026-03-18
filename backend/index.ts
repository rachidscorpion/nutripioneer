import app from './src/index';
import { seedTestUser } from './src/utils/seedTestUser';

const PORT = process.env.PORT || 3001;

console.log(`・✿ NutriPioneer API running at http://localhost:${PORT}`);

// Seed a test account on startup
seedTestUser();

export default {
    port: PORT,
    fetch: app.fetch,
};