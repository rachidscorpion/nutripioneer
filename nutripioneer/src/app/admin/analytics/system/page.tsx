'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin-api';
import styles from '@/styles/Admin.module.css';
import {
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface SubscriptionData {
    status: string;
    count: number;
}

interface FeedbackData {
    byType: Record<string, number>;
}

interface MetricData {
    date: string;
    type: string;
    count: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function SystemAnalyticsPage() {
    const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
    const [feedback, setFeedback] = useState<FeedbackData | null>(null);
    const [metrics, setMetrics] = useState<MetricData[]>([]);
    const [days, setDays] = useState(30);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, [days]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [subsRes, feedbackRes, metricsRes] = await Promise.all([
                adminApi.analytics.getSubscriptions(),
                adminApi.analytics.getFeedback(),
                adminApi.analytics.getMetrics(days),
            ]);

            if (subsRes.data.success) setSubscriptions(subsRes.data.data);
            if (feedbackRes.data.success) setFeedback(feedbackRes.data.data);
            if (metricsRes.data.success) setMetrics(metricsRes.data.data);
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

    const subscriptionData = subscriptions.map((s: any) => ({
        status: s.status,
        count: s.count,
    }));

    const feedbackTypeData = feedback
        ? Object.entries(feedback.byType).map(([type, count]) => ({ type, count }))
        : [];

    // Group metrics by type for line chart
    const metricsByType: Record<string, any[]> = {};
    metrics.forEach((m: any) => {
        if (!metricsByType[m.type]) {
            metricsByType[m.type] = [];
        }
        metricsByType[m.type].push({ date: m.date, count: m.count });
    });

    const metricTypes = Object.keys(metricsByType);
    const colors = ['var(--admin-primary)', '#10b981', '#f59e0b', '#ef4444'];

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>System Analytics</h1>
                <p className={styles.pageDescription}>
                    Monitor subscriptions, feedback, and system metrics
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
                {/* Subscription Distribution */}
                <div className={styles.chartCard}>
                    <h3 className={styles.chartTitle}>Subscription Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={subscriptionData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry: any) => `${entry.status}: ${((entry.percent || 0) * 100).toFixed(0)}%`}
                                nameKey="status"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                            >
                                {subscriptionData.map((entry, index) => (
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

                {/* Feedback by Type */}
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

                {/* Metrics Over Time */}
                {metricTypes.length > 0 && (
                    <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
                        <h3 className={styles.chartTitle}>Metrics Over Time</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={metricsByType[metricTypes[0]] || []}>
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
                                <Legend />
                                {metricTypes.map((type, index) => (
                                    <Line
                                        key={type}
                                        type="monotone"
                                        dataKey="count"
                                        data={metricsByType[type] || []}
                                        stroke={colors[index % colors.length]}
                                        name={type}
                                        strokeWidth={2}
                                        dot={{ fill: colors[index % colors.length] }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Subscription Stats Table */}
            {subscriptions.length > 0 && (
                <div className={styles.tableContainer}>
                    <div className={styles.tableHeader}>
                        <h3 className={styles.tableTitle}>Subscription Details</h3>
                    </div>
                    <div className={styles.tableWrapper}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Count</th>
                                    <th>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subscriptions.map((sub: any) => {
                                    const total = subscriptions.reduce((sum: number, s: any) => sum + s.count, 0);
                                    const percentage = total > 0 ? ((sub.count / total) * 100).toFixed(1) : '0.0';

                                    return (
                                        <tr key={sub.status}>
                                            <td>
                                                <span
                                                    className={`${styles.badge} ${
                                                        sub.status === 'active'
                                                            ? styles.badgeSuccess
                                                            : sub.status === 'inactive'
                                                            ? styles.badgeWarning
                                                            : styles.badgeInfo
                                                    }`}
                                                >
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td>{sub.count.toLocaleString()}</td>
                                            <td>{percentage}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Feedback Stats Table */}
            {feedback && (
                <div className={styles.tableContainer} style={{ marginTop: '2rem' }}>
                    <div className={styles.tableHeader}>
                        <h3 className={styles.tableTitle}>Feedback Details</h3>
                    </div>
                    <div className={styles.tableWrapper}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(feedback.byType).map(([type, count]) => (
                                    <tr key={type}>
                                        <td>
                                            <span className={`${styles.badge} ${styles.badgeInfo}`}>{type}</span>
                                        </td>
                                        <td>{count.toLocaleString()}</td>
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
