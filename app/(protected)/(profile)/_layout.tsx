import { useTheme } from '@/contexts/theme-provider';
import { HeaderBackButton } from '@react-navigation/elements';
import { Stack, useRouter } from 'expo-router';

export default function ProfileGroupLayout() {
    const router = useRouter();
    const { theme } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerLeft: () => (
                    <HeaderBackButton
                        onPress={() => router.back()}
                        tintColor={theme.color.textPrimary}
                    />
                ),
            }}
        >
            <Stack.Screen
                name="settings"
                options={{ title: 'Settings' }}
            />
            <Stack.Screen
                name="edit"
                options={{ title: 'Edit Profile' }}
            />
            <Stack.Screen
                name="account"
                options={{ title: 'Account' }}
            />
        </Stack>
    );
}
