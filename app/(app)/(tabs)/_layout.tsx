import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type IconSymbolName = React.ComponentProps<typeof IconSymbol>['name'];

function TabBarIcon({
  name,
  focused,
  color,
  isDark,
}: {
  name: IconSymbolName;
  focused: boolean;
  color: string;
  isDark: boolean;
}) {
  return (
    <View
      style={[
        styles.iconPill,
        focused && {
          backgroundColor: isDark
            ? 'rgba(86, 185, 255, 0.18)'
            : 'rgba(21, 91, 157, 0.12)',
        },
      ]}
    >
      <IconSymbol size={22} name={name} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8);
  const tabBarHeight = (Platform.OS === 'ios' ? 54 : 58) + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          ...Typography.caption2,
          fontWeight: '600',
          letterSpacing: 0.1,
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: isDark ? 'rgba(8,23,41,0.92)' : '#ffffff',
          borderTopColor: isDark ? 'rgba(15,39,64,0.5)' : 'rgba(226,239,250,0.8)',
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: bottomPadding,
          // Frosted glass elevation
          ...(Platform.OS === 'android' && { elevation: 8 }),
        },
        tabBarItemStyle: {
          gap: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="house.fill" color={color} focused={focused} isDark={isDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="timesheets"
        options={{
          title: 'Timesheets',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="clock.fill" color={color} focused={focused} isDark={isDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="briefcase.fill" color={color} focused={focused} isDark={isDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documents',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="folder.fill" color={color} focused={focused} isDark={isDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="person.fill" color={color} focused={focused} isDark={isDark} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconPill: {
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});




