import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Image,
    StatusBar,
    Alert,
    TextInput,
    KeyboardAvoidingView,
    ScrollView,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import apiClient, { api } from '../lib/api-client';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingStore } from '../store/useOnboardingStore';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigation = useNavigation();
    const updateData = useOnboardingStore(state => state.updateData);
    const { setTheme } = useTheme();
    const authContext = useAuth();

    const player = useVideoPlayer(require('../../assets/background-video-1.mp4'), player => {
        player.loop = true;
        player.muted = true;
        player.play();
    });

    useEffect(() => {
        GoogleSignin.configure({
            iosClientId: '260830587028-q0nfq6efvl8fh6s0lvdbqq2v25q3lr3g.apps.googleusercontent.com',
            webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
            offlineAccess: true,
        });
    }, []);

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);

            if (Platform.OS === 'android') {
                await GoogleSignin.hasPlayServices();
            }

            const signInResult = await GoogleSignin.signIn();
            const idToken = signInResult.data?.idToken;

            if (!idToken) {
                Alert.alert('Error', 'Failed to get Google ID token. Please try again.');
                return;
            }

            const response = await api.auth.signInWithGoogle(idToken);

            // The backend returns { success: true, user: {...}, session: { token: '...', expiresAt: '...' } }
            const sessionToken = response.data?.session?.token;
            const user = response.data?.user;

            if (sessionToken && user) {
                // Fetch full profile BEFORE setting auth state (to avoid SplashScreen race condition)
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${sessionToken}`;
                let fullUser = user;
                try {
                    const profileRes = await api.user.getProfile();
                    if (profileRes.data?.data) {
                        fullUser = profileRes.data.data;
                    }
                } catch (e: any) {
                    console.error('Error fetching profile after Google sign-in', e.message);
                }

                // Now login with the full user data (including conditions)
                await authContext.login(sessionToken, fullUser);

                if (fullUser.preferences?.theme) {
                    setTheme(fullUser.preferences.theme);
                }

                // Check if user is onboarded
                let isOnboarded = false;
                if (fullUser.conditions) {
                    const parsedConditions = typeof fullUser.conditions === 'string'
                        ? JSON.parse(fullUser.conditions)
                        : fullUser.conditions;
                    if (parsedConditions && parsedConditions.length > 0) {
                        isOnboarded = true;
                    }
                }

                if (isOnboarded) {
                    (navigation as any).reset({ index: 0, routes: [{ name: 'Dashboard' }] });
                } else {
                    updateData('name', fullUser.name || '');
                    updateData('email', fullUser.email || '');
                    (navigation as any).reset({ index: 0, routes: [{ name: 'OnboardingConditions' }] });
                }
            } else {
                console.error("No session token or user received from backend:", response.data);
                Alert.alert('Error', 'Login succeeded but session data was incomplete. Please try again.');
                setLoading(false);
                return;
            }
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                Alert.alert('Cancelled', 'Sign-in was cancelled');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                Alert.alert('In Progress', 'Sign-in is already in progress');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert('Error', 'Google Play Services not available');
            } else {
                console.error('Google Sign-In Error:', error);
                Alert.alert('Error', error.response?.data?.message || 'Sign-in failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEmailAuth = async () => {
        if (!email || !password || (isSignUp && (!firstName || !lastName))) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        const trimmedEmail = email.trim().toLowerCase();

        try {
            setLoading(true);

            let sessionToken;

            if (isSignUp) {
                try {
                    await api.auth.register({ email: trimmedEmail, password, name: fullName });
                } catch (regErr: any) {
                    const msg = regErr.response?.data?.message || regErr.message || '';
                    if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exist') || regErr.response?.status === 422 || regErr.response?.status === 409) {
                        Alert.alert('Error', 'An account with this email already exists. Please sign in instead.');
                        setLoading(false);
                        return;
                    }
                    throw regErr;
                }
                // Navigate to OTP verification screen
                setLoading(false);
                (navigation as any).navigate('VerifyEmail', { email: trimmedEmail, password });
                return;
            } else {
                const loginRes = await api.auth.login({ email: trimmedEmail, password });
                // Better Auth may return token at different paths
                sessionToken = loginRes.data?.session?.token
                    || loginRes.data?.token
                    || loginRes.data?.data?.session?.token;

                if (!sessionToken) {
                    console.log('Login response structure:', JSON.stringify(loginRes.data, null, 2));
                }
            }

            let user: any = null;
            if (sessionToken) {
                // For email/password login, we need to fetch user profile first
                const profileRes = await api.user.getProfile();
                user = profileRes.data?.data;

                if (!user) {
                    console.error("No user data received from backend");
                    Alert.alert('Error', 'Login succeeded but user data was incomplete. Please try again.');
                    setLoading(false);
                    return;
                }

                await authContext.login(sessionToken, user);
            } else {
                console.error("No session token received from backend");
                Alert.alert('Error', 'Login succeeded but no session token was returned. Please try again.');
                setLoading(false);
                return;
            }

            // User profile was already fetched above — check if user is onboarded
            let isOnboarded = false;

            if (user) {
                if (user.preferences?.theme) {
                    setTheme(user.preferences.theme);
                }

                if (user.conditions) {
                    const parsedConditions = typeof user.conditions === 'string'
                        ? JSON.parse(user.conditions)
                        : user.conditions;
                    if (parsedConditions && parsedConditions.length > 0) {
                        isOnboarded = true;
                    }
                }
            }

            if (isOnboarded) {
                (navigation as any).reset({ index: 0, routes: [{ name: 'Dashboard' }] });
            } else {
                updateData('name', user?.name || '');
                updateData('email', user?.email || '');
                (navigation as any).reset({ index: 0, routes: [{ name: 'OnboardingConditions' }] });
            }
        } catch (error: any) {
            console.error('Email Auth Error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAppleSignIn = async () => {
        try {
            setLoading(true);
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            if (!credential.identityToken) {
                Alert.alert('Error', 'Failed to get Apple identity token. Please try again.');
                return;
            }

            const payload: any = {
                idToken: credential.identityToken,
            };

            if (credential.fullName) {
                payload.user = {
                    name: {
                        firstName: credential.fullName.givenName,
                        lastName: credential.fullName.familyName,
                    },
                };
            }

            const response = await api.auth.signInWithApple(payload.idToken, payload.user);

            const sessionToken = response.data?.session?.token;
            const user = response.data?.user;

            if (sessionToken && user) {
                // Fetch full profile BEFORE setting auth state (to avoid SplashScreen race condition)
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${sessionToken}`;
                let fullUser = user;
                try {
                    const profileRes = await api.user.getProfile();
                    if (profileRes.data?.data) {
                        fullUser = profileRes.data.data;
                    }
                } catch (e: any) {
                    console.error('Error fetching profile after Apple sign-in', e.message);
                }

                // Now login with the full user data (including conditions)
                await authContext.login(sessionToken, fullUser);

                if (fullUser.preferences?.theme) {
                    setTheme(fullUser.preferences.theme);
                }

                // Check if user is onboarded
                let isOnboarded = false;
                if (fullUser.conditions) {
                    const parsedConditions = typeof fullUser.conditions === 'string'
                        ? JSON.parse(fullUser.conditions)
                        : fullUser.conditions;
                    if (parsedConditions && parsedConditions.length > 0) {
                        isOnboarded = true;
                    }
                }

                if (isOnboarded) {
                    (navigation as any).reset({ index: 0, routes: [{ name: 'Dashboard' }] });
                } else {
                    updateData('name', fullUser.name || '');
                    updateData('email', fullUser.email || '');
                    (navigation as any).reset({ index: 0, routes: [{ name: 'OnboardingConditions' }] });
                }
            } else {
                console.error("No session token or user received from backend:", response.data);
                Alert.alert('Error', 'Login succeeded but session data was incomplete. Please try again.');
                setLoading(false);
                return;
            }
        } catch (error: any) {
            if (error.code === 'ERR_REQUEST_CANCELED') {
                Alert.alert('Cancelled', 'Sign-in was cancelled');
            } else {
                console.error('Apple Sign-In Error:', error);
                Alert.alert('Error', error.response?.data?.message || 'Sign-in failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const screenWidth = Dimensions.get('window').width;
    const cardWidth = Math.min(420, screenWidth - 48);

    return (
        <View style={styles.backgroundImage}>
            <VideoView
                player={player}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                nativeControls={false}
            />
            <StatusBar barStyle="light-content" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <View style={styles.overlay}>
                    <SafeAreaView style={styles.safeArea}>
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={[styles.cardWrapper, { width: cardWidth }]}>
                                <View style={styles.card}>
                                    {/* Header */}
                                    <View style={styles.header}>
                                        <Image
                                            source={require('../../assets/icon.png')}
                                            style={styles.logoImage}
                                            resizeMode="contain"
                                        />
                                        <Text style={styles.title}>NutriPioneer</Text>
                                        <Text style={styles.subtitle}>Your personalized nutrition app</Text>
                                    </View>

                                    {/* Form */}
                                    <View style={styles.formContainer}>
                                        {isSignUp && (
                                            <View style={styles.nameRow}>
                                                <View style={styles.inputContainer}>
                                                    <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="First Name"
                                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                                        value={firstName}
                                                        onChangeText={setFirstName}
                                                        autoCapitalize="words"
                                                    />
                                                </View>
                                                <View style={styles.inputContainer}>
                                                    <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="Last Name"
                                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                                        value={lastName}
                                                        onChangeText={setLastName}
                                                        autoCapitalize="words"
                                                    />
                                                </View>
                                            </View>
                                        )}

                                        <View style={styles.inputContainer}>
                                            <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Email Address"
                                                placeholderTextColor="rgba(255,255,255,0.4)"
                                                value={email}
                                                onChangeText={setEmail}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                            />
                                        </View>

                                        <View style={styles.inputContainer}>
                                            <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Password"
                                                placeholderTextColor="rgba(255,255,255,0.4)"
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry={!showPassword}
                                            />
                                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="rgba(255,255,255,0.6)" />
                                            </TouchableOpacity>
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.primaryButton, (!email || !password || (isSignUp && (!firstName || !lastName))) && styles.buttonDisabled]}
                                            onPress={handleEmailAuth}
                                            disabled={loading || !email || !password || (isSignUp && (!firstName || !lastName))}
                                        >
                                            {loading ? (
                                                <Text style={styles.primaryButtonText}>Processing...</Text>
                                            ) : (
                                                <Text style={styles.primaryButtonText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
                                            )}
                                        </TouchableOpacity>

                                        <View style={styles.dividerContainer}>
                                            <View style={styles.divider} />
                                            <Text style={styles.dividerText}>or</Text>
                                            <View style={styles.divider} />
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.socialButton, loading && styles.buttonDisabled]}
                                            onPress={handleGoogleSignIn}
                                            disabled={loading}
                                        >
                                            <Ionicons name="logo-google" size={20} color="#fff" style={styles.socialIcon} />
                                            <Text style={styles.socialButtonText}>Continue with Google</Text>
                                        </TouchableOpacity>

                                        {Platform.OS === 'ios' && (
                                            <TouchableOpacity
                                                style={[styles.socialButton, loading && styles.buttonDisabled]}
                                                onPress={handleAppleSignIn}
                                                disabled={loading}
                                            >
                                                <Ionicons name="logo-apple" size={20} color="#fff" style={styles.socialIcon} />
                                                <Text style={styles.socialButtonText}>Continue with Apple</Text>
                                            </TouchableOpacity>
                                        )}

                                        <View style={styles.toggleContainer}>
                                            <Text style={styles.toggleText}>
                                                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                                            </Text>
                                            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                                                <Text style={styles.toggleButtonText}>
                                                    {isSignUp ? 'Sign In' : 'Create Account'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Legal */}
                                    <Text style={styles.legalText}>
                                        By continuing, you agree to our{' '}
                                        <Text style={styles.legalLink} onPress={() => navigation.navigate('Terms' as never)}>
                                            Terms of Service
                                        </Text>
                                        {' '}and{' '}
                                        <Text style={styles.legalLink} onPress={() => navigation.navigate('Privacy' as never)}>
                                            Privacy Policy
                                        </Text>
                                        .
                                    </Text>
                                </View>
                            </View>
                        </ScrollView>
                    </SafeAreaView>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    cardWrapper: {
        alignSelf: 'center',
    },
    card: {
        backgroundColor: 'rgba(18, 18, 18, 0.85)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 12,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoImage: {
        width: 64,
        height: 64,
        marginBottom: 16,
        borderRadius: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '400',
    },
    formContainer: {
        gap: 14,
    },
    nameRow: {
        flexDirection: 'row',
        gap: 12,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 14,
        height: 52,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    primaryButton: {
        backgroundColor: '#10b981',
        borderRadius: 14,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 6,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    primaryButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    buttonDisabled: {
        opacity: 0.5,
        shadowOpacity: 0.1,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    dividerText: {
        color: 'rgba(255,255,255,0.5)',
        paddingHorizontal: 12,
        fontSize: 14,
        fontWeight: '500',
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 14,
        height: 52,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    socialIcon: {
        marginRight: 10,
    },
    socialButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    toggleText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        fontWeight: '500',
    },
    toggleButtonText: {
        color: '#10b981',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 6,
    },
    legalText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        textAlign: 'center',
        marginTop: 24,
        lineHeight: 16,
    },
    legalLink: {
        color: '#10b981',
        fontWeight: '600',
    },
});
