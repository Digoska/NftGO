import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { PersonalSpawn, Location } from '../../types';
import { collectPersonalNFT, formatDistance, getDistanceToSpawn, getTimeRemaining } from '../../lib/collectNFT';
import { SPAWN_CONFIG } from '../../lib/spawnGenerator';
import { getRarityColor, getRarityIcon } from './PersonalSpawnMarker';
import WebViewModel from '../nft/WebViewModel';
import { locationValidator } from '../../lib/location';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Helper functions to detect media type
const is3DModel = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const urlLower = url.toLowerCase();
  return urlLower.endsWith('.glb') || urlLower.endsWith('.gltf') || urlLower.includes('.glb') || urlLower.includes('.gltf');
};

const isValidImageURL = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const urlLower = url.toLowerCase();
  return imageExtensions.some(ext => urlLower.includes(ext));
};

interface CollectionModalProps {
  visible: boolean;
  spawn: PersonalSpawn | null;
  userLocation: Location;
  userId: string;
  onClose: () => void;
  onCollected: (spawn: PersonalSpawn) => void;
}

type ModalState = 'preview' | 'collecting' | 'success' | 'error';

export default function CollectionModal({
  visible,
  spawn,
  userLocation,
  userId,
  onClose,
  onCollected,
}: CollectionModalProps) {
  const [state, setState] = useState<ModalState>('preview');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const successScaleAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  
  const nft = spawn?.nft;
  const rarity = nft?.rarity || 'common';
  const rarityColor = getRarityColor(rarity);
  const rarityIcon = getRarityIcon(rarity);
  
  // Calculate distance
  const distance = spawn
    ? getDistanceToSpawn(
        userLocation.latitude,
        userLocation.longitude,
        spawn.latitude,
        spawn.longitude
      )
    : 0;
  
  const isInRange = distance <= (spawn?.spawn_radius || SPAWN_CONFIG.SPAWN_COLLECTION_RADIUS);
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setState('preview');
      setErrorMessage('');
      setImageLoading(true);
      setImageError(false);
      
      // Entry animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      successScaleAnim.setValue(0);
      confettiAnim.setValue(0);
    }
  }, [visible]);
  
  const handleCollect = async () => {
    if (!spawn || !isInRange) return;
    
    // Add current location to validator history
    locationValidator.addLocation(
      userLocation.latitude,
      userLocation.longitude,
      userLocation.accuracy
    );
    
    // Validate movement before collection
    const movementValidation = locationValidator.isValidMovement(
      userLocation.latitude,
      userLocation.longitude
    );
    
    if (!movementValidation.valid) {
      console.log('🚨 Movement validation failed:', movementValidation.reason);
      setState('error');
      setErrorMessage(movementValidation.reason || 'Movement too fast, possible GPS spoofing detected');
      return;
    }
    
    // Check for teleportation
    if (locationValidator.detectTeleport(userLocation.latitude, userLocation.longitude)) {
      console.log('🚨 Teleportation detected');
      setState('error');
      setErrorMessage('Unrealistic movement detected. Please try again.');
      return;
    }
    
    setState('collecting');
    
    try {
      const result = await collectPersonalNFT(
        userId,
        spawn.id,
        userLocation.latitude,
        userLocation.longitude
      );
      
      if (result.success) {
        setState('success');
        
        // Success animation
        Animated.sequence([
          Animated.spring(successScaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
        
        // Auto close after success
        setTimeout(() => {
          onCollected(spawn);
          onClose();
        }, 2500);
      } else {
        setState('error');
        setErrorMessage(result.error);
      }
    } catch (error) {
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to collect NFT');
    }
  };
  
  const handleClose = () => {
    if (state === 'collecting') return; // Don't allow close while collecting
    onClose();
  };
  
  if (!spawn || !nft) return null;
  
  // Use shared utility for consistent time calculation
  const timeInfo = getTimeRemaining(spawn.expires_at);
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Close button */}
          {state !== 'collecting' && state !== 'success' && (
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          
          {/* Preview / Error State */}
          {(state === 'preview' || state === 'error') && (
            <>
              {/* NFT Image / 3D Model */}
              <View style={[styles.imageContainer, { borderColor: rarityColor }]}>
                {(() => {
                  const imageUrl = nft?.image_url;
                  const thumbnailUrl = nft?.thumbnail_url;
                  const canLoad3D = is3DModel(imageUrl);
                  
                  // Collection modal is the detail view - show 3D model for ALL rarities
                  if (canLoad3D && imageUrl) {
                    // Use WebViewModel component for GLB/GLTF 3D models
                    return (
                      <View style={styles.modelContainer}>
                        {imageLoading && (
                          <View style={styles.modelLoadingOverlay}>
                            <ActivityIndicator size="large" color={rarityColor} />
                            <Text style={styles.modelLoadingText}>Loading 3D...</Text>
                          </View>
                        )}
                        <WebViewModel 
                          uri={imageUrl}
                          autoRotate={true}
                          onLoad={() => setImageLoading(false)}
                        />
                      </View>
                    );
                  } else if ((thumbnailUrl || isValidImageURL(imageUrl)) && !imageError) {
                    // Use thumbnail or image for non-3D NFTs
                    return (
                      <View style={styles.imageWrapper}>
                        <Image
                          source={{ uri: thumbnailUrl || imageUrl }}
                          style={styles.nftImage}
                          resizeMode="cover"
                          onLoadStart={() => setImageLoading(true)}
                          onLoadEnd={() => setImageLoading(false)}
                          onError={(e) => {
                            console.log('Image load error:', e.nativeEvent.error);
                            setImageError(true);
                            setImageLoading(false);
                          }}
                        />
                        {imageLoading && (
                          <View style={styles.imageLoaderContainer}>
                            <ActivityIndicator size="large" color={rarityColor} />
                          </View>
                        )}
                      </View>
                    );
                  } else {
                    // Fallback placeholder for invalid URLs or errors
                    return (
                      <View style={[styles.placeholderImage, { backgroundColor: rarityColor }]}>
                        <Ionicons name={rarityIcon} size={60} color="#FFFFFF" />
                        <Text style={styles.placeholderText}>{rarity.toUpperCase()}</Text>
                      </View>
                    );
                  }
                })()}
                
                {/* Rarity badge */}
                <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                  <Ionicons name={rarityIcon} size={14} color="#FFFFFF" />
                  <Text style={styles.rarityText}>{rarity.toUpperCase()}</Text>
                </View>
              </View>
              
              {/* NFT Info */}
              <Text style={styles.nftName}>{nft.name}</Text>
              {nft.description && (
                <Text style={styles.nftDescription} numberOfLines={2}>
                  {nft.description}
                </Text>
              )}
              
              {/* Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.stat}>
                  <Ionicons name="navigate-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.statLabel}>Distance</Text>
                  <Text style={[styles.statValue, !isInRange && styles.statValueWarning]}>
                    {formatDistance(distance)}
                  </Text>
                </View>
                
                <View style={styles.statDivider} />
                
                <View style={styles.stat}>
                  <Ionicons 
                    name="time-outline" 
                    size={18} 
                    color={timeInfo.isExpired ? colors.error : colors.textSecondary} 
                  />
                  <Text style={styles.statLabel}>
                    {timeInfo.isExpired ? 'Status' : 'Expires in'}
                  </Text>
                  <Text style={[
                    styles.statValue, 
                    timeInfo.isExpired && styles.statValueExpired
                  ]}>
                    {timeInfo.text}
                  </Text>
                </View>
                
                <View style={styles.statDivider} />
                
                <View style={styles.stat}>
                  <Ionicons name="radio-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.statLabel}>Range</Text>
                  <Text style={styles.statValue}>
                    {spawn.spawn_radius || SPAWN_CONFIG.SPAWN_COLLECTION_RADIUS}m
                  </Text>
                </View>
              </View>
              
              {/* Expiration Warning */}
              {timeInfo.isExpired && (
                <View style={styles.warningContainer}>
                  <Ionicons name="warning" size={20} color={colors.error} />
                  <Text style={styles.warningText}>This spawn has expired</Text>
                </View>
              )}
              
              {/* Error message */}
              {state === 'error' && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color={colors.error} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}
              
              {/* Action button */}
              {isInRange ? (
                <TouchableOpacity
                  style={[
                    styles.collectButton, 
                    { backgroundColor: rarityColor },
                    timeInfo.isExpired && styles.collectButtonDisabled
                  ]}
                  onPress={handleCollect}
                  activeOpacity={0.8}
                  disabled={timeInfo.isExpired}
                >
                  <Ionicons name="hand-left" size={20} color="#FFFFFF" />
                  <Text style={styles.collectButtonText}>
                    {timeInfo.isExpired ? 'Expired' : 'Collect NFT'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.tooFarContainer}>
                  <Ionicons name="walk-outline" size={24} color={colors.warning} />
                  <Text style={styles.tooFarText}>
                    Move {formatDistance(distance - (spawn.spawn_radius || SPAWN_CONFIG.SPAWN_COLLECTION_RADIUS))} closer to collect
                  </Text>
                </View>
              )}
            </>
          )}
          
          {/* Collecting State */}
          {state === 'collecting' && (
            <View style={styles.collectingContainer}>
              <ActivityIndicator size="large" color={rarityColor} />
              <Text style={styles.collectingText}>Collecting...</Text>
            </View>
          )}
          
          {/* Success State */}
          {state === 'success' && (
            <Animated.View
              style={[
                styles.successContainer,
                { transform: [{ scale: successScaleAnim }] },
              ]}
            >
              <View style={[styles.successIcon, { backgroundColor: colors.success }]}>
                <Ionicons name="checkmark" size={50} color="#FFFFFF" />
              </View>
              <Text style={styles.successTitle}>Collected!</Text>
              <Text style={styles.successText}>
                {nft.name} has been added to your wallet!
              </Text>
              
              {/* Confetti effect (simplified) */}
              <Animated.View
                style={[
                  styles.confettiContainer,
                  {
                    opacity: confettiAnim,
                    transform: [
                      {
                        translateY: confettiAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-50, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.confettiEmoji}>🎉</Text>
              </Animated.View>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 380,
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  imageContainer: {
    width: 150,
    height: 150,
    borderRadius: 20,
    borderWidth: 4,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  nftImage: {
    width: '100%',
    height: '100%',
  },
  imageLoaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: spacing.xs,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  modelContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  modelLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modelLoadingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  nftModel: {
    width: '100%',
    height: '100%',
  },
  rarityBadge: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    transform: [{ translateX: -40 }],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rarityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  nftName: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  nftDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    width: '100%',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  statValueWarning: {
    color: colors.warning,
  },
  statValueExpired: {
    color: colors.error,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.error}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    marginBottom: spacing.md,
    width: '100%',
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    marginLeft: spacing.sm,
    flex: 1,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.error}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    marginBottom: spacing.md,
    width: '100%',
  },
  warningText: {
    ...typography.body,
    color: colors.error,
    marginLeft: spacing.sm,
    flex: 1,
    fontWeight: '600',
  },
  collectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    width: '100%',
  },
  collectButtonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.7,
  },
  collectButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  tooFarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 16,
    width: '100%',
  },
  tooFarText: {
    ...typography.body,
    color: colors.warning,
    marginLeft: spacing.sm,
    flex: 1,
  },
  // Collecting state
  collectingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  collectingText: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
  },
  // Success state
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  successTitle: {
    ...typography.h1,
    color: colors.success,
    marginBottom: spacing.xs,
  },
  successText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    top: -20,
  },
  confettiEmoji: {
    fontSize: 40,
  },
});

