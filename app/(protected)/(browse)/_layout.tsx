import { Stack } from 'expo-router';

/**
 * Browse flow navigation layout
 * Handles navigation for dish detail, venue detail, and search screens
 */
export default function BrowseLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        presentation: 'card',
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="dish-detail"
        options={{
          title: 'Dish Details',
        }}
      />
      <Stack.Screen
        name="venue-detail"
        options={{
          title: 'Venue',
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          title: 'Search',
          headerShown: false, // Custom header in component
          presentation: 'card'
        }}
      />
    </Stack>
  );
}
