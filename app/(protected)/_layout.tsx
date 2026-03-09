import { Stack } from 'expo-router';

export const unstable_settings = {
    initialRouteName: '(tabs)',
};

export default function ProtectedLayout() {
    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
                name="(rating)"
                options={{
                    headerShown: false,
                    presentation: 'card',
                }}
            />
            <Stack.Screen name="(browse)" options={{ headerShown: false }} />
        </Stack>
    );
}
