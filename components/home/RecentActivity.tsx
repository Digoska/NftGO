import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserNFT, NFT } from '../../types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import CachedImage from '../nft/CachedImage';
import WebViewModel from '../nft/WebViewModel';

// Maximum concurrent legendary 3D models in recent activity
const MAX_CONCURRENT_3D_MODELS = 3;

interface RecentActivityProps {
  recentNFTs: UserNFT[];
  onPress?: (nft: UserNFT) => void;
  maxItems?: number;
}

export default function RecentActivity({
  recentNFTs,
  onPress,
  maxItems = 5,
}: RecentActivityProps) {
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loadedLegendaryIds, setLoadedLegendaryIds] = useState<Set<string>>(new Set());

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return colors.textMuted;
      case 'rare':
        return colors.rare;
      case 'epic':
        return colors.secondary;
      case 'legendary':
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

  const getRarityLabel = (rarity: string) => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };

  const displayNFTs = recentNFTs.slice(0, maxItems);

  // Track which legendaries should load 3D models (limit to MAX_CONCURRENT_3D_MODELS)
  useEffect(() => {
    const legendaryNFTs = displayNFTs
      .filter(u => u.nft?.rarity === 'legendary' && u.nft?.media_type === 'model')
      .slice(0, MAX_CONCURRENT_3D_MODELS);
    
    const ids = new Set(legendaryNFTs.map(u => u.nft!.id));
    setLoadedLegendaryIds(ids);
  }, [displayNFTs]);

  const handlePress = (userNFT: UserNFT) => {
    if (onPress) {
      onPress(userNFT);
    } else if (userNFT.nft) {
      setSelectedNFT(userNFT.nft);
      setShowDetail(true);
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setTimeout(() => setSelectedNFT(null), 300);
  };

  if (displayNFTs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="time-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>No recent activity</Text>
        <Text style={styles.emptySubtext}>Start collecting NFTs to see them here!</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
        {displayNFTs.map((userNFT) => {
          const nft = userNFT.nft;
          if (!nft) return null;

          const isLegendary = nft.rarity === 'legendary';
          const isModel = nft.media_type === 'model';
          const shouldLoad3D = isLegendary && isModel && loadedLegendaryIds.has(nft.id);

          return (
            <RecentActivityCard
              key={userNFT.id}
              userNFT={userNFT}
              nft={nft}
              shouldLoad3D={shouldLoad3D}
              formatTimeAgo={formatTimeAgo}
              getRarityColor={getRarityColor}
              onPress={() => handlePress(userNFT)}
            />
          );
        })}
      </ScrollView>

      {/* Detail Modal */}
      <NFTDetailModal
        visible={showDetail}
        nft={selectedNFT}
        onClose={handleCloseDetail}
        getRarityColor={getRarityColor}
        getRarityLabel={getRarityLabel}
      />
    </>
  );
}

