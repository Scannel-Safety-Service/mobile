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
import { Colors } from '@/constants/theme';

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

// Spring configuration for premium tactile bounce
const SPRING_CONFIG = {
  damping: 16,
  stiffness: 220,
  mass: 0.8,
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

  // Reanimated shared value for tracking press interpolation
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

  // Smooth UI-thread spring transformation styles
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: pressProgress.value * 6 }, // smoothly sink down into the base plate
        { scale: 1 - pressProgress.value * 0.02 }, // scale down slightly for depth
      ],
    };
  });

  const textColor = isDark ? '#040e1a' : '#ffffff';
  const innerBoxBg = isDark ? '#040e1a' : '#ffffff';
  const iconColor = colors.primary;

  // Premium bevel highlights for light reflection on top cut-edges
  const topHighlight = isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.48)';
  const sideHighlight = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.2)';
  const bottomShadow = isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.25)';

  const baseDepthColor = isDark ? '#2b7cc1' : '#0e4170';

  return (
    <View style={styles.container}>
      {/* Static 3D Depth Shadow base plate */}
      <View style={[styles.basePlate, { backgroundColor: baseDepthColor }]} />

      {/* Reanimated Animated card container */}
      <Animated.View style={[styles.animatedWrapper, animatedCardStyle]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={[
            styles.card,
            {
              backgroundColor: colors.primary,
              // Apply multi-sided reflection borders for a glassy bevel effect
              borderTopColor: topHighlight,
              borderLeftColor: sideHighlight,
              borderRightColor: sideHighlight,
              borderBottomColor: bottomShadow,
            },
          ]}
        >
          {/* Glowing Icon Box */}
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: innerBoxBg,
                borderColor: isDark ? 'rgba(4, 14, 26, 0.12)' : 'rgba(255, 255, 255, 0.25)',
              },
            ]}
          >
            <IconComponent size={36} color={iconColor} strokeWidth={1.8} />
          </View>

          {/* Label */}
          <View style={styles.textContainer}>
            <Text style={[styles.label, { color: textColor }]} numberOfLines={2}>
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
    width: '47.5%',
    aspectRatio: 0.94,
    position: 'relative',
    marginVertical: 10,
  },
  basePlate: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    bottom: -6,
    borderRadius: 18,
  },
  animatedWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    // Soft high-fidelity card shadow using modern boxShadow syntax
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
  },
  card: {
    flex: 1,
    borderWidth: 1.2,
    borderRadius: 18,
    borderCurve: 'continuous',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    letterSpacing: -0.15,
    textAlign: 'center',
  },
});
