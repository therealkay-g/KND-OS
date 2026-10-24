import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { type TabListProps, type TabTriggerSlotProps } from 'expo-router/ui';
import { type LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, radius } from '@/lib/theme';

import { KText } from './ui/text';

/**
 * Le ref du slot est fourni par expo-router/ui ; on ne le transmet pas à
 * Pressable dont le type de ref diffère (React Native 0.88).
 */
interface NavItemProps extends Omit<TabTriggerSlotProps, 'ref'> {
  label: string;
  icon: LucideIcon;
}

export function NavItem({ label, icon: Icon, isFocused, ...props }: NavItemProps) {
  const activeColor = colors.accent;
  const inactiveColor = colors.textMuted;

  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: Boolean(isFocused) }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.item, pressed ? styles.itemPressed : null]}>
      <View style={[styles.iconWrap, isFocused ? styles.iconWrapActive : null]}>
        <Icon
          size={20}
          color={isFocused ? activeColor : inactiveColor}
          strokeWidth={isFocused ? 2.2 : 1.8}
        />
      </View>
      <KText
        variant="small"
        color={isFocused ? colors.text : colors.textMuted}
        style={[styles.label, isFocused ? styles.labelActive : null]}
        numberOfLines={1}>
        {label}
      </KText>
    </Pressable>
  );
}

export function BottomNav({ children, ...props }: TabListProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      {...props}
      style={[styles.wrap, { bottom: Math.max(insets.bottom, layout.navBottom) }]}>
      <View style={styles.bar}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 12,
    zIndex: 50,
  },
  bar: {
    width: '100%',
    maxWidth: layout.navWidth,
    height: layout.navHeight,
    backgroundColor: '#141416',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  item: {
    flex: 1,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: radius.md,
  },
  itemPressed: {
    opacity: 0.65,
  },
  iconWrap: {
    width: 40,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.accentSoft,
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: 'Inter_500Medium',
  },
  labelActive: {
    fontFamily: 'Inter_700Bold',
  },
});
