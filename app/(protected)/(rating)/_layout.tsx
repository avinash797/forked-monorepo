import { useTheme } from '@/contexts/theme-provider';
import { HeaderBackButton } from '@react-navigation/elements';
import { Stack, useRouter } from 'expo-router';

export default function RatingLayout() {
    const router = useRouter();
    const { theme } = useTheme();
    return (
        <Stack screenOptions={{ headerLeft: () => <HeaderBackButton onPress={() => router.back()} tintColor={theme.color.textPrimary} /> }}>
            <Stack.Screen
                name="index"
                options={{
                    title: 'Find Restaurant',
                }}
            />
            <Stack.Screen
                name="create-venue"
                options={{
                    title: 'Add New Venue',
                    presentation: 'formSheet',
                    sheetGrabberVisible: true,
                }}
            />
            <Stack.Screen
                name="city-onboarding"
                options={{
                    title: 'Discovering Dishes',
                    headerShown: false,
                    gestureEnabled: false,
                }}
            />
            <Stack.Screen
                name="dish-selection"
                options={{
                    title: 'Select Dish',
                }}
            />
            <Stack.Screen
                name="rating"
                options={{
                    title: 'Rate Dish',
                }}
            />
            <Stack.Screen
                name="compare"
                options={{
                    title: 'Compare',
                    headerShown: false,
                }}
            />
        </Stack>
    );
}
