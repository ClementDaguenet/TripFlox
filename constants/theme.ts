/**
 * Modern Design System with Gradients and Advanced Styling
 * Complete color palette with gradients, patterns, and modern design tokens
 */

import { Platform } from 'react-native';

// Couleurs de base modernes
export const BaseColors = {
  // Orange moderne
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  // Violet moderne
  violet: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
  // Bleu moderne
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  // Gris moderne
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  // Couleurs d'état
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

// Gradients prédéfinis - Version épurée avec décorations subtiles
export const Gradients = {
  primary: ['#f8fafc', '#f1f5f9', '#e2e8f0'], // Gris avec nuance
  secondary: ['#fef7ff', '#f3e8ff', '#e9d5ff'], // Violet avec nuance
  sunset: ['#fef3f2', '#fed7aa', '#fdba74'], // Orange avec nuance
  ocean: ['#f0f9ff', '#e0f2fe', '#bae6fd'], // Bleu avec nuance
  forest: ['#f0fdf4', '#dcfce7', '#bbf7d0'], // Vert avec nuance
  fire: ['#fef2f2', '#fed7d7', '#fecaca'], // Rouge avec nuance
  night: ['#f8fafc', '#f1f5f9', '#e2e8f0'], // Gris neutre avec nuance
  aurora: ['#faf5ff', '#f3e8ff', '#e9d5ff'], // Violet avec nuance
};

// Ombres modernes
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 8,
  },
};

// Espacements modernes
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Rayons de bordure modernes
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// Thème clair moderne
export const LightTheme = {
  text: BaseColors.gray[900],
  background: '#ffffff',
  tint: BaseColors.orange[500],
  icon: BaseColors.gray[600],
  tabIconDefault: BaseColors.gray[600],
  tabIconSelected: BaseColors.orange[500],
  primary: BaseColors.orange[500],
  accent: BaseColors.violet[500],
  
  // Couleurs étendues
  primaryLight: BaseColors.orange[300],
  primaryDark: BaseColors.orange[700],
  secondary: BaseColors.violet[500],
  secondaryLight: BaseColors.violet[300],
  secondaryDark: BaseColors.violet[700],
  
  // Couleurs de fond
  backgroundSecondary: BaseColors.gray[50],
  backgroundTertiary: BaseColors.gray[100],
  
  // Couleurs de texte
  textSecondary: BaseColors.gray[700],
  textTertiary: BaseColors.gray[600],
  
  // Couleurs d'interface
  border: Platform.OS === 'android' ? BaseColors.gray[100] : BaseColors.gray[200],
  borderLight: BaseColors.gray[50],
  borderDark: Platform.OS === 'android' ? BaseColors.gray[200] : BaseColors.gray[300],
  
  // Couleurs d'état
  success: BaseColors.success,
  warning: BaseColors.warning,
  error: BaseColors.error,
  info: BaseColors.info,
  
  // Gradients
  gradients: {
    primary: Gradients.primary,
    secondary: Gradients.secondary,
    background: ['#ffffff', '#f8fafc'], // Blanc vers gris très clair
    card: ['#ffffff', '#f1f5f9'], // Blanc vers gris subtil
    sunset: Gradients.sunset,
    forest: Gradients.forest,
    ocean: Gradients.ocean,
    fire: Gradients.fire,
    night: Gradients.night,
    aurora: Gradients.aurora,
  },
  
  // Ombres
  shadows: Shadows,
  
  // Espacements
  spacing: Spacing,
  
  // Rayons
  borderRadius: BorderRadius,
};

// Thème sombre moderne
export const DarkTheme = {
  text: BaseColors.gray[50],
  background: BaseColors.gray[900],
  tint: BaseColors.orange[400],
  icon: BaseColors.gray[500],
  tabIconDefault: BaseColors.gray[500],
  tabIconSelected: BaseColors.orange[400],
  primary: BaseColors.orange[400],
  accent: BaseColors.violet[400],
  
  // Couleurs étendues
  primaryLight: BaseColors.orange[300],
  primaryDark: BaseColors.orange[600],
  secondary: BaseColors.violet[400],
  secondaryLight: BaseColors.violet[300],
  secondaryDark: BaseColors.violet[600],
  
  // Couleurs de fond
  backgroundSecondary: BaseColors.gray[800],
  backgroundTertiary: BaseColors.gray[700],
  
  // Couleurs de texte
  textSecondary: BaseColors.gray[300],
  textTertiary: BaseColors.gray[500],
  
  // Couleurs d'interface
  border: Platform.OS === 'android' ? BaseColors.gray[600] : BaseColors.gray[700],
  borderLight: Platform.OS === 'android' ? BaseColors.gray[500] : BaseColors.gray[600],
  borderDark: Platform.OS === 'android' ? BaseColors.gray[700] : BaseColors.gray[800],
  
  // Couleurs d'état
  success: BaseColors.success,
  warning: BaseColors.warning,
  error: BaseColors.error,
  info: BaseColors.info,
  
  // Gradients
  gradients: {
    primary: ['#1f2937', '#374151', '#4b5563'], // Gris sombre avec nuance
    secondary: ['#2d1b69', '#4c1d95', '#6d28d9'], // Violet sombre avec nuance
    background: [BaseColors.gray[900], BaseColors.gray[800]],
    card: [BaseColors.gray[800], BaseColors.gray[700]],
    sunset: ['#7c2d12', '#9a3412', '#c2410c'], // Orange sombre avec nuance
    forest: ['#14532d', '#166534', '#15803d'], // Vert sombre avec nuance
    ocean: ['#0c4a6e', '#075985', '#0284c7'], // Bleu sombre avec nuance
    fire: ['#7f1d1d', '#991b1b', '#dc2626'], // Rouge sombre avec nuance
    night: ['#1f2937', '#374151', '#4b5563'], // Gris neutre sombre avec nuance
    aurora: ['#581c87', '#7c3aed', '#a855f7'], // Violet sombre avec nuance
  },
  
  // Ombres
  shadows: Shadows,
  
  // Espacements
  spacing: Spacing,
  
  // Rayons
  borderRadius: BorderRadius,
};

export const Colors = {
  light: LightTheme,
  dark: DarkTheme,
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
