import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography } from '@/constants/theme';

export default function TimesheetsLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
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
      <Stack.Screen name="index" options={{ title: 'Timesheets' }} />
      <Stack.Screen name="new" options={{ title: 'New Timesheet' }} />
      <Stack.Screen name="[id]" options={{ title: 'Timesheet Details' }} />
    </Stack>
  );
}
