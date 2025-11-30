import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

interface ProgressBarProps {
  current: number;
  total: number;
  height?: number;
  showLabel?: boolean;
  color?: string;
  backgroundColor?: string;
}

export default function ProgressBar({
  current,
  total,
  height = 8,
  showLabel = true,
  color = colors.primary,
  backgroundColor = colors.border,
}: ProgressBarProps) {
  const progress = Math.min(Math.max((current / total) * 100, 0), 100);
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedWidth]);

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{current}</Text>
          <Text style={styles.separator}>/</Text>
          <Text style={styles.label}>{total}</Text>
        </View>
      )}
      <View style={[styles.barContainer, { height, backgroundColor }]}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: color,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  separator: {
    ...typography.caption,
    color: colors.textMuted,
    marginHorizontal: spacing.xs,
  },
  barContainer: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    borderRadius: 4,
  },
});

