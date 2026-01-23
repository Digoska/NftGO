import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import Button from '../../components/common/Button';
import CodeInput from '../../components/auth/CodeInput';
import PasswordStrength from '../../components/auth/PasswordStrength';
import SocialButton from '../../components/common/SocialButton';
import { GoogleIcon } from '../../components/common/Icons';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

type Step = 'email' | 'email-input' | 'verify' | 'password' | 'profile' | 'success';

export default function SignupScreen() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { signInWithGoogle } = useAuth();

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

  const handleEmailSubmit = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    setEmailError('');
    try {
      // Send OTP code to email
      // IMPORTANT: Do NOT set emailRedirectTo - that would send magic links instead of OTP codes
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          // Explicitly do NOT set emailRedirectTo to ensure OTP codes are sent
          // If emailRedirectTo is set, Supabase sends magic links instead
        },
      });

      if (error) {
        console.error('OTP Error:', error);
        setEmailError(error.message || 'Failed to send verification code. Please try again.');
        setLoading(false);
        return;
      }

      // Success - OTP sent, move to verify step
      setStep('verify');
    } catch (error: any) {
      console.error('Email submit error:', error);
      setEmailError(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeComplete = async (code: string) => {
    setVerificationCode(code);
    setCodeError('');
    
    setLoading(true);
    try {
      // Verify OTP code
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: 'email',
      });

      if (error) {
        setCodeError('Invalid code. Please try again.');
        setLoading(false);
        return;
      }

      // If verification successful, move to password step
      // NOTE: session creation happens asynchronously and _layout.tsx allows 'signup' route
      setStep('password');
    } catch (error: any) {
      console.error('Verification error:', error);
      setCodeError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    // Validate password strength (minimum 8 characters for security)
    const hasMinLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasMinLength || !hasNumber || !hasSymbol) {
      setPasswordError('Password must meet all requirements');
      return;
    }

    setPasswordError('');
    setLoading(true);
    try {
      // Check if we have a session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Session lost (e.g. reload or timeout)
        // We cannot re-use the OTP code as it's likely consumed
        setPasswordError('Session expired. Please verify your email again.');
        setStep('verify');
        setLoading(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setPasswordError(updateError.message || 'Failed to set password');
        setLoading(false);
        return;
      }

      // Move to profile setup step
      setStep('profile');
    } catch (error: any) {
      console.error('Password submit error:', error);
      setPasswordError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const validateUsername = async (usernameValue: string): Promise<boolean> => {
    if (!usernameValue.trim()) {
      setUsernameError('Username is required');
      return false;
    }

    // Check if username looks like an email
    if (/\S+@\S+\.\S+/.test(usernameValue)) {
      setUsernameError('Username cannot be an email address');
      return false;
    }

    // Check username length
    if (usernameValue.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }

    if (usernameValue.length > 20) {
      setUsernameError('Username must be less than 20 characters');
      return false;
    }

    // Check for valid characters (alphanumeric, underscore, hyphen)
    if (!/^[a-zA-Z0-9_-]+$/.test(usernameValue)) {
      setUsernameError('Username can only contain letters, numbers, _ and -');
      return false;
    }

    // Check if username is already taken
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', usernameValue.trim().toLowerCase())
        .single();

      if (data) {
        setUsernameError('Username is already taken');
        return false;
      }
    } catch (error: any) {
      // Username not found is good
      if (error.code !== 'PGRST116') {
        console.error('Error checking username:', error);
      }
    }

    setUsernameError('');
    return true;
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos to set a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleProfileSubmit = async () => {
    if (!(await validateUsername(username))) {
      return;
    }

    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        Alert.alert('Error', 'User not found');
        setLoading(false);
        return;
      }

      // Upload avatar if selected
      let avatarUrl = null;
      if (avatarUri) {
        try {
          // Validate file before upload
          const { validateAvatarFile, generateSafeFilename, getBase64FileSize } = await import('../../lib/file-validation');
          
          // Read file as base64
          const base64 = await FileSystem.readAsStringAsync(avatarUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Validate file size
          const fileSize = getBase64FileSize(base64);
          const validation = validateAvatarFile(avatarUri, fileSize);
          
          if (!validation.valid) {
            console.warn('Avatar validation failed:', validation.error);
            Alert.alert('Invalid File', validation.error || 'Please select a valid image file.');
            setLoading(false);
            return;
          }

          const fileExt = avatarUri.split('.').pop()?.toLowerCase() || 'jpg';
          const fileName = generateSafeFilename(currentUser.id, `avatar.${fileExt}`);
          const filePath = `avatars/${fileName}`;

          // Convert base64 to ArrayBuffer
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const arrayBuffer = byteArray.buffer;

          // Try to upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, arrayBuffer, {
              contentType: `image/${fileExt}`,
              upsert: false,
            });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath);
            avatarUrl = publicUrl;
          } else {
            console.warn('Avatar upload failed, continuing without avatar:', uploadError);
            // Continue without avatar if upload fails (bucket might not exist)
          }
        } catch (error) {
          console.error('Error uploading avatar:', error);
          // Continue without avatar if upload fails
        }
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .upsert({
          id: currentUser.id,
          username: username.trim().toLowerCase(),
          full_name: fullName.trim(),
          avatar_url: avatarUrl,
          email: currentUser.email,
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        console.error('Error updating profile:', updateError);
        
        // Handle specific error cases
        let errorMessage = 'Failed to save profile';
        
        // Check for unique constraint violation (duplicate username)
        // PostgreSQL error code 23505 or constraint name "users_username_key"
        const isDuplicateUsername = 
          updateError.code === '23505' || 
          updateError.message?.includes('users_username_key') ||
          updateError.message?.toLowerCase().includes('username') && 
          (updateError.message?.toLowerCase().includes('unique') || 
           updateError.message?.toLowerCase().includes('duplicate'));
        
        if (isDuplicateUsername) {
          errorMessage = 'This username is already taken. Please choose another.';
          setUsernameError('This username is already taken. Please choose another.');
        } else {
          errorMessage = updateError.message || errorMessage;
        }
        
        Alert.alert('Error', errorMessage);
        setLoading(false);
        return;
      }

      // Success!
      setStep('success');
    } catch (error: any) {
      console.error('Profile submit error:', error);
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!agreedToTerms) {
      setEmailError('Please agree to Terms of Service and Privacy Policy');
      return;
    }
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);

    if (error) {
      setEmailError(error.message || 'Google sign up failed');
    } else {
      router.replace('/(tabs)');
    }
  };


  const renderStep = () => {
    switch (step) {
      case 'email':
        return (
          <View style={styles.stepContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            
            <Text style={styles.stepTitle}>Create new account</Text>
            <Text style={styles.stepSubtitle}>
              Begin with creating new free account. This helps you keep your learning way easier.
            </Text>

            <View style={styles.agreementContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                  {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.agreementTextContainer}>
                  <Text style={styles.agreementText}>
                    I agree to the{' '}
                    <Text
                      style={styles.linkText}
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push('/(auth)/terms-of-service');
                      }}
                    >
                      Terms of Service
                    </Text>
                    {' '}and{' '}
                    <Text
                      style={styles.linkText}
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push('/(auth)/privacy-policy');
                      }}
                    >
                      Privacy Policy
                    </Text>
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <Button
              title="Continue with email"
              onPress={() => setStep('email-input')}
              style={styles.primaryButton}
              disabled={!agreedToTerms}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <SocialButton
              title="Continue with Google"
              onPress={handleGoogleLogin}
              loading={loading}
              icon={<GoogleIcon />}
              style={styles.socialButton}
              disabled={!agreedToTerms}
            />
          </View>
        );

      case 'email-input':
        return (
          <View style={styles.stepContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep('email')}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <Text style={styles.stepTitle}>Add your email 1/4</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, emailError && styles.inputError]}
                placeholder="example@example"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              {emailError && <Text style={styles.errorText}>{emailError}</Text>}
            </View>

            <Button
              title="Create an account"
              onPress={handleEmailSubmit}
              loading={loading}
              disabled={!email.trim()}
            />
          </View>
        );

      case 'verify':
        return (
          <View style={styles.stepContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep('email-input')}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <Text style={styles.stepTitle}>Verify your email 2/4</Text>
            <Text style={styles.stepSubtitle}>
              We just sent a verification code to{'\n'}
              <Text style={styles.emailText}>{email}</Text>
              {'\n\n'}Please check your email and enter the code below
            </Text>

            <CodeInput
              length={8}
              onComplete={handleCodeComplete}
              error={codeError}
            />

            <TouchableOpacity
              style={styles.linkButton}
              onPress={async () => {
                // Resend OTP code
                setLoading(true);
                setCodeError('');
                try {
                  const { error } = await supabase.auth.signInWithOtp({
                    email: email.trim(),
                    options: {
                      shouldCreateUser: true,
                      // Do NOT set emailRedirectTo - keep OTP code mode
                    },
                  });
                  if (error) {
                    setCodeError(error.message || 'Failed to resend code');
                  } else {
                    setCodeError(''); // Clear any previous errors
                  }
                } catch (error: any) {
                  setCodeError(error.message || 'An error occurred');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              <Text style={styles.linkText}>
                {loading ? 'Sending...' : 'Resend code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setStep('email-input')}
            >
              <Text style={styles.linkText}>Wrong email? Change email</Text>
            </TouchableOpacity>
          </View>
        );

      case 'password':
        return (
          <View style={styles.stepContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep('verify')}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <Text style={styles.stepTitle}>Create your password 3/4</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter password"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <PasswordStrength password={password} />

            {passwordError && (
              <Text style={styles.errorText}>{passwordError}</Text>
            )}

            <Button
              title="Continue"
              onPress={handlePasswordSubmit}
              loading={loading}
              disabled={password.length < 8}
            />
          </View>
        );

      case 'profile':
        return (
          <View style={styles.stepContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep('password')}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <Text style={styles.stepTitle}>Complete your profile 4/4</Text>
            <Text style={styles.stepSubtitle}>
              Add a username and profile picture to personalize your account
            </Text>

            {/* Avatar Selection */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={styles.avatarPicker}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarPreview} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="camera" size={32} color={colors.textMuted} />
                  </View>
                )}
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="pencil" size={16} color={colors.background} />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint}>Tap to add photo</Text>
            </View>

            {/* Full Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={[styles.input, usernameError && styles.inputError]}
                placeholder="Choose a username"
                placeholderTextColor={colors.textMuted}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (usernameError) setUsernameError('');
                  
                  // Debounced username availability check
                  if (usernameCheckTimeoutRef.current) {
                    clearTimeout(usernameCheckTimeoutRef.current);
                  }
                  
                  // Only check if username meets basic requirements
                  const trimmedUsername = text.trim().toLowerCase();
                  if (trimmedUsername.length >= 3) {
                    usernameCheckTimeoutRef.current = setTimeout(async () => {
                      setIsCheckingUsername(true);
                      try {
                        const { data, error } = await supabase
                          .from('users')
                          .select('id')
                          .eq('username', trimmedUsername)
                          .single();
                        
                        // If data exists, username is taken
                        if (data) {
                          setUsernameError('Username is already taken');
                        } else if (error) {
                          // If error code is PGRST116, it means no row found - username is available
                          if (error.code === 'PGRST116') {
                            // Username is available, clear any previous error
                            setUsernameError('');
                          } else {
                            // Some other error occurred
                            console.error('Error checking username:', error);
                          }
                        } else {
                          // No error and no data (shouldn't happen with .single(), but handle it)
                          setUsernameError('');
                        }
                      } catch (error: any) {
                        // Ignore "not found" errors (PGRST116) - means username is available
                        if (error.code === 'PGRST116') {
                          setUsernameError('');
                        } else {
                          console.error('Error checking username:', error);
                        }
                      } finally {
                        setIsCheckingUsername(false);
                      }
                    }, 500); // 500ms debounce
                  }
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {isCheckingUsername && !usernameError && (
                <Text style={styles.inputHint}>Checking availability...</Text>
              )}
              {usernameError && <Text style={styles.errorText}>{usernameError}</Text>}
              <Text style={styles.inputHint}>
                Username cannot be an email. Use letters, numbers, _ and -
              </Text>
            </View>

            <Button
              title="Complete Setup"
              onPress={handleProfileSubmit}
              loading={loading}
              disabled={!username.trim() || !fullName.trim()}
              style={styles.primaryButton}
            />
          </View>
        );

      case 'success':
        return (
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Text style={styles.successCheckmark}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Your account was successfully created!</Text>
            <Text style={styles.successSubtitle}>
              Only one click to explore online education.
            </Text>
            <Button
              title="Log In"
              onPress={() => router.replace('/(tabs)')}
              style={styles.primaryButton}
            />
          </View>
        );
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, []);

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
          {renderStep()}
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
  },
  stepContainer: {
    flex: 1,
  },
  backButton: {
    marginBottom: spacing.lg,
    width: 40,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.text,
  },
  stepTitle: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  inputError: {
    borderColor: colors.error,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  passwordInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  eyeButton: {
    padding: spacing.md,
  },
  eyeText: {
    fontSize: 20,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.5,
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
  socialButton: {
    marginBottom: spacing.sm,
  },
  linkButton: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  linkText: {
    ...typography.body,
    color: colors.primary,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successCheckmark: {
    fontSize: 48,
    color: colors.background,
    fontWeight: 'bold',
  },
  successTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  successSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emailSentContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  emailSentIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emailText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  emailSentInstructions: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  agreementContainer: {
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    marginRight: spacing.sm,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  agreementTextContainer: {
    flex: 1,
  },
  agreementText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarPicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  avatarHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  inputHint: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
