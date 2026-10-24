import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { Badge } from '@/components/ui/badge';
import { Chip } from '@/components/ui/chip';
import { Field } from '@/components/ui/field';
import { KText } from '@/components/ui/text';
import { useApp } from '@/lib/data-provider';
import { STORE_MODES } from '@/lib/modes';
import { colors, radius } from '@/lib/theme';
import type { Commune, StoreMode } from '@/lib/types';

const COMMUNES: Commune[] = ['Kasuku', 'Alunguli', 'Mikelenge'];

export default function ModeScreen() {
  const params = useLocalSearchParams<{ phone?: string }>();
  const { data, isLoggedIn, completeOnboarding } = useApp();
  const phone = params.phone || data.merchant?.phone;
  const [storeName, setStoreName] = useState('');
  const [commune, setCommune] = useState<Commune>('Kasuku');
  const [mode, setMode] = useState<StoreMode>('Magasin');
  const [error, setError] = useState('');

  if (isLoggedIn) return <Redirect href="/dashboard" />;
  if (data.merchant && !isLoggedIn) return <Redirect href="/login" />;
  if (!phone) return <Redirect href="/login" />;

  const handleStart = () => {
    if (storeName.trim().length < 2) {
      setError('Entrez le nom de votre commerce.');
      return;
    }
    completeOnboarding({
      phone,
      storeName,
      commune,
      mode,
    });
    router.replace('/dashboard');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            <Pressable
              onPress={() => router.replace('/login')}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              hitSlop={8}
              style={styles.back}>
              <ArrowLeft size={20} color={colors.textSecondary} strokeWidth={2} />
              <KText variant="small" color={colors.textSecondary}>
                Retour
              </KText>
            </Pressable>

            <View style={styles.heading}>
              <KText variant="title" style={styles.title}>
                Configurez votre commerce
              </KText>
              <KText variant="body" color={colors.textSecondary} style={styles.subtitle}>
                Ces informations apparaîtront sur votre fiche Kindu Search après vérification.
              </KText>
            </View>

            <View style={styles.form}>
              <Field
                label="Nom du commerce"
                value={storeName}
                onChangeText={(value) => {
                  setStoreName(value);
                  if (error) setError('');
                }}
                placeholder="Ex. Alimentation Beya"
                autoCapitalize="words"
                error={error}
                helper="Le nom que verront vos clients."
                returnKeyType="done"
              />

              <View style={styles.group}>
                <KText variant="small" color={colors.textSecondary} style={styles.groupLabel}>
                  Commune
                </KText>
                <View style={styles.chips}>
                  {COMMUNES.map((item) => (
                    <Chip
                      key={item}
                      label={item}
                      selected={commune === item}
                      onPress={() => setCommune(item)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.group}>
                <KText variant="small" color={colors.textSecondary} style={styles.groupLabel}>
                  Mode de commerce
                </KText>
                <View style={styles.modeList}>
                  {STORE_MODES.map((item) => {
                    const Icon = item.icon;
                    const selected = mode === item.value;
                    return (
                      <Pressable
                        key={item.value}
                        disabled={!item.available}
                        onPress={() => setMode(item.value)}
                        accessibilityRole="button"
                        accessibilityState={{ selected, disabled: !item.available }}
                        style={({ pressed }) => [
                          styles.modeCard,
                          selected ? styles.modeCardSelected : null,
                          !item.available ? styles.modeCardDisabled : null,
                          pressed && item.available ? styles.modeCardPressed : null,
                        ]}>
                        <View style={[styles.modeIcon, selected ? styles.modeIconSelected : null]}>
                          <Icon
                            size={21}
                            color={selected ? colors.black : colors.accent}
                            strokeWidth={1.9}
                          />
                        </View>
                        <View style={styles.modeTexts}>
                          <KText variant="subtitle" style={styles.modeTitle}>
                            {item.value}
                          </KText>
                          <KText variant="small" color={colors.textSecondary}>
                            {item.description}
                          </KText>
                        </View>
                        {item.available ? (
                          <View style={[styles.check, selected ? styles.checkSelected : null]}>
                            {selected ? <Check size={14} color={colors.black} strokeWidth={3} /> : null}
                          </View>
                        ) : (
                          <Badge label="Bientôt" tone="neutral" />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={styles.actions}>
              <AppButton
                label="Ouvrir mon commerce"
                onPress={handleStart}
                iconRight={<ArrowRight size={18} color={colors.black} strokeWidth={2.2} />}
              />
              <KText variant="small" color={colors.textMuted} style={styles.footnote}>
                Vos données sont enregistrées sur cet appareil et fonctionnent hors ligne.
              </KText>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    gap: 22,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
  },
  heading: {
    gap: 8,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    lineHeight: 21,
  },
  form: {
    gap: 20,
  },
  group: {
    gap: 9,
  },
  groupLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    textTransform: 'none',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modeList: {
    gap: 8,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardSoft,
  },
  modeCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  modeCardDisabled: {
    opacity: 0.55,
  },
  modeCardPressed: {
    opacity: 0.8,
  },
  modeIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIconSelected: {
    backgroundColor: colors.accent,
  },
  modeTexts: {
    flex: 1,
    gap: 2,
  },
  modeTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  actions: {
    gap: 10,
  },
  footnote: {
    textAlign: 'center',
    lineHeight: 17,
  },
});
