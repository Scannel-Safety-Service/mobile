import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Briefcase, CheckCircle2, MinusCircle, Search, X } from 'lucide-react-native';
import { MobileProject } from '@/types/timesheets';
import { DayFormState } from './DailyHoursSection';

interface ProjectPickerModalProps {
  activeDayIndexForProject: number | null;
  setActiveDayIndexForProject: (index: number | null) => void;
  projectSearchQuery: string;
  setProjectSearchQuery: (query: string) => void;
  filteredProjects: MobileProject[];
  days: DayFormState[];
  updateDay: (index: number, updates: Partial<DayFormState>) => void;
  colors: any;
  isDark: boolean;
}

export const ProjectPickerModal: React.FC<ProjectPickerModalProps> = ({
  activeDayIndexForProject,
  setActiveDayIndexForProject,
  projectSearchQuery,
  setProjectSearchQuery,
  filteredProjects,
  days,
  updateDay,
  colors,
  isDark,
}) => {
  return (
    <Modal
      visible={activeDayIndexForProject !== null}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setProjectSearchQuery('');
        setActiveDayIndexForProject(null);
      }}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => {
          setProjectSearchQuery('');
          setActiveDayIndexForProject(null);
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.projectModalCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          {/* Grab Handle */}
          <View style={styles.grabHandleWrap}>
            <View style={[styles.grabHandle, { backgroundColor: isDark ? '#334155' : '#cbd5e1' }]} />
          </View>

          <View style={styles.projectModalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Briefcase size={20} color={colors.primary} />
              <Text style={[styles.projectModalTitle, { color: colors.text }]}>
                Select Allocated Project
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setProjectSearchQuery('');
                setActiveDayIndexForProject(null);
              }}
              style={styles.closeBtn}
            >
              <X size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Project Search Box */}
          <View
            style={[
              styles.modalSearchBox,
              { backgroundColor: isDark ? '#0c1f35' : '#f1f5f9', borderColor: colors.cardBorder },
            ]}
          >
            <Search size={16} color={colors.muted} />
            <TextInput
              value={projectSearchQuery}
              onChangeText={setProjectSearchQuery}
              placeholder="Search allocated projects..."
              placeholderTextColor={isDark ? '#537599' : '#94a3b8'}
              style={[styles.modalSearchInput, { color: colors.text }]}
            />
            {projectSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setProjectSearchQuery('')}>
                <X size={14} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={{ maxHeight: 340 }} keyboardShouldPersistTaps="handled">
            {/* None Project Option */}
            <TouchableOpacity
              key="none-project"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (activeDayIndexForProject !== null) {
                  updateDay(activeDayIndexForProject, { projectId: '' });
                }
                setProjectSearchQuery('');
                setActiveDayIndexForProject(null);
              }}
              style={[
                styles.projectOptionItem,
                {
                  borderBottomColor: isDark ? '#0f2740' : '#f1f5f9',
                },
              ]}
            >
              <MinusCircle size={18} color={colors.muted} />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.projectName,
                    {
                      color: colors.text,
                      fontWeight:
                        activeDayIndexForProject !== null &&
                        !days[activeDayIndexForProject]?.projectId
                          ? '700'
                          : '400',
                    },
                  ]}
                >
                  None Project
                </Text>
                <Text style={[styles.projectYear, { color: colors.muted }]}>
                  No specific project allocated
                </Text>
              </View>
              {activeDayIndexForProject !== null &&
                !days[activeDayIndexForProject]?.projectId && (
                  <CheckCircle2 size={16} color={colors.primary} />
                )}
            </TouchableOpacity>

            {filteredProjects.length === 0 && projectSearchQuery.trim().length > 0 ? (
              <Text style={[styles.noProjectsText, { color: colors.muted }]}>
                No projects matching "{projectSearchQuery}"
              </Text>
            ) : (
              filteredProjects.map((proj) => {
                const isSelected =
                  activeDayIndexForProject !== null &&
                  days[activeDayIndexForProject]?.projectId === proj.id;
                return (
                  <TouchableOpacity
                    key={proj.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (activeDayIndexForProject !== null) {
                        updateDay(activeDayIndexForProject, { projectId: proj.id });
                      }
                      setProjectSearchQuery('');
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
                      <Text
                        style={[
                          styles.projectName,
                          { color: colors.text, fontWeight: isSelected ? '700' : '400' },
                        ]}
                      >
                        {proj.name}
                      </Text>
                      {proj.year && (
                        <Text style={[styles.projectYear, { color: colors.muted }]}>
                          Year: {proj.year}
                        </Text>
                      )}
                    </View>
                    {isSelected && <CheckCircle2 size={16} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noProjectsText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
  grabHandleWrap: {
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 8,
  },
  grabHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  modalSearchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  projectOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  projectName: {
    fontSize: 15,
    fontWeight: '700',
  },
  projectYear: {
    fontSize: 12,
  },
});
