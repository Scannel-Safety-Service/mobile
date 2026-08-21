import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  Clock,
  Briefcase,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  RotateCcw,
} from 'lucide-react-native';
import { Colors, Typography, Spacing, Radii } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { fetchTimesheetById } from '@/lib/timesheets-api';
import { MobileTimesheet, TimesheetStatus } from '@/types/timesheets';

const DAY_LABELS: Record<string, string> = {
  SUNDAY: 'Sunday',
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
};

export default function TimesheetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';

  const [timesheet, setTimesheet] = useState<MobileTimesheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      fetchTimesheetById(id)
        .then(setTimesheet)
        .catch((err) => {
          setErrorMessage(err.message || 'Could not load timesheet details');
        })
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const formatDate = (dStr?: string | null) => {
    if (!dStr) return 'N/A';
    return new Date(dStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderStatusBadge = (status: TimesheetStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : '#ecfdf5', borderColor: '#10b981' }]}>
            <CheckCircle2 size={14} color="#10b981" />
            <Text style={[styles.badgeText, { color: '#10b981' }]}>Approved</Text>
          </View>
        );
      case 'PENDING':
        return (
          <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : '#fffbeb', borderColor: '#f59e0b' }]}>
            <Clock size={14} color="#f59e0b" />
            <Text style={[styles.badgeText, { color: '#f59e0b' }]}>Pending Review</Text>
          </View>
        );
      case 'REJECTED':
        return (
          <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : '#fef2f2', borderColor: '#ef4444' }]}>
            <XCircle size={14} color="#ef4444" />
            <Text style={[styles.badgeText, { color: '#ef4444' }]}>Rejected</Text>
          </View>
        );
      case 'REVISION_REQUESTED':
        return (
          <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(249,115,22,0.2)' : '#fff7ed', borderColor: '#f97316' }]}>
            <AlertTriangle size={14} color="#f97316" />
            <Text style={[styles.badgeText, { color: '#f97316' }]}>Revision Requested</Text>
          </View>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (errorMessage || !timesheet) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder, alignItems: 'center', padding: 24, width: '100%', maxWidth: 360 }]}>
          <XCircle size={40} color="#ef4444" style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 8, textAlign: 'center' }}>
            Failed to Load
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 20 }}>
            {errorMessage || 'Could not find the requested timesheet details.'}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ backgroundColor: colors.primary, height: 44, borderRadius: 12, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const canEdit = timesheet.status === 'REJECTED' || timesheet.status === 'REVISION_REQUESTED' || timesheet.status === 'DRAFT';

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}
        >
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Timesheet Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Card Banner */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.bannerTop}>
            {renderStatusBadge(timesheet.status)}
            <Text style={[styles.weekRange, { color: colors.text }]}>
              {formatDate(timesheet.weekStartDate)} &ndash; {formatDate(timesheet.weekEndDate)}
            </Text>
            <Text style={[styles.submittedMeta, { color: colors.muted }]}>
              Submitted by {timesheet.employeeFirstName} {timesheet.employeeLastName}
            </Text>
          </View>

          {/* Supervisor Feedback Banner if any */}
          {timesheet.rejectionReason && (
            <View style={[styles.feedbackBox, { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', borderColor: '#ef4444' }]}>
              <AlertTriangle size={18} color="#ef4444" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.feedbackTitle}>Supervisor Feedback</Text>
                <Text style={styles.feedbackText}>"{timesheet.rejectionReason}"</Text>
              </View>
            </View>
          )}

          {/* Metrics Row */}
          <View style={[styles.metricsRow, { borderTopColor: isDark ? '#0f2740' : '#f1f5f9' }]}>
            <View style={styles.metricCol}>
              <Text style={[styles.metricVal, { color: colors.primary }]}>
                {timesheet.totalHours.toFixed(1)} <Text style={styles.metricUnit}>hrs</Text>
              </Text>
              <Text style={[styles.metricLab, { color: colors.muted }]}>Total Hours</Text>
            </View>

            <View style={styles.metricCol}>
              <Text style={[styles.metricVal, { color: colors.text }]}>
                {timesheet.productivityScore ? `${timesheet.productivityScore}/10` : 'N/A'}
              </Text>
              <Text style={[styles.metricLab, { color: colors.muted }]}>Productivity</Text>
            </View>

            <View style={styles.metricCol}>
              <Text style={[styles.metricVal, { color: timesheet.expenseReimbursement ? '#f59e0b' : colors.muted }]}>
                {timesheet.expenseReimbursement ? 'Yes' : 'No'}
              </Text>
              <Text style={[styles.metricLab, { color: colors.muted }]}>Expenses</Text>
            </View>
          </View>
        </View>

        {/* ── Daily Breakdown Section ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Daily Hours & Projects</Text>

          <View style={styles.daysList}>
            {timesheet.entries?.map((entry) => (
              <View
                key={entry.id}
                style={[
                  styles.dayRowItem,
                  { borderBottomColor: isDark ? '#0f2740' : '#f1f5f9' },
                ]}
              >
                <View style={styles.dayInfoLeft}>
                  <Text style={[styles.dayNameText, { color: colors.text }]}>
                    {DAY_LABELS[entry.dayOfWeek] || entry.dayOfWeek}
                  </Text>
                  <Text style={[styles.dayTimesText, { color: colors.muted }]}>
                    {entry.startTime && entry.finishTime
                      ? `${entry.startTime} - ${entry.finishTime} (${entry.breakMinutes || 0}m break)`
                      : 'No hours recorded'}
                  </Text>
                  {entry.project && (
                    <View style={styles.projectPill}>
                      <Briefcase size={10} color={colors.primary} />
                      <Text style={[styles.projectPillText, { color: colors.primary }]}>
                        {entry.project.name}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.dayHoursRight}>
                  <Text
                    style={[
                      styles.dayHoursVal,
                      { color: entry.hoursWorked > 0 ? colors.primary : colors.muted },
                    ]}
                  >
                    {entry.hoursWorked.toFixed(1)} hrs
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Worker Comments ── */}
        {timesheet.comments && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Additional Comments</Text>
            <Text style={[styles.commentsBody, { color: colors.muted }]}>{timesheet.comments}</Text>
          </View>
        )}

        {/* ── Attachments ── */}
        {timesheet.attachments && timesheet.attachments.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Attached Files & Photos ({timesheet.attachments.length})
            </Text>
            <View style={styles.attachmentsGrid}>
              {timesheet.attachments.map((att) => {
                const fullUrl = att.fileUrl.startsWith('http')
                  ? att.fileUrl
                  : `http://localhost:8000${att.fileUrl}`;
                const isImg = att.mimeType.startsWith('image/');

                return (
                  <View
                    key={att.id}
                    style={[
                      styles.attCard,
                      { borderColor: colors.cardBorder, backgroundColor: isDark ? '#081729' : '#f8fafc' },
                    ]}
                  >
                    {isImg ? (
                      <Image source={{ uri: fullUrl }} style={styles.attImage} />
                    ) : (
                      <View style={[styles.attIconBox, { backgroundColor: isDark ? '#0c1f35' : '#e2effa' }]}>
                        <FileText size={24} color={colors.primary} />
                      </View>
                    )}
                    <Text style={[styles.attFileName, { color: colors.text }]} numberOfLines={1}>
                      {att.originalFileName}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Action Buttons ── */}
        {canEdit && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(app)/timesheets/new');
            }}
            style={[styles.resubmitBtn, { backgroundColor: colors.primary }]}
          >
            <RotateCcw size={18} color="#ffffff" />
            <Text style={styles.resubmitBtnText}>Edit & Resubmit Timesheet</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.headline,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  bannerTop: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  weekRange: {
    ...Typography.title3,
    fontWeight: '800',
  },
  submittedMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  feedbackBox: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  feedbackTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ef4444',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  feedbackText: {
    fontSize: 13,
    color: '#991b1b',
    fontStyle: 'italic',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  metricCol: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '900',
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricLab: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  sectionHeading: {
    ...Typography.headline,
    fontWeight: '800',
    marginBottom: 12,
  },
  daysList: {
    gap: 10,
  },
  dayRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dayInfoLeft: {
    flex: 1,
  },
  dayNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dayTimesText: {
    fontSize: 12,
    marginTop: 2,
  },
  projectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  projectPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dayHoursRight: {
    paddingLeft: 12,
  },
  dayHoursVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  commentsBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  attachmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  attCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    gap: 6,
  },
  attImage: {
    width: '100%',
    height: 90,
    borderRadius: 8,
  },
  attIconBox: {
    width: '100%',
    height: 90,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attFileName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  resubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    minHeight: 52,
    shadowColor: '#155B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  resubmitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
