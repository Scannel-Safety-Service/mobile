/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

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
    card: '#ffffff',
    cardBorder: '#e2effa',
    tint: '#155B9D',
    icon: '#537599',
    tabIconDefault: '#537599',
    tabIconSelected: '#155B9D',
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
    card: '#081729',
    cardBorder: '#0f2740',
    tint: '#56B9FF',
    icon: '#7ba2cc',
    tabIconDefault: '#7ba2cc',
    tabIconSelected: '#56B9FF',
  },
};

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
