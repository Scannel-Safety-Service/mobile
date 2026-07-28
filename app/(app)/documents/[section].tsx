import React, { useEffect, useCallback, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography } from '@/constants/theme';
import { PREDEFINED_FOLDERS } from '@/constants/folders';
import { DocumentSection } from '@/types/document';
import { Category } from '@/types/category';
import { useDocuments } from '@/hooks/use-documents';
import { useCategories } from '@/hooks/use-categories';
import { useIndividuals, Individual } from '@/hooks/use-individuals';
import { DocumentRow } from '@/components/documents/document-row';
import { EmptyState } from '@/components/documents/empty-state';
import { useViewDocument } from '@/hooks/use-view-document';
import { useAuthStore } from '@/store/auth-store';
import { apiRequest } from '@/lib/api';
import { BackgroundLogo } from '@/components/background-logo';
import { useShareDocuments } from '@/hooks/use-share-documents';
import { ShareProgressOverlay } from '@/components/documents/share-progress-overlay';

export default function SectionScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const { user } = useAuthStore();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newIndividualName, setNewIndividualName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);

  const { viewDocument, isDownloading, downloadProgress } = useViewDocument();

  const {
    progressState,
    shareFolderDocuments,
    resetProgress,
  } = useShareDocuments();

  const sectionEnum = section as DocumentSection;
  const folderDef = PREDEFINED_FOLDERS.find((f) => f.key === section);

  // 1. Fetch categories (if folder has subfolders)
  const {
    categories,
    isLoading: isLoadingCategories,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories(folderDef?.hasSubfolders ? sectionEnum : ('' as any));

  // 2. Fetch individuals (if folder has individuals)
  const {
    individuals,
    isLoading: isLoadingIndividuals,
    error: individualsError,
    refetch: refetchIndividuals,
  } = useIndividuals(!!folderDef?.hasIndividuals);

  // 3. Fetch documents (if folder does NOT have subfolders and is not Training Qualifications)
  const isDirectDocumentSection = folderDef && !folderDef.hasSubfolders && !folderDef.hasIndividuals;
  const {
    documents,
    isLoading: isLoadingDocuments,
    error: documentsError,
    refetch: refetchDocuments,
  } = useDocuments(isDirectDocumentSection ? sectionEnum : ('' as any));

  const handleShareFolder = useCallback(() => {
    if (!documents || documents.length === 0) return;
    shareFolderDocuments(documents, folderDef?.label || 'Documents');
  }, [documents, folderDef, shareFolderDocuments]);

  const handleCreateIndividual = async () => {
    if (!newIndividualName.trim()) {
      Alert.alert('Error', 'Please enter a name for the individual.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest('/individuals', {
        method: 'POST',
        body: JSON.stringify({
          userId: user?.id,
          companyId: user?.companyId,
          name: newIndividualName.trim(),
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Failed to create individual.');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsCreateModalVisible(false);
      setNewIndividualName('');
      refetchIndividuals();
    } catch (err: any) {
      console.error('Error creating individual:', err);
      Alert.alert('Error', err.message || 'Something went wrong while creating the individual.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-refresh when entering the screen
  useEffect(() => {
    if (folderDef?.hasSubfolders) {
      refetchCategories();
    } else if (folderDef?.hasIndividuals) {
      refetchIndividuals();
    } else if (isDirectDocumentSection) {
      refetchDocuments();
    }
  }, [section, folderDef]);

  const handleDocumentPress = useCallback((id: string) => {
    const doc = documents?.find((d) => d.id === id);
    if (!doc) return;
    viewDocument(doc.fileUrl, doc.originalFileName);
  }, [documents, viewDocument]);

  const handleSubfolderPress = useCallback((categoryId: string, categoryName: string, isIndividual = false) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(app)/documents/subfolder/[categoryId]',
      params: { 
        categoryId, 
        categoryName, 
        section: sectionEnum,
        isIndividual: isIndividual ? 'true' : 'false',
      },
    });
  }, [router, sectionEnum]);

  const handleUploadPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(app)/documents/upload',
      params: { section: sectionEnum },
    });
  };

  // Render Document Item
  const renderDocumentItem = useCallback(({ item }: { item: any }) => {
    return (
      <DocumentRow
        id={item.id}
        title={item.title}
        fileName={item.originalFileName}
        createdAt={item.createdAt}
        onPress={handleDocumentPress}
      />
    );
  }, [handleDocumentPress]);

  // Render Category Subfolder Item
  const renderCategoryItem = useCallback(({ item }: { item: Category | Individual }) => {
    const isInd = 'userId' in item;
    return (
      <Pressable
        onPress={() => handleSubfolderPress(item.id, item.name, isInd)}
        style={({ pressed }) => [
          styles.subfolderRow,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.subfolderLeft}>
          <View style={[styles.subfolderIconWrapper, { backgroundColor: isDark ? '#14273b' : '#f0f6fc' }]}>
            <Ionicons name="folder" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.subfolderName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.muted} />
      </Pressable>
    );
  }, [colors, isDark, handleSubfolderPress]);

  if (!folderDef) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Folder not found</Text>
      </View>
    );
  }

  const isLoading = folderDef.hasSubfolders 
    ? isLoadingCategories 
    : folderDef.hasIndividuals 
      ? isLoadingIndividuals 
      : isLoadingDocuments;

  const error = folderDef.hasSubfolders 
    ? categoriesError 
    : folderDef.hasIndividuals 
      ? individualsError 
      : documentsError;

  const refetchData = () => {
    if (folderDef.hasSubfolders) {
      refetchCategories();
    } else if (folderDef.hasIndividuals) {
      refetchIndividuals();
    } else {
      refetchDocuments();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackgroundLogo />
      <Stack.Screen
        options={{
          title: folderDef.label,
          headerRight: () => {
            const canShareFolder = !folderDef.hasSubfolders && !folderDef.hasIndividuals && documents && documents.length > 0;
            if (!canShareFolder) return null;
            return (
              <Pressable
                onPress={handleShareFolder}
                style={({ pressed }) => [
                  styles.headerShareButton,
                  { opacity: pressed ? 0.6 : 1 }
                ]}
              >
                <Ionicons name="share-social-outline" size={22} color={colors.primary} />
              </Pressable>
            );
          }
        }}
      />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#f43f5e" />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <Pressable
            onPress={refetchData}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : folderDef.hasSubfolders ? (
        /* Grid of categories / subfolders */
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 80 + Math.max(insets.bottom, 16) }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title="No Categories Available"
              description={`There are no category subfolders defined for ${folderDef.label} yet.`}
            />
          }
        />
      ) : folderDef.hasIndividuals ? (
        /* Grid of individuals / subfolders */
        <FlatList
          data={individuals}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 80 + Math.max(insets.bottom, 16) }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title="No Folders Available"
              description={`There are no individual folders created for ${folderDef.label} yet.`}
            />
          }
        />
      ) : (
        /* Direct list of documents */
        <FlatList
          data={documents}
          renderItem={renderDocumentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 80 + Math.max(insets.bottom, 16) }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title={`No ${folderDef.label}`}
              description={`There are no safety documents uploaded under ${folderDef.label} yet.`}
            />
          }
        />
      )}

      {/* Floating Upload Trigger (Visible for direct documents and subfolders, or qualifications) */}
      {!folderDef.hasSubfolders && !folderDef.hasIndividuals && (
        <Pressable
          onPress={handleUploadPress}
          style={({ pressed }) => [
            styles.fab,
            {
              bottom: Math.max(insets.bottom, 16) + 16,
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Ionicons name="cloud-upload" size={24} color="#ffffff" />
        </Pressable>
      )}

      {/* Floating Add Individual Trigger (Visible for training qualifications where individuals are listed) */}
      {folderDef.hasIndividuals && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsCreateModalVisible(true);
          }}
          style={({ pressed }) => [
            styles.fab,
            {
              bottom: Math.max(insets.bottom, 16) + 16,
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Ionicons name="person-add" size={24} color="#ffffff" />
        </Pressable>
      )}

      {/* Create Individual Modal */}
      <Modal
        visible={isCreateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsCreateModalVisible(false);
          setNewIndividualName('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconCircle, { backgroundColor: isDark ? 'rgba(86,185,255,0.1)' : 'rgba(21,91,157,0.06)' }]}>
                <Ionicons name="person-add-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Individual</Text>
            </View>

            <Text style={[styles.modalDescription, { color: colors.muted }]}>
              Create a profile folder for an individual to store their training and qualifications.
            </Text>

            <View style={styles.modalInputGroup}>
              <Text style={[styles.modalInputLabel, { color: colors.muted }]}>NAME</Text>
              <View style={[
                styles.modalInputWrapper,
                {
                  backgroundColor: isDark ? 'rgba(4,14,26,0.6)' : 'rgba(244,248,252,0.9)',
                  borderColor: isNameFocused ? colors.primary : colors.cardBorder,
                  opacity: isSubmitting ? 0.6 : 1,
                }
              ]}>
                <TextInput
                  style={[styles.modalInput, { color: colors.text }]}
                  placeholder="Enter individual's full name"
                  placeholderTextColor={colors.muted}
                  value={newIndividualName}
                  onChangeText={setNewIndividualName}
                  onFocus={() => setIsNameFocused(true)}
                  onBlur={() => setIsNameFocused(false)}
                  autoCapitalize="words"
                  autoFocus
                  editable={!isSubmitting}
                />
              </View>
            </View>

            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => {
                  setIsCreateModalVisible(false);
                  setNewIndividualName('');
                }}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.modalCancelButton,
                  { borderColor: colors.cardBorder },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleCreateIndividual}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.modalSubmitButton,
                  { backgroundColor: colors.primary },
                  pressed && styles.pressed,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Create</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {isDownloading && (
        <View style={styles.downloadOverlay}>
          <View style={[styles.downloadCard, { backgroundColor: isDark ? 'rgba(8,23,41,0.95)' : 'rgba(255,255,255,0.95)', borderColor: colors.cardBorder, borderWidth: 1 }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.downloadText, { color: colors.text }]}>
              Opening Document...
            </Text>
            {downloadProgress > 0 && (
              <Text style={[styles.downloadProgressText, { color: colors.muted }]}>
                {Math.round(downloadProgress * 100)}%
              </Text>
            )}
          </View>
        </View>
      )}

      <ShareProgressOverlay progressState={progressState} onClose={resetProgress} />
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
    padding: 32,
    gap: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100,
    gap: 2,
  },
  subfolderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 18,
    borderCurve: 'continuous',
    marginVertical: 5,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  subfolderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  subfolderIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subfolderName: {
    ...Typography.subheadline,
    fontWeight: '600',
    flex: 1,
  },
  errorText: {
    ...Typography.subheadline,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    borderCurve: 'continuous',
    minHeight: 48,
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(21, 91, 157, 0.2)',
  },
  retryText: {
    color: '#ffffff',
    ...Typography.buttonSmall,
  },
  qualificationIconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeading: {
    ...Typography.title3,
    fontWeight: '700',
  },
  sectionDesc: {
    ...Typography.footnote,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    borderCurve: 'continuous',
    minHeight: 48,
    boxShadow: '0 4px 12px rgba(21, 91, 157, 0.2)',
  },
  primaryButtonText: {
    color: '#ffffff',
    ...Typography.buttonSmall,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 20,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    boxShadow: '0 6px 20px rgba(21, 91, 157, 0.3)',
  },
  downloadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  downloadCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    gap: 12,
    elevation: 5,
    minWidth: 200,
  },
  downloadText: {
    ...Typography.subheadline,
    fontWeight: '600',
  },
  downloadProgressText: {
    ...Typography.footnote,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 24,
    gap: 16,
    elevation: 5,
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    ...Typography.headline,
    fontWeight: '700',
  },
  modalDescription: {
    ...Typography.footnote,
    lineHeight: 18,
  },
  modalInputGroup: {
    gap: 8,
  },
  modalInputLabel: {
    ...Typography.overline,
    marginLeft: 4,
  },
  modalInputWrapper: {
    borderWidth: 1,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: 12,
    height: 48,
    justifyContent: 'center',
  },
  modalInput: {
    height: '100%',
    ...Typography.callout,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    ...Typography.buttonSmall,
    fontWeight: '600',
  },
  modalSubmitButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#ffffff',
    ...Typography.buttonSmall,
    fontWeight: '600',
  },
  headerShareButton: {
    marginRight: 4,
    padding: 8,
  },
});
