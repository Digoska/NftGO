import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { generateWalletMessage, verifyWalletSignature, formatAddress } from '../../lib/wallet';
import { supabase } from '../../lib/supabase';

interface WalletButtonProps {
  onSuccess?: (address: string) => void;
  onError?: (error: any) => void;
}

export default function WalletButton({ onSuccess, onError }: WalletButtonProps) {
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleWalletConnect = async () => {
    setLoading(true);
    setConnecting(true);

    try {
      // Generate message for signing
      const tempAddress = '0x0000000000000000000000000000000000000000'; // Placeholder
      const message = await generateWalletMessage(tempAddress);

      // Show wallet selection options
      Alert.alert(
        'Connect Wallet',
        'Choose your wallet app:',
        [
          {
            text: 'MetaMask',
            onPress: () => openWalletApp('metamask', message),
          },
          {
            text: 'WalletConnect',
            onPress: () => openWalletApp('walletconnect', message),
          },
          {
            text: 'Trust Wallet',
            onPress: () => openWalletApp('trust', message),
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setLoading(false);
              setConnecting(false);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Wallet connect error:', error);
      if (onError) onError(error);
      Alert.alert('Error', 'Failed to connect wallet. Please try again.');
      setLoading(false);
      setConnecting(false);
    }
  };

  const openWalletApp = async (wallet: string, message: string) => {
    let deepLink = '';

    switch (wallet) {
      case 'metamask':
        deepLink = 'metamask://wc?uri=';
        break;
      case 'walletconnect':
        // For WalletConnect, you'd typically use a QR code or deep link
        deepLink = 'wc://';
        break;
      case 'trust':
        deepLink = 'trust://';
        break;
      default:
        deepLink = '';
    }

    if (deepLink) {
      const canOpen = await Linking.canOpenURL(deepLink);
      if (canOpen) {
        await Linking.openURL(deepLink);
        // In a real implementation, you'd wait for the wallet response
        // and verify the signature
        Alert.alert(
          'Wallet Connection',
          'Please sign the message in your wallet app. After signing, the connection will complete automatically.',
          [
            {
              text: 'I\'ve Signed',
              onPress: async () => {
                // For demo purposes, we'll use a mock address
                // In production, you'd get this from the wallet response
                const mockAddress = '0x' + Array.from({ length: 40 }, () => 
                  Math.floor(Math.random() * 16).toString(16)
                ).join('');
                
                await completeWalletAuth(mockAddress, 'mock_signature', message);
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setLoading(false);
                setConnecting(false);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Wallet Not Installed',
          `Please install ${wallet === 'metamask' ? 'MetaMask' : wallet === 'trust' ? 'Trust Wallet' : 'a wallet app'} to continue.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setLoading(false);
                setConnecting(false);
              },
            },
          ]
        );
      }
    } else {
      // Fallback: Show instructions for manual connection
      showManualConnectionInstructions(message);
    }
  };

  const showManualConnectionInstructions = (message: string) => {
    Alert.alert(
      'Connect Wallet',
      'To connect your wallet:\n\n1. Open your wallet app\n2. Scan the QR code or copy the connection link\n3. Sign the message\n4. Return to this app',
      [
        {
          text: 'Copy Message',
          onPress: () => {
            // Copy message to clipboard (you'd need expo-clipboard for this)
            Alert.alert('Message', message);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setLoading(false);
            setConnecting(false);
          },
        },
      ]
    );
  };

  const completeWalletAuth = async (address: string, signature: string, message: string) => {
    try {
      const { error, session } = await verifyWalletSignature(address, signature, message);
      
      if (error) {
        throw error;
      }

      if (session && onSuccess) {
        onSuccess(address);
      }
    } catch (error: any) {
      console.error('Wallet auth error:', error);
      if (onError) onError(error);
      Alert.alert('Error', 'Failed to authenticate with wallet. Please try again.');
    } finally {
      setLoading(false);
      setConnecting(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.buttonLoading]}
      onPress={handleWalletConnect}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <View style={styles.content}>
          <Text style={styles.icon}>🔷</Text>
          <Text style={styles.text}>Connect Wallet</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  text: {
    ...typography.bodyBold,
    color: colors.text,
  },
});

