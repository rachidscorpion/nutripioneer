'use client';
import { motion } from 'framer-motion';
import styles from '@/styles/Timeline.module.css';
import MealCard from '@/components/cards/MealCard';
import WorkoutCard from '@/components/cards/WorkoutCard';


function formatTime(time24: string) {
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours, 10);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${suffix}`;
}

export default function TimelineFeed({ plan, nutritionLimits }: { plan: any, nutritionLimits?: any }) {
    return (
        <div className={styles.timelineContainer}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                {/* Breakfast */}
                <div className={styles.feedItem}>
                    <div className={`${styles.timelineDot} ${styles.dotBlue}`} />
                    <div className={styles.timeLabel}>
                        {/* Use 12-hour format manually or just display what's in DB for now (user stores 24h, let's format it nicely?) 
                            The plan stores "08:00", we want "08:00 AM". 
                            I'll just assume for MVP we display the string or simple formatting.
                            The previous code had "08:00 AM".
                            Let's format 24h string to 12h.
                        */}
                        {formatTime(plan.breakfastTime || "08:00")}
                    </div>
                    <MealCard
                        meal={plan.breakfast}
                        type="breakfast"
                        planId={plan.id}
                        userId={plan.userId}
                        status={plan.breakfastStatus}
                        nutritionLimits={nutritionLimits}
                    />
                </div>

                {/* Workout */}
                <div className={styles.feedItem}>
                    <div className={`${styles.timelineDot} ${styles.dotPurple}`} />
                    <div className={styles.timeLabel}>
                        {formatTime(plan.workoutTime || "10:00")}
                    </div>
                    <WorkoutCard />
                </div>

                {/* Lunch */}
                <div className={styles.feedItem}>
                    <div className={`${styles.timelineDot} ${styles.dotEmerald}`} />
                    <div className={styles.timeLabel}>
                        {formatTime(plan.lunchTime || "13:00")}
                    </div>
                    <MealCard
                        meal={plan.lunch}
                        type="lunch"
                        planId={plan.id}
                        userId={plan.userId}
                        status={plan.lunchStatus}
                        nutritionLimits={nutritionLimits}
                    />
                </div>

                {/* Dinner */}
                <div className={styles.feedItem}>
                    <div className={`${styles.timelineDot} ${styles.dotAmber}`} />
                    <div className={styles.timeLabel}>
                        {formatTime(plan.dinnerTime || "18:00")}
                    </div>
                    <MealCard
                        meal={plan.dinner}
                        type="dinner"
                        planId={plan.id}
                        userId={plan.userId}
                        status={plan.dinnerStatus}
                        nutritionLimits={nutritionLimits}
                    />
                </div>
            </motion.div>
        </div>
    );
}
