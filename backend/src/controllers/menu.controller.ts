import type { Context } from 'hono';
import { menuService } from '@/services/menu.service';
import prisma from '@/db/client';

export class MenuController {
    async scanMenu(c: Context) {
        try {
            const userId = c.get('userId');

            if (!userId) {
                return c.json({
                    success: false,
                    error: 'Unauthorized',
                    message: 'Please sign in to use menu scanning'
                }, 401);
            }

            const formData = await c.req.formData();
            const image = formData.get('image') as File;

            if (!image) {
                return c.json({
                    success: false,
                    error: 'Missing image',
                    message: 'Please provide an image file'
                }, 400);
            }

            const imageBuffer = await image.arrayBuffer();
            const mimeType = image.type || 'image/jpeg';

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    conditions: true,
                    onboardingData: true,
                    age: true
                }
            });

            if (!user) {
                return c.json({
                    success: false,
                    error: 'User not found'
                }, 404);
            }

            const conditions = user.conditions ? JSON.parse(user.conditions) : [];
            let medications: any[] = [];

            let biometrics = { weight: 70, height: 170, age: user.age || 30, gender: 'Male' };
            if (user.onboardingData) {
                try {
                    const onboarding = JSON.parse(user.onboardingData);
                    if (onboarding.biometrics) {
                        biometrics = {
                            ...biometrics,
                            ...onboarding.biometrics
                        };
                    }
                    if (onboarding.medical && onboarding.medical.medications) {
                        medications = onboarding.medical.medications;
                    }
                } catch (e) {
                    console.error('Failed to parse onboarding data', e);
                }
            }

            const profile = {
                conditions,
                medications,
                biometrics
            };

            const analysis = await menuService.scanMenu({
                imageBuffer: Buffer.from(imageBuffer),
                mimeType,
                profile
            });

            return c.json({
                success: true,
                data: analysis
            });

        } catch (error) {
            console.error('[MenuController] Scan error:', error);
            return c.json({
                success: false,
                error: 'Failed to scan menu',
                message: error instanceof Error ? error.message : 'Unknown error'
            }, 500);
        }
    }
}

export const menuController = new MenuController();
