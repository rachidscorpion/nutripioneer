import app from './src/index';

const PORT = process.env.PORT || 3001;

console.log(`・✿ NutriPioneer API running at http://localhost:${PORT}`);

export default {
    port: PORT,
    fetch: app.fetch,
};