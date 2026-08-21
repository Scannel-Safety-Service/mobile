import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Typography } from '@/constants/theme';

interface ExpenseReimbursementCardProps {
  expenseReimbursement: boolean;
  setExpenseReimbursement: (val: boolean) => void;
  colors: any;
  isDark: boolean;
}

export const ExpenseReimbursementCard: React.FC<ExpenseReimbursementCardProps> = ({
  expenseReimbursement,
  setExpenseReimbursement,
  colors,
  isDark,
}) => {
  return (
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
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 48,
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
});
