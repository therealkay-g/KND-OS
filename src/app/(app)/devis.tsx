import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AlertTriangle,
  ChevronRight,
  ClipboardList,
  Wrench,
} from 'lucide-react-native';

import { PageHeader } from '@/components/page-header';
import { ProductAvatar } from '@/components/product-avatar';
import { AppButton } from '@/components/ui/app-button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Page } from '@/components/ui/page';
import { Sheet } from '@/components/ui/sheet';
import { KText } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useApp } from '@/lib/data-provider';
import {
  formatCDF,
  formatDateTime,
  formatQuantity,
  formatUnit,
} from '@/lib/format';
import { colors, radius } from '@/lib/theme';
import type { Product, Sale, Unit } from '@/lib/types';

/** Gris lisible sur le ticket blanc (le thème est prévu pour fond noir). */
const TICKET_MUTED = '#52525B';

/**
 * Devis chantier (docs/06-plan.md, Étape 3).
 * Seul le modèle Chambre 4x4 a des quantités documentées ; les autres
 * modèles du PRD restent [À CONFIRMER].
 */

type QuoteType = 'Chambre 4x4' | 'Maison 2 chambres' | 'Latrine' | 'Dalle';

interface QuoteMaterial {
  label: string;
  pattern: RegExp;
  quantity: number;
  unit: Unit;
}

interface QuoteTemplate {
  value: QuoteType;
  summary: string;
  available: boolean;
  materials: QuoteMaterial[];
}

const QUOTE_TYPES: QuoteTemplate[] = [
  {
    value: 'Chambre 4x4',
    summary: '20 sacs ciment · 15 barres 12mm · 20 tôles',
    available: true,
    materials: [
      { label: 'Ciment', pattern: /ciment/i, quantity: 20, unit: 'SAC' },
      {
        label: 'Barre de fer 12mm',
        pattern: /barre.*12\s*mm/i,
        quantity: 15,
        unit: 'BARRE 12m',
      },
      { label: 'Tôle', pattern: /t[oô]le/i, quantity: 20, unit: 'PIECE' },
    ],
  },
  {
    value: 'Maison 2 chambres',
    summary: 'Quantités à confirmer',
    available: false,
    materials: [],
  },
  {
    value: 'Latrine',
    summary: 'Quantités à confirmer',
    available: false,
    materials: [],
  },
  {
    value: 'Dalle',
    summary: 'Quantités à confirmer',
    available: false,
    materials: [],
  },
];

interface QuoteLine {
  material: QuoteMaterial;
  product: Product | null;
  quantity: number;
  lineTotal: number;
}

function quantityLabel(quantity: number, unit: Unit): string {
  const value = formatQuantity(quantity);
  return unit === 'PIECE' ? value : `${value} ${formatUnit(unit, quantity >= 2)}`;
}

