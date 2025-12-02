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

export default function TermsOfServiceScreen() {
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
        <Text style={styles.title}>Terms of Service</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.lastUpdated}>Last Updated: November 2024</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing or using NftGO, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this application.
        </Text>

        <Text style={styles.sectionTitle}>2. Account Registration</Text>
        <Text style={styles.paragraph}>
          To use NftGO, you must create an account. You can register using:
        </Text>
        <Text style={styles.bulletPoint}>• Email address and password</Text>
        <Text style={styles.bulletPoint}>• Google account</Text>
        <Text style={styles.bulletPoint}>• Apple ID</Text>
        <Text style={styles.bulletPoint}>• Web3 wallet (Ethereum-compatible)</Text>

        <Text style={styles.subsectionTitle}>2.1 Account Responsibilities</Text>
        <Text style={styles.paragraph}>
          You are responsible for:
        </Text>
        <Text style={styles.bulletPoint}>• Maintaining the confidentiality of your account credentials</Text>
        <Text style={styles.bulletPoint}>• All activities that occur under your account</Text>
        <Text style={styles.bulletPoint}>• Providing accurate and complete information</Text>
        <Text style={styles.bulletPoint}>• Notifying us immediately of any unauthorized use</Text>

        <Text style={styles.sectionTitle}>3. NFT Collection Rules</Text>
        <Text style={styles.subsectionTitle}>3.1 Location-Based Collection</Text>
        <Text style={styles.paragraph}>
          NFTs in NftGO are collected based on your physical location:
        </Text>
        <Text style={styles.bulletPoint}>• You must be within proximity (50 meters) to collect an NFT</Text>
        <Text style={styles.bulletPoint}>• Location services must be enabled</Text>
        <Text style={styles.bulletPoint}>• Spoofing or falsifying location is prohibited</Text>

        <Text style={styles.subsectionTitle}>3.2 NFT Ownership</Text>
        <Text style={styles.paragraph}>
          NFTs collected in NftGO:
        </Text>
        <Text style={styles.bulletPoint}>• Are digital collectibles within the app</Text>
        <Text style={styles.bulletPoint}>• Ownership is recorded in your account</Text>
        <Text style={styles.bulletPoint}>• Each NFT can only be collected once per account</Text>
        <Text style={styles.bulletPoint}>• NFTs may have different rarity levels (Common, Rare, Epic, Legendary)</Text>

        <Text style={styles.sectionTitle}>4. Location Services</Text>
        <Text style={styles.paragraph}>
          Location services are required for core app functionality:
        </Text>
        <Text style={styles.bulletPoint}>• You must grant location permissions to use NFT collection features</Text>
        <Text style={styles.bulletPoint}>• Location data is used solely for app functionality</Text>
        <Text style={styles.bulletPoint}>• You can disable location services, but this will limit app features</Text>
        <Text style={styles.bulletPoint}>• We do not track your location when the app is closed</Text>

        <Text style={styles.sectionTitle}>5. User Conduct</Text>
        <Text style={styles.paragraph}>
          You agree not to:
        </Text>
        <Text style={styles.bulletPoint}>• Use location spoofing or manipulation tools</Text>
        <Text style={styles.bulletPoint}>• Attempt to hack, reverse engineer, or exploit the app</Text>
        <Text style={styles.bulletPoint}>• Create multiple accounts to collect the same NFT multiple times</Text>
        <Text style={styles.bulletPoint}>• Use automated tools or bots to interact with the app</Text>
        <Text style={styles.bulletPoint}>• Share your account credentials with others</Text>
        <Text style={styles.bulletPoint}>• Use the app for any illegal purpose</Text>
        <Text style={styles.bulletPoint}>• Interfere with or disrupt the app's operation</Text>

        <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          All content in NftGO, including but not limited to:
        </Text>
        <Text style={styles.bulletPoint}>• App design, logos, and branding</Text>
        <Text style={styles.bulletPoint}>• NFT artwork and metadata</Text>
        <Text style={styles.bulletPoint}>• Software code and functionality</Text>
        <Text style={styles.paragraph}>
          is the property of NftGO or its licensors and is protected by copyright, trademark, and other intellectual property laws.
        </Text>

        <Text style={styles.sectionTitle}>7. Service Availability</Text>
        <Text style={styles.paragraph}>
          We strive to provide continuous service but do not guarantee:
        </Text>
        <Text style={styles.bulletPoint}>• Uninterrupted or error-free operation</Text>
        <Text style={styles.bulletPoint}>• Availability at all times</Text>
        <Text style={styles.bulletPoint}>• Compatibility with all devices</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify, suspend, or discontinue the service at any time with or without notice.
        </Text>

        <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          To the maximum extent permitted by law:
        </Text>
        <Text style={styles.bulletPoint}>• NftGO is provided "as is" without warranties of any kind</Text>
        <Text style={styles.bulletPoint}>• We are not liable for any indirect, incidental, or consequential damages</Text>
        <Text style={styles.bulletPoint}>• We are not responsible for loss of NFTs, data, or account access</Text>
        <Text style={styles.bulletPoint}>• Our total liability is limited to the amount you paid for the service (if any)</Text>

        <Text style={styles.sectionTitle}>9. Indemnification</Text>
        <Text style={styles.paragraph}>
          You agree to indemnify and hold harmless NftGO, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses arising from your use of the app or violation of these terms.
        </Text>

        <Text style={styles.sectionTitle}>10. Termination</Text>
        <Text style={styles.paragraph}>
          We may terminate or suspend your account immediately, without prior notice, for:
        </Text>
        <Text style={styles.bulletPoint}>• Violation of these Terms of Service</Text>
        <Text style={styles.bulletPoint}>• Fraudulent or illegal activity</Text>
        <Text style={styles.bulletPoint}>• Location spoofing or cheating</Text>
        <Text style={styles.bulletPoint}>• Any other reason we deem necessary</Text>
        <Text style={styles.paragraph}>
          You may delete your account at any time through the app settings.
        </Text>

        <Text style={styles.sectionTitle}>11. Age Restrictions</Text>
        <Text style={styles.paragraph}>
          NftGO is intended for users who are at least 13 years of age. Users under 18 should have parental consent. By using the app, you represent that you meet the age requirements and have the legal capacity to enter into this agreement.
        </Text>

        <Text style={styles.sectionTitle}>12. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify these Terms of Service at any time. We will notify users of significant changes by:
        </Text>
        <Text style={styles.bulletPoint}>• Posting the updated terms in the app</Text>
        <Text style={styles.bulletPoint}>• Updating the "Last Updated" date</Text>
        <Text style={styles.paragraph}>
          Continued use of the app after changes constitutes acceptance of the new terms.
        </Text>

        <Text style={styles.sectionTitle}>13. Governing Law</Text>
        <Text style={styles.paragraph}>
          These Terms of Service shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.
        </Text>

        <Text style={styles.sectionTitle}>14. Contact Information</Text>
        <Text style={styles.paragraph}>
          If you have any questions about these Terms of Service, please contact us at:
        </Text>
        <Text style={styles.paragraph}>
          Email: legal@nftgo.app
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

