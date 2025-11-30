import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  ActivityIndicator,
  Animated,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { UserNFT, NFT } from '../../types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import VideoNFT from '../../components/nft/VideoNFT';
import ModelNFT from '../../components/nft/ModelNFT';
import CachedImage from '../../components/nft/CachedImage';
import { getOrCacheFile, preCacheFiles } from '../../lib/nftCache';

export default function WalletScreen() {
  const { user } = useAuth();
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [listOpacity] = useState(new Animated.Value(1));

  useEffect(() => {
    if (user) {
      fetchUserNFTs();
    }
  }, [user]);

  // Animate filter change
  useEffect(() => {
    // Fade out, change filter, fade in
    Animated.sequence([
      Animated.timing(listOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(listOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    if (user) {
      fetchUserNFTs();
    }
  }, [filter]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [userNFTs]);

  const fetchUserNFTs = async (isRefresh = false) => {
    if (!user?.id) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      console.log('🔍 Fetching NFTs for user:', user.id);
      console.log('🔍 Filter:', filter);
      
      let query = supabase
        .from('user_nfts')
        .select(`
          *,
          nfts (*)
        `)
        .eq('user_id', user.id)
        .order('collected_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('nfts.rarity', filter);
      }

      console.log('🔍 Query built, executing...');
      const { data, error } = await query;
      console.log('🔍 Query result - error:', error);
      console.log('🔍 Query result - data:', data);

      if (error) {
        console.error('Error fetching user NFTs:', error);
      } else if (data) {
        console.log('✅ Fetched user NFTs:', data.length, 'items');
        console.log('✅ Raw data sample:', JSON.stringify(data[0], null, 2));
        
        // Map Supabase response to UserNFT format
        // Supabase returns "nfts" (plural) but we need "nft" (singular)
        const nfts = (data as any[]).map((item) => ({
          ...item,
          nft: item.nfts || item.nft, // Support both formats
        })) as UserNFT[];
        
        const withNftData = nfts.filter(item => item.nft);
        console.log('✅ NFTs with nft data:', withNftData.length);
        if (withNftData.length > 0) {
          console.log('✅ First NFT:', withNftData[0].nft?.name, withNftData[0].nft?.image_url);
        }
        setUserNFTs(nfts);
        
        // Pre-cache all NFT media files
        const mediaUrls = nfts
          .map(item => item.nft?.image_url)
          .filter((url): url is string => !!url);
        
        if (mediaUrls.length > 0) {
          console.log('📦 Pre-caching', mediaUrls.length, 'NFT media files');
          // Cache in background (don't await)
          preCacheFiles(mediaUrls).catch(err => {
            console.error('Error pre-caching NFT media:', err);
          });
        }
      } else {
        console.log('⚠️ No data returned from query');
      }
    } catch (error) {
      console.error('Error in fetchUserNFTs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchUserNFTs(true);
  };

  const handleNFTPress = (nft: NFT) => {
    setSelectedNFT(nft);
    setShowDetail(true);
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

  const getRarityLabel = (rarity: string) => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };

  const filteredNFTs = useMemo(() => {
    console.log('🔍 Filtering NFTs. Total userNFTs:', userNFTs.length);
    const filtered = userNFTs.filter((userNFT) => {
      if (!userNFT.nft) {
        console.log('⚠️ UserNFT without nft data:', userNFT.id);
        return false;
      }
      if (filter === 'all') return true;
      const matches = userNFT.nft.rarity === filter;
      if (!matches) {
        console.log(`⚠️ NFT ${userNFT.nft.name} rarity ${userNFT.nft.rarity} doesn't match filter ${filter}`);
      }
      return matches;
    });
    console.log('🔍 Filtered NFTs count:', filtered.length);
    if (filtered.length > 0) {
      console.log('🔍 First filtered NFT:', filtered[0].nft?.name);
    }
    return filtered;
  }, [userNFTs, filter]);

  // Calculate rarity breakdown
  const rarityStats = useMemo(() => {
    const stats = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };
    userNFTs.forEach((userNFT) => {
      const rarity = userNFT.nft?.rarity;
      if (rarity && rarity in stats) {
        stats[rarity as keyof typeof stats]++;
      }
    });
    return stats;
  }, [userNFTs]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  const ListHeaderComponent = () => (
    <>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Wallet</Text>
        <Text style={styles.subtitle}>{userNFTs.length} NFT{userNFTs.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Stats Cards */}
      {userNFTs.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsContainer}
          contentContainerStyle={styles.statsContent}
        >
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userNFTs.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.textMuted + '15' }]}>
            <Text style={[styles.statValue, { color: colors.textMuted }]}>{rarityStats.common}</Text>
            <Text style={styles.statLabel}>Common</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{rarityStats.rare}</Text>
            <Text style={styles.statLabel}>Rare</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.secondary + '15' }]}>
            <Text style={[styles.statValue, { color: colors.secondary }]}>{rarityStats.epic}</Text>
            <Text style={styles.statLabel}>Epic</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.warning + '15' }]}>
            <Text style={[styles.statValue, { color: colors.warning }]}>{rarityStats.legendary}</Text>
            <Text style={styles.statLabel}>Legendary</Text>
          </View>
        </ScrollView>
      )}

      {/* Enhanced Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {(['all', 'common', 'rare', 'epic', 'legendary'] as const).map((rarity) => (
          <FilterButton
            key={rarity}
            rarity={rarity}
            isActive={filter === rarity}
            onPress={() => setFilter(rarity)}
            getRarityLabel={getRarityLabel}
          />
        ))}
      </ScrollView>
    </>
  );

  console.log('🎨 Render - filteredNFTs.length:', filteredNFTs.length);
  console.log('🎨 Render - userNFTs.length:', userNFTs.length);
  console.log('🎨 Render - filter:', filter);

  return (
    <View style={styles.container}>
      {filteredNFTs.length === 0 ? (
        <>
          <ListHeaderComponent />
          <EmptyState filter={filter} getRarityLabel={getRarityLabel} />
        </>
      ) : (
        <Animated.View style={{ flex: 1, opacity: Animated.multiply(fadeAnim, listOpacity) }}>
          <FlatList
            data={filteredNFTs}
            numColumns={2}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={ListHeaderComponent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            renderItem={({ item, index }) => {
              const nft = item.nft;
              console.log(`🎨 Rendering NFT ${index}:`, nft?.name || 'NO NFT DATA');
              if (!nft) {
                console.log('❌ No NFT data in item:', item);
                return null;
              }

              return (
                <NFTCard
                  nft={nft}
                  index={index}
                  onPress={() => handleNFTPress(nft)}
                  getRarityColor={getRarityColor}
                  getRarityLabel={getRarityLabel}
                />
              );
            }}
          />
        </Animated.View>
      )}

      <Modal
        visible={showDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetail(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowDetail(false)}
          />
          <View style={styles.modalContent}>
            {selectedNFT && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>NFT Details</Text>
                  <TouchableOpacity
                    onPress={() => setShowDetail(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.detailImageContainer}>
                    {selectedNFT.image_url ? (
                      selectedNFT.media_type === 'video' ? (
                        <VideoNFT
                          uri={selectedNFT.image_url}
                          style={styles.detailImage}
                          autoPlay={true}
                          loop={true}
                        />
                      ) : selectedNFT.media_type === 'model' ? (
                        <ModelNFT
                          uri={selectedNFT.image_url}
                          modelFormat="glb"
                          style={styles.detailImage}
                        />
                      ) : (
                        <CachedImage
                          uri={selectedNFT.image_url}
                          style={styles.detailImage}
                          resizeMode="cover"
                        />
                      )
                    ) : (
                      <View
                        style={[
                          styles.detailImagePlaceholder,
                          { backgroundColor: getRarityColor(selectedNFT.rarity) + '20' },
                        ]}
                      >
                        <Ionicons
                          name="image-outline"
                          size={80}
                          color={getRarityColor(selectedNFT.rarity)}
                        />
                      </View>
                    )}
                  </View>

                  <Text style={styles.detailName}>{selectedNFT.name}</Text>
                  <View style={styles.detailRarityContainer}>
                    <View
                      style={[
                        styles.rarityDot,
                        { backgroundColor: getRarityColor(selectedNFT.rarity) },
                      ]}
                    />
                    <Text
                      style={[
                        styles.detailRarity,
                        { color: getRarityColor(selectedNFT.rarity) },
                      ]}
                    >
                      {getRarityLabel(selectedNFT.rarity)}
                    </Text>
                  </View>
                  <Text style={styles.detailDescription}>
                    {selectedNFT.description || 'No description available'}
                  </Text>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Filter Button Component with Animation
function FilterButton({
  rarity,
  isActive,
  onPress,
  getRarityLabel,
}: {
  rarity: 'all' | 'common' | 'rare' | 'epic' | 'legendary';
  isActive: boolean;
  onPress: () => void;
  getRarityLabel: (rarity: string) => string;
}) {
  const scaleAnim = useRef(new Animated.Value(isActive ? 1.05 : 1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isActive ? 1.05 : 1,
      tension: 300,
      friction: 20,
      useNativeDriver: true,
    }).start();
  }, [isActive]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          isActive && styles.filterButtonActive,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.filterText,
            isActive && styles.filterTextActive,
          ]}
        >
          {rarity === 'all' ? 'All' : getRarityLabel(rarity)}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// NFT Card Component
function NFTCard({
  nft,
  index,
  onPress,
  getRarityColor,
  getRarityLabel,
}: {
  nft: NFT;
  index: number;
  onPress: () => void;
  getRarityColor: (rarity: string) => string;
  getRarityLabel: (rarity: string) => string;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity }}>
      <TouchableOpacity
        style={styles.nftCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.nftImageContainer,
            { borderColor: getRarityColor(nft.rarity) + '40' },
          ]}
        >
          {nft.image_url ? (
            nft.media_type === 'video' ? (
              <VideoNFT
                uri={nft.image_url}
                style={styles.nftImage}
                autoPlay={true}
                loop={true}
              />
            ) : nft.media_type === 'model' ? (
              <ModelNFT
                uri={nft.image_url}
                modelFormat="glb"
                style={styles.nftImage}
              />
            ) : (
              <CachedImage
                uri={nft.image_url}
                style={styles.nftImage}
                resizeMode="cover"
              />
            )
          ) : (
            <View
              style={[
                styles.nftImagePlaceholder,
                { backgroundColor: getRarityColor(nft.rarity) + '20' },
              ]}
            >
              <Ionicons name="image-outline" size={40} color={getRarityColor(nft.rarity)} />
            </View>
          )}
          {/* Rarity Badge */}
          <View
            style={[
              styles.rarityBadge,
              { backgroundColor: getRarityColor(nft.rarity) },
            ]}
          >
            <Text style={styles.rarityBadgeText}>
              {getRarityLabel(nft.rarity).charAt(0)}
            </Text>
          </View>
        </View>
        <View style={styles.nftInfo}>
          <Text style={styles.nftName} numberOfLines={1}>
            {nft.name}
          </Text>
          <View style={styles.nftRarityContainer}>
            <View
              style={[
                styles.rarityDot,
                { backgroundColor: getRarityColor(nft.rarity) },
              ]}
            />
            <Text
              style={[
                styles.nftRarity,
                { color: getRarityColor(nft.rarity) },
              ]}
            >
              {getRarityLabel(nft.rarity)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Empty State Component
function EmptyState({
  filter,
  getRarityLabel,
}: {
  filter: string;
  getRarityLabel: (rarity: string) => string;
}) {
  const [scaleAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.emptyContainer}>
      <Animated.View
        style={[
          styles.emptyIconContainer,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Ionicons name="wallet-outline" size={80} color={colors.textMuted} />
      </Animated.View>
      <Text style={styles.emptyText}>
        {filter === 'all'
          ? "You don't have any NFTs yet"
          : `You don't have any ${getRarityLabel(filter)} NFTs`}
      </Text>
      <Text style={styles.emptySubtext}>
        Go to the map and start collecting!
      </Text>
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 16,
  },
  // Stats Cards
  statsContainer: {
    marginBottom: spacing.lg,
  },
  statsContent: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
  },
  statCard: {
    width: 100,
    height: 100,
    backgroundColor: colors.primary + '15',
    borderRadius: 16,
    padding: spacing.md,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  // Filter Buttons
  filterContainer: {
    maxHeight: 50,
    marginBottom: spacing.lg,
  },
  filterContent: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
  },
  filterButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: 24,
    backgroundColor: colors.backgroundCard,
    marginRight: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    minWidth: 70,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 14,
  },
  filterTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  // NFT Grid
  grid: {
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  nftCard: {
    flex: 1,
    margin: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    maxWidth: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  nftImageContainer: {
    width: '100%',
    height: 160,
    borderWidth: 2,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.backgroundCard,
  },
  nftImage: {
    width: '100%',
    height: '100%',
  },
  nftImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nftImageText: {
    ...typography.h2,
    color: colors.text,
  },
  rarityBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  rarityBadgeText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '700',
    fontSize: 12,
  },
  nftInfo: {
    padding: spacing.md,
  },
  nftName: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
    fontSize: 15,
  },
  nftRarityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rarityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  nftRarity: {
    ...typography.caption,
    textTransform: 'capitalize',
    fontWeight: '500',
    fontSize: 12,
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    minHeight: 400,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  // Modal
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.xl,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
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
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailImageContainer: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    backgroundColor: colors.backgroundCard,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  detailImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailImageText: {
    ...typography.h1,
    color: colors.text,
  },
  detailName: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  detailRarityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  detailRarity: {
    ...typography.body,
    textTransform: 'capitalize',
    fontWeight: '600',
    fontSize: 16,
  },
  detailDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 24,
    fontSize: 15,
  },
  closeButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  closeButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

