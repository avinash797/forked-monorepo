import { useTheme } from '@/contexts/theme-provider';
import { HeaderBackButton } from 'expo-router/react-navigation';
import { Stack, useRouter } from 'expo-router';
import { Platform } from 'react-native';

export default function ProfileGroupLayout() {
    const router = useRouter();
    const { theme } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerLeft:
                    Platform.OS === 'ios'
                        ? () => (
                              <HeaderBackButton
                                  onPress={() => router.back()}
                                  tintColor={theme.color.textPrimary}
                              />
                          )
                        : undefined,
            }}
        >
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
            <Stack.Screen name="edit" options={{ title: 'Edit Profile' }} />
            <Stack.Screen name="appearance" options={{ title: 'Appearance' }} />
            <Stack.Screen name="account" options={{ title: 'Account' }} />
        </Stack>
    );
}
