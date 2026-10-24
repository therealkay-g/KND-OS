import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/lib/theme';

import { KText } from './text';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  count?: number;
}

export function Chip({ label, selected = false, onPress, disabled = false, style, count }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.unselected,
        disabled ? styles.disabled : null,
        pressed && onPress ? styles.pressed : null,
        style,
      ]}>
      <KText
        variant="small"
        color={selected ? colors.black : colors.textSecondary}
        style={[styles.label, selected ? styles.labelSelected : null]}>
        {label}
      </KText>
      {typeof count === 'number' ? (
        <View style={[styles.count, selected ? styles.countSelected : null]}>
          <KText
            variant="small"
            color={selected ? colors.black : colors.textMuted}
            style={styles.countText}>
            {count}
          </KText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  selected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  unselected: {
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
  },
  labelSelected: {
    fontFamily: 'Inter_700Bold',
  },
  count: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countSelected: {
    backgroundColor: 'rgba(0,0,0,0.16)',
  },
  countText: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: 'Inter_700Bold',
  },
});
