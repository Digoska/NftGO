import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Marker, Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { PersonalSpawn, Location } from '../../types';
import { getDistanceToSpawn, formatDistance } from '../../lib/collectNFT';
import { SPAWN_CONFIG } from '../../lib/spawnGenerator';

interface PersonalSpawnMarkerProps {
  spawn: PersonalSpawn;
  userLocation: Location;
  onPress: (spawn: PersonalSpawn) => void;
  showCollectionRadius?: boolean;
}

// Get color based on rarity
const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'legendary':
      return colors.rarityLegendary;
    case 'epic':
      return colors.rarityEpic;
    case 'rare':
      return colors.rarityRare;
    case 'common':
    default:
      return colors.rarityCommon;
  }
};

// Get light background color based on rarity
const getRarityLightColor = (rarity: string): string => {
  switch (rarity) {
    case 'legendary':
      return colors.rarityLegendaryLight;
    case 'epic':
      return colors.rarityEpicLight;
    case 'rare':
      return colors.rarityRareLight;
    case 'common':
    default:
      return colors.rarityCommonLight;
  }
};

// Get icon for rarity
const getRarityIcon = (rarity: string): keyof typeof Ionicons.glyphMap => {
  switch (rarity) {
    case 'legendary':
      return 'star';
    case 'epic':
      return 'diamond';
    case 'rare':
      return 'sparkles';
    case 'common':
    default:
      return 'cube';
  }
};

export default function PersonalSpawnMarker({
  spawn,
  userLocation,
  onPress,
  showCollectionRadius = true,
}: PersonalSpawnMarkerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const nft = spawn.nft;
  const rarity = nft?.rarity || 'common';
  const rarityColor = getRarityColor(rarity);
  const rarityLightColor = getRarityLightColor(rarity);
  const rarityIcon = getRarityIcon(rarity);
  
  // Calculate distance
  const distance = getDistanceToSpawn(
    userLocation.latitude,
    userLocation.longitude,
    spawn.latitude,
    spawn.longitude
  );
  
  const isInRange = distance <= (spawn.spawn_radius || SPAWN_CONFIG.SPAWN_COLLECTION_RADIUS);
  
  // Pulse animation when in range
  useEffect(() => {
    if (isInRange) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isInRange, pulseAnim]);
  
  const handlePress = () => {
    onPress(spawn);
  };
  
  // Calculate time remaining
  const getTimeRemaining = (): string => {
    const now = new Date();
    const expiresAt = new Date(spawn.expires_at);
    const diffMs = expiresAt.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const minutes = Math.floor(diffMs / 1000 / 60);
    if (minutes < 60) return `${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };
  
  return (
    <>
      {/* Collection radius circle */}
      {showCollectionRadius && (
        <Circle
          center={{
            latitude: spawn.latitude,
            longitude: spawn.longitude,
          }}
          radius={spawn.spawn_radius || SPAWN_CONFIG.SPAWN_COLLECTION_RADIUS}
          strokeWidth={2}
          strokeColor={isInRange ? rarityColor : `${rarityColor}80`}
          fillColor={isInRange ? `${rarityColor}30` : `${rarityColor}15`}
        />
      )}
      
      {/* Spawn marker */}
      <Marker
        coordinate={{
          latitude: spawn.latitude,
          longitude: spawn.longitude,
        }}
        onPress={handlePress}
        anchor={{ x: 0.5, y: 1 }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePress}
          style={styles.markerContainer}
        >
          <Animated.View
            style={[
              styles.marker,
              {
                backgroundColor: rarityLightColor,
                borderColor: rarityColor,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {/* NFT Image or Icon */}
            {nft?.image_url ? (
              <Image
                source={{ uri: nft.image_url }}
                style={styles.nftImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.iconContainer, { backgroundColor: rarityColor }]}>
                <Ionicons name={rarityIcon} size={24} color="#FFFFFF" />
              </View>
            )}
            
            {/* Rarity indicator */}
            <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
              <Ionicons name={rarityIcon} size={10} color="#FFFFFF" />
            </View>
            
            {/* In-range glow effect */}
            {isInRange && (
              <View style={[styles.glowRing, { borderColor: rarityColor }]} />
            )}
          </Animated.View>
          
          {/* Marker pointer */}
          <View style={[styles.markerPointer, { borderTopColor: rarityColor }]} />
          
          {/* Distance label */}
          <View style={styles.distanceContainer}>
            <Text style={[styles.distanceText, isInRange && styles.distanceTextInRange]}>
              {formatDistance(distance)}
            </Text>
            {isInRange && (
              <Text style={styles.tapToCollect}>Tap to collect!</Text>
            )}
          </View>
        </TouchableOpacity>
      </Marker>
    </>
  );
}

// Custom callout component for spawn details
export function SpawnCallout({
  spawn,
  distance,
  isInRange,
}: {
  spawn: PersonalSpawn;
  distance: number;
  isInRange: boolean;
}) {
  const nft = spawn.nft;
  const rarity = nft?.rarity || 'common';
  const rarityColor = getRarityColor(rarity);
  
  return (
    <View style={styles.calloutContainer}>
      <View style={styles.calloutHeader}>
        {nft?.image_url && (
          <Image
            source={{ uri: nft.image_url }}
            style={styles.calloutImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.calloutInfo}>
          <Text style={styles.calloutTitle} numberOfLines={1}>
            {nft?.name || 'Unknown NFT'}
          </Text>
          <View style={[styles.rarityTag, { backgroundColor: rarityColor }]}>
            <Text style={styles.rarityText}>{rarity.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.calloutStats}>
        <View style={styles.calloutStat}>
          <Ionicons name="navigate" size={14} color={colors.textSecondary} />
          <Text style={styles.calloutStatText}>{formatDistance(distance)}</Text>
        </View>
        <View style={styles.calloutStat}>
          <Ionicons 
            name={isInRange ? 'checkmark-circle' : 'close-circle'} 
            size={14} 
            color={isInRange ? colors.success : colors.error} 
          />
          <Text style={[styles.calloutStatText, { color: isInRange ? colors.success : colors.error }]}>
            {isInRange ? 'In range' : 'Too far'}
          </Text>
        </View>
      </View>
      
      {isInRange && (
        <View style={[styles.collectButton, { backgroundColor: rarityColor }]}>
          <Text style={styles.collectButtonText}>Tap to Collect</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  nftImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rarityBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  glowRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    opacity: 0.5,
  },
  markerPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  distanceContainer: {
    alignItems: 'center',
    marginTop: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  distanceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  distanceTextInRange: {
    color: colors.success,
  },
  tapToCollect: {
    fontSize: 8,
    color: colors.success,
    fontWeight: '700',
  },
  // Callout styles
  calloutContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.sm,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calloutImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  calloutInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  calloutTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  rarityTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  calloutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  calloutStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calloutStatText: {
    ...typography.caption,
    marginLeft: 4,
    color: colors.textSecondary,
  },
  collectButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    alignItems: 'center',
  },
  collectButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});

export { getRarityColor, getRarityLightColor, getRarityIcon };

