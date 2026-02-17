'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/admin-api';
import styles from '@/styles/Admin.module.css';
import { Database as DatabaseIcon } from 'lucide-react';

interface ModelStats {
    model: string;
    count: number;
}

export default function DatabasePage() {
    const router = useRouter();
    const [models, setModels] = useState<string[]>([]);
    const [stats, setStats] = useState<ModelStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        try {
            setIsLoading(true);
            const response = await adminApi.db.getModels();
            if (response.data.success) {
                const modelList = response.data.data;
                setModels(modelList);

                // Get count for each model
                const statsPromises = modelList.map(async (model: string) => {
                    try {
                        const listRes = await adminApi.db.list(model, 1, 1);
                        return {
                            model,
                            count: listRes.data.pagination?.total || 0,
                        };
                    } catch {
                        return { model, count: 0 };
                    }
                });

                const statsResults = await Promise.all(statsPromises);
                setStats(statsResults);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to load models');
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
                <h1 className={styles.pageTitle}>Database</h1>
                <p className={styles.pageDescription}>
                    Browse and manage all database models and records
                </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <button
                    className={`${styles.button} ${styles.buttonPrimary}`}
                    onClick={() => router.push('/admin/database/sql')}
                >
                    <DatabaseIcon size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Open SQL Query Editor
                </button>
            </div>

            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <h3 className={styles.tableTitle}>Database Models</h3>
                </div>

                <div className={styles.tableWrapper}>
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Model</th>
                                <th>Records</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.map((stat) => (
                                <tr key={stat.model}>
                                    <td>
                                        <span style={{
                                            fontFamily: 'monospace',
                                            fontWeight: 500,
                                            textTransform: 'capitalize',
                                        }}>
                                            {stat.model}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`${styles.badge} ${styles.badgeInfo}`}>
                                            {stat.count.toLocaleString()}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className={`${styles.button} ${styles.buttonPrimary}`}
                                            onClick={() => router.push(`/admin/database/${stat.model}`)}
                                            style={{ padding: '0.5rem 1rem' }}
                                        >
                                            Browse
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={styles.card} style={{ marginTop: '2rem' }}>
                <h3 className={styles.cardTitle}>Quick Tips</h3>
                <ul style={{ paddingLeft: '1.5rem', color: 'var(--admin-text-secondary)' }}>
                    <li>Click "Browse" to view records in a table with pagination and search</li>
                    <li>Use the SQL Query Editor for complex queries or direct database operations</li>
                    <li>Be careful when deleting records - this action cannot be undone</li>
                    <li>Some models may have relations that prevent deletion if there are dependent records</li>
                </ul>
            </div>
        </div>
    );
}
