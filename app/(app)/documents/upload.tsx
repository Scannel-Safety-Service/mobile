import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { PREDEFINED_FOLDERS } from '@/constants/folders';
import { DocumentSection } from '@/types/document';
import { useFileUpload } from '@/hooks/use-file-upload';
import { formatBytes } from '@/lib/file-utils';
import { useDocumentsStore } from '@/store/documents-store';

export default function DocumentUploadScreen() {
  const { section, categoryId, categoryName } = useLocalSearchParams<{
    section: string;
    categoryId?: string;
    categoryName?: string;
  }>();

  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const sectionEnum = section as DocumentSection;
  const folderDef = PREDEFINED_FOLDERS.find((f) => f.key === section);

  const {
    selectedFile,
    isLoading,
    error,
    success,
    pickDocument,
    takePhoto,
    uploadFile,
    clearState,
  } = useFileUpload();

  const [documentTitle, setDocumentTitle] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Auto-fill document title with the filename (without extension) when a file is selected
  useEffect(() => {
    if (selectedFile) {
      const baseName = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name;
      // Convert underscores/dashes to spaces for a clean initial title
      const cleanTitle = baseName.replace(/[_-]/g, ' ');
      setDocumentTitle(cleanTitle);
      setLocalError(null);
    } else {
      setDocumentTitle('');
    }
  }, [selectedFile]);

  // Handle successful upload: trigger store refresh and go back
  useEffect(() => {
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Trigger background reload in the Zustand store so the document appears instantly in lists
      const { fetchDocuments } = useDocumentsStore.getState();
      fetchDocuments(sectionEnum, categoryId);

      // Back navigation after short delay to show success UX
      const timer = setTimeout(() => {
        clearState();
        router.back();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [success, sectionEnum, categoryId, router, clearState]);

  const handleUploadSubmit = async () => {
    if (isLoading) return;

    if (!selectedFile) {
      setLocalError('Please select a file or capture a photo first.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!documentTitle.trim()) {
      setLocalError('Document title is required.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLocalError(null);
    const uploaded = await uploadFile(sectionEnum, documentTitle.trim(), categoryId);
    if (!uploaded) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Stack.Screen options={{ title: 'Upload Document' }} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Destination Info */}
        <View style={styles.headerInfo}>
          <Text style={[styles.destinationLabel, { color: colors.muted }]}>UPLOADING TO</Text>
          <Text style={[styles.destinationTitle, { color: colors.text }]}>
            {folderDef?.label} {categoryName ? `› ${categoryName}` : ''}
          </Text>
        </View>

        {success ? (
          /* Success Screen State */
          <View style={styles.successContainer}>
            <View style={[styles.successCircle, { backgroundColor: isDark ? '#142a1e' : '#ecfdf5' }]}>
              <Ionicons name="checkmark-circle" size={56} color="#10b981" />
            </View>
            <Text style={[styles.successTitle, { color: colors.text }]}>Upload Successful</Text>
            <Text style={[styles.successDesc, { color: colors.muted }]}>
              Your document has been stored securely and folder stats will update shortly.
            </Text>
          </View>
        ) : (
          /* Form Content State */
          <View style={styles.formContainer}>
            
            {/* File selection slot */}
            {!selectedFile ? (
              <View style={[styles.dashedBox, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}>
                <Ionicons name="cloud-upload-outline" size={48} color={colors.muted} />
                <Text style={[styles.dashedTitle, { color: colors.text }]}>Select Document Source</Text>
                <Text style={[styles.dashedDesc, { color: colors.muted }]}>
                  Upload PDF reports or take a quick photo of certificates.
                </Text>

                <View style={styles.pickerRow}>
                  {/* Gallery/Files */}
                  <Pressable
                    onPress={pickDocument}
                    style={({ pressed }) => [
                      styles.pickerButton,
                      { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
                    ]}
                  >
                    <Ionicons name="documents-outline" size={18} color="#ffffff" />
                    <Text style={styles.pickerButtonText}>Files / PDF</Text>
                  </Pressable>

                  {/* Camera */}
                  <Pressable
                    onPress={takePhoto}
                    style={({ pressed }) => [
                      styles.pickerButton,
                      { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
                    ]}
                  >
                    <Ionicons name="camera-outline" size={18} color="#ffffff" />
                    <Text style={styles.pickerButtonText}>Use Camera</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* Selected File Details */
              <View style={[styles.fileCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={styles.fileRow}>
                  <View style={[styles.fileIconBox, { backgroundColor: isDark ? '#3d1619' : '#fef2f2' }]}>
                    <Ionicons
                      name={selectedFile.type.includes('pdf') ? 'document-text' : 'image'}
                      size={28}
                      color="#ef4444"
                    />
                  </View>
                  <View style={styles.fileTextDetails}>
                    <Text style={[styles.fileNameText, { color: colors.text }]} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    <Text style={[styles.fileSizeText, { color: colors.muted }]}>
                      {selectedFile.size ? formatBytes(selectedFile.size) : 'File selected'}
                    </Text>
                  </View>
                  <Pressable onPress={clearState} style={styles.removeButton} hitSlop={12}>
                    <Ionicons name="close-circle" size={22} color={colors.muted} />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Document display name input fields */}
            {selectedFile && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>DOCUMENT DISPLAY NAME</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark ? '#0b1624' : '#ffffff',
                      borderColor: displayError ? '#f43f5e' : colors.cardBorder,
                    },
                  ]}
                >
                  <Ionicons name="create-outline" size={20} color={colors.icon} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter document title"
                    placeholderTextColor={colors.muted}
                    value={documentTitle}
                    onChangeText={(text) => {
                      setDocumentTitle(text);
                      if (localError) setLocalError(null);
                    }}
                    editable={!isLoading}
                    autoCapitalize="words"
                    returnKeyType="done"
                    onSubmitEditing={handleUploadSubmit}
                  />
                </View>
              </View>
            )}

            {/* Error alerts */}
            <View style={styles.errorSlot}>
              {displayError ? (
                <View style={[styles.errorContainer, { backgroundColor: isDark ? '#3a0f14' : '#fdf2f2' }]}>
                  <Ionicons name="alert-circle" size={18} color="#f43f5e" />
                  <Text style={styles.errorText}>{displayError}</Text>
                </View>
              ) : null}
            </View>

            {/* Submit upload trigger */}
            {selectedFile && (
              <Pressable
                onPress={isLoading ? undefined : handleUploadSubmit}
                style={({ pressed }) => [
                  styles.submitButton,
                  {
                    backgroundColor: isLoading ? colors.secondary : colors.primary,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                {isLoading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text style={styles.submitButtonText}>Uploading document...</Text>
                  </View>
                ) : (
                  <View style={styles.loadingRow}>
                    <Ionicons name="cloud-upload" size={20} color="#ffffff" />
                    <Text style={styles.submitButtonText}>Upload Document</Text>
                  </View>
                )}
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    gap: 24,
  },
  headerInfo: {
    gap: 4,
  },
  destinationLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  destinationTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  successCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  successDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  formContainer: {
    gap: 20,
  },
  dashedBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  dashedTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  dashedDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderCurve: 'continuous',
  },
  pickerButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  fileCard: {
    borderWidth: 1,
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 16,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileIconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileTextDetails: {
    flex: 1,
    gap: 4,
  },
  fileNameText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fileSizeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  removeButton: {
    padding: 4,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  errorSlot: {
    minHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  submitButton: {
    height: 54,
    borderRadius: 27,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
