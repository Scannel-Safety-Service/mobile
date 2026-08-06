import { useState } from 'react';
import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { getAccessToken } from '@/lib/secure-store';
import { API_URL } from '@/lib/api';
import { cleanFileName } from '@/lib/file-utils';

export function useViewDocument() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const viewDocument = async (fileUrl: string, originalFileName: string) => {
    setIsDownloading(true);
    setDownloadProgress(0);
    setError(null);

    try {
      // Derive storage filename from the fileUrl stored in DB (e.g. "/uploads/1234567890-abc.pdf")
      const storageFileName = fileUrl.split('/').pop() || '';
      const localTarget = `${FileSystem.cacheDirectory}${storageFileName}`;
      const friendlyName = cleanFileName(originalFileName || 'document.pdf');
      const friendlyLocalTarget = `${FileSystem.cacheDirectory}${friendlyName}`;

      // Helper: open the cached file with the native OS viewer
      const openNatively = async (uriToOpen: string) => {
        // Copy to a human-readable filename so the OS viewer title bar shows a clean name
        await FileSystem.copyAsync({ from: uriToOpen, to: friendlyLocalTarget });

        if (Platform.OS === 'android') {
          const contentUri = await FileSystem.getContentUriAsync(friendlyLocalTarget);
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
            type: 'application/pdf',
          });
        } else {
          // iOS: use the native share/QuickLook sheet — blocks until the user dismisses
          const isAvailable = await Sharing.isAvailableAsync();
          if (!isAvailable) {
            throw new Error('Document preview is not available on this device.');
          }
          await Sharing.shareAsync(friendlyLocalTarget, {
            mimeType: 'application/pdf',
            dialogTitle: 'Open Document',
            UTI: 'com.adobe.pdf', // iOS UTI hint for QuickLook to pick the right viewer
          });
          // Cleanup the friendly copy after iOS share sheet closes (shareAsync is blocking)
          try {
            await FileSystem.deleteAsync(friendlyLocalTarget, { idempotent: true });
          } catch {
            // Non-critical — cache will be cleaned up on next app launch
          }
        }
      };

      // --- Cache hit check ---
      // Only use cached file if it exists AND has non-zero size.
      // A 0-byte file means a previous download was interrupted/corrupted.
      const fileInfo = await FileSystem.getInfoAsync(localTarget);
      const cachedSize = (fileInfo as any).size ?? 0;
      const isCacheValid = fileInfo.exists && cachedSize > 0;

      if (isCacheValid) {
        await openNatively(localTarget);
        setIsDownloading(false);
        return;
      }

      // If a corrupt 0-byte file exists, delete it before re-downloading
      if (fileInfo.exists && cachedSize === 0) {
        await FileSystem.deleteAsync(localTarget, { idempotent: true });
      }

      // --- Fresh download ---
      // Always fetch a fresh token from SecureStore (not stale Zustand snapshot).
      // This handles the case where the access token was silently refreshed in the
      // background but the Zustand store hasn't re-rendered this hook yet.
      const freshToken = await getAccessToken();
      if (!freshToken) {
        throw new Error('Your session has expired. Please log in again.');
      }

      const downloadUrl = `${API_URL}/documents/file/${encodeURIComponent(storageFileName)}`;

      const downloadResumable = FileSystem.createDownloadResumable(
        downloadUrl,
        localTarget,
        {
          headers: {
            Authorization: `Bearer ${freshToken}`,
            'x-client-type': 'mobile',
          },
        },
        (progress) => {
          const percent =
            progress.totalBytesExpectedToWrite > 0
              ? progress.totalBytesWritten / progress.totalBytesExpectedToWrite
              : 0;
          setDownloadProgress(isNaN(percent) ? 0 : percent);
        },
      );

      const result = await downloadResumable.downloadAsync();

      if (!result) {
        throw new Error('Download was cancelled or interrupted. Please try again.');
      }

      if (result.status === 401) {
        throw new Error('Access denied. Your session may have expired — please log out and back in.');
      }

      if (result.status === 403) {
        throw new Error('You do not have permission to view this document.');
      }

      if (result.status === 404) {
        throw new Error('Document file not found on the server. It may have been removed.');
      }

      if (result.status !== 200) {
        throw new Error(`Server returned an unexpected error (${result.status}). Please try again.`);
      }

      await openNatively(result.uri);
    } catch (err: any) {
      console.error('[useViewDocument] Error:', err);

      // Distinguish between network-level errors and server errors for clearer UX
      let userMessage = err.message || 'Unable to open document.';
      if (err.message?.includes('Network request failed') || err.message?.includes('fetch')) {
        userMessage = 'No internet connection. Please check your network and try again.';
      }

      setError(userMessage);
      Alert.alert('Could Not Open Document', userMessage);
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
