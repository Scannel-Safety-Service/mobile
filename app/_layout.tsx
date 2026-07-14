import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/auth-store';
import { Colors } from '@/constants/theme';

export const unstable_settings = {
  // Prevent back-navigation to the splash loader after the app is mounted
  initialRouteName: 'index',
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { status, initialize } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  // Bootstrap — read stored tokens and restore session on app launch
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Reactive auth guard — redirect based on authentication state
  useEffect(() => {
    // Wait until we have a definitive status
    if (status === 'idle' || status === 'loading') return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (status === 'authenticated' && (inAuthGroup || (!inAppGroup && segments.length > 0))) {
      router.replace('/(app)/(tabs)');
    }
  }, [status, segments, router]);

  // Full-screen loader during bootstrap only — NOT during login form submission
  if (status === 'idle' || status === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Slot />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return <RootLayoutContent />;
}
