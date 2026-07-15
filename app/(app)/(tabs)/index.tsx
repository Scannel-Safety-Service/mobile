import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography } from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';
import { HelloWave } from '@/components/hello-wave';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { user } = useAuthStore();

  const isDark = colorScheme === 'dark';

  const triggerFeedback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const statCards = [
    {
      label: 'Assigned Documents',
      value: '3',
      icon: 'document-text-outline' as const,
      iconColor: '#10b981',
      bgLight: '#ecfdf5',
      bgDark: '#142a1e',
      accentColor: '#10b981',
    },
    {
      label: 'Active Reminders',
      value: '1',
      icon: 'notifications-outline' as const,
      iconColor: '#d97706',
      bgLight: '#fffbeb',
      bgDark: '#35210e',
      accentColor: '#f59e0b',
    },
    {
      label: 'Certificates',
      value: 'Active',
      icon: 'ribbon-outline' as const,
      iconColor: '#3b82f6',
      bgLight: '#eff6ff',
      bgDark: '#102738',
      accentColor: '#3b82f6',
    },
    {
      label: 'Assigned Location',
      value: 'Site-01',
      icon: 'construct-outline' as const,
      iconColor: '#8b5cf6',
      bgLight: '#faf5ff',
      bgDark: '#23122c',
      accentColor: '#8b5cf6',
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Header with Gradient */}
        <View style={styles.welcomeCard}>
          <LinearGradient
            colors={isDark
              ? ['#0a2140', '#0e2d50', '#0a2140']
              : ['#155B9D', '#1a6db8', '#2B7CC1']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeGradient}
          >
            {/* Decorative circles */}
            <View style={[styles.decorCircle1, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
            <View style={[styles.decorCircle2, { backgroundColor: 'rgba(255,255,255,0.04)' }]} />

            <View style={styles.welcomeContent}>
              <View style={styles.welcomeRow}>
                <Text style={styles.welcomeText}>
                  Hello, {user?.firstName || 'Employee'}
                </Text>
                <HelloWave />
              </View>
              <Text style={styles.companyText}>
                Scannel Safety Tracker Scoped
              </Text>
            </View>

            {/* Safety Status inline */}
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusPillText}>Safety Compliant</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Status Description Card */}
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: isDark ? 'rgba(8,23,41,0.7)' : 'rgba(255,255,255,0.85)',
              borderColor: isDark ? 'rgba(15,39,64,0.5)' : 'rgba(226,239,250,0.8)',
            },
          ]}
        >
          <View style={[styles.statusAccent, { backgroundColor: '#10b981' }]} />
          <View style={styles.statusCardContent}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Safety Compliance Status</Text>
            <Text style={[styles.statusDescription, { color: colors.muted }]}>
              Your account is fully active and synchronized with {"your company's"} safety database.
            </Text>
          </View>
        </View>

        {/* Quick Overview Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Overview</Text>

        <View style={styles.grid}>
          {statCards.map((card, index) => (
            <Pressable
              key={index}
              onPress={triggerFeedback}
              style={({ pressed }) => [
                styles.gridItem,
                {
                  backgroundColor: isDark ? 'rgba(8,23,41,0.7)' : 'rgba(255,255,255,0.85)',
                  borderColor: isDark ? 'rgba(15,39,64,0.5)' : 'rgba(226,239,250,0.8)',
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
            >
              {/* Top accent line */}
              <View style={[styles.gridAccent, { backgroundColor: card.accentColor }]} />
              <View style={[styles.iconCircle, { backgroundColor: isDark ? card.bgDark : card.bgLight }]}>
                <Ionicons name={card.icon} size={24} color={card.iconColor} />
              </View>
              <View style={styles.gridItemContent}>
                <Text style={[styles.statNumber, { color: colors.text }]}>{card.value}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>{card.label}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Safety Notice Footer Banner */}
        <View
          style={[
            styles.noticeBanner,
            {
              backgroundColor: isDark ? 'rgba(16,29,45,0.7)' : 'rgba(230,240,250,0.8)',
              borderColor: isDark ? 'rgba(15,39,64,0.4)' : 'rgba(226,239,250,0.7)',
            },
          ]}
        >
          <View style={[styles.noticeIconCircle, { backgroundColor: isDark ? 'rgba(86,185,255,0.1)' : 'rgba(21,91,157,0.06)' }]}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
            Contact your company administrator if you require updates to your assigned projects or credentials.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },

  /* ── Welcome Card ── */
  welcomeCard: {
    borderRadius: 24,
    borderCurve: 'continuous',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(21, 91, 157, 0.15)',
  },
  welcomeGradient: {
    padding: 24,
    paddingBottom: 20,
    gap: 16,
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -50,
    left: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  welcomeContent: {
    gap: 4,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  welcomeText: {
    ...Typography.title1,
    color: '#ffffff',
  },
  companyText: {
    ...Typography.subheadline,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34d399',
  },
  statusPillText: {
    ...Typography.footnote,
    fontWeight: '600',
    color: '#34d399',
  },

  /* ── Status Card ── */
  statusCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 20,
    borderCurve: 'continuous',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
  },
  statusAccent: {
    width: 4,
  },
  statusCardContent: {
    flex: 1,
    padding: 18,
    gap: 8,
  },
  cardTitle: {
    ...Typography.headline,
  },
  statusDescription: {
    ...Typography.subheadline,
  },

  /* ── Section ── */
  sectionTitle: {
    ...Typography.title3,
    marginTop: 4,
  },

  /* ── Stats Grid ── */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  gridItem: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: 18,
    gap: 14,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
  },
  gridAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemContent: {
    gap: 4,
  },
  statNumber: {
    ...Typography.title3,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.footnote,
    fontWeight: '500',
  },

  /* ── Notice Banner ── */
  noticeBanner: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 16,
    gap: 14,
    alignItems: 'flex-start',
  },
  noticeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -2,
  },
  noticeText: {
    flex: 1,
    ...Typography.footnote,
    fontWeight: '500',
  },
});
