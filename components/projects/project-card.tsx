import React, { memo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Briefcase, ChevronRight, Folder } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography } from '@/constants/theme';

interface ProjectCardProps {
  id: string;
  name: string;
  year: number;
  onPress: () => void;
}

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 240,
  mass: 0.6,
};

export const ProjectCard = memo(function ProjectCard({
  name,
  year,
  onPress,
}: ProjectCardProps) {
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
      transform: [
        { scale: 1 - pressProgress.value * 0.03 },
      ],
    };
  });

  const cardBg = isDark ? 'rgba(8, 23, 41, 0.65)' : 'rgba(255, 255, 255, 0.65)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.75)';
  const iconBoxBg = isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)';

  return (
    <Animated.View
      style={[
        styles.animatedWrapper,
        {
          boxShadow: isDark ? '0 12px 36px rgba(0, 0, 0, 0.4)' : '0 12px 36px rgba(21, 91, 157, 0.06)',
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
        <View style={styles.cardHeader}>
          {/* Glowing Icon */}
          <View style={[styles.iconCircle, { backgroundColor: iconBoxBg }]}>
            <Briefcase size={24} color="#3b82f6" strokeWidth={2} />
          </View>

          {/* Year Badge */}
          <View style={[styles.yearBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }]}>
            <Text style={styles.yearText}>{year}</Text>
          </View>
        </View>

        {/* Project Name & Subtext */}
        <View style={styles.content}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
            {name}
          </Text>
          <View style={styles.footerRow}>
            <View style={styles.folderTag}>
              <Folder size={14} color={colors.muted} />
              <Text style={[styles.folderTagText, { color: colors.muted }]}>13 Pre-seeded Folders</Text>
            </View>
            <ChevronRight size={18} color={colors.muted} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  animatedWrapper: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 14,
  },
  card: {
    borderWidth: 1.2,
    borderRadius: 22,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  yearText: {
    ...Typography.caption1,
    color: '#3b82f6',
    fontWeight: '700',
  },
  content: {
    gap: 8,
  },
  name: {
    ...Typography.headline,
    fontWeight: '700',
    lineHeight: 22,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  folderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  folderTagText: {
    ...Typography.caption1,
    fontWeight: '600',
  },
});
