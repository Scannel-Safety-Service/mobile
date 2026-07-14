import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { PREDEFINED_FOLDERS } from '@/constants/folders';
import { DocumentSection } from '@/types/document';
import { Category } from '@/types/category';
import { useDocuments } from '@/hooks/use-documents';
import { useCategories } from '@/hooks/use-categories';
import { DocumentRow } from '@/components/documents/document-row';
import { EmptyState } from '@/components/documents/empty-state';

export default function SectionScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const sectionEnum = section as DocumentSection;
  const folderDef = PREDEFINED_FOLDERS.find((f) => f.key === section);

  // 1. Fetch categories (if folder has subfolders)
  const {
    categories,
    isLoading: isLoadingCategories,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories(folderDef?.hasSubfolders ? sectionEnum : ('' as any));

  // 2. Fetch documents (if folder does NOT have subfolders and is not Training Qualifications)
  const isDirectDocumentSection = folderDef && !folderDef.hasSubfolders && !folderDef.hasIndividuals;
  const {
    documents,
    isLoading: isLoadingDocuments,
    error: documentsError,
    refetch: refetchDocuments,
  } = useDocuments(isDirectDocumentSection ? sectionEnum : ('' as any));

  // Auto-refresh when entering the screen
  useEffect(() => {
    if (folderDef?.hasSubfolders) {
      refetchCategories();
    } else if (isDirectDocumentSection) {
      refetchDocuments();
    }
  }, [section, folderDef]);

  const handleDocumentPress = useCallback((id: string, fileName: string) => {
    router.push({
      pathname: '/(app)/documents/viewer',
      params: { id, fileName },
    });
  }, [router]);

  const handleSubfolderPress = useCallback((categoryId: string, categoryName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(app)/documents/subfolder/[categoryId]',
      params: { categoryId, categoryName, section: sectionEnum },
    });
  }, [router, sectionEnum]);

  const handleUploadPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(app)/documents/upload',
      params: { section: sectionEnum },
    });
  };

  const handleIndividualFoldersPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // In Phase 5, this will navigate to /(app)/individuals stack. For now, redirect to placeholder/prompt
    router.push('/(app)/documents/upload'); // Temporary, fallback to upload or we'll stub it
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
  const renderCategoryItem = useCallback(({ item }: { item: Category }) => {
    return (
      <Pressable
        onPress={() => handleSubfolderPress(item.id, item.name)}
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

  const isLoading = folderDef.hasSubfolders ? isLoadingCategories : isLoadingDocuments;
  const error = folderDef.hasSubfolders ? categoriesError : documentsError;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: folderDef.label }} />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#f43f5e" />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <Pressable
            onPress={folderDef.hasSubfolders ? refetchCategories : refetchDocuments}
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
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title="No Categories Available"
              description={`There are no category subfolders defined for ${folderDef.label} yet.`}
            />
          }
        />
      ) : folderDef.hasIndividuals ? (
        /* Training Qualifications individual view placeholder */
        <View style={styles.centerContainer}>
          <View style={[styles.qualificationIconWrapper, { backgroundColor: isDark ? '#14273b' : '#f0f6fc' }]}>
            <Ionicons name="people-outline" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Individual Folders</Text>
          <Text style={[styles.sectionDesc, { color: colors.muted }]}>
            Create and browse personal folders for certificates & qualifications.
          </Text>
          
          <Pressable
            onPress={handleIndividualFoldersPress}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Manage Folders</Text>
          </Pressable>
        </View>
      ) : (
        /* Direct list of documents */
        <FlatList
          data={documents}
          renderItem={renderDocumentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Ionicons name="cloud-upload" size={24} color="#ffffff" />
        </Pressable>
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
    padding: 32,
    gap: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 80,
  },
  subfolderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
    borderRadius: 16,
    borderCurve: 'continuous',
    marginVertical: 6,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.01)',
  },
  pressed: {
    opacity: 0.85,
  },
  subfolderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  subfolderIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subfolderName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderCurve: 'continuous',
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 18,
    fontWeight: '700',
  },
  sectionDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderCurve: 'continuous',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
  },
});
