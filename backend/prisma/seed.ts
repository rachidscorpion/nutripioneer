import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_DATA = {
    conditions: [
        {
            slug: 't2d',
            label: 'Type 2 Diabetes',
            description: 'Metabolic disorder characterized by high blood sugar, insulin resistance, and relative lack of insulin.',
            icon: 'Activity',
            color: '#3B82F6',
            nutritionalFocus: { riskFactors: ['Insulin Resistance'], goals: ['Stable Blood Sugar'] },
        },
        {
            slug: 'htn',
            label: 'Hypertension',
            description: 'High blood pressure condition requiring sodium and fluid management.',
            icon: 'HeartPulse',
            color: '#EF4444',
            nutritionalFocus: { riskFactors: ['High Blood Pressure'], goals: ['Lower Sodium'] },
        },
        {
            slug: 'ckd-3b-5',
            label: 'CKD (Stage 3b-5)',
            description: 'Chronic Kidney Disease requiring strict management of Potassium, Phosphorus, Sodium, and Protein.',
            icon: 'Kidney',
            color: '#F59E0B',
            nutritionalFocus: { riskFactors: ['Hyperkalemia', 'Hyperphosphatemia'], goals: ['Preserve Kidney Function'] },
        },
        {
            slug: 'pcos',
            label: 'PCOS',
            description: 'Polycystic Ovary Syndrome associated with insulin resistance and inflammation.',
            icon: 'Flower2',
            color: '#EC4899',
            nutritionalFocus: { riskFactors: ['Insulin Resistance', 'Inflammation'], goals: ['Hormonal Balance'] },
        },
        {
            slug: 'hyperlipidemia',
            label: 'Hyperlipidemia',
            description: 'High levels of lipids/cholesterol in the blood.',
            icon: 'Droplet',
            color: '#10B981',
            nutritionalFocus: { riskFactors: ['High Cholesterol'], goals: ['Lower LDL', 'Raise HDL'] },
        },
    ],
    exclusions: [
        // Phosphate Additives
        {
            conditionSlug: 'ckd-3b-5',
            additiveCategory: 'Phosphate Additives',
            ingredientRegex: 'phosphoric acid|sodium phosphate|potassium phosphate|calcium phosphate|polyphosphate|dicalcium phosphate|hexametaphosphate',
            riskCategory: 'High Inorganic Phosphate Load',
            severity: 'CRITICAL_AVOID',
        },
        // Potassium Additives
        {
            conditionSlug: 'ckd-3b-5',
            additiveCategory: 'Potassium Additives',
            ingredientRegex: 'potassium chloride|potassium lactate|potassium sorbate|potassium citrate',
            riskCategory: 'Rapid K+ absorption; arrhythmia risk',
            severity: 'CRITICAL_AVOID',
        },
        // Sodium Additives
        {
            conditionSlug: 'ckd-3b-5',
            additiveCategory: 'Sodium Additives',
            ingredientRegex: 'monosodium glutamate|sodium benzoate|sodium nitrate|sodium nitrite|sodium bicarbonate|disodium guanylate',
            riskCategory: 'Fluid retention, Hypertension',
            severity: 'LIMIT',
        },
        {
            conditionSlug: 'htn',
            additiveCategory: 'Sodium Additives',
            ingredientRegex: 'monosodium glutamate|sodium benzoate|sodium nitrate|sodium nitrite|sodium bicarbonate|disodium guanylate',
            riskCategory: 'Hypertension',
            severity: 'LIMIT',
        },
        // Hidden Sugars
        {
            conditionSlug: 't2d',
            additiveCategory: 'Hidden Sugars',
            ingredientRegex: 'high fructose corn syrup|cane sugar|corn syrup|rice syrup',
            riskCategory: 'Glycemic Spike',
            severity: 'LIMIT',
        },
        {
            conditionSlug: 'pcos',
            additiveCategory: 'Hidden Sugars',
            ingredientRegex: 'high fructose corn syrup|cane sugar|corn syrup|rice syrup',
            riskCategory: 'Insulin Resistance',
            severity: 'LIMIT',
        },
    ],
    globalExclusions: [
        {
            additiveCategory: 'Trans Fats',
            ingredientRegex: 'partially hydrogenated|shortening',
            riskCategory: 'Systemic inflammation; lowers HDL; raises LDL',
            severity: 'CRITICAL_AVOID',
        }
    ],
    nutrientLimits: [
        // T2D
        { slug: 't2d', nutrient: 'Sodium', limitValue: '<2300', unit: 'mg', limitType: 'MAX' },
        { slug: 't2d', nutrient: 'Potassium', limitValue: '>4700', unit: 'mg', limitType: 'MIN' },
        { slug: 't2d', nutrient: 'Phosphorus', limitValue: 'Normal', limitType: 'TEXT' },
        { slug: 't2d', nutrient: 'Added Sugar', limitValue: '<25-36', unit: 'g', limitType: 'MAX' },
        { slug: 't2d', nutrient: 'Sat. Fat', limitValue: '<10%', unit: 'Cal', limitType: 'MAX' },
        // HTN
        { slug: 'htn', nutrient: 'Sodium', limitValue: '<1500', unit: 'mg', limitType: 'MAX' },
        { slug: 'htn', nutrient: 'Potassium', limitValue: '3500-5000', unit: 'mg', limitType: 'RANGE' },
        { slug: 'htn', nutrient: 'Added Sugar', limitValue: '<25-36', unit: 'g', limitType: 'MAX' },
        { slug: 'htn', nutrient: 'Sat. Fat', limitValue: '<6%', unit: 'Cal', limitType: 'MAX' },
        // CKD
        { slug: 'ckd-3b-5', nutrient: 'Sodium', limitValue: '<2000', unit: 'mg', limitType: 'MAX' },
        { slug: 'ckd-3b-5', nutrient: 'Potassium', limitValue: 'Limit if High (<2000-3000)', unit: 'mg', limitType: 'TEXT' },
        { slug: 'ckd-3b-5', nutrient: 'Phosphorus', limitValue: '800-1000', unit: 'mg', limitType: 'RANGE' },
        { slug: 'ckd-3b-5', nutrient: 'Protein', limitValue: '0.6-0.8', unit: 'g/kg', limitType: 'RANGE' },
        { slug: 'ckd-3b-5', nutrient: 'Added Sugar', limitValue: '<25-36', unit: 'g', limitType: 'MAX' },
        // PCOS
        { slug: 'pcos', nutrient: 'Sodium', limitValue: '<2300', unit: 'mg', limitType: 'MAX' },
        { slug: 'pcos', nutrient: 'Added Sugar', limitValue: 'Minimize', limitType: 'TEXT' },
        { slug: 'pcos', nutrient: 'Sat. Fat', limitValue: '<10%', unit: 'Cal', limitType: 'MAX' },
        // Hyperlipidemia
        { slug: 'hyperlipidemia', nutrient: 'Sodium', limitValue: '<2000', unit: 'mg', limitType: 'MAX' },
        { slug: 'hyperlipidemia', nutrient: 'Sat. Fat', limitValue: '<5-6%', unit: 'Cal', limitType: 'MAX' },
    ],
    recipes: []
};

