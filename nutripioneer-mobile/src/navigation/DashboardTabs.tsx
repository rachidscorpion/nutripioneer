import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import PlanScreen from '../screens/dashboard/PlanScreen';
import GroceryScreen from '../screens/dashboard/GroceryScreen';
import RestaurantRescueScreen from '../screens/dashboard/RestaurantRescueScreen';
import ProfileScreen from '../screens/dashboard/ProfileScreen';
import CustomTabBar from '../components/navigation/CustomTabBar';

const Tab = createBottomTabNavigator();

export default function DashboardTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Plan" component={PlanScreen} />
            <Tab.Screen name="Grocery" component={GroceryScreen} />
            <Tab.Screen name="Rescue" component={RestaurantRescueScreen} options={{ tabBarLabel: 'Rescue' }} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}
