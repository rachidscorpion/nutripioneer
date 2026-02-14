'use client';

import { useState, useEffect } from 'react';
import MenuScanner from '@/components/menu/MenuScanner';
import MenuResults, { MenuAnalysisResult } from '@/components/menu/MenuResults';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import styles from '@/styles/RestaurantRescue.module.css';
import ProGate from '@/components/pro/ProGate';

export default function RestaurantRescuePage() {
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<MenuAnalysisResult | null>(null);
    const [isPro, setIsPro] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function checkSubscription() {
            try {
                const res = await fetch('/api/auth/session');
                const data = await res.json();
                setIsPro(data.user?.subscriptionStatus === 'active');
            } catch (e) {
                console.error('Failed to check subscription', e);
            } finally {
                setIsLoading(false);
            }
        }
        checkSubscription();
    }, []);

    const handleImageSelect = async (file: File) => {
        setIsScanning(true);

        try {
            const response = await api.menu.scan(file);

            if (response.data && response.data.success && response.data.data) {
                setResult(response.data.data);
                toast.success('Menu analyzed successfully!');
            } else {
                throw new Error('Failed to analyze menu');
            }
        } catch (error) {
            console.error('Error scanning menu:', error);
            toast.error(
                error instanceof Error ? error.message : 'Failed to scan menu. Please try again.'
            );
        } finally {
            setIsScanning(false);
        }
    };

    const handleReset = () => {
        setResult(null);
    };

    if (isLoading) {
        return (
            <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className={styles.loadingSpinner}></div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <ProGate
                isPro={isPro}
                feature="Restaurant Menu Scanner"
                description="Scan any restaurant menu and get instant SAFE/CAUTION/AVOID analysis based on your health conditions"
                benefits={[
                    "AI-powered menu analysis",
                    "Condition-specific recommendations",
                    "Modification suggestions for each dish",
                    "Works with any restaurant"
                ]}
                mode="block"
            >
                {!result ? (
                    <MenuScanner
                        onImageSelected={handleImageSelect}
                        isScanning={isScanning}
                    />
                ) : (
                    <MenuResults result={result} onReset={handleReset} />
                )}
            </ProGate>
        </div>
    );
}
