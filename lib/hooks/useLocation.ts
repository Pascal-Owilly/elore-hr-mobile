import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { api } from '@lib/api/client';

interface LocationState {
  location: Location.LocationObject | null;
  error: string | null;
  isLoading: boolean;
  address: string | null;
  geofenceStatus: {
    is_within_geofence: boolean;
    distance?: number;
    branch?: any;
  } | null;
}

interface GeofenceResult {
  is_within_geofence: boolean;
  distance?: number;
  branch?: any;
  message?: string;
}

export const useLocation = () => {
  const [state, setState] = useState<LocationState>({
    location: null,
    error: null,
    isLoading: false,
    address: null,
    geofenceStatus: null,
  });

  // Request location permissions
  const requestPermissions = useCallback(async () => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        setState(prev => ({
          ...prev,
          error: 'Location permission denied',
        }));
        return false;
      }

      // Request background permission for Android
      if (Platform.OS === 'android') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          console.warn('Background location permission not granted');
        }
      }

      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to request location permissions',
      }));
      return false;
    }
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(async (options?: Location.LocationOptions) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Location permission required',
        }));
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        ...options,
      });

      // Reverse geocode to get address
      let address = null;
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (addresses.length > 0) {
          const addr = addresses[0];
          address = [
            addr.street,
            addr.district,
            addr.city,
            addr.region,
            addr.country,
          ]
            .filter(Boolean)
            .join(', ');
        }
      } catch (geocodeError) {
        console.warn('Geocoding failed:', geocodeError);
      }

      setState(prev => ({
        ...prev,
        location,
        address,
        isLoading: false,
      }));

      return location;
    } catch (error) {
      console.error('Location error:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to get location',
        isLoading: false,
      }));
      return null;
    }
  }, [requestPermissions]);

  // Watch location
  const watchLocation = useCallback(async (callback?: (location: Location.LocationObject) => void) => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return () => {};
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10, // Minimum distance between updates in meters
          timeInterval: 30000, // Minimum time between updates in milliseconds
        },
        (location) => {
          setState(prev => ({ ...prev, location }));
          callback?.(location);
        }
      );

      return () => subscription.remove();
    } catch (error) {
      console.error('Watch location error:', error);
      return () => {};
    }
  }, [requestPermissions]);

  // Verify geofence
  const verifyGeofence = useCallback(async (location?: Location.LocationObject) => {
    try {
      const loc = location || state.location;
      if (!loc) {
        throw new Error('No location available');
      }

      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected;

      let geofenceResult: GeofenceResult;

      if (isOnline) {
        // Online geofence check
        const response = await api.post('/attendance/verify-geofence/', {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy,
        });
        geofenceResult = response.data;
      } else {
        // Offline geofence check (use last known status or cached locations)
        const cachedLocations = await getCachedGeofenceLocations();
        const isNearCachedLocation = checkProximityToCachedLocations(
          loc.coords,
          cachedLocations
        );

        geofenceResult = {
          is_within_geofence: isNearCachedLocation,
          message: 'Offline geofence check',
        };
      }

      setState(prev => ({
        ...prev,
        geofenceStatus: geofenceResult,
      }));

      return geofenceResult;
    } catch (error) {
      console.error('Geofence verification error:', error);
      
      // For offline or error cases, assume within geofence
      const fallbackResult: GeofenceResult = {
        is_within_geofence: true,
        message: 'Geofence check failed, assuming within area',
      };

      setState(prev => ({
        ...prev,
        geofenceStatus: fallbackResult,
      }));

      return fallbackResult;
    }
  }, [state.location]);

  // Get distance between two coordinates (in meters)
  const getDistance = useCallback((coord1: Location.LocationObjectCoords, coord2: Location.LocationObjectCoords) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  // Check if location is within radius of a point
  const isWithinRadius = useCallback((
    location: Location.LocationObjectCoords,
    center: { latitude: number; longitude: number },
    radius: number
  ) => {
    const distance = getDistance(location, center);
    return distance <= radius;
  }, [getDistance]);

  // Helper functions for offline geofence checking
  const getCachedGeofenceLocations = async () => {
    try {
      // In a real app, you would fetch this from local storage
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Failed to get cached locations:', error);
      return [];
    }
  };

  const checkProximityToCachedLocations = (
    coords: Location.LocationObjectCoords,
    cachedLocations: Array<{ latitude: number; longitude: number; radius: number }>
  ) => {
    if (cachedLocations.length === 0) return true; // No cached locations, assume OK

    for (const cachedLoc of cachedLocations) {
      if (isWithinRadius(coords, cachedLoc, cachedLoc.radius)) {
        return true;
      }
    }

    return false;
  };

  // Clear location data
  const clearLocation = useCallback(() => {
    setState({
      location: null,
      error: null,
      isLoading: false,
      address: null,
      geofenceStatus: null,
    });
  }, []);

  return {
    ...state,
    getCurrentLocation,
    watchLocation,
    verifyGeofence,
    getDistance,
    isWithinRadius,
    clearLocation,
    requestPermissions,
  };
};