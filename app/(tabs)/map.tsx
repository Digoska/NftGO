import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';
import MapView, { Marker, Circle } from 'react-native-maps'; // Removed PROVIDER_DEFAULT
import { Ionicons } from '@expo/vector-icons';
import { getCurrentLocation as fetchLocationFromDevice, calculateDistance, locationValidator, updateUserLocation } from '../../lib/location';
import { getSpawnsWithAutoGeneration, getActivePersonalSpawns, cleanupExpiredSpawns, forceRefreshSpawns, SPAWN_CONFIG } from '../../lib/spawnGenerator';

// Import visibility radius constant
const VISIBILITY_RADIUS_METERS = SPAWN_CONFIG.VISIBILITY_RADIUS_METERS || 1000;
import { getTimeRemaining } from '../../lib/collectNFT';
import { Location as LocationType, PersonalSpawn } from '../../types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import Button from '../../components/common/Button';
import PersonalSpawnMarker from '../../components/map/PersonalSpawnMarker';
import CollectionModal from '../../components/map/CollectionModal';
import SpeedWarningBanner from '../../components/map/SpeedWarningBanner';
import { useAuth } from '../../lib/auth-context';
import * as Location from 'expo-location';

// Check if we're in Expo Go (maps won't work)
const isExpoGo = Constants.appOwnership === 'expo';

