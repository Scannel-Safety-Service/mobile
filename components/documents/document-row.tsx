import React, { memo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography } from '@/constants/theme';

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
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
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
          backgroundColor: isDark ? 'rgba(8,23,41,0.7)' : 'rgba(255,255,255,0.85)',
          borderColor: isDark ? 'rgba(15,39,64,0.5)' : 'rgba(226,239,250,0.8)',
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(61,22,25,0.6)' : '#fef2f2' }]}>
          <Ionicons name="document-text" size={22} color="#ef4444" />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={12} color={colors.muted} />
            <Text style={[styles.date, { color: colors.muted }]}>
              {formattedDate}
            </Text>
          </View>
        </View>
      </View>
      <View style={[styles.viewBadge, { backgroundColor: isDark ? 'rgba(86,185,255,0.1)' : 'rgba(21,91,157,0.06)' }]}>
        <Ionicons name="eye-outline" size={16} color={colors.primary} />
      </View>
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
    borderRadius: 18,
    borderCurve: 'continuous',
    marginVertical: 5,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 5,
  },
  title: {
    ...Typography.subheadline,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    ...Typography.caption1,
    fontWeight: '500',
  },
  viewBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
