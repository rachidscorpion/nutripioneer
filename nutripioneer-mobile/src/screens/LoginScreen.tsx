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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import apiClient, { api, setAuthToken } from '../lib/api-client';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

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
            try {
                const profileRes = await api.user.getProfile();
                const user = profileRes.data?.data;
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

            Alert.alert('Success', 'Signed in successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        if (isOnboarded) {
                            navigation.navigate('Home' as never);
                        } else {
                            navigation.navigate('Onboarding' as never);
                        }
                    },
                },
            ]);
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

    return (
        <View style={styles.backgroundImage}>
            <VideoView
                player={player}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                nativeControls={false}
            />
            <StatusBar barStyle="light-content" />
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

                                <Text style={styles.disclaimerText}>
                                    By continuing, you agree to our Terms of Service and Privacy Policy.
                                </Text>
                            </View>

                            {/* Empty view for spacing */}
                            <View style={{ flex: 1 }} />
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
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
        width: '100%',
        flex: 1,
        justifyContent: 'center',
    },
    googleButton: {
        flexDirection: 'row',
        alignSelf: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#61d588ff',
        backgroundColor: 'transparent', // add blur effect
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
    disclaimerText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 16,
        paddingHorizontal: 20,
        lineHeight: 18,
    },
});
