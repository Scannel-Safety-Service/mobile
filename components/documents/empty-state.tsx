import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography } from '@/constants/theme';

interface EmptyStateProps {
  title?: string;
  description?: string;
  iconName?: string;
}

export const EmptyState = memo(function EmptyState({
  title = 'No Documents Found',
  description = 'This folder does not contain any safety files yet.',
  iconName = 'folder-open-outline',
}: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(8, 23, 41, 0.4)' : 'rgba(255, 255, 255, 0.5)',
          borderColor: isDark ? 'rgba(15, 39, 64, 0.4)' : 'rgba(226, 239, 250, 0.7)',
        },
      ]}
    >
      <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(86, 185, 255, 0.08)' : 'rgba(21, 91, 157, 0.05)' }]}>
        <Ionicons name={iconName as any} size={36} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    marginHorizontal: 4,
    paddingVertical: 44,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    ...Typography.headline,
    textAlign: 'center',
    fontWeight: '700',
  },
  description: {
    ...Typography.subheadline,
    textAlign: 'center',
    lineHeight: 20,
  },
});
