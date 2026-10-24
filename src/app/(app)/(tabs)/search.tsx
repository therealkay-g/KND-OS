import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BadgeCheck,
  Clock3,
  Eye,
  Info,
  MapPin,
  MessageCircle,
  Phone,
  Store,
} from 'lucide-react-native';

import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Page } from '@/components/ui/page';
import { KText } from '@/components/ui/text';
import { useApp } from '@/lib/data-provider';
import { formatPhone } from '@/lib/format';
import { colors, radius } from '@/lib/theme';

export default function SearchTabScreen() {
  const { data } = useApp();
  const merchant = data.merchant;

  if (!merchant) return null;

  return (
    <Page>
      <PageHeader
        title="Kindu Search"
        subtitle="Votre fiche publique, comme les clients la voient."
      />

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <View style={styles.statIcon}>
            <Eye size={19} color={colors.accent} strokeWidth={1.8} />
          </View>
          <View style={styles.statTexts}>
            <KText variant="number" style={styles.statValue}>
              0
            </KText>
            <KText variant="small" color={colors.textSecondary}>
              Vues de la fiche
            </KText>
          </View>
        </Card>
        <Card style={styles.statCard}>
          <View style={styles.statIcon}>
            <MessageCircle size={19} color={colors.green} strokeWidth={1.8} />
          </View>
          <View style={styles.statTexts}>
            <KText variant="number" style={styles.statValue}>
              0
            </KText>
            <KText variant="small" color={colors.textSecondary}>
              Clics WhatsApp
            </KText>
          </View>
        </Card>
      </View>

      <View style={styles.previewWrapper}>
        <View style={styles.previewLabelRow}>
          <KText variant="label" color={colors.textSecondary}>
            Aperçu de votre fiche
          </KText>
          <Badge label="En attente de vérification" tone="orange" dot />
        </View>

        <View style={styles.previewCard}>
          <View style={styles.photo}>
            <View style={styles.photoIcon}>
              <Store size={30} color={colors.accent} strokeWidth={1.7} />
            </View>
            <KText variant="small" color="#71717A">
              Photos du commerce à ajouter
            </KText>
          </View>

          <View style={styles.previewBody}>
            <View style={styles.categoryRow}>
              <KText variant="small" color="#71717A" style={styles.category}>
                {merchant.mode}
              </KText>
              <KText variant="small" color="#A1A1AA" style={styles.statusText}>
                Fiche non publiée
              </KText>
            </View>

            <KText style={styles.storeName} numberOfLines={2}>
              {merchant.storeName}
            </KText>

            <View style={styles.infoRow}>
              <MapPin size={14} color="#71717A" strokeWidth={1.9} />
              <KText variant="small" color="#71717A">
                Commune {merchant.commune}, Kindu
              </KText>
            </View>
            <View style={styles.infoRow}>
              <Clock3 size={14} color="#71717A" strokeWidth={1.9} />
              <KText variant="small" color="#71717A">
                Horaires non renseignés
              </KText>
            </View>
            <View style={styles.infoRow}>
              <Phone size={14} color="#71717A" strokeWidth={1.9} />
              <KText variant="small" color="#71717A">
                {formatPhone(merchant.phone)}
              </KText>
            </View>

            <View style={styles.divider} />

            <View style={styles.liveHeader}>
              <KText variant="small" color="#0A0A0A" style={styles.liveTitle}>
                Stock vérifié live
              </KText>
              <View style={styles.proPill}>
                <KText variant="small" color={colors.black} style={styles.proText}>
                  PRO
                </KText>
              </View>
            </View>
            <View style={styles.liveBox}>
              <BadgeCheck size={18} color="#15803D" strokeWidth={2} />
              <KText variant="small" color="#3F3F46" style={styles.liveText}>
                Votre stock en temps réel sera affiché ici quand votre fiche sera
                vérifiée et passée en KND OS Pro.
              </KText>
            </View>

            <View style={styles.previewActions}>
              <View style={[styles.previewButton, styles.whatsappButton]}>
                <MessageCircle size={15} color={colors.white} strokeWidth={2} />
                <KText variant="small" color={colors.white} style={styles.previewButtonText}>
                  WhatsApp
                </KText>
              </View>
              <View style={[styles.previewButton, styles.darkButton]}>
                <Phone size={15} color={colors.white} strokeWidth={2} />
                <KText variant="small" color={colors.white} style={styles.previewButtonText}>
                  Appeler
                </KText>
              </View>
              <View style={[styles.previewButton, styles.lightButton]}>
                <MapPin size={15} color={colors.black} strokeWidth={2} />
                <KText variant="small" color={colors.black} style={styles.previewButtonText}>
                  Itinéraire
                </KText>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.previewNote}>
          <Info size={13} color={colors.textMuted} strokeWidth={2} />
          <KText variant="small" color={colors.textMuted} style={styles.previewNoteText}>
            Aperçu non interactif · la fiche sera publiée après vérification.
          </KText>
        </View>
      </View>

      <Card style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <Store size={20} color={colors.accent} strokeWidth={1.8} />
        </View>
        <View style={styles.infoTexts}>
          <KText variant="subtitle" style={styles.infoTitle}>
            Votre commerce dans Kindu Search
          </KText>
          <KText variant="small" color={colors.textSecondary} style={styles.infoText}>
            L’équipe Kindu Search vérifie chaque commerce à moto avant publication. Une fois
            votre fiche validée, les clients pourront vous trouver, vous appeler et vous
            écrire sur WhatsApp.
          </KText>
        </View>
      </Card>
    </Page>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTexts: {
    gap: 1,
  },
  statValue: {
    fontSize: 22,
    lineHeight: 27,
  },
  previewWrapper: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    gap: 9,
  },
  previewLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  photo: {
    height: 138,
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255,195,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBody: {
    padding: 16,
    gap: 7,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  category: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  statusText: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: 'Inter_500Medium',
  },
  storeName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 21,
    lineHeight: 27,
    color: colors.black,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#F4F4F5',
    marginVertical: 8,
  },
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  liveTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    lineHeight: 16,
  },
  proPill: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  proText: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.8,
  },
  previewNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  previewNoteText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
  },
  liveBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 11,
  },
  liveText: {
    flex: 1,
    lineHeight: 17,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 8,
  },
  previewButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 6,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  darkButton: {
    backgroundColor: colors.black,
  },
  lightButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.black,
  },
  previewButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    lineHeight: 14,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 18,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTexts: {
    flex: 1,
    gap: 3,
  },
  infoTitle: {
    fontSize: 14,
    lineHeight: 19,
  },
  infoText: {
    lineHeight: 18,
  },
});
