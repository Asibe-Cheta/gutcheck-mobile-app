/**
 * GutCheck Design System - Theme Configuration
 * Based on the specification's color palette and design tokens
 */

// Dark theme colors
const darkColors = {
  // Primary Colors
  primary: '#4fd1c7', // Soft Teal
  warning: '#ff7a7a', // Muted Coral
  success: '#68d391', // Sage Green
  background: '#1a1d29', // Deep Navy
  surface: '#2d3748', // Charcoal
  textPrimary: '#f7fafc', // Soft White
  textSecondary: '#a0aec0', // Warm Gray
  
  // Accent Colors
  accentTeal: '#4fd1c7',
  accentGreen: '#68d391',
  
  // Status Colors
  warningCoral: '#ff7a7a',
  successGreen: '#68d391',
  
  // Glass Effects
  glassBg: 'rgba(79, 209, 199, 0.1)',
  glassBorder: 'rgba(79, 209, 199, 0.2)',
  
  // Additional Colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

// Light theme colors
const lightColors = {
  // Primary Colors
  primary: '#4fd1c7', // Soft Teal (same)
  warning: '#ff7a7a', // Muted Coral (same)
  success: '#68d391', // Sage Green (same)
  background: '#ffffff', // White
  surface: '#f7fafc', // Light Gray
  textPrimary: '#1a1d29', // Dark Navy
  textSecondary: '#4a5568', // Medium Gray
  
  // Accent Colors
  accentTeal: '#4fd1c7',
  accentGreen: '#68d391',
  
  // Status Colors
  warningCoral: '#ff7a7a',
  successGreen: '#68d391',
  
  // Glass Effects
  glassBg: 'rgba(79, 209, 199, 0.1)',
  glassBorder: 'rgba(79, 209, 199, 0.2)',
  
  // Additional Colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

// Default to dark theme
export const colors = darkColors;

export const typography = {
  fontFamily: {
    primary: 'Inter',
    fallback: 'system',
  },
  fontSize: {
    h1: 32,
    h2: 28,
    h3: 24,
    bodyLarge: 18,
    body: 16,
    caption: 14,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
} as const;

export const shadows = {
  small: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

// Function to get theme colors based on mode
export const getThemeColors = (isDark: boolean) => {
  return isDark ? darkColors : lightColors;
};

// Hook to get current theme colors (for use in components)
export const useThemeColors = (isDark: boolean) => {
  return getThemeColors(isDark);
};

// Theme object for easy access
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} as const;

export type Theme = typeof theme;
export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
