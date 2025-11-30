import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

export default function EditProfileScreen() {
  const { user, userProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [xUsername, setXUsername] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [xUsernameError, setXUsernameError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || '');
      setFullName(userProfile.full_name || '');
      setXUsername(userProfile.x_username || '');
      setDescription(userProfile.description || '');
      setAvatarUri(userProfile.avatar_url || null);
      setInitialLoading(false);
    }
  }, [userProfile]);

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

    // Check if username is already taken (by another user)
    if (usernameValue.trim().toLowerCase() !== userProfile?.username?.toLowerCase()) {
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
    }

    setUsernameError('');
    return true;
  };

  const validateXUsername = (xUsernameValue: string): boolean => {
    if (!xUsernameValue.trim()) {
      setXUsernameError('');
      return true; // X username is optional
    }

    // Remove @ if user included it
    const cleaned = xUsernameValue.trim().replace(/^@/, '');

    // Check X username format (alphanumeric, underscore, max 15 chars)
    if (cleaned.length > 15) {
      setXUsernameError('X username must be 15 characters or less');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleaned)) {
      setXUsernameError('X username can only contain letters, numbers, and underscores');
      return false;
    }

    setXUsernameError('');
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

  const handleSave = async () => {
    if (!(await validateUsername(username))) {
      return;
    }

    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (!validateXUsername(xUsername)) {
      return;
    }

    setLoading(true);
    try {
      if (!user?.id) {
        Alert.alert('Error', 'User not found');
        setLoading(false);
        return;
      }

      // Upload avatar if changed
      let avatarUrl = userProfile?.avatar_url || null;
      if (avatarUri && avatarUri !== userProfile?.avatar_url) {
        try {
          const fileExt = avatarUri.split('.').pop() || 'jpg';
          const fileName = `${user.id}-${Date.now()}.${fileExt}`;
          const filePath = `avatars/${fileName}`;

          // Delete old avatar if exists
          if (userProfile?.avatar_url && userProfile.avatar_url.includes('/avatars/')) {
            try {
              const oldPath = userProfile.avatar_url.split('/avatars/')[1];
              if (oldPath) {
                await supabase.storage.from('avatars').remove([oldPath]);
              }
            } catch (deleteError) {
              console.warn('Error deleting old avatar:', deleteError);
            }
          }

          // Read file as base64
          const base64 = await FileSystem.readAsStringAsync(avatarUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

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
            console.warn('Avatar upload failed, keeping old avatar:', uploadError);
            // Keep old avatar if upload fails
          }
        } catch (error) {
          console.error('Error uploading avatar:', error);
          // Keep old avatar if upload fails
        }
      }

      // Clean X username (remove @ if present)
      const cleanedXUsername = xUsername.trim().replace(/^@/, '') || null;
      const xConnectedAt = cleanedXUsername && !userProfile?.x_username
        ? new Date().toISOString()
        : userProfile?.x_connected_at || null;

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          username: username.trim().toLowerCase(),
          full_name: fullName.trim(),
          avatar_url: avatarUrl,
          x_username: cleanedXUsername,
          description: description.trim() || null,
          x_connected_at: xConnectedAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        Alert.alert('Error', updateError.message || 'Failed to save profile');
        setLoading(false);
        return;
      }

      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Profile update error:', error);
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Edit Profile</Text>
            <View style={styles.placeholder} />
          </View>

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
                  <Ionicons name="camera" size={40} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="pencil" size={16} color={colors.background} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
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
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {usernameError && <Text style={styles.errorText}>{usernameError}</Text>}
            <Text style={styles.inputHint}>
              Username cannot be an email. Use letters, numbers, _ and -
            </Text>
          </View>

          {/* Email (read-only) */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={[styles.input, styles.inputDisabled]}>
              <Text style={styles.inputDisabledText}>{user?.email}</Text>
            </View>
            <Text style={styles.inputHint}>Email cannot be changed</Text>
          </View>

          {/* X Username */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>X (Twitter) Username</Text>
            <View style={styles.xInputContainer}>
              <Ionicons
                name="logo-twitter"
                size={20}
                color={colors.textMuted}
                style={styles.xIcon}
              />
              <TextInput
                style={[styles.input, styles.xInput, xUsernameError && styles.inputError]}
                placeholder="@username"
                placeholderTextColor={colors.textMuted}
                value={xUsername}
                onChangeText={(text) => {
                  setXUsername(text);
                  if (xUsernameError) setXUsernameError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {xUsernameError && <Text style={styles.errorText}>{xUsernameError}</Text>}
            <Text style={styles.inputHint}>
              Optional. Enter your X username without @
            </Text>
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Bio / Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about yourself..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={styles.inputHint}>
              {description.length}/200 characters
            </Text>
          </View>

          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            disabled={!username.trim() || !fullName.trim()}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    padding: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  placeholder: {
    width: 40,
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
    backgroundColor: colors.backgroundCard,
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
  inputDisabled: {
    backgroundColor: colors.backgroundCard,
    opacity: 0.6,
  },
  inputDisabledText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  inputHint: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.small,
    color: colors.error,
    marginTop: spacing.xs,
  },
  saveButton: {
    marginTop: spacing.md,
  },
  xInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
  },
  xIcon: {
    marginRight: spacing.sm,
  },
  xInput: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: 0,
    marginVertical: 0,
    minHeight: 52,
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing.md,
  },
});

