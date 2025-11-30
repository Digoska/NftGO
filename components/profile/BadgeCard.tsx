import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

interface BadgeCardProps {
  badge: Badge;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export default function BadgeCard({ badge, onPress, size = 'medium' }: BadgeCardProps) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const isExclusive = badge.rarity === 'exclusive';
  const badgeName = badge.name;

  useEffect(() => {
    if (isExclusive) {
      // Developer badge: Purple glow pulse
      if (badgeName === 'developer') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: false,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: false,
            }),
          ])
        ).start();
      }

      // Owner badge: Gold shimmer effect
      if (badgeName === 'owner') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(shimmerAnim, {
              toValue: 1,
              duration: 2500,
              useNativeDriver: false,
            }),
            Animated.timing(shimmerAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: false,
            }),
          ])
        ).start();
      }

      // Beta Tester badge: Bounce animation
      if (badgeName === 'beta_tester') {
        Animated.loop(
          Animated.sequence([
            Animated.spring(bounceAnim, {
              toValue: 1.1,
              tension: 50,
              friction: 3,
              useNativeDriver: true,
            }),
            Animated.spring(bounceAnim, {
              toValue: 1.0,
              tension: 50,
              friction: 3,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }
  }, [isExclusive, badgeName]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          containerSize: 60,
          iconSize: 24,
          fontSize: 10,
        };
      case 'large':
        return {
          containerSize: 120,
          iconSize: 48,
          fontSize: 14,
        };
      default:
        return {
          containerSize: 90,
          iconSize: 36,
          fontSize: 12,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const badgeColor = badge.color || colors.primary;

  const getRarityStyles = () => {
    if (isExclusive) {
      return {
        borderColor: badgeColor,
        borderWidth: 2,
        shadowColor: badgeColor,
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 8,
      };
    }
    return {
      borderColor: colors.border,
      borderWidth: 1,
    };
  };

  const getBadgeAnimation = () => {
    if (badgeName === 'developer') {
      // Developer: Purple glow pulse
      return { transform: [{ scale: scaleAnim }] };
    } else if (badgeName === 'owner') {
      // Owner: Gold shimmer (no transform, shimmer overlay handles it)
      return { transform: [{ scale: scaleAnim }] };
    } else if (badgeName === 'beta_tester') {
      // Beta Tester: Bounce animation
      return { transform: [{ scale: Animated.multiply(scaleAnim, bounceAnim) }] };
    }
    return { transform: [{ scale: scaleAnim }] };
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      <Animated.View
        style={[
          styles.container,
          {
            width: sizeStyles.containerSize,
            height: sizeStyles.containerSize,
            backgroundColor: badgeColor + '15',
          },
          getRarityStyles(),
          getBadgeAnimation(),
        ]}
      >
        {/* Developer: Purple glow pulse */}
        {badgeName === 'developer' && (
          <Animated.View
            style={[
              styles.glowOverlay,
              {
                opacity: glowOpacity,
                backgroundColor: '#7C3AED',
              },
            ]}
          />
        )}

        {/* Owner: Gold shimmer effect */}
        {badgeName === 'owner' && (
          <>
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX: shimmerTranslateX }],
                  backgroundColor: 'rgba(245, 158, 11, 0.4)',
                },
              ]}
            />
            <Animated.View
              style={[
                styles.goldShimmer,
                {
                  transform: [{ translateX: shimmerTranslateX }],
                },
              ]}
            />
          </>
        )}

        {/* Beta Tester: Bounce is handled in transform */}

        {/* Badge icon */}
        <Ionicons
          name={badge.icon_name as any}
          size={sizeStyles.iconSize}
          color={badgeColor}
          style={styles.icon}
        />

        {/* Badge name (only for medium and large) */}
        {size !== 'small' && (
          <Text
            style={[
              styles.badgeName,
              {
                fontSize: sizeStyles.fontSize,
                color: badgeColor,
              },
            ]}
            numberOfLines={1}
          >
            {badge.display_name}
          </Text>
        )}

        {/* Exclusive indicator */}
        {isExclusive && (
          <View style={[styles.exclusiveBadge, { backgroundColor: badgeColor }]}>
            <Ionicons name="star" size={8} color={colors.background} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
  },
  goldShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '40%',
    backgroundColor: 'rgba(245, 158, 11, 0.6)',
    borderRadius: 16,
  },
  icon: {
    marginBottom: spacing.xs,
  },
  badgeName: {
    ...typography.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
  exclusiveBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.background,
  },
});

