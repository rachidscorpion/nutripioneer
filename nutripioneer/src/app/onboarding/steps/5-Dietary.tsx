'use client';

import { useOnboardingStore } from '@/store/useOnboardingStore';
import styles from '@/styles/Onboarding.module.css';
import { ArrowRight, ThumbsUp, ThumbsDown, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';


const COMMON_ITEMS = ['Vegetables', 'Sweets', 'Spicy', 'Seafood', 'Dairy', 'Nuts'];

export default function DietaryStep() {
    const { dietary, updateData, nextStep, prevStep } = useOnboardingStore();
    const [favInput, setFavInput] = useState('');
    const [dislikeInput, setDislikeInput] = useState('');
    const [cuisines, setCuisines] = useState<string[]>([]);


    // Tab state: 'favorites' or 'dislikes'
    const [activeTab, setActiveTab] = useState<'favorites' | 'dislikes'>('favorites');

    const addItem = (type: 'favorites' | 'dislikes', item: string) => {
        if (!item.trim()) return;
        const currentList = dietary[type];
        if (!currentList.includes(item.trim())) {
            updateData('dietary', { [type]: [...currentList, item.trim()] });
        }
    };

    const removeItem = (type: 'favorites' | 'dislikes', item: string) => {
        const currentList = dietary[type];
        updateData('dietary', { [type]: currentList.filter(i => i !== item) });
    };

    const toggleCuisine = (type: 'favCuisines' | 'dislikeCuisines', cuisine: string) => {
        const currentList = dietary[type] || [];
        if (currentList.includes(cuisine)) {
            updateData('dietary', { [type]: currentList.filter(c => c !== cuisine) });
        } else {
            updateData('dietary', { [type]: [...currentList, cuisine] });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, type: 'favorites' | 'dislikes') => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = type === 'favorites' ? favInput : dislikeInput;
            addItem(type, val);
            if (type === 'favorites') setFavInput('');
            else setDislikeInput('');
        }
    };

    useEffect(() => {
        // Hardcoded list of common cuisines to avoid API dependency for now
        const COMMON_CUISINES = [
            'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian',
            'Thai', 'Mediterranean', 'French', 'American', 'Middle Eastern',
            'Greek', 'Spanish', 'Korean', 'Vietnamese'
        ];
        setCuisines(COMMON_CUISINES);
    }, []);

    return (
        <div style={{ padding: '0 1rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>
                Taste Profile
            </h1>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0' }}>
                <button
                    onClick={() => setActiveTab('favorites')}
                    style={{
                        padding: '1rem',
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'favorites' ? '2px solid #3b82f6' : '2px solid transparent',
                        color: activeTab === 'favorites' ? '#3b82f6' : '#94a3b8',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <ThumbsUp size={20} /> Love it
                </button>
                <button
                    onClick={() => setActiveTab('dislikes')}
                    style={{
                        padding: '1rem',
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'dislikes' ? '2px solid #ef4444' : '2px solid transparent',
                        color: activeTab === 'dislikes' ? '#ef4444' : '#94a3b8',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <ThumbsDown size={20} /> Leave it
                </button>
            </div>

            <div style={{ minHeight: '300px' }}>
                {activeTab === 'favorites' ? (
                    <div>
                        <h3 style={{ marginBottom: '1rem', color: '#64748b' }}>What foods make you happy?</h3>
                        <div style={{ position: 'relative', marginBottom: '2rem' }}>
                            <input
                                type="text"
                                className={styles['input-lg']}
                                placeholder="e.g. Pasta, Sushi"
                                value={favInput}
                                onChange={(e) => setFavInput(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, 'favorites')}
                            />
                            <button
                                onClick={() => { addItem('favorites', favInput); setFavInput(''); }}
                                style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#3b82f6' }}
                            >
                                <Plus size={24} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                            {dietary.favorites.map(item => (
                                <span key={item} style={{ background: '#dbeafe', color: '#1e40af', padding: '0.4rem 0.8rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                                    {item} <X size={14} style={{ cursor: 'pointer' }} onClick={() => removeItem('favorites', item)} />
                                </span>
                            ))}
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Suggestions:</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {COMMON_ITEMS.filter(i => !dietary.favorites.includes(i)).map(item => (
                                    <button
                                        key={item}
                                        onClick={() => addItem('favorites', item)}
                                        style={{ border: '1px solid #e2e8f0', background: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', cursor: 'pointer', color: '#64748b', fontSize: '0.85rem' }}
                                    >
                                        + {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <h3 style={{ marginBottom: '1rem', color: '#64748b' }}>Favorite Cuisines</h3>

                        {/* Selected Favorite Cuisines Tags */}
                        {dietary.favCuisines && dietary.favCuisines.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                                {dietary.favCuisines.map(item => (
                                    <span key={item} style={{ background: '#dbeafe', color: '#1e40af', padding: '0.4rem 0.8rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                                        {item} <X size={14} style={{ cursor: 'pointer' }} onClick={() => toggleCuisine('favCuisines', item)} />
                                    </span>
                                ))}
                            </div>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                            {cuisines.map(cuisine => {
                                const isSelected = dietary.favCuisines?.includes(cuisine);
                                return (
                                    <button
                                        key={cuisine}
                                        onClick={() => toggleCuisine('favCuisines', cuisine)}
                                        style={{
                                            border: isSelected ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                            background: isSelected ? '#eff6ff' : 'white',
                                            color: isSelected ? '#1e40af' : '#64748b',
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '20px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {cuisine}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div>
                        <h3 style={{ marginBottom: '1rem', color: '#64748b' }}>What should we never show you?</h3>
                        <div style={{ position: 'relative', marginBottom: '2rem' }}>
                            <input
                                type="text"
                                className={styles['input-lg']}
                                placeholder="e.g. Kale, Mushrooms"
                                value={dislikeInput}
                                onChange={(e) => setDislikeInput(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, 'dislikes')}
                            />
                            <button
                                onClick={() => { addItem('dislikes', dislikeInput); setDislikeInput(''); }}
                                style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}
                            >
                                <Plus size={24} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                            {dietary.dislikes.map(item => (
                                <span key={item} style={{ background: '#fee2e2', color: '#991b1b', padding: '0.4rem 0.8rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                                    {item} <X size={14} style={{ cursor: 'pointer' }} onClick={() => removeItem('dislikes', item)} />
                                </span>
                            ))}
                        </div>

                        <h3 style={{ marginBottom: '1rem', color: '#64748b', marginTop: '2rem' }}>Disliked Cuisines</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {cuisines.map(cuisine => {
                                const isSelected = dietary.dislikeCuisines?.includes(cuisine);
                                return (
                                    <button
                                        key={cuisine}
                                        onClick={() => toggleCuisine('dislikeCuisines', cuisine)}
                                        style={{
                                            border: isSelected ? '1px solid #ef4444' : '1px solid #e2e8f0',
                                            background: isSelected ? '#fef2f2' : 'white',
                                            color: isSelected ? '#991b1b' : '#64748b',
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '20px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {cuisine}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
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
                    Synthesize <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
}
