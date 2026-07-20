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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '@/constants/theme';
import { apiRequest } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);

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
    <View style={styles.outerContainer}>
      {/* Gradient Background */}
      <LinearGradient
        colors={isDark
          ? ['#040e1a', '#0a1f38', '#0e2a4a', '#040e1a']
          : ['#e8f1fb', '#d4e6f6', '#c0dbf1', '#f4f8fc']
        }
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) }]}>
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

          {/* Glass Card */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: isDark ? 'rgba(8,23,41,0.75)' : 'rgba(255,255,255,0.82)',
                borderColor: isDark ? 'rgba(15,39,64,0.6)' : 'rgba(226,239,250,0.8)',
              },
            ]}
          >
            {!isSuccess ? (
              /* Input Form */
              <View style={styles.formArea}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>EMAIL ADDRESS</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: isDark ? 'rgba(4,14,26,0.6)' : 'rgba(244,248,252,0.9)',
                        borderColor: localError 
                          ? '#f43f5e' 
                          : isEmailFocused 
                            ? colors.primary 
                            : (isDark ? 'rgba(15,39,64,0.5)' : 'rgba(226,239,250,0.9)'),
                        opacity: isSubmitting ? 0.6 : 1,
                      },
                    ]}
                  >
                    <View style={[styles.inputIconCircle, { backgroundColor: isDark ? 'rgba(86,185,255,0.1)' : 'rgba(21,91,157,0.06)' }]}>
                      <Ionicons name="mail-outline" size={18} color={colors.primary} />
                    </View>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Enter registered email"
                      placeholderTextColor={colors.muted}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (localError) setLocalError(null);
                      }}
                      onFocus={() => setIsEmailFocused(true)}
                      onBlur={() => setIsEmailFocused(false)}
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
                {localError ? (
                  <View style={[styles.errorContainer, { backgroundColor: isDark ? 'rgba(58,15,20,0.6)' : 'rgba(253,242,242,0.9)' }]}>
                    <Ionicons name="alert-circle" size={18} color="#f43f5e" />
                    <Text style={styles.errorText}>{localError}</Text>
                  </View>
                ) : null}

                {/* Submit Button */}
                <Pressable
                  onPress={isSubmitting ? undefined : handleResetRequest}
                  style={({ pressed }) => [
                    styles.submitButton,
                    {
                      opacity: pressed ? 0.9 : 1,
                      transform: [{ scale: pressed ? 0.985 : 1 }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={isSubmitting
                      ? [colors.secondary, colors.secondary]
                      : [colors.primary, isDark ? '#3d8fd4' : '#1a6db8']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitGradient}
                  >
                    {isSubmitting ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator color="#ffffff" size="small" />
                        <Text style={styles.submitButtonText}>Sending reset link...</Text>
                      </View>
                    ) : (
                      <Text style={styles.submitButtonText}>Send Reset Link</Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            ) : (
              /* Success Message View */
              <View style={styles.successArea}>
                <View style={[styles.successIconCircle, { backgroundColor: isDark ? 'rgba(20,42,30,0.8)' : '#ecfdf5' }]}>
                  <Ionicons name="checkmark-circle" size={52} color="#10b981" />
                </View>
                <Text style={[styles.successText, { color: colors.text }]}>
                  Email Sent Successfully
                </Text>
                <Text style={[styles.successDescription, { color: colors.muted }]}>
                  If an account is associated with <Text style={styles.boldText}>{email.trim()}</Text>, you will receive an email shortly with a password reset link.
                </Text>
              </View>
            )}
          </View>

          {/* Back navigation */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.6 : 1 },
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
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    gap: 28,
  },
  headerArea: {
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 200,
    height: 60,
    marginBottom: 4,
  },
  title: {
    ...Typography.title2,
  },
  subtitle: {
    ...Typography.subheadline,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: 24,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
  },
  formArea: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    ...Typography.overline,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: 6,
    paddingVertical: 6,
    height: 56,
    gap: 10,
  },
  inputIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    ...Typography.callout,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  errorText: {
    color: '#f43f5e',
    ...Typography.footnote,
    fontWeight: '500',
    flex: 1,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitButton: {
    marginTop: 4,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(21, 91, 157, 0.25)',
  },
  submitGradient: {
    height: 56,
    borderRadius: 16,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    ...Typography.headline,
  },
  successArea: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
  },
  successIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    ...Typography.title3,
    fontWeight: '700',
  },
  successDescription: {
    ...Typography.subheadline,
    textAlign: 'center',
    paddingHorizontal: 8,
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
    minHeight: 48,
  },
  backButtonText: {
    ...Typography.buttonSmall,
  },
});
