'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Loader2, Plus, Check } from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import debounce from 'lodash.debounce';

interface ConditionSearchProps {
    onSelect: (condition: any) => void;
    placeholder?: string;
    excludeIds?: string[]; // IDs/Slugs to exclude from results (already selected)
}

export default function ConditionSearch({ onSelect, placeholder = "Search for a condition (e.g. Diabetes)...", excludeIds = [] }: ConditionSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isOnboarding, setIsOnboarding] = useState<string | null>(null); // ID of condition being onboarded
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const performSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setIsSearching(true);
        setIsOpen(true);
        try {
            const res = await api.conditions.search(searchQuery);
            if (res.data.success && res.data.data) {
                setResults(res.data.data);
            } else {
                setResults([]);
            }
        } catch (error) {
            console.error("Search failed", error);
            // Don't toast on every keypress error to avoid spam
        } finally {
            setIsSearching(false);
        }
    };

    // Debounce the search
    // eslint-disable-next-line
    const debouncedSearch = useCallback(
        debounce((q: string) => performSearch(q), 500),
        []
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        debouncedSearch(val);
    };

    const handleSelect = async (result: any) => {
        setIsOnboarding(result.id); // result.id from ICD search is the URI or temporary ID
        try {
            // Check if already selected in parent
            if (excludeIds.includes(result.code) || excludeIds.includes(result.id)) {
                toast.error("Condition already selected");
                return;
            }

            // Onboard the condition
            const onboardRes = await api.conditions.onboard({
                icdCode: result.code,
                title: result.title,
                uri: result.uri,
                description: result.description || result.title // Fallback
            });

            if (onboardRes.data.success && onboardRes.data.data) {
                const condition = onboardRes.data.data; // This might be { id: ..., isNew: ... } ? 
                // The API controller returns { success: true, data: { id, message, isNew } }
                // BUT we need the FULL condition object to display it immediately.
                // Re-fetch or check if the API returns the full object.
                // Checking controller: It returns `data: { id: condition.id, message: ..., isNew: ... }`

                // We need to fetch the full condition details to pass back to parent for display
                // Or update the controller to return the full object.
                // For now, let's fetch it by ID.
                const fullConditionRes = await api.conditions.getById(condition.id);

                if (fullConditionRes.data.success) {
                    onSelect(fullConditionRes.data.data);
                    toast.success("Condition added successfully");
                    setQuery('');
                    setResults([]);
                    setIsOpen(false);
                } else {
                    toast.error("Failed to retrieve condition details");
                }

            } else {
                toast.error(onboardRes.data.error || "Failed to onboard condition");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while adding the condition");
        } finally {
            setIsOnboarding(null);
        }
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.2s'
            }}>
                <Search size={20} color="#94a3b8" style={{ marginRight: '0.75rem' }} />
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    style={{
                        border: 'none',
                        outline: 'none',
                        width: '100%',
                        fontSize: '1rem',
                        color: '#1e293b'
                    }}
                    onFocus={() => {
                        if (query.trim().length > 0) setIsOpen(true);
                    }}
                />
                {isSearching && <Loader2 size={18} className="animate-spin" color="#94a3b8" />}
            </div>

            {isOpen && query.trim().length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '110%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0',
                    zIndex: 50,
                    maxHeight: '300px',
                    overflowY: 'auto',
                    padding: '0.5rem'
                }}>
                    {results.length === 0 && !isSearching ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
                            No conditions found via ICD-11
                        </div>
                    ) : (
                        results.map((item: any) => (
                            <button
                                key={item.id}
                                onClick={() => handleSelect(item)}
                                disabled={isOnboarding === item.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    border: 'none',
                                    background: 'transparent',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'background 0.1s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{ marginRight: '1rem' }}>
                                    <div style={{ fontWeight: 600, color: '#334155' }}>
                                        {item.title}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                        ICD-11: {item.code}
                                    </div>
                                </div>
                                {isOnboarding === item.id ? (
                                    <Loader2 size={16} className="animate-spin" color="#3b82f6" />
                                ) : (
                                    <Plus size={16} color="#64748b" />
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
