import React from 'react';
import { StyleSheet, View, Text, Modal, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography } from '@/constants/theme';
import { ShareProgress } from '@/hooks/use-share-documents';

interface ShareProgressOverlayProps {
  progressState: ShareProgress;
  onClose: () => void;
}

export function ShareProgressOverlay({ progressState, onClose }: ShareProgressOverlayProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';

  const { status, currentFile, totalFiles, progress, errorMessage } = progressState;

  if (status === 'idle') return null;

  // Determine message to display
  let statusText = 'Processing...';
  if (status === 'downloading') {
    statusText = `Downloading document ${currentFile} of ${totalFiles}...`;
  } else if (status === 'zipping') {
    statusText = 'Preparing files for zip compression...';
  } else if (status === 'sharing') {
    statusText = 'Opening native email client...';
  } else if (status === 'success') {
    statusText = 'Share completed!';
  } else if (status === 'error') {
    statusText = 'Failed to share documents.';
  }

  const showCancelButton = status === 'error' || status === 'success';

  return (
    <Modal
      transparent
      visible={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(8, 23, 41, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: colors.cardBorder,
              borderWidth: 1,
            },
          ]}
        >
          {status === 'error' ? (
            <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          ) : status === 'success' ? (
            <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
          ) : (
            <ActivityIndicator size="large" color={colors.primary} />
          )}

          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.text }]}>{statusText}</Text>
            {status === 'downloading' && (
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                {Math.round(progress * 100)}% downloaded
              </Text>
            )}
            {status === 'error' && errorMessage && (
              <Text style={[styles.errorDescription, { color: colors.danger }]}>
                {errorMessage}
              </Text>
            )}
          </View>

          {/* Simple premium progress bar for download */}
          {status === 'downloading' && (
            <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.round(progress * 100)}%`,
                  },
                ]}
              />
            </View>
          )}

          {showCancelButton && (
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor: status === 'error' ? colors.danger : colors.primary,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={styles.closeButtonText}>
                {status === 'error' ? 'Close' : 'Done'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    gap: 16,
    elevation: 5,
    minWidth: 260,
    maxWidth: 320,
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
  },
  textContainer: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    ...Typography.subheadline,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.footnote,
  },
  errorDescription: {
    ...Typography.footnote,
    textAlign: 'center',
    marginTop: 4,
  },
  progressBarBg: {
    height: 6,
    width: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  closeButtonText: {
    color: '#ffffff',
    ...Typography.buttonSmall,
    fontWeight: '600',
  },
});
