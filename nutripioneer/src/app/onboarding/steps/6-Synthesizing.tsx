'use client';

import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Database,
    User,
    Activity,
    Utensils,
    CheckCircle,
    ScanLine,
    Leaf,
    HeartPulse,
    ChefHat,
    Loader2,
} from 'lucide-react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

// Semantic types for our log items
type LogType = 'system' | 'meal' | 'analysis' | 'success';

interface LogItem {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    type: LogType;
    timestamp: string;
}

const DUMMY_MEALS = [
    'Mediterranean Quinoa Bowl', 'Grilled Salmon with Asparagus', 'Keto Chicken Salad',
    'Vegetable Stir Fry', 'Berry Smoothie Bowl', 'Avocado Toast with Egg',
    'Lean Turkey Wrap', 'Chia Seed Pudding', 'Zucchini Noodles with Pesto',
    'Roasted Chickpea Salad', 'Cauliflower Rice Risotto', 'Grilled Lemon Herb Chicken'
];

export default function SynthesizingStep() {
    const store = useOnboardingStore();
    const router = useRouter();
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const submissionCompleteRef = useRef(false);

    // Auto-scroll to bottom of logs
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    useEffect(() => {
        const formatTime = () => {
            return new Date().toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        };

        const addLog = (title: string, subtitle: string, icon: React.ElementType, type: LogType = 'system') => {
            setLogs(prev => [
                ...prev,
                {
                    id: Math.random().toString(36).substring(7),
                    title,
                    subtitle,
                    icon,
                    type,
                    timestamp: formatTime()
                }
            ]);
        };

        const runSimulation = async () => {
            // 1. Initial System Check
            addLog('Initializing Nutri Pioneer Engine', 'Connecting to secure health nodes...', Activity);
            await new Promise(r => setTimeout(r, 800));

            // 2. Biometrics
            addLog('Analyzing Biometrics', `Processing: ${store.biometrics.gender || 'User'}, ${store.biometrics.age} yrs, ${store.biometrics.weight}kg`, User, 'analysis');
            await new Promise(r => setTimeout(r, 1000));

            // 3. Conditions
            if (store.conditions.length > 0) {
                store.conditions.forEach(c => {
                    addLog('Applying Medical constraints', `Adjusting for ${c} protocols`, HeartPulse, 'analysis');
                });
            } else {
                addLog('Health Check', 'No specific medical conditions detected', HeartPulse, 'analysis');
            }
            await new Promise(r => setTimeout(r, 800));

            // 4. Dietary
            const exclusionCount = (store.dietary.dislikes?.length || 0) + (store.medical.medications?.length ? 1 : 0);
            addLog('Configuring Dietary filters', `Applied ${exclusionCount} exclusion rules based on profile`, Leaf, 'analysis');
            await new Promise(r => setTimeout(r, 800));

            // Simulate finding 4-5 meals
            const cuisines = store.dietary.favCuisines.length > 0 ? store.dietary.favCuisines : ['Global'];
            for (let i = 0; i < 4; i++) {
                if (submissionCompleteRef.current) break;

                const meal = DUMMY_MEALS[Math.floor(Math.random() * DUMMY_MEALS.length)];
                const cuisine = cuisines[Math.floor(Math.random() * cuisines.length)];

                addLog('Candidate Recipe Found', `${meal} (${cuisine}) matched`, Utensils, 'meal');
                await new Promise(r => setTimeout(r, 800 + Math.random() * 500));
            }
        };

        const executeSubmission = async () => {
            // Run simulation and submission in parallel
            // We want the simulation to take AT LEAST some time (e.g. 6s) to feel "substantial"
            // but we don't want to wait for it before STARTING the API call.

            const minTimePromise = new Promise(resolve => setTimeout(resolve, 6000));
            const simulationPromise = runSimulation();

            const submissionAction = async () => {
                try {
                    // 1. Save Profile Base Data
                    await api.user.updateProfile({
                        name: store.name || 'Test User',
                        email: store.email,
                        conditions: store.conditions,
                        biometrics: store.biometrics,
                        medical: store.medical,
                        dietary: store.dietary
                    });

                    // 2. Generate Nutrition Limits (AI)
                    // We verify we have enough data (weight/age) before calling
                    if (store.biometrics.weight && store.biometrics.age) {
                        try {
                            const limitsRes = await api.user.generateNutritionLimits();
                            if (limitsRes.data && limitsRes.data.success && limitsRes.data.data) {
                                const limits = limitsRes.data.data;

                                addLog('AI Nutrition Engine', 'Personalized clinical limits generated', Activity, 'analysis');

                                // 3. Save Limits to DB
                                await api.user.updateNutritionLimits(limits);
                            }
                        } catch (err) {
                            console.error("AI Generation failed", err);
                            // Non-blocking error, continue to plan generation
                            addLog('AI Notice', 'Using standard guidelines (AI offline)', Activity, 'system');
                        }
                    }

                    // 4. Generate initial plan
                    await api.plans.generate(new Date().toISOString());

                    return { success: true };
                } catch (error) {
                    console.error("Onboarding submission error:", error);

                    if (error instanceof AxiosError && error.response?.status === 401) {
                        toast.error('Session expired. Please log in again.');
                        try {
                            await api.auth.logout();
                        } catch (e) {
                            console.error("Logout failed", e);
                        }
                        // Force redirect to onboarding start
                        window.location.href = '/onboarding';
                        return { success: false, handled: true };
                    }

                    toast.error('Failed to save profile. Please try again.');
                    return { success: false };
                }
            };

            // Start submission immediately
            const submissionPromise = submissionAction();

            // Wait for everything to finish
            // - Simulation must finish (so user sees all logs)
            // - Min time must pass (so it doesn't flash too fast)
            // - Submission must finish (so data is ready)
            const [_, __, result] = await Promise.all([
                simulationPromise,
                minTimePromise,
                submissionPromise
            ]);

            submissionCompleteRef.current = true;

            if (result.success) {
                addLog('Profile Successfully Created', 'Redirecting to your dashboard...', CheckCircle, 'success');
                setIsComplete(true);
                store.completeOnboarding();
                setTimeout(() => {
                    router.replace('/home');
                }, 1500);
            } else if ((result as any).handled) {
                // Error was handled (e.g. redirect), do nothing
            } else {
                addLog('Error', 'Failed to save profile. Please try again.', Activity, 'system');
            }
        };

        executeSubmission();
    }, [store, router]);

    const getIconStyles = (type: LogType) => {
        const base = {
            width: '48px', height: '48px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        };
        switch (type) {
            case 'meal': return { ...base, backgroundColor: '#ffedd5', color: '#ea580c' }; // orange-100, orange-600
            case 'analysis': return { ...base, backgroundColor: '#dbeafe', color: '#2563eb' }; // blue-100, blue-600
            case 'success': return { ...base, backgroundColor: '#d1fae5', color: '#059669' }; // emerald-100, emerald-600
            default: return { ...base, backgroundColor: '#f1f5f9', color: '#475569' }; // slate-100, slate-600
        }
    };

    return (
        <div style={{
            width: '100%', maxWidth: '48rem', margin: '0 auto', padding: '1rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '600px'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>
                    Creating Your Plan
                </h2>
                <p style={{ color: '#64748b' }}>
                    Our AI is synthesizing your biometrics, preferences, and medical data.
                </p>
            </div>

            {/* Timeline Container */}
            <div
                ref={scrollRef}
                style={{
                    width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem',
                    overflow: 'hidden', padding: '0.5rem', maxHeight: '600px',
                    maskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)'
                }}
            >
                <AnimatePresence mode='popLayout'>
                    {logs.map((log) => (
                        <motion.div
                            key={log.id}
                            layout
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            style={{
                                backgroundColor: 'white', borderRadius: '1rem', padding: '1rem',
                                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', border: '1px solid #f1f5f9',
                                display: 'flex', alignItems: 'center', gap: '1rem', width: '100%'
                            }}
                        >
                            {/* Icon Box */}
                            <div style={getIconStyles(log.type)}>
                                <log.icon size={24} strokeWidth={2} />
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <h3 style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {log.title}
                                    </h3>
                                    {log.type === 'meal' && (
                                        <span style={{
                                            backgroundColor: '#f3e8ff', color: '#7e22ce', fontSize: '0.625rem',
                                            fontWeight: 'bold', padding: '0.125rem 0.5rem', borderRadius: '0.25rem',
                                            textTransform: 'uppercase', letterSpacing: '0.05em'
                                        }}>
                                            New
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                                    <span style={{
                                        fontFamily: 'monospace', fontSize: '0.75rem', opacity: 0.7,
                                        borderRight: '1px solid #e2e8f0', paddingRight: '0.5rem', marginRight: '0.5rem'
                                    }}>
                                        {log.timestamp}
                                    </span>
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {log.subtitle}
                                    </span>
                                </div>
                            </div>

                            {/* Status Indicator (Right side) */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                                <ScanLine size={16} />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Loader at bottom if not complete */}
                {!isComplete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ display: 'flex', justifyContent: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Loader2 size={16} className="animate-spin" />
                            Processing...
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
