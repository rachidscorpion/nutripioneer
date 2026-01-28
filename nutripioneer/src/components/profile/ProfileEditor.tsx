'use client';

import { useState, useEffect } from 'react';
import { OnboardingData } from '@/types/user';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, User, Settings, Heart, Utensils, Shield, Search, Trash2, CheckCircle, AlertCircle, Droplets, Activity, Moon, Sun } from 'lucide-react';
import styles from '@/styles/Profile.module.css';
import { useTheme } from '@/context/ThemeContext';

// Use loose type or interface matching API response
interface ExtendedUser {
    id: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | null;
    image?: string | null;
    conditions?: string | any;
    createdAt: string | Date;
    accounts: any[];
    sessions: any[];
}

interface ProfileEditorProps {
    user: ExtendedUser;
    initialData: OnboardingData;
}

export default function ProfileEditor({ user, initialData }: ProfileEditorProps) {
    const { theme, toggleTheme } = useTheme();
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
    const [activeTab, setActiveTab] = useState<'biometrics' | 'conditions' | 'medical' | 'dietary' | 'settings'>('biometrics');

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
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
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
                                <Shield size={14} className={styles.iconBlue} />
                                Standard
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
                            <div className={styles.grid2}>
                                {loadingConditions ? (
                                    <p className={styles.emptyStateText}>Loading...</p>
                                ) : (
                                    availableConditions.map((c) => {
                                        const isSelected = selectedConditions.includes(c.slug);
                                        const IconComponent = ICON_MAP[c.icon] || AlertCircle;
                                        return (
                                            <button
                                                key={c.id}
                                                onClick={() => toggleCondition(c.slug)}
                                                className={`${styles.conditionBtn} ${isSelected ? styles.conditionBtnSelected : ''}`}
                                                style={{
                                                    borderColor: isSelected ? c.color : undefined,
                                                    background: isSelected ? `${c.color}10` : undefined,
                                                }}
                                            >
                                                <IconComponent size={32} color={c.color} style={{ marginBottom: '10px' }} />
                                                <span className={styles.conditionLabel}>{c.label}</span>
                                            </button>
                                        );
                                    })
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

                    {activeTab === 'settings' && (
                        <div className={styles.preferencesSection}>
                            <h3 className={styles.sectionTitle}>
                                <Settings className={styles.iconBlue} size={24} />
                                App Preferences
                            </h3>

                            <div className={styles.switchRow}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {theme === 'dark' ? <Moon size={20} className={styles.iconBlue} /> : <Sun size={20} className={styles.iconOrange} />}
                                    <div>
                                        <span className={styles.infoLabel} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--foreground)' }}>
                                            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                        </span>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                            Adjust the appearance of the application
                                        </div>
                                    </div>
                                </div>

                                <button
                                    className={styles.switchGeneric}
                                    onClick={toggleTheme}
                                    data-state={theme === 'dark' ? 'on' : 'off'}
                                    aria-label="Toggle theme"
                                >
                                    <span className={styles.switchHandle} />
                                </button>
                            </div>
                        </div>
                    )}

                </motion.div>
            </AnimatePresence>
        </div>
    );
}
