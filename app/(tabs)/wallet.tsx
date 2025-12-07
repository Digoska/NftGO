import React, { useEffect, useState, useMemo, useRef } from 'react';
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
const GRID_GAP = spacing.sm; // Tighter gap (8px)
// Width = (Screen Width - PaddingLeft - PaddingRight - Gap) / 2
const CARD_WIDTH = (width - (GRID_PADDING * 2) - GRID_GAP) / 2;

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
        
        // Pre-cache media
        const mediaUrls = nfts
          .map(item => item.nft?.image_url)
          .filter((url): url is string => !!url);
        
        if (mediaUrls.length > 0) {
          preCacheFiles(mediaUrls).catch(console.error);
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
            renderItem={({ item, index }) => {
              if (!item.nft) return null;
              return (
                <NFTCard
                  nft={item.nft}
                  index={index}
                  onPress={() => handleNFTPress(item.nft!)}
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
                        <View style={{ height: 300, width: '100%' }}>
                          <WebViewModel uri={selectedNFT.image_url} />
                        </View>
                      ) : (
                        <CachedImage
                          uri={selectedNFT.image_url}
                          style={styles.detailImage}
                          resizeMode="cover"
                        />
                      )
                    ) : (
                      <View style={[styles.detailImagePlaceholder, { backgroundColor: getRarityColor(selectedNFT.rarity) + '20' }]}>
                        <Ionicons name="image-outline" size={80} color={getRarityColor(selectedNFT.rarity)} />
                      </View>
                    )}
                  </View>

                  <Text style={styles.detailName}>{selectedNFT.name}</Text>
                  <View style={styles.detailRarityContainer}>
                    <View style={[styles.rarityDot, { backgroundColor: getRarityColor(selectedNFT.rarity) }]} />
                    <Text style={[styles.detailRarity, { color: getRarityColor(selectedNFT.rarity) }]}>
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

// Redesigned NFT Card
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
      duration: 400,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, width: CARD_WIDTH }]}>
      <TouchableOpacity
        style={styles.nftCard}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {/* Image Section */}
        <View style={[styles.nftImageContainer, { backgroundColor: '#F3F4F6' }]}>
          {nft.image_url ? (
            nft.media_type === 'video' ? (
              <VideoNFT
                uri={nft.image_url}
                style={styles.nftImage}
                autoPlay={false}
                loop={false}
              />
            ) : nft.media_type === 'model' ? (
              <View style={{ height: '100%', width: '100%' }}>
                <WebViewModel uri={nft.image_url} />
              </View>
            ) : (
              <CachedImage
                uri={nft.image_url}
                style={styles.nftImage}
                resizeMode="cover"
              />
            )
          ) : (
            <View style={[styles.nftImagePlaceholder, { backgroundColor: getRarityColor(nft.rarity) + '15' }]}>
              <Ionicons name="image-outline" size={32} color={getRarityColor(nft.rarity)} />
            </View>
          )}
          
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
    // Soft shadow
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
    // Horizontal padding handled by isFirst/isLast
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 100, // Pill shape
    backgroundColor: '#F3F4F6', // Light gray default
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary, // Active Purple
    // Active shadow
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
    paddingBottom: spacing.xxl, // Space for bottom nav
  },
  gridColumnWrapper: {
    justifyContent: 'space-between',
    marginBottom: GRID_GAP,
  },
  nftCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    // No borders
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  nftImageContainer: {
    width: '100%',
    height: 180, // Taller image
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

