'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin-api';
import styles from '@/styles/Admin.module.css';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface SignupData {
    date: string;
    count: number;
}

interface ConditionData {
    condition: string;
    count: number;
}

interface OnboardingData {
    totalUsers: number;
    withConditions: number;
    withOnboardingData: number;
    withNutritionLimits: number;
    withPlan: number;
}

export default function UsersAnalyticsPage() {
    const [signups, setSignups] = useState<SignupData[]>([]);
    const [conditions, setConditions] = useState<ConditionData[]>([]);
    const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
    const [days, setDays] = useState(30);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, [days]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [signupsRes, conditionsRes, onboardingRes] = await Promise.all([
                adminApi.analytics.getSignups(days),
                adminApi.analytics.getConditions(),
                adminApi.analytics.getOnboarding(),
            ]);

            if (signupsRes.data.success) setSignups(signupsRes.data.data);
            if (conditionsRes.data.success) setConditions(conditionsRes.data.data);
            if (onboardingRes.data.success) setOnboarding(onboardingRes.data.data);
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${styles.alert} ${styles.alertError}`}>
                {error}
            </div>
        );
    }

    const onboardingFunnelData = onboarding
        ? [
            { name: 'Total Users', value: onboarding.totalUsers },
            { name: 'With Conditions', value: onboarding.withConditions },
            { name: 'Onboarding Data', value: onboarding.withOnboardingData },
            { name: 'Nutrition Limits', value: onboarding.withNutritionLimits },
            { name: 'Active Plans', value: onboarding.withPlan },
        ]
        : [];

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>User Analytics</h1>
                <p className={styles.pageDescription}>
                    Track user growth, engagement, and onboarding metrics
                </p>
            </div>

            {/* Date Range Selector */}
            <div style={{ marginBottom: '2rem' }}>
                <label className={styles.formLabel} htmlFor="days">
                    Time Range: {days} days
                </label>
                <select
                    id="days"
                    className={styles.formInput}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    style={{ maxWidth: '200px' }}
                >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                </select>
            </div>

            <div className={styles.chartsGrid}>
                {/* Signups Chart */}
                <div className={styles.chartCard}>
                    <h3 className={styles.chartTitle}>User Signups</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={signups}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                style={{ fontSize: '12px' }}
                                stroke="var(--admin-text-secondary)"
                            />
                            <YAxis style={{ fontSize: '12px' }} stroke="var(--admin-text-secondary)" />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--admin-bg)',
                                    border: '1px solid var(--admin-border)',
                                    borderRadius: '0.375rem',
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="var(--admin-primary)"
                                strokeWidth={2}
                                dot={{ fill: 'var(--admin-primary)' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Health Conditions */}
                <div className={styles.chartCard}>
                    <h3 className={styles.chartTitle}>Top Health Conditions</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={conditions.slice(0, 10)} layout="horizontal">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" style={{ fontSize: '12px' }} stroke="var(--admin-text-secondary)" />
                            <YAxis
                                type="category"
                                dataKey="condition"
                                style={{ fontSize: '12px' }}
                                stroke="var(--admin-text-secondary)"
                                width={120}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--admin-bg)',
                                    border: '1px solid var(--admin-border)',
                                    borderRadius: '0.375rem',
                                }}
                            />
                            <Bar dataKey="count" fill="var(--admin-primary)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Onboarding Funnel */}
            {onboarding && (
                <div className={styles.chartCard}>
                    <h3 className={styles.chartTitle}>Onboarding Funnel</h3>
                    <div style={{ padding: '1rem' }}>
                        {onboardingFunnelData.map((step, index) => {
                            const percentage = ((step.value / onboarding.totalUsers) * 100).toFixed(1);
                            const previousValue = index > 0 ? onboardingFunnelData[index - 1].value : step.value;
                            const dropoff = index > 0 ? (((previousValue - step.value) / previousValue) * 100).toFixed(1) : null;

                            return (
                                <div
                                    key={step.name}
                                    style={{
                                        marginBottom: '1rem',
                                        padding: '1rem',
                                        background: 'var(--admin-bg)',
                                        border: '1px solid var(--admin-border)',
                                        borderRadius: '0.5rem',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 500 }}>{step.name}</span>
                                        <div>
                                            <span style={{ fontWeight: 600 }}>{step.value.toLocaleString()}</span>
                                            <span style={{ color: 'var(--admin-text-secondary)', marginLeft: '0.5rem' }}>
                                                ({percentage}%)
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            height: '8px',
                                            background: 'var(--admin-border)',
                                            borderRadius: '4px',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: '100%',
                                                width: `${percentage}%`,
                                                background: 'var(--admin-primary)',
                                            }}
                                        />
                                    </div>
                                    {dropoff && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-error)', marginTop: '0.25rem' }}>
                                            {dropoff}% dropoff from previous step
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
