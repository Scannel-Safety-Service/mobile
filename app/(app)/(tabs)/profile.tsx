import React from 'react';
import { StyleSheet, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { user, logout, status } = useAuthStore();

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Profile Area */}
      <View style={[styles.profileHeader, { borderBottomColor: colors.cardBorder }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {user?.firstName?.charAt(0) || 'E'}
          </Text>
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>
          {user ? `${user.firstName} ${user.lastName}`.trim() : 'Loading Employee...'}
        </Text>
        <Text style={[styles.userEmail, { color: colors.muted }]}>
          {user?.email || ''}
        </Text>
      </View>

      {/* Profile Details List */}
      <View style={styles.detailsList}>
        {/* Role Group */}
        <View style={[styles.detailItem, { borderBottomColor: colors.cardBorder }]}>
          <View style={styles.detailLeft}>
            <Ionicons name="briefcase-outline" size={22} color={colors.icon} />
            <Text style={[styles.detailLabel, { color: colors.text }]}>Access Role</Text>
          </View>
          <Text style={[styles.detailValue, { color: colors.muted }]}>
            {user?.role === 'COMPANY_USER' ? 'Company Employee' : user?.role || ''}
          </Text>
        </View>

        {/* Company Group */}
        <View style={[styles.detailItem, { borderBottomColor: colors.cardBorder }]}>
          <View style={styles.detailLeft}>
            <Ionicons name="business-outline" size={22} color={colors.icon} />
            <Text style={[styles.detailLabel, { color: colors.text }]}>Company ID</Text>
          </View>
          <Text style={[styles.detailValue, { color: colors.muted }]} numberOfLines={1}>
            {user?.companyId || 'N/A'}
          </Text>
        </View>

        {/* Security / Connection status */}
        <View style={[styles.detailItem, { borderBottomColor: colors.cardBorder }]}>
          <View style={styles.detailLeft}>
            <Ionicons name="key-outline" size={22} color={colors.icon} />
            <Text style={[styles.detailLabel, { color: colors.text }]}>Security Channel</Text>
          </View>
          <Text style={[styles.detailValue, { color: colors.muted }]}>
            Mobile (Isolated JWT)
          </Text>
        </View>

        {/* App Version */}
        <View style={[styles.detailItem, { borderBottomColor: colors.cardBorder }]}>
          <View style={styles.detailLeft}>
            <Ionicons name="information-circle-outline" size={22} color={colors.icon} />
            <Text style={[styles.detailLabel, { color: colors.text }]}>Client Version</Text>
          </View>
          <Text style={[styles.detailValue, { color: colors.muted }]}>
            1.0.0 (Expo)
          </Text>
        </View>
      </View>

      {/* Logout Action */}
      <View style={styles.actionContainer}>
        <Pressable
          onPress={status === 'loading' ? undefined : handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            {
              backgroundColor: isDark ? '#3a0f14' : '#fdf2f2',
              opacity: pressed ? 0.85 : 1,
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 64,
  },
  profileHeader: {
    alignItems: 'center',
    paddingBottom: 28,
    borderBottomWidth: 1,
    gap: 8,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    boxShadow: '0 8px 16px rgba(21, 91, 157, 0.12)',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '600',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '400',
  },
  detailsList: {
    marginTop: 20,
    paddingHorizontal: 24,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '400',
    maxWidth: '50%',
  },
  actionContainer: {
    marginTop: 40,
    paddingHorizontal: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 14,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    color: '#f43f5e',
    fontSize: 15,
    fontWeight: '600',
  },
});
