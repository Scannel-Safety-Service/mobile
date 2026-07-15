/**
 * Scannel Safety Service — Design System Tokens
 *
 * Single source of truth for colors, typography, spacing, radii, and shadows.
 * Typography scale follows iOS Human Interface Guidelines type ramp which maps
 * naturally to Android's Material 3 type scale.
 */

import { Platform, TextStyle } from 'react-native';

/* ──────────────────────── Colors ──────────────────────── */

export const Colors = {
  light: {
    primary: '#155B9D',
    primaryHover: '#2B7CC1',
    secondary: '#1F6CB0',
    muted: '#537599',
    accent: '#2DA7FF',
    accentHover: '#56B9FF',
    background: '#f4f8fc',
    text: '#081d33',
    textSecondary: '#3d5a7a',
    card: '#ffffff',
    cardBorder: '#e2effa',
    tint: '#155B9D',
    icon: '#537599',
    tabIconDefault: '#537599',
    tabIconSelected: '#155B9D',
    separator: '#e2effa',
    success: '#10b981',
    warning: '#d97706',
    danger: '#f43f5e',
    surfaceElevated: '#ffffff',
  },
  dark: {
    primary: '#56B9FF',
    primaryHover: '#7CCBFF',
    secondary: '#2B7CC1',
    muted: '#7ba2cc',
    accent: '#2DA7FF',
    accentHover: '#56B9FF',
    background: '#040e1a',
    text: '#f0f7ff',
    textSecondary: '#a3c0df',
    card: '#081729',
    cardBorder: '#0f2740',
    tint: '#56B9FF',
    icon: '#7ba2cc',
    tabIconDefault: '#7ba2cc',
    tabIconSelected: '#56B9FF',
    separator: '#0f2740',
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#fb7185',
    surfaceElevated: '#0c1f35',
  },
};

/* ──────────────────────── Fonts ──────────────────────── */

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

/* ──────────────────── Typography Scale ──────────────────── */
/*
 * Follows iOS HIG type ramp with Android-friendly equivalents.
 * Use these semantic names instead of raw fontSize / fontWeight values.
 *
 * iOS SF Pro       → System font on iOS (automatically used)
 * Android Roboto   → System font on Android (automatically used)
 */

export const Typography = {
  /** 34px / bold — Hero headings, splash text */
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 41,
    letterSpacing: 0.37,
  },
  /** 28px / bold — Screen titles, primary headings */
  title1: {
    fontSize: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 34,
    letterSpacing: 0.36,
  },
  /** 22px / bold — Section headings */
  title2: {
    fontSize: 22,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 28,
    letterSpacing: 0.35,
  },
  /** 20px / semibold — Card titles, sub-sections */
  title3: {
    fontSize: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 25,
    letterSpacing: 0.38,
  },
  /** 17px / semibold — Emphasized body, nav bar titles */
  headline: {
    fontSize: 17,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  /** 17px / regular — Primary body content */
  body: {
    fontSize: 17,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  /** 16px / regular — Slightly smaller body */
  callout: {
    fontSize: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 21,
    letterSpacing: -0.32,
  },
  /** 15px / regular — Secondary text, descriptions */
  subheadline: {
    fontSize: 15,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  /** 13px / regular — Supporting text, timestamps */
  footnote: {
    fontSize: 13,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 18,
    letterSpacing: -0.08,
  },
  /** 12px / regular — Helper text, labels */
  caption1: {
    fontSize: 12,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 16,
    letterSpacing: 0,
  },
  /** 11px / regular — Overline text, micro-labels */
  caption2: {
    fontSize: 11,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 13,
    letterSpacing: 0.07,
  },
  /** 12px / semibold+tracking — Section labels, form labels */
  overline: {
    fontSize: 12,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 16,
    letterSpacing: 1.0,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  },
  /** 16px / semibold — Button text */
  button: {
    fontSize: 16,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  /** 14px / semibold — Small button text */
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 20,
    letterSpacing: -0.15,
  },
} as const;

/* ──────────────────── Spacing Scale ──────────────────── */

export const Spacing = {
  /** 4px */  xs: 4,
  /** 8px */  sm: 8,
  /** 12px */ md: 12,
  /** 16px */ lg: 16,
  /** 20px */ xl: 20,
  /** 24px */ '2xl': 24,
  /** 32px */ '3xl': 32,
  /** 40px */ '4xl': 40,
  /** 48px */ '5xl': 48,
  /** 64px */ '6xl': 64,
} as const;

/* ──────────────────── Border Radii ──────────────────── */

export const Radii = {
  /** 8px */   sm: 8,
  /** 12px */  md: 12,
  /** 16px */  lg: 16,
  /** 20px */  xl: 20,
  /** 24px */  '2xl': 24,
  /** 28px */  '3xl': 28,
  /** 9999px */ full: 9999,
} as const;
