import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
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

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
          }}
        >
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
  );
}
