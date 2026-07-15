import React, { memo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  Workflow,
  ClipboardList,
  Award,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography } from '@/constants/theme';

interface FolderCardProps {
  label: string;
  iconName: string;
  hasSubfolders: boolean;
  onPress: () => void;
}

const ICON_COMPONENTS: Record<string, React.ComponentType<any>> = {
  'shield-checkmark': ShieldCheck,
  'business': FileText,
  'warning': AlertTriangle,
  'clipboard': Workflow,
  'school': ClipboardList,
  'ribbon': Award,
};

const ACCENT_COLORS: Record<string, { lightBg: string; darkBg: string; iconColor: string }> = {
  'shield-checkmark': { lightBg: 'rgba(16, 185, 129, 0.08)', darkBg: 'rgba(16, 185, 129, 0.12)', iconColor: '#10b981' },
  'business': { lightBg: 'rgba(59, 130, 246, 0.08)', darkBg: 'rgba(59, 130, 246, 0.12)', iconColor: '#3b82f6' },
  'warning': { lightBg: 'rgba(245, 158, 11, 0.08)', darkBg: 'rgba(245, 158, 11, 0.12)', iconColor: '#f59e0b' },
  'clipboard': { lightBg: 'rgba(139, 92, 246, 0.08)', darkBg: 'rgba(139, 92, 246, 0.12)', iconColor: '#8b5cf6' },
  'school': { lightBg: 'rgba(236, 72, 153, 0.08)', darkBg: 'rgba(236, 72, 153, 0.12)', iconColor: '#ec4899' },
  'ribbon': { lightBg: 'rgba(244, 63, 94, 0.08)', darkBg: 'rgba(244, 63, 94, 0.12)', iconColor: '#f43f5e' },
};

// Spring configuration for tactile bounce
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 240,
  mass: 0.6,
};

export const FolderCard = memo(function FolderCard({
  label,
  iconName,
  onPress,
}: FolderCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];

  const IconComponent = ICON_COMPONENTS[iconName] || FileText;
  const accent = ACCENT_COLORS[iconName] || {
    lightBg: 'rgba(21, 91, 157, 0.06)',
    darkBg: 'rgba(86, 185, 255, 0.1)',
    iconColor: colors.primary,
  };

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
        { scale: 1 - pressProgress.value * 0.04 },
      ],
    };
  });

  const cardBg = isDark ? 'rgba(8, 23, 41, 0.65)' : 'rgba(255, 255, 255, 0.55)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.65)';
  const iconBoxBg = isDark ? accent.darkBg : accent.lightBg;

  return (
    <View style={styles.container}>
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
          {/* Glowing Circular Icon Box */}
          <View style={[styles.iconCircle, { backgroundColor: iconBoxBg }]}>
            <IconComponent size={26} color={accent.iconColor} strokeWidth={2} />
          </View>

          {/* Label */}
          <View style={styles.textContainer}>
            <Text style={[styles.label, { color: colors.text }]} numberOfLines={2}>
              {label}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '45%',
    aspectRatio: 1.0, // Make it a perfect clean square folder card
    position: 'relative',
  },
  animatedWrapper: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    borderWidth: 1.2,
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  label: {
    ...Typography.subheadline,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
});
