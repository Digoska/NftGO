import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { UserNFT, NFT } from '../../types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import ModelNFT from '../../components/nft/ModelNFT';

export default function CollectionScreen() {
  const { user } = useAuth();
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all');
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (user) {
      fetchUserNFTs();
    }
  }, [user, filter]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [userNFTs]);

  const fetchUserNFTs = async () => {
    if (!user?.id) return;

    setLoading(true);
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
        // Map Supabase response to UserNFT format
        // Supabase returns "nfts" (plural) but we need "nft" (singular)
        const nfts = (data as any[]).map((item) => ({
          ...item,
          nft: item.nfts || item.nft, // Support both formats
        })) as UserNFT[];
        setUserNFTs(nfts);
      }
    } catch (error) {
      console.error('Error in fetchUserNFTs:', error);
    } finally {
      setLoading(false);
    }
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

  const filteredNFTs = userNFTs.filter((userNFT) => {
    if (filter === 'all') return true;
    return userNFT.nft?.rarity === filter;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading collection...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Collection</Text>
        <Text style={styles.subtitle}>{userNFTs.length} NFT</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {(['all', 'common', 'rare', 'epic', 'legendary'] as const).map((rarity) => (
          <TouchableOpacity
            key={rarity}
            style={[
              styles.filterButton,
              filter === rarity && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(rarity)}
          >
            <Text
              style={[
                styles.filterText,
                filter === rarity && styles.filterTextActive,
              ]}
            >
              {rarity === 'all' ? 'All' : getRarityLabel(rarity)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredNFTs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {filter === 'all'
              ? "You don't have any NFTs yet"
              : `You don't have any ${getRarityLabel(filter)} NFTs`}
          </Text>
          <Text style={styles.emptySubtext}>
            Go to the map and start collecting!
          </Text>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={filteredNFTs}
            numColumns={2}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.grid}
            renderItem={({ item, index }) => {
              const nft = item.nft;
              if (!nft) return null;

              const opacity = React.useRef(new Animated.Value(0)).current;
              React.useEffect(() => {
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
                    onPress={() => handleNFTPress(nft)}
                  >
                    <View
                      style={[
                        styles.nftImageContainer,
                        { borderColor: getRarityColor(nft.rarity) },
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
                            style={styles.nftImage}
                          />
                        ) : (
                          <Image
                            source={{ uri: nft.image_url }}
                            style={styles.nftImage}
                            resizeMode="cover"
                          />
                        )
                      ) : (
                        <View
                          style={[
                            styles.nftImagePlaceholder,
                            { backgroundColor: getRarityColor(nft.rarity) },
                          ]}
                        >
                          <Text style={styles.nftImageText}>NFT</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.nftInfo}>
                      <Text style={styles.nftName} numberOfLines={1}>
                        {nft.name}
                      </Text>
                      <Text
                        style={[
                          styles.nftRarity,
                          { color: getRarityColor(nft.rarity) },
                        ]}
                      >
                        {getRarityLabel(nft.rarity)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
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
          <View style={styles.modalContent}>
            {selectedNFT && (
              <>
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
                      <Image
                        source={{ uri: selectedNFT.image_url }}
                        style={styles.detailImage}
                        resizeMode="cover"
                      />
                    )
                  ) : (
                    <View
                      style={[
                        styles.detailImagePlaceholder,
                        { backgroundColor: getRarityColor(selectedNFT.rarity) },
                      ]}
                    >
                      <Text style={styles.detailImageText}>NFT</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.detailName}>{selectedNFT.name}</Text>
                <Text
                  style={[
                    styles.detailRarity,
                    { color: getRarityColor(selectedNFT.rarity) },
                  ]}
                >
                  {getRarityLabel(selectedNFT.rarity)}
                </Text>
                <Text style={styles.detailDescription}>
                  {selectedNFT.description || 'No description'}
                </Text>

                <TouchableOpacity
                  onPress={() => setShowDetail(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  filterContainer: {
    maxHeight: 50,
    marginBottom: spacing.md,
  },
  filterContent: {
    paddingHorizontal: spacing.lg,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.backgroundCard,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  grid: {
    padding: spacing.lg,
  },
  nftCard: {
    flex: 1,
    margin: spacing.sm,
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    overflow: 'hidden',
    maxWidth: '48%',
  },
  nftImageContainer: {
    width: '100%',
    height: 150,
    borderWidth: 2,
    borderRadius: 8,
    overflow: 'hidden',
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
  nftInfo: {
    padding: spacing.md,
  },
  nftName: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  nftRarity: {
    ...typography.caption,
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    maxHeight: '80%',
  },
  detailImageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.md,
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
    marginBottom: spacing.xs,
  },
  detailRarity: {
    ...typography.body,
    marginBottom: spacing.md,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  detailDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 24,
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

