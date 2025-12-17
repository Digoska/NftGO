import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Animated,
  RefreshControl,
  Dimensions,
  ViewToken,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { UserNFT, NFT } from '../../types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import VideoNFT from '../../components/nft/VideoNFT';
import WebViewModel from '../../components/nft/WebViewModel';
import CachedImage from '../../components/nft/CachedImage';
import { preCacheFiles } from '../../lib/nftCache';

const { width } = Dimensions.get('window');

// Calculate card size for 2-column grid
const GRID_PADDING = spacing.md;
const GRID_GAP = spacing.sm;
const CARD_WIDTH = (width - (GRID_PADDING * 2) - GRID_GAP) / 2;

// Maximum concurrent legendary 3D models to prevent memory issues
const MAX_CONCURRENT_3D_MODELS = 3;

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
  
  // Track visible legendary NFT IDs for 3D model loading
  const [visibleLegendaryIds, setVisibleLegendaryIds] = useState<Set<string>>(new Set());
  const [loadedModelIds, setLoadedModelIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchUserNFTs();
    }
  }, [user]);

  // Animate filter change
  useEffect(() => {
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

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching user NFTs:', error);
      } else if (data) {
        const nfts = (data as any[]).map((item) => ({
          ...item,
          nft: item.nfts || item.nft,
        })) as UserNFT[];
        
        setUserNFTs(nfts);
        
        // Pre-cache thumbnails (lightweight)
        const thumbnailUrls = nfts
          .map(item => item.nft?.thumbnail_url || item.nft?.image_url)
          .filter((url): url is string => !!url && !url.includes('.glb') && !url.includes('.gltf'));
        
        if (thumbnailUrls.length > 0) {
          preCacheFiles(thumbnailUrls).catch(console.error);
        }
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

  const handleCloseDetail = () => {
    setShowDetail(false);
    // Clear selected NFT after animation to cleanup 3D model
    setTimeout(() => setSelectedNFT(null), 300);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return colors.textMuted;
      case 'rare': return colors.rare;
      case 'epic': return colors.secondary;
      case 'legendary': return colors.warning;
      default: return colors.textMuted;
    }
  };

  const getRarityLabel = (rarity: string) => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };

  const filteredNFTs = useMemo(() => {
    return userNFTs.filter((userNFT) => {
      if (!userNFT.nft) return false;
      if (filter === 'all') return true;
      return userNFT.nft.rarity === filter;
    });
  }, [userNFTs, filter]);

  const rarityStats = useMemo(() => {
    const stats = { common: 0, rare: 0, epic: 0, legendary: 0 };
    userNFTs.forEach((userNFT) => {
      const rarity = userNFT.nft?.rarity;
      if (rarity && rarity in stats) {
        stats[rarity as keyof typeof stats]++;
      }
    });
    return stats;
  }, [userNFTs]);

  // Track viewable items for lazy loading legendary 3D models
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const legendaryIds = new Set<string>();
    
    viewableItems.forEach((item) => {
      const nft = (item.item as UserNFT)?.nft;
      if (nft && nft.rarity === 'legendary' && nft.media_type === 'model') {
        legendaryIds.add(nft.id);
      }
    });
    
    setVisibleLegendaryIds(legendaryIds);
    
    // Update loaded models (limit to MAX_CONCURRENT_3D_MODELS)
    setLoadedModelIds(prev => {
      const newLoaded = new Set<string>();
      let count = 0;
      
      // Prioritize visible items
      legendaryIds.forEach(id => {
        if (count < MAX_CONCURRENT_3D_MODELS) {
          newLoaded.add(id);
          count++;
        }
      });
      
      return newLoaded;
    });
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }).current;

  const ListHeaderComponent = () => (
    <View style={styles.headerContainer}>
      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>My Wallet</Text>
        <Text style={styles.subtitle}>{userNFTs.length} NFT{userNFTs.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Stats Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsScrollContent}
        style={styles.statsScroll}
      >
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userNFTs.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F3F4F6' }]}>
          <Text style={[styles.statValue, { color: colors.textMuted }]}>{rarityStats.common}</Text>
          <Text style={styles.statLabel}>Common</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
          <Text style={[styles.statValue, { color: colors.rare }]}>{rarityStats.rare}</Text>
          <Text style={styles.statLabel}>Rare</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E0E7FF' }]}>
          <Text style={[styles.statValue, { color: colors.secondary }]}>{rarityStats.epic}</Text>
          <Text style={styles.statLabel}>Epic</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFF7ED' }]}>
          <Text style={[styles.statValue, { color: colors.warning }]}>{rarityStats.legendary}</Text>
          <Text style={styles.statLabel}>Legendary</Text>
        </View>
      </ScrollView>

      {/* Filter Buttons */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {(['all', 'common', 'rare', 'epic', 'legendary'] as const).map((rarity, index) => {
            const activeColor = rarity === 'all' ? colors.primary : getRarityColor(rarity);
            return (
              <FilterButton
                key={rarity}
                rarity={rarity}
                isActive={filter === rarity}
                onPress={() => setFilter(rarity)}
                getRarityLabel={getRarityLabel}
                activeColor={activeColor}
                isFirst={index === 0}
                isLast={index === 4}
              />
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

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
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.gridColumnWrapper}
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
            // Optimize grid rendering
            windowSize={5} 
            initialNumToRender={8}
            maxToRenderPerBatch={4}
            removeClippedSubviews={true}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            
            renderItem={({ item, index }) => {
              if (!item.nft) return null;
              
              const isLegendary = item.nft.rarity === 'legendary';
              const isModel = item.nft.media_type === 'model';
              const shouldLoad3D = isLegendary && isModel && loadedModelIds.has(item.nft.id);
              
              return (
                <NFTCard
                  nft={item.nft}
                  index={index}
                  onPress={() => handleNFTPress(item.nft!)}
                  getRarityColor={getRarityColor}
                  getRarityLabel={getRarityLabel}
                  shouldLoad3D={shouldLoad3D}
                />
              );
            }}
          />
        </Animated.View>
      )}

      {/* Detail Modal with lazy-loaded 3D model */}
      <NFTDetailModal
        visible={showDetail}
        nft={selectedNFT}
        onClose={handleCloseDetail}
        getRarityColor={getRarityColor}
        getRarityLabel={getRarityLabel}
      />
    </View>
  );
}

// NFT Detail Modal - loads 3D model on demand
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

  // Reset loading state when modal opens with new NFT
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
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.detailImageContainer}>
              {nft.image_url ? (
                nft.media_type === 'video' ? (
                  <VideoNFT
                    uri={nft.image_url}
                    style={styles.detailImage}
                    autoPlay={true}
                    loop={true}
                  />
                ) : isModel ? (
                  <View style={{ height: 300, width: '100%' }}>
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
                ) : (
                  <CachedImage
                    uri={nft.image_url}
                    style={styles.detailImage}
                    resizeMode="cover"
                  />
                )
              ) : (
                <View style={[styles.detailImagePlaceholder, { backgroundColor: getRarityColor(nft.rarity) + '20' }]}>
                  <Ionicons name="image-outline" size={80} color={getRarityColor(nft.rarity)} />
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
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Redesigned Filter Button
function FilterButton({
  rarity,
  isActive,
  onPress,
  getRarityLabel,
  activeColor,
  isFirst,
  isLast,
}: {
  rarity: 'all' | 'common' | 'rare' | 'epic' | 'legendary';
  isActive: boolean;
  onPress: () => void;
  getRarityLabel: (rarity: string) => string;
  activeColor: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.filterButton,
        isActive && styles.filterButtonActive,
        isActive && { backgroundColor: activeColor, shadowColor: activeColor },
        isFirst && { marginLeft: spacing.md },
        isLast && { marginRight: spacing.md },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
        {rarity === 'all' ? 'All' : getRarityLabel(rarity)}
      </Text>
    </TouchableOpacity>
  );
}

// Redesigned NFT Card with conditional 3D loading
function NFTCard({
  nft,
  index,
  onPress,
  getRarityColor,
  getRarityLabel,
  shouldLoad3D,
}: {
  nft: NFT;
  index: number;
  onPress: () => void;
  getRarityColor: (rarity: string) => string;
  getRarityLabel: (rarity: string) => string;
  shouldLoad3D: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [modelLoading, setModelLoading] = useState(true);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  const isLegendary = nft.rarity === 'legendary';
  const isModel = nft.media_type === 'model';

  // Determine content to render
  const renderContent = () => {
    // Legendary models: Show 3D if allowed, otherwise show thumbnail with loading indicator
    if (isLegendary && isModel) {
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
            {/* Legendary badge */}
            <View style={styles.legendaryBadge}>
              <Ionicons name="star" size={12} color="#FFF" />
            </View>
          </View>
        );
      }
      // Show thumbnail with 3D indicator while waiting to load
      if (nft.thumbnail_url) {
        return (
          <View style={styles.thumbnailWithIndicator}>
            <CachedImage
              uri={nft.thumbnail_url}
              style={styles.nftImage}
              resizeMode="cover"
            />
            <View style={styles.model3DIndicator}>
              <Ionicons name="cube" size={16} color="#FFF" />
            </View>
          </View>
        );
      }
    }
    
    // Non-legendary: Always use thumbnail
    if (nft.thumbnail_url) {
      return (
        <CachedImage
          uri={nft.thumbnail_url}
          style={styles.nftImage}
          resizeMode="cover"
        />
      );
    }
    
    // Fallback: Original image (only if it's an image type)
    if ((!nft.media_type || nft.media_type === 'image') && nft.image_url) {
      return (
        <CachedImage
          uri={nft.image_url}
          style={styles.nftImage}
          resizeMode="cover"
        />
      );
    }

    // Fallback: Placeholder icon (for models/videos without thumbnail)
    return (
      <View style={[styles.nftImagePlaceholder, { backgroundColor: getRarityColor(nft.rarity) + '15' }]}>
        <Ionicons 
          name={isModel ? "cube-outline" : "image-outline"} 
          size={32} 
          color={getRarityColor(nft.rarity)} 
        />
      </View>
    );
  };

  return (
    <Animated.View style={[{ opacity, width: CARD_WIDTH }]}>
      <TouchableOpacity
        style={styles.nftCard}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {/* Image Section */}
        <View style={[styles.nftImageContainer, { backgroundColor: '#F3F4F6' }]}>
          {renderContent()}
          
          {/* Rarity Tag */}
          <View style={[styles.rarityTag, { backgroundColor: getRarityColor(nft.rarity) }]}>
            <Text style={styles.rarityTagText}>{getRarityLabel(nft.rarity)}</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.nftInfo}>
          <Text style={styles.nftName} numberOfLines={1}>{nft.name}</Text>
          <Text style={styles.nftDate}>Collected</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function EmptyState({ filter, getRarityLabel }: { filter: string; getRarityLabel: (r: string) => string }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="wallet-outline" size={64} color={colors.textMuted} />
      </View>
      <Text style={styles.emptyText}>
        {filter === 'all' ? "No NFTs Found" : `No ${getRarityLabel(filter)} NFTs`}
      </Text>
      <Text style={styles.emptySubtext}>
        Explore the map to find and collect more NFTs!
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
  // Header
  headerContainer: {
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
  },
  titleSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    fontSize: 28,
    color: colors.text,
    fontWeight: '800',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 16,
  },
  // Stats
  statsScroll: {
    marginBottom: spacing.md,
  },
  statsScrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  statCard: {
    minWidth: 100,
    height: 80,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '800',
    fontSize: 24,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  // Filters
  filterSection: {
    marginBottom: spacing.sm,
  },
  filterScrollContent: {
    paddingVertical: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#F3F4F6',
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Grid
  gridContainer: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  gridColumnWrapper: {
    justifyContent: 'space-between',
    marginBottom: GRID_GAP,
  },
  nftCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  nftImageContainer: {
    width: '100%',
    height: 180,
    overflow: 'hidden',
    position: 'relative',
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
  rarityTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  rarityTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  // 3D Model specific styles
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
    bottom: 8,
    left: 8,
    backgroundColor: colors.warning,
    borderRadius: 12,
    width: 24,
    height: 24,
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
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nftInfo: {
    padding: spacing.md,
  },
  nftName: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 15,
    marginBottom: 2,
  },
  nftDate: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.xl,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
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
    fontWeight: '800',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailImageContainer: {
    width: '100%',
    height: 320,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    backgroundColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
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
  detailName: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
    fontSize: 28,
  },
  detailRarityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  detailRarity: {
    ...typography.body,
    textTransform: 'capitalize',
    fontWeight: '700',
    fontSize: 16,
  },
  detailDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    fontSize: 16,
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
});
