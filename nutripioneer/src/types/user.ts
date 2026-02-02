export interface OnboardingData {
    biometrics: {
        gender: string;
        heightCm: number;
        weightKg: number;
        waistCm: number;
    };
    medical: {
        insulin: boolean;
        medications: any[];
        diagnosisYear?: number;
    };
    lifestyle: {
        activityLevel: string;
        sleepAvgHours: number;
    };

    dietary: {
        favorites: string[];
        dislikes: string[];
        allergies: string[];
        favCuisines?: string[];
        dislikeCuisines?: string[];
    };
}

export interface NutritionLimits {
    daily_calories: { min: number; max: number; label?: string };
    nutrients: {
        [key: string]: {
            max?: number;
            min?: number;
            label?: string;
            unit?: string;
        }
    };
    avoid_ingredients?: string[];
    reasoning?: string;
}

