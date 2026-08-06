import React, { memo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography } from '@/constants/theme';
import { SignatureStatus, ApprovalStatus } from '@/types/document';

interface DocumentRowProps {
  id: string;
  title: string | null;
  fileName: string;
  createdAt: string;
  onPress: (id: string, fileName: string) => void;
  signatureStatus?: SignatureStatus;
  approvalStatus?: ApprovalStatus;
  rejectionReason?: string | null;
  onSignPress?: (id: string, title: string) => void;
  projectName?: string;
  folderName?: string;
  attachmentCount?: number;
  assignmentId?: string;
  onAttachPress?: (assignmentId: string, title: string) => void;
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export const DocumentRow = memo(function DocumentRow({
  id,
  title,
  fileName,
  createdAt,
  onPress,
  signatureStatus,
  approvalStatus,
  rejectionReason,
  onSignPress,
  projectName,
  folderName,
  attachmentCount,
  assignmentId,
  onAttachPress,
}: DocumentRowProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(id, fileName);
  };

  const handleSignClick = (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onSignPress) {
      onSignPress(id, title || fileName);
    } else {
      onPress(id, fileName);
    }
  };

  const displayName = title || fileName;
  const formattedDate = dateFormatter.format(new Date(createdAt));

  const isPendingSignature = signatureStatus === 'PENDING' || approvalStatus === 'REJECTED';
  const isApproved = approvalStatus === 'APPROVED';
  const isSignedPendingReview = signatureStatus === 'SIGNED' && approvalStatus === 'PENDING';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(8,23,41,0.75)' : 'rgba(255,255,255,0.9)',
          borderColor: isPendingSignature
            ? (isDark ? 'rgba(245,158,11,0.5)' : '#fde68a')
            : (isDark ? 'rgba(15,39,64,0.5)' : 'rgba(226,239,250,0.8)'),
        },
      ]}
    >
      <View style={styles.leftSection}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isPendingSignature
                ? (isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7')
                : isApproved
                ? (isDark ? 'rgba(16,185,129,0.15)' : '#d1fae5')
                : (isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff'),
            },
          ]}
        >
          <Ionicons
            name={
              isPendingSignature
                ? 'pencil-sharp'
                : isApproved
                ? 'checkmark-done-circle'
                : 'document-text'
            }
            size={22}
            color={
              isPendingSignature
                ? '#d97706'
                : isApproved
                ? '#10b981'
                : '#3b82f6'
            }
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>

          {(projectName || folderName) && (
            <Text style={[styles.locationText, { color: colors.muted }]} numberOfLines={1}>
              {[projectName, folderName].filter(Boolean).join(' • ')}
            </Text>
          )}

          <View style={styles.badgeAndDateRow}>
            <View style={styles.dateRow}>
              <Ionicons name="time-outline" size={12} color={colors.muted} />
              <Text style={[styles.date, { color: colors.muted }]}>
                {formattedDate}
              </Text>
            </View>

            {/* Signature Status Badges */}
            {isPendingSignature && (
              <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : '#fef3c7' }]}>
                <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
                <Text style={[styles.statusText, { color: isDark ? '#fbbf24' : '#b45309' }]}>
                  {approvalStatus === 'REJECTED' ? 'Re-sign Required' : 'Signature Required'}
                </Text>
              </View>
            )}

            {isSignedPendingReview && (
              <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe' }]}>
                <View style={[styles.dot, { backgroundColor: '#3b82f6' }]} />
                <Text style={[styles.statusText, { color: isDark ? '#93c5fd' : '#1d4ed8' }]}>
                  Awaiting Review
                </Text>
              </View>
            )}

            {isApproved && (
              <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : '#d1fae5' }]}>
                <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                <Text style={[styles.statusText, { color: isDark ? '#6ee7b7' : '#047857' }]}>
                  Approved
                </Text>
              </View>
            )}
          </View>

          {approvalStatus === 'REJECTED' && rejectionReason && (
            <Text style={styles.rejectionReasonText} numberOfLines={1}>
              Reason: {rejectionReason}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress(id, fileName);
          }}
          style={({ pressed }) => [
            styles.viewActionButton,
            {
              backgroundColor: isDark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.1)',
              borderColor: isDark ? 'rgba(59,130,246,0.35)' : 'rgba(59,130,246,0.25)',
            },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons name="eye-outline" size={14} color={colors.primary} />
          <Text style={[styles.viewActionText, { color: colors.primary }]}>View</Text>
        </Pressable>

        {isPendingSignature && (
          <Pressable
            onPress={handleSignClick}
            style={({ pressed }) => [
              styles.signActionButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="create-outline" size={14} color="#ffffff" />
            <Text style={styles.signActionText}>Sign</Text>
          </Pressable>
        )}

        {onAttachPress && assignmentId && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onAttachPress(assignmentId, title || fileName);
            }}
            style={({ pressed }) => [
              styles.attachActionButton,
              {
                backgroundColor: (attachmentCount || 0) > 0
                  ? (isDark ? 'rgba(59,130,246,0.18)' : '#eff6ff')
                  : (isDark ? 'rgba(245,158,11,0.12)' : '#fef3c7'),
                borderColor: (attachmentCount || 0) > 0
                  ? (isDark ? 'rgba(59,130,246,0.35)' : 'rgba(59,130,246,0.25)')
                  : (isDark ? 'rgba(245,158,11,0.35)' : '#fde68a'),
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons
              name="attach-outline"
              size={14}
              color={(attachmentCount || 0) > 0 ? colors.primary : '#d97706'}
            />
            <Text
              style={[
                styles.attachActionText,
                { color: (attachmentCount || 0) > 0 ? colors.primary : (isDark ? '#fbbf24' : '#b45309') },
              ]}
            >
              {attachmentCount ? `${attachmentCount}/5` : '0/5'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1.2,
    borderRadius: 18,
    borderCurve: 'continuous',
    marginVertical: 5,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 3,
  },
  title: {
    ...Typography.subheadline,
    fontWeight: '700',
  },
  locationText: {
    ...Typography.caption2,
    fontWeight: '500',
  },
  badgeAndDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    ...Typography.caption1,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rejectionReasonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 6,
    minWidth: 72,
  },
  viewActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  viewActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  signActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  signActionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  attachActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  attachActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
