import { useTheme } from '@/contexts/theme-provider';
import { Stack } from 'expo-router';

export default function AuthLayout() {
    const { theme } = useTheme();
    const backgroundColor = theme.color.bg;
    const textColor = theme.color.textPrimary;

    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor },
                headerTintColor: textColor,
                headerShadowVisible: false,
            }}
        >
            <Stack.Screen
                name="index"
                options={{ title: 'Welcome', headerShown: false }}
            />
            <Stack.Screen
                name="login"
                options={{ title: 'Login', headerShown: false }}
            />
            <Stack.Screen
                name="signup"
                options={{ title: 'Create Account', headerShown: false }}
            />
            <Stack.Screen
                name="reset-password"
                options={{ title: 'Reset Password', headerShown: false }}
            />
        </Stack>
    );
}
