'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin-api';
import styles from '@/styles/Admin.module.css';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface OverviewData {
    totalUsers: number;
    newSignups7d: number;
    newSignups30d: number;
    activeSubscriptions: number;
    totalPlans: number;
    totalRecipes: number;
    totalFeedback: number;
}

interface SignupData {
    date: string;
    count: number;
}

interface SubscriptionData {
    status: string;
    count: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function OverviewAnalyticsPage() {
    const [overview, setOverview] = useState<OverviewData | null>(null);
    const [signups, setSignups] = useState<SignupData[]>([]);
    const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
    const [days, setDays] = useState(30);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, [days]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [overviewRes, signupsRes, subsRes] = await Promise.all([
                adminApi.analytics.getOverview(),
                adminApi.analytics.getSignups(days),
                adminApi.analytics.getSubscriptions(),
            ]);

            if (overviewRes.data.success) setOverview(overviewRes.data.data);
            if (signupsRes.data.success) setSignups(signupsRes.data.data);
            if (subsRes.data.success) setSubscriptions(subsRes.data.data);
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

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Overview Analytics</h1>
                <p className={styles.pageDescription}>
                    Key metrics and trends at a glance
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

            {/* Metrics Grid */}
            {overview && (
                <div className={styles.metricsGrid}>
                    <div className={styles.metricCard}>
                        <div className={styles.metricLabel}>Total Users</div>
                        <div className={styles.metricValue}>{overview.totalUsers.toLocaleString()}</div>
                        <div className={styles.metricChange}>
                            <span className={styles.metricChangePositive}>
                                +{overview.newSignups30d} in 30 days
                            </span>
                        </div>
                    </div>

                    <div className={styles.metricCard}>
                        <div className={styles.metricLabel}>Active Subscriptions</div>
                        <div className={styles.metricValue}>{overview.activeSubscriptions.toLocaleString()}</div>
                        <div className={styles.metricChange}>
                            <span style={{ color: 'var(--admin-text-secondary)' }}>
                                {((overview.activeSubscriptions / overview.totalUsers) * 100).toFixed(1)}% of users
                            </span>
                        </div>
                    </div>

                    <div className={styles.metricCard}>
                        <div className={styles.metricLabel}>Total Meal Plans</div>
                        <div className={styles.metricValue}>{overview.totalPlans.toLocaleString()}</div>
                        <div className={styles.metricChange}>
                            <span style={{ color: 'var(--admin-text-secondary)' }}>
                                {overview.totalRecipes} recipes
                            </span>
                        </div>
                    </div>

                    <div className={styles.metricCard}>
                        <div className={styles.metricLabel}>Total Feedback</div>
                        <div className={styles.metricValue}>{overview.totalFeedback.toLocaleString()}</div>
                        <div className={styles.metricChange}>
                            <span style={{ color: 'var(--admin-text-secondary)' }}>
                                All time
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.chartsGrid}>
                {/* Signups Chart */}
                <div className={styles.chartCard}>
                    <h3 className={styles.chartTitle}>User Signups Trend</h3>
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

                {/* Subscription Distribution */}
                <div className={styles.chartCard}>
                    <h3 className={styles.chartTitle}>Subscription Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={subscriptions}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry: any) => `${entry.status}: ${((entry.percent || 0) * 100).toFixed(0)}%`}
                                nameKey="status"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                            >
                                {subscriptions.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--admin-bg)',
                                    border: '1px solid var(--admin-border)',
                                    borderRadius: '0.375rem',
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Summary Stats */}
            {overview && (
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Growth Summary</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--admin-text-secondary)', marginBottom: '0.25rem' }}>
                                User Growth (30d)
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--admin-success)' }}>
                                {((overview.newSignups30d / overview.totalUsers) * 100).toFixed(1)}%
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--admin-text-secondary)', marginBottom: '0.25rem' }}>
                                Conversion Rate
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--admin-primary)' }}>
                                {((overview.activeSubscriptions / overview.totalUsers) * 100).toFixed(1)}%
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--admin-text-secondary)', marginBottom: '0.25rem' }}>
                                Plans per User
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--admin-warning)' }}>
                                {(overview.totalPlans / overview.totalUsers).toFixed(1)}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--admin-text-secondary)', marginBottom: '0.25rem' }}>
                                Feedback Rate
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--admin-error)' }}>
                                {((overview.totalFeedback / overview.totalUsers) * 100).toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
