import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { TrendingUp } from 'lucide-react-native';

import { PageHeader } from '@/components/page-header';
import { StatTile } from '@/components/stat-tile';
import { AppButton } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import { Page } from '@/components/ui/page';
import { KText } from '@/components/ui/text';
import { useApp } from '@/lib/data-provider';
import {
  formatCDF,
  formatCompact,
  formatCountLabel,
  formatNumber,
  formatTime,
} from '@/lib/format';
import {
  getLastSevenDays,
  getMonthStats,
  getTodayStats,
  getWeekStats,
  isSaleToday,
} from '@/lib/stats';
import { colors, radius } from '@/lib/theme';

export default function ProfitScreen() {
  const { data } = useApp();
  const { width } = useWindowDimensions();
  const wide = width >= 760;

  const today = useMemo(() => getTodayStats(data.sales), [data.sales]);
  const week = useMemo(() => getWeekStats(data.sales), [data.sales]);
  const month = useMemo(() => getMonthStats(data.sales), [data.sales]);
  const days = useMemo(() => getLastSevenDays(data.sales), [data.sales]);
  const todaySales = useMemo(
    () =>
      data.sales
        .filter((sale) => isSaleToday(sale))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [data.sales],
  );

  const maxProfit = Math.max(...days.map((day) => day.profit), 1);
  const lastDayDate = days[days.length - 1]?.date;

  return (
    <Page>
      <PageHeader
        title="Bénéfice"
        subtitle="Vos gains, sans comptabilité compliquée."
      />

      <View style={styles.statsRow}>
        <StatTile
          label="Aujourd'hui"
          value={formatCDF(today.profit)}
          hint={`${formatCountLabel(today.count, 'vente')} · ${formatCDF(today.total)} vendus`}
          compact={!wide}
          style={!wide ? styles.fullWidthTile : undefined}
        />
        <StatTile
          label="Cette semaine"
          value={formatCDF(week.profit)}
          hint={`${formatCountLabel(week.count, 'vente')} cette semaine`}
          compact={!wide}
        />
        <StatTile
          label="Ce mois"
          value={formatCDF(month.profit)}
          hint={`${formatNumber(month.count)} ventes ce mois`}
          compact={!wide}
        />
      </View>

      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={styles.chartHeading}>
            <KText variant="subtitle">Bénéfice des 7 derniers jours</KText>
            <KText variant="small" color={colors.textMuted}>
              Vente − achat, calculé sur cet appareil
            </KText>
          </View>
          <View style={styles.weekPill}>
            <KText variant="small" color={colors.accent} style={styles.weekPillText}>
              {formatCDF(week.profit)}
            </KText>
          </View>
        </View>

        <View style={styles.chart}>
          {days.map((day) => {
            const isToday = lastDayDate ? day.date.getTime() === lastDayDate.getTime() : false;
            const height = day.profit > 0 ? Math.max(10, (day.profit / maxProfit) * 84) : 3;
            return (
              <View key={day.date.toISOString()} style={styles.barColumn}>
                <KText
                  variant="small"
                  color={day.profit > 0 ? colors.textSecondary : colors.textMuted}
                  style={styles.barValue}
                  numberOfLines={1}>
                  {day.profit > 0 ? formatCompact(day.profit) : '—'}
                </KText>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height,
                        backgroundColor: day.profit > 0 ? colors.accent : colors.border,
                        opacity: day.profit > 0 ? (isToday ? 1 : 0.45) : 1,
                      },
                    ]}
                  />
                </View>
                <KText
                  variant="small"
                  color={isToday ? colors.accent : colors.textMuted}
                  style={[styles.dayLabel, isToday ? styles.dayLabelToday : null]}>
                  {day.label}
                </KText>
              </View>
            );
          })}
        </View>
      </Card>

      <View style={styles.sectionHeader}>
        <KText variant="label" color={colors.textSecondary}>
          Ventes du jour
        </KText>
        <KText variant="small" color={colors.textMuted}>
          {todaySales.length} vente{todaySales.length > 1 ? 's' : ''}
        </KText>
      </View>

      {todaySales.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <TrendingUp size={24} color={colors.accent} strokeWidth={1.8} />
          </View>
          <KText variant="subtitle" style={styles.emptyTitle}>
            Aucune vente aujourd'hui
          </KText>
          <KText variant="body" color={colors.textSecondary} style={styles.emptyText}>
            Votre bénéfice apparaîtra ici dès la première vente.
          </KText>
          <AppButton
            label="Vendre maintenant"
            onPress={() => router.push('/vente')}
            variant="secondary"
            size="sm"
            fullWidth={false}
            style={styles.emptyAction}
          />
        </Card>
      ) : (
        <View style={styles.salesList}>
          {todaySales.map((sale, index) => {
            const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
            const summary = sale.items
              .slice(0, 2)
              .map((item) => `${item.name} ×${item.quantity}`)
              .join(', ');
            const extra = sale.items.length > 2 ? ` +${sale.items.length - 2}` : '';
            return (
              <View
                key={sale.id}
                style={[
                  styles.saleRow,
                  index === todaySales.length - 1 ? styles.saleRowLast : null,
                ]}>
                <View style={styles.saleTime}>
                  <KText variant="small" color={colors.accent} style={styles.saleTimeText}>
                    {formatTime(sale.createdAt)}
                  </KText>
                  <KText variant="small" color={colors.textMuted} style={styles.saleItemsCount}>
                    {itemCount} art.
                  </KText>
                </View>
                <View style={styles.saleTexts}>
                  <KText variant="body" numberOfLines={1} style={styles.saleSummary}>
                    {summary}
                    {extra}
                  </KText>
                  <KText variant="small" color={colors.textMuted}>
                    {sale.paymentType === 'credit' ? 'À crédit' : 'Cash'}
                    {sale.paymentType === 'credit' ? ' · dette client' : ''}
                  </KText>
                </View>
                <View style={styles.saleAmounts}>
                  <KText variant="price" numberOfLines={1}>
                    {formatCDF(sale.total)}
                  </KText>
                  <KText variant="small" color={colors.green} numberOfLines={1}>
                    +{formatCDF(sale.profit)}
                  </KText>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Card style={styles.noteCard}>
        <KText variant="small" color={colors.textMuted} style={styles.noteText}>
          Le bénéfice est la différence entre le prix de vente et le prix d’achat. Aucune
          donnée bancaire n’est utilisée.
        </KText>
      </Card>
    </Page>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  fullWidthTile: {
    flexBasis: '100%',
  },
  chartCard: {
    marginTop: 8,
    gap: 18,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  chartHeading: {
    flex: 1,
    gap: 2,
  },
  weekPill: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentBorder,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  weekPillText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    lineHeight: 14,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    height: 138,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    height: '100%',
  },
  barValue: {
    fontSize: 9,
    lineHeight: 12,
    fontFamily: 'Inter_500Medium',
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '62%',
    maxWidth: 30,
    minWidth: 8,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  dayLabel: {
    fontSize: 10,
    lineHeight: 13,
  },
  dayLabelToday: {
    fontFamily: 'Inter_700Bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
    marginBottom: 10,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: 320,
  },
  emptyAction: {
    marginTop: 8,
  },
  salesList: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  saleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  saleRowLast: {
    borderBottomWidth: 0,
  },
  saleTime: {
    width: 42,
    gap: 1,
  },
  saleTimeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    lineHeight: 15,
  },
  saleItemsCount: {
    fontSize: 9,
    lineHeight: 12,
  },
  saleTexts: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  saleSummary: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 18,
  },
  saleAmounts: {
    alignItems: 'flex-end',
    gap: 1,
    minWidth: 94,
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
