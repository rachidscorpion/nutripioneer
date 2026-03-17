import { Hono } from 'hono';
import axios from 'axios';
import * as cheerio from 'cheerio';

const recipe = new Hono();

recipe.get('/', async (c) => {
    const url = c.req.query('url');

    if (!url) {
        return c.json({ error: 'Missing URL parameter' }, 400);
    }

    try {
        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(html);
        let recipeData: any = null;

        $('script[type="application/ld+json"]').each((_, element) => {
            try {
                const content = $(element).html();
                if (!content) return;
                const json = JSON.parse(content);

                const findRecipe = (data: any): any => {
                    if (!data) return null;
                    if (Array.isArray(data)) {
                        for (const item of data) {
                            const result = findRecipe(item);
                            if (result) return result;
                        }
                        return null;
                    }
                    if (data['@graph']) {
                        return findRecipe(data['@graph']);
                    }

                    const type = data['@type'];
                    if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) {
                        return data;
                    }
                    return null;
                };

                const found = findRecipe(json);
                if (found) {
                    recipeData = found;
                    return false;
                }
            } catch (e) {
                console.error('Error parsing JSON-LD script', e);
            }
        });

        if (!recipeData) {
            const recipeElement = $('[itemtype*="schema.org/Recipe"], [itemtype*="schema.org/Recipe"]');
            if (recipeElement.length > 0) {
                recipeData = {};
                const parseProp = (prop: string) => {
                    const el = recipeElement.find(`[itemprop="${prop}"]`);
                    if (el.length === 0) return null;
                    return el.attr('content') || el.text().trim();
                };
                const parseProps = (prop: string) => {
                    const els = recipeElement.find(`[itemprop="${prop}"]`);
                    const res: string[] = [];
                    els.each((_, el) => {
                        const val = $(el).attr('content') || $(el).text().trim();
                        if (val) res.push(val);
                    });
                    return res.length > 0 ? res : null;
                };

                recipeData.name = parseProp('name');
                recipeData.image = recipeElement.find('[itemprop="image"]').attr('src') || parseProp('image');
                recipeData.recipeIngredient = parseProps('recipeIngredient') || parseProps('ingredients');
                recipeData.recipeInstructions = parseProps('recipeInstructions') || parseProps('instructions');
                recipeData.recipeDirections = parseProps('recipeDirections') || parseProps('directions');
                recipeData.prepTime = parseProp('prepTime');
                recipeData.cookTime = parseProp('cookTime');
                recipeData.recipeYield = parseProp('recipeYield');
            }
        }

        if (!recipeData) {
            return c.json({ success: false, error: 'No recipe schema found' }, 200);
        }

        const formatSteps = (data: any) => {
            let steps: string[] = [];
            if (Array.isArray(data)) {
                steps = data.map((step: any) => {
                    if (typeof step === 'string') return step;
                    if (step.text) return step.text;
                    if (typeof step.text === 'undefined' && step.name) return step.name;
                    return '';
                }).filter((s: string) => s && s.trim().length > 0);
            } else if (typeof data === 'string') {
                steps = [data];
            }
            return steps;
        };

        const formattedInstructions = formatSteps(recipeData.recipeInstructions);
        const formattedDirections = formatSteps(recipeData.recipeDirections);

        return c.json({
            title: recipeData.name,
            image: recipeData.image,
            ingredients: recipeData.recipeIngredient,
            instructions: formattedInstructions,
            directions: formattedDirections,
            prepTime: recipeData.prepTime,
            cookTime: recipeData.cookTime,
            servings: recipeData.recipeYield,
        });

    } catch (error) {
        console.error('Scraping error:', error);
        return c.json({ error: 'Failed to scrape recipe' }, 500);
    }
});

export default recipe;
