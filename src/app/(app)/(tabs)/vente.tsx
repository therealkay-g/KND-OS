import React, { useMemo, useRef, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
  type TextStyle,
} from 'react-native';
import { router } from 'expo-router';
import {
  AlertTriangle,
  Camera,
  ChevronRight,
  MessageCircle,
  Minus,
  Plus,
  Search,
  UserPlus,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClientAvatar } from '@/components/client-avatar';
import { Page } from '@/components/ui/page';
import { PageHeader } from '@/components/page-header';
import { ProductAvatar } from '@/components/product-avatar';
import { AppButton } from '@/components/ui/app-button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Sheet } from '@/components/ui/sheet';
import { KText } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useApp } from '@/lib/data-provider';
import {
  formatCDF,
  formatCountLabel,
  formatDateTime,
  formatPhone,
  formatQuantity,
  formatStock,
  formatUnit,
} from '@/lib/format';
import { pickPrescriptionPhoto } from '@/lib/prescription-photo';
import { getClientDebt, isLowStock } from '@/lib/stats';
import { colors, layout, radius } from '@/lib/theme';
import type { Product, Sale } from '@/lib/types';
import { openWhatsApp, saleWhatsAppMessage } from '@/lib/whatsapp';

type CheckoutStep = 'cart' | 'credit' | 'new-client' | 'ticket';

/** Gris lisible sur le ticket blanc (le thème est prévu pour fond noir). */
const TICKET_MUTED = '#52525B';

const webInputStyle =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : undefined;

