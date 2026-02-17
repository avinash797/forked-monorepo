import { useRatingStore } from '@/stores';
import { Redirect } from 'expo-router';

/**
 * Rating flow entry point.
 * The workflow starts with restaurant/venue selection,
 * so we redirect immediately to the venue-search screen.
 */
export default function RatingEntryRedirect() {
    const { selectedRestaurant, selectedDishType } = useRatingStore();
    // Determine if we should skip venue/dish selection (when coming from dish detail)
    const shouldSkipSelection = !!selectedRestaurant && !!selectedDishType;

    // Get the next route based on whether we have pre-populated data
    const getNextRoute = () => {
        if (shouldSkipSelection) {
            return '/(protected)/(rating)/rating';
        }
        return '/(protected)/(rating)/venue-search';
    };
    return <Redirect href={getNextRoute()} />;
}
