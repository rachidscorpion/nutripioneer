import React, { useEffect } from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { useTheme } from '../context/ThemeContext';

export default function SplashScreen() {
  const navigation = useNavigation();
  const { isAuthenticated, isLoading, user } = useAuth();
  const updateData = useOnboardingStore(state => state.updateData);
  const { setTheme } = useTheme();

  useEffect(() => {
    if (!isLoading) {
      // Auth check is complete, determine where to navigate
      if (isAuthenticated && user) {
        // User is logged in, check if they need onboarding
        const preferences = user.preferences as any;
        if (preferences?.theme) {
          setTheme(preferences.theme);
        }

        const conditions = user.conditions;
        const parsedConditions = typeof conditions === 'string'
          ? JSON.parse(conditions || '[]')
          : conditions || [];

        if (parsedConditions.length > 0) {
          // User is onboarded, go to Dashboard
          navigation.navigate('Dashboard' as never);
        } else {
          // User needs onboarding
          updateData('name', user.name || '');
          updateData('email', user.email || '');
          navigation.navigate('OnboardingConditions' as never);
        }
      } else {
        // User is not logged in, go to Login
        navigation.navigate('Login' as never);
      }
    }
  }, [isLoading, isAuthenticated, user, navigation, updateData, setTheme]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/icon-dark.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#10b981" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 32,
    borderRadius: 24,
  },
  spinner: {
    marginTop: 24,
  },
});
