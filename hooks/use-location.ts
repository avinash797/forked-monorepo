import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import type { LocationCoordinates, GPSVerificationStatus } from '@/types/rating';

export function useLocation() {
  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status !== 'granted') {
        setError('Location permission not granted');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { location, hasPermission, isLoading, error, refetch: requestLocation };
}

export function useGPSVerification(
  userLocation: LocationCoordinates | null,
  venueLocation: { latitude: number | null; longitude: number | null } | null,
  maxDistanceMeters: number = 500
): GPSVerificationStatus {
  const [status, setStatus] = useState<GPSVerificationStatus>({
    hasPermission: false,
    isVerified: false,
    distanceMeters: null,
    location: userLocation,
    error: null,
  });

  useEffect(() => {
    if (!userLocation) {
      setStatus({
        hasPermission: false,
        isVerified: false,
        distanceMeters: null,
        location: null,
        error: 'Location not available',
      });
      return;
    }

    if (!venueLocation?.latitude || !venueLocation?.longitude) {
      setStatus({
        hasPermission: true,
        isVerified: false,
        distanceMeters: null,
        location: userLocation,
        error: 'Venue location not available',
      });
      return;
    }

    const R = 6371000;
    const lat1 = (userLocation.latitude * Math.PI) / 180;
    const lat2 = (venueLocation.latitude * Math.PI) / 180;
    const deltaLat =
      ((venueLocation.latitude - userLocation.latitude) * Math.PI) / 180;
    const deltaLon =
      ((venueLocation.longitude - userLocation.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    setStatus({
      hasPermission: true,
      isVerified: distance <= maxDistanceMeters,
      distanceMeters: Math.round(distance),
      location: userLocation,
      error: null,
    });
  }, [userLocation, venueLocation, maxDistanceMeters]);

  return status;
}
