'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin-api';
import styles from '@/styles/Admin.module.css';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
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

interface ConditionData {
    condition: string;
    count: number;
}

interface FeedbackData {
    recent: Array<{
        id: string;
        type: string;
        message: string;
        createdAt: string;
        user: {
            name: string;
            email: string;
        };
    }>;
    byType: Record<string, number>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminDashboardPage() {
    const [overview, setOverview] = useState<OverviewData | null>(null);
    const [signups, setSignups] = useState<SignupData[]>([]);
    const [conditions, setConditions] = useState<ConditionData[]>([]);
    const [feedback, setFeedback] = useState<FeedbackData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [overviewRes, signupsRes, conditionsRes, feedbackRes] = await Promise.all([
                adminApi.analytics.getOverview(),
                adminApi.analytics.getSignups(30),
                adminApi.analytics.getConditions(),
                adminApi.analytics.getFeedback(),
            ]);

            if (overviewRes.data.success) setOverview(overviewRes.data.data);
            if (signupsRes.data.success) setSignups(signupsRes.data.data);
            if (conditionsRes.data.success) setConditions(conditionsRes.data.data);
            if (feedbackRes.data.success) setFeedback(feedbackRes.data.data);
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

    const feedbackTypeData = feedback
        ? Object.entries(feedback.byType).map(([type, count]) => ({ type, count }))
        : [];

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Dashboard</h1>
                <p className={styles.pageDescription}>
                    Welcome to the admin panel. Here's what's happening with your application.
                </p>
            </div>

            {/* Metrics Grid */}
            {overview && (
                <div className={styles.metricsGrid}>
                    <div className={styles.metricCard}>
                        <div className={styles.metricLabel}>Total Users</div>
                        <div className={styles.metricValue}>{overview.totalUsers.toLocaleString()}</div>
                        <div className={styles.metricChange}>
                            <span className={styles.metricChangePositive}>
                                +{overview.newSignups7d} in last 7 days
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

            {/* Charts */}
            <div className={styles.chartsGrid}>
                {/* Signups Chart */}
                <div className={styles.chartCard}>
                    <h3 className={styles.chartTitle}>User Signups (Last 30 Days)</h3>
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

                {/* Conditions Distribution */}
                <div className={styles.chartCard}>
                    <h3 className={styles.chartTitle}>Top Health Conditions</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={conditions.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="condition"
                                style={{ fontSize: '12px' }}
                                stroke="var(--admin-text-secondary)"
                                angle={-45}
                                textAnchor="end"
                                height={100}
                            />
                            <YAxis style={{ fontSize: '12px' }} stroke="var(--admin-text-secondary)" />
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

                {/* Feedback Types */}
                <div className={styles.chartCard}>
                    <h3 className={styles.chartTitle}>Feedback by Type</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={feedbackTypeData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry: any) => `${entry.type}: ${((entry.percent || 0) * 100).toFixed(0)}%`}
                                nameKey="type"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                            >
                                {feedbackTypeData.map((entry, index) => (
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

                {/* New Signups vs Total */}
                <div className={styles.chartCard}>
                    <h3 className={styles.chartTitle}>Growth Overview</h3>
                    <div style={{ padding: '1rem' }}>
                        {overview && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--admin-text-secondary)' }}>Total Users</span>
                                    <span style={{ fontWeight: 600 }}>{overview.totalUsers.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--admin-text-secondary)' }}>New (30 days)</span>
                                    <span style={{ fontWeight: 600, color: 'var(--admin-success)' }}>
                                        +{overview.newSignups30d}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--admin-text-secondary)' }}>New (7 days)</span>
                                    <span style={{ fontWeight: 600, color: 'var(--admin-primary)' }}>
                                        +{overview.newSignups7d}
                                    </span>
                                </div>
                                <div style={{ height: '8px', background: 'var(--admin-border)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            height: '100%',
                                            width: `${(overview.newSignups30d / overview.totalUsers) * 100}%`,
                                            background: 'var(--admin-primary)',
                                        }}
                                    />
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', textAlign: 'center' }}>
                                    {((overview.newSignups30d / overview.totalUsers) * 100).toFixed(1)}% growth in 30 days
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Feedback */}
            {feedback && feedback.recent.length > 0 && (
                <div className={styles.tableContainer}>
                    <div className={styles.tableHeader}>
                        <h3 className={styles.tableTitle}>Recent Feedback</h3>
                    </div>
                    <div className={styles.tableWrapper}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>User</th>
                                    <th>Message</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {feedback.recent.slice(0, 10).map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <span className={`${styles.badge} ${styles.badgeInfo}`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td>
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{item.user?.name || 'Unknown'}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>
                                                    {item.user?.email || ''}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: '400px' }}>
                                            <div style={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {item.message}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.875rem', color: 'var(--admin-text-secondary)' }}>
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