export default function DevisScreen() {
  const { data, sell } = useApp();
  const toast = useToast();
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const [quoteType, setQuoteType] = useState<QuoteType | null>(null);
  const [ticket, setTicket] = useState<Sale | null>(null);

  const template = QUOTE_TYPES.find((entry) => entry.value === quoteType) ?? null;

  const lines = useMemo<QuoteLine[]>(() => {
    if (!template || !template.available) return [];
    return template.materials.map((material) => {
      const product =
        data.products.find((entry) => material.pattern.test(entry.name)) ?? null;
      return {
        material,
        product,
        quantity: material.quantity,
        lineTotal: product ? Math.round(product.salePrice * material.quantity) : 0,
      };
    });
  }, [data.products, template]);

  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const missing = lines.filter((line) => !line.product);
  const canConvert = lines.length > 0 && missing.length === 0;

  const chooseType = (value: QuoteType) => {
    setQuoteType(value);
    setTypeSheetOpen(false);
  };

  const convertToSale = () => {
    if (!template || !canConvert) return;
    const cart = lines.map((line) => ({
      productId: line.product!.id,
      quantity: line.quantity,
    }));
    const result = sell('cash', cart);
    if (!result.ok || !result.sale) {
      toast(result.message ?? 'La conversion du devis a échoué.', 'error');
      return;
    }
    setTicket(result.sale);
    setQuoteType(null);
  };

  const storeName = data.merchant?.storeName ?? 'KND OS';

  return (
    <Page>
      <PageHeader
        title="Devis chantier"
        subtitle="Liste de matériaux puis conversion en vente cash"
        back
      />

      {!template ? (
        <EmptyState
          icon={ClipboardList}
          title="Aucun devis en cours"
          description="Choisissez un modèle de chantier pour générer la liste des matériaux et son total."
          actionLabel="Nouveau devis"
          onAction={() => setTypeSheetOpen(true)}
        />
      ) : (
        <>
          <Card style={styles.quoteCard}>
            <View style={styles.quoteHeader}>
              <View style={styles.quoteIcon}>
                <Wrench size={22} color={colors.accent} strokeWidth={1.8} />
              </View>
              <View style={styles.quoteTexts}>
                <KText variant="subtitle" numberOfLines={1}>
                  {template.value}
                </KText>
                <KText variant="small" color={colors.textMuted} numberOfLines={1}>
                  Devis matériaux · paiement cash
                </KText>
              </View>
              <Badge label="Devis" tone="accent" />
            </View>

            <View style={styles.lines}>
              {lines.map((line) => (
                <View key={line.material.label} style={styles.lineRow}>
                  <ProductAvatar
                    emoji={line.product?.emoji ?? '📦'}
                    size={40}
                    muted={!line.product}
                  />
                  <View style={styles.lineTexts}>
                    <KText variant="body" numberOfLines={1} style={styles.lineName}>
                      {line.product?.name ?? line.material.label}
                    </KText>
                    <KText variant="small" color={colors.textMuted} numberOfLines={1}>
                      {quantityLabel(line.quantity, line.material.unit)} ×{' '}
                      {line.product ? formatCDF(line.product.salePrice) : 'produit absent'}
                    </KText>
                  </View>
                  <KText variant="price" style={styles.lineTotal} numberOfLines={1}>
                    {line.product ? formatCDF(line.lineTotal) : '—'}
                  </KText>
                </View>
              ))}
            </View>

            <View style={styles.totalRow}>
              <KText variant="body" color={colors.textSecondary}>
                Total du devis
              </KText>
              <KText variant="title" color={colors.accent} numberOfLines={1}>
                {formatCDF(total)}
              </KText>
            </View>
          </Card>

          {missing.length > 0 ? (
            <Card style={styles.warningCard}>
              <AlertTriangle size={20} color={colors.red} strokeWidth={2} />
              <View style={styles.warningTexts}>
                <KText variant="small" color={colors.red} style={styles.warningTitle}>
                  Produits manquants
                </KText>
                <KText variant="small" color={colors.textSecondary}>
                  Ajoutez {missing.map((line) => line.material.label).join(', ')} au stock
                  pour convertir ce devis.
                </KText>
              </View>
            </Card>
          ) : null}

          <View style={styles.actions}>
            <AppButton
              label="Convertir en vente"
              onPress={convertToSale}
              disabled={!canConvert}
              icon={<ChevronRight size={18} color={colors.black} strokeWidth={2.4} />}
            />
            <AppButton
              label="Changer de type"
              onPress={() => setTypeSheetOpen(true)}
              variant="ghost"
              size="md"
            />
          </View>

          <KText variant="small" color={colors.textMuted} style={styles.note}>
            La conversion déduit le stock et enregistre une vente cash. Le ticket ci-dessous
            simule l’impression Bluetooth.
          </KText>
        </>
      )}

      <Sheet
        visible={typeSheetOpen}
        onClose={() => setTypeSheetOpen(false)}
        title="Nouveau devis"
        subtitle="Choisissez le modèle de chantier.">
        <View style={styles.typeList}>
          {QUOTE_TYPES.map((type) => (
            <Pressable
              key={type.value}
              disabled={!type.available}
              onPress={() => chooseType(type.value)}
              accessibilityRole="button"
              accessibilityLabel={
                type.available
                  ? `Choisir le devis ${type.value}`
                  : `Devis ${type.value} — quantités à confirmer`
              }
              style={({ pressed }) => [
                styles.typeRow,
                !type.available ? styles.typeRowDisabled : null,
                pressed && type.available ? styles.typeRowPressed : null,
              ]}>
              <View style={styles.typeIcon}>
                <ClipboardList size={20} color={colors.accent} strokeWidth={1.8} />
              </View>
              <View style={styles.typeTexts}>
                <KText variant="subtitle" numberOfLines={1}>
                  {type.value}
                </KText>
                <KText variant="small" color={colors.textMuted} numberOfLines={1}>
                  {type.summary}
                </KText>
              </View>
              {type.available ? (
                <ChevronRight size={18} color={colors.textMuted} strokeWidth={2} />
              ) : (
                <Badge label="Bientôt" tone="neutral" />
              )}
            </Pressable>
          ))}
        </View>
        <KText variant="small" color={colors.textMuted} style={styles.typeNote}>
          Les quantités de référence ne sont documentées que pour Chambre 4x4. Les autres
          modèles restent [À CONFIRMER] dans docs/01-prd.md.
        </KText>
      </Sheet>

      <Sheet
        visible={ticket !== null}
        onClose={() => setTicket(null)}
        title="Ticket"
        subtitle="Impression Bluetooth simulée">
        {ticket ? (
          <View style={styles.ticket}>
            <KText variant="subtitle" color={colors.black} style={styles.ticketCenter}>
              {storeName}
            </KText>
            <KText variant="small" color={TICKET_MUTED} style={styles.ticketCenter}>
              {formatDateTime(ticket.createdAt)}
            </KText>

            <View style={styles.ticketDivider} />

            {ticket.items.map((item) => (
              <View key={item.productId} style={styles.ticketLine}>
                <View style={styles.ticketLineTexts}>
                  <KText variant="small" color={colors.black} numberOfLines={1}>
                    {item.name}
                  </KText>
                  <KText variant="small" color={TICKET_MUTED}>
                    {quantityLabel(item.quantity, item.unit)} × {formatCDF(item.unitPrice)}
                  </KText>
                </View>
                <KText variant="small" color={colors.black} style={styles.ticketAmount}>
                  {formatCDF(Math.round(item.quantity * item.unitPrice))}
                </KText>
              </View>
            ))}

            <View style={styles.ticketDivider} />

            <View style={styles.ticketTotalRow}>
              <KText variant="subtitle" color={colors.black}>
                TOTAL
              </KText>
              <KText variant="subtitle" color={colors.black}>
                {formatCDF(ticket.total)}
              </KText>
            </View>
            <KText variant="small" color={TICKET_MUTED} style={styles.ticketCenter}>
              Payé en espèces · Merci !
            </KText>
            <KText variant="small" color={TICKET_MUTED} style={styles.ticketCenter}>
              KND OS · ticket de vente
            </KText>
          </View>
        ) : null}
        <AppButton label="Fermer le ticket" onPress={() => setTicket(null)} variant="ghost" size="md" />
      </Sheet>
    </Page>
  );
}

