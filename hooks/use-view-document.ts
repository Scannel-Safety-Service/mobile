import { useState } from 'react';
import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '@/store/auth-store';
import { API_URL } from '@/lib/api';
import { cleanFileName } from '@/lib/file-utils';

export function useViewDocument() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuthStore();

  const viewDocument = async (fileUrl: string, originalFileName: string) => {
    setIsDownloading(true);
    setDownloadProgress(0);
    setError(null);

    try {
      const storageFileName = fileUrl.split('/').pop() || '';
      const localTarget = `${FileSystem.cacheDirectory}${storageFileName}`;
      
      const friendlyName = cleanFileName(originalFileName || 'document.pdf');
      const friendlyLocalTarget = `${FileSystem.cacheDirectory}${friendlyName}`;

      const fileInfo = await FileSystem.getInfoAsync(localTarget);

      // Helper to open natively
      const openNatively = async (uriToOpen: string) => {
        // Copy to friendly filename so the OS viewer uses the decoded name
        await FileSystem.copyAsync({
          from: uriToOpen,
          to: friendlyLocalTarget,
        });

        if (Platform.OS === 'android') {
          const cUri = await FileSystem.getContentUriAsync(friendlyLocalTarget);
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: cUri,
            flags: 1, // Grant read permission
            type: 'application/pdf',
          });
        } else {
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(friendlyLocalTarget, {
              mimeType: 'application/pdf',
              dialogTitle: 'Open Document',
            });
            // Cleanup friendly copy on iOS since shareAsync blocks until closed
            try {
              await FileSystem.deleteAsync(friendlyLocalTarget, { idempotent: true });
            } catch (err) {
              console.warn('[View Hook] Failed to cleanup friendly preview file:', err);
            }
          } else {
            throw new Error('Native sharing or preview sheet is not available on this device');
          }
        }
      };

      // 1. Caching check: If file is already downloaded, load it directly to save data
      if (fileInfo.exists) {
        await openNatively(localTarget);
        setIsDownloading(false);
        return;
      }

      // 2. Setup download with authentication headers
      const downloadUrl = `${API_URL}/documents/file/${encodeURIComponent(storageFileName)}`;
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
        await openNatively(result.uri);
      } else {
        throw new Error('Failed to download document from server');
      }
    } catch (err: any) {
      console.error('Error viewing/downloading PDF:', err);
      const errMsg = err.message || 'Unable to open PDF document.';
      setError(errMsg);
      Alert.alert('Error', errMsg);
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    viewDocument,
    isDownloading,
    downloadProgress,
    error,
  };
}
