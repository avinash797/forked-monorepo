import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { AuthProvider } from "@/contexts/auth-context";
import { RatingFlowProvider } from "@/contexts/rating-flow-context";
import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";

if (__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("../reactotronConfig");
}

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to onboarding if not authenticated
      router.replace("/(auth)");
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to tabs if authenticated
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme ?? "light"].primary}
        />
      </ThemedView>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="(rating)"
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RatingFlowProvider>
          <RootLayoutNav />
        </RatingFlowProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
