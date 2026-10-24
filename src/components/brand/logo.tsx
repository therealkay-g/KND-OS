import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/lib/theme';

import { KText } from '../ui/text';

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  size?: LogoSize;
  showWordmark?: boolean;
}

const dimensions: Record<LogoSize, { mark: number; wordmark: number; gap: number; radius: number }> = {
  sm: { mark: 34, wordmark: 20, gap: 9, radius: 10 },
  md: { mark: 44, wordmark: 26, gap: 11, radius: 13 },
  lg: { mark: 76, wordmark: 40, gap: 15, radius: 20 },
};

export function Logo({ size = 'md', showWordmark = true }: LogoProps) {
  const dimension = dimensions[size];

  return (
    <View style={[styles.row, { gap: dimension.gap }]}>
      <View
        style={[
          styles.mark,
          {
            width: dimension.mark,
            height: dimension.mark,
            borderRadius: dimension.radius,
          },
        ]}>
        <KText
          style={[
            styles.markLetter,
            {
              fontSize: dimension.mark * 0.56,
              lineHeight: dimension.mark * 0.7,
            },
          ]}>
          K
        </KText>
      </View>
      {showWordmark ? (
        <KText
          style={[
            styles.wordmark,
            { fontSize: dimension.wordmark, lineHeight: dimension.wordmark * 1.2 },
          ]}>
          KND <KText style={styles.os}>OS</KText>
        </KText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mark: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  markLetter: {
    fontFamily: 'Inter_800ExtraBold',
    color: colors.black,
    letterSpacing: -2,
  },
  wordmark: {
    fontFamily: 'Inter_800ExtraBold',
    color: colors.text,
    letterSpacing: -1,
  },
  os: {
    color: colors.accent,
    fontFamily: 'Inter_800ExtraBold',
  },
});
