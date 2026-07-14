import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

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
          fontWeight: '700',
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="[section]" />
      <Stack.Screen name="subfolder/[categoryId]" />
      <Stack.Screen name="viewer" options={{ title: 'View Document' }} />
      <Stack.Screen name="upload" options={{ title: 'Upload Document', presentation: 'modal' }} />
    </Stack>
  );
}
