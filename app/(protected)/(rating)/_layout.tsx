import { Stack } from 'expo-router';

export default function RatingLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerBackTitle: 'Back',
                presentation: 'card',
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: 'Take Photo',
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="venue-search"
                options={{
                    title: 'Find Venue',
                    headerBackVisible: true,
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
        </Stack>
    );
}
