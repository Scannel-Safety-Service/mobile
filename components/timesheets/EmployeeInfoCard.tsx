import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { User, Calendar, ChevronDown } from 'lucide-react-native';
import { Typography } from '@/constants/theme';

interface EmployeeInfoCardProps {
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  isEmployeeInfoExpanded: boolean;
  setIsEmployeeInfoExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  colors: any;
  isDark: boolean;
}

export const EmployeeInfoCard: React.FC<EmployeeInfoCardProps> = ({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isEmployeeInfoExpanded,
  setIsEmployeeInfoExpanded,
  colors,
  isDark,
}) => {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsEmployeeInfoExpanded((prev) => !prev);
        }}
        activeOpacity={0.7}
        style={styles.collapsibleHeader}
      >
        <View style={styles.collapsibleHeaderLeft}>
          <View
            style={[
              styles.collapsibleIcon,
              { backgroundColor: isDark ? 'rgba(86,185,255,0.15)' : 'rgba(21,91,157,0.08)' },
            ]}
          >
            <User size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
              Employee Info
            </Text>
            {!isEmployeeInfoExpanded && (
              <Text style={[styles.collapsibleSummary, { color: colors.muted }]} numberOfLines={1}>
                {firstName} {lastName} · {email}
              </Text>
            )}
          </View>
        </View>
        <ChevronDown
          size={18}
          color={colors.muted}
          style={{ transform: [{ rotate: isEmployeeInfoExpanded ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>

      {isEmployeeInfoExpanded && (
        <View style={styles.collapsibleBody}>
          {/* First Name & Last Name */}
          <View style={styles.rowFields}>
            <View style={styles.halfField}>
              <Text style={[styles.label, { color: colors.muted }]}>First Name</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                placeholderTextColor={isDark ? '#537599' : '#94a3b8'}
                style={[
                  styles.input,
                  { color: colors.text, borderColor: colors.cardBorder, backgroundColor: isDark ? '#0c1f35' : '#f8fafc' },
                ]}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={[styles.label, { color: colors.muted }]}>Last Name</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
                placeholderTextColor={isDark ? '#537599' : '#94a3b8'}
                style={[
                  styles.input,
                  { color: colors.text, borderColor: colors.cardBorder, backgroundColor: isDark ? '#0c1f35' : '#f8fafc' },
                ]}
              />
            </View>
          </View>

          {/* Employee Email */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="ex: myname@example.com"
              placeholderTextColor={isDark ? '#537599' : '#94a3b8'}
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.cardBorder, backgroundColor: isDark ? '#0c1f35' : '#f8fafc' },
              ]}
            />
          </View>

          {/* Week Start & End Dates */}
          <View style={styles.rowFields}>
            <View style={styles.halfField}>
              <Text style={[styles.label, { color: colors.muted }]}>Week Start</Text>
              <View
                style={[
                  styles.inputWithIcon,
                  { borderColor: colors.cardBorder, backgroundColor: isDark ? '#0c1f35' : '#f8fafc' },
                ]}
              >
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
              <Text style={[styles.label, { color: colors.muted }]}>Week End</Text>
              <View
                style={[
                  styles.inputWithIcon,
                  { borderColor: colors.cardBorder, backgroundColor: isDark ? '#0c1f35' : '#f8fafc' },
                ]}
              >
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
      )}
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
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  collapsibleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  collapsibleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsibleSummary: {
    fontSize: 12,
    marginTop: 2,
  },
  collapsibleBody: {
    paddingTop: 14,
    marginTop: 12,
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
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    ...Typography.caption1,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
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
});
