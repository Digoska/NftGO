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

export default function PrivacyPolicyScreen() {
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
        <Text style={styles.title}>Privacy Policy</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.lastUpdated}>Last Updated: November 2024</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          Welcome to NftGO. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
        </Text>

        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        <Text style={styles.subsectionTitle}>2.1 Account Information</Text>
        <Text style={styles.paragraph}>
          When you create an account, we collect:
        </Text>
        <Text style={styles.bulletPoint}>• Email address</Text>
        <Text style={styles.bulletPoint}>• Profile information (name, avatar)</Text>
        <Text style={styles.bulletPoint}>• Authentication credentials (stored securely via Supabase)</Text>

        <Text style={styles.subsectionTitle}>2.2 Location Data</Text>
        <Text style={styles.paragraph}>
          To enable NFT collection features, we collect and process your location data:
        </Text>
        <Text style={styles.bulletPoint}>• Real-time location coordinates (latitude, longitude)</Text>
        <Text style={styles.bulletPoint}>• Location data is used only for NFT collection functionality</Text>
        <Text style={styles.bulletPoint}>• You can disable location services in your device settings</Text>
        <Text style={styles.bulletPoint}>• Location data is not shared with third parties except as necessary for app functionality</Text>

        <Text style={styles.subsectionTitle}>2.3 Web3 Wallet Information</Text>
        <Text style={styles.paragraph}>
          If you choose to connect a Web3 wallet:
        </Text>
        <Text style={styles.bulletPoint}>• Wallet address (public blockchain address)</Text>
        <Text style={styles.bulletPoint}>• Wallet signature data (for authentication)</Text>
        <Text style={styles.bulletPoint}>• This information is stored securely and linked to your account</Text>

        <Text style={styles.subsectionTitle}>2.4 NFT Collection Data</Text>
        <Text style={styles.paragraph}>
          We store information about your NFT collection:
        </Text>
        <Text style={styles.bulletPoint}>• NFTs you have collected</Text>
        <Text style={styles.bulletPoint}>• Collection statistics (rarity, count, level, experience)</Text>
        <Text style={styles.bulletPoint}>• Collection timestamps and locations</Text>

        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use the collected information for:
        </Text>
        <Text style={styles.bulletPoint}>• Providing and maintaining the app service</Text>
        <Text style={styles.bulletPoint}>• Enabling location-based NFT collection</Text>
        <Text style={styles.bulletPoint}>• Managing your account and profile</Text>
        <Text style={styles.bulletPoint}>• Tracking your NFT collection and statistics</Text>
        <Text style={styles.bulletPoint}>• Authenticating your identity (email, social login, wallet)</Text>
        <Text style={styles.bulletPoint}>• Improving app functionality and user experience</Text>
        <Text style={styles.bulletPoint}>• Communicating with you about your account</Text>

        <Text style={styles.sectionTitle}>4. Data Storage</Text>
        <Text style={styles.paragraph}>
          Your data is stored securely using:
        </Text>
        <Text style={styles.bulletPoint}>• Supabase (backend database and authentication)</Text>
        <Text style={styles.bulletPoint}>• Data is encrypted in transit and at rest</Text>
        <Text style={styles.bulletPoint}>• We implement industry-standard security measures</Text>
        <Text style={styles.bulletPoint}>• Your password is hashed and never stored in plain text</Text>

        <Text style={styles.sectionTitle}>5. Location Services</Text>
        <Text style={styles.paragraph}>
          Location services are essential for the core functionality of NftGO:
        </Text>
        <Text style={styles.bulletPoint}>• Required for discovering and collecting NFTs near your location</Text>
        <Text style={styles.bulletPoint}>• Location data is processed in real-time and not stored long-term</Text>
        <Text style={styles.bulletPoint}>• You can disable location services, but this will limit app functionality</Text>
        <Text style={styles.bulletPoint}>• We use OpenStreetMap for map display (no location data shared with them)</Text>

        <Text style={styles.sectionTitle}>6. Third-Party Services</Text>
        <Text style={styles.subsectionTitle}>6.1 Supabase</Text>
        <Text style={styles.paragraph}>
          We use Supabase for backend services including authentication, database storage, and user management. Supabase's privacy practices are governed by their own privacy policy.
        </Text>

        <Text style={styles.subsectionTitle}>6.2 OpenStreetMap</Text>
        <Text style={styles.paragraph}>
          We use OpenStreetMap tiles for map display. We do not share your location data with OpenStreetMap.
        </Text>

        <Text style={styles.subsectionTitle}>6.3 Social Authentication</Text>
        <Text style={styles.paragraph}>
          When you sign in with Google or Apple, we receive basic profile information (name, email) as permitted by their authentication services.
        </Text>

        <Text style={styles.sectionTitle}>7. Your Rights</Text>
        <Text style={styles.paragraph}>
          You have the right to:
        </Text>
        <Text style={styles.bulletPoint}>• Access your personal data</Text>
        <Text style={styles.bulletPoint}>• Correct inaccurate data</Text>
        <Text style={styles.bulletPoint}>• Request deletion of your account and data</Text>
        <Text style={styles.bulletPoint}>• Withdraw consent for data processing</Text>
        <Text style={styles.bulletPoint}>• Export your data</Text>
        <Text style={styles.paragraph}>
          To exercise these rights, contact us at the email address provided below.
        </Text>

        <Text style={styles.sectionTitle}>8. Data Security</Text>
        <Text style={styles.paragraph}>
          We implement appropriate technical and organizational measures to protect your personal information:
        </Text>
        <Text style={styles.bulletPoint}>• Encryption of data in transit (HTTPS/TLS)</Text>
        <Text style={styles.bulletPoint}>• Secure authentication and authorization</Text>
        <Text style={styles.bulletPoint}>• Regular security assessments</Text>
        <Text style={styles.bulletPoint}>• Access controls and monitoring</Text>

        <Text style={styles.sectionTitle}>9. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          NftGO is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
        </Text>

        <Text style={styles.sectionTitle}>10. Data Retention</Text>
        <Text style={styles.paragraph}>
          We retain your personal information for as long as your account is active or as needed to provide services. If you delete your account, we will delete or anonymize your personal data within 30 days, except where we are required to retain it for legal purposes.
        </Text>

        <Text style={styles.sectionTitle}>11. Changes to This Privacy Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy in the app and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically.
        </Text>

        <Text style={styles.sectionTitle}>12. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about this Privacy Policy, please contact us at:
        </Text>
        <Text style={styles.paragraph}>
          Email: privacy@nftgo.app
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
  lastUpdated: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  subsectionTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
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

