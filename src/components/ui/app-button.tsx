import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius } from '@/lib/theme';

import { KText } from './text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'whatsapp';
type ButtonSize = 'lg' | 'md' | 'sm';

interface AppButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: colors.accent,
  },
  ghost: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.redSoft,
    borderColor: colors.redBorder,
  },
  whatsapp: {
    backgroundColor: '#25D366',
    borderColor: '#25D366',
  },
};

const labelColors: Record<ButtonVariant, string> = {
  primary: colors.black,
  secondary: colors.accent,
  ghost: colors.text,
  danger: colors.red,
  whatsapp: colors.white,
};

const heights: Record<ButtonSize, number> = {
  lg: 52,
  md: 48,
  sm: 40,
};

export function AppButton({
  label,
  variant = 'primary',
  size = 'lg',
  icon,
  iconRight,
  loading = false,
  fullWidth = true,
  disabled,
  style,
  ...rest
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(isDisabled) }}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        { minHeight: heights[size], opacity: isDisabled ? 0.45 : pressed ? 0.82 : 1 },
        fullWidth ? styles.fullWidth : null,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={labelColors[variant]} />
      ) : (
        <>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <KText variant="button" color={labelColors[variant]} numberOfLines={1}>
            {label}
          </KText>
          {iconRight ? <View style={styles.icon}>{iconRight}</View> : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
