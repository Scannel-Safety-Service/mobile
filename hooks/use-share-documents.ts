import { useState } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';
import { useAuthStore } from '@/store/auth-store';
import { API_URL } from '@/lib/api';
import { Document } from '@/types/document';
import { cleanFileName } from '@/lib/file-utils';
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

  const { accessToken, user } = useAuthStore();
  const companyName = user?.companyName || 'Scannel';

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
      const activeToken = useAuthStore.getState().accessToken;

      if (!fileInfo.exists) {
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

      // Cleanup friendly local copy
      try {
        await FileSystem.deleteAsync(friendlyLocalTarget, { idempotent: true });
      } catch (delErr) {
        console.warn('[Share Hook] Failed to cleanup friendly share file:', delErr);
      }

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
   * Downloads multiple files, compresses them into a ZIP archive, and shares the ZIP file.
   */
  const shareFolderDocuments = async (documents: Document[], folderName: string) => {
    if (!documents || documents.length === 0) {
      Alert.alert('Info', 'There are no documents in this folder to share.');
      return;
    }

    setProgressState({
      status: 'downloading',
      currentFile: 0,
      totalFiles: documents.length,
      progress: 0,
      errorMessage: null,
    });

    try {
      const zip = new JSZip();
      const usedFileNames = new Set<string>();
      let zippedCount = 0;
      let failedFiles: string[] = [];

      const activeToken = useAuthStore.getState().accessToken;

      // Download all files and add them to JSZip
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        const fileUrl = doc.fileUrl;
        const storageFileName = fileUrl.split('/').pop() || '';
        const localTarget = `${FileSystem.cacheDirectory}${storageFileName}`;

        setProgressState((prev) => ({
          ...prev,
          currentFile: i + 1,
          progress: 0,
        }));

        try {
          const fileInfo = await FileSystem.getInfoAsync(localTarget);

          if (!fileInfo.exists) {
            const downloadUrl = `${API_URL}/documents/file/${encodeURIComponent(storageFileName)}`;
            console.log(`[Share Hook] Downloading folder doc ${i + 1}/${documents.length} from:`, downloadUrl, 'Token prefix:', activeToken ? activeToken.substring(0, 15) : 'null');
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
            console.log(`[Share Hook] Folder doc ${i + 1} download status:`, result ? result.status : 'No result', 'URI:', result?.uri);
            if (!result || result.status !== 200) {
              throw new Error(`Status: ${result ? result.status : 'none'}`);
            }
          } else {
            console.log(`[Share Hook] Folder doc ${i + 1} already exists in cache:`, localTarget);
            setProgressState((prev) => ({ ...prev, progress: 1 }));
          }

          // Read file contents as Base64 to add to zip
          const base64Content = await FileSystem.readAsStringAsync(localTarget, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Avoid duplicate file names inside zip by appending a counter
          let zipFileName = cleanFileName(doc.originalFileName || `${doc.title || 'document'}.pdf`);
          if (!zipFileName.toLowerCase().endsWith('.pdf')) {
            zipFileName += '.pdf';
          }

          let finalFileName = zipFileName;
          let counter = 1;
          while (usedFileNames.has(finalFileName)) {
            const extIdx = zipFileName.lastIndexOf('.');
            const baseName = extIdx !== -1 ? zipFileName.substring(0, extIdx) : zipFileName;
            const ext = extIdx !== -1 ? zipFileName.substring(extIdx) : '.pdf';
            finalFileName = `${baseName} (${counter})${ext}`;
            counter++;
          }
          usedFileNames.add(finalFileName);

          zip.file(finalFileName, base64Content, { base64: true });
          zippedCount++;
        } catch (downloadErr) {
          console.warn(`[Share Hook] Skipping file "${doc.title}" due to failure:`, downloadErr);
          failedFiles.push(doc.title || doc.originalFileName || 'Untitled Document');
        }
      }

      if (zippedCount === 0) {
        throw new Error('All documents in this folder failed to download. Please verify the physical files exist on the server.');
      }

      // Generate ZIP archive
      setProgressState((prev) => ({
        ...prev,
        status: 'zipping',
        progress: 0.5,
      }));

      const zipBase64 = await zip.generateAsync({ type: 'base64' });

      // Save ZIP file in cache
      const cleanFolderName = cleanFileName(folderName).replace(/[^a-zA-Z0-9-_]/g, '_');
      const zipFileName = `${cleanFolderName}_Documents.zip`;
      const zipUri = `${FileSystem.cacheDirectory}${zipFileName}`;

      await FileSystem.writeAsStringAsync(zipUri, zipBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share ZIP archive
      setProgressState((prev) => ({
        ...prev,
        status: 'sharing',
        progress: 1,
      }));

      // Build automatic subject line
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

      setProgressState((prev) => ({ ...prev, status: 'success' }));
      
      // If some files failed to download but others succeeded, warn the user about skipped ones
      if (failedFiles.length > 0) {
        Alert.alert(
          'Share Partial Success',
          `Zipped and shared ${zippedCount} documents.\n\nSkipped ${failedFiles.length} missing/failed files:\n- ${failedFiles.join('\n- ')}`
        );
      }
    } catch (err: any) {
      console.error('Error sharing folder documents:', err);
      const errMsg = err.message || 'Unable to create zip and share documents.';
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
