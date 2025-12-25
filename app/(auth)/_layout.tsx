import { Stack } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function AuthLayout() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor },
        headerTintColor: textColor,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="login"
        options={{ title: 'Login', headerShown: false }}
      />
      <Stack.Screen
        name="signup"
        options={{ title: 'Create Account' }}
      />
      <Stack.Screen
        name="reset-password"
        options={{ title: 'Reset Password' }}
      />
    </Stack>
  );
}
