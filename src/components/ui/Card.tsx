/**
 * Card Component
 * Reusable card with glassmorphism styling
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@/lib/theme';
import { CardProps } from '@/types';

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  style,
  ...props
}: CardProps & { style?: ViewStyle }) {
  const cardStyle = [
    styles.base,
    styles[variant],
    styles[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}`],
    style,
  ];

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  
  // Variants
  default: {
    backgroundColor: theme.colors.secondaryDark,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  glass: {
    backgroundColor: theme.colors.glassBg,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  elevated: {
    backgroundColor: theme.colors.secondaryDark,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    ...theme.shadows.medium,
  },
  
  // Padding variants
  paddingSm: {
    padding: theme.spacing.sm,
  },
  paddingMd: {
    padding: theme.spacing.md,
  },
  paddingLg: {
    padding: theme.spacing.lg,
  },
});
