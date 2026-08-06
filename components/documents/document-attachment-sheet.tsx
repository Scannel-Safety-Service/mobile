import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography } from '@/constants/theme';
import { DocumentAttachment } from '@/types/document';
import { apiRequest } from '@/lib/api';
import { useViewDocument } from '@/hooks/use-view-document';
import { useAuthStore } from '@/store/auth-store';

interface DocumentAttachmentSheetProps {
  isVisible: boolean;
  onClose: () => void;
  documentId: string;
  assignmentId: string;
  documentTitle: string;
  isLocked?: boolean;
  attachments?: DocumentAttachment[];
  onRefresh?: () => void;
}

export function DocumentAttachmentSheet({
  isVisible,
  onClose,
  documentId,
  assignmentId,
  documentTitle,
  isLocked = false,
  attachments = [],
  onRefresh,
}: DocumentAttachmentSheetProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';
  const { user } = useAuthStore();
  const isWorkerOrContractor = user?.role === 'WORKER' || user?.role === 'CONTRACTOR';
  const isUploadDisabledByLock = isLocked && (isWorkerOrContractor || !user?.role);

  const [isUploading, setIsUploading] = useState(false);
  const [deletingAttachId, setDeletingAttachId] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<{
    type: 'success' | 'warning' | 'error';
    title: string;
    message: string;
  } | null>(null);
  const [localAttachments, setLocalAttachments] = useState<DocumentAttachment[]>(attachments);
  const { viewDocument } = useViewDocument();

  const fetchAttachments = useCallback(async () => {
    if (!documentId || !assignmentId) return;
    try {
      const res = await apiRequest(`/documents/${documentId}/assignments/${assignmentId}/attachments`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setLocalAttachments(json.data);
        }
      }
    } catch (err) {
      console.error('Error fetching attachments:', err);
    }
  }, [documentId, assignmentId]);

  useEffect(() => {
    setLocalAttachments(attachments);
  }, [attachments]);

  useEffect(() => {
    if (isVisible) {
      fetchAttachments();
    }
  }, [isVisible, fetchAttachments]);

  const maxAttachments = 5;
  const currentCount = localAttachments.length;
  const isMaxReached = currentCount >= maxAttachments;

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDeleteAttachment = async (attachId: string, fileName: string) => {
    if (isLocked) {
      setAlertState({
        type: 'warning',
        title: 'Document Locked',
        message: 'This document is locked by a supervisor. Attachments cannot be deleted.',
      });
      return;
    }

    try {
      setDeletingAttachId(attachId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const res = await apiRequest(
        `/documents/${documentId}/assignments/${assignmentId}/attachments/${attachId}`,
        { method: 'DELETE' }
      );

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Failed to delete attachment.');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLocalAttachments((prev) => prev.filter((item) => item.id !== attachId));
      setAlertState({
        type: 'success',
        title: 'Attachment Deleted',
        message: `"${fileName}" has been removed.`,
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      console.error('Error deleting attachment:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertState({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Unable to delete attachment.',
      });
    } finally {
      setDeletingAttachId(null);
    }
  };

  const handlePickAndUpload = async () => {
    if (isUploadDisabledByLock) {
      setAlertState({
        type: 'warning',
        title: 'Document Locked',
        message: 'This document has been locked by a supervisor or administrator. No further attachments can be uploaded.',
      });
      return;
    }

    if (isMaxReached) {
      setAlertState({
        type: 'warning',
        title: 'Limit Reached',
        message: 'You can upload up to 5 attachments per document.',
      });
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      if (asset.size && asset.size > 10 * 1024 * 1024) {
        setAlertState({
          type: 'error',
          title: 'File Too Large',
          message: 'File size must be under 10 MB.',
        });
        return;
      }

      setIsUploading(true);
      setAlertState(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.name || 'attachment.pdf',
        type: asset.mimeType || 'application/octet-stream',
      } as any);

      const response = await apiRequest(`/documents/${documentId}/assignments/${assignmentId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Failed to upload attachment.');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAlertState({
        type: 'success',
        title: 'Upload Successful',
        message: 'Your supporting attachment has been uploaded and converted to PDF.',
      });

      if (resData.data) {
        setLocalAttachments((prev) => [resData.data, ...prev.filter((item) => item.id !== resData.data.id)]);
      }
      fetchAttachments();

      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      console.error('Error uploading attachment:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertState({
        type: 'error',
        title: 'Upload Failed',
        message: err.message || 'Unable to upload file. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const renderAttachmentItem = ({ item }: { item: DocumentAttachment }) => {
    const isImage = item.mimeType?.includes('image') || item.fileUrl.match(/\.(jpg|jpeg|png|webp)$/i);
    const isDeleting = deletingAttachId === item.id;
    const canDelete = !isLocked && (
      !item.uploadedBy ||
      item.uploadedBy.id === user?.id ||
      isWorkerOrContractor ||
      user?.role === 'SUPER_ADMIN' ||
      user?.role === 'COMPANY_ADMIN' ||
      user?.role === 'SITE_SUPERVISOR'
    );

    return (
      <Pressable
        onPress={() => viewDocument(item.fileUrl, item.originalFileName)}
        style={({ pressed }) => [
          styles.itemCard,
          {
            backgroundColor: isDark ? 'rgba(15, 30, 48, 0.7)' : 'rgba(244, 248, 252, 0.9)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(226, 239, 250, 0.9)',
          },
          pressed && { opacity: 0.8 },
        ]}
      >
        <View style={[styles.itemIconCircle, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff' }]}>
          <Ionicons
            name={isImage ? 'image-outline' : 'document-text-outline'}
            size={20}
            color={colors.primary}
          />
        </View>

        <View style={styles.itemInfo}>
          <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
            {item.originalFileName}
          </Text>
          <Text style={[styles.itemMeta, { color: colors.muted }]}>
            {formatFileSize(item.fileSize)} • {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            onPress={() => viewDocument(item.fileUrl, item.originalFileName)}
            style={({ pressed }) => [styles.itemActionBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="eye-outline" size={18} color={colors.primary} />
          </Pressable>

          {canDelete && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteAttachment(item.id, item.originalFileName);
              }}
              disabled={isDeleting}
              style={({ pressed }) => [styles.itemActionBtn, pressed && { opacity: 0.6 }]}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#f43f5e" />
              ) : (
                <Ionicons name="trash-outline" size={18} color="#f43f5e" />
              )}
            </Pressable>
          )}
        </View>
      </Pressable>
    );
  };

  const isButtonDisabled = isUploading || isMaxReached || isUploadDisabledByLock;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />

        <View
          style={[
            styles.sheetCard,
            {
              backgroundColor: isDark ? '#081729' : '#ffffff',
              borderColor: colors.cardBorder,
            },
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTextGroup}>
              <Text style={[styles.sheetTitle, { color: colors.text }]} numberOfLines={1}>
                {documentTitle}
              </Text>
              <Text style={[styles.sheetSubtitle, { color: colors.muted }]}>
                Supporting Attachments ({currentCount}/{maxAttachments})
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="close" size={20} color={colors.muted} />
            </Pressable>
          </View>

          {/* Locked Notice Banner */}
          {isUploadDisabledByLock && (
            <View
              style={[
                styles.customAlertCard,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#fecaca',
                },
              ]}
            >
              <View style={styles.customAlertHeader}>
                <Ionicons name="lock-closed" size={18} color={isDark ? '#fca5a5' : '#ef4444'} />
                <Text
                  style={[
                    styles.customAlertTitle,
                    { color: isDark ? '#fca5a5' : '#b91c1c' },
                  ]}
                >
                  Document Locked
                </Text>
              </View>
              <Text style={[styles.customAlertMessage, { color: colors.text }]}>
                This document has been locked by a supervisor or administrator. Additional attachments cannot be uploaded.
              </Text>
            </View>
          )}

          {/* Custom Modern Alert Banner */}
          {alertState && !isUploadDisabledByLock && (
            <View
              style={[
                styles.customAlertCard,
                {
                  backgroundColor:
                    alertState.type === 'success'
                      ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5')
                      : alertState.type === 'warning'
                      ? (isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb')
                      : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2'),
                  borderColor:
                    alertState.type === 'success'
                      ? (isDark ? 'rgba(16, 185, 129, 0.35)' : '#a7f3d0')
                      : alertState.type === 'warning'
                      ? (isDark ? 'rgba(245, 158, 11, 0.35)' : '#fde68a')
                      : (isDark ? 'rgba(239, 68, 68, 0.35)' : '#fecaca'),
                },
              ]}
            >
              <View style={styles.customAlertHeader}>
                <Ionicons
                  name={
                    alertState.type === 'success'
                      ? 'checkmark-circle'
                      : alertState.type === 'warning'
                      ? 'warning'
                      : 'alert-circle'
                  }
                  size={18}
                  color={
                    alertState.type === 'success'
                      ? '#10b981'
                      : alertState.type === 'warning'
                      ? '#f59e0b'
                      : '#ef4444'
                  }
                />
                <Text
                  style={[
                    styles.customAlertTitle,
                    {
                      color:
                        alertState.type === 'success'
                          ? (isDark ? '#6ee7b7' : '#047857')
                          : alertState.type === 'warning'
                          ? (isDark ? '#fbbf24' : '#b45309')
                          : (isDark ? '#fca5a5' : '#b91c1c'),
                    },
                  ]}
                >
                  {alertState.title}
                </Text>
                <Pressable
                  onPress={() => setAlertState(null)}
                  style={({ pressed }) => [styles.alertCloseBtn, pressed && { opacity: 0.6 }]}
                >
                  <Ionicons name="close-circle" size={18} color={colors.muted} />
                </Pressable>
              </View>
              <Text style={[styles.customAlertMessage, { color: colors.text }]}>
                {alertState.message}
              </Text>
            </View>
          )}

          {/* Slot Progress Bar */}
          <View style={styles.slotRow}>
            {Array.from({ length: maxAttachments }).map((_, idx) => {
              const isFilled = idx < currentCount;
              return (
                <View
                  key={idx}
                  style={[
                    styles.slotSegment,
                    {
                      backgroundColor: isFilled
                        ? colors.primary
                        : isDark
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(226,239,250,0.8)',
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Attachment List */}
          <View style={styles.listContainer}>
            {localAttachments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="attach-outline" size={40} color={colors.muted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Attachments Yet</Text>
                <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                  Upload site photos, reports, or supporting files for this document. Max 5 files allowed.
                </Text>
              </View>
            ) : (
              <FlatList
                data={localAttachments}
                keyExtractor={(item) => item.id}
                renderItem={renderAttachmentItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>

          {/* Action Button */}
          <View style={styles.footer}>
            <Pressable
              onPress={handlePickAndUpload}
              disabled={isButtonDisabled}
              style={({ pressed }) => [
                styles.uploadButton,
                {
                  backgroundColor: isButtonDisabled ? (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0') : colors.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons
                    name={isUploadDisabledByLock ? 'lock-closed-outline' : 'cloud-upload-outline'}
                    size={20}
                    color={isButtonDisabled ? colors.muted : '#ffffff'}
                  />
                  <Text
                    style={[
                      styles.uploadButtonText,
                      { color: isButtonDisabled ? colors.muted : '#ffffff' },
                    ]}
                  >
                    {isUploadDisabledByLock
                      ? 'Document Locked (Read Only)'
                      : isMaxReached
                      ? 'Maximum 5 Attachments Reached'
                      : 'Upload Attachment'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheetCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '75%',
    elevation: 20,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150, 150, 150, 0.4)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTextGroup: {
    flex: 1,
    marginRight: 12,
  },
  sheetTitle: {
    ...Typography.subheadline,
    fontWeight: '700',
  },
  sheetSubtitle: {
    ...Typography.footnote,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
  },
  slotRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  slotSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  listContainer: {
    minHeight: 160,
    maxHeight: 320,
  },
  listContent: {
    gap: 8,
    paddingVertical: 4,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  itemIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    ...Typography.footnote,
    fontWeight: '600',
  },
  itemMeta: {
    ...Typography.caption2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    ...Typography.subheadline,
    fontWeight: '600',
  },
  emptySubtitle: {
    ...Typography.caption1,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  footer: {
    marginTop: 16,
  },
  uploadButton: {
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonText: {
    ...Typography.buttonSmall,
    fontWeight: '700',
  },
  customAlertCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    gap: 4,
  },
  customAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customAlertTitle: {
    ...Typography.footnote,
    fontWeight: '700',
    flex: 1,
  },
  alertCloseBtn: {
    padding: 2,
  },
  customAlertMessage: {
    ...Typography.caption1,
    lineHeight: 16,
    marginLeft: 26,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemActionBtn: {
    padding: 6,
    borderRadius: 8,
  },
});
