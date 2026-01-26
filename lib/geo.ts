/**
 * Parses a Postgres POINT geometry into latitude and longitude.
 * Handles both the string format "(lng,lat)" or "POINT(lng lat)"
 * and the object format { x: lng, y: lat } from react-native-maps's Point type.
 */
export function parsePostgresPoint(
    coordinates: any
): { latitude: number; longitude: number } | null {
    if (!coordinates) return null;

    // Handle string format "(lng,lat)" or "POINT(lng lat)"
    if (typeof coordinates === 'string') {
        const clean = coordinates.replace(/[()point]/gi, '').trim();
        const parts = clean.split(/[,\s]+/);
        if (parts.length === 2) {
            return {
                longitude: parseFloat(parts[0]),
                latitude: parseFloat(parts[1]),
            };
        }
    }

    // Handle object format { x: lng, y: lat } which is react-native-maps Point
    if (typeof coordinates === 'object') {
        // If it's already in the expected format
        if (
            typeof coordinates.latitude === 'number' &&
            typeof coordinates.longitude === 'number'
        ) {
            return coordinates;
        }

        // If it uses x/y (Postgres POINT or react-native-maps Point)
        const longitude = coordinates.x ?? coordinates.lng;
        const latitude = coordinates.y ?? coordinates.lat;

        if (typeof latitude === 'number' && typeof longitude === 'number') {
            return { latitude, longitude };
        }
    }

    return null;
}
