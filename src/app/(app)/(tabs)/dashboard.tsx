import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  Cloud,
  CloudOff,
  Package,
  RefreshCw,
  Settings,
  ShoppingCart,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react-native';

import { Logo } from '@/components/brand/logo';
import { Page } from '@/components/ui/page';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { KText } from '@/components/ui/text';
import { useApp } from '@/lib/data-provider';
import { formatCDF, formatCountLabel, formatLongDate, formatTime } from '@/lib/format';
import { countClientsWithDebt, countExpiringSoon, getTotalDebt } from '@/lib/stats';
import { colors, radius } from '@/lib/theme';

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onPress: () => void;
  wide: boolean;
}

function ActionCard({ icon: Icon, title, subtitle, onPress, wide }: ActionCardProps) {
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={title}
      style={[styles.actionCard, wide ? styles.actionCardWide : styles.actionCardNarrow]}>
      <View style={styles.actionIcon}>
        <Icon size={24} color={colors.accent} strokeWidth={1.8} />
      </View>
      <View style={styles.actionTexts}>
        <KText variant="subtitle" style={styles.actionTitle}>
          {title}
        </KText>
        <KText variant="small" color={colors.textSecondary} numberOfLines={1} style={styles.actionSubtitle}>
          {subtitle}
        </KText>
      </View>
    </Card>
  );
}

