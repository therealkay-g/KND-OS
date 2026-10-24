import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { Check, ChevronRight, Package, Plus } from 'lucide-react-native';

import { Page } from '@/components/ui/page';
import { PageHeader } from '@/components/page-header';
import { ProductAvatar } from '@/components/product-avatar';
import { AppButton } from '@/components/ui/app-button';
import { Badge } from '@/components/ui/badge';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Sheet } from '@/components/ui/sheet';
import { KText } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useApp } from '@/lib/data-provider';
import { formatCDF, formatExpiryLabel, formatQuantity, formatStock } from '@/lib/format';
import { getExpiringProducts, getExpiryStatus, isLowStock } from '@/lib/stats';
import { colors, radius } from '@/lib/theme';
import type { PresetUnit, Product, Unit } from '@/lib/types';

type StockFilter = 'all' | 'low' | 'expiry';

const UNITS: PresetUnit[] = ['PIECE', 'KG', 'SAC', 'METRE', 'ROULEAU', 'BARRE 12m'];

interface ProductFormState {
  name: string;
  barcode: string;
  purchasePrice: string;
  salePrice: string;
  stock: string;
  unit: Unit;
  customUnit: string;
  customUnitOpen: boolean;
  molecule: string;
  expiryDate: string;
  prescriptionRequired: boolean;
}

const EMPTY_FORM: ProductFormState = {
  name: '',
  barcode: '',
  purchasePrice: '',
  salePrice: '',
  stock: '',
  unit: 'PIECE',
  customUnit: '',
  customUnitOpen: false,
  molecule: '',
  expiryDate: '',
  prescriptionRequired: false,
};

function guessEmoji(name: string): string {
  const value = name.toLowerCase();
  if (/coca|cola/.test(value)) return '🥤';
  if (/fanta|orange|jus/.test(value)) return '🍊';
  if (/eau|mayi/.test(value)) return '💧';
  if (/sucre/.test(value)) return '🍬';
  if (/riz/.test(value)) return '🍚';
  if (/savon/.test(value)) return '🧼';
  if (/huile/.test(value)) return '🫙';
  if (/farine|pain/.test(value)) return '🌾';
  if (/ciment|sac/.test(value)) return '🧱';
  if (/fer|barre|clou|vis/.test(value)) return '🔩';
  if (/para|amox|médic|medic|sirop/.test(value)) return '💊';
  return '📦';
}

function parseDecimal(value: string): number {
  return Number(value.replace(',', '.'));
}

function isPresetUnit(unit: string): unit is PresetUnit {
  return UNITS.some((preset) => preset === unit);
}

