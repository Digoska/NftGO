import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import PasswordStrength from '../../components/auth/PasswordStrength';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { supabase } from '../../lib/supabase';

type Step = 'email' | 'success' | 'new-password';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const { resetPassword } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const processedHashRef = useRef<string | null>(null);

  // Helper function to parse hash from URL
  const parseHashFromUrl = (urlString: string) => {
    try {
      // Handle custom scheme URLs like nftgo://reset-password#access_token=...
      const hashIndex = urlString.indexOf('#');
      if (hashIndex === -1) return null;
      
      const hash = urlString.substring(hashIndex + 1);
      const params = new URLSearchParams(hash);
      return {
        access_token: params.get('access_token'),
        refresh_token: params.get('refresh_token'),
        type: params.get('type'),
      };
    } catch (err) {
      console.error('❌ Error parsing URL hash:', err);
      return null;
    }
  };

  const handleRecoverySession = async (accessToken: string, refreshToken: string) => {
    // Prevent duplicate processing
    if (processedHashRef.current === accessToken) return;
    processedHashRef.current = accessToken;

    console.log('✅ Setting recovery session...');
    try {
      // Set flag BEFORE setting session to prevent redirect race condition
      await AsyncStorage.setItem('isResettingPassword', 'true');
      
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });
      
      if (error) {
        console.error('❌ Error setting recovery session:', error);
        await AsyncStorage.removeItem('isResettingPassword');
        Alert.alert('Error', 'Invalid or expired reset link. Please request a new one.');
        return;
      }
      
      if (data.session) {
        console.log('✅ Recovery session established');
        setStep('new-password');
      }
    } catch (err: any) {
      console.error('❌ Exception setting recovery session:', err);
      await AsyncStorage.removeItem('isResettingPassword');
    }
  };

  // Check if we're coming from a password reset link
  useEffect(() => {
    const handleDeepLink = async () => {
      // Check URL parameters for password reset token
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log('🔗 Initial URL:', initialUrl);
          const hashParams = parseHashFromUrl(initialUrl);
          
          if (hashParams?.access_token && hashParams.type === 'recovery') {
            await handleRecoverySession(hashParams.access_token, hashParams.refresh_token || '');
          }
        }
      } catch (err) {
        console.error('❌ Error getting initial URL:', err);
      }
      
      // Also check params from expo-router
      if (params?.access_token && params?.type === 'recovery') {
        console.log('✅ Password reset token found in params');
        await handleRecoverySession(params.access_token as string, (params.refresh_token as string) || '');
      }
    };

    handleDeepLink();

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('🔗 Deep link received:', event.url);
      const hashParams = parseHashFromUrl(event.url);
      
      if (hashParams?.access_token && hashParams.type === 'recovery') {
        handleRecoverySession(hashParams.access_token, hashParams.refresh_token || '');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [params]);

  const validateEmail = () => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email is not valid');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = () => {
    if (!newPassword) {
      setPasswordError('Password is required');
      return false;
    }
    // Validate password strength (minimum 8 characters, number, and symbol)
    const hasMinLength = newPassword.length >= 8;
    const hasNumber = /\d/.test(newPassword);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasMinLength || !hasNumber || !hasSymbol) {
      setPasswordError('Password must meet all requirements');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSendResetEmail = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    setEmailError('');
    
    try {
      const { error } = await resetPassword(email.trim());
      
      if (error) {
        console.error('❌ Password reset error:', error);
        let errorMessage = error.message || 'Failed to send password reset email';
        
        // Provide helpful error messages
        if (error.message?.toLowerCase().includes('user not found')) {
          errorMessage = 'No account found with this email address.';
        } else if (error.message?.toLowerCase().includes('rate limit')) {
          errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
        }
        
        setEmailError(errorMessage);
        setLoading(false);
        return;
      }

      // Success - show success message
      setStep('success');
    } catch (err: any) {
      console.error('❌ Password reset exception:', err);
      setEmailError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!validatePassword()) return;

    setLoading(true);
    setPasswordError('');
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('❌ Password update error:', error);
        setPasswordError(error.message || 'Failed to update password');
        setLoading(false);
        return;
      }

      // Sign out immediately after password update to prevent auto-login
      await supabase.auth.signOut();

      // Success - show alert and navigate to login
      await AsyncStorage.removeItem('isResettingPassword');
      Alert.alert(
        'Password Updated',
        'Your password has been successfully updated. You can now sign in with your new password.',
        [
          {
            text: 'Back to Sign In',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (err: any) {
      console.error('❌ Password update exception:', err);
      setPasswordError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (step === 'success') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.successContainer}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={80} color={colors.primary} />
              </View>
              <Text style={styles.successTitle}>Check Your Email</Text>
              <Text style={styles.successMessage}>
                We've sent a password reset link to{'\n'}
                <Text style={styles.emailText}>{email}</Text>
              </Text>
              <Text style={styles.successSubtext}>
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </Text>
              <Button
                title="Back to Sign In"
                onPress={() => router.replace('/(auth)/login')}
                style={styles.backButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // New password screen (when coming from reset link)
  if (step === 'new-password') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.backButtonContainer}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.title}>Create New Password</Text>
              <Text style={styles.subtitle}>
                Enter your new password below
              </Text>
            </View>

            <View style={styles.form}>
              <Input
                label="New Password"
                placeholder="••••••••"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (passwordError) setPasswordError('');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password-new"
                error={passwordError}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                }
              />

              <PasswordStrength password={newPassword} />

              <Input
                label="Confirm Password"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (passwordError) setPasswordError('');
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoComplete="password-new"
                error={passwordError ? undefined : undefined}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                }
              />

              <Button
                title="Update Password"
                onPress={handleUpdatePassword}
                loading={loading}
                style={styles.submitButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Email input screen (default)
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButtonContainer}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={emailError}
            />

            <Button
              title="Send Reset Link"
              onPress={handleSendResetEmail}
              loading={loading}
              style={styles.submitButton}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Remember your password? </Text>
              <Text
                style={styles.footerLink}
                onPress={() => router.replace('/(auth)/login')}
              >
                Sign In
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    justifyContent: 'center',
  },
  backButtonContainer: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    zIndex: 10,
    padding: spacing.xs,
  },
  header: {
    marginBottom: spacing.xxl,
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  submitButton: {
    marginTop: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  eyeIcon: {
    padding: spacing.xs,
  },
  // Success screen styles
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  successIconContainer: {
    marginBottom: spacing.xl,
  },
  successTitle: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  successMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  emailText: {
    ...typography.bodyBold,
    color: colors.text,
  },
  successSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  backButton: {
    marginTop: spacing.md,
    minWidth: 200,
  },
});
