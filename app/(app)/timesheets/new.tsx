import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import {
  Calendar,
  Clock,
  Briefcase,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  Trash2,
  ChevronLeft,
  Sparkles,
  FileText,
  Layers,
} from 'lucide-react-native';
import { Colors, Typography, Spacing, Radii } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/auth-store';
import {
  fetchLiveProjects,
  submitTimesheet,
} from '@/lib/timesheets-api';
import { DayOfWeek, MobileProject } from '@/types/timesheets';

interface DayFormState {
  dayOfWeek: DayOfWeek;
  label: string;
  isExpanded: boolean;
  startTime: string;
  finishTime: string;
  breakMinutes: number;
  projectId: string;
  notes: string;
}

const INITIAL_DAYS: { dayOfWeek: DayOfWeek; label: string }[] = [
  { dayOfWeek: 'SUNDAY', label: 'Sunday (Start of Week)' },
  { dayOfWeek: 'MONDAY', label: 'Monday' },
  { dayOfWeek: 'TUESDAY', label: 'Tuesday' },
  { dayOfWeek: 'WEDNESDAY', label: 'Wednesday' },
  { dayOfWeek: 'THURSDAY', label: 'Thursday' },
  { dayOfWeek: 'FRIDAY', label: 'Friday' },
  { dayOfWeek: 'SATURDAY', label: 'Saturday (End of Week)' },
];

