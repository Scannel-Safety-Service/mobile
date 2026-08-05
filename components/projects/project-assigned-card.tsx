import React, { memo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import {
  Briefcase,
  ChevronRight,
  Folder,
  AlertCircle,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography } from '@/constants/theme';

interface ProjectAssignedCardProps {
  id: string;
  name: string;
  year?: number;
  totalDocs: number;
  pendingCount: number;
  signedCount: number;
  folders: string[];
  onPress: () => void;
}

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 260,
  mass: 0.5,
};

export const ProjectAssignedCard = memo(function ProjectAssignedCard({
  name,
  year,
  totalDocs,
  pendingCount,
  signedCount,
  folders,
  onPress,
}: ProjectAssignedCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];

  const pressProgress = useSharedValue(0);

  const handlePressIn = () => {
    pressProgress.value = withSpring(1, SPRING_CONFIG);
  };

  const handlePressOut = () => {
    pressProgress.value = withSpring(0, SPRING_CONFIG);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: 1 - pressProgress.value * 0.025 }],
    };
  });

  const cardBg = isDark ? 'rgba(12, 28, 48, 0.75)' : 'rgba(255, 255, 255, 0.9)';
  const cardBorder = pendingCount > 0
    ? (isDark ? 'rgba(244, 63, 94, 0.35)' : 'rgba(244, 63, 94, 0.25)')
    : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(226, 232, 240, 0.9)');

  const iconBg = isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)';

  return (
    <Animated.View
      style={[
        styles.animatedWrapper,
        {
          boxShadow: isDark
            ? '0 10px 30px rgba(0, 0, 0, 0.35)'
            : '0 8px 24px rgba(21, 91, 157, 0.07)',
        },
        animatedCardStyle,
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor: cardBorder,
          },
        ]}
      >
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.leftInfo}>
            <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
              <Briefcase size={22} color="#3b82f6" strokeWidth={2.2} />
            </View>
            <View style={styles.titleContainer}>
              <View style={styles.titleWithBadge}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                  {name}
                </Text>
                {!!year && (
                  <View style={[styles.yearBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(59, 130, 246, 0.1)' }]}>
                    <Text style={styles.yearText}>{year}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.docSummaryText, { color: colors.muted }]}>
                {totalDocs} assigned document{totalDocs === 1 ? '' : 's'}
              </Text>
            </View>
          </View>
        </View>

        {/* Summary Tags */}
        <View style={styles.middleRow}>
          <View style={styles.signedPill}>
            <FileCheck2 size={13} color={colors.muted} />
            <Text style={[styles.signedPillText, { color: colors.muted }]}>
              {signedCount}/{totalDocs} Complete
            </Text>
          </View>
        </View>

        {/* Folder Tags Preview */}
        {folders.length > 0 && (
          <View style={styles.folderListRow}>
            {folders.slice(0, 3).map((folderName, index) => (
              <View
                key={index}
                style={[
                  styles.folderTag,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(241, 245, 249, 0.8)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.7)',
                  },
                ]}
              >
                <Folder size={12} color="#3b82f6" />
                <Text style={[styles.folderTagText, { color: isDark ? '#cbd5e1' : '#475569' }]} numberOfLines={1}>
                  {folderName}
                </Text>
              </View>
            ))}
            {folders.length > 3 && (
              <Text style={[styles.moreFoldersText, { color: colors.muted }]}>
                +{folders.length - 3} more
              </Text>
            )}
          </View>
        )}

        {/* Card Footer Divider & Action */}
        <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(241, 245, 249, 0.9)' }]}>
          <Text style={[styles.footerText, { color: colors.primary }]}>
            View Assigned Documents
          </Text>
          <ChevronRight size={16} color={colors.primary} strokeWidth={2.2} />
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  animatedWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
  },
  card: {
    borderWidth: 1.2,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    gap: 2,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    ...Typography.headline,
    fontWeight: '700',
    flexShrink: 1,
  },
  yearBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  yearText: {
    ...Typography.caption2,
    color: '#3b82f6',
    fontWeight: '700',
  },
  docSummaryText: {
    ...Typography.caption1,
    fontWeight: '500',
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {
    ...Typography.caption1,
    fontWeight: '700',
  },
  signedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  signedPillText: {
    ...Typography.caption1,
    fontWeight: '600',
  },
  folderListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  folderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  folderTagText: {
    ...Typography.caption2,
    fontWeight: '600',
  },
  moreFoldersText: {
    ...Typography.caption2,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    marginTop: 2,
  },
  footerText: {
    ...Typography.subheadline,
    fontWeight: '600',
  },
});
