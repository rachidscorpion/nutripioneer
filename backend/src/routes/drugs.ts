
import { Hono } from 'hono';
import { searchDrugs, getDrugEnrichment } from '../services/drugApi';

const app = new Hono();

app.get('/search', async (c) => {
    const query = c.req.query('q');

    if (!query || query.length < 2) {
        return c.json({ results: [] });
    }

    try {
        const results = await searchDrugs(query);
        return c.json({ results });
    } catch (error) {
        console.error('Search route error:', error);
        return c.json({ error: 'Failed to search drugs' }, 500);
    }
});

app.get('/details', async (c) => {
    const name = c.req.query('name');
    const rxcui = c.req.query('rxcui');

    if (!name) {
        return c.json({ error: 'Drug name is required' }, 400);
    }

    try {
        const details = await getDrugEnrichment(name, rxcui);
        if (!details) {
            return c.json({ error: 'Drug details not found' }, 404);
        }
        return c.json(details);
    } catch (error) {
        console.error('Details route error:', error);
        return c.json({ error: 'Failed to fetch drug details' }, 500);
    }
});

export default app;
