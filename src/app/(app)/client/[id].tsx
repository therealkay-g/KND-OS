import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Users,
  Wallet,
} from 'lucide-react-native';

import { ClientAvatar } from '@/components/client-avatar';
import { PageHeader } from '@/components/page-header';
import { AppButton } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Page } from '@/components/ui/page';
import { Sheet } from '@/components/ui/sheet';
import { KText } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useApp } from '@/lib/data-provider';
import { formatCDF, formatDateTime, formatPhone } from '@/lib/format';
import { getClientDebt } from '@/lib/stats';
import { colors, radius } from '@/lib/theme';

type TimelineEntry =
  | { kind: 'credit'; id: string; date: string; amount: number; label: string }
  | { kind: 'payment'; id: string; date: string; amount: number };

export default function ClientDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { data, payDebt } = useApp();
  const toast = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const client = data.clients.find((entry) => entry.id === params.id);
  const debt = client ? getClientDebt(data, client.id) : 0;

  const timeline = useMemo<TimelineEntry[]>(() => {
    if (!client) return [];
    const credits: TimelineEntry[] = data.sales
      .filter((sale) => sale.clientId === client.id && sale.paymentType === 'credit')
      .map((sale) => ({
        kind: 'credit' as const,
        id: sale.id,
        date: sale.createdAt,
        amount: sale.total,
        label: sale.items.map((item) => `${item.name} ×${item.quantity}`).join(', '),
      }));
    const payments: TimelineEntry[] = data.debtPayments
      .filter((payment) => payment.clientId === client.id)
      .map((payment) => ({
        kind: 'payment' as const,
        id: payment.id,
        date: payment.createdAt,
        amount: payment.amount,
      }));
    return [...credits, ...payments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [client, data.debtPayments, data.sales]);

  if (!client) {
    return (
      <Page>
        <PageHeader title="Fiche client" back />
        <EmptyState
          icon={Users}
          title="Client introuvable"
          description="Ce client n’existe plus sur cet appareil."
        />
      </Page>
    );
  }

  const openPayment = () => {
    setAmount(String(debt));
    setError('');
    setSheetOpen(true);
  };

  const handlePayment = () => {
    const parsed = Number(amount.replace(/\s/g, ''));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Entrez un montant valide.');
      return;
    }
    const result = payDebt(client.id, parsed);
    if (!result.ok) {
      setError(result.message ?? 'Le paiement n’a pas pu être enregistré.');
      return;
    }
    setSheetOpen(false);
    toast(`Dette encaissée : ${formatCDF(parsed)}.`);
  };

  return (
    <View style={styles.root}>
      <Page>
        <PageHeader title="Fiche client" back />

        <Card style={styles.identityCard}>
          <ClientAvatar name={client.name} size={56} />
          <View style={styles.identityTexts}>
            <KText variant="title" numberOfLines={1}>
              {client.name}
            </KText>
            <KText variant="small" color={colors.textSecondary}>
              {client.phone ? formatPhone(client.phone) : 'Sans numéro'}
            </KText>
          </View>
        </Card>

        <Card style={[styles.debtCard, debt > 0 ? styles.debtCardActive : styles.debtCardClear]}>
          <View style={styles.debtTexts}>
            <KText variant="label" color={colors.textSecondary}>
              Dette totale
            </KText>
            <KText
              variant="display"
              color={debt > 0 ? colors.red : colors.green}
              style={styles.debtValue}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {formatCDF(debt)}
            </KText>
            <KText variant="small" color={colors.textMuted}>
              {debt > 0 ? 'À encaisser auprès du client' : 'Dette soldée'}
            </KText>
          </View>
          <View style={[styles.debtIcon, debt > 0 ? styles.debtIconActive : styles.debtIconClear]}>
            <Wallet size={24} color={debt > 0 ? colors.red : colors.green} strokeWidth={1.8} />
          </View>
        </Card>

        {debt > 0 ? (
          <AppButton
            label="Encaisser dette"
            onPress={openPayment}
            icon={<Banknote size={18} color={colors.black} strokeWidth={2} />}
          />
        ) : null}

        <View style={styles.sectionHeader}>
          <KText variant="label" color={colors.textSecondary}>
            Historique
          </KText>
          <KText variant="small" color={colors.textMuted}>
            {timeline.length} mouvement{timeline.length > 1 ? 's' : ''}
          </KText>
        </View>

        {timeline.length === 0 ? (
          <Card style={styles.emptyCard}>
            <KText variant="body" color={colors.textSecondary} style={styles.emptyText}>
              Aucun crédit ni paiement pour ce client.
            </KText>
          </Card>
        ) : (
          <View style={styles.timeline}>
            {timeline.map((entry, index) => {
              const isCredit = entry.kind === 'credit';
              return (
                <View
                  key={entry.id}
                  style={[
                    styles.timelineRow,
                    index === timeline.length - 1 ? styles.timelineRowLast : null,
                  ]}>
                  <View
                    style={[
                      styles.timelineIcon,
                      isCredit ? styles.timelineIconCredit : styles.timelineIconPayment,
                    ]}>
                    {isCredit ? (
                      <ArrowUpRight size={17} color={colors.red} strokeWidth={2} />
                    ) : (
                      <ArrowDownLeft size={17} color={colors.green} strokeWidth={2} />
                    )}
                  </View>
                  <View style={styles.timelineTexts}>
                    <KText variant="body" style={styles.timelineTitle}>
                      {isCredit ? 'Vente à crédit' : 'Encaissement'}
                    </KText>
                    <KText variant="small" color={colors.textMuted} numberOfLines={1}>
                      {formatDateTime(entry.date)}
                      {entry.kind === 'credit' && entry.label ? ` · ${entry.label}` : ''}
                    </KText>
                  </View>
                  <KText
                    variant="price"
                    color={isCredit ? colors.red : colors.green}
                    numberOfLines={1}>
                    {isCredit ? '+' : '−'} {formatCDF(entry.amount)}
                  </KText>
                </View>
              );
            })}
          </View>
        )}
      </Page>

      <Sheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Encaisser la dette"
        subtitle={`${client.name} · dette de ${formatCDF(debt)}`}
        footer={
          <View style={styles.footerButton}>
            <AppButton label="Encaisser" onPress={handlePayment} />
          </View>
        }>
        <Field
          label="Montant reçu (CDF)"
          value={amount}
          onChangeText={(value) => {
            setAmount(value.replace(/\D/g, '').slice(0, 9));
            if (error) setError('');
          }}
          placeholder="0"
          keyboardType="numeric"
          inputMode="numeric"
          autoFocus
          error={error}
          helper={`Dette restante : ${formatCDF(debt)}`}
        />
        <Pressable
          onPress={() => setAmount(String(debt))}
          accessibilityRole="button"
          style={({ pressed }) => [styles.fullAmount, pressed ? styles.fullAmountPressed : null]}>
          <KText variant="small" color={colors.accent}>
            Tout encaisser · {formatCDF(debt)}
          </KText>
        </Pressable>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 10,
  },
  identityTexts: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  debtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 12,
  },
  debtCardActive: {
    borderColor: colors.redBorder,
    backgroundColor: colors.redSoft,
  },
  debtCardClear: {
    borderColor: colors.greenBorder,
    backgroundColor: colors.greenSoft,
  },
  debtTexts: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  debtValue: {
    fontSize: 32,
    lineHeight: 38,
  },
  debtIcon: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debtIconActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.13)',
  },
  debtIconClear: {
    backgroundColor: 'rgba(34, 197, 94, 0.13)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
    marginBottom: 10,
  },
  timeline: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timelineRowLast: {
    borderBottomWidth: 0,
  },
  timelineIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIconCredit: {
    backgroundColor: colors.redSoft,
  },
  timelineIconPayment: {
    backgroundColor: colors.greenSoft,
  },
  timelineTexts: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  timelineTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 18,
  },
  emptyCard: {
    paddingVertical: 26,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  footerButton: {
    flex: 1,
  },
  fullAmount: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  fullAmountPressed: {
    opacity: 0.7,
  },
});
