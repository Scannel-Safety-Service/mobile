import React, { useEffect, useCallback, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography } from '@/constants/theme';
import { DocumentRow } from '@/components/documents/document-row';
import { EmptyState } from '@/components/documents/empty-state';
import { useViewDocument } from '@/hooks/use-view-document';
import { apiRequest } from '@/lib/api';
import { BackgroundLogo } from '@/components/background-logo';

interface ProjectFolder {
  id: string;
  name: string;
  documents: {
    id: string;
    title: string;
    originalFileName: string;
    fileUrl: string;
    section: string;
    createdAt: string;
  }[];
}

interface ProjectDetails {
  id: string;
  name: string;
  year: number;
  folders: ProjectFolder[];
}

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { viewDocument, isDownloading, downloadProgress } = useViewDocument();

  const fetchProjectDetails = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiRequest(`/projects/${id}/folders`);
      if (!res.ok) {
        throw new Error('Failed to load project details');
      }
      const data = await res.json();
      setProjectDetails(data?.data || null);
    } catch (err: any) {
      setError(err.message || 'Unable to fetch project folders');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const handleDocumentPress = useCallback((fileUrl: string, originalFileName: string) => {
    viewDocument(fileUrl, originalFileName);
  }, [viewDocument]);

  const handleFolderPress = (folderId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFolderId((prev) => (prev === folderId ? null : folderId));
  };

  const activeFolder = projectDetails?.folders?.find((f) => f.id === activeFolderId);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackgroundLogo />

      <Stack.Screen
        options={{
          title: projectDetails?.name || 'Project Details',
          headerBackTitle: 'Projects',
        }}
      />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading project folders...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#f43f5e" />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <Pressable
            onPress={fetchProjectDetails}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : !projectDetails ? (
        <View style={styles.centerContainer}>
          <Text style={{ color: colors.text }}>Project not found.</Text>
        </View>
      ) : activeFolder ? (
        /* Folder Document View */
        <View style={{ flex: 1 }}>
          <View style={styles.subHeader}>
            <Pressable
              onPress={() => setActiveFolderId(null)}
              style={styles.backToFoldersRow}
            >
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={[styles.backToFoldersText, { color: colors.primary }]}>
                All Project Folders
              </Text>
            </Pressable>
            <Text style={[styles.folderTitle, { color: colors.text }]}>{activeFolder.name}</Text>
            <Text style={[styles.folderSub, { color: colors.muted }]}>
              {activeFolder.documents.length} document(s) uploaded
            </Text>
          </View>

          <FlatList
            data={activeFolder.documents}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.listContent, { paddingBottom: 80 + Math.max(insets.bottom, 16) }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <DocumentRow
                id={item.id}
                title={item.title || item.originalFileName}
                fileName={item.originalFileName}
                createdAt={item.createdAt}
                onPress={() => handleDocumentPress(item.fileUrl, item.originalFileName)}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                title={`No Documents in ${activeFolder.name}`}
                description="There are no compliance documents uploaded into this project folder yet."
              />
            }
          />
        </View>
      ) : (
        /* List of 13 Pre-seeded Project Folders */
        <FlatList
          data={projectDetails.folders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 80 + Math.max(insets.bottom, 16) }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.projectHeaderBanner}>
              <View style={styles.projectInfoRow}>
                <Ionicons name="business" size={22} color={colors.primary} />
                <Text style={[styles.bannerTitle, { color: colors.text }]}>{projectDetails.name}</Text>
              </View>
              <Text style={[styles.bannerSubtitle, { color: colors.muted }]}>
                Calendar Year {projectDetails.year} • {projectDetails.folders.length} Compliance Folders
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const docCount = item.documents?.length || 0;
            return (
              <Pressable
                onPress={() => handleFolderPress(item.id)}
                style={({ pressed }) => [
                  styles.folderRow,
                  {
                    backgroundColor: isDark ? 'rgba(8, 23, 41, 0.65)' : 'rgba(255, 255, 255, 0.65)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.75)',
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.folderRowLeft}>
                  <View style={[styles.folderIconCircle, { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)' }]}>
                    <Ionicons name="folder" size={24} color="#3b82f6" />
                  </View>
                  <View style={styles.folderTextGroup}>
                    <Text style={[styles.folderNameText, { color: colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.docCountText, { color: colors.muted }]}>
                      {docCount} document(s)
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
            );
          }}
        />
      )}

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
  loadingText: {
    ...Typography.subheadline,
    fontWeight: '600',
  },
  errorText: {
    ...Typography.subheadline,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryText: {
    color: '#ffffff',
    ...Typography.buttonSmall,
  },
  projectHeaderBanner: {
    paddingVertical: 16,
    paddingHorizontal: 4,
    gap: 6,
    marginBottom: 8,
  },
  projectInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerTitle: {
    ...Typography.title2,
    fontWeight: '700',
    flex: 1,
  },
  bannerSubtitle: {
    ...Typography.subheadline,
    fontWeight: '500',
  },
  subHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 4,
  },
  backToFoldersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  backToFoldersText: {
    ...Typography.callout,
    fontWeight: '600',
  },
  folderTitle: {
    ...Typography.title2,
    fontWeight: '700',
  },
  folderSub: {
    ...Typography.footnote,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.2,
    borderRadius: 20,
    borderCurve: 'continuous',
    marginBottom: 12,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  folderRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  folderIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderTextGroup: {
    flex: 1,
    gap: 2,
  },
  folderNameText: {
    ...Typography.callout,
    fontWeight: '700',
  },
  docCountText: {
    ...Typography.caption1,
    fontWeight: '500',
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
});
