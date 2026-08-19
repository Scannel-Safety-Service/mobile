import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileEdit,
  ChevronRight,
  Calendar,
  Briefcase,
  Layers,
  ChevronLeft,
} from 'lucide-react-native';
import { Colors, Typography, Spacing, Radii } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { fetchTimesheets } from '@/lib/timesheets-api';
import { MobileTimesheet, TimesheetStatus } from '@/types/timesheets';

export default function TimesheetsListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';

  const [statusFilter, setStatusFilter] = useState<'ALL' | TimesheetStatus>('ALL');
  const [timesheets, setTimesheets] = useState<MobileTimesheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const data = await fetchTimesheets(statusFilter === 'ALL' ? undefined : statusFilter);
      setTimesheets(data);
    } catch (err) {
      console.warn('Error loading timesheets:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadData(true);
  };

  const formatDate = (dStr: string) => {
    if (!dStr) return '';
    return new Date(dStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStatusBadge = (status: TimesheetStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <View style={[styles.badgeWrap, { backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : '#ecfdf5', borderColor: '#10b981' }]}>
            <CheckCircle2 size={12} color="#10b981" />
            <Text style={[styles.badgeText, { color: '#10b981' }]}>Approved</Text>
          </View>
        );
      case 'PENDING':
        return (
          <View style={[styles.badgeWrap, { backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : '#fffbeb', borderColor: '#f59e0b' }]}>
            <Clock size={12} color="#f59e0b" />
            <Text style={[styles.badgeText, { color: '#f59e0b' }]}>Pending Review</Text>
          </View>
        );
      case 'REJECTED':
        return (
          <View style={[styles.badgeWrap, { backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : '#fef2f2', borderColor: '#ef4444' }]}>
            <XCircle size={12} color="#ef4444" />
            <Text style={[styles.badgeText, { color: '#ef4444' }]}>Rejected</Text>
          </View>
        );
      case 'REVISION_REQUESTED':
        return (
          <View style={[styles.badgeWrap, { backgroundColor: isDark ? 'rgba(249,115,22,0.2)' : '#fff7ed', borderColor: '#f97316' }]}>
            <AlertTriangle size={12} color="#f97316" />
            <Text style={[styles.badgeText, { color: '#f97316' }]}>Revision Needed</Text>
          </View>
        );
      case 'DRAFT':
      default:
        return (
          <View style={[styles.badgeWrap, { backgroundColor: isDark ? '#0f2740' : '#f1f5f9', borderColor: colors.cardBorder }]}>
            <FileEdit size={12} color={colors.muted} />
            <Text style={[styles.badgeText, { color: colors.muted }]}>Draft</Text>
          </View>
        );
    }
  };

  const renderItem = ({ item }: { item: MobileTimesheet }) => {
    // Unique project names
    const projectNames = Array.from(
      new Set(item.entries?.map((e) => e.project?.name).filter(Boolean) as string[]),
    );

    return (
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({
            pathname: '/(app)/timesheets/[id]',
            params: { id: item.id },
          });
        }}
        activeOpacity={0.7}
        style={[
          styles.timesheetCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.weekRangeWrap}>
            <Calendar size={15} color={colors.primary} />
            <Text style={[styles.weekRangeText, { color: colors.text }]}>
              {formatDate(item.weekStartDate)} &ndash; {formatDate(item.weekEndDate)}
            </Text>
          </View>
          {renderStatusBadge(item.status)}
        </View>

        <View style={styles.cardMidRow}>
          <View>
            <Text style={[styles.hoursValue, { color: colors.text }]}>
              {item.totalHours.toFixed(1)} <Text style={[styles.hoursUnit, { color: colors.muted }]}>hrs</Text>
            </Text>
            <Text style={[styles.hoursLabel, { color: colors.muted }]}>Total Logged</Text>
          </View>

          {item.productivityScore && (
            <View style={styles.metaCol}>
              <Text style={[styles.metaVal, { color: colors.text }]}>
                {item.productivityScore}/10
              </Text>
              <Text style={[styles.metaLab, { color: colors.muted }]}>Productivity</Text>
            </View>
          )}

          {item.expenseReimbursement && (
            <View style={styles.metaCol}>
              <Text style={[styles.metaVal, { color: '#f59e0b' }]}>Yes</Text>
              <Text style={[styles.metaLab, { color: colors.muted }]}>Expenses</Text>
            </View>
          )}
        </View>

        {projectNames.length > 0 && (
          <View style={styles.projectsRow}>
            <Briefcase size={12} color={colors.muted} />
            <Text style={[styles.projectNamesText, { color: colors.muted }]} numberOfLines={1}>
              {projectNames.join(', ')}
            </Text>
          </View>
        )}

        {item.rejectionReason && (
          <View style={[styles.rejectionNotice, { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2' }]}>
            <AlertTriangle size={13} color="#ef4444" />
            <Text style={styles.rejectionNoticeText} numberOfLines={2}>
              "{item.rejectionReason}"
            </Text>
          </View>
        )}

        <View style={[styles.cardFooter, { borderTopColor: isDark ? '#0f2740' : '#f8fafc' }]}>
          <Text style={[styles.submittedAtText, { color: colors.muted }]}>
            Submitted {formatDate(item.createdAt)}
          </Text>
          <View style={styles.viewDetailsWrap}>
            <Text style={[styles.viewDetailsText, { color: colors.primary }]}>View Details</Text>
            <ChevronRight size={14} color={colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}
        >
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Timesheets</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(app)/timesheets/new');
          }}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Plus size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsRow}>
        {(
          [
            { label: 'All', value: 'ALL' },
            { label: 'Pending', value: 'PENDING' },
            { label: 'Approved', value: 'APPROVED' },
            { label: 'Revision', value: 'REVISION_REQUESTED' },
            { label: 'Rejected', value: 'REJECTED' },
          ] as const
        ).map((tab) => (
          <TouchableOpacity
            key={tab.value}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setStatusFilter(tab.value);
            }}
            style={[
              styles.filterTabPill,
              {
                backgroundColor:
                  statusFilter === tab.value
                    ? colors.primary
                    : isDark
                    ? '#0c1f35'
                    : '#ffffff',
                borderColor:
                  statusFilter === tab.value ? colors.primary : colors.cardBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                {
                  color:
                    statusFilter === tab.value ? '#ffffff' : colors.textSecondary,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List Content */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading timesheets...</Text>
        </View>
      ) : (
        <FlatList
          data={timesheets}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Clock size={48} color={colors.muted} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Timesheets Found</Text>
              <Text style={[styles.emptySub, { color: colors.muted }]}>
                {statusFilter !== 'ALL'
                  ? `You have no ${statusFilter.toLowerCase().replace('_', ' ')} timesheets.`
                  : 'You have not submitted any weekly timesheets yet.'}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(app)/timesheets/new')}
                style={[styles.emptyCreateBtn, { backgroundColor: colors.primary }]}
              >
                <Plus size={16} color="#ffffff" />
                <Text style={styles.emptyCreateBtnText}>Fill Weekly Time Sheet</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.headline,
    fontWeight: '800',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#155B9D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  timesheetCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weekRangeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weekRangeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardMidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 12,
  },
  hoursValue: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  hoursUnit: {
    fontSize: 14,
    fontWeight: '600',
  },
  hoursLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  metaCol: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.06)',
    paddingLeft: 16,
  },
  metaVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  metaLab: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  projectsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  projectNamesText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  rejectionNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  rejectionNoticeText: {
    color: '#ef4444',
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  submittedAtText: {
    fontSize: 11,
    fontWeight: '500',
  },
  viewDetailsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    ...Typography.title3,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySub: {
    ...Typography.subheadline,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyCreateBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
