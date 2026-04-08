'use client';

import React from 'react';
import { Flame, Activity, Zap } from 'lucide-react';
import styles from '@/styles/NutrientStatsBar.module.css';

interface NutrientStatsBarProps {
    plan: any;
}

export default function NutrientStatsBar({ plan }: NutrientStatsBarProps) {
    if (!plan) return null;

    const meals = [plan.breakfast, plan.lunch, plan.dinner].filter(Boolean);

    const totals = meals.reduce((acc, meal) => {
        acc.calories += (meal.calories || 0);
        acc.protein += (meal.protein || 0);
        acc.carbs += (meal.carbs || 0);
        return acc;
    }, { calories: 0, protein: 0, carbs: 0 });

    const stats = [
        { label: 'Calories', value: `${Math.round(totals.calories)} kcal`, icon: Flame, color: '#ef4444' },
        { label: 'Protein', value: `${Math.round(totals.protein)}g`, icon: Activity, color: '#10b981' },
        { label: 'Carbs', value: `${Math.round(totals.carbs)}g`, icon: Zap, color: '#3b82f6' },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.bar}>
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <React.Fragment key={stat.label}>
                            <div className={styles.statItem}>
                                <div 
                                    className={styles.iconContainer}
                                    style={{ backgroundColor: `${stat.color}1A` }}
                                >
                                    <Icon size={20} color={stat.color} strokeWidth={2.5} />
                                </div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statValue}>{stat.value}</span>
                                    <span className={styles.statLabel}>{stat.label}</span>
                                </div>
                            </div>
                            {index < stats.length - 1 && (
                                <div className={styles.divider} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
