import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Pressable, Platform } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography } from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';
import { API_URL } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function DocumentViewerScreen() {
  const { id, fileName } = useLocalSearchParams<{ id: string; fileName: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const { accessToken } = useAuthStore();

  const [localUri, setLocalUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    if (!fileName) {
      setError('Invalid document filename');
      setLoading(false);
      return;
    }

    const downloadPdf = async () => {
      try {
        const localTarget = `${FileSystem.cacheDirectory}${fileName}`;
        const fileInfo = await FileSystem.getInfoAsync(localTarget);

        // 1. Caching check: If file is already downloaded, load it directly to save data
        if (fileInfo.exists) {
          setLocalUri(localTarget);
          setLoading(false);
          return;
        }

        // 2. Setup download with authentication headers
        const downloadUrl = `${API_URL}/documents/file/${encodeURIComponent(fileName)}`;
        const downloadResumable = FileSystem.createDownloadResumable(
          downloadUrl,
          localTarget,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'x-client-type': 'mobile',
            },
          },
          (progress) => {
            const percent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
            setDownloadProgress(isNaN(percent) ? 0 : percent);
          }
        );

        const result = await downloadResumable.downloadAsync();
        
        if (result && result.status === 200) {
          setLocalUri(result.uri);
          setLoading(false);
          // On Android, trigger automatic sharing/opening immediately since WebView won't render local PDF
          if (Platform.OS === 'android') {
            await handleOpenNatively(result.uri);
          }
        } else {
          throw new Error('Failed to download document from server');
        }
      } catch (err: any) {
        console.error('Error viewing/downloading PDF:', err);
        setError(err.message || 'Unable to open PDF document.');
        setLoading(false);
      }
    };

    downloadPdf();
  }, [fileName, accessToken]);

  const handleOpenNatively = async (targetUri?: string) => {
    const uriToOpen = targetUri || localUri;
    if (!uriToOpen) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uriToOpen, {
          mimeType: 'application/pdf',
          dialogTitle: 'Open Document',
        });
      } else {
        setError('Native sharing or preview sheet is not available on this device');
      }
    } catch (err) {
      console.error('Error opening native file viewer:', err);
    }
  };

  const isIos = Platform.OS === 'ios';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: fileName || 'PDF Viewer' }} />

      {loading ? (
        /* Progress loader */
        <View style={styles.centerContainer}>
          <View style={[styles.loaderCard, { backgroundColor: isDark ? 'rgba(8,23,41,0.7)' : 'rgba(255,255,255,0.85)', borderColor: colors.cardBorder }]}>
            <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 4 }} />
            <Text style={[styles.progressText, { color: colors.text }]}>
              Downloading Document
            </Text>
            {/* Custom Premium Progress Bar */}
            <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#0f2740' : '#e2effa' }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.max(5, Math.min(100, Math.round(downloadProgress * 100)))}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressPercent, { color: colors.muted }]}>
              {Math.round(downloadProgress * 100)}% Completed
            </Text>
          </View>
        </View>
      ) : error ? (
        /* Error Layout */
        <View style={styles.centerContainer}>
          <View style={[styles.loaderCard, { backgroundColor: isDark ? 'rgba(8,23,41,0.7)' : 'rgba(255,255,255,0.85)', borderColor: colors.cardBorder, alignItems: 'center' }]}>
            <Ionicons name="alert-circle-outline" size={48} color="#f43f5e" style={{ marginBottom: 4 }} />
            <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                {
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <LinearGradient
                colors={[colors.primary, isDark ? '#3d8fd4' : '#1a6db8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.btnGradient}
              >
                <Text style={styles.backButtonText}>Go Back</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      ) : isIos && localUri ? (
        /* iOS: Render inside in-app WebView */
        <View style={styles.webContainer}>
          <WebView
            source={{ uri: localUri }}
            style={styles.webview}
            scalesPageToFit
            originWhitelist={['*']}
          />
          {/* iOS action bar */}
          <View style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.cardBorder }]}>
            <Pressable
              onPress={() => handleOpenNatively()}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                },
              ]}
            >
              <LinearGradient
                colors={[colors.primary, isDark ? '#3d8fd4' : '#1a6db8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                <Ionicons name="share-outline" size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>Share / Print</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      ) : (
        /* Android & Fallbacks: Display detail layout and native viewer trigger */
        <View style={styles.centerContainer}>
          <View style={[styles.loaderCard, { backgroundColor: isDark ? 'rgba(8,23,41,0.7)' : 'rgba(255,255,255,0.85)', borderColor: colors.cardBorder, alignItems: 'center' }]}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(61,22,25,0.6)' : '#fef2f2' }]}>
              <Ionicons name="document-text" size={48} color="#ef4444" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Document Ready</Text>
            <Text style={[styles.desc, { color: colors.muted }]} numberOfLines={2}>
              {fileName}
            </Text>

            <Pressable
              onPress={() => handleOpenNatively()}
              style={({ pressed }) => [
                styles.openButton,
                {
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                },
              ]}
            >
              <LinearGradient
                colors={[colors.primary, isDark ? '#3d8fd4' : '#1a6db8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                <Ionicons name="open-outline" size={20} color="#ffffff" />
                <Text style={styles.openButtonText}>Open in PDF Viewer</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loaderCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: 24,
    alignItems: 'center',
    gap: 16,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
  },
  progressText: {
    ...Typography.headline,
    fontWeight: '700',
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    ...Typography.footnote,
    fontWeight: '600',
  },
  errorText: {
    ...Typography.subheadline,
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
    marginTop: 8,
    boxShadow: '0 4px 12px rgba(244, 63, 94, 0.2)',
  },
  btnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#ffffff',
    ...Typography.buttonSmall,
  },
  webContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  actionBar: {
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  actionButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(21, 91, 157, 0.2)',
  },
  actionGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    ...Typography.button,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    ...Typography.title3,
    fontWeight: '700',
  },
  desc: {
    ...Typography.footnote,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  openButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(21, 91, 157, 0.2)',
  },
  openButtonText: {
    color: '#ffffff',
    ...Typography.button,
  },
});
