import React from 'react';
import { StyleSheet, View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography } from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';
import { LinearGradient } from 'expo-linear-gradient';
import { BackgroundLogo } from '@/components/background-logo';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { user, logout, status } = useAuthStore();

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const isDark = colorScheme === 'dark';

  const detailItems = [
    { icon: 'card-outline' as const, label: 'Employee ID', value: user?.userCode || 'N/A' },
    { icon: 'business-outline' as const, label: 'Company Name', value: user?.companyName || 'N/A' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackgroundLogo />
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>

        {/* Profile Hero Header */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={isDark
              ? ['#0a2140', '#0e2d50', '#0a2140']
              : ['#155B9D', '#1a6db8', '#2B7CC1']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            {/* Decorative circles */}
            <View style={[styles.decorCircle1, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
            <View style={[styles.decorCircle2, { backgroundColor: 'rgba(255,255,255,0.03)' }]} />



            <Text style={styles.userName}>
              {user ? `${user.firstName} ${user.lastName}`.trim() : 'Loading Employee...'}
            </Text>
            <Text style={styles.userEmail}>
              {user?.email || ''}
            </Text>
          </LinearGradient>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <Text style={[styles.detailsSectionTitle, { color: colors.muted }]}>ACCOUNT DETAILS</Text>

          <View
            style={[
              styles.detailsCard,
              {
                backgroundColor: isDark ? 'rgba(8,23,41,0.7)' : 'rgba(255,255,255,0.85)',
                borderColor: isDark ? 'rgba(15,39,64,0.5)' : 'rgba(226,239,250,0.8)',
              },
            ]}
          >
            {detailItems.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.detailItem,
                  index < detailItems.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? 'rgba(15,39,64,0.4)' : 'rgba(226,239,250,0.8)',
                  },
                ]}
              >
                <View style={styles.detailLeft}>
                  <View style={[styles.detailIconCircle, { backgroundColor: isDark ? 'rgba(86,185,255,0.08)' : 'rgba(21,91,157,0.05)' }]}>
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.detailLabel, { color: colors.text }]}>{item.label}</Text>
                </View>
                <Text style={[styles.detailValue, { color: colors.muted }]} numberOfLines={1}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Logout Action */}
        <View style={styles.actionContainer}>
          <Pressable
            onPress={status === 'loading' ? undefined : handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              {
                backgroundColor: isDark ? 'rgba(58,15,20,0.5)' : 'rgba(253,242,242,0.9)',
                borderColor: isDark ? 'rgba(244,63,94,0.2)' : 'rgba(244,63,94,0.15)',
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            {status === 'loading' ? (
              <ActivityIndicator color="#f43f5e" size="small" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color="#f43f5e" />
                <Text style={styles.logoutText}>Log Out from Device</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 12,
    paddingBottom: 40,
    gap: 24,
  },

  /* ── Hero Header ── */
  heroCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    borderCurve: 'continuous',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(21, 91, 157, 0.15)',
  },
  heroGradient: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 10,
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
  },

  userName: {
    ...Typography.title2,
    color: '#ffffff',
  },
  userEmail: {
    ...Typography.subheadline,
    color: 'rgba(255,255,255,0.65)',
  },

  /* ── Details Section ── */
  detailsSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  detailsSectionTitle: {
    ...Typography.overline,
    marginLeft: 4,
  },
  detailsCard: {
    borderWidth: 1,
    borderRadius: 20,
    borderCurve: 'continuous',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  detailIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailLabel: {
    ...Typography.callout,
    fontWeight: '500',
  },
  detailValue: {
    ...Typography.subheadline,
    maxWidth: '40%',
    textAlign: 'right',
  },

  /* ── Logout ── */
  actionContainer: {
    paddingHorizontal: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  logoutText: {
    color: '#f43f5e',
    ...Typography.button,
  },
});
