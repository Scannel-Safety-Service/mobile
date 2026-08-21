import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Typography } from '@/constants/theme';

interface ProductivityRatingCardProps {
  productivityScore: number | null;
  setProductivityScore: (score: number) => void;
  colors: any;
  isDark: boolean;
}

export const ProductivityRatingCard: React.FC<ProductivityRatingCardProps> = ({
  productivityScore,
  setProductivityScore,
  colors,
  isDark,
}) => {
  return (
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
  productivityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },
  scoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 14,
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
});