const BREAK_OPTIONS = [
  { label: '0 min', value: 0 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
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
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);

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
  const [attachments, setAttachments] = useState<
    { uri: string; name: string; type: string; size?: number }[]
  >([]);

  // Project Picker Modal State
  const [activeDayIndexForProject, setActiveDayIndexForProject] = useState<number | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load live company projects
  useEffect(() => {
    fetchLiveProjects()
      .then((p) => {
        setProjects(p);
        if (p.length > 0) {
          // Pre-select first project for Mon-Fri
          setDays((prev) =>
            prev.map((d) => (d.startTime ? { ...d, projectId: p[0].id } : d)),
          );
        }
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
        Alert.alert('Permission Required', 'Camera permission is needed to take a photo.');
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
      Alert.alert('Camera Error', e.message || 'Could not launch camera');
    }
  };

  // Upload file / photo from library or documents
  const handleUploadFile = async () => {
    try {
      Alert.alert('Add Attachment', 'Choose the source for your attachment:', [
        {
          text: 'Photo Library',
          onPress: async () => {
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
            }
          },
        },
        {
          text: 'Document / File',
          onPress: async () => {
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
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } catch (e: any) {
      Alert.alert('Upload Error', e.message || 'Could not pick file');
    }
  };

  const removeAttachment = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (isDraft: boolean = false) => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert('Missing Info', 'Please enter employee first name, last name, and email.');
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert('Missing Dates', 'Please specify the week start and end dates.');
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
      Alert.alert(
        isDraft ? 'Draft Saved' : 'Timesheet Submitted',
        isDraft
          ? 'Your timesheet draft has been saved.'
          : 'Your weekly timesheet has been submitted to your supervisor for review.',
        [{ text: 'OK', onPress: () => router.replace('/(app)/timesheets' as any) }],
      );
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to submit timesheet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear Form
  const handleClearForm = () => {
    Alert.alert('Clear Form', 'Are you sure you want to reset all entered timesheet values?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: () => {
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
      },
    ]);
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
        {/* Title Header Banner */}
        <View style={styles.headerBanner}>
          <Text style={[styles.mainHeading, { color: colors.text }]}>
            EMPLOYEE WEEKLY TIME SHEET
          </Text>
          <Text style={[styles.subHeading, { color: colors.muted }]}>
            Record daily hours worked, select company projects, and submit for supervisor approval.
          </Text>
        </View>

        {/* ── Section 1: Employee Information ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Employee Information</Text>

          {/* First Name & Last Name */}
          <View style={styles.rowFields}>
            <View style={styles.halfField}>
              <Text style={[styles.label, { color: colors.muted }]}>First Name</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                placeholderTextColor={isDark ? '#537599' : '#94a3b8'}
                style={[styles.input, { color: colors.text, borderColor: colors.cardBorder, backgroundColor: isDark ? '#0c1f35' : '#f8fafc' }]}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={[styles.label, { color: colors.muted }]}>Last Name</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
                placeholderTextColor={isDark ? '#537599' : '#94a3b8'}
                style={[styles.input, { color: colors.text, borderColor: colors.cardBorder, backgroundColor: isDark ? '#0c1f35' : '#f8fafc' }]}
              />
            </View>
          </View>

          {/* Employee Email */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Employee Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="ex: myname@example.com"
              placeholderTextColor={isDark ? '#537599' : '#94a3b8'}
              style={[styles.input, { color: colors.text, borderColor: colors.cardBorder, backgroundColor: isDark ? '#0c1f35' : '#f8fafc' }]}
            />
          </View>

          {/* Week Start & End Dates */}
          <View style={styles.rowFields}>
            <View style={styles.halfField}>
              <Text style={[styles.label, { color: colors.muted }]}>Start Date of The Week</Text>
              <View style={[styles.inputWithIcon, { borderColor: colors.cardBorder, backgroundColor: isDark ? '#0c1f35' : '#f8fafc' }]}>
                <Calendar size={16} color={colors.primary} />
                <TextInput
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={isDark ? '#537599' : '#94a3b8'}
                  style={[styles.inputInner, { color: colors.text }]}
                />
              </View>
            </View>
            <View style={styles.halfField}>
              <Text style={[styles.label, { color: colors.muted }]}>End Date of The Week</Text>
              <View style={[styles.inputWithIcon, { borderColor: colors.cardBorder, backgroundColor: isDark ? '#0c1f35' : '#f8fafc' }]}>
                <Calendar size={16} color={colors.primary} />
                <TextInput
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={isDark ? '#537599' : '#94a3b8'}
                  style={[styles.inputInner, { color: colors.text }]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* ── Section 2: 7-Day Hours & Live Project Selection ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeaderRow}>
            <div>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 2 }]}>
                Total Hours You Worked Each Day
              </Text>
              <Text style={[styles.sectionSub, { color: colors.muted }]}>
                Enter start/finish times and assign projects per day
              </Text>
            </div>
            <View style={styles.weekTotalPill}>
              <Text style={styles.weekTotalPillText}>{totalWeekHours.toFixed(1)} hrs total</Text>
            </View>
          </View>

          {/* Daily Entries Accordion Cards */}
          <View style={styles.daysContainer}>
            {days.map((day, idx) => {
              const dayHours = getDayHours(day);
              const selectedProj = projects.find((p) => p.id === day.projectId);

              return (
                <View
                  key={day.dayOfWeek}
                  style={[
                    styles.dayCard,
                    {
                      borderColor: day.isExpanded ? colors.primary : colors.cardBorder,
                      backgroundColor: isDark ? '#081729' : '#ffffff',
                    },
                  ]}
                >
                  {/* Day Header Bar */}
                  <TouchableOpacity
                    onPress={() => toggleExpand(idx)}
                    activeOpacity={0.7}
                    style={styles.dayCardHeader}
                  >
                    <View style={styles.dayHeaderLeft}>
                      <View
                        style={[
                          styles.dayIndicator,
                          {
                            backgroundColor:
                              dayHours > 0
                                ? isDark
                                  ? 'rgba(86,185,255,0.2)'
                                  : 'rgba(21,91,157,0.12)'
                                : isDark
                                ? '#0f2740'
                                : '#f1f5f9',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayIndicatorText,
                            { color: dayHours > 0 ? colors.primary : colors.muted },
                          ]}
                        >
                          {day.dayOfWeek.slice(0, 3)}
                        </Text>
                      </View>
                      <div>
                        <Text style={[styles.dayLabel, { color: colors.text }]}>{day.label}</Text>
                        {selectedProj && !day.isExpanded && (
                          <Text style={[styles.dayMiniProject, { color: colors.muted }]} numberOfLines={1}>
                            {selectedProj.name} &bull; {day.startTime}-{day.finishTime}
                          </Text>
                        )}
                      </div>
                    </View>

                    <View style={styles.dayHeaderRight}>
                      <View
                        style={[
                          styles.dayHoursBadge,
                          {
                            backgroundColor:
                              dayHours > 0
                                ? isDark
                                  ? 'rgba(16,185,129,0.2)'
                                  : '#ecfdf5'
                                : isDark
                                ? '#0f2740'
                                : '#f8fafc',
                            borderColor: dayHours > 0 ? '#10b981' : colors.cardBorder,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayHoursText,
                            { color: dayHours > 0 ? '#10b981' : colors.muted },
                          ]}
                        >
                          {dayHours.toFixed(1)} hrs
                        </Text>
                      </View>
                      <ChevronDown
                        size={18}
                        color={colors.muted}
                        style={{ transform: [{ rotate: day.isExpanded ? '180deg' : '0deg' }] }}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Inputs */}
                  {day.isExpanded && (
                    <View style={styles.dayExpandedBody}>
                      {/* Start Time & Finish Time */}
                      <View style={styles.rowFields}>
                        <View style={styles.halfField}>
                          <Text style={[styles.labelSmall, { color: colors.muted }]}>Start Time</Text>
                          <TextInput
                            value={day.startTime}
                            onChangeText={(t) => updateDay(idx, { startTime: t })}
                            placeholder="08:00"
                            placeholderTextColor={isDark ? '#537599' : '#94a3b8'}
                            style={[
                              styles.inputSmall,
                              { color: colors.text, borderColor: colors.cardBorder, backgroundColor: isDark ? '#0c1f35' : '#f8fafc' },
                            ]}
                          />
                        </View>
                        <View style={styles.halfField}>
                          <Text style={[styles.labelSmall, { color: colors.muted }]}>Finish Time</Text>
                          <TextInput
                            value={day.finishTime}
                            onChangeText={(t) => updateDay(idx, { finishTime: t })}
                            placeholder="16:30"
                            placeholderTextColor={isDark ? '#537599' : '#94a3b8'}
                            style={[
                              styles.inputSmall,
                              { color: colors.text, borderColor: colors.cardBorder, backgroundColor: isDark ? '#0c1f35' : '#f8fafc' },
                            ]}
                          />
                        </View>
                      </View>

                      {/* Breaks Taken Selector */}
                      <View style={styles.fieldGroupSmall}>
                        <Text style={[styles.labelSmall, { color: colors.muted }]}>Breaks Taken</Text>
                        <View style={styles.breakOptionsRow}>
                          {BREAK_OPTIONS.map((opt) => (
                            <TouchableOpacity
                              key={opt.value}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                updateDay(idx, { breakMinutes: opt.value });
                              }}
                              style={[
                                styles.breakPill,
                                {
                                  backgroundColor:
                                    day.breakMinutes === opt.value
                                      ? colors.primary
                                      : isDark
                                      ? '#0c1f35'
                                      : '#f1f5f9',
                                  borderColor:
                                    day.breakMinutes === opt.value
                                      ? colors.primary
                                      : colors.cardBorder,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.breakPillText,
                                  {
                                    color:
                                      day.breakMinutes === opt.value
                                      ? '#ffffff'
                                      : colors.muted,
                                  },
                                ]}
                              >
                                {opt.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {/* Live Project Selection Dropdown */}
                      <View style={styles.fieldGroupSmall}>
                        <Text style={[styles.labelSmall, { color: colors.muted }]}>Project</Text>
                        <TouchableOpacity
                          onPress={() => setActiveDayIndexForProject(idx)}
                          style={[
                            styles.projectSelectBtn,
                            {
                              borderColor: colors.cardBorder,
                              backgroundColor: isDark ? '#0c1f35' : '#f8fafc',
                            },
                          ]}
                        >
                          <Briefcase size={16} color={colors.primary} />
                          <Text
                            style={[
                              styles.projectSelectText,
                              { color: selectedProj ? colors.text : colors.muted },
                            ]}
                            numberOfLines={1}
                          >
                            {selectedProj ? selectedProj.name : 'Select active company project...'}
                          </Text>
                          <ChevronDown size={16} color={colors.muted} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Section 3: Expense Reimbursement Request ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
            Will You Submit an Expense Reimbursement Request?
          </Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setExpenseReimbursement(false);
              }}
              style={[
                styles.radioItem,
                {
                  backgroundColor: !expenseReimbursement
                    ? isDark
                      ? 'rgba(86,185,255,0.15)'
                      : '#eff6ff'
                    : isDark
                    ? '#0c1f35'
                    : '#f8fafc',
                  borderColor: !expenseReimbursement ? colors.primary : colors.cardBorder,
                },
              ]}
            >
              <View
                style={[
                  styles.radioCircle,
                  { borderColor: !expenseReimbursement ? colors.primary : colors.muted },
                ]}
              >
                {!expenseReimbursement && (
                  <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <Text style={[styles.radioLabel, { color: colors.text }]}>No</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setExpenseReimbursement(true);
              }}
              style={[
                styles.radioItem,
                {
                  backgroundColor: expenseReimbursement
                    ? isDark
                      ? 'rgba(86,185,255,0.15)'
                      : '#eff6ff'
                    : isDark
                    ? '#0c1f35'
                    : '#f8fafc',
                  borderColor: expenseReimbursement ? colors.primary : colors.cardBorder,
                },
              ]}
            >
              <View
                style={[
                  styles.radioCircle,
                  { borderColor: expenseReimbursement ? colors.primary : colors.muted },
                ]}
              >
                {expenseReimbursement && (
                  <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <Text style={[styles.radioLabel, { color: colors.text }]}>Yes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Section 4: Productivity Rating (1 - 10) ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Evaluate Your Productivity This Week (Optional)
          </Text>
          <Text style={[styles.sectionSub, { color: colors.muted, marginBottom: 14 }]}>
            Rate your overall work efficiency and project completion from 1 to 10
          </Text>

          {/* 10 Pill Rating Scale */}
          <View style={styles.productivityRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
              const isSelected = productivityScore === score;
              return (
                <TouchableOpacity
                  key={score}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setProductivityScore(score);
                  }}
                  style={[
                    styles.scoreCircle,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : isDark
                        ? '#0c1f35'
                        : '#f8fafc',
                      borderColor: isSelected ? colors.primary : colors.cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.scoreText,
                      { color: isSelected ? '#ffffff' : colors.text },
                    ]}
                  >
                    {score}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.ratingLabelsRow}>
            <Text style={[styles.ratingEdgeText, { color: colors.muted }]}>Bad (1)</Text>
            <Text style={[styles.ratingEdgeText, { color: colors.muted }]}>Excellent (10)</Text>
          </View>
        </View>

        {/* ── Section 5: Additional Comments or Questions ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 10 }]}>
            Additional Comments or Questions (Optional)
          </Text>
          <TextInput
            value={comments}
            onChangeText={setComments}
            multiline
            numberOfLines={4}
            placeholder="Type any questions, notes, or details about this week..."
            placeholderTextColor={isDark ? '#537599' : '#94a3b8'}
            style={[
              styles.textArea,
              { color: colors.text, borderColor: colors.cardBorder, backgroundColor: isDark ? '#0c1f35' : '#f8fafc' },
            ]}
          />
        </View>

        {/* ── Section 6: Attachments (Upload or Take Picture) ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Is There Something You Need to Send? (Optional)
          </Text>
          <Text style={[styles.sectionSub, { color: colors.muted, marginBottom: 14 }]}>
            Worker can either upload a file or take a picture in this section
          </Text>

          {/* Upload Drop Zone / Action Buttons */}
          <View style={[styles.uploadBox, { borderColor: colors.primary, backgroundColor: isDark ? '#0c1f35' : '#f8fafc' }]}>
            <Upload size={32} color={colors.primary} style={{ marginBottom: 8 }} />
            <Text style={[styles.uploadBoxTitle, { color: colors.text }]}>Upload a File or Receipt</Text>
            <Text style={[styles.uploadBoxSub, { color: colors.muted, marginBottom: 14 }]}>
              Drag and drop files or select an option below
            </Text>

            <View style={styles.uploadActionsRow}>
              <TouchableOpacity onPress={handleTakePhoto} style={[styles.uploadBtn, { backgroundColor: colors.primary }]}>
                <Camera size={16} color="#ffffff" />
                <Text style={styles.uploadBtnText}>Take Picture</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUploadFile}
                style={[styles.uploadBtnOutline, { borderColor: colors.primary }]}
              >
                <FileText size={16} color={colors.primary} />
                <Text style={[styles.uploadBtnOutlineText, { color: colors.primary }]}>Browse File</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Attached Files List */}
          {attachments.length > 0 && (
            <View style={styles.attachmentsList}>
              {attachments.map((att, i) => (
                <View
                  key={i}
                  style={[
                    styles.attachmentItem,
                    { borderColor: colors.cardBorder, backgroundColor: isDark ? '#081729' : '#ffffff' },
                  ]}
                >
                  <View style={styles.attachmentLeft}>
                    {att.type.startsWith('image/') ? (
                      <Image source={{ uri: att.uri }} style={styles.attThumbnail} />
                    ) : (
                      <View style={[styles.attIconWrap, { backgroundColor: isDark ? '#0c1f35' : '#f1f5f9' }]}>
                        <FileText size={18} color={colors.primary} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.attName, { color: colors.text }]} numberOfLines={1}>
                        {att.name}
                      </Text>
                      {att.size && (
                        <Text style={[styles.attSize, { color: colors.muted }]}>
                          {(att.size / 1024).toFixed(1)} KB
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => removeAttachment(i)} style={styles.attRemoveBtn}>
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

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

      {/* Project Selector Modal */}
      <Modal
        visible={activeDayIndexForProject !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveDayIndexForProject(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.projectModalCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.projectModalHeader}>
              <Text style={[styles.projectModalTitle, { color: colors.text }]}>
                Select Live Project
              </Text>
              <TouchableOpacity onPress={() => setActiveDayIndexForProject(null)} style={styles.closeBtn}>
                <X size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              {projects.length === 0 ? (
                <Text style={[styles.noProjectsText, { color: colors.muted }]}>
                  No active company projects found.
                </Text>
              ) : (
                projects.map((proj) => (
                  <TouchableOpacity
                    key={proj.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (activeDayIndexForProject !== null) {
                        updateDay(activeDayIndexForProject, { projectId: proj.id });
                      }
                      setActiveDayIndexForProject(null);
                    }}
                    style={[
                      styles.projectOptionItem,
                      {
                        borderBottomColor: isDark ? '#0f2740' : '#f1f5f9',
                      },
                    ]}
                  >
                    <Briefcase size={18} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.projectName, { color: colors.text }]}>{proj.name}</Text>
                      {proj.year && (
                        <Text style={[styles.projectYear, { color: colors.muted }]}>
                          Year: {proj.year}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  subHeading: {
    ...Typography.subheadline,
    lineHeight: 20,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    ...Typography.title3,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionSub: {
    ...Typography.footnote,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  weekTotalPill: {
    backgroundColor: 'rgba(21, 91, 157, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  weekTotalPillText: {
    color: '#155B9D',
    fontSize: 12,
    fontWeight: '700',
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  halfField: {
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldGroupSmall: {
    marginBottom: 8,
  },
  label: {
    ...Typography.caption1,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  labelSmall: {
    ...Typography.caption2,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputSmall: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  inputInner: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  daysContainer: {
    gap: 10,
  },
  dayCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dayIndicator: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayIndicatorText: {
    fontSize: 11,
    fontWeight: '800',
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  dayMiniProject: {
    fontSize: 11,
    marginTop: 2,
    maxWidth: 160,
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayHoursBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dayHoursText: {
    fontSize: 11,
    fontWeight: '800',
  },
  dayExpandedBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  breakOptionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  breakPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  projectSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  projectSelectText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  productivityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  scoreCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '800',
  },
  ratingLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  ratingEdgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBoxTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  uploadBoxSub: {
    fontSize: 12,
  },
  uploadActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  uploadBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  uploadBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  uploadBtnOutlineText: {
    fontSize: 12,
    fontWeight: '700',
  },
  attachmentsList: {
    marginTop: 12,
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  attachmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  attThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  attIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attName: {
    fontSize: 13,
    fontWeight: '600',
  },
  attSize: {
    fontSize: 11,
    marginTop: 1,
  },
  attRemoveBtn: {
    padding: 6,
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
    paddingVertical: 15,
    borderRadius: 16,
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
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  projectModalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 36,
  },
  projectModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  projectModalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  noProjectsText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
  projectOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  projectName: {
    fontSize: 15,
    fontWeight: '700',
  },
  projectYear: {
    fontSize: 12,
    marginTop: 2,
  },
});
