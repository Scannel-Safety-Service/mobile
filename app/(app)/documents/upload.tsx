import React, { useState, useEffect, useRef } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography } from '@/constants/theme';
import { PREDEFINED_FOLDERS } from '@/constants/folders';
import { DocumentSection } from '@/types/document';
import { useFileUpload } from '@/hooks/use-file-upload';
import { formatBytes } from '@/lib/file-utils';
import { useDocumentsStore } from '@/store/documents-store';
import { useIndividuals } from '@/hooks/use-individuals';
import { LinearGradient } from 'expo-linear-gradient';
import { BackgroundLogo } from '@/components/background-logo';

export default function DocumentUploadScreen() {
  const { section, categoryId, categoryName, individualName, individualId } = useLocalSearchParams<{
    section: string;
    categoryId?: string;
    categoryName?: string;
    individualName?: string;
    individualId?: string;
  }>();

  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const sectionEnum = section as DocumentSection;
  const folderDef = PREDEFINED_FOLDERS.find((f) => f.key === section);
  const isTrainingQualifications = sectionEnum === DocumentSection.TRAINING_QUALIFICATIONS;

  // Fetch individuals if in TRAINING_QUALIFICATIONS section and no pre-defined individualName
  const {
    individuals,
    isLoading: isLoadingIndividuals,
  } = useIndividuals(isTrainingQualifications && !individualName && !individualId);

  const [selectedIndividualId, setSelectedIndividualId] = useState<string | undefined>(undefined);
  const [selectedIndividualName, setSelectedIndividualName] = useState<string | undefined>(undefined);
  const [showDropdown, setShowDropdown] = useState(false);

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
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const titleInputRef = useRef<TextInput>(null);

  // Auto-fill document title with the filename (without extension) when a file is selected and auto-focus input
  useEffect(() => {
    if (selectedFile) {
      const baseName = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name;
      // Convert underscores/dashes to spaces for a clean initial title
      const cleanTitle = baseName.replace(/[_-]/g, ' ');
      setDocumentTitle(cleanTitle);
      setLocalError(null);

      // Auto-activate & focus input field after OS modal picker dismissal completes (~350ms)
      const focusTimer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 350);

      return () => clearTimeout(focusTimer);
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

    const activeIndividualName = individualName || selectedIndividualName;
    const activeIndividualId = individualId || selectedIndividualId;

    if (isTrainingQualifications && (!activeIndividualName || !activeIndividualId)) {
      setLocalError('Please select an individual.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLocalError(null);

    const finalTitle = documentTitle.trim();

    const uploaded = await uploadFile(sectionEnum, finalTitle, categoryId, activeIndividualId);
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
      <BackgroundLogo />
      <Stack.Screen options={{ title: 'Upload Document' }} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + Math.max(insets.bottom, 16) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Destination Info */}
        <View style={styles.headerInfo}>
          <Text style={[styles.destinationLabel, { color: colors.muted }]}>UPLOADING TO</Text>
          <Text style={[styles.destinationTitle, { color: colors.text }]}>
            {folderDef?.label} {categoryName ? `› ${categoryName}` : (individualName || selectedIndividualName) ? `› ${individualName || selectedIndividualName}` : ''}
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
              <View style={[styles.dashedBox, { borderColor: colors.cardBorder, backgroundColor: isDark ? 'rgba(8,23,41,0.5)' : 'rgba(255,255,255,0.7)' }]}>
                <View style={[styles.dashedIconCircle, { backgroundColor: isDark ? 'rgba(86,185,255,0.08)' : 'rgba(21,91,157,0.05)' }]}>
                  <Ionicons name="cloud-upload-outline" size={32} color={colors.primary} />
                </View>
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
                      {
                        opacity: pressed ? 0.9 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={isDark ? ['#155B9D', '#1F6CB0'] : ['#155B9D', '#2B7CC1']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.pickerGradient}
                    >
                      <Ionicons name="documents-outline" size={18} color="#ffffff" />
                      <Text style={styles.pickerButtonText}>Files / PDF</Text>
                    </LinearGradient>
                  </Pressable>

                  {/* Camera */}
                  <Pressable
                    onPress={takePhoto}
                    style={({ pressed }) => [
                      styles.pickerButton,
                      {
                        opacity: pressed ? 0.9 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={isDark ? ['#2DA7FF', '#155B9D'] : ['#2DA7FF', '#1F6CB0']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.pickerGradient}
                    >
                      <Ionicons name="camera-outline" size={18} color="#ffffff" />
                      <Text style={styles.pickerButtonText}>Use Camera</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* Selected File Details */
              <View style={[styles.fileCard, { backgroundColor: isDark ? 'rgba(8,23,41,0.7)' : 'rgba(255,255,255,0.85)', borderColor: colors.cardBorder }]}>
                <View style={styles.fileRow}>
                  <View style={[styles.fileIconBox, { backgroundColor: isDark ? 'rgba(61,22,25,0.6)' : '#fef2f2' }]}>
                    <Ionicons
                      name={selectedFile.type.includes('pdf') ? 'document-text' : 'image'}
                      size={24}
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

            {/* Individual select dropdown (for Training Qualifications when individualName/Id is not pre-selected) */}
            {selectedFile && isTrainingQualifications && (!individualName || !individualId) && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>SELECT INDIVIDUAL</Text>
                <Pressable
                  onPress={() => setShowDropdown(!showDropdown)}
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark ? 'rgba(4,14,26,0.6)' : 'rgba(244,248,252,0.9)',
                      borderColor: showDropdown ? colors.primary : colors.cardBorder,
                      opacity: isLoading ? 0.6 : 1,
                    },
                  ]}
                  disabled={isLoading}
                >
                  <View style={[styles.inputIconCircle, { backgroundColor: isDark ? 'rgba(86,185,255,0.1)' : 'rgba(21,91,157,0.06)' }]}>
                    <Ionicons name="person-outline" size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.inputText, { color: selectedIndividualName ? colors.text : colors.muted, flex: 1 }]}>
                    {selectedIndividualName || 'Select an individual...'}
                  </Text>
                  <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
                </Pressable>

                {showDropdown && (
                  <View style={[styles.dropdownContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    {individuals.length === 0 ? (
                      <Text style={[styles.dropdownItemText, { color: colors.muted, padding: 12 }]}>
                        No individuals found
                      </Text>
                    ) : (
                      individuals.map((ind) => (
                        <Pressable
                          key={ind.id}
                          onPress={() => {
                            setSelectedIndividualId(ind.id);
                            setSelectedIndividualName(ind.name);
                            setShowDropdown(false);
                            if (localError) setLocalError(null);
                          }}
                          style={({ pressed }) => [
                            styles.dropdownItem,
                            { borderBottomColor: colors.cardBorder },
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text style={[styles.dropdownItemText, { color: colors.text }]}>{ind.name}</Text>
                        </Pressable>
                      ))
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Document display name input fields */}
            {selectedFile && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>DOCUMENT DISPLAY NAME</Text>

                <Pressable
                  onPress={() => titleInputRef.current?.focus()}
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark
                        ? (isTitleFocused ? '#112b46' : '#0e243a')
                        : '#ffffff',
                      borderColor: displayError
                        ? '#f43f5e'
                        : isTitleFocused
                          ? colors.primary
                          : isDark ? 'rgba(86, 185, 255, 0.5)' : 'rgba(21, 91, 157, 0.45)',
                      borderWidth: isTitleFocused ? 2 : 1.5,
                      boxShadow: isTitleFocused
                        ? `0 4px 14px ${isDark ? 'rgba(86, 185, 255, 0.25)' : 'rgba(21, 91, 157, 0.2)'}`
                        : `0 2px 8px ${isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(21, 91, 157, 0.08)'}`,
                      opacity: isLoading ? 0.6 : 1,
                    },
                  ]}
                >
                  <View style={[styles.inputIconCircle, { backgroundColor: isTitleFocused ? (isDark ? 'rgba(86, 185, 255, 0.22)' : 'rgba(21, 91, 157, 0.15)') : (isDark ? 'rgba(86, 185, 255, 0.12)' : 'rgba(21, 91, 157, 0.08)') }]}>
                    <Ionicons name="document-text" size={18} color={colors.primary} />
                  </View>

                  <TextInput
                    ref={titleInputRef}
                    autoFocus={true}
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter document title"
                    placeholderTextColor={colors.muted}
                    value={documentTitle}
                    onChangeText={(text) => {
                      setDocumentTitle(text);
                      if (localError) setLocalError(null);
                    }}
                    onFocus={() => setIsTitleFocused(true)}
                    onBlur={() => setIsTitleFocused(false)}
                    editable={!isLoading}
                    autoCapitalize="words"
                    returnKeyType="done"
                    selectionColor={colors.primary}
                    cursorColor={colors.primary}
                    onSubmitEditing={handleUploadSubmit}
                  />

                  {documentTitle.length > 0 && isTitleFocused ? (
                    <Pressable
                      onPress={() => setDocumentTitle('')}
                      style={styles.clearButton}
                      hitSlop={10}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.muted} />
                    </Pressable>
                  ) : (
                    <View style={styles.editIconBadge}>
                      <Ionicons name="pencil-outline" size={16} color={isTitleFocused ? colors.primary : colors.muted} />
                    </View>
                  )}
                </Pressable>
              </View>
            )}

            {/* Error alerts */}
            <View style={styles.errorSlot}>
              {displayError ? (
                <View style={[styles.errorContainer, { backgroundColor: isDark ? 'rgba(58,15,20,0.6)' : 'rgba(253,242,242,0.9)' }]}>
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
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.985 : 1 }],
                  },
                ]}
              >
                <LinearGradient
                  colors={isLoading
                    ? [colors.secondary, colors.secondary]
                    : [colors.primary, isDark ? '#3d8fd4' : '#1a6db8']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitGradient}
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
                </LinearGradient>
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
    gap: 6,
  },
  destinationLabel: {
    ...Typography.overline,
    fontSize: 10,
  },
  destinationTitle: {
    ...Typography.title3,
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
    ...Typography.title3,
    fontWeight: '700',
  },
  successDesc: {
    ...Typography.subheadline,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  formContainer: {
    gap: 20,
  },
  dashedBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  dashedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashedTitle: {
    ...Typography.headline,
  },
  dashedDesc: {
    ...Typography.footnote,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderCurve: 'continuous',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(21, 91, 157, 0.15)',
  },
  pickerGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pickerButtonText: {
    color: '#ffffff',
    ...Typography.buttonSmall,
  },
  fileCard: {
    borderWidth: 1,
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: 16,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  fileIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileTextDetails: {
    flex: 1,
    gap: 4,
  },
  fileNameText: {
    ...Typography.subheadline,
    fontWeight: '600',
  },
  fileSizeText: {
    ...Typography.footnote,
    fontWeight: '500',
  },
  removeButton: {
    padding: 8,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    ...Typography.overline,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: 6,
    paddingVertical: 6,
    height: 56,
    gap: 10,
  },
  inputIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    ...Typography.callout,
  },
  clearButton: {
    padding: 6,
    marginRight: 4,
  },
  editIconBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  errorSlot: {
    minHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  errorText: {
    color: '#f43f5e',
    ...Typography.footnote,
    fontWeight: '500',
    flex: 1,
  },
  submitButton: {
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(21, 91, 157, 0.25)',
  },
  submitGradient: {
    height: 56,
    borderRadius: 16,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    ...Typography.headline,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputText: {
    ...Typography.callout,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderRadius: 16,
    borderCurve: 'continuous',
    marginTop: 6,
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    minHeight: 52,
    justifyContent: 'center',
  },
  dropdownItemText: {
    ...Typography.callout,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.85,
  },
});
