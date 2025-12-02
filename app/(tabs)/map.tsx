import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import Constants from 'expo-constants';
import MapView from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentLocation } from '../../lib/location';
import { Location as LocationType } from '../../types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import Button from '../../components/common/Button';

// Check if we're in Expo Go (maps won't work)
const isExpoGo = Constants.appOwnership === 'expo';

export default function MapScreen() {
  const [location, setLocation] = useState<LocationType | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    const loc = await getCurrentLocation();
    if (loc) {
      setLocation(loc);
      setLoading(false);
    } else {
      Alert.alert(
        'Permissions',
        'NftGO needs access to your location. Please enable location access in settings.'
      );
      setLoading(false);
    }
  };

  const centerOnUserLocation = async () => {
    const loc = await getCurrentLocation();
    if (loc && mapRef.current) {
      setLocation(loc);
      mapRef.current.animateToRegion({
        latitude: loc.latitude,
        longitude: loc.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Failed to get your location.
          </Text>
          <Button
            title="Try Again"
            onPress={initializeLocation}
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }

  // Expo Go fallback - show location info instead of map
  if (isExpoGo) {
    return (
      <View style={styles.container}>
        <View style={styles.expoGoContainer}>
          <View style={styles.expoGoHeader}>
            <Text style={styles.expoGoTitle}>📍 Your Location</Text>
            <Text style={styles.expoGoSubtitle}>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
            <View style={styles.expoGoNote}>
              <Text style={styles.expoGoNoteText}>
                ⚠️ Map view requires development build.{'\n'}
                In Expo Go, you can test location tracking.
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Development build - show Apple Maps
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="standard"
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsTraffic={false}
        showsCompass={false}
      />

      {/* Center on user location button */}
      <TouchableOpacity
        style={styles.centerButton}
        onPress={centerOnUserLocation}
        activeOpacity={0.8}
      >
        <Ionicons name="locate" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    marginTop: spacing.md,
  },
  map: {
    flex: 1,
  },
  centerButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.md,
    backgroundColor: colors.background,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Expo Go fallback styles
  expoGoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  expoGoHeader: {
    width: '100%',
    maxWidth: 400,
  },
  expoGoTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  expoGoSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  expoGoNote: {
    backgroundColor: colors.warning + '20',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning,
    marginTop: spacing.md,
  },
  expoGoNoteText: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'center',
  },
});