async function seedMedicalData() {
    console.log('🌱 Start seeding medical data...');

    // 1. Clear existing medical data
    await prisma.ingredientExclusion.deleteMany({});
    await prisma.nutrientLimit.deleteMany({});
    await prisma.condition.deleteMany({});

    console.log('🧹 Cleared existing medical tables');

    // 2. Seed Conditions
    const conditionMap: Record<string, string> = {}; // slug -> id

    for (const c of SEED_DATA.conditions) {
        const result = await prisma.condition.create({
            data: {
                slug: c.slug,
                label: c.label,
                description: c.description,
                icon: c.icon,
                color: c.color,
                nutritionalFocus: JSON.stringify(c.nutritionalFocus),
                // Initialize clean arrays for these fields
                allowedIngredients: JSON.stringify([]),
                excludedIngredients: JSON.stringify([])
            }
        });
        conditionMap[c.slug] = result.id;
    }
    console.log(`✅ Seeded ${Object.keys(conditionMap).length} Conditions`);

    // 3. Seed Exclusions
    // A. Specific Exclusions
    for (const ex of SEED_DATA.exclusions) {
        const conditionId = conditionMap[ex.conditionSlug];
        if (conditionId) {
            await prisma.ingredientExclusion.create({
                data: {
                    conditionId: conditionId,
                    additiveCategory: ex.additiveCategory,
                    ingredientRegex: ex.ingredientRegex,
                    riskCategory: ex.riskCategory,
                    severity: ex.severity,
                    source: 'Table 1: Additive Exclusion Logic'
                }
            });
        }
    }
    // B. Global Exclusions (Trans Fats)
    for (const slug of Object.keys(conditionMap)) {
        const conditionId = conditionMap[slug];
        if (conditionId) {
            for (const globalEx of SEED_DATA.globalExclusions) {
                await prisma.ingredientExclusion.create({
                    data: {
                        conditionId: conditionId,
                        additiveCategory: globalEx.additiveCategory,
                        ingredientRegex: globalEx.ingredientRegex,
                        riskCategory: globalEx.riskCategory,
                        severity: globalEx.severity,
                        source: 'Global Exclusion'
                    }
                });
            }
        }
    }
    console.log('✅ Seeded Ingredient Exclusions');

    // 4. Seed Nutrient Limits
    for (const lim of SEED_DATA.nutrientLimits) {
        const conditionId = conditionMap[lim.slug];
        if (conditionId) {
            await prisma.nutrientLimit.create({
                data: {
                    conditionId: conditionId,
                    nutrient: lim.nutrient,
                    limitType: lim.limitType,
                    limitValue: lim.limitValue,
                    unit: lim.unit
                }
            });
        }
    }
    console.log('✅ Seeded Nutrient Limits');
}


async function main() {
    console.log('🌱 Starting database seed...');
    await seedMedicalData();
    console.log('✅ All seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
