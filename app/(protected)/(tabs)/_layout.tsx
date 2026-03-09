import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CenterTabButton } from '@/components/center-tab-button';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';

export default function TabLayout() {
    const { theme } = useTheme();
    const router = useRouter();
    const { bottom } = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarStyle: {
                    height: 60 + bottom,
                    paddingTop: 6,
                    paddingBottom: bottom,
                    borderTopWidth: 0,
                    backgroundColor: theme.color.surface,
                },
                tabBarActiveTintColor: theme.color.accent,
                tabBarInactiveTintColor: theme.color.textSecondary,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
                tabBarIconStyle: {
                    marginBottom: 2,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Discover',
                    tabBarIcon: ({ color, focused }) => (
                        <IconSymbol
                            size={24}
                            name={focused ? 'compass' : 'compass-outline'}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="leaderboard"
                options={{
                    title: 'Leaderboard',
                    tabBarIcon: ({ color, focused }) => (
                        <IconSymbol
                            size={24}
                            name={focused ? 'podium' : 'podium-outline'}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="add-review"
                options={{
                    title: '',
                    tabBarIcon: () => null,
                    tabBarButton: (props) => (
                        <CenterTabButton
                            {...props}
                            onPress={() => {
                                router.push('/(protected)/(rating)');
                            }}
                        />
                    ),
                }}
                listeners={{
                    tabPress: (e) => {
                        e.preventDefault();
                    },
                }}
            />
            <Tabs.Screen
                name="personal"
                options={{
                    title: 'Personal',
                    tabBarIcon: ({ color, focused }) => (
                        <IconSymbol
                            size={24}
                            name={focused ? 'list' : 'list-outline'}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <IconSymbol
                            size={24}
                            name={focused ? 'person' : 'person-outline'}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
