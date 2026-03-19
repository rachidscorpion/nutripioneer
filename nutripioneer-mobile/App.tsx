import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import SplashScreen from './src/screens/SplashScreen';
import DashboardTabs from './src/navigation/DashboardTabs';
import ConditionsScreen from './src/screens/onboarding/ConditionsScreen';
import BiometricsScreen from './src/screens/onboarding/BiometricsScreen';
import MedicalScreen from './src/screens/onboarding/MedicalScreen';
import DietaryScreen from './src/screens/onboarding/DietaryScreen';
import SynthesizingScreen from './src/screens/onboarding/SynthesizingScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import TermsScreen from './src/screens/TermsScreen';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { initIAP, destroyIAP } from './src/lib/iap';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    initIAP();
    return () => {
      destroyIAP();
    };
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            <Stack.Screen name="Dashboard" component={DashboardTabs} />
            <Stack.Screen name="OnboardingConditions" component={ConditionsScreen} />
            <Stack.Screen name="OnboardingBiometrics" component={BiometricsScreen} />
            <Stack.Screen name="OnboardingMedical" component={MedicalScreen} />
            <Stack.Screen name="OnboardingDietary" component={DietaryScreen} />
            <Stack.Screen name="OnboardingSynthesizing" component={SynthesizingScreen} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
            <Stack.Screen name="Terms" component={TermsScreen} />
          </Stack.Navigator>
          <StatusBar style="auto" />
        </NavigationContainer>
      </ThemeProvider>
    </AuthProvider>
  );
}
