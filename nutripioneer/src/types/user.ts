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
