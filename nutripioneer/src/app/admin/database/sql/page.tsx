'use client';

import { useState } from 'react';
import { adminApi } from '@/lib/admin-api';
import styles from '@/styles/Admin.module.css';
import { Play, AlertTriangle } from 'lucide-react';

interface QueryResult {
    type: 'select' | 'write';
    rows?: any[];
    rowCount?: number;
    affectedRows?: number;
}

export default function SQLQueryPage() {
    const [sql, setSql] = useState('SELECT * FROM User LIMIT 10');
    const [allowWrite, setAllowWrite] = useState(false);
    const [result, setResult] = useState<QueryResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleExecute = async () => {
        if (!sql.trim()) {
            setError('Please enter a SQL query');
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            setResult(null);

            const response = await adminApi.db.executeQuery(sql, allowWrite);
            if (response.data.success) {
                setResult(response.data.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Query execution failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleExecute();
        }
    };

    const renderResult = () => {
        if (!result) return null;

        if (result.type === 'write') {
            return (
                <div className={styles.card} style={{ marginTop: '1rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--admin-success)',
                        marginBottom: '0.5rem',
                    }}>
                        <Play size={16} />
                        <span>Query executed successfully</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--admin-text-secondary)' }}>
                        Affected rows: {result.affectedRows}
                    </div>
                </div>
            );
        }

        if (result.rows && result.rows.length > 0) {
            const columns = Object.keys(result.rows[0]);

            return (
                <div className={styles.tableContainer} style={{ marginTop: '1rem' }}>
                    <div className={styles.tableHeader}>
                        <h3 className={styles.tableTitle}>
                            Results ({result.rowCount} rows)
                        </h3>
                    </div>
                    <div className={styles.tableWrapper}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    {columns.map((col) => (
                                        <th key={col}>{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {result.rows.map((row, index) => (
                                    <tr key={index}>
                                        {columns.map((col) => (
                                            <td key={col}>
                                                {formatCellValue(row[col])}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        return (
            <div className={styles.emptyState} style={{ marginTop: '1rem' }}>
                <div className={styles.emptyStateText}>No results returned</div>
            </div>
        );
    };

    const formatCellValue = (value: any): React.ReactNode => {
        if (value === null || value === undefined) {
            return <span style={{ color: 'var(--admin-text-secondary)', fontStyle: 'italic' }}>NULL</span>;
        }
        if (typeof value === 'boolean') {
            return value.toString();
        }
        if (typeof value === 'object') {
            return <span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{JSON.stringify(value)}</span>;
        }
        if (typeof value === 'string' && value.length > 100) {
            return <span title={value}>{value.substring(0, 100)}...</span>;
        }
        return value;
    };

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>SQL Query Editor</h1>
                <p className={styles.pageDescription}>
                    Execute raw SQL queries against the database
                </p>
            </div>

            <div className={styles.card} style={{ marginBottom: '2rem' }}>
                <h3 className={styles.cardTitle}>Query</h3>

                <div className={styles.formGroup}>
                    <textarea
                        className={styles.formTextarea}
                        value={sql}
                        onChange={(e) => setSql(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="SELECT * FROM User LIMIT 10"
                        style={{ fontFamily: 'monospace', minHeight: '120px' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', marginTop: '0.5rem' }}>
                        Press Cmd/Ctrl + Enter to execute
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={allowWrite}
                            onChange={(e) => setAllowWrite(e.target.checked)}
                            style={{ cursor: 'pointer' }}
                        />
                        <span className={styles.formLabel} style={{ margin: 0 }}>
                            Allow write operations (INSERT, UPDATE, DELETE)
                        </span>
                    </label>
                </div>

                {allowWrite && (
                    <div className={`${styles.alert} ${styles.alertWarning}`}
                         style={{
                             background: '#fef3c7',
                             border: '1px solid #fde68a',
                             color: '#92400e',
                             padding: '0.75rem',
                             borderRadius: '0.375rem',
                             marginBottom: '1rem',
                             display: 'flex',
                             gap: '0.5rem',
                             alignItems: 'start',
                         }}>
                        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                        <div style={{ fontSize: '0.875rem' }}>
                            <strong>Warning:</strong> Write operations can permanently modify your database.
                            Proceed with caution and consider backing up your data first.
                        </div>
                    </div>
                )}

                <button
                    className={`${styles.button} ${styles.buttonPrimary}`}
                    onClick={handleExecute}
                    disabled={isLoading}
                >
                    <Play size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    {isLoading ? 'Executing...' : 'Execute Query'}
                </button>
            </div>

            {error && (
                <div className={`${styles.alert} ${styles.alertError}`}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {renderResult()}

            <div className={styles.card} style={{ marginTop: '2rem' }}>
                <h3 className={styles.cardTitle}>Query Examples</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                        { label: 'List all users', sql: 'SELECT * FROM User LIMIT 10' },
                        { label: 'Count users by status', sql: 'SELECT subscriptionStatus, COUNT(*) as count FROM User GROUP BY subscriptionStatus' },
                        { label: 'Recent signups', sql: 'SELECT name, email, createdAt FROM User ORDER BY createdAt DESC LIMIT 20' },
                        { label: 'Popular recipes', sql: 'SELECT r.name, COUNT(*) as planCount FROM Recipe r JOIN Plan p ON (p.breakfastId = r.id OR p.lunchId = r.id OR p.dinnerId = r.id) GROUP BY r.id ORDER BY planCount DESC LIMIT 10' },
                    ].map((example) => (
                        <div key={example.label}>
                            <button
                                className={`${styles.button} ${styles.buttonSecondary}`}
                                onClick={() => setSql(example.sql)}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <span>{example.label}</span>
                                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Run</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
