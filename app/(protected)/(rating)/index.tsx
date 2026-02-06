import { Redirect } from 'expo-router';

/**
 * Rating flow entry point.
 * The workflow now starts with restaurant/venue selection,
 * so we redirect immediately to the venue-search screen.
 */
export default function RatingEntryRedirect() {
    return <Redirect href="/(protected)/(rating)/venue-search" />;
}
