import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Bluetooth,
  Check,
  Cloud,
  CloudOff,
  LogOut,
  MapPin,
  Phone,
  RefreshCw,
  Store,
  Tag,
  type LucideIcon,
} from 'lucide-react-native';

import { PageHeader } from '@/components/page-header';
import { AppButton } from '@/components/ui/app-button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Page } from '@/components/ui/page';
import { Sheet } from '@/components/ui/sheet';
import { KText } from '@/components/ui/text';
import { useApp } from '@/lib/data-provider';
import { formatCountLabel, formatPhone, formatTime } from '@/lib/format';
import { STORE_MODES } from '@/lib/modes';
import { colors, radius } from '@/lib/theme';

interface SettingsRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  badge?: string;
  onPress?: () => void;
}

function SettingsRow({ icon: Icon, label, value, hint, badge, onPress }: SettingsRowProps) {
  const content = (
    <>
      <View style={styles.rowIcon}>
        <Icon size={18} color={colors.accent} strokeWidth={1.8} />
      </View>
      <View style={styles.rowTexts}>
        <KText variant="small" color={colors.textMuted} style={styles.rowLabel}>
          {label}
        </KText>
        <KText variant="body" style={styles.rowValue} numberOfLines={2}>
          {value}
        </KText>
        {hint ? (
          <KText variant="small" color={colors.textMuted} style={styles.rowHint}>
            {hint}
          </KText>
        ) : null}
      </View>
      {badge ? <Badge label={badge} tone="neutral" /> : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Modifier : ${label}`}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}>
      {content}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { data, logout, updateMode, stockSync, syncStockNow } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const merchant = data.merchant;

  if (!merchant) return null;

  const syncEnabled = stockSync.state !== 'disabled';
  const SyncIcon = syncEnabled ? Cloud : CloudOff;
  const syncValue =
    stockSync.state === 'disabled'
      ? 'Stock live non configuré'
      : stockSync.state === 'syncing'
        ? 'Synchronisation en cours…'
        : stockSync.state === 'error'
          ? 'Stock live indisponible'
          : stockSync.pendingStock > 0
            ? `${formatCountLabel(
                stockSync.pendingStock,
                'mise à jour',
                'mises à jour',
              )} du stock en attente`
            : stockSync.state === 'live'
              ? 'Stock live à jour'
              : 'Prêt à synchroniser';
  const syncHint =
    stockSync.state === 'disabled'
      ? 'Données conservées localement. Configurez Supabase pour activer Kindu Search.'
      : stockSync.state === 'error'
        ? stockSync.message ?? 'Vérifiez la connexion puis réessayez.'
        : stockSync.state === 'live' && stockSync.lastSyncedAt
          ? `Dernière synchro ${formatTime(stockSync.lastSyncedAt)}. Ventes et clients restent locaux.`
          : 'Kindu Search affiche le stock des commerces Pro.';
  const syncBadge =
    stockSync.state === 'disabled'
      ? 'Locale'
      : stockSync.state === 'live'
        ? 'Live'
        : stockSync.state === 'error'
          ? 'Erreur'
          : 'Auto';

  const handleLogout = () => {
    setConfirmOpen(false);
    logout();
    router.replace('/login');
  };

  return (
    <View style={styles.root}>
      <Page>
        <PageHeader title="Paramètres" subtitle="Commerce et appareil" back />

        <View style={styles.sectionHeader}>
          <KText variant="label" color={colors.textSecondary}>
            Commerce
          </KText>
        </View>
        <Card style={styles.groupCard}>
          <SettingsRow icon={Store} label="Nom du commerce" value={merchant.storeName} />
          <View style={styles.separator} />
          <SettingsRow
            icon={Tag}
            label="Mode de commerce"
            value={merchant.mode}
            hint="Modifiable à tout moment."
            onPress={() => setModeOpen(true)}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon={Phone}
            label="Téléphone WhatsApp"
            value={formatPhone(merchant.phone)}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon={MapPin}
            label="Commune"
            value={`${merchant.commune}, Kindu`}
          />
        </Card>

        <View style={styles.sectionHeader}>
          <KText variant="label" color={colors.textSecondary}>
            Appareil
          </KText>
        </View>
        <Card style={styles.groupCard}>
          <SettingsRow
            icon={Bluetooth}
            label="Imprimante Bluetooth"
            value="Non connectée"
            hint="Ticket 58 mm — configuration à venir."
            badge="Bientôt"
          />
          <View style={styles.separator} />
          <SettingsRow
            icon={SyncIcon}
            label="Synchronisation du stock"
            value={syncValue}
            hint={syncHint}
            badge={syncBadge}
          />
          {syncEnabled ? (
            <>
              <View style={styles.separator} />
              <View style={styles.syncAction}>
                <AppButton
                  label={
                    stockSync.state === 'error'
                      ? 'Réessayer la synchronisation'
                      : 'Synchroniser maintenant'
                  }
                  onPress={syncStockNow}
                  variant="ghost"
                  size="md"
                  loading={stockSync.state === 'syncing'}
                  icon={<RefreshCw size={17} color={colors.text} strokeWidth={2} />}
                />
              </View>
            </>
          ) : null}
          <View style={styles.separator} />
          <SettingsRow
            icon={CloudOff}
            label="Mode de fonctionnement"
            value="Hors ligne d’abord"
            hint="Vous pouvez vendre toute la journée sans internet."
          />
        </Card>

        <View style={styles.sectionHeader}>
          <KText variant="label" color={colors.textSecondary}>
            À propos
          </KText>
        </View>
        <Card style={styles.aboutCard}>
          <KText variant="body" style={styles.aboutTitle}>
            KND OS
          </KText>
          <KText variant="small" color={colors.textSecondary} style={styles.aboutText}>
            Version 0.1.0 · Caisse mobile et desktop pour les commerçants de Kindu, RDC.
          </KText>
          <KText variant="small" color={colors.textMuted} style={styles.aboutText}>
            Données conservées localement sur cet appareil.
          </KText>
        </Card>

        <AppButton
          label="Se déconnecter"
          onPress={() => setConfirmOpen(true)}
          variant="danger"
          size="md"
          icon={<LogOut size={18} color={colors.red} strokeWidth={2} />}
          style={styles.logoutButton}
        />
      </Page>

      <Sheet
        visible={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Se déconnecter ?"
        subtitle="Vos ventes et votre stock restent enregistrés sur cet appareil."
        footer={
          <>
            <View style={styles.footerButton}>
              <AppButton
                label="Annuler"
                onPress={() => setConfirmOpen(false)}
                variant="ghost"
                size="md"
              />
            </View>
            <View style={styles.footerButton}>
              <AppButton
                label="Se déconnecter"
                onPress={handleLogout}
                variant="danger"
                size="md"
              />
            </View>
          </>
        }>
        <View style={styles.confirmBox}>
          <LogOut size={20} color={colors.red} strokeWidth={1.9} />
          <KText variant="body" color={colors.textSecondary} style={styles.confirmText}>
            Vous devrez vous reconnecter avec votre numéro WhatsApp et le code de
            vérification.
          </KText>
        </View>
      </Sheet>

      <Sheet
        visible={modeOpen}
        onClose={() => setModeOpen(false)}
        title="Mode de commerce"
        subtitle="Adapte l’app à votre activité. Vos données sont conservées.">
        <View style={styles.modeList}>
          {STORE_MODES.map((item) => {
            const Icon = item.icon;
            const selected = merchant.mode === item.value;
            return (
              <Pressable
                key={item.value}
                disabled={!item.available}
                onPress={() => {
                  updateMode(item.value);
                  setModeOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: !item.available }}
                style={({ pressed }) => [
                  styles.modeOption,
                  selected ? styles.modeOptionSelected : null,
                  !item.available ? styles.modeOptionDisabled : null,
                  pressed && item.available ? styles.modeOptionPressed : null,
                ]}>
                <View style={[styles.modeIcon, selected ? styles.modeIconSelected : null]}>
                  <Icon
                    size={20}
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
                    {selected ? (
                      <Check size={14} color={colors.black} strokeWidth={3} />
                    ) : null}
                  </View>
                ) : (
                  <Badge label="Bientôt" tone="neutral" />
                )}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 8,
  },
  groupCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  rowPressed: {
    backgroundColor: colors.cardSoft,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTexts: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.3,
  },
  rowValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 19,
  },
  rowHint: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 1,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 64,
  },
  syncAction: {
    padding: 12,
  },
  aboutCard: {
    gap: 4,
    marginBottom: 20,
  },
  aboutTitle: {
    fontFamily: 'Inter_700Bold',
  },
  aboutText: {
    lineHeight: 17,
  },
  logoutButton: {
    marginBottom: 8,
  },
  footerButton: {
    flex: 1,
  },
  confirmBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.redSoft,
    borderColor: colors.redBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 13,
  },
  confirmText: {
    flex: 1,
    lineHeight: 19,
  },
  modeList: {
    gap: 8,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardSoft,
  },
  modeOptionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  modeOptionDisabled: {
    opacity: 0.55,
  },
  modeOptionPressed: {
    opacity: 0.8,
  },
  modeIcon: {
    width: 40,
    height: 40,
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
});
