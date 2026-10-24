import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import { ArrowRight, WifiOff } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/brand/logo';
import { AppButton } from '@/components/ui/app-button';
import { Field } from '@/components/ui/field';
import { KText } from '@/components/ui/text';
import { useApp } from '@/lib/data-provider';
import { colors, layout, radius } from '@/lib/theme';

export default function LoginScreen() {
  const { isLoggedIn, requestOtp } = useApp();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  if (isLoggedIn) return <Redirect href="/dashboard" />;

  const handlePhoneChange = (value: string) => {
    setPhone(value.replace(/\D/g, '').slice(0, 9));
    if (error) setError('');
  };

  const handleContinue = () => {
    if (phone.length !== 9) {
      setError('Entrez un numéro à 9 chiffres (ex. 970 000 000).');
      return;
    }
    requestOtp(phone);
    router.push({ pathname: '/code', params: { phone } });
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
            <View style={styles.brand}>
              <Logo size="lg" />
              <View style={styles.heading}>
                <KText variant="display" style={styles.title}>
                  La caisse des{'\n'}commerçants de Kindu.
                </KText>
                <KText variant="body" color={colors.textSecondary} style={styles.subtitle}>
                  Vendez, gérez votre stock et vos crédits clients — même sans internet.
                </KText>
              </View>
            </View>

            <View style={styles.form}>
              <Field
                label="Numéro WhatsApp"
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="97 000 0000"
                keyboardType="phone-pad"
                prefix="+243"
                maxLength={14}
                autoComplete="tel"
                textContentType="telephoneNumber"
                error={error}
                helper="Un code à 4 chiffres vous sera envoyé par WhatsApp."
                onSubmitEditing={handleContinue}
                returnKeyType="go"
                inputStyle={styles.phoneInput}
              />
              <AppButton
                label="Recevoir le code WhatsApp"
                onPress={handleContinue}
                iconRight={<ArrowRight size={18} color={colors.black} strokeWidth={2.2} />}
              />
            </View>

            <View style={styles.features}>
              <View style={styles.feature}>
                <WifiOff size={15} color={colors.accent} strokeWidth={1.8} />
                <KText variant="small" color={colors.textSecondary}>
                  100 % hors ligne
                </KText>
              </View>
              <View style={styles.divider} />
              <KText variant="small" color={colors.textSecondary}>
                Stock & crédits
              </KText>
              <View style={styles.divider} />
              <KText variant="small" color={colors.textSecondary}>
                Kindu Search
              </KText>
            </View>

            <View style={styles.demoCard}>
              <KText variant="small" color={colors.textMuted} style={styles.demoText}>
                <KText variant="small" color={colors.accent} style={styles.demoStrong}>
                  Mode démo ·{' '}
                </KText>
                Saisissez un numéro à 9 chiffres, puis le code 1234.
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
    paddingVertical: 32,
  },
  container: {
    width: '100%',
    maxWidth: layout.formWidth,
    alignSelf: 'center',
    gap: 32,
  },
  brand: {
    gap: 28,
  },
  heading: {
    gap: 12,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
  },
  subtitle: {
    maxWidth: 380,
    lineHeight: 21,
  },
  form: {
    gap: 14,
  },
  phoneInput: {
    fontSize: 17,
    letterSpacing: 1,
  },
  features: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: -8,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
  },
  demoCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.cardSoft,
  },
  demoText: {
    lineHeight: 18,
  },
  demoStrong: {
    fontFamily: 'Inter_700Bold',
  },
});
