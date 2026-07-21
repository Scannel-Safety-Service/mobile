import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  Award,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography } from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';
import { HelloWave } from '@/components/hello-wave';
import { LinearGradient } from 'expo-linear-gradient';
import { apiRequest } from '@/lib/api';
import { BackgroundLogo } from '@/components/background-logo';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { user } = useAuthStore();

  const isDark = colorScheme === 'dark';

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalDocs, setTotalDocs] = useState(0);
  const [safetyStatementsCount, setSafetyStatementsCount] = useState(0);
  const [riskAssessmentsCount, setRiskAssessmentsCount] = useState(0);
  const [certificatesCount, setCertificatesCount] = useState(0);
  const [hasPendingReview, setHasPendingReview] = useState(false);

  const triggerFeedback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await apiRequest('/documents?limit=100');
      const result = await response.json();

      if (response.ok && result.data) {
        let docsList: any[] = [];
        if (Array.isArray(result.data)) {
          docsList = result.data;
        } else if (result.data.items && Array.isArray(result.data.items)) {
          docsList = result.data.items;
        }

        // Compute document stats
        setTotalDocs(docsList.length);

        const safetyCount = docsList.filter((d: any) => d.section === 'SAFETY_STATEMENT').length;
        setSafetyStatementsCount(safetyCount);

        const riskCount = docsList.filter((d: any) => d.section === 'RISK_ASSESSMENT').length;
        setRiskAssessmentsCount(riskCount);

        const certsCount = docsList.filter((d: any) => d.section === 'TRAINING_QUALIFICATIONS').length;
        setCertificatesCount(certsCount);

        // Compliance status: check if any document is not reviewed
        const hasPending = docsList.some((d: any) => !d.isReviewed);
        setHasPendingReview(hasPending);
      }
    } catch (error) {
      console.error('Error fetching home screen overview data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const cardBg = isDark ? 'rgba(8, 23, 41, 0.65)' : 'rgba(255, 255, 255, 0.55)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.65)';

  const statCards = [
    {
      label: 'Total Documents',
      value: totalDocs.toString(),
      icon: FileText,
      iconColor: '#3b82f6',
      bgLight: 'rgba(59, 130, 246, 0.08)',
      bgDark: 'rgba(59, 130, 246, 0.12)',
    },
    {
      label: 'Safety Statements',
      value: safetyStatementsCount.toString(),
      icon: ShieldCheck,
      iconColor: '#10b981',
      bgLight: 'rgba(16, 185, 129, 0.08)',
      bgDark: 'rgba(16, 185, 129, 0.12)',
    },
    {
      label: 'Risk Assessments',
      value: riskAssessmentsCount.toString(),
      icon: AlertTriangle,
      iconColor: '#f59e0b',
      bgLight: 'rgba(245, 158, 11, 0.08)',
      bgDark: 'rgba(245, 158, 11, 0.12)',
    },
    {
      label: 'Certificates',
      value: certificatesCount.toString(),
      icon: Award,
      iconColor: '#f43f5e',
      bgLight: 'rgba(244, 63, 94, 0.08)',
      bgDark: 'rgba(244, 63, 94, 0.12)',
    },
  ];

  const complianceStatus = hasPendingReview ? 'Pending Review' : 'Safety Compliant';
  const complianceColor = hasPendingReview ? '#f59e0b' : '#10b981';
  const complianceBg = hasPendingReview ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackgroundLogo />
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
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
                    Hello, {user?.name || 'Employee'}
                  </Text>
                  <HelloWave />
                </View>
                <Text style={styles.companyText}>
                  {user?.companyName || 'Scannel Safety'}
                </Text>
              </View>
              {/* Safety Status inline */}
              <View style={[styles.statusPill, { backgroundColor: complianceBg }]}>
                <View style={[styles.statusDot, { backgroundColor: complianceColor }]} />
                <Text style={[styles.statusPillText, { color: complianceColor }]}>{complianceStatus}</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Status Description Card */}
          <View
            style={[
              styles.statusCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
                boxShadow: isDark ? '0 12px 36px rgba(0, 0, 0, 0.4)' : '0 12px 36px rgba(21, 91, 157, 0.06)',
              },
            ]}
          >
            <View style={styles.statusCardContent}>
              <View style={styles.statusHeaderRow}>
                {hasPendingReview ? (
                  <AlertCircle size={24} color="#f59e0b" style={styles.statusIcon} />
                ) : (
                  <CheckCircle2 size={24} color="#10b981" style={styles.statusIcon} />
                )}
                <Text style={[styles.cardTitle, { color: colors.text }]}>Safety Compliance Status</Text>
              </View>
              <Text style={[styles.statusDescription, { color: colors.muted }]}>
                {hasPendingReview
                  ? 'You have documents pending review. Please review and sign them in the documents section to ensure compliance.'
                  : 'Your account is fully active, and all assigned documents are reviewed and up to date.'}
              </Text>
            </View>
          </View>

          {/* Quick Overview Section */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Overview</Text>

          <View style={styles.grid}>
            {statCards.map((card, index) => {
              const CardIcon = card.icon;
              const iconCircleBg = isDark ? card.bgDark : card.bgLight;

              return (
                <Pressable
                  key={index}
                  onPress={triggerFeedback}
                  style={({ pressed }) => [
                    styles.gridItem,
                    {
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                      boxShadow: isDark ? '0 12px 36px rgba(0, 0, 0, 0.4)' : '0 12px 36px rgba(21, 91, 157, 0.06)',
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    },
                  ]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: iconCircleBg }]}>
                    <CardIcon size={24} color={card.iconColor} strokeWidth={2} />
                  </View>
                  <View style={styles.gridItemContent}>
                    <Text style={[styles.statNumber, { color: colors.text }]}>{card.value}</Text>
                    <Text style={[styles.statLabel, { color: colors.muted }]}>{card.label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Safety Notice Footer Banner */}
          <View
            style={[
              styles.noticeBanner,
              {
                backgroundColor: isDark ? 'rgba(16, 29, 45, 0.7)' : 'rgba(230, 240, 250, 0.8)',
                borderColor: isDark ? 'rgba(15, 39, 64, 0.4)' : 'rgba(226, 239, 250, 0.7)',
              },
            ]}
          >
            <View style={[styles.noticeIconCircle, { backgroundColor: isDark ? 'rgba(86, 185, 255, 0.1)' : 'rgba(21, 91, 157, 0.06)' }]}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
              Contact your company administrator if you require updates to your assigned credentials or documents.
            </Text>
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
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    ...Typography.footnote,
    fontWeight: '600',
  },

  /* ── Status Card ── */
  statusCard: {
    borderWidth: 1.2,
    borderRadius: 24,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  statusCardContent: {
    padding: 20,
    gap: 10,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusIcon: {
    marginTop: -2,
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
    borderWidth: 1.2,
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: 18,
    gap: 14,
    overflow: 'hidden',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
