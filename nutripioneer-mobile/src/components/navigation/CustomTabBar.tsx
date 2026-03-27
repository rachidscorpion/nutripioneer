import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();

    return (
        <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={[styles.tabBar, { backgroundColor: theme.card }]}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label = options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                            ? options.title
                            : route.name;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    let iconName: keyof typeof Ionicons.glyphMap = 'home';
                    if (route.name === 'Home') iconName = 'home';
                    else if (route.name === 'Plan') iconName = 'briefcase';
                    else if (route.name === 'Grocery') iconName = 'cart';
                    else if (route.name === 'Rescue') iconName = 'camera';
                    else if (route.name === 'Profile') iconName = 'person';

                    return (
                        <TabItem
                            key={route.key}
                            label={label as string}
                            iconName={iconName}
                            isFocused={isFocused}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            theme={theme}
                        />
                    );
                })}
            </View>
        </View>
    );
}

function TabItem({
    label,
    iconName,
    isFocused,
    onPress,
    onLongPress,
    theme
}: {
    label: string,
    iconName: keyof typeof Ionicons.glyphMap,
    isFocused: boolean,
    onPress: () => void,
    onLongPress: () => void,
    theme: any
}) {
    const animation = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animation, {
            toValue: isFocused ? 1 : 0,
            duration: 250,
            useNativeDriver: false, // Animating width and colors requires false
        }).start();
    }, [isFocused]);

    const containerWidth = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [48, 110] // Expanding from circle to pill length, slightly shorter to fit 5 items
    });

    const circleColor = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.card, theme.primary]
    });

    const textOpacity = animation.interpolate({
        inputRange: [0, 0.7, 1],
        outputRange: [0, 0, 1]
    });

    const labelWidth = animation.interpolate({
        inputRange: [0, 0.7, 1],
        outputRange: [0, 0, 100]
    });

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={1}
            style={styles.touchable}
        >
            <Animated.View style={[
                styles.itemContainer,
                { width: containerWidth, backgroundColor: isFocused ? theme.card : 'transparent' }
            ]}>
                <Animated.View style={[styles.iconCircle, { backgroundColor: circleColor }]}>
                    <Ionicons
                        name={iconName}
                        size={22}
                        color={isFocused ? '#000000' : theme.textMuted}
                    />
                </Animated.View>

                {isFocused && (
                    <Animated.Text
                        numberOfLines={1}
                        style={[styles.label, { opacity: textOpacity, width: labelWidth, color: theme.text }]}
                    >
                        {label}
                    </Animated.Text>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 0,
        maxWidth: 560,
        alignSelf: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#0A0A0A',
        borderRadius: 40,
        padding: 8,
        justifyContent: 'space-between',
        width: '100%',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    touchable: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: 24,
        padding: 4, // Padding around the inner circle
    },
    iconCircle: {
        width: 40, // 48 - (4 * 2) = 40
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginLeft: 6,
        marginRight: 10,
        fontSize: 13,
    }
});
