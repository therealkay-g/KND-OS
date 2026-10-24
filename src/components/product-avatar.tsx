import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/theme';

const TINTS = ['#2C2413', '#182818', '#1A2833', '#2C1B1B', '#241F30', '#18302C'];

interface ProductAvatarProps {
  emoji: string;
  size?: number;
  muted?: boolean;
}

export function ProductAvatar({ emoji, size = 48, muted = false }: ProductAvatarProps) {
  const tintIndex =
    emoji.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0) % TINTS.length;

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size * 0.24,
          backgroundColor: muted ? colors.cardSoft : TINTS[tintIndex],
          opacity: muted ? 0.5 : 1,
        },
      ]}>
      <Text style={{ fontSize: size * 0.48, lineHeight: size * 0.62 }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
});
