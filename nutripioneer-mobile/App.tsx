import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ConditionsScreen from './src/screens/onboarding/ConditionsScreen';
import BiometricsScreen from './src/screens/onboarding/BiometricsScreen';
import MedicalScreen from './src/screens/onboarding/MedicalScreen';
import DietaryScreen from './src/screens/onboarding/DietaryScreen';
import SynthesizingScreen from './src/screens/onboarding/SynthesizingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="OnboardingConditions" component={ConditionsScreen} />
        <Stack.Screen name="OnboardingBiometrics" component={BiometricsScreen} />
        <Stack.Screen name="OnboardingMedical" component={MedicalScreen} />
        <Stack.Screen name="OnboardingDietary" component={DietaryScreen} />
        <Stack.Screen name="OnboardingSynthesizing" component={SynthesizingScreen} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
