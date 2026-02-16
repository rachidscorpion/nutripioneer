import { analyzeMenuImage, type MenuAnalysisResult, type HealthProfile } from '@/integrations/gemini/gemini.service';

interface ScanMenuOptions {
    imageBuffer: Buffer;
    mimeType: string;
    profile: HealthProfile;
}

export class MenuService {
    private readonly MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
    private readonly SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

    private validateImage(imageBuffer: Buffer, mimeType: string): void {
        if (!imageBuffer || imageBuffer.length === 0) {
            throw new Error('No image data provided');
        }

        if (imageBuffer.length > this.MAX_IMAGE_SIZE) {
            throw new Error(`Image too large. Maximum size is ${this.MAX_IMAGE_SIZE / 1024 / 1024}MB`);
        }

        if (!this.SUPPORTED_FORMATS.includes(mimeType)) {
            throw new Error(`Unsupported image format. Supported: ${this.SUPPORTED_FORMATS.join(', ')}`);
        }
    }

    private bufferToBase64(imageBuffer: Buffer, mimeType: string): string {
        const base64 = imageBuffer.toString('base64');
        return `data:${mimeType};base64,${base64}`;
    }

    async scanMenu(options: ScanMenuOptions): Promise<MenuAnalysisResult> {
        const { imageBuffer, mimeType, profile } = options;

        this.validateImage(imageBuffer, mimeType);

        const imageBase64 = this.bufferToBase64(imageBuffer, mimeType);

        try {
            const analysis = await analyzeMenuImage(imageBase64, profile);

            if (!analysis.items || analysis.items.length === 0) {
                throw new Error('No menu items were detected in the image');
            }

            return analysis;
        } catch (error) {
            console.error('[MenuService] Error scanning menu:', error);
            throw new Error('Failed to analyze menu. Please try with a clearer image or different angle.');
        }
    }
}

export const menuService = new MenuService();
