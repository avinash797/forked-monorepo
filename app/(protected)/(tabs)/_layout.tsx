import { Tabs, useRouter } from 'expo-router';
import React from 'react';

import { CenterTabButton } from '@/components/center-tab-button';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';

export default function TabLayout() {
    const { theme } = useTheme();
    const router = useRouter();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarStyle: {
                    height: 80,
                    paddingTop: 8,
                    paddingBottom: 28,
                    borderTopWidth: 0,
                    backgroundColor: theme.color.surface,
                    elevation: 0,
                },
                tabBarActiveTintColor: theme.color.accent,
                tabBarInactiveTintColor: theme.color.textSecondary,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Discover',
                    tabBarIcon: ({ color, focused }) => (
                        <IconSymbol
                            size={28}
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
                            size={28}
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
                            size={28}
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
                            size={28}
                            name={focused ? 'person' : 'person-outline'}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
