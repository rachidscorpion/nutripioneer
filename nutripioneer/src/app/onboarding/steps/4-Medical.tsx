'use client';

import { useOnboardingStore } from '@/store/useOnboardingStore';
import styles from '@/styles/Onboarding.module.css';
import { ArrowRight, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client'; // Import the server action


export default function MedicalStep() {
    const { medical, updateData, nextStep, prevStep } = useOnboardingStore();
    const [medInput, setMedInput] = useState('');

    const toggleInsulin = (val: boolean) => {
        updateData('medical', { insulin: val });
    };

    const addMedication = () => {
        if (medInput.trim()) {
            const newMeds = [...medical.medications, medInput.trim()];
            updateData('medical', { medications: newMeds });
            setMedInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addMedication();
        }
    };

    const removeMedication = (index: number) => {
        const newMeds = medical.medications.filter((_, i) => i !== index);
        updateData('medical', { medications: newMeds });
    };

    return (
        <div style={{ padding: '0 1rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>
                Medical Context
            </h1>
            <p style={{ color: '#64748b', marginBottom: '3rem' }}>Help us understand your current treatments.</p>

            {/* Insulin Toggle */}
            <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#334155' }}>Do you use insulin?</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => toggleInsulin(true)}
                        style={{
                            padding: '0.8rem 2rem',
                            borderRadius: '12px',
                            border: 'none',
                            background: medical.insulin ? '#0f172a' : 'rgba(255,255,255,0.5)',
                            color: medical.insulin ? 'white' : '#64748b',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: medical.insulin ? '0 4px 12px rgba(15, 23, 42, 0.2)' : 'none'
                        }}
                    >
                        Yes
                    </button>
                    <button
                        onClick={() => toggleInsulin(false)}
                        style={{
                            padding: '0.8rem 2rem',
                            borderRadius: '12px',
                            border: 'none',
                            background: !medical.insulin ? '#0f172a' : 'rgba(255,255,255,0.5)',
                            color: !medical.insulin ? 'white' : '#64748b',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: !medical.insulin ? '0 4px 12px rgba(15, 23, 42, 0.2)' : 'none'
                        }}
                    >
                        No
                    </button>
                </div>
            </div>

            {/* Medications Tag Input */}
            <div style={{ marginBottom: '3rem' }}>
                <div style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>
                        Are you taking any medications?
                    </h2>
                    <p style={{ color: '#64748b', marginBottom: '1rem' }}>We check for food-drug interactions.</p>

                    <DrugSearch />
                </div>
            </div>
            <div style={{ color: '#64748b', textAlign: 'center', fontSize: '0.8rem', marginBottom: '1rem' }}>
                "Nutri Pioneer uses publicly available data from the U.S. National Library of Medicine (NLM), National Institutes of Health, Department of Health and Human Services; NLM is not responsible for the product and does not endorse or recommend this or any other product."
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

function DrugSearch() {
    const { medical, updateData } = useOnboardingStore();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length < 2) {
                setResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const res = await api.drugs.search(query);
                // The backend returns { results: [{ name: ... }] }
                setResults(res.data?.results || []);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const addDrug = async (drugName: string, rxcui: string) => {
        setQuery('');
        setResults([]);
        setLoadingDetails(true);
        try {
            const res = await api.drugs.details(drugName, rxcui);
            // res.data is DrugDetails
            if (res.data) {
                const newMedication = res.data;
                // Check if already added
                if (!medical.medications.some(m => m.openfda_rxcui === newMedication.openfda_rxcui)) {
                    updateData('medical', {
                        medications: [...medical.medications, newMedication]
                    });
                    toast.success(`Added ${newMedication.name}`);
                } else {
                    toast.info(`${newMedication.name} is already added.`);
                }
            }
        } catch (err) {
            toast.error("Failed to fetch drug details.");
            console.error(err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const removeDrug = (rxcui: string) => {
        const filtered = medical.medications.filter(m => m.rxnorm_rxcui !== rxcui);
        updateData('medical', { medications: filtered });
    };

    return (
        <div>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Search for medication (e.g. Aspirin)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '1rem',
                        outline: 'none',
                    }}
                />
                {(isSearching || loadingDetails) && (
                    <div style={{ position: 'absolute', right: '1rem', top: '1rem', color: '#94a3b8' }}>
                        Loading...
                    </div>
                )}

                {results.length > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0 0 12px 12px',
                        zIndex: 10,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        {results.map((r, idx) => (
                            <div
                                key={idx}
                                onClick={() => addDrug(r.name, r.rxcui)}
                                style={{
                                    padding: '0.75rem 1rem',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #f1f5f9',
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                            >
                                {r.name}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Selected Medications List */}
            {medical.medications.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {medical.medications.map((med) => (
                        <div key={med.rxnorm_rxcui} style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span>{med.name}</span>
                            <button
                                onClick={() => removeDrug(med.rxnorm_rxcui)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#1d4ed8', fontSize: '1.2rem', lineHeight: 1 }}
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
