import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { colors, radius } from '@/lib/theme';

interface IconButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
}

export function IconButton({
  icon: Icon,
  onPress,
  accessibilityLabel,
  size = 42,
  iconSize = 20,
  style,
  color = colors.text,
  backgroundColor = colors.card,
  borderColor = colors.border,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius.md,
          backgroundColor,
          borderColor,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}>
      <Icon size={iconSize} color={color} strokeWidth={1.9} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
