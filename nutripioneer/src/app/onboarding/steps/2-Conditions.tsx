'use client';

import { useOnboardingStore } from '@/store/useOnboardingStore';
import styles from '@/styles/Onboarding.module.css';
import { ArrowRight, Droplets, Heart, Activity, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api-client'; // Import the server action
import { useEffect, useState } from 'react';

// Map string names from DB to actual components
const ICON_MAP: Record<string, any> = {
    'Droplets': Droplets,
    'Heart': Heart,
    'Activity': Activity,
    'Shield': Shield,
    'AlertCircle': AlertCircle,
};

export default function ConditionsStep() {
    const { conditions, updateData, nextStep, prevStep } = useOnboardingStore();
    const [availableConditions, setAvailableConditions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadConditions() {
            try {
                const res = await api.conditions.list();
                // Backend returns { success: true, data: [...] }
                const conditionsData = res.data?.data || [];
                setAvailableConditions(conditionsData);
            } catch (error) {
                toast.error("Failed to load conditions.");
            } finally {
                setIsLoading(false);
            }
        }
        loadConditions();
    }, []);

    const toggleCondition = (id: string) => {
        const isSelected = conditions.includes(id);
        let newConditions;

        if (isSelected) {
            newConditions = conditions.filter((c) => c !== id);
        } else {
            newConditions = [...conditions, id];
            if (id === 'hypertension') {
                toast.info("We will prioritize DASH-compliant recipes for you.", {
                    duration: 3000,
                });
            }
        }
        updateData('conditions', newConditions);
    };

    return (
        <div style={{ padding: '0 1rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>
                Do you have any known<br />conditions?
            </h1>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>Select all that apply. This helps us tailor your plan.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '3rem' }}>
                {isLoading ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#94a3b8' }}>Loading conditions...</div>
                ) : (
                    availableConditions.map((c) => {
                        // We use c.slug as the ID to store in our state/DB
                        const isSelected = conditions.includes(c.slug);
                        // Resolve the icon component from the map string
                        const IconComponent = ICON_MAP[c.icon] || AlertCircle;

                        return (
                            <button
                                key={c.id}
                                onClick={() => toggleCondition(c.slug)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '1.5rem',
                                    border: isSelected ? `2px solid ${c.color}` : '1px solid rgba(0,0,0,0.1)',
                                    background: isSelected ? `${c.color}10` : 'rgba(255,255,255,0.5)',
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                }}
                            >
                                <IconComponent size={32} color={c.color} style={{ marginBottom: '10px' }} />
                                <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#334155' }}>{c.label}</span>
                            </button>
                        );
                    })
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                    onClick={prevStep}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1rem' }}
                >
                    Back
                </button>
                <button
                    className={styles['btn-primary']}
                    onClick={nextStep}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                    Continue <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
}
