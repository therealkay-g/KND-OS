import React from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout } from '@/lib/theme';

interface PageProps {
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  /** Espace supplémentaire en bas (panier flottant, par exemple). */
  extraBottom?: number;
}

/** Conteneur commun : largeur max, marges, espace pour la barre de navigation. */
export function Page({ children, contentStyle, scroll = true, extraBottom = 0 }: PageProps) {
  const insets = useSafeAreaInsets();
  const content = (
    <View style={[styles.content, contentStyle]}>
      {children}
    </View>
  );

  if (!scroll) {
    return <View style={styles.root}>{content}</View>;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: insets.top + 18,
          paddingBottom: layout.contentBottom + insets.bottom + extraBottom,
        },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: layout.gutter,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: layout.maxWidth,
  },
});
