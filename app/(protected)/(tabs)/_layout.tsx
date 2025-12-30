import { Tabs, useRouter } from "expo-router";
import React from "react";

import { CenterTabButton } from "@/components/center-tab-button";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/contexts/theme-provider";

export default function TabLayout() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.color.accent,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Leaderboard",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="leaderboard" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-review"
        options={{
          title: "",
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <CenterTabButton
              {...props}
              onPress={() => {
                router.push("/(protected)/(rating)");
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
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="settings" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
