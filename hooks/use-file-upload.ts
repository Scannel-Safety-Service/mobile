import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { API_URL } from '@/lib/api';
import { getAccessToken } from '@/lib/secure-store';
import { DocumentSection } from '@/types/document';
import { getMimeType } from '@/lib/file-utils';

export interface SelectedFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export function useFileUpload() {
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const clearState = useCallback(() => {
    setSelectedFile(null);
    setIsLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  // 1. Pick document from local storage (PDF or images)
  const pickDocument = useCallback(async () => {
    setError(null);
    setSuccess(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || getMimeType(asset.name),
          size: asset.size,
        });
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error picking document:', err);
      setError('Failed to select file from storage.');
      return false;
    }
  }, []);

  // 2. Capture document photo via device camera
  const takePhoto = useCallback(async () => {
    setError(null);
    setSuccess(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError('Camera permission is required to capture documents.');
        return false;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const timestamp = Date.now();
        const filename = `camera_scan_${timestamp}.jpg`;
        
        setSelectedFile({
          uri: asset.uri,
          name: filename,
          type: asset.mimeType || 'image/jpeg',
          size: asset.fileSize,
        });
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error launching camera:', err);
      setError('Failed to open device camera.');
      return false;
    }
  }, []);

  // 3. Upload constructed payload to NestJS backend
  const uploadFile = useCallback(
    async (section: DocumentSection, title: string, categoryId?: string, individualId?: string) => {
      if (!selectedFile) {
        setError('No document selected.');
        return false;
      }

      if (!title.trim()) {
        setError('Document display name is required.');
        return false;
      }

      setIsLoading(true);
      setError(null);
      setSuccess(false);

      try {
        // Get auth token
        const accessToken = await getAccessToken();

        // Build FormData
        const formData = new FormData();

        if (Platform.OS === 'web') {
          // On Web, resolve the local uri/blob to a real Blob object for upload
          const resBlob = await fetch(selectedFile.uri);
          const blob = await resBlob.blob();
          formData.append('file', blob, selectedFile.name);
        } else {
          // On Native, use standard React Native file object shape
          formData.append('file', {
            uri: selectedFile.uri,
            name: selectedFile.name,
            type: selectedFile.type || 'application/octet-stream',
          } as any);
        }

        formData.append('section', section);
        formData.append('title', title.trim());
        if (categoryId) {
          formData.append('categoryId', categoryId);
        }
        if (individualId) {
          formData.append('individualId', individualId);
        }

        // Use raw fetch — DO NOT go through apiRequest because spreading RequestInit
        // into fetchOptions destroys the FormData reference on React Native's JS engine.
        const response = await fetch(`${API_URL}/documents`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'x-client-type': 'mobile',
            // NOTE: Do NOT set Content-Type manually — React Native's fetch
            // will auto-set `multipart/form-data; boundary=...` when given a FormData body
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Server returned an error during upload.');
        }

        setSuccess(true);
        setSelectedFile(null);
        return true;
      } catch (err: any) {
        console.error('Document upload error:', err);
        setError(err.message || 'Upload failed. Please check your network connection.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedFile]
  );

  return {
    selectedFile,
    isLoading,
    error,
    success,
    pickDocument,
    takePhoto,
    uploadFile,
    clearState,
  };
}
