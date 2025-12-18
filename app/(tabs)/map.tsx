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
import { getCurrentLocation, calculateDistance } from '../../lib/location';
import { generatePersonalSpawns, getActivePersonalSpawns, refillPersonalSpawns, SPAWN_CONFIG } from '../../lib/spawnGenerator';

// Import visibility radius constant
const VISIBILITY_RADIUS_METERS = SPAWN_CONFIG.VISIBILITY_RADIUS_METERS || 1000;
import { getTimeRemaining } from '../../lib/collectNFT';
import { supabase } from '../../lib/supabase';
import { Location as LocationType, PersonalSpawn } from '../../types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import Button from '../../components/common/Button';
import PersonalSpawnMarker from '../../components/map/PersonalSpawnMarker';
import CollectionModal from '../../components/map/CollectionModal';
import { useAuth } from '../../lib/auth-context';
import * as Location from 'expo-location';
import LocationJoystick from '../../components/dev/LocationJoystick';

// Check if we're in Expo Go (maps won't work)
const isExpoGo = Constants.appOwnership === 'expo';

export default function MapScreen() {
  const { user } = useAuth();
  const [location, setLocation] = useState<LocationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSpawns, setLoadingSpawns] = useState(false);
  const [spawns, setSpawns] = useState<PersonalSpawn[]>([]);
  const [selectedSpawn, setSelectedSpawn] = useState<PersonalSpawn | null>(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  
  // Dev mode: location override and joystick
  const [devLocation, setDevLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const spawnsLoadedRef = useRef(false);

  // Get current location (dev override or real location)
  const getCurrentLocation = () => {
    if (__DEV__ && devLocation) {
      return devLocation;
    }
    return location;
  };

  // Initialize location on mount
  useEffect(() => {
    initializeLocation();
    
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Load spawns ONCE when user and location are available
  useEffect(() => {
    if (user?.id && location && !spawnsLoadedRef.current) {
      loadSpawns();
    }
  }, [user?.id, location]);

  // Filter spawns by visibility when location changes significantly
  // Use a ref to track previous location to avoid unnecessary filtering
  const prevLocationRef = useRef<{ lat: number; lon: number } | null>(null);
  useEffect(() => {
    const currentLoc = getCurrentLocation();
    if (!currentLoc || spawns.length === 0) return;
    
    // Only re-filter if location changed significantly (more than 50m)
    const shouldRefilter = !prevLocationRef.current || 
      calculateDistance(
        prevLocationRef.current.lat,
        prevLocationRef.current.lon,
        currentLoc.latitude,
        currentLoc.longitude
      ) > 50;
    
    if (shouldRefilter) {
      // Re-filter spawns to only show visible ones
      const visibleSpawns = spawns.filter(spawn => {
        const distance = calculateDistance(
          currentLoc.latitude,
          currentLoc.longitude,
          spawn.latitude,
          spawn.longitude
        );
        return distance <= VISIBILITY_RADIUS_METERS;
      });
      
      // Only update if the count changed (avoid unnecessary re-renders)
      if (visibleSpawns.length !== spawns.length) {
        setSpawns(visibleSpawns);
        console.log(`📍 Location changed: ${visibleSpawns.length} visible spawns (filtered from ${spawns.length})`);
      }
      
      prevLocationRef.current = { lat: currentLoc.latitude, lon: currentLoc.longitude };
    }
  }, [location?.latitude, location?.longitude, devLocation?.latitude, devLocation?.longitude]);

  // Periodic spawn refill check (every 30 seconds)
  // Uses visibility-based logic: only counts visible spawns
  useEffect(() => {
    const currentLoc = getCurrentLocation();
    if (!user?.id || !currentLoc) return;

    const interval = setInterval(async () => {
      // Filter to only visible spawns (within visibility radius)
      const visibleSpawns = spawns.filter(spawn => {
        const distance = calculateDistance(
          currentLoc.latitude,
          currentLoc.longitude,
          spawn.latitude,
          spawn.longitude
        );
        return distance <= VISIBILITY_RADIUS_METERS;
      });
      
      // Only refill if visible spawns are low
      if (visibleSpawns.length < 7) {
        console.log(`🔄 Periodic check: Low visible spawns detected (${visibleSpawns.length} visible, ${spawns.length} total), refilling...`);
        const newSpawns = await refillPersonalSpawns(
          user.id,
          currentLoc.latitude,
          currentLoc.longitude,
          visibleSpawns.length
        );
        
        if (newSpawns.length > 0) {
          setSpawns(prev => [...prev, ...newSpawns]);
        }
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user?.id, location, devLocation, spawns]);

  const initializeLocation = async () => {
    try {
      const loc = await getCurrentLocation();
      if (loc) {
        setLocation(loc);
        startLocationWatching();
      } else {
        Alert.alert(
          'Permissions',
          'NftGO needs access to your location. Please enable location access in settings.'
        );
      }
    } catch (error) {
      console.error('Error initializing location:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLocationWatching = () => {
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 50,
      },
      (newLocation) => {
        setLocation({
          latitude: newLocation.coords.latitude,
          longitude: newLocation.coords.longitude,
          accuracy: newLocation.coords.accuracy || undefined,
          timestamp: newLocation.timestamp,
        });
      }
    ).then((subscription) => {
      locationSubscription.current = subscription;
    });
  };

  // Dev joystick handlers
  const handleJoystickMove = (latDelta: number, lonDelta: number) => {
    const currentLoc = getCurrentLocation();
    if (currentLoc) {
      const newLocation = {
        latitude: currentLoc.latitude + latDelta,
        longitude: currentLoc.longitude + lonDelta,
      };
      setDevLocation(newLocation);

      // Update map camera
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...newLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 100);
      }

      // Reload spawns with new location (force reload for joystick movement)
      loadSpawnsForLocation(newLocation, true);
    }
  };

  const handleJoystickToggle = () => {
    setJoystickActive(!joystickActive);
    if (!joystickActive && location) {
      // Initialize dev location to current real location
      setDevLocation(location);
    } else {
      // Reset to real location
      setDevLocation(null);
      if (location) {
        loadSpawnsForLocation(location, true);
      }
    }
  };

  // Simple spawn loading - just get or generate spawns
  // Uses visibility-based system: filters spawns by visibility radius
  const loadSpawns = async () => {
    const currentLoc = getCurrentLocation();
    if (!user?.id || !currentLoc) return;
    await loadSpawnsForLocation(currentLoc);
  };

  const loadSpawnsForLocation = async (loc: { latitude: number; longitude: number }, forceReload = false) => {
    if (!user?.id) return;
    
    // Prevent duplicate loading on initial mount (unless forced)
    if (!forceReload && spawnsLoadedRef.current) return;
    if (!forceReload) {
      spawnsLoadedRef.current = true;
    }
    
    setLoadingSpawns(true);
    try {
      console.log('📍 Loading spawns for user...');
      
      // Use the new visibility-based generation system
      const result = await generatePersonalSpawns(
        user.id,
        loc.latitude,
        loc.longitude
      );
      
      if (!result.error && result.spawns.length > 0) {
        // Filter spawns to only show visible ones (within visibility radius)
        const visibleSpawns = result.spawns.filter(spawn => {
          const distance = calculateDistance(
            loc.latitude,
            loc.longitude,
            spawn.latitude,
            spawn.longitude
          );
          return distance <= VISIBILITY_RADIUS_METERS;
        });
        
        setSpawns(visibleSpawns);
        console.log(`✅ Loaded ${visibleSpawns.length} visible spawns (${result.spawns.length} total)`);
        
        // Log rarity distribution
        const distribution = visibleSpawns.reduce((acc, s) => {
          const rarity = s.nft?.rarity || 'unknown';
          acc[rarity] = (acc[rarity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log('Rarity distribution:', distribution);
      } else {
        setSpawns([]);
      }
    } catch (error) {
      console.error('Error loading spawns:', error);
      // Reset ref on error to allow retry
      spawnsLoadedRef.current = false;
    } finally {
      setLoadingSpawns(false);
    }
  };

  // Force refresh - ONLY when user taps the button
  const handleForceRefresh = async () => {
    if (!user?.id || !location) {
      Alert.alert('Error', 'Location not available. Please try again.');
      return;
    }
    
    setLoadingSpawns(true);
    try {
      console.log('🔄 Force refreshing spawns...');
      
      // 1. Fetch IDs of uncollected spawns to delete
      const { data: spawnsToDelete, error: fetchError } = await supabase
        .from('personal_spawns')
        .select('id')
        .eq('user_id', user.id)
        .eq('collected', false);
      
      if (fetchError) {
        console.error('❌ Error fetching spawns to delete:', fetchError);
        Alert.alert('Error', 'Failed to identify old spawns');
        return;
      }
      
      const idsToDelete = spawnsToDelete?.map(s => s.id) || [];
      console.log(`📊 Found ${idsToDelete.length} spawns to delete`);
      
      if (idsToDelete.length > 0) {
        // 2. Delete by ID (more reliable)
        const { error: deleteError } = await supabase
          .from('personal_spawns')
          .delete()
          .in('id', idsToDelete);
        
        if (deleteError) {
          console.error('❌ Error deleting spawns:', deleteError);
          Alert.alert('Error', 'Failed to delete old spawns');
          return;
        }
        
        console.log(`✅ Requested deletion of ${idsToDelete.length} spawns`);
      } else {
        console.log('✅ No old spawns to delete');
      }
      
      // 3. Verify deletion completed
      const { count: afterCount } = await supabase
        .from('personal_spawns')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('collected', false);
      
      console.log(`🔍 Verification - Spawns remaining: ${afterCount}`);
      
      if (afterCount && afterCount > 0) {
        console.error('❌ Deletion failed - spawns still exist!');
        // Don't return here, try to generate anyway so user sees something new
        // But warn about database pollution
      }
      
      // 4. Generate fresh spawns (createNewSpawns directly, not generatePersonalSpawns which checks for existing)
      const spawnCount = Math.floor(Math.random() * 6) + 5; // 5-10 spawns
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
      
      console.log(`🕐 Expiration time: ${expiresAt}`);
      console.log(`🕐 Current time: ${new Date().toISOString()}`);
      
      // Fetch available NFTs
      const { data: nfts, error: nftError } = await supabase
        .from('nfts')
        .select('*')
        .in('rarity', ['common', 'rare', 'epic']);
      
      if (nftError || !nfts || nfts.length === 0) {
        console.error('No NFTs available');
        Alert.alert('Error', 'No NFTs available for spawning');
        return;
      }
      
      // Create spawn records
      const spawnsToInsert = [];
      for (let i = 0; i < spawnCount; i++) {
        // Random rarity selection (40% common, 30% rare, 30% epic)
        const rand = Math.random() * 100;
        let targetRarity = 'common';
        if (rand > 70) targetRarity = 'epic';
        else if (rand > 40) targetRarity = 'rare';
        
        const rarityNfts = nfts.filter(n => n.rarity === targetRarity);
        const selectedNft = rarityNfts.length > 0 
          ? rarityNfts[Math.floor(Math.random() * rarityNfts.length)]
          : nfts[Math.floor(Math.random() * nfts.length)];
        
        // Random location within 500m
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 500; // meters
        const latOffset = (distance / 111320) * Math.cos(angle);
        const lonOffset = (distance / (111320 * Math.cos(location.latitude * Math.PI / 180))) * Math.sin(angle);
        
        spawnsToInsert.push({
          user_id: user.id,
          nft_id: selectedNft.id,
          latitude: location.latitude + latOffset,
          longitude: location.longitude + lonOffset,
          spawn_radius: 50,
          expires_at: expiresAt,
          collected: false,
        });
      }
      
      // Insert new spawns
      const { data: newSpawns, error: insertError } = await supabase
        .from('personal_spawns')
        .insert(spawnsToInsert)
        .select(`*, nft:nfts(*)`);
      
      if (insertError) {
        console.error('❌ Error inserting spawns:', insertError);
        Alert.alert('Error', 'Failed to create new spawns');
        return;
      }
      
      // 5. Verify final count
      const { count: finalCount } = await supabase
        .from('personal_spawns')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('collected', false);
      
      console.log(`✅ Force Refresh complete. Final spawn count: ${finalCount}`);
      
      // Log expiration verification
      if (newSpawns && newSpawns.length > 0) {
        const firstSpawn = newSpawns[0];
        const expiresAtDate = new Date(firstSpawn.expires_at);
        const now = new Date();
        const diffMs = expiresAtDate.getTime() - now.getTime();
        const diffMins = Math.round(diffMs / 60000);
        console.log(`🕐 First spawn expires in ${diffMins} minutes`);
      }
      
      setSpawns(newSpawns as PersonalSpawn[]);
      
      // Log rarity distribution
      const distribution = (newSpawns || []).reduce((acc: Record<string, number>, s: any) => {
        const rarity = s.nft?.rarity || 'unknown';
        acc[rarity] = (acc[rarity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('Rarity distribution:', distribution);
      
      Alert.alert('Success', `Generated ${newSpawns?.length || 0} new spawns!\nExpires in ~60 minutes`);
      
    } catch (error) {
      console.error('Error force refreshing:', error);
      Alert.alert('Error', 'Failed to refresh spawns. Please try again.');
    } finally {
      setLoadingSpawns(false);
    }
  };

  const centerOnUserLocation = async () => {
    const currentLoc = getCurrentLocation();
    if (currentLoc && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLoc.latitude,
        longitude: currentLoc.longitude,
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
    // Remove collected spawn from list
    const remainingSpawns = spawns.filter((s) => s.id !== collectedSpawn.id);
    setSpawns(remainingSpawns);
    setSelectedSpawn(null);
    
    const currentLoc = getCurrentLocation();
    if (!user?.id || !currentLoc) return;
    
    // Filter to only visible spawns (within visibility radius)
    const visibleSpawns = remainingSpawns.filter(spawn => {
      const distance = calculateDistance(
        currentLoc.latitude,
        currentLoc.longitude,
        spawn.latitude,
        spawn.longitude
      );
      return distance <= VISIBILITY_RADIUS_METERS;
    });
    
    // Trigger refill if low on visible spawns
    if (visibleSpawns.length < 7) {
      console.log(`🔄 Collection triggered refill... (${visibleSpawns.length} visible, ${remainingSpawns.length} total)`);
      try {
        const newSpawns = await refillPersonalSpawns(
          user.id,
          currentLoc.latitude,
          currentLoc.longitude,
          visibleSpawns.length
        );
        
        if (newSpawns.length > 0) {
          // Filter new spawns to only include visible ones
          const visibleNewSpawns = newSpawns.filter(spawn => {
            const distance = calculateDistance(
              currentLoc.latitude,
              currentLoc.longitude,
              spawn.latitude,
              spawn.longitude
            );
            return distance <= VISIBILITY_RADIUS_METERS;
          });
          
          setSpawns(prev => [...prev, ...visibleNewSpawns]);
        }
      } catch (error) {
        console.error('Error refilling spawns:', error);
      }
    }
  }, [spawns, user?.id, location, devLocation]);

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

  // Expo Go fallback - show location info and spawn list
  if (isExpoGo) {
    return (
      <View style={styles.container}>
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
        showsUserLocation={!(__DEV__ && devLocation)}
        showsMyLocationButton={false}
        mapType={Platform.OS === 'android' ? "standard" : "standard"}
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsTraffic={false}
        showsCompass={false}
      >
        {/* DEV: 1km visibility circle */}
        {__DEV__ && getCurrentLocation() && (
          <Circle
            center={getCurrentLocation()!}
            radius={1000} // 1km in meters
            fillColor="rgba(124, 58, 237, 0.1)"
            strokeColor="rgba(124, 58, 237, 0.4)"
            strokeWidth={2}
          />
        )}

        {/* Custom user marker for dev mode override */}
        {__DEV__ && getCurrentLocation() && devLocation && (
          <Marker
            coordinate={getCurrentLocation()!}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
            </View>
          </Marker>
        )}

        {/* Render personal spawn markers */}
        {spawns.map((spawn) => (
          <PersonalSpawnMarker
            key={spawn.id}
            spawn={spawn}
            userLocation={getCurrentLocation() || location}
            onPress={handleSpawnPress}
            showCollectionRadius={true}
          />
        ))}
      </MapView>

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

      {/* DEV: Location Joystick */}
      {__DEV__ && (
        <LocationJoystick
          onMove={handleJoystickMove}
          onToggle={handleJoystickToggle}
          isActive={joystickActive}
        />
      )}

      {/* Collection Modal */}
      {user && (
        <CollectionModal
          visible={showCollectionModal}
          spawn={selectedSpawn}
          userLocation={getCurrentLocation() || location}
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
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  userMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 3,
    left: 3,
  },
});
