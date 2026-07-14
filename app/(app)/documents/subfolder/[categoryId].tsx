import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { DocumentSection } from '@/types/document';
import { useDocuments } from '@/hooks/use-documents';
import { DocumentRow } from '@/components/documents/document-row';
import { EmptyState } from '@/components/documents/empty-state';

export default function SubfolderScreen() {
  const { categoryId, categoryName, section, isIndividual } = useLocalSearchParams<{
    categoryId: string;
    categoryName: string;
    section: string;
    isIndividual?: string;
  }>();
  
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const sectionEnum = section as DocumentSection;
  const isInd = isIndividual === 'true';

  // Fetch documents for the specific categoryId (or section documents if it's an individual folder)
  const { documents, isLoading, error, refetch } = useDocuments(sectionEnum, isInd ? undefined : categoryId);

  // Client-side filter to only show documents ending with " - IndividualName"
  const filteredDocuments = isInd
    ? documents.filter((doc) => doc.title && doc.title.endsWith(` - ${categoryName}`))
    : documents;

  // Auto-refresh when entering
  useEffect(() => {
    refetch();
  }, [categoryId]);

  const handleDocumentPress = useCallback((id: string, fileName: string) => {
    router.push({
      pathname: '/(app)/documents/viewer',
      params: { id, fileName },
    });
  }, [router]);

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
      <Stack.Screen options={{ title: categoryName || 'Subfolder' }} />

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
