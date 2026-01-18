import InteractiveBackground from '@/components/ui/InteractiveBackground';
import { Toaster } from 'sonner';
import OnboardingLayoutClient from './OnboardingLayoutClient';



export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
            <OnboardingLayoutClient>
                {children}
            </OnboardingLayoutClient>
            <Toaster position="top-center" toastOptions={{
                style: {
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    color: '#1e293b',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }
            }} />
        </div>
    );
}
