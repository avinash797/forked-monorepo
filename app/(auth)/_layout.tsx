import { useThemeColor } from '@/hooks/use-theme-color';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  const backgroundColor = useThemeColor({}, 'background') as string;
  const textColor = useThemeColor({}, 'text') as string;

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