// Card component for recent activity
function RecentActivityCard({
  userNFT,
  nft,
  shouldLoad3D,
  formatTimeAgo,
  getRarityColor,
  onPress,
}: {
  userNFT: UserNFT;
  nft: NFT;
  shouldLoad3D: boolean;
  formatTimeAgo: (date: string) => string;
  getRarityColor: (rarity: string) => string;
  onPress: () => void;
}) {
  const [modelLoading, setModelLoading] = useState(true);
  const isLegendary = nft.rarity === 'legendary';
  const isModel = nft.media_type === 'model';

  const renderContent = () => {
    // Legendary models: Show 3D if allowed
    if (shouldLoad3D && nft.image_url) {
      return (
        <View style={styles.model3DContainer}>
          {modelLoading && (
            <View style={styles.modelLoadingOverlay}>
              <ActivityIndicator size="small" color={colors.warning} />
            </View>
          )}
          <WebViewModel 
            uri={nft.image_url} 
            onLoad={() => setModelLoading(false)}
          />
          <View style={styles.legendaryBadge}>
            <Ionicons name="star" size={10} color="#FFF" />
          </View>
        </View>
      );
    }

    // Show thumbnail with 3D indicator for legendary models waiting to load
    if (isLegendary && isModel && nft.thumbnail_url) {
      return (
        <View style={styles.thumbnailWithIndicator}>
          <CachedImage
            uri={nft.thumbnail_url}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.model3DIndicator}>
            <Ionicons name="cube" size={12} color="#FFF" />
          </View>
        </View>
      );
    }

    // Use thumbnail for non-legendary or fallback
    if (nft.thumbnail_url || (nft.media_type === 'image' && nft.image_url)) {
      return (
        <CachedImage
          uri={nft.thumbnail_url || nft.image_url}
          style={styles.image}
          resizeMode="cover"
        />
      );
    }

    // Fallback placeholder
    return (
      <View
        style={[
          styles.placeholder,
          { backgroundColor: getRarityColor(nft.rarity) + '20' },
        ]}
      >
        <Ionicons
          name={isModel ? "cube-outline" : "image-outline"}
          size={32}
          color={getRarityColor(nft.rarity)}
        />
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {renderContent()}
        <View
          style={[
            styles.rarityBadge,
            { backgroundColor: getRarityColor(nft.rarity) },
          ]}
        >
          <Text style={styles.rarityBadgeText}>
            {nft.rarity.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {nft.name}
      </Text>
      <Text style={styles.time}>{formatTimeAgo(userNFT.collected_at)}</Text>
    </TouchableOpacity>
  );
}

// Detail Modal component
function NFTDetailModal({
  visible,
  nft,
  onClose,
  getRarityColor,
  getRarityLabel,
}: {
  visible: boolean;
  nft: NFT | null;
  onClose: () => void;
  getRarityColor: (rarity: string) => string;
  getRarityLabel: (rarity: string) => string;
}) {
  const [modelLoading, setModelLoading] = useState(true);

  useEffect(() => {
    if (visible && nft) {
      setModelLoading(true);
    }
  }, [visible, nft?.id]);

  if (!nft) return null;

  const isModel = nft.media_type === 'model';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>NFT Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.detailImageContainer}>
            {isModel && nft.image_url ? (
              <View style={{ height: 250, width: '100%' }}>
                {modelLoading && (
                  <View style={styles.modelLoadingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.modelLoadingText}>Loading 3D model...</Text>
                  </View>
                )}
                <WebViewModel 
                  uri={nft.image_url} 
                  onLoad={() => setModelLoading(false)}
                />
              </View>
            ) : nft.thumbnail_url || nft.image_url ? (
              <CachedImage
                uri={nft.thumbnail_url || nft.image_url}
                style={styles.detailImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.detailPlaceholder, { backgroundColor: getRarityColor(nft.rarity) + '20' }]}>
                <Ionicons name="image-outline" size={60} color={getRarityColor(nft.rarity)} />
              </View>
            )}
          </View>

          <Text style={styles.detailName}>{nft.name}</Text>
          <View style={styles.detailRarityContainer}>
            <View style={[styles.rarityDot, { backgroundColor: getRarityColor(nft.rarity) }]} />
            <Text style={[styles.detailRarity, { color: getRarityColor(nft.rarity) }]}>
              {getRarityLabel(nft.rarity)}
            </Text>
          </View>
          <Text style={styles.detailDescription}>
            {nft.description || 'No description available'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  card: {
    width: 120,
    marginRight: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rarityBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rarityBadgeText: {
    ...typography.small,
    color: colors.background,
    fontWeight: 'bold',
  },
  name: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
  },
  // 3D Model styles
  model3DContainer: {
    width: '100%',
    height: '100%',
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
    ...typography.caption,
    color: '#FFF',
    marginTop: spacing.xs,
  },
  legendaryBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: colors.warning,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailWithIndicator: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  model3DIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailImageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.md,
    backgroundColor: '#F3F4F6',
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  detailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailName: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  detailRarityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  detailRarity: {
    ...typography.body,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  detailDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
