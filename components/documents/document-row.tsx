import React, { memo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface DocumentRowProps {
  id: string;
  title: string | null;
  fileName: string;
  createdAt: string;
  onPress: (id: string, fileName: string) => void;
}

// Hoist date formatter to module scope to avoid re-creation in render calls
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export const DocumentRow = memo(function DocumentRow({
  id,
  title,
  fileName,
  createdAt,
  onPress,
}: DocumentRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(id, fileName);
  };

  const displayName = title || fileName;
  const formattedDate = dateFormatter.format(new Date(createdAt));

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: isDark ? '#3d1619' : '#fef2f2' }]}>
          <Ionicons name="document-text" size={24} color="#ef4444" />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.date, { color: colors.muted }]}>
            Uploaded {formattedDate}
          </Text>
        </View>
      </View>
      <Ionicons name="eye-outline" size={18} color={colors.primary} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
    borderRadius: 16,
    borderCurve: 'continuous',
    marginVertical: 6,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.01)',
  },
  pressed: {
    opacity: 0.85,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
  date: {
    fontSize: 11,
    fontWeight: '500',
  },
});