export default function DashboardScreen() {
  const { data, todayStats, lowStockProducts, stockSync } = useApp();
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const merchant = data.merchant;
  const clientsWithDebt = countClientsWithDebt(data, data.clients);
  const totalDebt = getTotalDebt(data, data.clients);
  const localOnlySync = data.syncQueue.filter(
    (item) =>
      !item.synced && item.tableName !== 'places' && item.tableName !== 'products',
  ).length;
  const isPharmacy = merchant?.mode === 'Pharmacie';
  const isHardware = merchant?.mode === 'Quincaillerie';
  const expiringSoonCount = countExpiringSoon(data.products);

  const syncCard =
    stockSync.state === 'disabled'
      ? {
          Icon: CloudOff,
          color: colors.textMuted,
          title: 'Données enregistrées sur cet appareil',
          hint: 'Mode hors ligne · source de vérité locale',
        }
      : stockSync.state === 'syncing'
        ? {
            Icon: RefreshCw,
            color: colors.accent,
            title: 'Mise à jour du stock live…',
            hint: 'Kindu Search se met à jour automatiquement',
          }
        : stockSync.state === 'error'
          ? {
              Icon: CloudOff,
              color: colors.red,
              title: 'Stock live indisponible',
              hint: stockSync.message ?? 'Vérifiez la connexion puis réessayez.',
            }
          : stockSync.pendingStock > 0
            ? {
                Icon: CloudOff,
                color: colors.accent,
                title: `${formatCountLabel(
                  stockSync.pendingStock,
                  'mise à jour',
                  'mises à jour',
                )} du stock en attente`,
                hint: 'Synchronisation dès que la connexion le permet',
              }
            : stockSync.state === 'live'
              ? {
                  Icon: Cloud,
                  color: colors.green,
                  title: 'Stock live à jour',
                  hint: stockSync.lastSyncedAt
                    ? `Dernière synchro ${formatTime(stockSync.lastSyncedAt)} · ventes et clients restent locaux`
                    : 'Kindu Search est synchronisé · ventes et clients restent locaux',
                }
              : {
                  Icon: Cloud,
                  color: colors.textMuted,
                  title: 'Stock live prêt',
                  hint: localOnlySync
                    ? `${formatCountLabel(localOnlySync, 'opération')} locale(s) · en attente d’une vente`
                    : 'En attente d’une vente ou d’une modification de stock',
                };

  const SyncIcon = syncCard.Icon;

  if (!merchant) return null;

  return (
    <Page>
      <View style={styles.topBar}>
        <View style={styles.identity}>
          <Logo size="sm" showWordmark={false} />
          <View style={styles.identityTexts}>
            <KText variant="label" color={colors.textMuted}>
              KND OS
            </KText>
            <KText variant="subtitle" numberOfLines={1} style={styles.storeName}>
              {merchant.storeName}
            </KText>
          </View>
        </View>
        <IconButton
          icon={Settings}
          accessibilityLabel="Paramètres"
          onPress={() => router.push('/settings')}
        />
      </View>

      <View style={styles.metaRow}>
        <Badge label={merchant.mode} tone="accent" dot />
        <KText variant="small" color={colors.textMuted}>
          {formatLongDate()} · {merchant.commune}
        </KText>
      </View>

      {wide ? (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardMain]}>
            <KText variant="label" color={colors.textSecondary}>
              Vendu aujourd'hui
            </KText>
            <KText variant="number" color={colors.accent} style={styles.statValueLarge} numberOfLines={1}>
              {formatCDF(todayStats.total)}
            </KText>
            <KText variant="small" color={colors.textMuted}>
              {formatCountLabel(todayStats.count, 'vente')} aujourd'hui
            </KText>
          </View>
          <View style={styles.statCard}>
            <KText variant="label" color={colors.textSecondary}>
              Bénéfice aujourd'hui
            </KText>
            <KText variant="number" color={colors.accent} style={styles.statValue} numberOfLines={1}>
              {formatCDF(todayStats.profit)}
            </KText>
            <KText variant="small" color={colors.textMuted}>
              Vente − achat
            </KText>
          </View>
          <View style={styles.statCard}>
            <KText variant="label" color={colors.textSecondary}>
              Ventes
            </KText>
            <KText variant="number" style={styles.statValue}>
              {todayStats.count}
            </KText>
            <KText variant="small" color={colors.textMuted}>
              {todayStats.count > 1 ? 'tickets aujourd’hui' : "ticket aujourd'hui"}
            </KText>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.heroCard}>
            <View style={styles.heroTexts}>
              <KText variant="label" color={colors.textSecondary}>
                Vendu aujourd'hui
              </KText>
              <KText
                variant="display"
                color={colors.accent}
                style={styles.heroValue}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {formatCDF(todayStats.total)}
              </KText>
              <KText variant="small" color={colors.textMuted}>
                {formatCountLabel(todayStats.count, 'vente')} aujourd'hui
              </KText>
            </View>
            <View style={styles.heroIcon}>
              <Banknote size={26} color={colors.accent} strokeWidth={1.7} />
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCardHalf}>
              <KText variant="label" color={colors.textSecondary}>
                Bénéfice
              </KText>
              <KText
                variant="number"
                color={colors.accent}
                style={styles.statValueSmall}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {formatCDF(todayStats.profit)}
              </KText>
              <KText variant="small" color={colors.textMuted}>
                Vente − achat
              </KText>
            </View>
            <View style={styles.statCardHalf}>
              <KText variant="label" color={colors.textSecondary}>
                Ventes
              </KText>
              <KText variant="number" style={styles.statValueSmall}>
                {todayStats.count}
              </KText>
              <KText variant="small" color={colors.textMuted}>
                {todayStats.count > 1 ? 'tickets' : 'ticket'} aujourd'hui
              </KText>
            </View>
          </View>
        </>
      )}

      {lowStockProducts.length > 0 ? (
        <Card
          onPress={() => router.push({ pathname: '/stock', params: { filter: 'low' } })}
          accessibilityLabel="Voir les produits en stock faible"
          style={styles.alertCard}>
          <View style={styles.alertIcon}>
            <AlertTriangle size={21} color={colors.red} strokeWidth={2} />
          </View>
          <View style={styles.alertTexts}>
            <KText variant="subtitle" style={styles.alertTitle}>
              Stock faible
            </KText>
            <KText variant="small" color={colors.textSecondary}>
              {formatCountLabel(lowStockProducts.length, 'produit')} à réapprovisionner
            </KText>
          </View>
          <ChevronRight size={18} color={colors.textMuted} strokeWidth={2} />
        </Card>
      ) : null}

      {isPharmacy && expiringSoonCount > 0 ? (
        <Card
          onPress={() => router.push('/alertes')}
          accessibilityLabel="Voir les alertes de péremption"
          style={styles.alertCard}>
          <View style={styles.alertIcon}>
            <CalendarClock size={21} color={colors.red} strokeWidth={2} />
          </View>
          <View style={styles.alertTexts}>
            <KText variant="subtitle" style={styles.alertTitle}>
              Péremption
            </KText>
            <KText variant="small" color={colors.textSecondary}>
              {formatCountLabel(expiringSoonCount, 'produit')}{' '}
              {expiringSoonCount > 1 ? 'expirent' : 'expire'} dans moins de 30 jours
            </KText>
          </View>
          <ChevronRight size={18} color={colors.textMuted} strokeWidth={2} />
        </Card>
      ) : null}

      <View style={styles.sectionHeader}>
        <KText variant="label" color={colors.textSecondary}>
          Actions rapides
        </KText>
      </View>

      <View style={styles.actionsGrid}>
        <ActionCard
          icon={ShoppingCart}
          title="Vente rapide"
          subtitle="Encaisser en 3 clics"
          onPress={() => router.push('/vente')}
          wide={wide}
        />
        <ActionCard
          icon={Package}
          title="Stock"
          subtitle={`${data.products.length} produits suivis`}
          onPress={() => router.push('/stock')}
          wide={wide}
        />
        <ActionCard
          icon={Users}
          title="Clients / Dettes"
          subtitle={
            clientsWithDebt > 0
              ? `${clientsWithDebt} client${clientsWithDebt > 1 ? 's' : ''} · ${formatCDF(totalDebt)}`
              : `${data.clients.length} clients · aucune dette`
          }
          onPress={() => router.push('/clients')}
          wide={wide}
        />
        <ActionCard
          icon={TrendingUp}
          title="Bénéfice"
          subtitle={`${formatCDF(todayStats.profit)} aujourd'hui`}
          onPress={() => router.push('/benefice')}
          wide={wide}
        />
        {isHardware ? (
          <ActionCard
            icon={ClipboardList}
            title="Devis chantier"
            subtitle="Chambre 4x4 · conversion en vente"
            onPress={() => router.push('/devis')}
            wide={wide}
          />
        ) : null}
      </View>

      <Card
        onPress={() => router.push('/settings')}
        accessibilityLabel="Synchronisation et paramètres"
        style={styles.syncCard}>
        <SyncIcon size={17} color={syncCard.color} strokeWidth={1.8} />
        <View style={styles.syncTexts}>
          <KText variant="small" color={colors.textSecondary}>
            {syncCard.title}
          </KText>
          <KText variant="small" color={colors.textMuted} style={styles.syncHint}>
            {syncCard.hint}
          </KText>
        </View>
        <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
      </Card>
    </Page>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  identityTexts: {
    flex: 1,
    gap: 1,
  },
  storeName: {
    fontSize: 17,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  heroTexts: {
    flex: 1,
    gap: 4,
  },
  heroValue: {
    fontSize: 34,
    lineHeight: 40,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    gap: 4,
    justifyContent: 'space-between',
  },
  statCardMain: {
    flex: 1.35,
  },
  statCardHalf: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
    gap: 3,
  },
  statValueLarge: {
    fontSize: 26,
    lineHeight: 32,
  },
  statValue: {
    fontSize: 22,
    lineHeight: 28,
  },
  statValueSmall: {
    fontSize: 20,
    lineHeight: 25,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderColor: colors.redBorder,
    backgroundColor: colors.redSoft,
    marginTop: 8,
    padding: 14,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTexts: {
    flex: 1,
    gap: 1,
  },
  alertTitle: {
    fontSize: 14,
    lineHeight: 19,
    color: colors.red,
  },
  sectionHeader: {
    marginTop: 22,
    marginBottom: 10,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    padding: 16,
    minHeight: 112,
    justifyContent: 'space-between',
    gap: 14,
  },
  actionCardWide: {
    flexBasis: '22%',
    flexGrow: 1,
    minWidth: 180,
  },
  actionCardNarrow: {
    flexBasis: '46%',
    flexGrow: 1,
    minWidth: 145,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTexts: {
    gap: 2,
  },
  actionTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  actionSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    padding: 13,
    backgroundColor: colors.cardSoft,
  },
  syncTexts: {
    flex: 1,
    gap: 1,
  },
  syncHint: {
    fontSize: 10,
    lineHeight: 13,
  },
});