export default function VenteScreen() {
  const { data, sell, addClient } = useApp();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const cartRef = useRef<Record<string, number>>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [clientError, setClientError] = useState('');
  const [prescriptionGate, setPrescriptionGate] = useState<'cash' | 'credit' | null>(null);
  const [prescriptionPhoto, setPrescriptionPhoto] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [ticketPhone, setTicketPhone] = useState('');

  const isPharmacy = data.merchant?.mode === 'Pharmacie';
  const storeName = data.merchant?.storeName ?? 'KND OS';

  const columns = width >= 1000 ? 4 : width >= 760 ? 3 : 2;
  const cardBasis = columns === 4 ? '23.4%' : columns === 3 ? '31.6%' : '48.2%';

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data.products;
    return data.products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        (product.barcode ? product.barcode.includes(query) : false) ||
        (product.molecule ? product.molecule.toLowerCase().includes(query) : false),
    );
  }, [data.products, search]);

  const cartDetailed = useMemo(
    () =>
      Object.entries(cart)
        .map(([productId, quantity]) => {
          const product = data.products.find((entry) => entry.id === productId);
          if (!product) return null;
          return {
            product,
            quantity,
            lineTotal: Math.round(product.salePrice * quantity),
            lineProfit: Math.round((product.salePrice - product.purchasePrice) * quantity),
          };
        })
        .filter((line): line is NonNullable<typeof line> => line !== null),
    [cart, data.products],
  );

  const cartCount = cartDetailed.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = cartDetailed.reduce((sum, line) => sum + line.lineTotal, 0);
  const cartProfit = cartDetailed.reduce((sum, line) => sum + line.lineProfit, 0);

  const prescriptionLines = cartDetailed.filter((line) => line.product.prescriptionRequired);
  const needsPrescription = prescriptionLines.length > 0;

  const updateCart = (updater: (previous: Record<string, number>) => Record<string, number>) => {
    const next = updater(cartRef.current);
    cartRef.current = next;
    setCart(next);
  };

  const openCheckout = () => {
    if (cartCount === 0) return;
    setStep('cart');
    setSheetOpen(true);
  };

  const closeCheckout = () => {
    setSheetOpen(false);
    setStep('cart');
    setLastSale(null);
    setTicketPhone('');
    setClientError('');
  };

  const addToCart = (product: Product) => {
    const current = cartRef.current[product.id] ?? 0;
    if (product.stock <= 0) {
      toast(`${product.name} est en rupture de stock.`, 'error');
      return;
    }
    if (current + 1 > product.stock) {
      toast(`Stock insuffisant pour ${product.name}.`, 'error');
      return;
    }
    updateCart((previous) => ({ ...previous, [product.id]: current + 1 }));
  };

  const changeQuantity = (product: Product, direction: 1 | -1) => {
    const step = product.unit === 'PIECE' ? 1 : 0.5;
    const current = cartRef.current[product.id] ?? 0;
    const next = Math.round((current + direction * step) * 100) / 100;
    if (next <= 0) {
      updateCart((previous) => {
        const copy = { ...previous };
        delete copy[product.id];
        return copy;
      });
      return;
    }
    if (next > product.stock) {
      toast(`Il reste ${formatStock(product.stock, product.unit)} en stock.`, 'error');
      return;
    }
    updateCart((previous) => ({ ...previous, [product.id]: next }));
  };

  const cartLines = cartDetailed.map((line) => ({
    productId: line.product.id,
    quantity: line.quantity,
  }));

  const finishSale = (message: string, sale: Sale, phone?: string) => {
    cartRef.current = {};
    setCart({});
    setStep('ticket');
    setLastSale(sale);
    setTicketPhone(phone ?? '');
    setNewClientName('');
    setNewClientPhone('');
    setClientError('');
    setPrescriptionGate(null);
    setPrescriptionPhoto(null);
    toast(message);
  };

  const handleCash = () => {
    const result = sell('cash', cartLines, undefined, prescriptionPhoto ?? undefined);
    if (!result.ok || !result.sale) {
      toast(result.message ?? 'La vente n’a pas pu être enregistrée.', 'error');
      return;
    }
    finishSale(`Vente ${formatCDF(result.sale.total)} OK · stock mis à jour`, result.sale);
  };

  const handleCreditForClient = (clientId: string) => {
    const client = data.clients.find((entry) => entry.id === clientId);
    const result = sell('credit', cartLines, clientId, prescriptionPhoto ?? undefined);
    if (!result.ok || !result.sale) {
      toast(result.message ?? 'Le crédit n’a pas pu être enregistré.', 'error');
      return;
    }
    finishSale(
      `Crédit de ${formatCDF(result.sale.total)} ajouté pour ${client?.name ?? 'le client'}`,
      result.sale,
      client?.phone,
    );
  };

  const openCreditStep = () => {
    setStep(data.clients.length === 0 ? 'new-client' : 'credit');
    setClientError('');
  };

  const requestCash = () => {
    if (needsPrescription && !prescriptionPhoto) {
      setPrescriptionGate('cash');
      return;
    }
    handleCash();
  };

  const requestCredit = () => {
    if (needsPrescription && !prescriptionPhoto) {
      setPrescriptionGate('credit');
      return;
    }
    openCreditStep();
  };

  const handlePickPhoto = async () => {
    const result = await pickPrescriptionPhoto();
    if (!result.ok) {
      if (result.message) toast(result.message, 'error');
      return;
    }
    if (result.uri) setPrescriptionPhoto(result.uri);
  };

  const confirmPrescriptionGate = () => {
    if (!prescriptionPhoto) return;
    const target = prescriptionGate;
    setPrescriptionGate(null);
    if (target === 'cash') handleCash();
    else if (target === 'credit') openCreditStep();
  };

  const handleCreateClientAndSell = () => {
    const result = addClient({ name: newClientName, phone: newClientPhone });
    if (!result.ok || !result.client) {
      setClientError(result.message ?? 'Impossible de créer le client.');
      return;
    }
    const sale = sell('credit', cartLines, result.client.id, prescriptionPhoto ?? undefined);
    if (!sale.ok || !sale.sale) {
      setClientError(sale.message ?? 'Le client est créé, mais le crédit a échoué.');
      return;
    }
    finishSale(
      `Crédit de ${formatCDF(sale.sale.total)} ajouté pour ${result.client.name}`,
      sale.sale,
      result.client.phone,
    );
  };

  const sendTicket = async () => {
    if (!lastSale) return;
    if (!ticketPhone.trim()) {
      toast('Entrez le numéro WhatsApp du client.', 'error');
      return;
    }
    const opened = await openWhatsApp(
      ticketPhone,
      saleWhatsAppMessage(storeName, lastSale),
    );
    if (!opened) {
      toast('Numéro WhatsApp invalide. Vérifiez les 9 chiffres.', 'error');
    }
  };

  const sheetTitle =
    step === 'cart'
      ? 'Panier'
      : step === 'credit'
        ? 'Vendre à crédit'
        : step === 'new-client'
          ? 'Nouveau client'
          : 'Ticket de vente';
  const sheetSubtitle =
    step === 'cart'
      ? `${formatCountLabel(cartCount, 'unité')} · le stock sera déduit`
      : step === 'credit'
        ? 'Choisissez le client qui prendra ce crédit.'
        : step === 'new-client'
          ? 'Le client et sa dette seront enregistrés.'
          : 'Vente enregistrée · envoyez le ticket sur WhatsApp.';

  return (
    <View style={styles.root}>
      <Page contentStyle={styles.pageContent} extraBottom={86}>
        <PageHeader
          title="Vente rapide"
          subtitle={`${data.products.length} produits · ${data.products.filter((p) => p.stock <= 0).length} en rupture`}
        />

        <View style={styles.searchBox}>
          <Search size={18} color={colors.textMuted} strokeWidth={2} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={
              isPharmacy
                ? 'Rechercher un nom, une molécule ou un code-barres'
                : 'Rechercher un produit ou un code-barres'
            }
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            style={[styles.searchInput, webInputStyle]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {search ? (
            <Pressable
              onPress={() => setSearch('')}
              accessibilityRole="button"
              accessibilityLabel="Effacer la recherche"
              hitSlop={8}>
              <X size={17} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
          ) : null}
        </View>

        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Aucun produit trouvé"
            description="Essayez un autre nom ou ajoutez ce produit à votre stock."
            actionLabel="Voir le stock"
            onAction={() => router.push('/stock')}
          />
        ) : (
          <View style={styles.grid}>
            {filteredProducts.map((product) => {
              const quantity = cart[product.id] ?? 0;
              const outOfStock = product.stock <= 0;
              return (
                <Pressable
                  key={product.id}
                  onPress={() => addToCart(product)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ajouter ${product.name} au panier`}
                  style={({ pressed }) => [
                    styles.productCard,
                    { flexBasis: cardBasis },
                    outOfStock ? styles.productCardDisabled : null,
                    pressed && !outOfStock ? styles.productCardPressed : null,
                  ]}>
                  <View style={styles.productTop}>
                    <ProductAvatar emoji={product.emoji} size={52} muted={outOfStock} />
                    {quantity > 0 ? (
                      <View style={styles.cartBadge}>
                        <KText variant="small" color={colors.black} style={styles.cartBadgeText}>
                          {quantity}
                        </KText>
                      </View>
                    ) : outOfStock ? (
                      <Badge label="Rupture" tone="red" />
                    ) : null}
                  </View>
                  <View style={styles.productTexts}>
                    <KText
                      variant="body"
                      style={styles.productName}
                      numberOfLines={2}>
                      {product.name}
                    </KText>
                    <KText variant="price" color={colors.accent}>
                      {formatCDF(product.salePrice)}
                    </KText>
                    <KText
                      variant="small"
                      color={isLowStock(product.stock) ? colors.red : colors.textMuted}
                      style={styles.productStock}
                      numberOfLines={1}>
                      Stock : {formatStock(product.stock, product.unit)}
                    </KText>
                    {product.prescriptionRequired ? (
                      <KText
                        variant="small"
                        color={colors.orange}
                        style={styles.productStock}
                        numberOfLines={1}>
                        Ordonnance requise
                      </KText>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </Page>

      {cartCount > 0 ? (
        <View
          style={[
            styles.cartBarWrap,
            { bottom: Math.max(insets.bottom, layout.navBottom) + layout.navHeight + 8 },
          ]}>
          <Pressable
            onPress={openCheckout}
            accessibilityRole="button"
            accessibilityLabel={`Voir le panier, ${formatCDF(cartTotal)}`}
            style={({ pressed }) => [styles.cartBar, pressed ? styles.cartBarPressed : null]}>
            <View style={styles.cartCount}>
              <KText variant="small" color={colors.black} style={styles.cartCountText}>
                {formatQuantity(cartCount)}
              </KText>
            </View>
            <View style={styles.cartSummary}>
              <KText variant="small" color={colors.textSecondary}>
                {formatCountLabel(cartCount, 'unité')} ·{' '}
                {formatCDF(cartProfit)} de bénéfice
              </KText>
              <KText variant="subtitle" color={colors.accent} style={styles.cartTotal}>
                {formatCDF(cartTotal)}
              </KText>
            </View>
            <View style={styles.cartAction}>
              <KText variant="small" color={colors.black} style={styles.cartActionText}>
                Panier
              </KText>
              <ChevronRight size={17} color={colors.black} strokeWidth={2.4} />
            </View>
          </Pressable>
        </View>
      ) : null}

      <Sheet
        visible={sheetOpen}
        onClose={closeCheckout}
        title={sheetTitle}
        subtitle={sheetSubtitle}
        footer={
          step === 'cart' ? (
            <>
              <View style={styles.footerButton}>
                <AppButton label="Vendre Cash" onPress={requestCash} size="md" />
              </View>
              <View style={styles.footerButton}>
                <AppButton
                  label="Vendre Crédit"
                  onPress={requestCredit}
                  variant="secondary"
                  size="md"
                />
              </View>
            </>
          ) : step === 'new-client' ? (
            <>
              <View style={styles.footerButton}>
                <AppButton
                  label="Retour"
                  onPress={() => setStep('credit')}
                  variant="ghost"
                  size="md"
                />
              </View>
              <View style={styles.footerButton}>
                <AppButton
                  label="Créer et vendre"
                  onPress={handleCreateClientAndSell}
                  size="md"
                />
              </View>
            </>
          ) : step === 'ticket' ? (
            <View style={styles.ticketFooter}>
              <AppButton
                label="Envoyer sur WhatsApp"
                onPress={sendTicket}
                variant="whatsapp"
                size="md"
                icon={<MessageCircle size={18} color={colors.white} strokeWidth={2} />}
              />
              <AppButton
                label="Fermer"
                onPress={closeCheckout}
                variant="ghost"
                size="md"
              />
            </View>
          ) : (
            <View style={styles.footerButton}>
              <AppButton
                label="Retour au panier"
                onPress={() => setStep('cart')}
                variant="ghost"
                size="md"
              />
            </View>
          )
        }>
        {step === 'ticket' && lastSale ? (
          <>
            <View style={styles.ticket}>
              <KText variant="subtitle" color={colors.black} style={styles.ticketCenter}>
                {storeName}
              </KText>
              <KText variant="small" color={TICKET_MUTED} style={styles.ticketCenter}>
                {formatDateTime(lastSale.createdAt)}
              </KText>

              <View style={styles.ticketDivider} />

              {lastSale.items.map((item) => (
                <View key={item.productId} style={styles.ticketLine}>
                  <View style={styles.ticketLineTexts}>
                    <KText variant="small" color={colors.black} numberOfLines={1}>
                      {item.name}
                    </KText>
                    <KText variant="small" color={TICKET_MUTED}>
                      {formatQuantity(item.quantity)} {formatUnit(item.unit, item.quantity > 1)} ×{' '}
                      {formatCDF(item.unitPrice)}
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
                  {formatCDF(lastSale.total)}
                </KText>
              </View>
              <KText variant="small" color={TICKET_MUTED} style={styles.ticketCenter}>
                {lastSale.paymentType === 'credit' ? 'Vente à crédit' : 'Payé en espèces'} · Merci !
              </KText>
            </View>

            <Field
              label="Téléphone WhatsApp du client"
              value={ticketPhone}
              onChangeText={(value) => setTicketPhone(value.replace(/\D/g, '').slice(0, 9))}
              placeholder="97 000 0000"
              keyboardType="phone-pad"
              prefix="+243"
              helper="Le ticket sera pré-rempli dans WhatsApp, puis vous validez l’envoi."
            />
          </>
        ) : step === 'cart' ? (
          <>
            <View style={styles.cartList}>
              {cartDetailed.map(({ product, quantity, lineTotal }) => (
                <View key={product.id} style={styles.cartRow}>
                  <ProductAvatar emoji={product.emoji} size={44} />
                  <View style={styles.cartRowTexts}>
                    <KText variant="body" numberOfLines={1} style={styles.cartRowName}>
                      {product.name}
                    </KText>
                    <KText variant="small" color={colors.textMuted} numberOfLines={1}>
                      {formatCDF(product.salePrice)} / {formatUnit(product.unit)}
                    </KText>
                  </View>
                  <View style={styles.quantityControl}>
                    <Pressable
                      onPress={() => changeQuantity(product, -1)}
                      accessibilityRole="button"
                      accessibilityLabel={`Diminuer la quantité de ${product.name}`}
                      hitSlop={6}
                      style={styles.quantityButton}>
                      <Minus size={14} color={colors.text} strokeWidth={2.2} />
                    </Pressable>
                    <KText variant="price" style={styles.quantityValue}>
                      {formatQuantity(quantity)}
                    </KText>
                    <Pressable
                      onPress={() => changeQuantity(product, 1)}
                      accessibilityRole="button"
                      accessibilityLabel={`Augmenter la quantité de ${product.name}`}
                      hitSlop={6}
                      style={styles.quantityButton}>
                      <Plus size={14} color={colors.text} strokeWidth={2.2} />
                    </Pressable>
                  </View>
                  <KText variant="price" style={styles.lineTotal} numberOfLines={1}>
                    {formatCDF(lineTotal)}
                  </KText>
                </View>
              ))}
            </View>

            <View style={styles.totals}>
              <View style={styles.totalRow}>
                <KText variant="body" color={colors.textSecondary}>
                  Total à encaisser
                </KText>
                <KText variant="title" color={colors.accent} style={styles.totalValue}>
                  {formatCDF(cartTotal)}
                </KText>
              </View>
              <View style={styles.totalRow}>
                <KText variant="small" color={colors.textMuted}>
                  Bénéfice estimé
                </KText>
                <KText variant="price" color={colors.green}>
                  {formatCDF(cartProfit)}
                </KText>
              </View>
            </View>
          </>
        ) : step === 'credit' ? (
          <>
            <AppButton
              label="Nouveau client"
              onPress={() => setStep('new-client')}
              variant="ghost"
              size="md"
              icon={<UserPlus size={18} color={colors.accent} strokeWidth={2} />}
            />
            <View style={styles.clientList}>
              {data.clients.map((client) => {
                const debt = getClientDebt(data, client.id);
                return (
                  <Pressable
                    key={client.id}
                    onPress={() => handleCreditForClient(client.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Vendre à crédit à ${client.name}`}
                    style={({ pressed }) => [
                      styles.clientRow,
                      pressed ? styles.clientRowPressed : null,
                    ]}>
                    <ClientAvatar name={client.name} />
                    <View style={styles.clientTexts}>
                      <KText variant="body" numberOfLines={1} style={styles.clientName}>
                        {client.name}
                      </KText>
                      <KText variant="small" color={colors.textMuted} numberOfLines={1}>
                        {client.phone ? formatPhone(client.phone) : 'Sans numéro'}
                      </KText>
                    </View>
                    <View style={styles.clientDebt}>
                      <KText
                        variant="price"
                        color={debt > 0 ? colors.red : colors.green}
                        numberOfLines={1}>
                        {formatCDF(debt)}
                      </KText>
                      <KText variant="small" color={colors.textMuted} style={styles.clientDebtLabel}>
                        dette
                      </KText>
                    </View>
                    <ChevronRight size={17} color={colors.textMuted} strokeWidth={2} />
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.creditSummary}>
              <KText variant="small" color={colors.textSecondary}>
                Nouveau crédit
              </KText>
              <KText variant="subtitle" color={colors.accent}>
                {formatCDF(cartTotal)}
              </KText>
            </View>
          </>
        ) : (
          <>
            <Field
              label="Nom du client"
              value={newClientName}
              onChangeText={(value) => {
                setNewClientName(value);
                if (clientError) setClientError('');
              }}
              placeholder="Ex. Maman Georgette"
              autoCapitalize="words"
              autoFocus
            />
            <Field
              label="Téléphone WhatsApp (optionnel)"
              value={newClientPhone}
              onChangeText={(value) => {
                setNewClientPhone(value.replace(/\D/g, '').slice(0, 9));
                if (clientError) setClientError('');
              }}
              placeholder="97 000 0000"
              keyboardType="phone-pad"
              prefix="+243"
              error={clientError}
              helper="Utile pour rappeler le crédit plus tard."
            />
            <View style={styles.creditSummary}>
              <KText variant="small" color={colors.textSecondary}>
                Crédit à enregistrer
              </KText>
              <KText variant="subtitle" color={colors.accent}>
                {formatCDF(cartTotal)}
              </KText>
            </View>
          </>
        )}
      </Sheet>

      <Sheet
        visible={prescriptionGate !== null}
        onClose={() => setPrescriptionGate(null)}
        title="Ordonnance requise"
        subtitle="La vente est bloquée sans la photo de l’ordonnance."
        footer={
          <>
            <View style={styles.footerButton}>
              <AppButton
                label="Annuler"
                onPress={() => setPrescriptionGate(null)}
                variant="ghost"
                size="md"
              />
            </View>
            <View style={styles.footerButton}>
              <AppButton
                label="Valider et continuer"
                onPress={confirmPrescriptionGate}
                disabled={!prescriptionPhoto}
                size="md"
              />
            </View>
          </>
        }>
        <View style={styles.prescriptionBox}>
          <AlertTriangle size={20} color={colors.orange} strokeWidth={1.9} />
          <KText variant="body" color={colors.textSecondary} style={styles.prescriptionText}>
            {prescriptionLines.map((line) => line.product.name).join(', ')}{' '}
            {prescriptionLines.length > 1 ? 'exigent' : 'exige'} une ordonnance. Photographiez
            l’ordonnance du client avant de valider.
          </KText>
        </View>

        {prescriptionPhoto ? (
          <View style={styles.photoRow}>
            <Image source={{ uri: prescriptionPhoto }} style={styles.photoPreview} />
            <View style={styles.photoTexts}>
              <KText variant="body" style={styles.photoTitle}>
                Photo prête
              </KText>
              <KText variant="small" color={colors.textMuted}>
                Elle sera jointe à cette vente.
              </KText>
            </View>
          </View>
        ) : null}

        <AppButton
          label={prescriptionPhoto ? 'Remplacer la photo' : 'Prendre la photo'}
          onPress={handlePickPhoto}
          variant="secondary"
          size="md"
          icon={<Camera size={18} color={colors.accent} strokeWidth={2} />}
        />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageContent: {
    gap: 0,
  },
  searchBox: {
    height: 50,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    height: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  productCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 12,
    gap: 12,
    minWidth: 145,
  },
  productCardPressed: {
    opacity: 0.8,
    borderColor: colors.borderStrong,
  },
  productCardDisabled: {
    opacity: 0.55,
  },
  productTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
    minHeight: 52,
  },
  cartBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  cartBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    lineHeight: 15,
  },
  productTexts: {
    gap: 3,
  },
  productName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 19,
    minHeight: 38,
  },
  productStock: {
    fontSize: 11,
    lineHeight: 14,
  },
  cartBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 12,
    zIndex: 40,
  },
  cartBar: {
    width: '100%',
    maxWidth: layout.navWidth,
    minHeight: 60,
    backgroundColor: colors.card,
    borderColor: colors.accent,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartBarPressed: {
    opacity: 0.9,
  },
  cartCount: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  cartCountText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    lineHeight: 16,
  },
  cartSummary: {
    flex: 1,
    gap: 1,
  },
  cartTotal: {
    fontSize: 17,
    lineHeight: 21,
  },
  cartAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingLeft: 10,
    paddingRight: 7,
    height: 34,
  },
  cartActionText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    lineHeight: 15,
  },
  cartList: {
    gap: 2,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cartRowTexts: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  cartRowName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 18,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    height: 32,
  },
  quantityButton: {
    width: 28,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    minWidth: 22,
    textAlign: 'center',
  },
  lineTotal: {
    width: 82,
    textAlign: 'right',
    fontSize: 13,
  },
  totals: {
    marginTop: 12,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
    gap: 8,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  totalValue: {
    fontSize: 20,
    lineHeight: 26,
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
  ticketFooter: {
    flex: 1,
    gap: 10,
  },
  footerButton: {
    flex: 1,
  },
  clientList: {
    gap: 2,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  clientRowPressed: {
    opacity: 0.7,
  },
  clientTexts: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  clientName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 19,
  },
  clientDebt: {
    alignItems: 'flex-end',
    minWidth: 78,
    gap: 1,
  },
  clientDebtLabel: {
    fontSize: 10,
    lineHeight: 13,
  },
  creditSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  prescriptionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.orangeSoft,
    borderColor: 'rgba(249, 115, 22, 0.35)',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 13,
  },
  prescriptionText: {
    flex: 1,
    lineHeight: 19,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 10,
  },
  photoPreview: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.cardSoft,
  },
  photoTexts: {
    flex: 1,
    gap: 1,
  },
  photoTitle: {
    fontFamily: 'Inter_500Medium',
  },
});
