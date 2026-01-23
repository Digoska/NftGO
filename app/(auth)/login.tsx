import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SocialButton from '../../components/common/SocialButton';
import WalletButton from '../../components/common/WalletButton';
import { GoogleIcon } from '../../components/common/Icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [loginError, setLoginError] = useState('');
  const { signIn, signInWithGoogle } = useAuth();

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is not valid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      console.log('❌ Validation failed');
      return;
    }

    console.log('🔐 Starting login process...');
    console.log('🔐 Email:', email);
    console.log('🔐 Password length:', password.length);
    console.log('🔐 Email format valid:', /\S+@\S+\.\S+/.test(email));
    setLoading(true);
    setLoginError('');
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        console.error('❌ Login failed:', error);
        console.error('❌ Error code:', error.status);
        console.error('❌ Error message:', error.message);
        console.error('❌ Full error object:', JSON.stringify(error, null, 2));
        
        // Show detailed error with helpful suggestions
        let errorMessage = 'Login failed';
        
        if (error.message) {
          errorMessage = error.message;
          
          // Provide helpful tips based on error message
          if (error.message.toLowerCase().includes('invalid login credentials') || 
              error.message.toLowerCase().includes('invalid credentials')) {
            errorMessage = 'Invalid email or password. Please check your credentials.';
          } else if (error.message.toLowerCase().includes('email not confirmed') ||
                     error.message.toLowerCase().includes('email not verified')) {
            errorMessage = 'Please verify your email address. Check your inbox for a verification email.';
          } else if (error.message.toLowerCase().includes('user not found')) {
            errorMessage = 'Account not found. This email address is not registered.';
          }
        } else if (error.status === 400) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.status === 401) {
          errorMessage = 'Invalid credentials. The email or password you entered is incorrect.';
        } else if (error.status === 429) {
          errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
        }
        
        setLoginError(errorMessage);
        // Highlight input fields with error
        setErrors({ email: '', password: '' });
      } else {
        console.log('✅ Login successful!');
        setLoginError('');
        // Navigation will happen automatically via auth state change
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('❌ Login exception:', err);
      
      // Handle JSON parse errors specifically
      let errorMessage = err.message || 'An unexpected error occurred';
      if (errorMessage.includes('JSON Parse error') || errorMessage.includes('Unexpected character')) {
        errorMessage = 'Configuration error: Unable to connect to authentication server. Please check your app configuration.';
        console.error('❌ JSON Parse Error - This usually means Supabase credentials are missing or invalid in the native build');
        console.error('❌ Make sure to run: npx expo prebuild --platform ios');
      }
      
      setLoginError(errorMessage);
      setErrors({ email: '', password: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        console.error('❌ Google login error:', error);
        
        // Show user-friendly error messages
        let errorMessage = error.message || 'Google login failed';
        
        if (error.code === 'NETWORK_ERROR') {
          errorMessage = error.message || 'Network error: Unable to connect to authentication server. Please check your internet connection.';
        } else if (error.code === 'JSON_PARSE_ERROR') {
          errorMessage = error.message || 'Configuration error: Authentication server returned an invalid response. Please verify your Supabase OAuth configuration in the dashboard.';
        } else if (error.code === 'OAUTH_NOT_CONFIGURED') {
          errorMessage = 'Google Sign In is not configured. Please set up OAuth in your Supabase dashboard.';
        } else if (error.code === 'SUPABASE_NOT_CONFIGURED') {
          errorMessage = 'App configuration error. Please rebuild the app with: npx expo prebuild --platform ios';
        } else if (error.code === 'NO_OAUTH_URL') {
          errorMessage = 'Failed to get OAuth URL. Please verify Google OAuth is enabled and configured in Supabase dashboard.';
        }
        
        setLoginError(errorMessage);
      } else {
        setLoginError('');
        // Navigation will happen automatically via auth state change
        console.log('✅ Google OAuth initiated successfully');
        // Don't navigate here - wait for auth state change
      }
    } catch (err: any) {
      console.error('❌ Google login exception:', err);
      setLoginError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };


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
          <View style={styles.header}>
            <Text style={styles.title}>Welcome back!</Text>
            <Text style={styles.subtitle}>
              Sign in to your NftGO account
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
                if (loginError) setLoginError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email || (loginError ? ' ' : undefined)}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
                if (loginError) setLoginError('');
              }}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              error={errors.password || (loginError ? ' ' : undefined)}
            />

            {loginError && (
              <Text style={styles.errorText}>{loginError}</Text>
            )}

            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={() => router.push('/(auth)/reset-password')}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

                <SocialButton
                  title="Sign in with Google"
                  onPress={handleGoogleLogin}
                  loading={loading}
                  icon={<GoogleIcon />}
                />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Text
                style={styles.footerLink}
                onPress={() => router.push('/(auth)/signup')}
              >
                Sign Up
              </Text>
            </View>
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>v1.1.0-fix</Text>
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
  },
  form: {
    width: '100%',
  },
  loginButton: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  forgotPasswordText: {
    ...typography.body,
    color: colors.primary,
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
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
  iconText: {
    fontSize: 20,
  },
  errorText: {
    ...typography.small,
    color: colors.error,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
});
