'use client';

import { useOnboardingStore } from '@/store/useOnboardingStore';
import styles from '@/styles/Onboarding.module.css';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { getServerSessionAction } from '@/lib/auth-actions';
import LoginButton from '@/components/buttons/LoginButton';
import NPLoader2 from '@/components/loader/Loader2';

export default function WelcomeStep() {
    const router = useRouter();
    const { updateData, nextStep } = useOnboardingStore();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // Only for Sign Up
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const handleLogout = async () => {
        try {
            await api.auth.logout();
            router.push('/onboarding');
            router.refresh();
        } catch (e) {
            console.error("Logout failed", e);
        }
    };

    useEffect(() => {
        setLoading(true);
        const checkUser = async () => {
            const session = await getServerSessionAction();

            if (session?.user) {
                updateData('name', session.user.name);
                updateData('email', session.user.email);

                try {
                    const response = await api.user.getProfile();
                    // Backend returns { success: true, data: user }
                    const user = response.data?.data;
                    if (user?.conditions) {
                        try {
                            const parsedConditions = typeof user.conditions === 'string'
                                ? JSON.parse(user.conditions)
                                : user.conditions;

                            if (parsedConditions && parsedConditions.length > 0) {
                                router.push('/home'); // Redirect to home if setup is complete
                                return;
                            }
                        } catch (e) {
                        }
                    } else {
                        // User exists but maybe profile incomplete
                        nextStep();
                        setLoading(false);
                    }
                } catch (e) {
                    handleLogout();
                    console.error("Failed to fetch user profile", e);
                    nextStep();
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        checkUser();
    }, [updateData, nextStep, router]);

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        try {
            setLoading(true);
            const { data } = await api.auth.signInSocial(provider);
            if (data?.url) {
                window.location.href = data.url;
                setLoading(false);
            }
        } catch (err: any) {
            console.error("Social login error", err);
            setError(err.response?.data?.message || err.message || 'Failed to initiate social login');
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isSignUp) {
                if (!name) {
                    setError('Name is required');
                    setLoading(false);
                    return;
                }
                await api.auth.register({
                    email,
                    password,
                    name,
                });

                // After register, usually auto-login or ask to login
                // Assuming auto-login or we just try logging in:
                await api.auth.login({ email, password });

                // Trigger re-check or move next
                router.refresh(); // Refresh to catch cookie
                nextStep();

            } else {
                await api.auth.login({
                    email,
                    password,
                });

                // Login successful (cookie set)
                router.refresh();

                // Check where to go
                const session = await getServerSessionAction();
                if (session?.user) {
                    // Check profile status similar to useEffect
                    // For now just nextStep or let useEffect handle it if we trigger a re-render
                    // Since we duplicate logic, let's just rely on a page refresh or manual check
                    window.location.reload();
                }
            }
        } catch (err: any) {
            console.error("Auth error", err);
            setError(err.response?.data?.message || err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '0 0.5rem', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
            {loading ? <NPLoader2 size={40} /> :
                <div style={{ padding: '0 0.5rem', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
                    <h1 className={styles.welcomeHeading}>
                        {isSignUp ? 'Create Account' : 'Welcome Back'}
                    </h1>
                    <p className={styles.welcomeSub}>
                        {isSignUp
                            ? 'Start building your personalized health plan.'
                            : 'Sign in to continue your journey.'}
                    </p>

                    {/* Social Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                        <LoginButton
                            variant="outline"
                            onClick={() => handleSocialLogin('google')}
                            disabled={loading}
                            isLoading={loading}
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            }
                        >
                            Continue with Google
                        </LoginButton>
                        <LoginButton
                            variant="primary"
                            onClick={() => handleSocialLogin('apple')}
                            disabled={loading}
                            isLoading={loading}
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24.02-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.02 3.8-1.02 1.34 0 2.58.55 3.39 1.48-3.02 1.9-2.36 5.32.55 6.64-.17 1.05-.72 2.65-1.55 3.86-1.1 1.58-2.6 3.26-1.27 3.27ZM12.03 7.25c-.25-1.92 1.44-3.61 3.26-3.83.25 2.04-1.9 3.96-3.26 3.83Z" />
                                </svg>
                            }
                        >
                            Continue with Apple
                        </LoginButton>
                    </div>
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.4', marginTop: '2rem' }}>
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </div>
                </div>
            }
        </div>
    );
}
