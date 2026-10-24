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
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { Field } from '@/components/ui/field';
import { KText } from '@/components/ui/text';
import { DEV_OTP_CODE, useApp } from '@/lib/data-provider';
import { formatPhone } from '@/lib/format';
import { colors, radius } from '@/lib/theme';

export default function CodeScreen() {
  const params = useLocalSearchParams<{ phone?: string }>();
  const { data, isLoggedIn, pendingPhone, requestOtp, verifyOtp, login } = useApp();
  const phone = params.phone || pendingPhone;
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  if (isLoggedIn) return <Redirect href="/dashboard" />;
  if (!phone) return <Redirect href="/login" />;

  const handleCodeChange = (value: string) => {
    setCode(value.replace(/\D/g, '').slice(0, 4));
    if (error) setError('');
    if (info) setInfo('');
  };

  const handleValidate = () => {
    if (code.length !== 4) {
      setError('Entrez les 4 chiffres du code.');
      return;
    }
    if (!verifyOtp(code)) {
      setError('Code incorrect. Vérifiez le code reçu et réessayez.');
      return;
    }

    if (data.merchant) {
      login();
      router.replace('/dashboard');
    } else {
      router.replace({ pathname: '/mode', params: { phone } });
    }
  };

  const handleResend = () => {
    requestOtp(phone);
    setInfo('Un nouveau code a été envoyé (démo : 1234).');
    setError('');
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
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace('/login');
              }}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              hitSlop={8}
              style={styles.back}>
              <ArrowLeft size={20} color={colors.textSecondary} strokeWidth={2} />
              <KText variant="small" color={colors.textSecondary}>
                Modifier le numéro
              </KText>
            </Pressable>

            <View style={styles.iconWrap}>
              <ShieldCheck size={28} color={colors.accent} strokeWidth={1.8} />
            </View>

            <View style={styles.heading}>
              <KText variant="title" style={styles.title}>
                Vérification WhatsApp
              </KText>
              <KText variant="body" color={colors.textSecondary} style={styles.subtitle}>
                Entrez le code à 4 chiffres envoyé au{' '}
                <KText variant="body" color={colors.text}>
                  {formatPhone(phone)}
                </KText>
                .
              </KText>
            </View>

            <View style={styles.form}>
              <Field
                value={code}
                onChangeText={handleCodeChange}
                placeholder="••••"
                keyboardType="number-pad"
                maxLength={4}
                autoFocus
                error={error}
                helper={info || undefined}
                inputStyle={styles.codeInput}
                onSubmitEditing={handleValidate}
                returnKeyType="done"
              />
              <AppButton label="Valider le code" onPress={handleValidate} />
              <Pressable onPress={handleResend} accessibilityRole="button" style={styles.resend}>
                <KText variant="small" color={colors.textSecondary}>
                  Je n'ai pas reçu le code ?{' '}
                  <KText variant="small" color={colors.accent} style={styles.resendStrong}>
                    Renvoyer
                  </KText>
                </KText>
              </Pressable>
            </View>

            <View style={styles.demoCard}>
              <KText variant="small" color={colors.textMuted} style={styles.demoText}>
                <KText variant="small" color={colors.accent} style={styles.demoStrong}>
                  Mode démo ·{' '}
                </KText>
                Le code de développement est {DEV_OTP_CODE}.
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
    maxWidth: 420,
    alignSelf: 'center',
    gap: 20,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 12,
    marginTop: 4,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: 14,
    fontFamily: 'Inter_700Bold',
    paddingLeft: 14,
  },
  resend: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  resendStrong: {
    fontFamily: 'Inter_700Bold',
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
