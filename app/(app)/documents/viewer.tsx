import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Pressable, Platform } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';
import { API_URL } from '@/lib/api';

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
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.progressText, { color: colors.text }]}>
            Loading Document... {Math.round(downloadProgress * 100)}%
          </Text>
        </View>
      ) : error ? (
        /* Error Layout */
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#f43f5e" />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
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
                { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Ionicons name="share-outline" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Share / Print</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        /* Android & Fallbacks: Display detail layout and native viewer trigger */
        <View style={styles.centerContainer}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? '#3d1619' : '#fef2f2' }]}>
            <Ionicons name="document-text" size={64} color="#ef4444" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Document Downloaded</Text>
          <Text style={[styles.desc, { color: colors.muted }]}>
            {fileName}
          </Text>

          <Pressable
            onPress={() => handleOpenNatively()}
            style={({ pressed }) => [
              styles.openButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Ionicons name="open-outline" size={20} color="#ffffff" />
            <Text style={styles.openButtonText}>Open in PDF Viewer</Text>
          </Pressable>
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
    gap: 16,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderCurve: 'continuous',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    borderCurve: 'continuous',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  desc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    borderCurve: 'continuous',
  },
  openButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
