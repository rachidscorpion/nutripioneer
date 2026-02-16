'use client';

import { useState, useEffect } from 'react';
import { OnboardingData, NutritionLimits } from '@/types/user';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, User, Settings, Heart, Utensils, Shield, Search, Trash2, CheckCircle, AlertCircle, Droplets, Activity, Moon, Sun } from 'lucide-react';
import styles from '@/styles/Profile.module.css';
import { useTheme, THEMES } from '@/context/ThemeContext';
import ConditionSearch from '@/components/conditions/ConditionSearch';
import ProGate from '@/components/pro/ProGate';

// Use loose type or interface matching API response
interface ExtendedUser {
    id: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | null;
    image?: string | null;
    conditions?: string | any;
    createdAt: string | Date;
    subscriptionStatus?: string | null;
    accounts: any[];
    sessions: any[];
}

interface ProfileEditorProps {
    user: ExtendedUser;
    initialData: OnboardingData;
}

export default function ProfileEditor({ user, initialData }: ProfileEditorProps) {
    const { theme, setTheme } = useTheme();
    const [data, setData] = useState<OnboardingData>({
        ...initialData,
        dietary: {
            ...initialData.dietary,
            favorites: initialData.dietary?.favorites ?? [],
            dislikes: initialData.dietary?.dislikes ?? [],
            allergies: initialData.dietary?.allergies ?? [],
        },
        medical: {
            ...initialData.medical,
            insulin: initialData.medical?.insulin ?? false,
            medications: initialData.medical?.medications ?? [],
        }
    });
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'biometrics' | 'conditions' | 'medical' | 'dietary' | 'settings' | 'nutrition'>('biometrics');

    // Nutrition Limits State
    const [nutritionLimits, setNutritionLimits] = useState<NutritionLimits | null>(null);
    const [isLoadingLimits, setIsLoadingLimits] = useState(true);

    const [availableConditions, setAvailableConditions] = useState<any[]>([]);
    const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
    const [loadingConditions, setLoadingConditions] = useState(true);

    // Medical Search State
    const [drugQuery, setDrugQuery] = useState('');
    const [drugResults, setDrugResults] = useState<any[]>([]);
    const [isSearchingDrug, setIsSearchingDrug] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                // Parse existing conditions from user profile if not already loaded into state
                if (user.conditions) {
                    try {
                        const parsed = typeof user.conditions === 'string' ? JSON.parse(user.conditions) : user.conditions;
                        if (Array.isArray(parsed)) setSelectedConditions(parsed);
                    } catch (e) {
                        console.error("Failed to parse user conditions", e);
                    }
                }

                const res = await api.conditions.list();
                setAvailableConditions(res.data.data || []);

                // Load Nutrition Limits
                try {
                    const limitsRes = await api.user.getNutritionLimits();
                    setNutritionLimits(limitsRes.data.data);
                } catch (e) {
                    console.error("Failed to load nutrition limits", e);
                } finally {
                    setIsLoadingLimits(false);
                }
            } catch (e) {
                console.error("Error loading conditions", e);
            } finally {
                setLoadingConditions(false);
            }
        }
        load();
    }, [user.conditions]);

    const ICON_MAP: Record<string, any> = {
        'Droplets': Droplets,
        'Heart': Heart,
        'Activity': Activity,
        'Shield': Shield,
        'AlertCircle': AlertCircle,
    };

    const toggleCondition = (slug: string) => {
        if (selectedConditions.includes(slug)) {
            setSelectedConditions(prev => prev.filter(c => c !== slug));
        } else {
            setSelectedConditions(prev => [...prev, slug]);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const finalPayload = {
                ...data,
                conditions: selectedConditions
            };

            await api.user.updateProfile(finalPayload);

            if (nutritionLimits) {
                await api.user.updateNutritionLimits(nutritionLimits);
            }

            toast.success('Profile updated successfully');
        } catch (e) {
            console.error(e);
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const updateNested = (section: keyof OnboardingData, field: string, value: any) => {
        setData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const tabs = [
        { id: 'biometrics', label: 'Body', icon: User },
        { id: 'conditions', label: 'Conditions', icon: Droplets },
        { id: 'medical', label: 'Health', icon: Heart },
        { id: 'dietary', label: 'Food', icon: Utensils },
        { id: 'nutrition', label: 'Nutrition', icon: Activity },
        { id: 'settings', label: 'Settings', icon: Settings },
    ] as const;

    // Helper to get initials
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';

    return (
        <div className={styles.container}>

            {/* Page Title */}
            <h1 className={styles.pageTitle}>My Profile</h1>
            <p className={styles.pageSubtitle}>Manage your biomarkers and preferences to keep your Nutri Pioneer accurate.</p>

            {/* Header Section */}
            <header className={styles.glassPanel}>
                <div className={styles.header}>
                    <div className={styles.avatarWrapper}>
                        {user.image ? (
                            <img src={user.image} alt={user.name || 'User'} className={styles.avatarImage} />
                        ) : (
                            <div className={styles.avatarFallback}>{initials}</div>
                        )}
                    </div>
                    <div className={styles.userInfo}>
                        <h1 className={styles.name}>{user.name || 'User'}</h1>
                        <div className={styles.emailRow}>
                            <span>{user.email}</span>
                            {user.emailVerified ? (
                                <div className={styles.verifiedBadge}>
                                    <CheckCircle size={12} strokeWidth={3} />
                                    <span>Verified</span>
                                </div>
                            ) : (
                                <div className={styles.unverifiedBadge}>
                                    <AlertCircle size={12} strokeWidth={3} />
                                    <span>Unverified</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={styles.saveBtn}
                        >
                            <Save size={18} />
                            {isSaving ? 'Updating...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Account Details Quick View */}
                <div className={styles.grid2} style={{ marginTop: '1.5rem' }}>
                    <div className={styles.infoCard}>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Account Type</span>
                            <span className={styles.infoValue}>
                                {user.subscriptionStatus === 'active' ? (
                                    <>
                                        <Shield size={14} className={styles.iconGreen} style={{ color: '#10b981' }} />
                                        <span style={{ color: '#10b981', fontWeight: 600 }}>Pro Member</span>
                                    </>
                                ) : (
                                    <>
                                        <Shield size={14} className={styles.iconBlue} />
                                        Standard
                                    </>
                                )}
                            </span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Member Since</span>
                            <span className={styles.infoValue}>
                                {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className={styles.tabContainer}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={styles.glassPanel}
                >
                    {activeTab === 'biometrics' && (
                        <div>
                            <h3 className={styles.sectionTitle}>
                                <User className={styles.iconBlue} size={24} />
                                Biometrics
                            </h3>
                            <div className={styles.grid2}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Height (cm)</label>
                                    <input
                                        type="number"
                                        value={data.biometrics.heightCm}
                                        onChange={(e) => updateNested('biometrics', 'heightCm', parseInt(e.target.value))}
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Weight (kg)</label>
                                    <input
                                        type="number"
                                        value={data.biometrics.weightKg}
                                        onChange={(e) => updateNested('biometrics', 'weightKg', parseInt(e.target.value))}
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Waist (cm)</label>
                                    <input
                                        type="number"
                                        value={data.biometrics.waistCm}
                                        onChange={(e) => updateNested('biometrics', 'waistCm', parseInt(e.target.value))}
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Gender</label>
                                    <select
                                        value={data.biometrics.gender?.toLowerCase() || 'male'}
                                        onChange={(e) => updateNested('biometrics', 'gender', e.target.value)}
                                        className={styles.input}
                                    >
                                        <option value="female">Female</option>
                                        <option value="male">Male</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'conditions' && (
                        <div>
                            <h3 className={styles.sectionTitle}>
                                <Droplets className={styles.iconBlue} size={24} />
                                Known Conditions
                            </h3>

                            <div className={styles.infoCard} style={{ marginBottom: '1.5rem' }}>
                                <label className={styles.label} style={{ marginBottom: '0.5rem', display: 'block' }}>Add a new condition</label>
                                <ConditionSearch
                                    placeholder="Search specific conditions (e.g. Type 2 Diabetes, Celiac)..."
                                    onSelect={(c) => {
                                        if (!selectedConditions.includes(c.slug)) {
                                            setSelectedConditions(prev => [...prev, c.slug]);
                                            // Add to available so it renders immediately without refetch
                                            if (!availableConditions.find(ac => ac.id === c.id)) {
                                                setAvailableConditions(prev => [...prev, c]);
                                            }
                                        } else {
                                            toast.info(`${c.label} is already selected.`);
                                        }
                                    }}
                                    excludeIds={selectedConditions}
                                />
                                <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
                                    Search for your specific medical conditions from the official ICD-11 registry.
                                </p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                {loadingConditions ? (
                                    <p className={styles.emptyStateText}>Loading conditions...</p>
                                ) : (
                                    availableConditions
                                        .filter(c => selectedConditions.includes(c.slug))
                                        .map((c) => {
                                            const IconComponent = ICON_MAP[c.icon] || AlertCircle;
                                            return (
                                                <div
                                                    key={c.id}
                                                    className={styles.infoCard}
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        textAlign: 'center',
                                                        position: 'relative',
                                                        border: `1px solid ${c.color}40`,
                                                        background: `${c.color}05`
                                                    }}
                                                >
                                                    <button
                                                        onClick={() => toggleCondition(c.slug)}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '8px',
                                                            right: '8px',
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: 'var(--muted-foreground)',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>

                                                    <IconComponent size={32} color={c.color} style={{ marginBottom: '10px' }} />
                                                    <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{c.label}</span>
                                                    {c.icdCode && (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                                                            ICD: {c.icdCode}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })
                                )}
                                {availableConditions.filter(c => selectedConditions.includes(c.slug)).length === 0 && !loadingConditions && (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                                        <p className={styles.emptyStateText}>No conditions selected yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'medical' && (
                        <div>
                            <h3 className={styles.sectionTitle}>
                                <Heart className={styles.iconRed} size={24} />
                                Medical Profile
                            </h3>
                            <div className={styles.infoCard}>
                                <div className={styles.insulinRow}>
                                    <div>
                                        <span className={styles.infoLabel} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--foreground)' }}>Insulin Dependent</span>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Do you take exogenous insulin?</div>
                                    </div>
                                    <button
                                        onClick={() => updateNested('medical', 'insulin', !data.medical.insulin)}
                                        className={`${styles.insulinToggle} ${data.medical.insulin ? styles.toggleActive : styles.toggleInactive}`}
                                    >
                                        <div className={`${styles.toggleKnob} ${data.medical.insulin ? styles.knobOn : styles.knobOff}`} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginTop: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>Current Medications</h4>

                                <div className={styles.searchContainer}>
                                    <input
                                        type="text"
                                        placeholder="Search medication..."
                                        className={styles.input}
                                        value={drugQuery}
                                        onChange={(e) => setDrugQuery(e.target.value)}
                                        onKeyDown={async (e) => {
                                            if (e.key === 'Enter') {
                                                setIsSearchingDrug(true);
                                                try {
                                                    const res = await api.drugs.search(drugQuery);
                                                    setDrugResults(res.data.results);
                                                } finally {
                                                    setIsSearchingDrug(false);
                                                }
                                            }
                                        }}
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        className={styles.saveBtn}
                                        style={{ width: 'auto', padding: '0 1rem' }}
                                        onClick={async () => {
                                            setIsSearchingDrug(true);
                                            try {
                                                const res = await api.drugs.search(drugQuery);
                                                setDrugResults(res.data.results);
                                            } finally {
                                                setIsSearchingDrug(false);
                                            }
                                        }}
                                        disabled={isSearchingDrug}
                                    >
                                        <Search size={16} />
                                    </button>
                                </div>

                                {drugResults.length > 0 && (
                                    <div className={styles.searchResultsDropdown}>
                                        {drugResults.map((drug, i) => (
                                            <button
                                                key={i}
                                                className={styles.searchResultBtn}
                                                onClick={async () => {
                                                    // Add drug
                                                    try {
                                                        const details = await api.drugs.details(drug.name, drug.rxcui || '');
                                                        // existing check
                                                        if (!data.medical.medications.find((m: any) => m.name === details.data.name)) {
                                                            const newMeds = [...(data.medical.medications || []), details.data];
                                                            updateNested('medical', 'medications', newMeds);
                                                        }
                                                        setDrugQuery('');
                                                        setDrugResults([]);
                                                    } catch (e) {
                                                        toast.error('Failed to add medication');
                                                    }
                                                }}
                                            >
                                                {drug.name}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className={styles.medicationList}>
                                    {data.medical.medications?.map((med: any, idx: number) => (
                                        <div key={idx} className={styles.medicationItem}>
                                            <div>
                                                <div className={styles.medicationName}>{med.name}</div>
                                                {med.ingredients && (
                                                    <div className={styles.medicationIngredients}>
                                                        {Array.isArray(med.ingredients) ? med.ingredients.join(', ') : med.ingredients}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newMeds = data.medical.medications.filter((_: any, i: number) => i !== idx);
                                                    updateNested('medical', 'medications', newMeds);
                                                }}
                                                className={styles.deleteBtn}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!data.medical.medications || data.medical.medications.length === 0) && (
                                        <p className={styles.emptyStateText}>No medications listed.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'dietary' && (
                        <div>
                            <h3 className={styles.sectionTitle}>
                                <Utensils className={styles.iconOrange} size={24} />
                                Dietary Preferences
                            </h3>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Dislikes (comma separated)</label>
                                    <input
                                        type="text"
                                        value={data.dietary.dislikes.join(', ')}
                                        onChange={(e) => updateNested('dietary', 'dislikes', e.target.value.split(',').map(s => s.trim()))}
                                        className={styles.input}
                                        placeholder="e.g. Cilantro, Mushrooms"
                                    />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Allergies (comma separated)</label>
                                    <input
                                        type="text"
                                        value={data.dietary.allergies.join(', ')}
                                        onChange={(e) => updateNested('dietary', 'allergies', e.target.value.split(',').map(s => s.trim()))}
                                        className={styles.input}
                                        placeholder="e.g. Peanuts, Shellfish"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'nutrition' && (
                        <ProGate
                            isPro={user.subscriptionStatus === 'active'}
                            feature="Nutrition Limits"
                            description="Customize your daily calorie and nutrient targets based on your dietitian's recommendations"
                            benefits={[
                                "Override AI-generated limits",
                                "Set custom min/max values for all nutrients",
                                "Adjust targets based on medical advice"
                            ]}
                            mode="readonly"
                        >
                            <div>
                                <h3 className={styles.sectionTitle}>
                                    <Activity className={styles.iconBlue} size={24} />
                                    Nutrition Limits
                                </h3>

                                <div className={styles.infoCard} style={{ marginBottom: '1.5rem', borderColor: 'var(--primary-blue-alpha)' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: 'var(--blue-50)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Shield size={16} className={styles.iconBlue} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>Medical Nutrition Therapy</h4>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', lineHeight: '1.4' }}>
                                                Got nutrition limits from your physitian? You can update them here. Any updates here will be used by our AI to ensure your meal plans are safe.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {isLoadingLimits ? (
                                    <p className={styles.emptyStateText}>Loading limits...</p>
                                ) : !nutritionLimits ? (
                                    <div className={styles.infoCard}>
                                        <p className={styles.emptyStateText}>No nutrition limits generated yet. Complete your profile to generate them.</p>
                                    </div>
                                ) : (
                                    <div className={styles.grid2}>
                                        {/* Calories */}
                                        <div className={styles.infoCard} style={{ gridColumn: '1/-1' }}>
                                            <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                Daily Calories
                                            </h4>
                                            <div className={styles.grid2}>
                                                <div className={styles.fieldGroup}>
                                                    <label className={styles.label}>Minimum (kcal)</label>
                                                    <input
                                                        type="number"
                                                        value={nutritionLimits.daily_calories.min}
                                                        onChange={(e) => setNutritionLimits({
                                                            ...nutritionLimits,
                                                            daily_calories: { ...nutritionLimits.daily_calories, min: parseInt(e.target.value) }
                                                        })}
                                                        className={styles.input}
                                                    />
                                                </div>
                                                <div className={styles.fieldGroup}>
                                                    <label className={styles.label}>Maximum (kcal)</label>
                                                    <input
                                                        type="number"
                                                        value={nutritionLimits.daily_calories.max}
                                                        onChange={(e) => setNutritionLimits({
                                                            ...nutritionLimits,
                                                            daily_calories: { ...nutritionLimits.daily_calories, max: parseInt(e.target.value) }
                                                        })}
                                                        className={styles.input}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Nutrients */}
                                        {Object.entries(nutritionLimits.nutrients).map(([key, limit]) => {
                                            // Skip if it doesn't have min/max
                                            if (limit.max === undefined && limit.min === undefined) return null;

                                            return (
                                                <div key={key} className={styles.infoCard}>
                                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {limit.label || key} <span style={{ fontSize: '0.8em', color: 'var(--muted-foreground)' }}>({limit.unit})</span>
                                                    </h4>
                                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                                        {limit.min !== undefined && (
                                                            <div className={styles.fieldGroup} style={{ flex: 1 }}>
                                                                <label className={styles.label}>Min</label>
                                                                <input
                                                                    type="number"
                                                                    value={limit.min}
                                                                    onChange={(e) => setNutritionLimits({
                                                                        ...nutritionLimits,
                                                                        nutrients: {
                                                                            ...nutritionLimits.nutrients,
                                                                            [key]: { ...limit, min: parseInt(e.target.value) }
                                                                        }
                                                                    })}
                                                                    className={styles.input}
                                                                />
                                                            </div>
                                                        )}
                                                        {limit.max !== undefined && (
                                                            <div className={styles.fieldGroup} style={{ flex: 1 }}>
                                                                <label className={styles.label}>Max</label>
                                                                <input
                                                                    type="number"
                                                                    value={limit.max}
                                                                    onChange={(e) => setNutritionLimits({
                                                                        ...nutritionLimits,
                                                                        nutrients: {
                                                                            ...nutritionLimits.nutrients,
                                                                            [key]: { ...limit, max: parseInt(e.target.value) }
                                                                        }
                                                                    })}
                                                                    className={styles.input}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </ProGate>
                    )}

                    {activeTab === 'settings' && (
                        <div className={styles.preferencesSection}>
                            <h3 className={styles.sectionTitle}>
                                <Settings className={styles.iconBlue} size={24} />
                                App Preferences
                            </h3>

                            <div style={{ marginBottom: '2rem' }}>
                                <div className={styles.infoLabel} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '1rem' }}>
                                    Color Theme
                                </div>

                                <div className={styles.grid2} style={{ gap: '1.5rem', alignItems: 'start' }}>
                                    {/* Light Themes */}
                                    <div>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Light Themes</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                                            {THEMES.filter(t => t.type === 'light').map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setTheme(t.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        border: theme === t.id ? '2px solid var(--primary-blue)' : '1px solid var(--border-subtle)',
                                                        background: 'var(--bg-white)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: t.color, border: '1px solid var(--border-subtle)' }} />
                                                    <span style={{ fontSize: '0.9rem', fontWeight: theme === t.id ? 600 : 400, color: 'var(--foreground)' }}>
                                                        {t.label}
                                                    </span>
                                                    {theme === t.id && <CheckCircle size={14} className={styles.iconBlue} style={{ marginLeft: 'auto' }} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Dark Themes */}
                                    <div>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Dark Themes</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                                            {THEMES.filter(t => t.type === 'dark').map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setTheme(t.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        border: theme === t.id ? '2px solid var(--primary-blue)' : '1px solid var(--border-subtle)',
                                                        background: 'var(--bg-white)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: t.color, border: '1px solid var(--border-subtle)' }} />
                                                    <span style={{ fontSize: '0.9rem', fontWeight: theme === t.id ? 600 : 400, color: 'var(--foreground)' }}>
                                                        {t.label}
                                                    </span>
                                                    {theme === t.id && <CheckCircle size={14} className={styles.iconBlue} style={{ marginLeft: 'auto' }} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </motion.div>
            </AnimatePresence>
        </div>
    );
}
