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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import apiClient, { api, setAuthToken } from '../lib/api-client';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingStore } from '../store/useOnboardingStore';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTheme } from '../context/ThemeContext';

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

            if (sessionToken) {
                // Must await this to ensure AsyncStorage has it
                await setAuthToken(sessionToken);
                // ALSO we need to manually set it on the axios instance for the very next request
                // Because interceptors read from AsyncStorage which can be slow
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${sessionToken}`;
            } else {
                console.error("No session token received from backend:", response.data);
            }

            // Check if user is onboarded
            let isOnboarded = false;
            let userName = '';
            let userEmail = '';
            try {
                const profileRes = await api.user.getProfile();
                const user = profileRes.data?.data;

                if (user) {
                    userName = user.name || '';
                    userEmail = user.email || '';

                    if (user.preferences?.theme) {
                        setTheme(user.preferences.theme);
                    }
                }

                if (user?.conditions) {
                    const parsedConditions = typeof user.conditions === 'string'
                        ? JSON.parse(user.conditions)
                        : user.conditions;
                    if (parsedConditions && parsedConditions.length > 0) {
                        isOnboarded = true;
                    }
                }
            } catch (e: any) {
                console.error('Error fetching profile to check onboarding', e.response?.status, e.message);
            }

            if (isOnboarded) {
                navigation.navigate('Dashboard' as never);
            } else {
                updateData('name', userName);
                updateData('email', userEmail);
                navigation.navigate('OnboardingConditions' as never);
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

        try {
            setLoading(true);

            let sessionToken;

            if (isSignUp) {
                await api.auth.register({ email, password, name: fullName });
                // Attempt login after register
                const loginRes = await api.auth.login({ email, password });
                sessionToken = loginRes.data?.session?.token;
            } else {
                const loginRes = await api.auth.login({ email, password });
                sessionToken = loginRes.data?.session?.token;
            }

            if (sessionToken) {
                await setAuthToken(sessionToken);
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${sessionToken}`;
            } else {
                console.error("No session token received from backend");
            }

            // Check if user is onboarded
            let isOnboarded = false;
            let userName = '';
            let userEmail = '';
            try {
                const profileRes = await api.user.getProfile();
                const user = profileRes.data?.data;

                if (user) {
                    userName = user.name || '';
                    userEmail = user.email || '';

                    if (user.preferences?.theme) {
                        setTheme(user.preferences.theme);
                    }
                }

                if (user?.conditions) {
                    const parsedConditions = typeof user.conditions === 'string'
                        ? JSON.parse(user.conditions)
                        : user.conditions;
                    if (parsedConditions && parsedConditions.length > 0) {
                        isOnboarded = true;
                    }
                }
            } catch (e: any) {
                console.error('Error fetching profile to check onboarding', e.response?.status, e.message);
            }

            if (isOnboarded) {
                navigation.navigate('Dashboard' as never);
            } else {
                updateData('name', userName);
                updateData('email', userEmail);
                navigation.navigate('OnboardingConditions' as never);
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

            if (sessionToken) {
                await setAuthToken(sessionToken);
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${sessionToken}`;
            } else {
                console.error("No session token received from backend:", response.data);
            }

            // Check if user is onboarded
            let isOnboarded = false;
            let userName = '';
            let userEmail = '';
            try {
                const profileRes = await api.user.getProfile();
                const user = profileRes.data?.data;

                if (user) {
                    userName = user.name || '';
                    userEmail = user.email || '';

                    if (user.preferences?.theme) {
                        setTheme(user.preferences.theme);
                    }
                }

                if (user?.conditions) {
                    const parsedConditions = typeof user.conditions === 'string'
                        ? JSON.parse(user.conditions)
                        : user.conditions;
                    if (parsedConditions && parsedConditions.length > 0) {
                        isOnboarded = true;
                    }
                }
            } catch (e: any) {
                console.error('Error fetching profile to check onboarding', e.response?.status, e.message);
            }

            if (isOnboarded) {
                navigation.navigate('Dashboard' as never);
            } else {
                updateData('name', userName);
                updateData('email', userEmail);
                navigation.navigate('OnboardingConditions' as never);
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

    return (
        <View style={styles.backgroundImage}>
            <VideoView
                player={player}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                                    nativeControls={false}
            />
            <StatusBar barStyle="light-content" />
            
            {/* Added a KeyboardAvoidingView to ensure the keyboard doesn't cover inputs and they don't grow upwards into the logo */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <View style={styles.overlay}>
                    <View style={styles.safeArea}>
                        <View style={styles.container}>
                            <View style={styles.content}>
                                <View style={styles.header}>
                                    <Image
                                        source={require('../../assets/icon.png')}
                                        style={styles.logoImage}
                                        resizeMode="contain"
                                    />
                                    <Text style={styles.title}>NutriPioneer</Text>
                                    <Text style={styles.subtitle}>Your personalized nutrition app</Text>
                                </View>

                                <View style={styles.formContainer}>
                                    {isSignUp && (
                                        <View style={styles.nameRow}>
                                            <View style={[styles.inputContainer, styles.halfInput]}>
                                                <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="First Name"
                                                    placeholderTextColor="#94a3b8"
                                                    value={firstName}
                                                    onChangeText={setFirstName}
                                                    autoCapitalize="words"
                                                />
                                            </View>
                                            <View style={[styles.inputContainer, styles.halfInput]}>
                                                <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="Last Name"
                                                    placeholderTextColor="#94a3b8"
                                                    value={lastName}
                                                    onChangeText={setLastName}
                                                    autoCapitalize="words"
                                                />
                                            </View>
                                        </View>
                                    )}
                                    
                                    <View style={[styles.inputContainer, styles.fullInput]}>
                                        <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Email Address"
                                            placeholderTextColor="#94a3b8"
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>

                                    <View style={[styles.inputContainer, styles.fullInput]}>
                                        <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Password"
                                            placeholderTextColor="#94a3b8"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.primaryButton, (loading || !email || !password || (isSignUp && (!firstName || !lastName))) && styles.buttonDisabled]}
                                        onPress={handleEmailAuth}
                                        disabled={loading || !email || !password || (isSignUp && (!firstName || !lastName))}
                                    >
                                        <Text style={styles.primaryButtonText}>
                                            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                                        </Text>
                                    </TouchableOpacity>

                                    <View style={styles.dividerContainer}>
                                        <View style={styles.divider} />
                                        <Text style={styles.dividerText}>or</Text>
                                        <View style={styles.divider} />
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.googleButton, loading && styles.buttonDisabled]}
                                        onPress={handleGoogleSignIn}
                                        disabled={loading}
                                    >
                                        <Ionicons name="logo-google" size={24} color="#000" style={styles.googleIcon} />
                                        <Text style={styles.googleButtonText}>
                                            {loading ? 'Continuing...' : 'Continue with Google'}
                                        </Text>
                                    </TouchableOpacity>

                                    {Platform.OS === 'ios' && (
                                        <TouchableOpacity
                                            style={[styles.appleButton, loading && styles.buttonDisabled]}
                                            onPress={handleAppleSignIn}
                                            disabled={loading}
                                        >
                                            <Ionicons name="logo-apple" size={24} color="#000" style={styles.appleIcon} />
                                            <Text style={styles.appleButtonText}>
                                                {loading ? 'Continuing...' : 'Continue with Apple'}
                                            </Text>
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

                                    <Text style={styles.disclaimerText}>
                                        By continuing, you agree to our{' '}
                                        <Text 
                                            style={styles.linkText} 
                                            onPress={() => navigation.navigate('Terms' as never)}
                                        >
                                            Terms of Service
                                        </Text>
                                        {' '}and{' '}
                                        <Text 
                                            style={styles.linkText} 
                                            onPress={() => navigation.navigate('Privacy' as never)}
                                        >
                                            Privacy Policy
                                        </Text>
                                        .
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
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
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
    },
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 32,
    },
    header: {
        alignItems: 'center',
        marginTop: Platform.OS === 'ios' ? 80 : 60,
        flex: 2,
        justifyContent: 'center',
    },
    logoImage: {
        width: 100,
        height: 100,
        marginBottom: 24,
        borderRadius: 25,
    },
    title: {
        fontSize: 36,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 18,
        color: '#d1d5db',
        fontWeight: '400',
    },
    formContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 20, // Add bottom padding for better spacing
    },
    nameRow: {
        flexDirection: 'row',
        width: '80%',
        alignSelf: 'center',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    fullInput: {
        width: '80%',
        alignSelf: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff', // White
        borderWidth: 1,
        borderColor: '#e2e8f0', // Light slate border
        borderRadius: 12,
        height: 50,
        marginBottom: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#1e293b', // Dark slate text color for contrast
        fontSize: 16,
    },
    primaryButton: {
        backgroundColor: '#61d588',
        borderRadius: 12,
        height: 50,
        width: '80%',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 20,
        shadowColor: '#13ec5b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    primaryButtonText: {
        color: '#000000',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '80%',
        alignSelf: 'center',
        marginBottom: 20,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#334155',
    },
    dividerText: {
        color: '#94a3b8',
        paddingHorizontal: 10,
        fontSize: 14,
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    toggleText: {
        color: '#cbd5e1',
        fontSize: 14,
    },
    toggleButtonText: {
        color: '#61d588',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 4,
    },
    googleButton: {
        flexDirection: 'row',
        alignSelf: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#61d588ff',
        backgroundColor: 'transparent',
        height: 50,
        width: '80%',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#13ec5b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 20,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    googleIcon: {
        marginRight: 12,
        color: '#61d588ff',
    },
    googleButtonText: {
        color: '#61d588ff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    appleButton: {
        flexDirection: 'row',
        alignSelf: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ffffff',
        // backgroundColor: '#ffffff',
        height: 50,
        width: '80%',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ffffff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 20,
    },
    appleIcon: {
        marginRight: 12,
        color: '#ffffff',
    },
    appleButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    disclaimerText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 16,
        paddingHorizontal: 20,
        lineHeight: 18,
    },
    linkText: {
        color: '#61d588ff',
        textDecorationLine: 'underline',
    },
});
