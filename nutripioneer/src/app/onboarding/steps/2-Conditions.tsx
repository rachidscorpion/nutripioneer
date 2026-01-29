'use client';

import { useOnboardingStore } from '@/store/useOnboardingStore';
import styles from '@/styles/Onboarding.module.css';
import { ArrowRight, Droplets, Heart, Activity, Shield, AlertCircle, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api-client';
import { useEffect, useState } from 'react';
import ConditionSearch from '@/components/conditions/ConditionSearch';

// Map string names from DB to actual components (for suggestions)
const ICON_MAP: Record<string, any> = {
    'Droplets': Droplets,
    'Heart': Heart,
    'Activity': Activity,
    'Shield': Shield,
    'AlertCircle': AlertCircle,
    'Sparkles': Sparkles
};

// Hardcoded suggestions based on previous DB content + common ones
const SUGGESTIONS = [
    {
        title: "Type 2 Diabetes",
        icdCode: "5A11", // Using the one verified in user request if possible, or general
        searchTerm: "Type 2 Diabetes Mellitus",
        icon: "Activity",
        color: "#3B82F6"
    },
    {
        title: "Hypertension",
        icdCode: "BA00", // ICD-11 for Essential Hypertension
        searchTerm: "Hypertension",
        icon: "Heart",
        color: "#EF4444"
    },
    {
        title: "PCOS",
        icdCode: "KA21.0", // Polycystic ovary syndrome
        searchTerm: "Polycystic ovary syndrome",
        icon: "Droplets",
        color: "#EC4899"
    },
    {
        title: "Celiac Disease",
        icdCode: "DA96", // Coeliac disease
        searchTerm: "Coeliac disease",
        icon: "Shield", // Wheat-ish? Shield for protection
        color: "#F59E0B"
    }
];

export default function ConditionsStep() {
    const { conditions, updateData, nextStep, prevStep } = useOnboardingStore();
    // specific conditions objects (full details) to display selected pills
    const [selectedConditionsDetails, setSelectedConditionsDetails] = useState<any[]>([]);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // Initial load: fetch details for slugs currently in store (if any)
    useEffect(() => {
        async function loadSelectedDetails() {
            if (conditions.length === 0) return;

            setIsLoadingDetails(true);
            try {
                // We actually need a bulk fetch or just fetch list and filter
                // Since user might have just cleared DB, these slugs might be invalid.
                // But for now let's try to fetch list.
                const res = await api.conditions.list();
                if (res.data.success && res.data.data) {
                    const all = res.data.data || [];
                    const matches = all.filter((c: any) => conditions.includes(c.slug));
                    setSelectedConditionsDetails(matches);
                }
            } catch (error) {
                console.error("Failed to sync condition details", error);
            } finally {
                setIsLoadingDetails(false);
            }
        }
        loadSelectedDetails();
    }, []); // Run once on mount

    const handleConditionSelect = (condition: any) => {
        // Condition object returned from onboard API (complete with slug, id, etc)
        // Check if already added
        if (conditions.includes(condition.slug)) {
            toast.info("Condition already added");
            return;
        }

        const newConditions = [...conditions, condition.slug];
        updateData('conditions', newConditions);
        setSelectedConditionsDetails(prev => [...prev, condition]);

        // Special toast for specific conditions 
        if (condition.slug.includes('hypertension')) {
            toast.info("We will prioritize DASH-compliant recipes for you.", { duration: 3000 });
        }
    };

    const removeCondition = (slug: string) => {
        const newConditions = conditions.filter(c => c !== slug);
        updateData('conditions', newConditions);
        setSelectedConditionsDetails(prev => prev.filter(c => c.slug !== slug));
    };

    return (
        <div style={{ padding: '0 1rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>
                Do you have any known<br />conditions?
            </h1>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                Search for medical conditions. We use official ICD-11 standards to tailor your nutrition plan.
            </p>

            <div style={{ marginBottom: '2rem' }}>
                <ConditionSearch
                    onSelect={handleConditionSelect}
                    excludeIds={conditions}
                />
            </div>

            {/* Selected Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem', minHeight: '40px' }}>
                {selectedConditionsDetails.map(c => (
                    <div
                        key={c.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: c.color ? `${c.color}15` : '#f1f5f9',
                            color: c.color || '#334155',
                            border: `1px solid ${c.color ? `${c.color}30` : '#e2e8f0'}`,
                            padding: '0.5rem 1rem',
                            borderRadius: '24px',
                            fontWeight: 600,
                            fontSize: '0.9rem'
                        }}
                    >
                        {c.label}
                        <button
                            onClick={() => removeCondition(c.slug)}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', color: 'inherit', opacity: 0.7 }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Suggestions */}
            <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Common Suggestions
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '3rem' }}>
                    {SUGGESTIONS.map((s, idx) => {
                        const IconComponent = ICON_MAP[s.icon] || Sparkles;
                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    // Trigger search via the hidden search component? 
                                    // Or more cleanly: We need to programmatically trigger the process.
                                    // But `ConditionSearch` has the logic.
                                    // Let's instantiate a manual search/onboard here.
                                    toast.promise(
                                        async () => {
                                            // 1. Search to get correct URI/details
                                            const searchRes = await api.conditions.search(s.searchTerm);
                                            if (!searchRes.data.data || searchRes.data.data.length === 0) throw new Error("Condition not found");

                                            // 2. Onboard first result
                                            const firstMatch = searchRes.data.data[0];
                                            const res = await api.conditions.onboard({
                                                icdCode: firstMatch.code,
                                                title: firstMatch.title,
                                                uri: firstMatch.uri,
                                                description: firstMatch.description || firstMatch.title
                                            });

                                            if (!res.data.success) throw new Error(res.data.error);

                                            const fullRes = await api.conditions.getById(res.data.data.id);
                                            if (fullRes.data.success) handleConditionSelect(fullRes.data.data);
                                        },
                                        {
                                            loading: `Adding ${s.title}...`,
                                            success: `${s.title} added`,
                                            error: `Failed to add ${s.title}`
                                        }
                                    );
                                }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '1.5rem',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    background: 'rgba(255,255,255,0.5)',
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.02)';
                                    e.currentTarget.style.borderColor = s.color;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                                }}
                            >
                                <IconComponent size={32} color={s.color} style={{ marginBottom: '10px' }} />
                                <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#334155' }}>{s.title}</span>
                            </button>
                        );
                    })}
                </div>
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
