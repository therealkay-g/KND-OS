import React from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { colors, fonts } from '@/lib/theme';

export type TextVariant =
  | 'display'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'small'
  | 'label'
  | 'price'
  | 'number'
  | 'button'
  | 'code';

interface KTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  weight?: 'regular' | 'medium' | 'bold' | 'extraBold';
}

export function KText({
  variant = 'body',
  color,
  weight,
  style,
  children,
  ...rest
}: KTextProps) {
  return (
    <Text
      {...rest}
      style={[
        styles.base,
        variants[variant],
        color ? { color } : null,
        weight ? { fontFamily: fonts[weight] } : null,
        style,
      ]}>
      {children}
    </Text>
  );
}

const variants = StyleSheet.create<Record<TextVariant, TextStyle>>({
  display: {
    fontFamily: fonts.extraBold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 22,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  small: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 18,
    fontVariant: ['tabular-nums'],
  },
  number: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  button: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  code: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: 12,
    fontVariant: ['tabular-nums'],
  },
});

const styles = StyleSheet.create({
  base: {
    color: colors.text,
  },
});
