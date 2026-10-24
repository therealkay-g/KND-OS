import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react-native';

import { colors, radius } from '@/lib/theme';

import { KText } from './text';

export type ToastTone = 'success' | 'error' | 'info';

type ShowToast = (message: string, tone?: ToastTone) => void;

const ToastContext = createContext<ShowToast | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback<ShowToast>(
    (message, tone = 'success') => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, tone });
      opacity.setValue(0);
      translateY.setValue(12);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      timer.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: Platform.OS !== 'web',
        }).start(({ finished }) => {
          if (finished) setToast(null);
        });
      }, 2600);
    },
    [opacity, translateY],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const toneColor =
    toast?.tone === 'error' ? colors.red : toast?.tone === 'info' ? colors.accent : colors.green;
  const Icon = toast?.tone === 'error' ? AlertCircle : toast?.tone === 'info' ? Info : CheckCircle2;

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.host, { opacity, transform: [{ translateY }] }]}>
          <View style={styles.toast}>
            <Icon size={18} color={toneColor} strokeWidth={2} />
            <KText variant="body" color={colors.text} style={styles.text} numberOfLines={3}>
              {toast.message}
            </KText>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast doit être utilisé dans ToastProvider.');
  return context;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 108,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    maxWidth: 520,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1F1F22',
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