export default function MapScreen() {
  console.log('🔍 LOCATION: MapScreen component rendering');
  const { user } = useAuth();
  console.log('🔍 LOCATION: User from auth:', user?.id ? 'exists' : 'null');
  const [location, setLocation] = useState<LocationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSpawns, setLoadingSpawns] = useState(false);
  const [spawns, setSpawns] = useState<PersonalSpawn[]>([]); // Visible spawns only (for display)
  const [allActiveSpawns, setAllActiveSpawns] = useState<PersonalSpawn[]>([]); // All active spawns in 2km buffer (for smooth reveal)
  const [selectedSpawn, setSelectedSpawn] = useState<PersonalSpawn | null>(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showSpeedWarning, setShowSpeedWarning] = useState(false);
  const [speedTierStatus, setSpeedTierStatus] = useState<ReturnType<typeof locationValidator.getSpeedTierStatus> | null>(null);
  
  console.log('🔍 LOCATION: Initial state values - location:', location, 'loading:', loading);
  
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const spawnsLoadedRef = useRef(false);
  const lastCleanupRef = useRef<number>(0);

  // Initialize location on mount
  useEffect(() => {
    console.log('🔍 LOCATION: useEffect for initializeLocation() started');
    console.log('🔍 LOCATION: Current state - location:', location, 'loading:', loading);
    console.log('🔍 LOCATION: Calling initializeLocation()...');
    initializeLocation();
    
    return () => {
      console.log('🔍 LOCATION: useEffect cleanup - removing location subscription');
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Load spawns ONCE when user and location are available
  useEffect(() => {
    console.log('🔍 LOCATION: loadSpawns useEffect triggered - user?.id:', user?.id, 'location:', location ? `${location.latitude}, ${location.longitude}` : 'null', 'spawnsLoadedRef.current:', spawnsLoadedRef.current);
    
    if (!user?.id) {
      console.log('🔍 LOCATION: loadSpawns - No user ID, skipping');
      return;
    }
    
    if (!location) {
      console.log('🔍 LOCATION: loadSpawns - No location, skipping');
      return;
    }
    
    if (spawnsLoadedRef.current) {
      console.log('🔍 LOCATION: loadSpawns - Already loaded, skipping');
      return;
    }
    
    console.log('🔍 LOCATION: Conditions met, calling loadSpawnsForLocation...');
    loadSpawnsForLocation(location, false);
  }, [user?.id, location]);

  // Reveal spawns as player moves (1km visibility radius)
  // Spawns exist in 2km buffer zone, only shown when player within 1km
  // Smooth discovery through movement - no artificial generation
  const prevLocationRef = useRef<{ lat: number; lon: number } | null>(null);
  useEffect(() => {
    if (!location || !user?.id) return;
    
    // Check speed tier status - if spawns should be hidden, don't update spawns
    // Use stored tier status if available, otherwise get current status
    const tierStatus = speedTierStatus || locationValidator.getSpeedTierStatus();
    if (tierStatus.shouldHideSpawns) {
      console.log('🚫 Spawns hidden due to high speed');
      return; // Skip spawn update - freeze current view
    }
    
    // Only reload if location changed significantly (more than 200m)
    // This ensures buffer zone spawns become visible as player explores
    const shouldReload = !prevLocationRef.current || 
      calculateDistance(
        prevLocationRef.current.lat,
        prevLocationRef.current.lon,
        location.latitude,
        location.longitude
      ) > 200;
    
    if (shouldReload) {
      // Reload spawns from database to get newly visible ones from buffer zone
      // This reveals spawns that were previously outside visibility radius
      // Pass forceReload=true to allow reloading even if spawns were already loaded
      loadSpawnsForLocation(location, true);
      prevLocationRef.current = { lat: location.latitude, lon: location.longitude };
    } else if (allActiveSpawns.length > 0) {
      // For smaller movements, re-filter from all active spawns (including buffer zone)
      // This smoothly reveals buffer zone spawns as player moves closer
      const visibleSpawns = allActiveSpawns.filter(spawn => {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          spawn.latitude,
          spawn.longitude
        );
        return distance <= VISIBILITY_RADIUS_METERS;
      });
      
      // Only update if the count changed (avoid unnecessary re-renders)
      if (visibleSpawns.length !== spawns.length) {
        setSpawns(visibleSpawns);
        console.log(`📍 Location changed: ${visibleSpawns.length} visible spawns (filtered from ${allActiveSpawns.length} total)`);
      }
    }
  }, [location?.latitude, location?.longitude, user?.id, spawns.length, allActiveSpawns.length, speedTierStatus]);


  const initializeLocation = async () => {
    console.log('🔍 LOCATION: initializeLocation() function called');
    console.log('🔍 LOCATION: Current state before initialization - location:', location, 'loading:', loading);
    try {
      console.log('🔍 LOCATION: About to call fetchLocationFromDevice()...');
      const loc = await fetchLocationFromDevice();
      console.log('🔍 LOCATION: fetchLocationFromDevice() returned:', JSON.stringify(loc));
      if (loc) {
        console.log('🔍 LOCATION: Location received, setting location state...');
        setLocation(loc);
        console.log('🔍 LOCATION: Starting location watching...');
        startLocationWatching();
        console.log('🔍 LOCATION: Location initialization successful');
      } else {
        console.log('🔍 LOCATION: No location returned from fetchLocationFromDevice');
        
        // Double check permissions
        const { status } = await Location.getForegroundPermissionsAsync();
        console.log('🔍 LOCATION: Current permission status:', status);
        
        console.log('🔍 LOCATION: Showing alert...');
        Alert.alert(
          'Permissions',
          'NftGO needs access to your location. Please enable location access in settings.'
        );
      }
    } catch (error) {
      console.error('🔍 LOCATION: Error in initializeLocation():', error);
      console.error('🔍 LOCATION: Error details:', JSON.stringify(error, null, 2));
    } finally {
      console.log('🔍 LOCATION: Setting loading to false');
      setLoading(false);
      console.log('🔍 LOCATION: initializeLocation() completed');
    }
  };

  const startLocationWatching = () => {
    console.log('🔍 LOCATION: startLocationWatching() called');
    console.log('🔍 LOCATION: Setting up watchPositionAsync...');
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 50,
      },
      (newLocation) => {
        console.log('🔍 LOCATION: watchPositionAsync callback triggered:', {
          latitude: newLocation.coords.latitude,
          longitude: newLocation.coords.longitude,
          accuracy: newLocation.coords.accuracy,
        });
        
        const locationData = {
          latitude: newLocation.coords.latitude,
          longitude: newLocation.coords.longitude,
          accuracy: newLocation.coords.accuracy || undefined,
          timestamp: newLocation.timestamp,
        };
        
        // Add location to validator for movement tracking
        locationValidator.addLocation(
          locationData.latitude,
          locationData.longitude,
          locationData.accuracy
        );
        
        // Get speed tier status after adding location
        const tierStatus = locationValidator.getSpeedTierStatus();
        setSpeedTierStatus(tierStatus);
        
        // Update warning visibility
        if (tierStatus.shouldShowWarning) {
          setShowSpeedWarning(true);
        } else {
          setShowSpeedWarning(false);
        }
        
        // Debug logging
        console.log(`🚗 Speed tier: ${tierStatus.tier}, Speed: ${tierStatus.calculatedSpeed?.toFixed(1) || 0} km/h`);
        if (tierStatus.isBanned) {
          console.log(`🔒 Silent ban active, expires in ${tierStatus.banExpiresIn}ms`);
        }
        if (tierStatus.cooldownProgress !== undefined && tierStatus.cooldownProgress < 1) {
          console.log(`⏳ Cooldown: ${Math.round(tierStatus.cooldownProgress * 12)}/12 (${Math.round(tierStatus.cooldownProgress * 100)}%)`);
        }
        
        // Update user location in database (throttled automatically)
        // Only updates if 30+ seconds passed OR user moved 100+ meters
        updateUserLocation(user?.id, locationData, false).catch(err => {
          console.error('Error updating user location:', err);
        });
        
        // Periodic cleanup every 5 minutes
        const now = Date.now();
        if (now - lastCleanupRef.current > 5 * 60 * 1000) {
          console.log('🧹 Running periodic expired spawn cleanup...');
          cleanupExpiredSpawns().catch(err => {
            console.error('Periodic cleanup error:', err);
          });
          lastCleanupRef.current = now;
        }
        
        setLocation(locationData);
        console.log('🔍 LOCATION: Location state updated from watchPositionAsync');
      }
    ).then((subscription) => {
      console.log('🔍 LOCATION: watchPositionAsync subscription created:', subscription);
      locationSubscription.current = subscription;
      console.log('🔍 LOCATION: Location watching started successfully');
    }).catch((error) => {
      console.error('🔍 LOCATION: Error in watchPositionAsync:', error);
    });
  };

  // Simple spawn loading - just get or generate spawns
  // Uses visibility-based system: filters spawns by visibility radius
  const loadSpawns = async () => {
    if (!user?.id || !location) return;
    await loadSpawnsForLocation(location);
  };

  const loadSpawnsForLocation = async (loc: { latitude: number; longitude: number }, forceReload = false) => {
    console.log('📍 loadSpawnsForLocation called:', {
      lat: loc.latitude,
      lon: loc.longitude,
      userId: user?.id,
      forceReload,
      spawnsLoadedRef: spawnsLoadedRef.current
    });
    
    if (!user?.id) {
      console.error('❌ loadSpawnsForLocation: No user ID available');
      return;
    }
    
    // Check location validity
    if (!loc || !isFinite(loc.latitude) || !isFinite(loc.longitude)) {
      console.error('❌ loadSpawnsForLocation: Invalid location coordinates:', loc);
      return;
    }
    
    // Check location accuracy if available
    if (loc.accuracy && loc.accuracy > 1000) {
      console.warn('⚠️ loadSpawnsForLocation: Low location accuracy:', loc.accuracy, 'meters');
    }
    
    // Prevent duplicate loading on initial mount (unless forced)
    if (!forceReload && spawnsLoadedRef.current) {
      console.log('📍 loadSpawnsForLocation: Skipping - already loaded (use forceReload=true to override)');
      return;
    }
    if (!forceReload) {
      spawnsLoadedRef.current = true;
    }
    
    setLoadingSpawns(true);
    try {
      console.log('📍 Loading spawns for user:', user.id, 'at location:', loc.latitude, loc.longitude);
      
      // Use secure RPC-based spawn system with automatic generation
      // This enforces rate limiting and handles generation securely
      console.log('📍 Calling getSpawnsWithAutoGeneration...');
      const result = await getSpawnsWithAutoGeneration(
        loc.latitude,
        loc.longitude
      );
      
      console.log('📍 getSpawnsWithAutoGeneration result:', {
        error: result.error,
        hasSpawns: !!result.spawns,
        spawnCount: result.spawns?.length || 0
      });
      
      if (result.error) {
        console.error('❌ getSpawnsWithAutoGeneration error:', result.error);
        setSpawns([]);
        setAllActiveSpawns([]);
        return;
      }
      
      // Load ALL active spawns (including buffer zone) so they can be revealed as player moves
      // This ensures smooth discovery - spawns in buffer zone are in state, just filtered for display
      console.log('📍 Loading all active personal spawns for user:', user.id);
      const allActiveSpawns = await getActivePersonalSpawns(user.id);
      console.log('📍 getActivePersonalSpawns returned:', allActiveSpawns.length, 'spawns');
      
      // Store all active spawns in state (for smooth reveal as player moves)
      setAllActiveSpawns(allActiveSpawns);
      
      // Filter spawns to only show visible ones (within visibility radius)
      // Buffer zone spawns (1-2km) are in allActiveSpawns but hidden until player moves closer
      const visibleSpawns = allActiveSpawns.filter(spawn => {
        const distance = calculateDistance(
          loc.latitude,
          loc.longitude,
          spawn.latitude,
          spawn.longitude
        );
        return distance <= VISIBILITY_RADIUS_METERS;
      });
      
      // Display only visible spawns
      setSpawns(visibleSpawns);
      console.log(`✅ Loaded ${visibleSpawns.length} visible spawns (${allActiveSpawns.length} total active in 2km buffer)`);
      
      // Log rarity distribution
      const distribution = visibleSpawns.reduce((acc, s) => {
        const rarity = s.nft?.rarity || 'unknown';
        acc[rarity] = (acc[rarity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('Rarity distribution:', distribution);
    } catch (error) {
      console.error('❌ Error loading spawns:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      // Reset ref on error to allow retry
      spawnsLoadedRef.current = false;
      setSpawns([]);
      setAllActiveSpawns([]);
    } finally {
      setLoadingSpawns(false);
      console.log('📍 loadSpawnsForLocation completed');
    }
  };

  // Force refresh - ONLY when user taps the button
  // SECURITY: Uses secure forceRefreshSpawns() function (dev mode only)
  const handleForceRefresh = async () => {
    if (!__DEV__) {
       console.log('Force refresh is only available in development mode');
       return;
    }

    if (!user?.id || !location) {
      Alert.alert('Error', 'Location not available. Please try again.');
      return;
    }
    
    setLoadingSpawns(true);
    try {
      console.log('🔄 Force refreshing spawns...');
      
      // Use secure forceRefreshSpawns() function (dev mode only, uses spawn_generator role)
      const result = await forceRefreshSpawns(user.id, location.latitude, location.longitude);
      
      if (result.error) {
        Alert.alert('Error', result.error);
        return;
      }
      
      // Filter to visible spawns for display
      const visibleSpawns = result.spawns.filter(spawn => {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          spawn.latitude,
          spawn.longitude
        );
        return distance <= VISIBILITY_RADIUS_METERS;
      });
      
      // Update state
      setSpawns(visibleSpawns);
      setAllActiveSpawns(result.spawns);
      
      // Log rarity distribution
      const distribution = visibleSpawns.reduce((acc: Record<string, number>, s) => {
        const rarity = s.nft?.rarity || 'unknown';
        acc[rarity] = (acc[rarity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('Rarity distribution:', distribution);
      
      Alert.alert('Success', `Generated ${result.spawns.length} new spawns!\nExpires in ~60 minutes`);
      
    } catch (error) {
      console.error('Error force refreshing:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to refresh spawns';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoadingSpawns(false);
    }
  };

  const centerOnUserLocation = async () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  const handleSpawnPress = useCallback((spawn: PersonalSpawn) => {
    setSelectedSpawn(spawn);
    setShowCollectionModal(true);
  }, []);

  const handleCollected = useCallback(async (collectedSpawn: PersonalSpawn) => {
    // Remove collected spawn from both visible and all active lists
    const remainingSpawns = spawns.filter((s) => s.id !== collectedSpawn.id);
    const remainingAllSpawns = allActiveSpawns.filter((s) => s.id !== collectedSpawn.id);
    setSpawns(remainingSpawns);
    setAllActiveSpawns(remainingAllSpawns);
    setSelectedSpawn(null);
    
    // No instant refills - player must explore to discover more spawns from buffer zone
    // The buffer zone system automatically maintains 15-20 spawns, revealed through movement
  }, [spawns, allActiveSpawns]);

  const handleCloseModal = useCallback(() => {
    setShowCollectionModal(false);
    setSelectedSpawn(null);
  }, []);

  // Helper function for Expo Go rarity colors
  const getRarityColorForExpoGo = (rarity?: string): string => {
    switch (rarity) {
      case 'legendary': return colors.rarityLegendary;
      case 'epic': return colors.rarityEpic;
      case 'rare': return colors.rarityRare;
      case 'common':
      default: return colors.rarityCommon;
    }
  };

  console.log('🔍 LOCATION: Checking render conditions - loading:', loading, 'location:', location);
  if (loading) {
    console.log('🔍 LOCATION: Rendering loading screen');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (!location) {
    console.log('🔍 LOCATION: Rendering error screen - no location available');
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Failed to get your location.
          </Text>
          <Button
            title="Try Again"
            onPress={() => {
              console.log('🔍 LOCATION: Try Again button pressed');
              initializeLocation();
            }}
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }

  // Expo Go fallback - show location info and spawn list
  if (isExpoGo) {
    return (
      <View style={styles.container}>
        {/* Speed Warning Banner */}
        {showSpeedWarning && (
          <SpeedWarningBanner 
            visible={showSpeedWarning}
            onDismiss={() => setShowSpeedWarning(false)}
          />
        )}
        
        <View style={styles.expoGoContainer}>
          <View style={styles.expoGoHeader}>
            <Text style={styles.expoGoTitle}>📍 Your Location</Text>
            <Text style={styles.expoGoSubtitle}>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
            
            {/* Spawn count indicator */}
            <View style={styles.spawnCountContainer}>
              <Ionicons name="sparkles" size={20} color={colors.primary} />
              <Text style={styles.spawnCountText}>
                {spawns.length} NFTs nearby
              </Text>
              {loadingSpawns && (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
              )}
            </View>
            
            {/* Spawn list for Expo Go */}
            {spawns.length > 0 && (
              <View style={styles.spawnList}>
                <Text style={styles.spawnListTitle}>Nearby Spawns:</Text>
                {spawns.slice(0, 10).map((spawn) => {
                  const distance = Math.round(
                    calculateDistance(
                      location.latitude,
                      location.longitude,
                      spawn.latitude,
                      spawn.longitude
                    )
                  );
                  const nft = spawn.nft;
                  // Calculate time remaining using shared utility
                  const timeInfo = getTimeRemaining(spawn.expires_at);
                  const timeLeft = timeInfo.isExpired ? 'Expired' : `Expires in ${timeInfo.text}`;
                  
                  return (
                    <TouchableOpacity
                      key={spawn.id}
                      style={styles.spawnListItem}
                      onPress={() => handleSpawnPress(spawn)}
                    >
                      <View style={[styles.rarityDot, { backgroundColor: getRarityColorForExpoGo(nft?.rarity) }]} />
                      <Text style={styles.spawnListName} numberOfLines={1}>
                        {nft?.name || 'Unknown NFT'}
                      </Text>
                      <Text style={styles.spawnListTime}>{timeLeft}</Text>
                      <Text style={styles.spawnListDistance}>{distance}m</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            
            {spawns.length === 0 && !loadingSpawns && (
              <View style={styles.noSpawnsContainer}>
                <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
                <Text style={styles.noSpawnsText}>No spawns found</Text>
                <Text style={styles.noSpawnsSubtext}>Tap "Force Refresh" to generate spawns</Text>
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.refreshButton, loadingSpawns && styles.refreshButtonDisabled]}
              onPress={handleForceRefresh}
              disabled={loadingSpawns}
            >
              <Ionicons name="refresh" size={18} color={loadingSpawns ? colors.textMuted : colors.primary} />
              <Text style={[styles.refreshButtonText, loadingSpawns && { color: colors.textMuted }]}>
                {loadingSpawns ? 'Refreshing...' : '🔄 Force Refresh Spawns'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.expoGoNote}>
              <Text style={styles.expoGoNoteText}>
                ⚠️ Full map view requires development build.{'\n'}
                In Expo Go, you can test spawn generation and collection.
              </Text>
            </View>
          </View>
        </View>
        
        {/* Collection Modal */}
        {user && (
          <CollectionModal
            visible={showCollectionModal}
            spawn={selectedSpawn}
            userLocation={location}
            userId={user.id}
            onClose={handleCloseModal}
            onCollected={handleCollected}
          />
        )}
      </View>
    );
  }

  // Development build - show Apple Maps with spawns
  // On Android, attempting to use OpenStreetMap (osmdroid) often requires complex config.
  // Falling back to Google Maps (requires key) is safer.
  // If 'osmdroid' caused "Element type is invalid", we revert to default (Google Maps).
  const mapProvider = undefined; // Uses default (Google Maps on Android, Apple Maps on iOS)

  console.log('🗺️ MapScreen rendering. MapView:', !!MapView);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={mapProvider}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        mapType={Platform.OS === 'android' ? "standard" : "standard"}
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsTraffic={false}
        showsCompass={false}
      >
        {/* 1km visibility circle - always visible */}
        {location && (
          <Circle
            center={location}
            radius={1000} // 1km in meters
            fillColor="rgba(124, 58, 237, 0.1)"
            strokeColor="rgba(124, 58, 237, 0.4)"
            strokeWidth={2}
          />
        )}

        {/* Render personal spawn markers */}
        {spawns.map((spawn) => (
          <PersonalSpawnMarker
            key={spawn.id}
            spawn={spawn}
            userLocation={location}
            onPress={handleSpawnPress}
            showCollectionRadius={true}
          />
        )        )}
      </MapView>

      {/* Speed Warning Banner */}
      {showSpeedWarning && (
        <SpeedWarningBanner 
          visible={showSpeedWarning}
          onDismiss={() => setShowSpeedWarning(false)}
        />
      )}

      {/* Spawn count indicator */}
      <View style={styles.spawnIndicator}>
        <Ionicons name="sparkles" size={18} color={colors.primary} />
        <Text style={styles.spawnIndicatorText}>
          {spawns.length} NFTs nearby
        </Text>
        {loadingSpawns && (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
        )}
      </View>

      {/* Center on user location button */}
      <TouchableOpacity
        style={styles.centerButton}
        onPress={centerOnUserLocation}
        activeOpacity={0.8}
      >
        <Ionicons name="locate" size={24} color={colors.primary} />
      </TouchableOpacity>

      {/* Refresh spawns button (for testing) */}
      <TouchableOpacity
        style={styles.refreshMapButton}
        onPress={handleForceRefresh}
        activeOpacity={0.8}
        disabled={loadingSpawns}
      >
        <Ionicons 
          name="refresh" 
          size={24} 
          color={loadingSpawns ? colors.textMuted : colors.primary} 
        />
      </TouchableOpacity>

      {/* Collection Modal */}
        {user && (
          <CollectionModal
            visible={showCollectionModal}
            spawn={selectedSpawn}
            userLocation={location}
            userId={user.id}
            onClose={handleCloseModal}
            onCollected={handleCollected}
          />
        )}
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
  refreshMapButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.md + 60,
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
  spawnIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: 'center',
  },
  spawnIndicatorText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  // Expo Go fallback styles
  expoGoContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
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
  spawnCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundCard,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    marginBottom: spacing.md,
  },
  spawnCountText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.xs,
  },
  spawnList: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  spawnListTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  spawnListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rarityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  spawnListName: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  spawnListTime: {
    ...typography.caption,
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  spawnListDistance: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  noSpawnsContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  noSpawnsText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
  },
  noSpawnsSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundCard,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    marginBottom: spacing.md,
  },
  refreshButtonDisabled: {
    opacity: 0.6,
  },
  refreshButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
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
