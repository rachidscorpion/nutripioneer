'use client';
import { Dumbbell } from 'lucide-react';
import styles from '@/styles/Components.module.css';

export default function WorkoutCard() {
    return (
        <div className={styles.workoutCard}>
            <div className={styles.workoutIconBg}>
                <Dumbbell size={64} />
            </div>

            <div className={styles.workoutLabel}>
                Movement Snack
            </div>

            <h3 className={styles.workoutTitle}>Afternoon Walk</h3>
            <p className={styles.workoutDesc}>A gentle 15-minute walk to help regulate post-meal glucose.</p>

            <button className={styles.workoutBtn}>
                Mark Complete
            </button>
        </div>
    );
}
