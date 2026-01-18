'use client';

import { useOnboardingStore } from '@/store/useOnboardingStore';
import WelcomeStep from '@/app/onboarding/steps/1-Welcome';
import ConditionsStep from '@/app/onboarding/steps/2-Conditions';
import BiometricsStep from '@/app/onboarding/steps/3-Biometrics';
import MedicalStep from '@/app/onboarding/steps/4-Medical';
import DietaryStep from '@/app/onboarding/steps/5-Dietary';
import SynthesizingStep from '@/app/onboarding/steps/6-Synthesizing';


export default function OnboardingPage() {
    const { step } = useOnboardingStore();

    const renderStep = () => {
        switch (step) {
            case 1:
                return <WelcomeStep />;
            case 2:
                return <ConditionsStep />;
            case 3:
                return <BiometricsStep />;
            case 4:
                return <MedicalStep />;
            case 5:
                return <DietaryStep />;
            case 6:
                return <SynthesizingStep />;
            default:
                return <WelcomeStep />;
        }
    };

    return (
        <div style={{ width: '100%' }}>
            {renderStep()}
        </div>
    );
}
