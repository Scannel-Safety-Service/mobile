import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { Clock, ChevronLeft, CheckCircle2 } from 'lucide-react-native';

import { Colors, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/auth-store';
import { fetchLiveProjects, submitTimesheet } from '@/lib/timesheets-api';
import { DayOfWeek, MobileProject } from '@/types/timesheets';

import { EmployeeInfoCard } from '@/components/timesheets/EmployeeInfoCard';
import { DailyHoursSection, DayFormState } from '@/components/timesheets/DailyHoursSection';
import { ExpenseReimbursementCard } from '@/components/timesheets/ExpenseReimbursementCard';
import { ProductivityRatingCard } from '@/components/timesheets/ProductivityRatingCard';
import { AdditionalCommentsCard } from '@/components/timesheets/AdditionalCommentsCard';
import { AttachmentsSection, AttachmentItemData } from '@/components/timesheets/AttachmentsSection';
import { ProjectPickerModal } from '@/components/timesheets/ProjectPickerModal';
import { AttachmentActionSheet } from '@/components/timesheets/AttachmentActionSheet';
import { CustomAlertDialog, CustomAlertState } from '@/components/timesheets/CustomAlertDialog';

const INITIAL_DAYS: { dayOfWeek: DayOfWeek; label: string }[] = [
  { dayOfWeek: 'SUNDAY', label: 'Sunday (Start of Week)' },
  { dayOfWeek: 'MONDAY', label: 'Monday' },
  { dayOfWeek: 'TUESDAY', label: 'Tuesday' },
  { dayOfWeek: 'WEDNESDAY', label: 'Wednesday' },
  { dayOfWeek: 'THURSDAY', label: 'Thursday' },
  { dayOfWeek: 'FRIDAY', label: 'Friday' },
  { dayOfWeek: 'SATURDAY', label: 'Saturday (End of Week)' },
];

export default function NewTimesheetScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';
  const { user } = useAuthStore();

  // Split user name into First and Last Name
  const initialFirstName = useMemo(() => {
    if (!user?.name) return '';
    const parts = user.name.trim().split(' ');
    return parts[0] || '';
  }, [user]);

  const initialLastName = useMemo(() => {
    if (!user?.name) return '';
    const parts = user.name.trim().split(' ');
    return parts.slice(1).join(' ') || '';
  }, [user]);

  // Form Header State
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [email, setEmail] = useState(user?.email || '');

  // Calculate current week Sunday to Saturday
  const defaultDates = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday
    const start = new Date(now);
    start.setDate(now.getDate() - currentDay);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const format = (d: Date) => {
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${yyyy}-${mm}-${dd}`;
    };

    return {
      start: format(start),
      end: format(end),
    };
  }, []);

  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);

  // Projects state
  const [projects, setProjects] = useState<MobileProject[]>([]);
  const [, setIsProjectsLoading] = useState(true);

  // 7-Day Entries State
  const [days, setDays] = useState<DayFormState[]>(
    INITIAL_DAYS.map((d, i) => ({
      dayOfWeek: d.dayOfWeek,
      label: d.label,
      isExpanded: i >= 1 && i <= 5, // Expand Mon-Fri by default
      startTime: i >= 1 && i <= 5 ? '08:00' : '',
      finishTime: i >= 1 && i <= 5 ? '16:30' : '',
      breakMinutes: i >= 1 && i <= 5 ? 30 : 0,
      projectId: '',
      notes: '',
    })),
  );

  // Additional Questions State
  const [expenseReimbursement, setExpenseReimbursement] = useState(false);
  const [productivityScore, setProductivityScore] = useState<number | null>(null);
  const [comments, setComments] = useState('');

  // Attachments State
  const [attachments, setAttachments] = useState<AttachmentItemData[]>([]);

  // Project Picker Modal State
  const [activeDayIndexForProject, setActiveDayIndexForProject] = useState<number | null>(null);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');

  // Custom Modals & Action Sheet State
  const [isAttachmentSheetVisible, setIsAttachmentSheetVisible] = useState(false);
  const [customAlert, setCustomAlert] = useState<CustomAlertState>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'error' | 'warning' | 'confirm' = 'info',
    onConfirm?: () => void,
    confirmText: string = 'OK',
    cancelText?: string,
  ) => {
    setCustomAlert({
      visible: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      onConfirm,
    });
  };

  const filteredProjects = useMemo(() => {
    if (!projectSearchQuery.trim()) return projects;
    const q = projectSearchQuery.toLowerCase();
    return projects.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.year && p.year.toString().includes(q)),
    );
  }, [projects, projectSearchQuery]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Employee info section collapsed by default (pre-filled data)
  const [isEmployeeInfoExpanded, setIsEmployeeInfoExpanded] = useState(false);

  // Load live company projects
  useEffect(() => {
    fetchLiveProjects()
      .then((p) => {
        setProjects(p);
      })
      .catch((err) => console.warn('Error loading projects:', err))
      .finally(() => setIsProjectsLoading(false));
  }, []);

  // Time parsing helper
  const parseTimeToMins = (str?: string) => {
    if (!str) return null;
    const parts = str.split(':');
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };

  // Calculate day hours
  const getDayHours = (day: DayFormState): number => {
    const sMins = parseTimeToMins(day.startTime);
    const fMins = parseTimeToMins(day.finishTime);
    if (sMins !== null && fMins !== null && fMins > sMins) {
      const net = Math.max(0, fMins - sMins - (day.breakMinutes || 0));
      return Math.round((net / 60) * 10) / 10;
    }
    return 0;
  };

  // Total Week Hours
  const totalWeekHours = useMemo(() => {
    return days.reduce((sum, d) => sum + getDayHours(d), 0);
  }, [days]);

  // Update specific day field
  const updateDay = (index: number, updates: Partial<DayFormState>) => {
    setDays((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  // Toggle Day Expand
  const toggleExpand = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateDay(index, { isExpanded: !days[index].isExpanded });
  };

  // Take photo with camera
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showAlert('Permission Required', 'Camera permission is needed to take a photo.', 'warning');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const filename = asset.fileName || `photo_${Date.now()}.jpg`;
        setAttachments((prev) => [
          ...prev,
          {
            uri: asset.uri,
            name: filename,
            type: asset.mimeType || 'image/jpeg',
            size: asset.fileSize,
          },
        ]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: any) {
      showAlert('Camera Error', e.message || 'Could not launch camera', 'error');
    }
  };

  const handlePickImageFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const filename = asset.fileName || `image_${Date.now()}.jpg`;
        setAttachments((prev) => [
          ...prev,
          {
            uri: asset.uri,
            name: filename,
            type: asset.mimeType || 'image/jpeg',
            size: asset.fileSize,
          },
        ]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: any) {
      showAlert('Upload Error', e.message || 'Could not pick image', 'error');
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        const file = result.assets[0];
        setAttachments((prev) => [
          ...prev,
          {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/pdf',
            size: file.size,
          },
        ]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: any) {
      showAlert('Upload Error', e.message || 'Could not pick file', 'error');
    }
  };

  // Trigger attachment source sheet
  const handleUploadFile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAttachmentSheetVisible(true);
  };

  const removeAttachment = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (isDraft: boolean = false) => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      showAlert('Missing Info', 'Please enter employee first name, last name, and email.', 'warning');
      return;
    }

    if (!startDate || !endDate) {
      showAlert('Missing Dates', 'Please specify the week start and end dates.', 'warning');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

    try {
      const formattedEntries = days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        startTime: d.startTime || undefined,
        finishTime: d.finishTime || undefined,
        breakMinutes: d.breakMinutes || 0,
        hoursWorked: getDayHours(d),
        projectId: d.projectId || undefined,
        notes: d.notes || undefined,
      }));

      await submitTimesheet(
        {
          employeeFirstName: firstName.trim(),
          employeeLastName: lastName.trim(),
          employeeEmail: email.trim(),
          weekStartDate: startDate,
          weekEndDate: endDate,
          status: isDraft ? 'DRAFT' : 'PENDING',
          expenseReimbursement,
          productivityScore: productivityScore || undefined,
          comments: comments.trim() || undefined,
          entries: formattedEntries,
        },
        attachments,
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert(
        isDraft ? 'Draft Saved' : 'Timesheet Submitted',
        isDraft
          ? 'Your timesheet draft has been saved.'
          : 'Your weekly timesheet has been submitted to your supervisor for review.',
        'success',
        () => router.replace('/(app)/(tabs)/timesheets' as any),
        'View Timesheets',
      );
    } catch (err: any) {
      showAlert('Submission Error', err.message || 'Failed to submit timesheet.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear Form
  const handleClearForm = () => {
    showAlert(
      'Clear Form',
      'Are you sure you want to reset all entered timesheet values?',
      'confirm',
      () => {
        setDays(
          INITIAL_DAYS.map((d) => ({
            dayOfWeek: d.dayOfWeek,
            label: d.label,
            isExpanded: false,
            startTime: '',
            finishTime: '',
            breakMinutes: 0,
            projectId: '',
            notes: '',
          })),
        );
        setExpenseReimbursement(false);
        setProductivityScore(null);
        setComments('');
        setAttachments([]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      },
      'Clear All',
      'Cancel',
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Navigation Bar */}
      <View style={[styles.navHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}
        >
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>Weekly Time Sheet</Text>
        <View style={styles.totalBadge}>
          <Clock size={12} color="#ffffff" />
          <Text style={styles.totalBadgeText}>{totalWeekHours.toFixed(1)}h</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brief Header Banner */}
        <View style={styles.headerBanner}>
          <Text style={[styles.mainHeading, { color: colors.text }]}>
            Log Your Hours
          </Text>
          <Text style={[styles.subHeading, { color: colors.muted }]}>
            Enter daily hours, assign projects, and submit for approval.
          </Text>
        </View>

        {/* ── Section 1: Employee Info Card ── */}
        <EmployeeInfoCard
          firstName={firstName}
          setFirstName={setFirstName}
          lastName={lastName}
          setLastName={setLastName}
          email={email}
          setEmail={setEmail}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          isEmployeeInfoExpanded={isEmployeeInfoExpanded}
          setIsEmployeeInfoExpanded={setIsEmployeeInfoExpanded}
          colors={colors}
          isDark={isDark}
        />

        {/* ── Section 2: Daily Hours & Project Selection Section ── */}
        <DailyHoursSection
          days={days}
          totalWeekHours={totalWeekHours}
          projects={projects}
          getDayHours={getDayHours}
          toggleExpand={toggleExpand}
          updateDay={updateDay}
          setActiveDayIndexForProject={setActiveDayIndexForProject}
          colors={colors}
          isDark={isDark}
        />

        {/* ── Section 3: Expense Reimbursement Card ── */}
        <ExpenseReimbursementCard
          expenseReimbursement={expenseReimbursement}
          setExpenseReimbursement={setExpenseReimbursement}
          colors={colors}
          isDark={isDark}
        />

        {/* ── Section 4: Productivity Rating Card ── */}
        <ProductivityRatingCard
          productivityScore={productivityScore}
          setProductivityScore={setProductivityScore}
          colors={colors}
          isDark={isDark}
        />

        {/* ── Section 5: Additional Comments Card ── */}
        <AdditionalCommentsCard
          comments={comments}
          setComments={setComments}
          colors={colors}
          isDark={isDark}
        />

        {/* ── Section 6: Attachments Section ── */}
        <AttachmentsSection
          attachments={attachments}
          handleTakePhoto={handleTakePhoto}
          handleUploadFile={handleUploadFile}
          removeAttachment={removeAttachment}
          colors={colors}
          isDark={isDark}
        />

        {/* ── Form Actions: Submit, Save Draft, Clear ── */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={() => handleSubmit(false)}
            disabled={isSubmitting}
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <CheckCircle2 size={18} color="#ffffff" />
                <Text style={styles.submitButtonText}>Submit Timesheet</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity
              onPress={() => handleSubmit(true)}
              disabled={isSubmitting}
              style={[styles.draftButton, { borderColor: colors.cardBorder }]}
            >
              <Text style={[styles.draftButtonText, { color: colors.text }]}>Save Draft</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClearForm}
              disabled={isSubmitting}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>Clear Form</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ── Custom Project Selector Bottom Sheet ── */}
      <ProjectPickerModal
        activeDayIndexForProject={activeDayIndexForProject}
        setActiveDayIndexForProject={setActiveDayIndexForProject}
        projectSearchQuery={projectSearchQuery}
        setProjectSearchQuery={setProjectSearchQuery}
        filteredProjects={filteredProjects}
        days={days}
        updateDay={updateDay}
        colors={colors}
        isDark={isDark}
      />

      {/* ── Custom Attachment Source Action Sheet ── */}
      <AttachmentActionSheet
        isAttachmentSheetVisible={isAttachmentSheetVisible}
        setIsAttachmentSheetVisible={setIsAttachmentSheetVisible}
        handleTakePhoto={handleTakePhoto}
        handlePickImageFromLibrary={handlePickImageFromLibrary}
        handlePickDocument={handlePickDocument}
        colors={colors}
        isDark={isDark}
      />

      {/* ── Custom Styled Dialog Alert Modal ── */}
      <CustomAlertDialog
        customAlert={customAlert}
        setCustomAlert={setCustomAlert}
        colors={colors}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navHeader: {
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
  navTitle: {
    ...Typography.headline,
    fontWeight: '700',
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#155B9D',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  totalBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
    gap: 16,
  },
  headerBanner: {
    marginBottom: 4,
  },
  mainHeading: {
    ...Typography.title2,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subHeading: {
    ...Typography.subheadline,
    lineHeight: 20,
  },
  actionsContainer: {
    gap: 10,
    marginTop: 8,
  },
  submitButton: {
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
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  draftButton: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  draftButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  clearButtonText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
  },
});
