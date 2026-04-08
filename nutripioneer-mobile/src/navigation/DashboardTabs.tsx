import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import SavedMealsScreen from '../screens/dashboard/SavedMealsScreen';
import GroceryScreen from '../screens/dashboard/GroceryScreen';
import RestaurantRescueScreen from '../screens/dashboard/RestaurantRescueScreen';
import ProfileScreen from '../screens/dashboard/ProfileScreen';
import CustomTabBar from '../components/navigation/CustomTabBar';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

export default function DashboardTabs() {
    const { theme } = useTheme();

    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            detachInactiveScreens={false}
            screenOptions={{
                headerShown: false,
                animation: 'shift',
                sceneStyle: { backgroundColor: theme.background },
                transitionSpec: {
                    animation: 'timing',
                    config: {
                        duration: 150, // Makes the transition noticeably quicker
                    },
                },
            }}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Saved" component={SavedMealsScreen} options={{ tabBarLabel: 'Saved' }} />
            <Tab.Screen name="Grocery" component={GroceryScreen} />
            <Tab.Screen name="Rescue" component={RestaurantRescueScreen} options={{ tabBarLabel: 'Rescue' }} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}
