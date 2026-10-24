import '../global.css';

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Logo } from '@/components/brand/logo';
import { ToastProvider } from '@/components/ui/toast';
import { AppProvider, useApp } from '@/lib/data-provider';
import { colors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Le splash peut déjà être masqué lors d'un rechargement web.
});

function RootNavigator() {
  const { hydrated } = useApp();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const ready = (fontsLoaded || Boolean(fontError)) && hydrated;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {
        // Sans splash natif, rien à masquer.
      });
    }
  }, [ready]);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <Logo size="lg" />
      </View>
    );
  }

  return (
    <ToastProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="code" />
        <Stack.Screen name="mode" />
        <Stack.Screen name="(app)" />
      </Stack>
    </ToastProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
