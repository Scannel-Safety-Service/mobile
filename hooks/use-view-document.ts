import { useState } from 'react';
import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '@/store/auth-store';
import { API_URL } from '@/lib/api';

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
      const fileInfo = await FileSystem.getInfoAsync(localTarget);

      // Helper to open natively
      const openNatively = async (uriToOpen: string) => {
        if (Platform.OS === 'android') {
          const cUri = await FileSystem.getContentUriAsync(uriToOpen);
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: cUri,
            flags: 1, // Grant read permission
            type: 'application/pdf',
          });
        } else {
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(uriToOpen, {
              mimeType: 'application/pdf',
              dialogTitle: 'Open Document',
            });
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
