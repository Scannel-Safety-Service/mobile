import React, { useState, useEffect } from 'react';
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
import { Colors, Typography } from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { login, loginError, status, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Clear errors on mount only
  useEffect(() => {
    clearError();
    setLocalError(null);
  }, [clearError]);

  const displayError = localError || loginError;

  const handleLogin = async () => {
    if (isSubmitting) return;

    // Client-side validation
    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!password.trim()) {
      setLocalError('Please enter your password.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLocalError(null);
    clearError();
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const success = await login(email.trim(), password.trim());
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Navigation is handled by the root layout auth guard
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDark = colorScheme === 'dark';
  const isLoading = isSubmitting || status === 'loading';

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

      {/* Decorative Gradient Orb — Top Right */}
      <View style={styles.orbTopRight}>
        <LinearGradient
          colors={isDark
            ? ['rgba(86,185,255,0.12)', 'rgba(45,167,255,0.0)']
            : ['rgba(21,91,157,0.08)', 'rgba(21,91,157,0.0)']
          }
          style={styles.orbGradient}
        />
      </View>

      {/* Decorative Gradient Orb — Bottom Left */}
      <View style={styles.orbBottomLeft}>
        <LinearGradient
          colors={isDark
            ? ['rgba(45,167,255,0.08)', 'rgba(45,167,255,0.0)']
            : ['rgba(21,91,157,0.06)', 'rgba(21,91,157,0.0)']
          }
          style={styles.orbGradient}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo / Header */}
          <View style={styles.headerArea}>
            <Image
              source={require('@/assets/images/logo-home.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Employee Safety & Document Service
            </Text>
          </View>

          {/* Glass Card Form */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: isDark ? 'rgba(8,23,41,0.75)' : 'rgba(255,255,255,0.82)',
                borderColor: isDark ? 'rgba(15,39,64,0.6)' : 'rgba(226,239,250,0.8)',
              },
            ]}
          >
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>EMAIL ADDRESS</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? 'rgba(4,14,26,0.6)' : 'rgba(244,248,252,0.9)',
                    borderColor: displayError 
                      ? '#f43f5e' 
                      : isEmailFocused 
                        ? colors.primary 
                        : (isDark ? 'rgba(15,39,64,0.5)' : 'rgba(226,239,250,0.9)'),
                    opacity: isLoading ? 0.6 : 1,
                  },
                ]}
              >
                <View style={[styles.inputIconCircle, { backgroundColor: isDark ? 'rgba(86,185,255,0.1)' : 'rgba(21,91,157,0.06)' }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.primary} />
                </View>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter email address"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (localError) setLocalError(null);
                    if (loginError) clearError();
                  }}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>PASSWORD</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? 'rgba(4,14,26,0.6)' : 'rgba(244,248,252,0.9)',
                    borderColor: displayError 
                      ? '#f43f5e' 
                      : isPasswordFocused 
                        ? colors.primary 
                        : (isDark ? 'rgba(15,39,64,0.5)' : 'rgba(226,239,250,0.9)'),
                    opacity: isLoading ? 0.6 : 1,
                  },
                ]}
              >
                <View style={[styles.inputIconCircle, { backgroundColor: isDark ? 'rgba(86,185,255,0.1)' : 'rgba(21,91,157,0.06)' }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
                </View>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter password"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (localError) setLocalError(null);
                    if (loginError) clearError();
                  }}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  editable={!isLoading}
                  onSubmitEditing={handleLogin}
                  returnKeyType="done"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  hitSlop={8}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.icon}
                  />
                </Pressable>
              </View>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/(auth)/forgot-password');
                }}
                style={({ pressed }) => [
                  styles.forgotPasswordButton,
                  { opacity: pressed ? 0.6 : 1 }
                ]}
                hitSlop={8}
              >
                <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                  Forgot Password?
                </Text>
              </Pressable>
            </View>

            {/* Error Message */}
            {displayError ? (
              <View style={[styles.errorContainer, { backgroundColor: isDark ? 'rgba(58,15,20,0.6)' : 'rgba(253,242,242,0.9)' }]}>
                <Ionicons name="alert-circle" size={18} color="#f43f5e" />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <Pressable
              onPress={isLoading ? undefined : handleLogin}
              style={({ pressed }) => [
                styles.submitButton,
                {
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                },
              ]}
            >
              <LinearGradient
                colors={isLoading
                  ? [colors.secondary, colors.secondary]
                  : [colors.primary, isDark ? '#3d8fd4' : '#1a6db8']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitGradient}
              >
                {isLoading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text style={styles.submitButtonText}>Signing in...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>Log In</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          <Text style={[styles.footerText, { color: colors.muted }]}>
            Your credentials are provided by your company administrator.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  orbTopRight: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    overflow: 'hidden',
  },
  orbBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
  },
  orbGradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    gap: 32,
  },
  headerArea: {
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 220,
    height: 70,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.subheadline,
    textAlign: 'center',
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: 24,
    gap: 20,
    // Frosted glass shadow
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
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
  eyeButton: {
    padding: 10,
    marginRight: 2,
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
    // Glow shadow
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    ...Typography.buttonSmall,
  },
  footerText: {
    ...Typography.footnote,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
