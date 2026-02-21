import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OnboardingState {
    step: number;
    name: string;
    email: string;
    conditions: string[];
    biometrics: {
        height: number;
        weight: number;
        waist: number;
        age: number;
        gender: string;
        unit?: 'metric' | 'imperial';
    };
    medical: {
        insulin: boolean;
        medications: Array<{
            name: string;
            openfda_rxcui?: string[];
            rxnorm_rxcui?: string;
            ingredients?: string[];
            interactions?: string;
            pharm_class?: string[];
            warnings?: string[];
            purpose?: string[];
            pregnancy_or_breast_feeding?: string[];
            substance_name?: string[];
        }>;
    };
    dietary: {
        favorites: string[];
        dislikes: string[];
        favCuisines: string[];
        dislikeCuisines: string[];
    };
    // Actions
    nextStep: () => void;
    prevStep: () => void;
    updateData: (section: keyof OnboardingState, data: any) => void;
    setStep: (step: number) => void;
    reset: () => void;
    completeOnboarding: () => void;
}

const initialState = {
    step: 1,
    name: '',
    email: '',
    conditions: [],
    biometrics: {
        height: 0,
        weight: 0,
        waist: 0,
        age: 0,
        gender: '',
        unit: 'imperial' as const,
    },
    medical: {
        insulin: false,
        medications: [],
    },
    dietary: {
        favorites: [],
        dislikes: [],
        favCuisines: [],
        dislikeCuisines: [],
    },
};

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            ...initialState,
            nextStep: () => set((state) => ({ step: state.step + 1 })),
            prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),
            setStep: (step) => set({ step }),

            reset: () => set(initialState),

            updateData: (section, data) => set((state) => {
                const currentSection = state[section];
                const isObject = typeof data === 'object' && data !== null && !Array.isArray(data);

                if (isObject && typeof currentSection === 'object' && !Array.isArray(currentSection)) {
                    return { [section]: { ...currentSection, ...data } };
                }

                return { [section]: data };
            }),

            completeOnboarding: () => {
                set(initialState);
            },
        }),
        {
            name: 'nutripioneer-onboarding-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                step: state.step,
                name: state.name,
                email: state.email,
                conditions: state.conditions,
                biometrics: state.biometrics,
                medical: state.medical,
                dietary: state.dietary,
            }),
        }
    )
);
