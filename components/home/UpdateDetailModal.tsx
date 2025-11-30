import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
  Linking,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { AppUpdate } from '../../types';

interface UpdateDetailModalProps {
  visible: boolean;
  onClose: () => void;
  update: AppUpdate | null;
}

export default function UpdateDetailModal({
  visible,
  onClose,
  update,
}: UpdateDetailModalProps) {
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [scaleAnim] = React.useState(new Animated.Value(0.9));
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'megaphone';
      case 'event':
        return 'calendar';
      case 'update':
        return 'information-circle';
      default:
        return 'notifications';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'announcement':
        return colors.warning;
      case 'event':
        return colors.secondary;
      case 'update':
        return colors.primary;
      default:
        return colors.textMuted;
    }
  };

  const handleOpenLink = async () => {
    if (update?.action_url) {
      const canOpen = await Linking.canOpenURL(update.action_url);
      if (canOpen) {
        await Linking.openURL(update.action_url);
      }
    }
  };

  if (!update) return null;

  const typeIcon = getTypeIcon(update.type);
  const typeColor = getTypeColor(update.type);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.header}>
                <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
                  <Ionicons name={typeIcon as any} size={16} color={typeColor} />
                  <Text style={[styles.typeText, { color: typeColor }]}>
                    {update.type.charAt(0).toUpperCase() + update.type.slice(1)}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {update.image_url && !imageError && (
                  <Image
                    source={{ 
                      uri: update.image_url.replace(/\$0$/, '').trim(),
                    }}
                    style={styles.image}
                    resizeMode="cover"
                    onError={() => {
                      console.log('Image load error in modal for:', update.image_url);
                      setImageError(true);
                    }}
                    onLoad={() => setImageError(false)}
                  />
                )}

                <Text style={styles.title}>{update.title}</Text>

                {update.full_description ? (
                  <Text style={styles.description}>{update.full_description}</Text>
                ) : update.description ? (
                  <Text style={styles.description}>{update.description}</Text>
                ) : null}

                {update.action_url && (
                  <TouchableOpacity
                    style={[styles.linkButton, { backgroundColor: typeColor + '15' }]}
                    onPress={handleOpenLink}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="open-outline" size={20} color={typeColor} />
                    <Text style={[styles.linkText, { color: typeColor }]}>
                      Open Link
                    </Text>
                  </TouchableOpacity>
                )}

                <View style={styles.footer}>
                  <Text style={styles.dateText}>
                    {new Date(update.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    gap: spacing.xs,
  },
  typeText: {
    ...typography.bodyBold,
    textTransform: 'capitalize',
    fontSize: 14,
  },
  closeButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: spacing.lg,
    backgroundColor: colors.backgroundLight,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  linkText: {
    ...typography.bodyBold,
    fontSize: 16,
  },
  footer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dateText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});

