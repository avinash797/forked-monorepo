import { HeaderBackButton } from '@react-navigation/elements';
import { Stack, useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { useTheme } from '@/contexts/theme-provider';

export default function RatingLayout() {
    const router = useRouter();
    const { theme } = useTheme();
    return (
        <Stack
            screenOptions={{
                headerBackTitle: 'Back',
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: 'Find Restaurant',
                    headerLeft: Platform.OS === 'ios'
                        ? (props) => (
                            <HeaderBackButton
                                {...props}
                                tintColor={theme.color.textPrimary}
                                onPress={() => router.back()}
                            />
                        )
                        : undefined,
                }}
            />
            <Stack.Screen
                name="create-venue"
                options={{
                    title: 'Add New Venue',
                    presentation: 'modal',
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
