'use client';

import { useOnboardingStore } from '@/store/useOnboardingStore';
import styles from '@/styles/Onboarding.module.css';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import InteractiveBackground from '@/components/ui/InteractiveBackground';
import OnboardingMorph from '@/components/ui/OnboardingMorph';
import Image from 'next/image';

const STEPS = [
    { id: 1, title: 'Identity', desc: 'Create your profile.' },
    { id: 2, title: 'Anchors', desc: 'Identify your health conditions.' },
    { id: 3, title: 'Biometrics', desc: 'Let\'s get your baseline numbers.' },
    { id: 4, title: 'Medical Context', desc: 'Medications and history.' },
    { id: 5, title: 'Taste Profile', desc: 'Preferences and dislikes.' },
    { id: 6, title: 'Synthesis', desc: 'Creating your plan.' },
];

export default function OnboardingLayoutClient({ children }: { children: React.ReactNode }) {
    const { step } = useOnboardingStore();

    const morphPosition: any = {
        1: { top: '-1rem', left: '-2rem', opacity: 0.1, rotate: '-40deg' },
        2: { top: '1%', left: '70%', opacity: 0.3, rotate: '-45deg' },
        3: { top: '1%', left: '71%', opacity: 0.5, rotate: '-50deg' },
        4: { top: '1%', left: '70%', opacity: 0.7, rotate: '55deg' },
        5: { top: '7%', left: '70%', opacity: 0.9, rotate: '-60deg' },
        6: { top: '1%', left: '70%', opacity: 1, rotate: '65deg' },
    };

    return (
        <div className={styles.container} style={{ background: 'black' }} >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{ position: 'absolute', inset: 0, zIndex: -1 }}
            >
                <Image
                    src="/assets/card-background.jpg"
                    alt="Background"
                    fill
                    priority
                    quality={100}
                    style={{
                        objectFit: 'cover',
                        filter: 'blur(4px)',
                        transform: 'scale(1.05)', // Prevents edge artifacts from blur
                    }}
                />
            </motion.div>

            <motion.div
                layout
                className={styles.mainCard}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ borderRadius: 32 }}
                transition={{
                    layout: { duration: 0.2, ease: "easeInOut" },
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.2 }
                }}
            >
                {/* Left: Main Content */}
                <div className={styles.contentArea}>
                    {/* Background Image for Left Side */}
                    <div className={styles.cardBackgroundOverlay} />

                    {/* Floating Morph Shape */}
                    <motion.div initial={{
                        top: morphPosition[step].top,
                        left: morphPosition[step].left,
                        opacity: morphPosition[step].opacity,
                        rotate: morphPosition[step].rotate
                    }}
                        animate={{
                            top: morphPosition[step].top,
                            left: morphPosition[step].left,
                            opacity: morphPosition[step].opacity,
                            rotate: morphPosition[step].rotate
                        }}
                        transition={{ duration: 1, ease: 'easeInOut' }}
                        className={styles.morphContainer}
                    >
                        <OnboardingMorph currentStep={step} />
                    </motion.div>
                    <div className={styles.contentWrapper}>
                        <div className={styles.header}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }} />
                            <span className={styles.brandName}>Nutri Pioneer</span>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            {children}
                        </div>
                    </div>
                </div>

                {/* Right: Sidebar Stepper */}
                <aside className={styles.sidebar}>
                    <div className={styles.stepperContainer}>
                        {STEPS.map((s) => {
                            const isCompleted = step > s.id;
                            const isActive = step === s.id;

                            return (
                                <div key={s.id} className={styles.stepperItem}>
                                    <div className={`${styles.stepCircle} ${isCompleted ? styles.completed : ''} ${isActive ? styles.active : ''}`}>
                                        {isCompleted ? <Check size={16} /> : s.id}
                                    </div>
                                    <div className={styles.stepContent}>
                                        <div className={styles.stepTitle} style={{ opacity: isActive || isCompleted ? 1 : 0.5 }}>
                                            {s.title}
                                        </div>
                                        <div className={styles.stepDesc} style={{ opacity: isActive ? 1 : 0.5 }}>
                                            {s.desc}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>Having trouble?</div>
                        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            Feel free to skip any optional steps. We can always fill them in later.
                        </p>
                    </div>
                </aside>
            </motion.div >
        </div >
    );
}
