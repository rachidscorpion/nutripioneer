'use client';

import { useOnboardingStore } from '@/store/useOnboardingStore';
import styles from '@/styles/Onboarding.module.css';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { getServerSessionAction } from '@/lib/auth-actions';
import LoginButton from '@/components/buttons/LoginButton';
import NPLoader2 from '@/components/loader/Loader2';

export default function WelcomeStep() {
    const router = useRouter();
    const { updateData, nextStep, reset } = useOnboardingStore();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [error, setError] = useState<string | null>(null);
    const [pendingVerification, setPendingVerification] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [resendCooldown, setResendCooldown] = useState(0);


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleLogout = async () => {
        try {
            await api.auth.logout();
            reset();
            window.location.href = '/onboarding';
        } catch (e) {
            console.error("Logout failed", e);
        }
    };

    const checkUserAndNavigate = useCallback(async () => {
        try {
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
                            } else {
                                nextStep();
                            }
                        } catch (e) {
                            nextStep();
                        }
                    } else {
                        // User exists but maybe profile incomplete
                        nextStep();
                    }
                } catch (e: any) {
                    // If profile doesn't exist (404), user is new - continue onboarding
                    if (e.response?.status === 404) {
                        nextStep();
                    } else {
                        // Other errors - try logging out
                        console.error("Failed to fetch user profile", e);
                        try {
                            await api.auth.logout();
                        } catch (logoutErr) {
                            console.error("Logout failed", logoutErr);
                        }
                        reset();
                    }
                }
            }
        } catch (error) {
            console.error("Error checking user status:", error);
        } finally {
            setLoading(false);
        }
    }, [updateData, nextStep, router, reset]);

    useEffect(() => {
        setLoading(true);
        checkUserAndNavigate();
    }, [checkUserAndNavigate]); // Run once on mount

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await api.auth.signInSocial(provider, '/onboarding');

            if (data?.url) {
                window.location.href = data.url;
            } else {
                setError('Failed to get redirect URL from server. Please try again.');
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

        const trimmedEmail = email.trim().toLowerCase();

        try {
            if (isSignUp) {
                if (!firstName || !lastName) {
                    setError('First name and last name are required');
                    setLoading(false);
                    return;
                }
                const fullName = `${firstName.trim()} ${lastName.trim()}`;
                try {
                    await api.auth.register({
                        email: trimmedEmail,
                        password,
                        name: fullName,
                    });
                } catch (regErr: any) {
                    // Handle "user already exists" gracefully
                    const msg = regErr.response?.data?.message || regErr.message || '';
                    if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exist') || regErr.response?.status === 422 || regErr.response?.status === 409) {
                        setError('An account with this email already exists. Please sign in instead.');
                        setLoading(false);
                        return;
                    }
                    throw regErr;
                }

                // Show OTP verification screen instead of auto-login
                setPendingVerification(true);
                startResendCooldown();

            } else {
                await api.auth.login({
                    email: trimmedEmail,
                    password,
                });

                // Login successful (cookie set)
                await checkUserAndNavigate();
            }
        } catch (err: any) {
            console.error("Auth error", err);
            setError(err.response?.data?.message || err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const startResendCooldown = () => {
        setResendCooldown(60);
        const interval = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleVerifyOtp = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter the full 6-digit code.');
            return;
        }
        setError(null);
        setLoading(true);
        try {
            await api.auth.verifyOtp(email, otpString);
            // After verification, auto-login
            await api.auth.login({ email, password });
            await checkUserAndNavigate();
        } catch (err: any) {
            console.error('OTP verify error', err);
            setError(err.response?.data?.message || 'Invalid or expired code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        setError(null);
        try {
            await api.auth.sendOtp(email, 'email-verification');
            startResendCooldown();
        } catch (err: any) {
            setError('Failed to resend code. Please try again.');
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) value = value.slice(-1);
        if (value && !/^\d$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        // Auto-focus next input
        if (value && index < 5) {
            const next = document.getElementById(`otp-${index + 1}`);
            next?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prev = document.getElementById(`otp-${index - 1}`);
            prev?.focus();
        }
    };

    return (
        <div style={{ padding: '0 0.5rem', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
            {loading && !pendingVerification ? <NPLoader2 size={40} /> :
            pendingVerification ? (
                <div style={{ padding: '0 0.5rem', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
                    <h1 className={styles.welcomeHeading}>Verify Your Email</h1>
                    <p className={styles.welcomeSub}>
                        We sent a 6-digit code to <strong style={{ color: '#61d588' }}>{email}</strong>
                    </p>

                    {error && (
                        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', textAlign: 'left' }}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', margin: '2rem 0' }}>
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                id={`otp-${i}`}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                style={{
                                    width: '48px', height: '56px', textAlign: 'center',
                                    fontSize: '1.5rem', fontWeight: 700,
                                    borderRadius: '0.5rem', border: digit ? '2px solid #61d588' : '1px solid #cbd5e1',
                                    backgroundColor: '#ffffff', color: '#1e293b',
                                    outline: 'none', transition: 'border-color 0.2s',
                                }}
                                autoFocus={i === 0}
                            />
                        ))}
                    </div>

                    <LoginButton
                        variant="success"
                        onClick={handleVerifyOtp}
                        disabled={loading || otp.join('').length !== 6}
                        isLoading={loading}
                    >
                        Verify Email
                    </LoginButton>

                    <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
                        {resendCooldown > 0 ? (
                            <span>Resend code in {resendCooldown}s</span>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                style={{ background: 'none', border: 'none', color: '#61d588', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                            >
                                Resend Code
                            </button>
                        )}
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={() => { setPendingVerification(false); setOtp(['', '', '', '', '', '']); setError(null); }}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                            ← Back to registration
                        </button>
                    </div>
                </div>
            ) :
                <div style={{ padding: '0 0.5rem', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
                    <h1 className={styles.welcomeHeading}>
                        {isSignUp ? 'Create Account' : 'Welcome Back'}
                    </h1>
                    <p className={styles.welcomeSub}>
                        {isSignUp
                            ? 'Start building your personalized health plan.'
                            : 'Sign in to continue your journey.'}
                    </p>

                    {error && (
                        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', textAlign: 'left' }}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                        {isSignUp && (
                            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '1rem', outline: 'none' }}
                                        required={isSignUp}
                                    />
                                </div>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Last Name"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '1rem', outline: 'none' }}
                                        required={isSignUp}
                                    />
                                </div>
                            </div>
                        )}
                        
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '1rem', outline: 'none' }}
                                required
                            />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '1rem', outline: 'none' }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <LoginButton
                            variant="success"
                            onClick={() => {}} // form handles this
                            disabled={loading || !email || !password || (isSignUp && (!firstName || !lastName))}
                            isLoading={loading}
                        >
                            {isSignUp ? 'Create Account' : 'Sign In'}
                        </LoginButton>
                    </form>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }}></div>
                        <span style={{ padding: '0 0.75rem', color: '#94a3b8', fontSize: '0.875rem' }}>or</span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }}></div>
                    </div>

                    {/* Social Buttons  */}
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

                    <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button 
                            type="button" 
                            onClick={() => { setIsSignUp(!isSignUp); setError(null); }} 
                            style={{ background: 'none', border: 'none', color: '#61d588', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                        >
                            {isSignUp ? 'Sign In' : 'Create Account'}
                        </button>
                    </div>

                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.4', marginTop: '2rem' }}>
                        By continuing, you agree to our{' '}
                        <Link href="/terms" style={{ color: '#61d588', textDecoration: 'underline' }}>
                            Terms of Service
                        </Link>
                        {' '}and{' '}
                        <Link href="/privacy" style={{ color: '#61d588', textDecoration: 'underline' }}>
                            Privacy Policy
                        </Link>
                        .
                    </div>
                </div>
            }
        </div>
    );
}
