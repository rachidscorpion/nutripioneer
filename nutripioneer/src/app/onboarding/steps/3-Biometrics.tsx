'use client';

import { useOnboardingStore } from '@/store/useOnboardingStore';
import styles from '@/styles/Onboarding.module.css';
import { ArrowRight, Info } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function BiometricsStep() {
    const { biometrics, updateData, nextStep, prevStep } = useOnboardingStore();
    const [unit, setUnit] = useState<'metric' | 'imperial'>(biometrics.unit || 'metric');

    // Local state for display inputs. 
    // We initialize from the store, but keep them local to allow smooth typing.
    const [displayValues, setDisplayValues] = useState({
        age: biometrics.age?.toString() || '',
        height: biometrics.height?.toString() || '',
        heightFt: '',
        heightIn: '',
        weight: biometrics.weight?.toString() || '',
        waist: biometrics.waist?.toString() || '',
    });

    // Effect to populate imperial/metric split values correctly on mount or switch
    useEffect(() => {
        if (unit === 'metric') {
            setDisplayValues(prev => ({
                ...prev,
                height: biometrics.height?.toString() || '',
                weight: biometrics.weight?.toString() || '', // This might be stale if switch happened? No, we rely on handleInputChange updating store.
                waist: biometrics.waist?.toString() || '',
                age: biometrics.age?.toString() || '',
            }));
        } else {
            // Convert to Imperial for display
            const h = biometrics.height || 0;
            const w = biometrics.weight || 0;
            const wst = biometrics.waist || 0;

            const totalInches = h / 2.54;
            const ft = Math.floor(totalInches / 12);
            const inch = Math.round(totalInches % 12); // rounding to nearest inch for display 

            setDisplayValues(prev => ({
                ...prev,
                heightFt: h ? ft.toString() : '',
                heightIn: h ? inch.toString() : '',
                weight: w ? (w * 2.20462).toFixed(1) : '',
                waist: wst ? (wst / 2.54).toFixed(1) : '',
                age: biometrics.age?.toString() || ''
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unit]); // Intentionally only depend on unit (and implicitly biometrics values ON unit switch)


    const toggleUnit = (newUnit: 'metric' | 'imperial') => {
        setUnit(newUnit);
        updateData('biometrics', { unit: newUnit });
    };

    const handleAgeChange = (val: string) => {
        setDisplayValues(prev => ({ ...prev, age: val }));
        const num = parseFloat(val);
        if (!isNaN(num)) updateData('biometrics', { age: num });
    };

    const handleMetricChange = (field: 'height' | 'weight' | 'waist', val: string) => {
        setDisplayValues(prev => ({ ...prev, [field]: val }));
        const num = parseFloat(val);
        if (!isNaN(num)) {
            updateData('biometrics', { [field]: num });
        }
    };

    const handleImperialSimpleChange = (field: 'weight' | 'waist', val: string) => {
        setDisplayValues(prev => ({ ...prev, [field]: val }));
        const num = parseFloat(val);
        if (!isNaN(num)) {
            if (field === 'weight') {
                // lbs -> kg (round to 1 decimal)
                updateData('biometrics', { weight: parseFloat((num / 2.20462).toFixed(1)) });
            } else if (field === 'waist') {
                // in -> cm (round to 1 decimal)
                updateData('biometrics', { waist: parseFloat((num * 2.54).toFixed(1)) });
            }
        }
    };

    const handleImperialHeightChange = (type: 'ft' | 'in', val: string) => {
        const newValues = {
            ...displayValues,
            [type === 'ft' ? 'heightFt' : 'heightIn']: val
        };
        setDisplayValues(newValues);

        const ft = parseFloat(newValues.heightFt) || 0;
        const inch = parseFloat(newValues.heightIn) || 0;

        // Calculate total cm
        // (Feet * 12 + Inches) * 2.54
        const totalInches = (ft * 12) + inch;
        const cm = totalInches * 2.54;

        updateData('biometrics', { height: cm });
    };

    return (
        <div style={{ padding: '0 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                    Let's get those<br />numbers.
                </h1>

                {/* Unit Toggle */}
                <div style={{
                    background: '#f1f5f9',
                    padding: '4px',
                    borderRadius: '12px',
                    display: 'flex',
                    gap: '4px'
                }}>
                    <button
                        onClick={() => toggleUnit('metric')}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: unit === 'metric' ? '#fff' : 'transparent',
                            boxShadow: unit === 'metric' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            color: unit === 'metric' ? '#0f172a' : '#64748b',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Metric
                    </button>
                    <button
                        onClick={() => toggleUnit('imperial')}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: unit === 'imperial' ? '#fff' : 'transparent',
                            boxShadow: unit === 'imperial' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            color: unit === 'imperial' ? '#0f172a' : '#64748b',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Imperial
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div>
                    <label style={{ display: 'block', color: '#64748b', marginBottom: '0.5rem', fontWeight: 500 }}>Age</label>
                    <input
                        type="number"
                        className={styles['input-lg']}
                        placeholder="0"
                        value={displayValues.age}
                        onChange={(e) => handleAgeChange(e.target.value)}
                    />
                </div>

                {/* Gender Selection */}
                <div>
                    <label style={{ display: 'block', color: '#64748b', marginBottom: '0.5rem', fontWeight: 500 }}>Gender</label>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '4px' }}>
                        {['Male', 'Female', 'Other'].map(g => (
                            <button
                                key={g}
                                onClick={() => updateData('biometrics', { gender: g })}
                                style={{
                                    flex: 1,
                                    padding: '0.8rem 0.5rem',
                                    borderRadius: '12px',
                                    border: biometrics.gender === g ? 'none' : '1px solid #e2e8f0',
                                    background: biometrics.gender === g ? '#0f172a' : '#fff',
                                    color: biometrics.gender === g ? 'white' : '#64748b',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Height Input */}
                <div>
                    <label style={{ display: 'block', color: '#64748b', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Height {unit === 'metric' ? '(cm)' : '(ft / in)'}
                    </label>

                    {unit === 'metric' ? (
                        <input
                            type="number"
                            className={styles['input-lg']}
                            placeholder="0"
                            value={displayValues.height}
                            onChange={(e) => handleMetricChange('height', e.target.value)}
                        />
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="number"
                                className={styles['input-lg']}
                                placeholder="ft"
                                value={displayValues.heightFt}
                                onChange={(e) => handleImperialHeightChange('ft', e.target.value)}
                            />
                            <input
                                type="number"
                                className={styles['input-lg']}
                                placeholder="in"
                                value={displayValues.heightIn}
                                onChange={(e) => handleImperialHeightChange('in', e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {/* Weight Input */}
                <div>
                    <label style={{ display: 'block', color: '#64748b', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Weight {unit === 'metric' ? '(kg)' : '(lbs)'}
                    </label>
                    <input
                        type="number"
                        className={styles['input-lg']}
                        placeholder="0"
                        value={unit === 'metric' ? displayValues.weight : displayValues.weight}
                        onChange={(e) => unit === 'metric'
                            ? handleMetricChange('weight', e.target.value)
                            : handleImperialSimpleChange('weight', e.target.value)
                        }
                    />
                </div>
            </div>

            <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <label style={{ color: '#64748b', fontWeight: 500 }}>
                        Waist {unit === 'metric' ? '(cm)' : '(in)'}
                    </label>
                    <div className="tooltip-container" style={{ position: 'relative', cursor: 'help' }} title="This helps us track metabolic syndrome risk more accurately than weight alone.">
                        <Info size={16} color="#94a3b8" />
                    </div>
                </div>
                <input
                    type="number"
                    className={styles['input-lg']}
                    placeholder="Optional"
                    value={unit === 'metric' ? displayValues.waist : displayValues.waist}
                    onChange={(e) => unit === 'metric'
                        ? handleMetricChange('waist', e.target.value)
                        : handleImperialSimpleChange('waist', e.target.value)
                    }
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                    onClick={prevStep}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1rem', padding: '10px' }}
                >
                    Back
                </button>
                <button
                    className={styles['btn-primary']}
                    onClick={nextStep}
                    disabled={!biometrics.age || !biometrics.height || !biometrics.weight || !biometrics.gender}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                    Continue <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
}
