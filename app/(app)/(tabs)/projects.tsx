import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography } from '@/constants/theme';
import { BackgroundLogo } from '@/components/background-logo';
import { DocumentRow } from '@/components/documents/document-row';
import { SignatureCanvasModal } from '@/components/documents/signature-canvas-modal';
import { useViewDocument } from '@/hooks/use-view-document';
import { apiRequest } from '@/lib/api';
import { DocumentAssignment } from '@/types/document';

export default function ProjectsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';

  // Assigned documents state
  const [assignedDocs, setAssignedDocs] = useState<DocumentAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Signature modal state
  const [signingModalVisible, setSigningModalVisible] = useState(false);
  const [targetSigningDoc, setTargetSigningDoc] = useState<{ id: string; title: string } | null>(null);
  const [isSubmittingSignature, setIsSubmittingSignature] = useState(false);

  const { viewDocument, isDownloading, downloadProgress } = useViewDocument();

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

  const handleDocumentView = useCallback(
    (fileUrl: string, fileName: string) => {
      viewDocument(fileUrl, fileName);
    },
    [viewDocument]
  );

  const handleOpenSignModal = useCallback((docId: string, title: string) => {
    setTargetSigningDoc({ id: docId, title });
    setSigningModalVisible(true);
  }, []);

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

      setSigningModalVisible(false);
      setTargetSigningDoc(null);

      // Refresh list to update status badge to SIGNED
      fetchAssignedDocuments();
      Alert.alert('Success', 'Your digital signature has been embedded into the PDF document.');
    } catch (err: any) {
      Alert.alert('Signing Failed', err.message || 'Unable to submit signature. Please try again.');
    } finally {
      setIsSubmittingSignature(false);
    }
  };

  const pendingCount = assignedDocs.filter(
    (a) => a.signatureStatus === 'PENDING' || a.approvalStatus === 'REJECTED'
  ).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackgroundLogo />

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>Assigned Documents</Text>
            {pendingCount > 0 && (
              <View style={styles.pendingPill}>
                <Text style={styles.pendingPillText}>{pendingCount} Pending</Text>
              </View>
            )}
          </View>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Review and sign your required safety compliance documents
          </Text>
        </View>

        {/* Assigned Documents List */}
        {isLoading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>
              Loading assigned documents...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        ) : assignedDocs.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="document-text-outline" size={44} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Documents Assigned
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              You currently have no compliance documents assigned for signature.
            </Text>
          </View>
        ) : (
          <FlatList
            data={assignedDocs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
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
                  projectName={doc.project?.name}
                  folderName={doc.folder?.name}
                  onPress={() => handleDocumentView(doc.fileUrl, doc.originalFileName)}
                  onSignPress={(id, title) => handleOpenSignModal(id, title)}
                />
              );
            }}
          />
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

      {/* Downloading Overlay */}
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
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    ...Typography.title1,
  },
  subtitle: {
    ...Typography.subheadline,
    fontWeight: '500',
  },
  pendingPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  pendingPillText: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  loadingText: {
    ...Typography.subheadline,
    fontWeight: '600',
  },
  errorText: {
    ...Typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyTitle: {
    ...Typography.headline,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.subheadline,
    textAlign: 'center',
    lineHeight: 20,
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
