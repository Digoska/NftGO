import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { Badge } from '../../types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import BadgeCard from './BadgeCard';

interface BadgeListProps {
  badges: Badge[];
  onBadgePress?: (badge: Badge) => void;
  emptyMessage?: string;
}

export default function BadgeList({
  badges,
  onBadgePress,
  emptyMessage = 'No badges yet',
}: BadgeListProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [badges]);

  if (badges.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  // Sort badges: exclusive first, then by name
  const sortedBadges = [...badges].sort((a, b) => {
    if (a.rarity === 'exclusive' && b.rarity !== 'exclusive') return -1;
    if (a.rarity !== 'exclusive' && b.rarity === 'exclusive') return 1;
    return a.display_name.localeCompare(b.display_name);
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sortedBadges.map((badge, index) => (
          <Animated.View
            key={badge.id}
            style={[
              styles.badgeWrapper,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <BadgeCard
              badge={badge}
              onPress={() => onBadgePress?.(badge)}
              size="medium"
            />
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  badgeWrapper: {
    marginRight: spacing.md,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