const styles = StyleSheet.create({
  quoteCard: {
    gap: 14,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  quoteIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteTexts: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  lines: {
    gap: 2,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  lineTexts: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  lineName: {
    fontFamily: 'Inter_500Medium',
  },
  lineTotal: {
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    gap: 10,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 10,
    borderColor: colors.redBorder,
    backgroundColor: colors.redSoft,
  },
  warningTexts: {
    flex: 1,
    gap: 2,
  },
  warningTitle: {
    fontFamily: 'Inter_500Medium',
  },
  actions: {
    marginTop: 14,
    gap: 10,
  },
  note: {
    marginTop: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  typeList: {
    gap: 8,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 62,
  },
  typeRowDisabled: {
    opacity: 0.5,
  },
  typeRowPressed: {
    opacity: 0.8,
  },
  typeIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeTexts: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  typeNote: {
    marginTop: 12,
    lineHeight: 17,
  },
  ticket: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 16,
    gap: 6,
  },
  ticketCenter: {
    textAlign: 'center',
  },
  ticketDivider: {
    borderTopWidth: 1,
    borderTopColor: '#D4D4D8',
    borderStyle: 'dashed',
    marginVertical: 6,
  },
  ticketLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  ticketLineTexts: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  ticketAmount: {
    fontFamily: 'Inter_500Medium',
    textAlign: 'right',
  },
  ticketTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
});
