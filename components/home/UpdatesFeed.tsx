import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { supabase } from '../../lib/supabase';
import { AppUpdate } from '../../types';

interface UpdatesFeedProps {
  limit?: number;
  onUpdatePress?: (update: AppUpdate) => void;
}

export default function UpdatesFeed({ limit = 5, onUpdatePress }: UpdatesFeedProps) {
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      
      // Check if section is enabled (check first update's section_enabled)
      const { data: sectionData } = await supabase
        .from('app_updates')
        .select('section_enabled')
        .eq('is_active', true)
        .limit(1)
        .single();

      // If section_enabled is false, don't show updates
      if (sectionData?.section_enabled === false) {
        setUpdates([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('app_updates')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching updates:', error);
      } else if (data) {
        setUpdates(data as AppUpdate[]);
      }
    } catch (error) {
      console.error('Error in fetchUpdates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'megaphone';
      case 'event':
        return 'calendar';
      case 'update':
        return 'information-circle';
      default:
        return 'notifications';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'announcement':
        return colors.warning;
      case 'event':
        return colors.secondary;
      case 'update':
        return colors.primary;
      default:
        return colors.textMuted;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (updates.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {updates.map((update) => (
          <UpdateCard
            key={update.id}
            update={update}
            onPress={() => onUpdatePress?.(update)}
            getTypeIcon={getTypeIcon}
            getTypeColor={getTypeColor}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface UpdateCardProps {
  update: AppUpdate;
  onPress: () => void;
  getTypeIcon: (type: string) => string;
  getTypeColor: (type: string) => string;
}

function UpdateCard({ update, onPress, getTypeIcon, getTypeColor }: UpdateCardProps) {
  const [glowAnim] = React.useState(new Animated.Value(0));
  const [pulseAnim] = React.useState(new Animated.Value(1));
  const [imageError, setImageError] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [expandAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  React.useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: expanded ? 1 : 0,
      tension: 50,
      friction: 7,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const typeIcon = getTypeIcon(update.type);
  const typeColor = getTypeColor(update.type);

  const handleCardPress = () => {
    setExpanded(!expanded);
    // Don't call onPress to avoid opening modal
  };

  const hasFullContent = update.full_description || update.description;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleCardPress}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowOpacity,
            backgroundColor: typeColor,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <View style={styles.cardContent}>
        {update.image_url && !imageError ? (
          <Image
            source={{ 
              uri: update.image_url.replace(/\$0$/, '').trim(),
            }}
            style={styles.image}
            resizeMode="cover"
            onError={() => {
              console.log('Image load error for:', update.image_url);
              setImageError(true);
            }}
            onLoad={() => setImageError(false)}
          />
        ) : (
          <View style={[styles.iconContainer, { backgroundColor: typeColor + '15' }]}>
            <Ionicons name={typeIcon as any} size={32} color={typeColor} />
          </View>
        )}
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
              <Ionicons name={typeIcon as any} size={12} color={typeColor} />
              <Text style={[styles.typeText, { color: typeColor }]}>
                {update.type}
              </Text>
            </View>
          </View>
          <Text style={styles.title} numberOfLines={expanded ? undefined : 2}>
            {update.title}
          </Text>
          {hasFullContent && (
            <Text style={styles.description} numberOfLines={expanded ? undefined : 2}>
              {expanded && update.full_description ? update.full_description : update.description}
            </Text>
          )}
        </View>
      </View>

      {/* Expanded Content */}
      {expanded && (
        <Animated.View
          style={[
            styles.expandedContent,
            {
              opacity: expandAnim,
              maxHeight: expandAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 500],
              }),
            },
          ]}
        >
          <View style={styles.expandedDivider} />
          <View style={styles.expandedInfo}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
              <Text style={styles.dateText}>
                {new Date(update.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            {update.action_url && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: typeColor + '15' }]}
                onPress={(e) => {
                  e.stopPropagation();
                  Linking.openURL(update.action_url!);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="open-outline" size={16} color={typeColor} />
                <Text style={[styles.actionText, { color: typeColor }]}>Open Link</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    paddingLeft: 0,
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  scrollContent: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
  },
  card: {
    width: 280,
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    marginRight: spacing.md,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  glow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.3,
  },
  cardContent: {
    padding: spacing.md,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: spacing.md,
    backgroundColor: colors.backgroundLight,
  },
  iconContainer: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 8,
    gap: spacing.xs / 2,
  },
  typeText: {
    ...typography.small,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 12,
  },
  expandedContent: {
    overflow: 'hidden',
  },
  expandedDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
    marginHorizontal: spacing.md,
  },
  expandedInfo: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  dateText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  actionText: {
    ...typography.bodyBold,
    fontSize: 14,
  },
});

