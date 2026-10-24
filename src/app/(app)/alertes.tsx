import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { CalendarClock } from 'lucide-react-native';

import { PageHeader } from '@/components/page-header';
import { ProductAvatar } from '@/components/product-avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Page } from '@/components/ui/page';
import { KText } from '@/components/ui/text';
import { useApp } from '@/lib/data-provider';
import { formatExpiryDate, formatExpiryLabel, formatStock } from '@/lib/format';
import { getExpiringProducts } from '@/lib/stats';
import { colors, radius } from '@/lib/theme';

/**
 * Page Alertes péremption (docs/06-plan.md, Étape 2).
 * Règle docs/01-prd.md : rouge sous 30 jours, orange de 30 à 60 jours.
 */
export default function ExpiryAlertsScreen() {
  const { data } = useApp();

  const expiring = useMemo(() => getExpiringProducts(data.products), [data.products]);

  return (
    <Page>
      <PageHeader
        title="Alertes péremption"
        subtitle={
          expiring.length > 0
            ? `${expiring.length} produit${expiring.length > 1 ? 's' : ''} en alerte sous 60 jours`
            : 'Aucun produit ne périme dans les 60 prochains jours.'
        }
        back
      />

      {expiring.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Aucune alerte de péremption"
          description="Les produits à moins de 60 jours de leur date de péremption apparaîtront ici."
        />
      ) : (
        <View style={styles.list}>
          {expiring.map(({ product, status }, index) => (
            <View
              key={product.id}
              style={[styles.row, index === expiring.length - 1 ? styles.rowLast : null]}>
              <ProductAvatar emoji={product.emoji} size={48} muted={product.stock <= 0} />
              <View style={styles.rowTexts}>
                <KText variant="body" numberOfLines={1} style={styles.rowName}>
                  {product.name}
                </KText>
                {product.molecule ? (
                  <KText variant="small" color={colors.textMuted} numberOfLines={1}>
                    Molécule : {product.molecule}
                  </KText>
                ) : null}
                <KText variant="small" color={colors.textMuted} numberOfLines={1}>
                  Péremption : {product.expiryDate ? formatExpiryDate(product.expiryDate) : '—'} ·
                  stock {formatStock(product.stock, product.unit)}
                </KText>
              </View>
              <Badge
                label={formatExpiryLabel(status.days)}
                tone={status.level === 'soon' ? 'orange' : 'red'}
              />
            </View>
          ))}
        </View>
      )}

      <Card style={styles.noteCard}>
        <KText variant="small" color={colors.textMuted} style={styles.noteText}>
          Règle d’alerte (mode Pharmacie) : rouge à moins de 30 jours, orange de 30 à 60 jours.
        </KText>
      </Card>
    </Page>
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 72,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowTexts: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  rowName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 20,
  },
  noteCard: {
    marginTop: 18,
    backgroundColor: colors.cardSoft,
    paddingVertical: 12,
  },
  noteText: {
    lineHeight: 17,
    textAlign: 'center',
  },
});
