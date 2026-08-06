import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Search,
  Briefcase,
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  Layers,
  ShieldCheck,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography } from '@/constants/theme';
import { BackgroundLogo } from '@/components/background-logo';
import { ProjectAssignedCard } from '@/components/projects/project-assigned-card';
import { DocumentRow } from '@/components/documents/document-row';
import { SignatureCanvasModal } from '@/components/documents/signature-canvas-modal';
import { DocumentAttachmentSheet } from '@/components/documents/document-attachment-sheet';
import { useViewDocument } from '@/hooks/use-view-document';
import { apiRequest } from '@/lib/api';
import { DocumentAssignment, DocumentAttachment } from '@/types/document';

interface ProjectGroup {
  id: string;
  name: string;
  year?: number;
  assignments: DocumentAssignment[];
  totalDocs: number;
  pendingCount: number;
  signedCount: number;
  folders: string[];
}

export default function ProjectsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  // State
  const [assignedDocs, setAssignedDocs] = useState<DocumentAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hierarchy & Filter Navigation State
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [mainFilter, setMainFilter] = useState<'ALL' | 'ACTION_REQUIRED' | 'COMPLETED'>('ALL');
  const [docFilter, setDocFilter] = useState<'ALL' | 'PENDING' | 'SIGNED'>('ALL');

  // Signature Modal State
  const [signingModalVisible, setSigningModalVisible] = useState(false);
  const [targetSigningDoc, setTargetSigningDoc] = useState<{ id: string; title: string } | null>(null);
  const [isSubmittingSignature, setIsSubmittingSignature] = useState(false);

  // Attachment Sheet State
  const [attachmentSheetVisible, setAttachmentSheetVisible] = useState(false);
  const [targetAttachmentDoc, setTargetAttachmentDoc] = useState<{
    docId: string;
    assignmentId: string;
    title: string;
    isLocked?: boolean;
    attachments: DocumentAttachment[];
  } | null>(null);

  const { viewDocument, isDownloading, downloadProgress } = useViewDocument();

  // Fetch assigned documents
  const fetchAssignedDocuments = useCallback(async () => {
    try {
      setError(null);
      const res = await apiRequest('/documents/my-assigned');
      if (!res.ok) throw new Error('Failed to load assigned documents');
      const data = await res.json();
      setAssignedDocs(data?.data || []);
    } catch (err: any) {
      console.error('Error loading assigned documents:', err);
      setError(err.message || 'Unable to fetch assigned documents');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAssignedDocuments();
    }, [fetchAssignedDocuments])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAssignedDocuments();
  };

  // Aggregate & Group documents by Project
  const projectGroups = useMemo<ProjectGroup[]>(() => {
    const map = new Map<string, ProjectGroup>();

    assignedDocs.forEach((assignment) => {
      const doc = assignment.document;
      if (!doc) return;

      const project = doc.project;
      const projectId = project?.id || 'general';
      const projectName = project?.name || 'General Compliance & Company Docs';
      const projectYear = project?.year;

      if (!map.has(projectId)) {
        map.set(projectId, {
          id: projectId,
          name: projectName,
          year: projectYear,
          assignments: [],
          totalDocs: 0,
          pendingCount: 0,
          signedCount: 0,
          folders: [],
        });
      }

      const group = map.get(projectId)!;
      group.assignments.push(assignment);
      group.totalDocs += 1;

      const isPending =
        assignment.signatureStatus === 'PENDING' || assignment.approvalStatus === 'REJECTED';
      if (isPending) {
        group.pendingCount += 1;
      } else {
        group.signedCount += 1;
      }

      // Collect folder / section name
      const folderName = doc.folder?.name || doc.section?.replace(/_/g, ' ');
      if (folderName && !group.folders.includes(folderName)) {
        group.folders.push(folderName);
      }
    });

    return Array.from(map.values());
  }, [assignedDocs]);

  // Overall statistics
  const totalProjectsCount = projectGroups.length;

  // Filtered project groups based on main filter
  const filteredProjectGroups = useMemo(() => {
    return projectGroups.filter((group) => {
      if (mainFilter === 'ACTION_REQUIRED') return group.pendingCount > 0;
      if (mainFilter === 'COMPLETED') return group.pendingCount === 0;

      return true;
    });
  }, [projectGroups, mainFilter]);

  // Active selected project group for drill-down view
  const selectedGroup = useMemo(() => {
    if (!selectedProjectId) return null;
    return projectGroups.find((g) => g.id === selectedProjectId) || null;
  }, [projectGroups, selectedProjectId]);

  // Filtered documents within selected project
  const selectedProjectDocs = useMemo(() => {
    if (!selectedGroup) return [];
    return selectedGroup.assignments.filter((assignment) => {
      const isPending =
        assignment.signatureStatus === 'PENDING' || assignment.approvalStatus === 'REJECTED';
      if (docFilter === 'PENDING') return isPending;
      if (docFilter === 'SIGNED') return !isPending;
      return true;
    });
  }, [selectedGroup, docFilter]);

  // Document Viewer Handler
  const handleDocumentView = useCallback(
    (fileUrl: string, fileName: string) => {
      viewDocument(fileUrl, fileName);
    },
    [viewDocument]
  );

  // Open Signature Modal
  const handleOpenSignModal = useCallback((docId: string, title: string) => {
    setTargetSigningDoc({ id: docId, title });
    setSigningModalVisible(true);
  }, []);

  // Open Attachment Sheet
  const handleOpenAttachSheet = useCallback((assignment: DocumentAssignment) => {
    if (!assignment.document) return;
    setTargetAttachmentDoc({
      docId: assignment.document.id,
      assignmentId: assignment.id,
      title: assignment.document.title || assignment.document.originalFileName,
      isLocked: assignment.document.isLocked,
      attachments: assignment.attachments || [],
    });
    setAttachmentSheetVisible(true);
  }, []);

  // Submit Signature
  const handleSubmitSignature = async (base64Signature: string) => {
    if (!targetSigningDoc) return;
    try {
      setIsSubmittingSignature(true);
      const response = await apiRequest(`/documents/${targetSigningDoc.id}/sign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureDataUrl: base64Signature,
          deviceInfo: JSON.stringify({ platform: 'mobile' }),
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Failed to submit signature');
      }

      // Refresh list to update status badge to SIGNED
      fetchAssignedDocuments();
    } catch (err: any) {
      throw err;
    } finally {
      setIsSubmittingSignature(false);
    }
  };

  const selectProject = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedProjectId(id);
    setDocFilter('ALL');
  };

  const backToProjects = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProjectId(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackgroundLogo />

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        {/* ======================================================== */}
        {/* VIEW A: SELECTED PROJECT DRILL-DOWN VIEW                */}
        {/* ======================================================== */}
        {selectedGroup ? (
          <View style={styles.drilldownContainer}>
            {/* Project Top Bar */}
            <View style={styles.drilldownHeader}>
              <Pressable
                onPress={backToProjects}
                style={({ pressed }) => [
                  styles.backBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(241, 245, 249, 0.9)',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <ArrowLeft size={18} color={colors.text} strokeWidth={2.2} />
                <Text style={[styles.backBtnText, { color: colors.text }]}>Projects</Text>
              </Pressable>
            </View>

            {/* Document Filter Chips */}
            <View style={styles.docFilterRow}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDocFilter('ALL');
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      docFilter === 'ALL'
                        ? colors.primary
                        : isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(241, 245, 249, 0.8)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: docFilter === 'ALL' ? '#ffffff' : colors.text },
                  ]}
                >
                  All ({selectedGroup.totalDocs})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDocFilter('PENDING');
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      docFilter === 'PENDING'
                        ? '#f59e0b'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(241, 245, 249, 0.8)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: docFilter === 'PENDING' ? '#ffffff' : colors.text },
                  ]}
                >
                  Action Required ({selectedGroup.pendingCount})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDocFilter('SIGNED');
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      docFilter === 'SIGNED'
                        ? '#10b981'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(241, 245, 249, 0.8)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: docFilter === 'SIGNED' ? '#ffffff' : colors.text },
                  ]}
                >
                  Signed ({selectedGroup.signedCount})
                </Text>
              </Pressable>
            </View>

            {/* List of Documents in Selected Project */}
            <FlatList
              data={selectedProjectDocs}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: 90 + Math.max(insets.bottom, 16) },
              ]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                />
              }
              renderItem={({ item }) => {
                const doc = item.document;
                if (!doc) return null;
                return (
                  <DocumentRow
                    id={doc.id}
                    title={doc.title || doc.originalFileName}
                    fileName={doc.originalFileName}
                    createdAt={item.assignedAt}
                    signatureStatus={item.signatureStatus}
                    approvalStatus={item.approvalStatus}
                    rejectionReason={item.rejectionReason}
                    isLocked={doc.isLocked}
                    projectName={doc.project?.name}
                    folderName={doc.folder?.name}
                    attachmentCount={item.attachments?.length || 0}
                    assignmentId={item.id}
                    onAttachPress={() => handleOpenAttachSheet(item)}
                    onPress={() => handleDocumentView(doc.fileUrl, doc.originalFileName)}
                    onSignPress={(id: string, title: string) => handleOpenSignModal(id, title)}
                  />
                );
              }}
              ListEmptyComponent={
                <View style={styles.centerContainer}>
                  <FileText size={42} color={colors.muted} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No Documents Found</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                    There are no documents matching the selected filter in this project.
                  </Text>
                </View>
              }
            />
          </View>
        ) : (
          /* ======================================================== */
          /* VIEW B: MAIN PROJECTS HIERARCHY LIST VIEW                 */
          /* ======================================================== */
          <View style={styles.mainViewContainer}>
            {/* Header Banner */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Projects & Documents</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                Select a project to review and sign your compliance documents
              </Text>
            </View>

            {/* Status Filter Tabs */}
            <View style={styles.searchAndFilterSection}>
              <View style={styles.tabFilterRow}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMainFilter('ALL');
                  }}
                  style={[
                    styles.tabChip,
                    {
                      backgroundColor:
                        mainFilter === 'ALL'
                          ? colors.primary
                          : isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : 'rgba(241, 245, 249, 0.8)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabChipText,
                      { color: mainFilter === 'ALL' ? '#ffffff' : colors.text },
                    ]}
                  >
                    All Projects ({totalProjectsCount})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMainFilter('ACTION_REQUIRED');
                  }}
                  style={[
                    styles.tabChip,
                    {
                      backgroundColor:
                        mainFilter === 'ACTION_REQUIRED'
                          ? '#f59e0b'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : 'rgba(241, 245, 249, 0.8)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabChipText,
                      { color: mainFilter === 'ACTION_REQUIRED' ? '#ffffff' : colors.text },
                    ]}
                  >
                    Needs Action
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMainFilter('COMPLETED');
                  }}
                  style={[
                    styles.tabChip,
                    {
                      backgroundColor:
                        mainFilter === 'COMPLETED'
                          ? '#10b981'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : 'rgba(241, 245, 249, 0.8)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabChipText,
                      { color: mainFilter === 'COMPLETED' ? '#ffffff' : colors.text },
                    ]}
                  >
                    Completed
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* List of Project Cards */}
            {isLoading && !refreshing ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.muted }]}>
                  Loading projects...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.centerContainer}>
                <AlertCircle size={44} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                <Pressable
                  onPress={fetchAssignedDocuments}
                  style={[styles.retryBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.retryBtnText}>Retry</Text>
                </Pressable>
              </View>
            ) : filteredProjectGroups.length === 0 ? (
              <View style={styles.centerContainer}>
                <Layers size={44} color={colors.muted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Projects Found</Text>
                <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                  You currently have no compliance documents assigned across any projects.
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredProjectGroups}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                  styles.listContent,
                  { paddingBottom: 90 + Math.max(insets.bottom, 16) },
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={colors.primary}
                  />
                }
                renderItem={({ item }) => (
                  <ProjectAssignedCard
                    id={item.id}
                    name={item.name}
                    year={item.year}
                    totalDocs={item.totalDocs}
                    pendingCount={item.pendingCount}
                    signedCount={item.signedCount}
                    folders={item.folders}
                    onPress={() => selectProject(item.id)}
                  />
                )}
              />
            )}
          </View>
        )}
      </SafeAreaView>

      {/* Signature Canvas Modal */}
      {targetSigningDoc && (
        <SignatureCanvasModal
          visible={signingModalVisible}
          documentTitle={targetSigningDoc.title}
          onClose={() => setSigningModalVisible(false)}
          onSign={handleSubmitSignature}
          isSubmitting={isSubmittingSignature}
        />
      )}

      {/* Attachment Sheet Modal */}
      {targetAttachmentDoc && (
        <DocumentAttachmentSheet
          isVisible={attachmentSheetVisible}
          onClose={() => setAttachmentSheetVisible(false)}
          documentId={targetAttachmentDoc.docId}
          assignmentId={targetAttachmentDoc.assignmentId}
          documentTitle={targetAttachmentDoc.title}
          isLocked={targetAttachmentDoc.isLocked}
          attachments={targetAttachmentDoc.attachments}
          onRefresh={fetchAssignedDocuments}
        />
      )}

      {/* Downloading / View PDF Overlay */}
      {isDownloading && (
        <View style={styles.downloadOverlay}>
          <View
            style={[
              styles.downloadCard,
              {
                backgroundColor: isDark ? '#0f2338' : '#ffffff',
                borderColor: colors.cardBorder,
                borderWidth: 1,
              },
            ]}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.downloadText, { color: colors.text }]}>Opening Document...</Text>
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
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },
  mainViewContainer: {
    flex: 1,
  },
  drilldownContainer: {
    flex: 1,
  },

  // Main Header Banner
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 4,
  },
  title: {
    ...Typography.title1,
    fontWeight: '800',
  },
  subtitle: {
    ...Typography.subheadline,
    fontWeight: '500',
  },

  // Hero Summary Bar
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  summaryIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTextCol: {
    justifyContent: 'center',
  },
  summaryNum: {
    ...Typography.headline,
    fontWeight: '800',
    lineHeight: 20,
  },
  summaryLabel: {
    ...Typography.caption2,
    fontWeight: '600',
  },

  // Search & Filters
  searchAndFilterSection: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.2,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    padding: 0,
  },
  tabFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tabChipText: {
    ...Typography.caption1,
    fontWeight: '700',
  },

  // Project Drill-down Header
  drilldownHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  backBtnText: {
    ...Typography.subheadline,
    fontWeight: '700',
  },
  projectHeaderDetails: {
    gap: 4,
  },
  projectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  projectTitleText: {
    ...Typography.title2,
    fontWeight: '800',
    flexShrink: 1,
  },
  yearBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  yearBadgeText: {
    ...Typography.caption2,
    color: '#3b82f6',
    fontWeight: '700',
  },
  projectSubtitleText: {
    ...Typography.subheadline,
    fontWeight: '500',
  },

  // Drilldown Document Filters
  docFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  filterChipText: {
    ...Typography.caption1,
    fontWeight: '700',
  },

  // List Content
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },

  // Empty & Center States
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    ...Typography.subheadline,
    fontWeight: '500',
  },
  errorText: {
    ...Typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyTitle: {
    ...Typography.title3,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    ...Typography.subheadline,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    ...Typography.subheadline,
    color: '#ffffff',
    fontWeight: '700',
  },

  // Downloading Overlay
  downloadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  downloadCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
    minWidth: 200,
  },
  downloadText: {
    ...Typography.headline,
    fontWeight: '700',
  },
  downloadProgressText: {
    ...Typography.caption1,
    fontWeight: '600',
  },
});
