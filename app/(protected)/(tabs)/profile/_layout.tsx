import { Stack } from 'expo-router';

export default function ProfileLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
                name="settings"
                options={{ title: 'Settings', headerBackTitle: 'Profile' }}
            />
            <Stack.Screen
                name="edit"
                options={{
                    title: 'Edit Profile',
                    headerBackTitle: 'Profile',
                    presentation: 'pageSheet',
                    animation: 'fade_from_bottom',
                    animationDuration: 50,
                }}
            />
        </Stack>
    );
}
