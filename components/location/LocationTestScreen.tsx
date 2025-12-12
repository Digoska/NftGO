import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentLocation, watchPosition } from '../../lib/location';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import Constants from 'expo-constants';
import * as Location from 'expo-location';

export default function LocationTestScreen() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [watching, setWatching] = useState(false);
  const [subscription, setSubscription] = useState<Location.LocationSubscription | null>(null);

  const isExpoGo = Constants.appOwnership === 'expo';

  useEffect(() => {
    return () => {
      // Cleanup subscription on unmount
      if (subscription) {
        subscription.remove();
      }
    };
  }, [subscription]);

  const handleGetLocation = async () => {
    setLoading(true);
    try {
      const loc = await getCurrentLocation();
      if (loc) {
        setLocation(loc);
        Alert.alert(
          'Location Retrieved',
          `Lat: ${loc.latitude.toFixed(6)}\nLon: ${loc.longitude.toFixed(6)}\nAccuracy: ${loc.accuracy ? `${loc.accuracy.toFixed(0)}m` : 'Unknown'}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to get location. Check permissions.');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  const handleStartWatching = async () => {
    if (watching && subscription) {
      subscription.remove();
      setSubscription(null);
      setWatching(false);
      return;
    }

    setWatching(true);
    const sub = watchPosition((loc) => {
      setLocation(loc);
      console.log('📍 Location update:', loc);
    });
    setSubscription(sub);
  };

  const handleStopWatching = () => {
    if (subscription) {
      subscription.remove();
      setSubscription(null);
      setWatching(false);
    }
  };

  const showExpoGoInstructions = () => {
    Alert.alert(
      '📍 Simulate Location in Expo Go',
      `1. Shake your device (or press Cmd+D / Ctrl+D)
2. Tap "Configure Location"
3. Choose:
   • "Custom Location" - Enter coordinates manually
   • "Apple" - Apple HQ (37.3349, -122.0090)
   • "Google" - Google HQ (37.4220, -122.0841)
   • "None" - Use real GPS

💡 For NFT testing, use coordinates near spawn points:
   Example: 48.1486, 17.1077 (Bratislava)

⚠️ Location simulation only works in Expo Go`,
      [{ text: 'Got it!' }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>GPS Location Test</Text>
          {isExpoGo && (
            <View style={styles.expoGoBadge}>
              <Text style={styles.expoGoText}>Expo Go</Text>
            </View>
          )}
        </View>

        {isExpoGo && (
          <TouchableOpacity
            style={styles.infoCard}
            onPress={showExpoGoInstructions}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Location Simulation Available</Text>
              <Text style={styles.infoSubtitle}>Tap to see instructions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Location</Text>
          
          {location ? (
            <View style={styles.locationCard}>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <View style={styles.locationInfo}>
                  <Text style={styles.label}>Latitude</Text>
                  <Text style={styles.value}>{location.latitude.toFixed(6)}</Text>
                </View>
              </View>
              
              <View style={styles.locationRow}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <View style={styles.locationInfo}>
                  <Text style={styles.label}>Longitude</Text>
                  <Text style={styles.value}>{location.longitude.toFixed(6)}</Text>
                </View>
              </View>

              {location.accuracy && (
                <View style={styles.locationRow}>
                  <Ionicons name="resize" size={20} color={colors.textSecondary} />
                  <View style={styles.locationInfo}>
                    <Text style={styles.label}>Accuracy</Text>
                    <Text style={styles.value}>{location.accuracy.toFixed(0)} meters</Text>
                  </View>
                </View>
              )}

              {location.timestamp && (
                <View style={styles.locationRow}>
                  <Ionicons name="time" size={20} color={colors.textSecondary} />
                  <View style={styles.locationInfo}>
                    <Text style={styles.label}>Timestamp</Text>
                    <Text style={styles.value}>
                      {new Date(location.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="location-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No location data</Text>
              <Text style={styles.emptySubtext}>Tap "Get Location" to fetch</Text>
            </View>
          )}
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleGetLocation}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Ionicons name="locate" size={20} color={colors.background} />
                <Text style={styles.buttonText}>Get Current Location</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              watching ? styles.stopButton : styles.secondaryButton,
            ]}
            onPress={handleStartWatching}
            activeOpacity={0.7}
          >
            <Ionicons
              name={watching ? 'stop-circle' : 'play-circle'}
              size={20}
              color={watching ? colors.background : colors.primary}
            />
            <Text
              style={[
                styles.buttonText,
                watching && { color: colors.background },
              ]}
            >
              {watching ? 'Stop Watching' : 'Start Watching Location'}
            </Text>
          </TouchableOpacity>
        </View>

        {watching && (
          <View style={styles.watchingCard}>
            <Ionicons name="radio-button-on" size={16} color={colors.warning} />
            <Text style={styles.watchingText}>
              Watching location updates... (check console for updates)
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Test Coordinates</Text>
          <View style={styles.coordinatesList}>
            {[
              { name: 'Bratislava (Slovakia)', lat: 48.1486, lon: 17.1077 },
              { name: 'Apple HQ', lat: 37.3349, lon: -122.0090 },
              { name: 'Google HQ', lat: 37.4220, lon: -122.0841 },
              { name: 'New York', lat: 40.7128, lon: -74.0060 },
              { name: 'London', lat: 51.5074, lon: -0.1278 },
            ].map((coord, index) => (
              <TouchableOpacity
                key={index}
                style={styles.coordinateCard}
                onPress={() => {
                  setLocation({
                    latitude: coord.lat,
                    longitude: coord.lon,
                    accuracy: 10,
                    timestamp: Date.now(),
                  });
                  Alert.alert(
                    'Coordinates Set',
                    `${coord.name}\nLat: ${coord.lat}\nLon: ${coord.lon}\n\nNote: This is just for display. To actually simulate location in Expo Go, use the developer menu.`,
                    [{ text: 'OK' }]
                  );
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.coordinateName}>{coord.name}</Text>
                <Text style={styles.coordinateValue}>
                  {coord.lat.toFixed(4)}, {coord.lon.toFixed(4)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    fontWeight: 'bold',
  },
  expoGoBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  expoGoText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  infoText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: 2,
  },
  infoSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  locationCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  locationInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  value: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.md,
    fontWeight: '600',
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  buttonSection: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  stopButton: {
    backgroundColor: colors.warning,
  },
  buttonText: {
    ...typography.bodyBold,
    color: colors.primary,
    fontSize: 16,
  },
  watchingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  watchingText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  coordinatesList: {
    gap: spacing.sm,
  },
  coordinateCard: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coordinateName: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: 4,
  },
  coordinateValue: {
    ...typography.caption,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
});




