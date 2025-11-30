import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

interface PasswordStrengthProps {
  password: string;
}

type Strength = 'weak' | 'medium' | 'strong';

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const getStrength = (): Strength => {
    if (password.length === 0) return 'weak';
    
    let score = 0;
    if (password.length >= 6) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    if (score <= 1) return 'weak';
    if (score === 2) return 'medium';
    return 'strong';
  };

  const strength = getStrength();
  const hasMinLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const getBarColor = () => {
    switch (strength) {
      case 'weak':
        return colors.passwordWeak;
      case 'medium':
        return colors.passwordMedium;
      case 'strong':
        return colors.passwordStrong;
    }
  };

  const getBarWidth = () => {
    switch (strength) {
      case 'weak':
        return '33%';
      case 'medium':
        return '66%';
      case 'strong':
        return '100%';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        <View style={[styles.bar, { width: getBarWidth(), backgroundColor: getBarColor() }]} />
      </View>
      
      <View style={styles.requirements}>
        <RequirementItem checked={hasMinLength} text="6 characters minimum" />
        <RequirementItem checked={hasNumber} text="a number" />
        <RequirementItem checked={hasSymbol} text="a symbol" />
      </View>
    </View>
  );
}

function RequirementItem({ checked, text }: { checked: boolean; text: string }) {
  return (
    <View style={styles.requirement}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={[styles.requirementText, checked && styles.requirementTextChecked]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  barContainer: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 2,
  },
  requirements: {
    gap: spacing.sm,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.passwordStrong,
    borderColor: colors.passwordStrong,
  },
  checkmark: {
    color: colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  requirementText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  requirementTextChecked: {
    color: colors.passwordStrong,
  },
});

