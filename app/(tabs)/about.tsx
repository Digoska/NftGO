import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/(tabs)/profile');
            }
          }}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>About</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🎮</Text>
          <Text style={styles.appName}>NftGO</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <Text style={styles.sectionTitle}>What is NftGO?</Text>
        <Text style={styles.paragraph}>
          NftGO is a location-based NFT collection app inspired by Pokémon GO. 
          Explore the real world, discover NFTs at specific locations, build your 
          collection, and compete on the leaderboard!
        </Text>

        <Text style={styles.sectionTitle}>Features</Text>
        <Text style={styles.bulletPoint}>• Location-based NFT collection</Text>
        <Text style={styles.bulletPoint}>• Gamification system (levels, experience, coins, streaks)</Text>
        <Text style={styles.bulletPoint}>• Leaderboard rankings</Text>
        <Text style={styles.bulletPoint}>• Support for images, videos, and 3D models</Text>
        <Text style={styles.bulletPoint}>• User profiles with badges</Text>
        <Text style={styles.bulletPoint}>• Social features and sharing</Text>

        <Text style={styles.sectionTitle}>Technology</Text>
        <Text style={styles.paragraph}>
          Built with React Native, Expo, TypeScript, and Supabase. 
          Uses Three.js for 3D model rendering and React Native Maps for location features.
        </Text>

        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.paragraph}>
          For questions, feedback, or support, please contact us:
        </Text>
        <Text style={styles.paragraph}>
          Email: support@nftgo.app
        </Text>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.md,
    width: 40,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.text,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.xl,
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  appName: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  version: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  paragraph: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 24,
  },
  bulletPoint: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.md,
    marginBottom: spacing.xs,
    lineHeight: 24,
  },
  spacer: {
    height: spacing.xl,
  },
});

