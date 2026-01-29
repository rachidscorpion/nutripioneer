'use client';

import { useState } from 'react';
import MenuScanner from '@/components/menu/MenuScanner';
import MenuResults, { MenuAnalysisResult } from '@/components/menu/MenuResults';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import styles from '@/styles/RestaurantRescue.module.css';

export default function RestaurantRescuePage() {
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<MenuAnalysisResult | null>(null);

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

    return (
        <div className={styles.container}>
            {!result ? (
                <MenuScanner
                    onImageSelected={handleImageSelect}
                    isScanning={isScanning}
                />
            ) : (
                <MenuResults result={result} onReset={handleReset} />
            )}
        </div>
    );
}