export default function StockScreen() {
  const { data, addProduct, updateProduct } = useApp();
  const toast = useToast();
  const params = useLocalSearchParams<{ filter?: string }>();
  const [filter, setFilter] = useState<StockFilter>(params.filter === 'low' ? 'low' : 'all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (params.filter === 'low') setFilter('low');
  }, [params.filter]);

  const lowStock = useMemo(
    () => data.products.filter((product) => isLowStock(product.stock)),
    [data.products],
  );

  const isPharmacy = data.merchant?.mode === 'Pharmacie';

  const expiring = useMemo(() => getExpiringProducts(data.products), [data.products]);

  const visibleProducts =
    filter === 'low'
      ? lowStock
      : filter === 'expiry'
        ? expiring.map((entry) => entry.product)
        : data.products;

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setSheetOpen(true);
  };

  const openEdit = (product: Product) => {
    const preset = isPresetUnit(product.unit);
    setEditing(product);
    setForm({
      name: product.name,
      barcode: product.barcode ?? '',
      purchasePrice: String(product.purchasePrice),
      salePrice: String(product.salePrice),
      stock: formatQuantity(product.stock),
      unit: preset ? product.unit : 'PIECE',
      customUnit: preset ? '' : product.unit,
      customUnitOpen: !preset,
      molecule: product.molecule ?? '',
      expiryDate: product.expiryDate ?? '',
      prescriptionRequired: Boolean(product.prescriptionRequired),
    });
    setErrors({});
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditing(null);
    setErrors({});
  };

  const clearUnitError = () => {
    setErrors((previous) => {
      if (!previous.unit) return previous;
      const copy = { ...previous };
      delete copy.unit;
      return copy;
    });
  };

  const updateField = (key: keyof ProductFormState, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    const errorKey = key === 'customUnit' ? 'unit' : key;
    if (errors[errorKey]) {
      setErrors((previous) => {
        const copy = { ...previous };
        delete copy[errorKey];
        return copy;
      });
    }
  };

  const selectPresetUnit = (unit: PresetUnit) => {
    setForm((previous) => ({ ...previous, unit, customUnitOpen: false }));
    clearUnitError();
  };

  const selectCustomUnit = () => {
    setForm((previous) => ({ ...previous, customUnitOpen: true }));
    clearUnitError();
  };

  const handlePriceChange = (key: 'purchasePrice' | 'salePrice', value: string) => {
    updateField(key, value.replace(/\D/g, '').slice(0, 9));
  };

  const handleStockChange = (value: string) => {
    if (/^\d*[.,]?\d*$/.test(value)) {
      updateField('stock', value);
    }
  };

  const togglePrescriptionRequired = () => {
    setForm((previous) => ({
      ...previous,
      prescriptionRequired: !previous.prescriptionRequired,
    }));
  };

  const handleSave = () => {
    const nextErrors: Record<string, string> = {};
    const name = form.name.trim();
    const purchasePrice = Number(form.purchasePrice);
    const salePrice = Number(form.salePrice);
    const stock = parseDecimal(form.stock);
    const expiryDate = form.expiryDate.trim();
    const customUnit = form.customUnit.trim().replace(/\s+/g, ' ');
    const matchedPreset = form.customUnitOpen
      ? UNITS.find((preset) => preset.toLowerCase() === customUnit.toLowerCase())
      : undefined;
    const unit = form.customUnitOpen ? (matchedPreset ?? customUnit) : form.unit;

    if (name.length < 2) nextErrors.name = 'Entrez le nom du produit.';
    if (!form.purchasePrice || !Number.isFinite(purchasePrice) || purchasePrice < 0) {
      nextErrors.purchasePrice = 'Prix d’achat invalide.';
    }
    if (!form.salePrice || !Number.isFinite(salePrice) || salePrice <= 0) {
      nextErrors.salePrice = 'Prix de vente invalide.';
    }
    if (form.stock === '' || !Number.isFinite(stock) || stock < 0) {
      nextErrors.stock = 'Stock invalide.';
    }
    if (form.customUnitOpen) {
      if (customUnit.length === 0) {
        nextErrors.unit = 'Entrez le nom de l’unité.';
      } else if (customUnit.length > 20) {
        nextErrors.unit = '20 caractères maximum.';
      }
    }
    if (isPharmacy && expiryDate) {
      const parsed = parseISO(expiryDate);
      const valid =
        /^\d{4}-\d{2}-\d{2}$/.test(expiryDate) &&
        !Number.isNaN(parsed.getTime()) &&
        format(parsed, 'yyyy-MM-dd') === expiryDate;
      if (!valid) nextErrors.expiryDate = 'Date invalide — format AAAA-MM-JJ.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    // Hors pharmacie, on conserve les champs pharmacie existants lors d’une édition.
    const pharmacyFields = isPharmacy
      ? {
          molecule: form.molecule.trim() || undefined,
          expiryDate: expiryDate || undefined,
          prescriptionRequired: form.prescriptionRequired || undefined,
        }
      : {
          molecule: editing?.molecule,
          expiryDate: editing?.expiryDate,
          prescriptionRequired: editing?.prescriptionRequired,
        };

    const input = {
      name,
      barcode: form.barcode.trim() || undefined,
      ...pharmacyFields,
      purchasePrice: Math.round(purchasePrice),
      salePrice: Math.round(salePrice),
      stock,
      unit,
      emoji: editing?.emoji ?? guessEmoji(name),
    };

    if (editing) {
      const result = updateProduct(editing.id, input);
      if (!result.ok) {
        toast(result.message ?? 'Impossible de modifier le produit.', 'error');
        return;
      }
      toast('Produit mis à jour.');
    } else {
      addProduct(input);
      toast('Produit ajouté au stock.');
    }
    closeSheet();
  };

  return (
    <View style={styles.root}>
      <Page>
        <PageHeader
          title="Stock"
          subtitle={`${data.products.length} produits · ${lowStock.length} stock faible`}
          right={
            <AppButton
              label="Ajouter"
              onPress={openAdd}
              size="sm"
              fullWidth={false}
              icon={<Plus size={17} color={colors.black} strokeWidth={2.4} />}
            />
          }
        />

        <View style={styles.filters}>
          <Chip
            label="Tous"
            count={data.products.length}
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <Chip
            label="Stock faible"
            count={lowStock.length}
            selected={filter === 'low'}
            onPress={() => setFilter('low')}
          />
          {isPharmacy ? (
            <Chip
              label="Périme bientôt"
              count={expiring.length}
              selected={filter === 'expiry'}
              onPress={() => setFilter('expiry')}
            />
          ) : null}
        </View>

        {visibleProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title={
              filter === 'low'
                ? 'Aucun stock faible'
                : filter === 'expiry'
                  ? 'Aucune péremption proche'
                  : 'Votre stock est vide'
            }
            description={
              filter === 'low'
                ? 'Tous vos produits sont au-dessus du seuil d’alerte.'
                : filter === 'expiry'
                  ? 'Aucun produit n’expire dans les 60 prochains jours.'
                  : 'Ajoutez votre premier produit pour commencer à vendre.'
            }
            actionLabel={filter === 'all' ? 'Ajouter un produit' : 'Voir tous les produits'}
            onAction={filter === 'all' ? openAdd : () => setFilter('all')}
          />
        ) : (
          <View style={styles.list}>
            {visibleProducts.map((product, index) => {
              const low = isLowStock(product.stock);
              const expiry = getExpiryStatus(product.expiryDate);
              return (
                <Pressable
                  key={product.id}
                  onPress={() => openEdit(product)}
                  accessibilityRole="button"
                  accessibilityLabel={`Modifier ${product.name}`}
                  style={({ pressed }) => [
                    styles.row,
                    index === visibleProducts.length - 1 ? styles.rowLast : null,
                    pressed ? styles.rowPressed : null,
                  ]}>
                  <ProductAvatar emoji={product.emoji} size={48} muted={product.stock <= 0} />
                  <View style={styles.rowTexts}>
                    <KText variant="body" numberOfLines={1} style={styles.rowName}>
                      {product.name}
                    </KText>
                    <View style={styles.priceLine}>
                      <KText variant="price" color={colors.accent}>
                        {formatCDF(product.salePrice)}
                      </KText>
                      <KText variant="small" color={colors.textMuted}>
                        · achat {formatCDF(product.purchasePrice)}
                      </KText>
                    </View>
                    {isPharmacy && product.molecule ? (
                      <KText variant="small" color={colors.textMuted} numberOfLines={1}>
                        Molécule : {product.molecule}
                      </KText>
                    ) : null}
                  </View>
                  <View style={styles.stockBlock}>
                    <Badge label={formatStock(product.stock, product.unit)} tone={low ? 'red' : 'green'} />
                    <KText variant="small" color={colors.textMuted} style={styles.stockHint}>
                      {product.stock <= 0 ? 'rupture' : low ? 'à commander' : 'en stock'}
                    </KText>
                    {isPharmacy && expiry ? (
                      <Badge
                        label={formatExpiryLabel(expiry.days)}
                        tone={expiry.level === 'soon' ? 'orange' : 'red'}
                        style={styles.expiryBadge}
                      />
                    ) : null}
                  </View>
                  <ChevronRight size={17} color={colors.textMuted} strokeWidth={2} />
                </Pressable>
              );
            })}
          </View>
        )}
      </Page>

      <Sheet
        visible={sheetOpen}
        onClose={closeSheet}
        title={editing ? 'Modifier le produit' : 'Nouveau produit'}
        subtitle={editing ? 'Les changements seront synchronisés plus tard.' : 'Ajoutez un produit à votre stock.'}
        footer={
          <View style={styles.footerButton}>
            <AppButton
              label={editing ? 'Enregistrer les modifications' : 'Ajouter le produit'}
              onPress={handleSave}
            />
          </View>
        }>
        {editing ? (
          <View style={styles.editIdentity}>
            <ProductAvatar emoji={editing.emoji} size={48} />
            <View style={styles.editIdentityTexts}>
              <KText variant="subtitle" numberOfLines={1}>
                {editing.name}
              </KText>
              <KText variant="small" color={colors.textSecondary}>
                Stock actuel : {formatStock(editing.stock, editing.unit)}
              </KText>
            </View>
          </View>
        ) : null}

        <Field
          label="Nom du produit"
          value={form.name}
          onChangeText={(value) => updateField('name', value)}
          placeholder="Ex. Coca-Cola 1.5L"
          autoCapitalize="words"
          error={errors.name}
          autoFocus={!editing}
        />

        <Field
          label="Code-barres (optionnel)"
          value={form.barcode}
          onChangeText={(value) => updateField('barcode', value.replace(/\s/g, ''))}
          placeholder="Ex. 5449000000996"
          keyboardType="number-pad"
          autoCapitalize="none"
        />

        {isPharmacy ? (
          <>
            <Field
              label="Molécule (optionnel)"
              value={form.molecule}
              onChangeText={(value) => updateField('molecule', value)}
              placeholder="Ex. Paracétamol"
              autoCapitalize="words"
            />

            <View style={styles.formRow}>
              <Field
                label="Date de péremption"
                value={form.expiryDate}
                onChangeText={(value) => updateField('expiryDate', value.trim())}
                placeholder="2026-11-20"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.expiryDate}
                helper="Format AAAA-MM-JJ. Rouge sous 30 j, orange sous 60 j."
                containerStyle={styles.formHalf}
              />
              <View style={[styles.formHalf, styles.ordonnanceGroup]}>
                <KText variant="small" color={colors.textSecondary} style={styles.unitLabel}>
                  Ordonnance requise
                </KText>
                <Pressable
                  onPress={togglePrescriptionRequired}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: form.prescriptionRequired }}
                  style={[
                    styles.ordonnanceToggle,
                    form.prescriptionRequired ? styles.ordonnanceToggleOn : null,
                  ]}>
                  <View
                    style={[
                      styles.checkCircle,
                      form.prescriptionRequired ? styles.checkCircleOn : null,
                    ]}>
                    {form.prescriptionRequired ? (
                      <Check size={13} color={colors.black} strokeWidth={3} />
                    ) : null}
                  </View>
                  <KText variant="small" color={colors.textSecondary} style={styles.ordonnanceText}>
                    Vente bloquée sans photo
                  </KText>
                </Pressable>
              </View>
            </View>
          </>
        ) : null}

        <View style={styles.formRow}>
          <Field
            label="Prix d'achat (CDF)"
            value={form.purchasePrice}
            onChangeText={(value) => handlePriceChange('purchasePrice', value)}
            placeholder="2000"
            keyboardType="numeric"
            inputMode="numeric"
            error={errors.purchasePrice}
            containerStyle={styles.formHalf}
          />
          <Field
            label="Prix de vente (CDF)"
            value={form.salePrice}
            onChangeText={(value) => handlePriceChange('salePrice', value)}
            placeholder="3000"
            keyboardType="numeric"
            inputMode="numeric"
            error={errors.salePrice}
            containerStyle={styles.formHalf}
          />
        </View>

        <View style={styles.formRow}>
          <Field
            label="Stock"
            value={form.stock}
            onChangeText={handleStockChange}
            placeholder="0"
            keyboardType="decimal-pad"
            inputMode="decimal"
            error={errors.stock}
            containerStyle={styles.formHalf}
          />
          <View style={[styles.unitGroup, styles.formHalf]}>
            <KText variant="small" color={colors.textSecondary} style={styles.unitLabel}>
              Unité
            </KText>
            <View style={styles.units}>
              {UNITS.map((unit) => (
                <Chip
                  key={unit}
                  label={unit === 'PIECE' ? 'Pièce' : unit}
                  selected={!form.customUnitOpen && form.unit === unit}
                  onPress={() => selectPresetUnit(unit)}
                />
              ))}
              <Chip
                label="Autre…"
                selected={form.customUnitOpen}
                onPress={selectCustomUnit}
              />
            </View>
          </View>
        </View>

        {form.customUnitOpen ? (
          <Field
            label="Unité personnalisée"
            value={form.customUnit}
            onChangeText={(value) => updateField('customUnit', value)}
            placeholder="Ex. CARTON, BIDON, PAQUET"
            autoCapitalize="characters"
            maxLength={20}
            error={errors.unit}
            helper="20 caractères maximum. Elle apparaîtra sur le stock et les ventes."
          />
        ) : null}

        <KText variant="small" color={colors.textMuted} style={styles.helper}>
          Le bénéfice est calculé automatiquement : prix de vente − prix d’achat.
        </KText>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
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
  rowPressed: {
    backgroundColor: colors.cardSoft,
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
  priceLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  stockBlock: {
    alignItems: 'flex-end',
    gap: 3,
    minWidth: 68,
  },
  stockHint: {
    fontSize: 10,
    lineHeight: 13,
  },
  expiryBadge: {
    marginTop: 2,
  },
  footerButton: {
    flex: 1,
  },
  editIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingBottom: 4,
  },
  editIdentityTexts: {
    flex: 1,
    gap: 2,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  formHalf: {
    flex: 1,
    minWidth: 0,
  },
  unitGroup: {
    gap: 7,
  },
  ordonnanceGroup: {
    gap: 7,
  },
  ordonnanceToggle: {
    minHeight: 52,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ordonnanceToggleOn: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  ordonnanceText: {
    flex: 1,
    lineHeight: 15,
  },
  unitLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    textTransform: 'none',
  },
  units: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  helper: {
    lineHeight: 17,
  },
});
