import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography } from '@/constants/theme';
import { apiRequest } from '@/lib/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setIsLoading(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  const hasMinLength = newPassword.length >= 8;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isDifferentFromCurrent = newPassword.length > 0 && currentPassword !== newPassword;
  const isValid = currentPassword.length > 0 && hasMinLength && passwordsMatch && isDifferentFromCurrent;

  const handleSubmit = async () => {
    if (!isValid || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || 'Failed to change password. Please check your current password.');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Your password has been changed successfully.', [
        { text: 'OK', onPress: onClose },
      ]);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isLoading) onClose();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            if (!isLoading) onClose();
          }}
        />

        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: isDark ? '#081729' : '#ffffff',
              borderColor: isDark ? 'rgba(15,39,64,0.8)' : 'rgba(226,239,250,0.9)',
            },
          ]}
        >
          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.keyIconCircle, { backgroundColor: isDark ? 'rgba(86,185,255,0.1)' : 'rgba(21,91,157,0.08)' }]}>
                <Ionicons name="key-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Change Password</Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>Update account security</Text>
              </View>
            </View>
            <Pressable
              disabled={isLoading}
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Error Message */}
            {errorMsg && (
              <View style={[styles.errorBanner, { backgroundColor: isDark ? 'rgba(244,63,94,0.12)' : 'rgba(254,242,242,0.95)', borderColor: isDark ? 'rgba(244,63,94,0.3)' : 'rgba(252,165,165,0.6)' }]}>
                <Ionicons name="alert-circle-outline" size={18} color="#f43f5e" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Current Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.muted }]}>CURRENT PASSWORD</Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(4,14,26,0.6)' : '#f8fafc', borderColor: isDark ? 'rgba(15,39,64,0.8)' : '#e2e8f0' }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showCurrent}
                  editable={!isLoading}
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  textContentType="password"
                />
                <Pressable onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeBtn}>
                  <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
                </Pressable>
              </View>
            </View>

            {/* New Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.muted }]}>NEW PASSWORD</Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(4,14,26,0.6)' : '#f8fafc', borderColor: isDark ? 'rgba(15,39,64,0.8)' : '#e2e8f0' }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showNew}
                  editable={!isLoading}
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  textContentType="newPassword"
                />
                <Pressable onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
                  <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
                </Pressable>
              </View>
            </View>

            {/* Confirm New Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.muted }]}>CONFIRM NEW PASSWORD</Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(4,14,26,0.6)' : '#f8fafc', borderColor: isDark ? 'rgba(15,39,64,0.8)' : '#e2e8f0' }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showConfirm}
                  editable={!isLoading}
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  textContentType="newPassword"
                />
                <Pressable onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
                </Pressable>
              </View>
            </View>

            {/* Requirements Checklist */}
            <View style={[styles.checklistCard, { backgroundColor: isDark ? 'rgba(4,14,26,0.4)' : '#f1f5f9', borderColor: isDark ? 'rgba(15,39,64,0.5)' : '#e2e8f0' }]}>
              <View style={styles.checkItem}>
                <Ionicons
                  name={hasMinLength ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={hasMinLength ? colors.success : colors.muted}
                />
                <Text style={[styles.checkText, { color: hasMinLength ? colors.success : colors.muted }]}>
                  At least 8 characters long
                </Text>
              </View>
              <View style={styles.checkItem}>
                <Ionicons
                  name={passwordsMatch ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={passwordsMatch ? colors.success : colors.muted}
                />
                <Text style={[styles.checkText, { color: passwordsMatch ? colors.success : colors.muted }]}>
                  New passwords match
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Modal Actions */}
          <View style={styles.actionsRow}>
            <Pressable
              disabled={isLoading}
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancelBtn,
                { borderColor: isDark ? 'rgba(15,39,64,0.8)' : '#cbd5e1' },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
            </Pressable>

            <Pressable
              disabled={!isValid || isLoading}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.submitBtn,
                { backgroundColor: colors.primary },
                (!isValid || isLoading) && { opacity: 0.4 },
                pressed && { opacity: 0.8 },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitText}>Update Password</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  keyIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.headline,
  },
  subtitle: {
    ...Typography.footnote,
  },
  closeBtn: {
    padding: 6,
  },

  /* Form */
  formScroll: {
    flexGrow: 0,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  errorText: {
    ...Typography.footnote,
    color: '#f43f5e',
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    gap: 6,
    marginBottom: 14,
  },
  label: {
    ...Typography.caption2,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },

  /* Checklist */
  checklistCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    ...Typography.caption1,
    fontWeight: '500',
  },

  /* Actions */
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    ...Typography.buttonSmall,
  },
  submitBtn: {
    flex: 1.2,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: {
    color: '#ffffff',
    ...Typography.buttonSmall,
  },
});
