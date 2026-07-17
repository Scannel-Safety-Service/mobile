import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OneSignal } from 'react-native-onesignal';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/auth-store';
import { syncDeviceToken } from '@/store/auth-store';
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

  // OneSignal Push Notifications setup
  useEffect(() => {
    // Initialize OneSignal SDK with the provided App ID
    OneSignal.initialize('16d2ca85-5df6-4115-87d5-7370f45727f0'); // env

    let alertShown = false;

    const requestPermissionAndRegister = () => {
      OneSignal.Notifications.requestPermission(true);
    };

    const checkSubscriptionId = async (id?: string | null) => {
      if (id && !id.startsWith('local-') && !alertShown) {
        // Only prompt if the user hasn't already granted notification permissions
        const hasPermission = await OneSignal.Notifications.getPermissionAsync();
        if (!hasPermission) {
          alertShown = true;
          Alert.alert(
            'Enable Notifications',
            'Stay updated with real-time safety alerts, document updates, and compliance tasks.',
            [
              {
                text: 'Later',
                style: 'cancel',
              },
              {
                text: 'Enable',
                onPress: () => {
                  requestPermissionAndRegister();
                },
              },
            ]
          );
        }
      }
    };

    // Evaluate the subscription status immediately
    OneSignal.User.pushSubscription.getIdAsync().then((id) => {
      checkSubscriptionId(id);
    });

    // Setup push subscription observer/listener
    const listener = (event: any) => {
      const id: string | undefined = event.current.id;
      checkSubscriptionId(id);
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
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Slot />
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return <RootLayoutContent />;
}
