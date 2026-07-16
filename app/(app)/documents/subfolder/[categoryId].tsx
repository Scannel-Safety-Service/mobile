import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography } from '@/constants/theme';
import { DocumentSection } from '@/types/document';
import { useDocuments } from '@/hooks/use-documents';
import { DocumentRow } from '@/components/documents/document-row';
import { EmptyState } from '@/components/documents/empty-state';
import { useViewDocument } from '@/hooks/use-view-document';
import { BackgroundLogo } from '@/components/background-logo';
import { useShareDocuments } from '@/hooks/use-share-documents';
import { ShareProgressOverlay } from '@/components/documents/share-progress-overlay';

export default function SubfolderScreen() {
  const { categoryId, categoryName, section, isIndividual } = useLocalSearchParams<{
    categoryId: string;
    categoryName: string;
    section: string;
    isIndividual?: string;
  }>();
  
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';

  const { viewDocument, isDownloading, downloadProgress } = useViewDocument();

  const {
    progressState,
    shareFolderDocuments,
    resetProgress,
  } = useShareDocuments();

  const sectionEnum = section as DocumentSection;
  const isInd = isIndividual === 'true';

  // Fetch documents for the specific categoryId (or section documents if it's an individual folder)
  const { documents, isLoading, error, refetch } = useDocuments(sectionEnum, isInd ? undefined : categoryId);

  // Client-side filter to only show documents ending with " - IndividualName"
  const filteredDocuments = isInd
    ? documents.filter((doc) => doc.title && doc.title.endsWith(` - ${categoryName}`))
    : documents;

  const handleShareFolder = useCallback(() => {
    if (!filteredDocuments || filteredDocuments.length === 0) return;
    shareFolderDocuments(filteredDocuments, categoryName || 'Folder');
  }, [filteredDocuments, categoryName, shareFolderDocuments]);


  // Auto-refresh when entering
  useEffect(() => {
    refetch();
  }, [categoryId]);

  const handleDocumentPress = useCallback((id: string) => {
    const doc = documents?.find((d) => d.id === id);
    if (!doc) return;
    viewDocument(doc.fileUrl, doc.originalFileName);
  }, [documents, viewDocument]);

  const handleUploadPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(app)/documents/upload',
      params: { 
        section: sectionEnum, 
        categoryId: isInd ? undefined : categoryId,
        categoryName: isInd ? undefined : categoryName,
        individualName: isInd ? categoryName : undefined,
      },
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackgroundLogo />
      <Stack.Screen
        options={{
          title: categoryName || 'Subfolder',
          headerRight: () => {
            if (!filteredDocuments || filteredDocuments.length === 0) return null;
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
            onPress={refetch}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredDocuments}
          renderItem={renderDocumentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title="Folder is Empty"
              description={isInd ? `There are no documents uploaded for ${categoryName} yet.` : "There are no documents uploaded inside this category subfolder yet."}
            />
          }
        />
      )}

      {/* Floating Action Button for uploading inside this specific category */}
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
  headerShareButton: {
    marginRight: 4,
    padding: 8,
  },
});
