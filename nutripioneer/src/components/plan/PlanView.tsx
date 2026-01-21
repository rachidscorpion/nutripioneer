'use client';
import { useState, useTransition, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from '@/styles/PlanView.module.css';
import MealCard from '@/components/cards/MealCard';
import WorkoutCard from '@/components/cards/WorkoutCard';
import TimePicker from '@/components/ui/TimePicker';
import { api } from '@/lib/api-client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2, Sparkles, AlertCircle, Search, Trash2 } from 'lucide-react';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import FoodCheckModal from '@/components/modals/FoodCheckModal';

interface PlanWithMeals {
    id: string;
    userId: string;
    date: Date;
    breakfastStatus: string;
    lunchStatus: string;
    dinnerStatus: string;
    breakfastTime: string;
    lunchTime: string;
    dinnerTime: string;
    workoutTime: string;
    breakfast: any;
    lunch: any;
    dinner: any;
    workout: any;
}

interface PlanViewProps {
    plan?: PlanWithMeals | null;
    dateString: string;
    isOwner?: boolean;
}

export default function PlanView({ plan, dateString, isOwner = false }: PlanViewProps) {
    const [y, m, d] = dateString.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [today, setToday] = useState<Date | null>(null);

    useEffect(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        setToday(d);
    }, []);

    // Local state for times to allow optimistic updates
    const [times, setTimes] = useState({
        breakfast: plan?.breakfastTime || "08:00",
        lunch: plan?.lunchTime || "13:00",
        dinner: plan?.dinnerTime || "18:00",
        workout: plan?.workoutTime || "10:00",
    });

    const handleDateChange = (newDate: Date) => {
        // optimistically navigate
        const query = `?date=${format(newDate, 'yyyy-MM-dd')}`;
        startTransition(() => {
            router.push(`/plan${query}`);
            router.refresh();
        });
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            await api.plans.generate(date.toISOString());
            toast.success('Plan generated!');
            router.refresh();
        } catch (e) {
            toast.error('Failed to generate plan');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) return;

        setIsDeleting(true);
        try {
            await api.plans.delete(date.toISOString());
            toast.success('Plan deleted');
            router.refresh();
        } catch (error) {
            console.error('Failed to delete plan', error);
            toast.error('Failed to delete plan');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleTimeChange = async (key: keyof typeof times, value: string) => {
        if (!plan) return;

        setTimes(prev => ({ ...prev, [key]: value }));

        try {
            const dbKeyMap: Record<string, string> = {
                breakfast: 'breakfastTime',
                lunch: 'lunchTime',
                dinner: 'dinnerTime',
                workout: 'workoutTime'
            };

            await api.plans.update(plan.id, {
                [dbKeyMap[key]]: value
            });
        } catch (error) {
            console.error('Failed to update time', error);
        }
    };

    const isFutureOrToday = today ? date >= today : true;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleGroup}>
                    <h1 className={styles.title}>Daily Plan</h1>
                    <p className={styles.subtitle}>Manage your schedule and meals.</p>
                </div>

                {/* Controls Group */}
                <div className={styles.controls}>
                    {plan && (
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting || isPending}
                            className={styles.deleteBtn}
                            aria-label="Delete Plan"
                            title="Delete Plan"
                        >
                            {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                    )}

                    {/* Date Navigator */}
                    <div className={styles.dateNavigator}>
                        <button
                            onClick={() => handleDateChange(subDays(date, 1))}
                            disabled={isPending}
                            className={styles.navButton}
                            aria-label="Previous Day"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className={styles.dateDisplay}>
                            <span className={styles.dayLabel}>
                                {today && isSameDay(date, today) ? 'Today' : format(date, 'EEEE')}
                            </span>
                            <span className={styles.dateValue}>
                                {format(date, 'MMMM d, yyyy')}
                            </span>
                        </div>

                        <button
                            onClick={() => handleDateChange(addDays(date, 1))}
                            disabled={isPending}
                            className={styles.navButton}
                            aria-label="Next Day"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <button
                onClick={() => setIsFoodModalOpen(true)}
                className="search-btn"
                style={{ marginBottom: '2rem' }}
            >
                <Search size={20} />
                <span className="search-text">Search Food</span>
            </button>

            {isPending && (
                <div className={styles.loadingOverlay}>
                    <div className={styles.loadingBar} />
                </div>
            )}

            {!plan ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIconWrapper}>
                        <Sparkles className={styles.emptyIcon} />
                    </div>
                    <h3 className={styles.emptyTitle}>No Plan Found</h3>

                    {isFutureOrToday ? (
                        <>
                            <p className={styles.emptyText}>
                                You haven't generated a plan for this day yet.
                                Create one now based on your preferences.
                            </p>
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className={styles.generateBtn}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} />
                                        Generate Plan
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <div className={styles.pastDateWarning}>
                            <AlertCircle size={20} />
                            <span>Cannot generate plans for past dates.</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className={styles.timelineWrapper}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={styles.timelineContent}
                    >
                        {/* Breakfast */}
                        <div className={styles.timelineItem}>
                            <div className={styles.timelineLine} />
                            <div className={`${styles.timelineDot} ${styles.dotBlue}`} />

                            <div className={styles.timelineHeader}>
                                <span className={`${styles.timeTitle} ${styles.textBlue}`}>
                                    Breakfast
                                </span>
                                <TimePicker
                                    value={times.breakfast}
                                    onChange={(val) => handleTimeChange('breakfast', val)}
                                />
                            </div>

                            <MealCard
                                meal={plan.breakfast}
                                type="breakfast"
                                planId={plan.id}
                                userId={plan.userId}
                                status={plan.breakfastStatus}
                            />
                        </div>

                        {/* Workout */}
                        <div className={styles.timelineItem}>
                            <div className={styles.timelineLine} />
                            <div className={`${styles.timelineDot} ${styles.dotPurple}`} />

                            <div className={styles.timelineHeader}>
                                <span className={`${styles.timeTitle} ${styles.textPurple}`}>
                                    Movement
                                </span>
                                <TimePicker
                                    value={times.workout}
                                    onChange={(val) => handleTimeChange('workout', val)}
                                />
                            </div>
                            <WorkoutCard />
                        </div>

                        {/* Lunch */}
                        <div className={styles.timelineItem}>
                            <div className={styles.timelineLine} />
                            <div className={`${styles.timelineDot} ${styles.dotEmerald}`} />

                            <div className={styles.timelineHeader}>
                                <span className={`${styles.timeTitle} ${styles.textEmerald}`}>
                                    Lunch
                                </span>
                                <TimePicker
                                    value={times.lunch}
                                    onChange={(val) => handleTimeChange('lunch', val)}
                                />
                            </div>
                            <MealCard
                                meal={plan.lunch}
                                type="lunch"
                                planId={plan.id}
                                userId={plan.userId}
                                status={plan.lunchStatus}
                            />
                        </div>

                        {/* Dinner */}
                        <div className={styles.timelineItem}>
                            {/* Last item usually doesn't need a connecting line, but if we want it to fade out */}
                            <div className={`${styles.timelineDot} ${styles.dotAmber}`} />

                            <div className={styles.timelineHeader}>
                                <span className={`${styles.timeTitle} ${styles.textAmber}`}>
                                    Dinner
                                </span>
                                <TimePicker
                                    value={times.dinner}
                                    onChange={(val) => handleTimeChange('dinner', val)}
                                />
                            </div>
                            <MealCard
                                meal={plan.dinner}
                                type="dinner"
                                planId={plan.id}
                                userId={plan.userId}
                                status={plan.dinnerStatus}
                            />
                        </div>
                    </motion.div>
                </div>
            )}
            <FoodCheckModal
                isOpen={isFoodModalOpen}
                onClose={() => setIsFoodModalOpen(false)}
                conditions={[]}
                planId={plan?.id}
            />
        </div>
    );
}
