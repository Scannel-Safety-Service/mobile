import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Briefcase, ChevronDown } from 'lucide-react-native';
import { Typography } from '@/constants/theme';
import { DayOfWeek, MobileProject } from '@/types/timesheets';

export interface DayFormState {
  dayOfWeek: DayOfWeek;
  label: string;
  isExpanded: boolean;
  startTime: string;
  finishTime: string;
  breakMinutes: number;
  projectId: string;
  notes: string;
}

export const BREAK_OPTIONS = [
  { label: '0 min', value: 0 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
];

interface DailyHoursSectionProps {
  days: DayFormState[];
  totalWeekHours: number;
  projects: MobileProject[];
  getDayHours: (day: DayFormState) => number;
  toggleExpand: (index: number) => void;
  updateDay: (index: number, updates: Partial<DayFormState>) => void;
  setActiveDayIndexForProject: (index: number) => void;
  colors: any;
  isDark: boolean;
}

export const DailyHoursSection: React.FC<DailyHoursSectionProps> = ({
  days,
  totalWeekHours,
  projects,
  getDayHours,
  toggleExpand,
  updateDay,
  setActiveDayIndexForProject,
  colors,
  isDark,
}) => {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.sectionHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 2 }]}>
            Daily Hours
          </Text>
          <Text style={[styles.sectionSub, { color: colors.muted }]}>
            Set times & projects per day
          </Text>
        </View>
        <View style={styles.weekTotalPill}>
          <Text style={styles.weekTotalPillText}>{totalWeekHours.toFixed(1)}h</Text>
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
                  <View>
                    <Text style={[styles.dayLabel, { color: colors.text }]}>{day.label}</Text>
                    {selectedProj && !day.isExpanded && (
                      <Text style={[styles.dayMiniProject, { color: colors.muted }]} numberOfLines={1}>
                        {selectedProj.name} &bull; {day.startTime}-{day.finishTime}
                      </Text>
                    )}
                  </View>
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
                          {
                            color: colors.text,
                            borderColor: colors.cardBorder,
                            backgroundColor: isDark ? '#0c1f35' : '#f8fafc',
                          },
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
                          {
                            color: colors.text,
                            borderColor: colors.cardBorder,
                            backgroundColor: isDark ? '#0c1f35' : '#f8fafc',
                          },
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
                        {selectedProj ? selectedProj.name : 'None Project'}
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
  );
};

const styles = StyleSheet.create({
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
    ...Typography.headline,
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
  rowFields: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  halfField: {
    flex: 1,
  },
  fieldGroupSmall: {
    marginBottom: 8,
  },
  labelSmall: {
    ...Typography.caption2,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  inputSmall: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  breakOptionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  breakPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  projectSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    minHeight: 48,
  },
  projectSelectText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
});
