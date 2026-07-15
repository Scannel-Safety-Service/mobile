import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography } from '@/constants/theme';

export default function DocumentsLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          ...Typography.headline,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="[section]" />
      <Stack.Screen name="subfolder/[categoryId]" />
      <Stack.Screen name="upload" options={{ title: 'Upload Document', presentation: 'modal' }} />
    </Stack>
  );
}

