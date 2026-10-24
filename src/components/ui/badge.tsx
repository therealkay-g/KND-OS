import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/lib/theme';

import { KText } from './text';

export type BadgeTone = 'accent' | 'green' | 'red' | 'orange' | 'neutral' | 'dark';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: StyleProp<ViewStyle>;
  dot?: boolean;
}

const tones: Record<BadgeTone, { background: string; border: string; text: string }> = {
  accent: {
    background: colors.accentSoft,
    border: colors.accentBorder,
    text: colors.accent,
  },
  green: {
    background: colors.greenSoft,
    border: colors.greenBorder,
    text: colors.green,
  },
  red: {
    background: colors.redSoft,
    border: colors.redBorder,
    text: colors.red,
  },
  orange: {
    background: colors.orangeSoft,
    border: 'rgba(249, 115, 22, 0.35)',
    text: colors.orange,
  },
  neutral: {
    background: 'rgba(161, 161, 170, 0.10)',
    border: 'rgba(161, 161, 170, 0.22)',
    text: colors.textSecondary,
  },
  dark: {
    background: colors.black,
    border: colors.black,
    text: colors.white,
  },
};

export function Badge({ label, tone = 'neutral', style, dot = false }: BadgeProps) {
  const palette = tones[tone];
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: palette.background, borderColor: palette.border },
        style,
      ]}>
      {dot ? <View style={[styles.dot, { backgroundColor: palette.text }]} /> : null}
      <KText variant="small" color={palette.text} style={styles.label} numberOfLines={1}>
        {label}
      </KText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: 'Inter_500Medium',
  },
});
