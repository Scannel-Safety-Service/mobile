import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { apiRequest } from '@/lib/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetRequest = async () => {
    if (isSubmitting) return;

    // Client-side validation
    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLocalError('Please enter a valid email address.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLocalError(null);
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
        skipAuth: true,
      });

      if (response.ok) {
        setIsSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const result = await response.json();
        setLocalError(result.message || 'Failed to send password reset email. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      setLocalError('Cannot connect to server. Please check your connection.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDark = colorScheme === 'dark';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.cardContainer}>
        {/* Header Area */}
        <View style={styles.headerArea}>
          <Image
            source={require('@/assets/images/logo-home.png')}
            style={styles.logoImage}
            contentFit="contain"
          />
          <Text style={[styles.title, { color: colors.text }]}>
            Reset Password
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {isSuccess
              ? 'Check your inbox for further instructions.'
              : 'Enter your email address to receive a password reset link.'}
          </Text>
        </View>

        {!isSuccess ? (
          /* Input Form */
          <View style={styles.formArea}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>EMAIL ADDRESS</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? '#0b1624' : '#ffffff',
                    borderColor: localError ? '#f43f5e' : colors.cardBorder,
                  },
                ]}
              >
                <Ionicons name="mail-outline" size={20} color={colors.icon} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter registered email"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (localError) setLocalError(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!isSubmitting}
                  onSubmitEditing={handleResetRequest}
                  returnKeyType="send"
                />
              </View>
            </View>

            {/* Error Message */}
            <View style={styles.errorSlot}>
              {localError ? (
                <View style={[styles.errorContainer, { backgroundColor: isDark ? '#3a0f14' : '#fdf2f2' }]}>
                  <Ionicons name="alert-circle" size={18} color="#f43f5e" />
                  <Text style={styles.errorText}>{localError}</Text>
                </View>
              ) : null}
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={isSubmitting ? undefined : handleResetRequest}
              style={({ pressed }) => [
                styles.submitButton,
                {
                  backgroundColor: isSubmitting ? colors.secondary : colors.primary,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              {isSubmitting ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.submitButtonText}>Sending reset link...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Send Reset Link</Text>
              )}
            </Pressable>
          </View>
        ) : (
          /* Success Message View */
          <View style={styles.successArea}>
            <View style={[styles.successIconCircle, { backgroundColor: isDark ? '#142a1e' : '#ecfdf5' }]}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#10b981" />
            </View>
            <Text style={[styles.successText, { color: colors.text }]}>
              Email Sent Successfully
            </Text>
            <Text style={[styles.successDescription, { color: colors.muted }]}>
              If an account is associated with <Text style={styles.boldText}>{email.trim()}</Text>, you will receive an email shortly with a password reset link.
            </Text>
          </View>
        )}

        {/* Back navigation */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={({ pressed }) => [
            styles.backButton,
            {
              opacity: pressed ? 0.6 : 1,
            },
          ]}
          hitSlop={12}
        >
          <Ionicons name="arrow-back-outline" size={18} color={colors.primary} />
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            Back to Sign In
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  cardContainer: {
    gap: 28,
  },
  headerArea: {
    alignItems: 'center',
    gap: 8,
  },
  logoImage: {
    width: 200,
    height: 60,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  formArea: {
    gap: 12,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  errorSlot: {
    minHeight: 44,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitButton: {
    height: 54,
    borderRadius: 27,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  successArea: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  successDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  boldText: {
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
