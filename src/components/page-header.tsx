import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

import { colors } from '@/lib/theme';

import { IconButton } from './ui/icon-button';
import { KText } from './ui/text';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
}

export function PageHeader({ title, subtitle, back = false, right }: PageHeaderProps) {
  return (
    <View style={styles.container}>
      {back ? (
        <IconButton
          icon={ArrowLeft}
          accessibilityLabel="Retour"
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/dashboard');
          }}
          style={styles.back}
        />
      ) : null}
      <View style={styles.texts}>
        <KText variant="title">{title}</KText>
        {subtitle ? (
          <KText variant="small" color={colors.textSecondary} style={styles.subtitle}>
            {subtitle}
          </KText>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  back: {
    marginRight: 2,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
