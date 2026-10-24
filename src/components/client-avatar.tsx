import React from 'react';
import { StyleSheet, View } from 'react-native';

import { initials } from '@/lib/format';
import { colors } from '@/lib/theme';

import { KText } from './ui/text';

interface ClientAvatarProps {
  name: string;
  size?: number;
}

export function ClientAvatar({ name, size = 42 }: ClientAvatarProps) {
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size * 0.32,
        },
      ]}>
      <KText
        style={{
          fontFamily: 'Inter_700Bold',
          fontSize: size * 0.36,
          lineHeight: size * 0.46,
          color: colors.black,
        }}>
        {initials(name)}
      </KText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
