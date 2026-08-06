import { useState } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getAccessToken } from '@/lib/secure-store';
import { API_URL } from '@/lib/api';
import { Document } from '@/types/document';
import { cleanFileName } from '@/lib/file-utils';
import { useAuthStore } from '@/store/auth-store';
let MailComposer: any = null;
try {
  MailComposer = require('expo-mail-composer');
} catch (e) {
  console.warn('[Share Hook] expo-mail-composer is not available. Native mail composition will be disabled, falling back to expo-sharing.', e);
}

export interface ShareProgress {
  status: 'idle' | 'downloading' | 'zipping' | 'sharing' | 'success' | 'error';
  currentFile: number;
  totalFiles: number;
  progress: number; // 0 to 1
  errorMessage: string | null;
}

export function useShareDocuments() {
  const [progressState, setProgressState] = useState<ShareProgress>({
    status: 'idle',
    currentFile: 0,
    totalFiles: 0,
    progress: 0,
    errorMessage: null,
  });

  const companyName = useAuthStore((s) => s.user?.companyName) || 'Scannel';

  const resetProgress = () => {
    setProgressState({
      status: 'idle',
      currentFile: 0,
      totalFiles: 0,
      progress: 0,
      errorMessage: null,
    });
  };

  /**
   * Share a single document directly as a PDF
   */
  const shareSingleDocument = async (doc: Document) => {
    setProgressState({
      status: 'downloading',
      currentFile: 1,
      totalFiles: 1,
      progress: 0,
      errorMessage: null,
    });

    try {
      const fileUrl = doc.fileUrl;
      const originalFileName = doc.originalFileName || 'document.pdf';
      const storageFileName = fileUrl.split('/').pop() || '';
      const localTarget = `${FileSystem.cacheDirectory}${storageFileName}`;

      const friendlyName = cleanFileName(originalFileName);
      const friendlyLocalTarget = `${FileSystem.cacheDirectory}${friendlyName}`;

      const fileInfo = await FileSystem.getInfoAsync(localTarget);
      const cachedSize = (fileInfo as any).size ?? 0;

      // Always fetch a fresh token — avoids stale Zustand snapshot after silent refresh
      const activeToken = await getAccessToken();
      if (!activeToken) {
        throw new Error('Your session has expired. Please log in again.');
      }

      if (!fileInfo.exists || cachedSize === 0) {
        const downloadUrl = `${API_URL}/documents/file/${encodeURIComponent(storageFileName)}`;
        console.log('[Share Hook] Downloading single doc from:', downloadUrl, 'Token prefix:', activeToken ? activeToken.substring(0, 15) : 'null');
        const downloadResumable = FileSystem.createDownloadResumable(
          downloadUrl,
          localTarget,
          {
            headers: {
              Authorization: `Bearer ${activeToken}`,
              'x-client-type': 'mobile',
            },
          },
          (progress) => {
            const percent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
            setProgressState((prev) => ({
              ...prev,
              progress: isNaN(percent) ? 0 : percent,
            }));
          }
        );

        const result = await downloadResumable.downloadAsync();
        console.log('[Share Hook] Single doc download status:', result ? result.status : 'No result', 'URI:', result?.uri);
        if (!result || result.status !== 200) {
          throw new Error(`Failed to download PDF document from server (Status: ${result ? result.status : 'none'}). Please verify the physical file exists on the server.`);
        }
      } else {
        console.log('[Share Hook] Single doc already exists in cache:', localTarget);
        setProgressState((prev) => ({ ...prev, progress: 1 }));
      }

      // Copy localTarget to friendlyLocalTarget so sharing dialogue shows decoded, clean friendly filename
      await FileSystem.copyAsync({
        from: localTarget,
        to: friendlyLocalTarget,
      });

      setProgressState((prev) => ({ ...prev, status: 'sharing' }));

      // Format subject line/title
      const subject = `${companyName} Document: ${doc.title || friendlyName}`;
      
      const isMailAvailable = MailComposer ? await MailComposer.isAvailableAsync() : false;
      if (isMailAvailable && MailComposer) {
        await MailComposer.composeAsync({
          subject,
          body: `Hello,\n\nPlease find attached the requested safety document: "${doc.title || friendlyName}".\n\nSent via Scannel Safety Tracker.`,
          attachments: [friendlyLocalTarget],
        });
      } else {
        // Fallback to native sharing sheet
        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (!isSharingAvailable) {
          throw new Error('Sharing is not available on this device');
        }

        await Sharing.shareAsync(friendlyLocalTarget, {
          mimeType: 'application/pdf',
          dialogTitle: subject,
        });
      }

      // Note: Do NOT immediately delete friendlyLocalTarget here so background mail clients (like Gmail) can finish sending.

      setProgressState((prev) => ({ ...prev, status: 'success' }));
    } catch (err: any) {
      console.error('Error sharing single document:', err);
      const errMsg = err.message || 'Unable to share document.';
      setProgressState((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: errMsg,
      }));
      Alert.alert('Error', errMsg);
    }
  };

  /**
   * Triggers server-side ZIP generation using a standard fetch POST request,
   * writes the binary response to the cache directory, then presents the native share dialogue.
   *
   * NOTE: expo-file-system createDownloadResumable does NOT support POST with a JSON body.
   * We use fetch() to read the binary ZIP as base64, then write it to cache via FileSystem.
   */
  const shareFolderDocuments = async (documents: Document[], folderName: string) => {
    if (!documents || documents.length === 0) {
      Alert.alert('Info', 'There are no documents in this folder to share.');
      return;
    }

    const documentIds = documents.map((d) => d.id).filter(Boolean);
    if (documentIds.length === 0) {
      Alert.alert('Info', 'No valid documents found to share.');
      return;
    }

    setProgressState({
      status: 'downloading',
      currentFile: 1,
      totalFiles: 1,
      progress: 0.05,
      errorMessage: null,
    });

    try {
      // Always fetch a fresh token — avoids stale Zustand snapshot after silent refresh
      const activeToken = await getAccessToken();
      if (!activeToken) {
        throw new Error('Your session has expired. Please log in again.');
      }
      const cleanFolderName = cleanFileName(folderName).replace(/[^a-zA-Z0-9-_]/g, '_');
      const zipFileName = `${cleanFolderName}_Documents.zip`;
      const zipUri = `${FileSystem.cacheDirectory}${zipFileName}`;

      const downloadUrl = `${API_URL}/documents/export-zip`;
      console.log('[Share Hook] POSTing to backend for ZIP:', downloadUrl, 'IDs:', documentIds.length);

      // Step 1: POST to backend and read ZIP as base64
      setProgressState((prev) => ({ ...prev, progress: 0.1 }));

      const response = await fetch(downloadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/zip, application/octet-stream, */*',
          'Authorization': `Bearer ${activeToken}`,
          'x-client-type': 'mobile',
        },
        body: JSON.stringify({ documentIds, folderName }),
      });

      console.log('[Share Hook] ZIP response status:', response.status);

      if (!response.ok) {
        let errDetail = '';
        try {
          const errJson = await response.json();
          errDetail = errJson.message || '';
        } catch {
          errDetail = await response.text().catch(() => '');
        }
        throw new Error(
          `Server returned ${response.status}${errDetail ? ': ' + errDetail : ''}.`
        );
      }

      setProgressState((prev) => ({ ...prev, progress: 0.4 }));

      // Step 2: Read the response as an ArrayBuffer and convert to base64
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      setProgressState((prev) => ({ ...prev, progress: 0.65 }));

      // Convert Uint8Array → binary string → base64
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
      }
      const base64Data = btoa(binary);

      setProgressState((prev) => ({ ...prev, progress: 0.8 }));

      // Step 3: Write base64 data to the cache as a binary file
      await FileSystem.writeAsStringAsync(zipUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('[Share Hook] ZIP written to cache:', zipUri);

      setProgressState((prev) => ({
        ...prev,
        status: 'sharing',
        progress: 1,
      }));

      const today = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date());

      const subject = `${companyName}: ${folderName} Documents — ${today}`;

      const isMailAvailable = MailComposer ? await MailComposer.isAvailableAsync() : false;
      if (isMailAvailable && MailComposer) {
        await MailComposer.composeAsync({
          subject,
          body: `Hello,\n\nPlease find attached the requested safety documents from folder "${folderName}", compressed into a ZIP archive.\n\nSent via Scannel Safety Tracker.`,
          attachments: [zipUri],
        });
      } else {
        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (!isSharingAvailable) {
          throw new Error('Sharing is not available on this device');
        }

        await Sharing.shareAsync(zipUri, {
          mimeType: 'application/zip',
          dialogTitle: subject,
        });
      }

      // Note: Do NOT immediately delete the zipUri here. Native mail clients like Gmail
      // read the attachment asynchronously in the background when the user taps "Send".
      // Deleting the file immediately causes Gmail sending to fail and get stuck in Outbox.

      setProgressState((prev) => ({ ...prev, status: 'success' }));
    } catch (err: any) {
      console.error('Error sharing folder documents:', err);
      const errMsg = err.message || 'Unable to download zip and share documents.';
      setProgressState((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: errMsg,
      }));
      Alert.alert('Error', errMsg);
    }
  };

  return {
    progressState,
    shareSingleDocument,
    shareFolderDocuments,
    resetProgress,
  };
}
