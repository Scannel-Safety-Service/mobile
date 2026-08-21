import React from 'react';
import { StyleSheet, View, Text, TextInput } from 'react-native';
import { Typography } from '@/constants/theme';

interface AdditionalCommentsCardProps {
  comments: string;
  setComments: (val: string) => void;
  colors: any;
  isDark: boolean;
}

export const AdditionalCommentsCard: React.FC<AdditionalCommentsCardProps> = ({
  comments,
  setComments,
  colors,
  isDark,
}) => {
  return (
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
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },
});
