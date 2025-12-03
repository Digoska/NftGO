import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserNFT } from '../../types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import VideoNFT from '../nft/VideoNFT';
import ModelNFT from '../nft/ModelNFT';

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
        return colors.primary;
      case 'epic':
        return colors.secondary;
      case 'legendary':
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

  const displayNFTs = recentNFTs.slice(0, maxItems);

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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {displayNFTs.map((userNFT) => {
        const nft = userNFT.nft;
        if (!nft) return null;

        return (
          <TouchableOpacity
            key={userNFT.id}
            style={styles.card}
            onPress={() => onPress?.(userNFT)}
            activeOpacity={0.7}
          >
            <View style={styles.imageContainer}>
              {nft.image_url ? (
                nft.media_type === 'video' ? (
                  <VideoNFT
                    uri={nft.image_url}
                    style={styles.image}
                    autoPlay={true}
                    loop={true}
                  />
                ) : nft.media_type === 'model' ? (
                  <ModelNFT
                    uri={nft.image_url}
                    style={styles.image}
                  />
                ) : (
                  <Image source={{ uri: nft.image_url }} style={styles.image} resizeMode="cover" />
                )
              ) : (
                <View
                  style={[
                    styles.placeholder,
                    { backgroundColor: getRarityColor(nft.rarity) + '20' },
                  ]}
                >
                  <Ionicons
                    name="image-outline"
                    size={32}
                    color={getRarityColor(nft.rarity)}
                  />
                </View>
              )}
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
      })}
    </ScrollView>
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
});

