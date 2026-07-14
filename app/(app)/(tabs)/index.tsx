import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';
import { HelloWave } from '@/components/hello-wave';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { user } = useAuthStore();

  const isDark = colorScheme === 'dark';

  const triggerFeedback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Banner */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeRow}>
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            Hello, {user?.firstName || 'Employee'}
          </Text>
          <HelloWave />
        </View>
        <Text style={[styles.companyText, { color: colors.muted }]}>
          Scannel Safety Tracker Scoped
        </Text>
      </View>

      {/* Safety Status Card */}
      <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusIndicator, { backgroundColor: '#10b981' }]} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Safety Compliance Status</Text>
        </View>
        <Text style={[styles.statusDescription, { color: colors.muted }]}>
          Your account is fully active and synchronized with {"your company's"} safety database.
        </Text>
      </View>

      {/* Quick Action Hub */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Overview</Text>
      
      <View style={styles.grid}>
        {/* Document Stats Box */}
        <Pressable 
          onPress={triggerFeedback}
          style={({ pressed }) => [
            styles.gridItem, 
            { 
              backgroundColor: colors.card, 
              borderColor: colors.cardBorder,
              opacity: pressed ? 0.95 : 1,
            }
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: isDark ? '#142a1e' : '#ecfdf5' }]}>
            <Ionicons name="document-text-outline" size={24} color="#10b981" />
          </View>
          <View style={styles.gridItemContent}>
            <Text style={[styles.statNumber, { color: colors.text }]}>3</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Assigned Documents</Text>
          </View>
        </Pressable>

        {/* Reminder Stats Box */}
        <Pressable 
          onPress={triggerFeedback}
          style={({ pressed }) => [
            styles.gridItem, 
            { 
              backgroundColor: colors.card, 
              borderColor: colors.cardBorder,
              opacity: pressed ? 0.95 : 1,
            }
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: isDark ? '#35210e' : '#fffbeb' }]}>
            <Ionicons name="notifications-outline" size={24} color="#d97706" />
          </View>
          <View style={styles.gridItemContent}>
            <Text style={[styles.statNumber, { color: colors.text }]}>1</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Active Reminders</Text>
          </View>
        </Pressable>

        {/* Training Qualifications Box */}
        <Pressable 
          onPress={triggerFeedback}
          style={({ pressed }) => [
            styles.gridItem, 
            { 
              backgroundColor: colors.card, 
              borderColor: colors.cardBorder,
              opacity: pressed ? 0.95 : 1,
            }
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: isDark ? '#102738' : '#eff6ff' }]}>
            <Ionicons name="ribbon-outline" size={24} color="#3b82f6" />
          </View>
          <View style={styles.gridItemContent}>
            <Text style={[styles.statNumber, { color: colors.text }]}>Active</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Certificates</Text>
          </View>
        </Pressable>

        {/* Assigned Projects Box */}
        <Pressable 
          onPress={triggerFeedback}
          style={({ pressed }) => [
            styles.gridItem, 
            { 
              backgroundColor: colors.card, 
              borderColor: colors.cardBorder,
              opacity: pressed ? 0.95 : 1,
            }
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: isDark ? '#23122c' : '#faf5ff' }]}>
            <Ionicons name="construct-outline" size={24} color="#8b5cf6" />
          </View>
          <View style={styles.gridItemContent}>
            <Text style={[styles.statNumber, { color: colors.text }]}>Site-01</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Assigned Location</Text>
          </View>
        </Pressable>
      </View>

      {/* Safety Notice Footer Banner */}
      <View style={[styles.noticeBanner, { backgroundColor: isDark ? '#101d2d' : '#e6f0fa', borderColor: colors.cardBorder }]}>
        <Ionicons name="information-circle" size={22} color={colors.primary} />
        <Text style={[styles.noticeText, { color: colors.text }]}>
          Contact your company administrator if you require updates to your assigned projects or credentials.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 24,
  },
  welcomeSection: {
    gap: 6,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  companyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: 18,
    borderCurve: 'continuous',
    padding: 20,
    gap: 10,
    boxShadow: '0 4px 12px rgba(21, 91, 157, 0.04)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: '47.5%',
    borderWidth: 1,
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 16,
    gap: 12,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.01)',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemContent: {
    gap: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  noticeBanner: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 14,
    borderCurve: 'continuous',
    padding: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
});
