
import { plansService } from './src/services/plans.service';
import prisma from './src/db/client';

async function verify() {
    const userId = 'PTOV73R2BgXsfRg01tl7YTWPmUSR0dns';
    const date = new Date();
    date.setDate(date.getDate() + 2); // Generate for 2 days in future to avoid conflict

    console.log(`Generating plan for user ${userId} on ${date.toISOString()}...`);

    try {
        // Clean up any existing plan for this date
        await prisma.plan.deleteMany({
            where: {
                userId,
                date: {
                    gte: new Date(date.setHours(0, 0, 0, 0)),
                    lt: new Date(date.setHours(23, 59, 59, 999))
                }
            }
        });

        const plan = await plansService.generatePlan(userId, new Date(date));

        console.log('Plan generated:', plan.id);

        const meals = [plan.breakfast, plan.lunch, plan.dinner];
        const sources = meals.map(m => m ? m.sourceAPI : 'None');

        console.log('Recipe Sources:', sources);

        const edamamCount = sources.filter(s => s === 'Edamam').length;
        console.log(`Edamam Count: ${edamamCount}/3`);

        if (edamamCount >= 2) {
            console.log('SUCCESS: Edamam is prioritized.');
        } else {
            console.log('WARNING: Edamam might not be prioritized or search failed.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
