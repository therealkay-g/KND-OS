import React from 'react';
import { Redirect, Stack } from 'expo-router';

import { useApp } from '@/lib/data-provider';
import { colors } from '@/lib/theme';

export default function AppLayout() {
  const { hydrated, isLoggedIn } = useApp();

  if (!hydrated) return null;
  if (!isLoggedIn) return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="client/[id]" />
    </Stack>
  );
}
