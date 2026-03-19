import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api-client';
import apiClient from '../lib/api-client';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmailScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { setTheme } = useTheme();
    const authContext = useAuth();
    const { email, password } = route.params as { email: string; password: string };

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(60);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) value = value.slice(-1);
        if (value && !/^\d$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (index: number, key: string) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            Alert.alert('Error', 'Please enter the full 6-digit code.');
            return;
        }
        setLoading(true);
        try {
            await api.auth.verifyOtp(email, otpString);

            // After verification, login
            const loginRes = await api.auth.login({ email, password });
            const sessionToken = loginRes.data?.session?.token;

            if (sessionToken) {
                // Fetch user profile
                const profileRes = await api.user.getProfile();
                const user = profileRes.data?.data;

                if (user) {
                    await authContext.login(sessionToken, user);

                    // Check if user is onboarded
                    let isOnboarded = false;
                    if (user.preferences?.theme) {
                        setTheme(user.preferences.theme);
                    }
                    if (user.conditions) {
                        const parsed = typeof user.conditions === 'string'
                            ? JSON.parse(user.conditions)
                            : user.conditions;
                        if (parsed && parsed.length > 0) {
                            isOnboarded = true;
                        }
                    }

                    if (isOnboarded) {
                        navigation.reset({ index: 0, routes: [{ name: 'Dashboard' as never }] });
                    } else {
                        navigation.reset({ index: 0, routes: [{ name: 'OnboardingConditions' as never }] });
                    }
                } else {
                    // No user data, go to onboarding
                    navigation.reset({ index: 0, routes: [{ name: 'OnboardingConditions' as never }] });
                }
            } else {
                throw new Error('No session token received');
            }
        } catch (err: any) {
            console.error('OTP verify error:', err);
            Alert.alert('Error', err.response?.data?.message || 'Invalid or expired code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        try {
            await api.auth.sendOtp(email, 'email-verification');
            setResendCooldown(60);
            Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
        } catch (err) {
            Alert.alert('Error', 'Failed to resend code. Please try again.');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="mail-open-outline" size={64} color="#61d588" />
                </View>

                <Text style={styles.title}>Verify Your Email</Text>
                <Text style={styles.subtitle}>
                    We sent a 6-digit code to{'\n'}
                    <Text style={styles.emailText}>{email}</Text>
                </Text>

                <View style={styles.otpContainer}>
                    {otp.map((digit, i) => (
                        <TextInput
                            key={i}
                            ref={(ref) => { inputRefs.current[i] = ref; }}
                            style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(i, value)}
                            onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                            keyboardType="number-pad"
                            maxLength={1}
                            autoFocus={i === 0}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.verifyButton, (loading || otp.join('').length !== 6) && styles.buttonDisabled]}
                    onPress={handleVerify}
                    disabled={loading || otp.join('').length !== 6}
                >
                    <Text style={styles.verifyButtonText}>
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.resendContainer}>
                    {resendCooldown > 0 ? (
                        <Text style={styles.resendCooldownText}>
                            Resend code in {resendCooldown}s
                        </Text>
                    ) : (
                        <TouchableOpacity onPress={handleResend}>
                            <Text style={styles.resendText}>Resend Code</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0f1e',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    iconContainer: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 8,
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 8,
    },
    emailText: {
        color: '#61d588',
        fontWeight: '600',
    },
    otpContainer: {
        flexDirection: 'row',
        gap: 10,
        marginVertical: 32,
    },
    otpInput: {
        width: 48,
        height: 56,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
    },
    otpInputFilled: {
        borderColor: '#61d588',
        borderWidth: 2,
    },
    verifyButton: {
        backgroundColor: '#61d588',
        width: '100%',
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#61d588',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    verifyButtonText: {
        color: '#0a0f1e',
        fontSize: 18,
        fontWeight: '700',
    },
    resendContainer: {
        marginTop: 24,
    },
    resendCooldownText: {
        color: '#64748b',
        fontSize: 14,
    },
    resendText: {
        color: '#61d588',
        fontSize: 14,
        fontWeight: '700',
    },
    backButton: {
        marginTop: 16,
    },
    backText: {
        color: '#94a3b8',
        fontSize: 14,
    },
});
