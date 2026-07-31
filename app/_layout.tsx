import React, { useEffect } from 'react';
import { ActivityIndicator, LogBox, StyleSheet, View } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OneSignal } from 'react-native-onesignal';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/auth-store';
import { syncDeviceToken } from '@/store/auth-store';
import { Colors } from '@/constants/theme';

// Ignore benign development warning triggered during Android system navigation mode switches (3-button <-> gesture)
LogBox.ignoreLogs([
  'Looks like you have configured linking in multiple places',
]);

// Prevent native splash screen from hiding automatically before auth status is ready
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error if already prevented */
});

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
  const rootNavigationState = useRootNavigationState();

  // Bootstrap — read stored tokens and restore session on app launch
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Hide splash screen once auth status is determined
  useEffect(() => {
    if (status !== 'idle' && status !== 'loading') {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [status]);

  // OneSignal Push Notifications setup
  useEffect(() => {
    // Initialize OneSignal SDK with the provided App ID
    OneSignal.initialize('16d2ca85-5df6-4115-87d5-7370f45727f0'); // env

    let permissionRequested = false;

    const checkPermissionAndRequest = async () => {
      if (!permissionRequested) {
        const hasPermission = await OneSignal.Notifications.getPermissionAsync();
        if (!hasPermission) {
          permissionRequested = true;
          OneSignal.Notifications.requestPermission(true);
        }
      }
    };

    // Check and prompt native permission directly if needed
    checkPermissionAndRequest();

    // Setup push subscription observer/listener
    const listener = (event: any) => {
      const id: string | undefined = event.current.id;
      // Sync the new subscription ID to the backend whenever it changes
      if (id && !id.startsWith('local-')) {
        syncDeviceToken().catch((e) =>
          console.warn('[layout] syncDeviceToken on subscription change failed:', e),
        );
      }
    };

    OneSignal.User.pushSubscription.addEventListener('change', listener);

    return () => {
      OneSignal.User.pushSubscription.removeEventListener('change', listener);
    };
  }, []);

  // Reactive auth guard — redirect based on authentication state
  useEffect(() => {
    if (!rootNavigationState?.key) return;
    // Wait until we have a definitive status
    if (status === 'idle' || status === 'loading') return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (status === 'authenticated' && (inAuthGroup || (!inAppGroup && segments.length > 0))) {
      router.replace('/(app)/(tabs)');
    }
  }, [status, segments, router, rootNavigationState?.key]);

  const isLoading = status === 'idle' || status === 'loading';

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Slot />
        {isLoading && (
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, zIndex: 999 }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return <RootLayoutContent />;
}
