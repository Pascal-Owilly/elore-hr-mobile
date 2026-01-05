import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Colors } from '@constants/Colors';
import { Layout } from '@constants/Layout';
import { Icon } from '@components/ui/Icon';
import { Button } from '@components/ui/Button';

interface GeofenceMapProps {
  geofence?: {
    latitude: number;
    longitude: number;
    radius: number;
    name: string;
  };
  onLocationUpdate?: (location: Location.LocationObject) => void;
  showCurrentLocation?: boolean;
}

export const GeofenceMap: React.FC<GeofenceMapProps> = ({
  geofence,
  onLocationUpdate,
  showCurrentLocation = true,
}) => {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Location permission denied');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setLocation(currentLocation);
      onLocationUpdate?.(currentLocation);
      
      // Center map on user location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to get location');
      console.error('Location error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshLocation = async () => {
    await requestLocationPermission();
  };

  const checkIfInGeofence = () => {
    if (!location || !geofence) return false;

    const earthRadius = 6371000; // meters
    const lat1 = toRadians(location.coords.latitude);
    const lat2 = toRadians(geofence.latitude);
    const deltaLat = toRadians(geofence.latitude - location.coords.latitude);
    const deltaLon = toRadians(geofence.longitude - location.coords.longitude);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;

    return distance <= geofence.radius;
  };

  const toRadians = (degrees: number) => {
    return degrees * (Math.PI / 180);
  };

  const isWithinGeofence = checkIfInGeofence();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryBlue500} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={48} color={Colors.danger500} />
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Retry"
          onPress={handleRefreshLocation}
          variant="outline"
          size="sm"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={
          location
            ? {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }
            : undefined
        }
        showsUserLocation={showCurrentLocation}
        showsMyLocationButton={false}
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={false}
      >
        {/* Geofence Circle */}
        {geofence && (
          <Circle
            center={{
              latitude: geofence.latitude,
              longitude: geofence.longitude,
            }}
            radius={geofence.radius}
            strokeWidth={2}
            strokeColor={isWithinGeofence ? Colors.success500 : Colors.danger500}
            fillColor={isWithinGeofence ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
          />
        )}

        {/* Geofence Center Marker */}
        {geofence && (
          <Marker
            coordinate={{
              latitude: geofence.latitude,
              longitude: geofence.longitude,
            }}
            title={geofence.name}
            description="Work Location"
          >
            <View style={styles.geofenceMarker}>
              <Icon name="map-pin" size={24} color={Colors.primaryBlue500} />
            </View>
          </Marker>
        )}

        {/* User Location Marker (if not using showsUserLocation) */}
        {location && !showCurrentLocation && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
            description={`Accuracy: ${location.coords.accuracy?.toFixed(0)}m`}
          >
            <View style={[
              styles.userMarker,
              { backgroundColor: isWithinGeofence ? Colors.success500 : Colors.danger500 }
            ]}>
              <Icon name="navigation" size={16} color={Colors.white} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Status Overlay */}
      <View style={styles.statusOverlay}>
        <View style={[
          styles.statusBadge,
          { backgroundColor: isWithinGeofence ? Colors.success50 : Colors.danger50 }
        ]}>
          <Icon
            name={isWithinGeofence ? 'check-circle' : 'x-circle'}
            size={20}
            color={isWithinGeofence ? Colors.success500 : Colors.danger500}
          />
          <Text style={[
            styles.statusText,
            { color: isWithinGeofence ? Colors.success700 : Colors.danger700 }
          ]}>
            {isWithinGeofence ? 'Within work area' : 'Outside work area'}
          </Text>
        </View>
      </View>

      {/* Refresh Button */}
      <View style={styles.refreshButtonContainer}>
        <Button
          title=""
          onPress={handleRefreshLocation}
          variant="ghost"
          icon={<Icon name="refresh-cw" size={20} color={Colors.primaryBlue600} />}
          style={styles.refreshButton}
        />
      </View>

      {/* Accuracy Indicator */}
      {location?.coords.accuracy && (
        <View style={styles.accuracyContainer}>
          <Text style={styles.accuracyText}>
            Accuracy: {location.coords.accuracy.toFixed(0)} meters
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    marginVertical: Layout.spacing.md,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: Layout.borderRadius.lg,
  },
  loadingText: {
    marginTop: Layout.spacing.md,
    color: Colors.textSecondary,
  },
  errorContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
  },
  errorText: {
    marginVertical: Layout.spacing.md,
    color: Colors.danger500,
    textAlign: 'center',
  },
  geofenceMarker: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.round,
    padding: Layout.spacing.xs,
    borderWidth: 2,
    borderColor: Colors.primaryBlue500,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusOverlay: {
    position: 'absolute',
    top: Layout.spacing.md,
    left: Layout.spacing.md,
    right: Layout.spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statusText: {
    fontWeight: '600',
    fontSize: Layout.fontSize.sm,
  },
  refreshButtonContainer: {
    position: 'absolute',
    bottom: Layout.spacing.md,
    right: Layout.spacing.md,
  },
  refreshButton: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.round,
    padding: Layout.spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accuracyContainer: {
    position: 'absolute',
    bottom: Layout.spacing.md,
    left: Layout.spacing.md,
    backgroundColor: Colors.white,
    paddingVertical: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  accuracyText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },
});