import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/lib/theme';

import { KText } from './ui/text';

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  valueColor?: string;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export function StatTile({
  label,
  value,
  hint,
  valueColor = colors.accent,
  style,
  compact = false,
}: StatTileProps) {
  return (
    <View style={[styles.container, compact ? styles.compact : null, style]}>
      <KText variant="label" color={colors.textSecondary} numberOfLines={2}>
        {label}
      </KText>
      <KText
        variant="number"
        color={valueColor}
        style={[styles.value, compact ? styles.valueCompact : null]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}>
        {value}
      </KText>
      {hint ? (
        <KText variant="small" color={colors.textMuted} numberOfLines={1} style={styles.hint}>
          {hint}
        </KText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
    gap: 4,
    justifyContent: 'space-between',
  },
  compact: {
    padding: 12,
    gap: 3,
  },
  value: {
    fontSize: 24,
    lineHeight: 30,
  },
  valueCompact: {
    fontSize: 19,
    lineHeight: 24,
  },
  hint: {
    fontSize: 11,
    lineHeight: 14,
  },
});
