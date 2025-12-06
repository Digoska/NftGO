import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  secondaryValue?: string;
  iconColor?: string;
  backgroundColor?: string;
  onPress?: () => void;
}

export default function StatCard({
  icon,
  value,
  label,
  secondaryValue,
  iconColor = colors.primary,
  backgroundColor = colors.backgroundCard,
  onPress,
}: StatCardProps) {
  const content = (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">{value}</Text>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        {secondaryValue && <Text style={styles.secondaryValue} numberOfLines={1}>{secondaryValue}</Text>}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    height: 100,
    width: 160,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: '#F3F4F6', // Very light border
    minWidth: 160,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    minWidth: 0, // Allows text to shrink
  },
  value: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
    flexShrink: 1,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  secondaryValue: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});

