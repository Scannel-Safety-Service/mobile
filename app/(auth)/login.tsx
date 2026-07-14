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
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.cardContainer}>
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

        {/* Form */}
        <View style={styles.formArea}>
          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>EMAIL ADDRESS</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark ? '#0b1624' : '#ffffff',
                  borderColor: displayError ? '#f43f5e' : colors.cardBorder,
                },
              ]}
            >
              <Ionicons name="mail-outline" size={20} color={colors.icon} style={styles.inputIcon} />
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
                  backgroundColor: isDark ? '#0b1624' : '#ffffff',
                  borderColor: displayError ? '#f43f5e' : colors.cardBorder,
                },
              ]}
            >
              <Ionicons name="lock-closed-outline" size={20} color={colors.icon} style={styles.inputIcon} />
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

          {/* Error Message — always in layout, animates in */}
          <View style={styles.errorSlot}>
            {displayError ? (
              <View style={[styles.errorContainer, { backgroundColor: isDark ? '#3a0f14' : '#fdf2f2' }]}>
                <Ionicons name="alert-circle" size={18} color="#f43f5e" />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            ) : null}
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={isLoading ? undefined : handleLogin}
            style={({ pressed }) => [
              styles.submitButton,
              {
                backgroundColor: isLoading ? colors.secondary : colors.primary,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#ffffff" size="small" />
                <Text style={styles.submitButtonText}>Signing in...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Log In</Text>
            )}
          </Pressable>
        </View>

        <Text style={[styles.footerText, { color: colors.muted }]}>
          Your credentials are provided by your company administrator.
        </Text>
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
    gap: 32,
  },
  headerArea: {
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 220,
    height: 70,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  formArea: {
    gap: 16,
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
  eyeButton: {
    padding: 4,
  },
  errorSlot: {
    minHeight: 44, // Reserve space to avoid layout jump when error appears
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
