'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/admin-auth';
import styles from '@/styles/Admin.module.css';

export default function AdminLoginPage() {
    const router = useRouter();
    const { login } = useAdminAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(email, password);

        if (result.success) {
            window.location.href = '/admin';
        } else {
            setError(result.error || 'Login failed');
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--admin-bg)',
            padding: '1rem'
        }}>
            <div className={styles.card} style={{ maxWidth: '400px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: 'var(--admin-text-primary)',
                        marginBottom: '0.5rem'
                    }}>
                        Admin Panel
                    </h1>
                    <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--admin-text-secondary)',
                        margin: 0
                    }}>
                        Sign in to access the admin dashboard
                    </p>
                </div>

                {error && (
                    <div className={`${styles.alert} ${styles.alertError}`}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel} htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            className={styles.formInput}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                            placeholder="admin@example.com"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel} htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            className={styles.formInput}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className={`${styles.button} ${styles.buttonPrimary}`}
                        disabled={isLoading}
                        style={{ width: '100%' }}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
