import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Plus, UserPlus, Users } from 'lucide-react-native';

import { ClientAvatar } from '@/components/client-avatar';
import { PageHeader } from '@/components/page-header';
import { AppButton } from '@/components/ui/app-button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Page } from '@/components/ui/page';
import { Sheet } from '@/components/ui/sheet';
import { KText } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useApp } from '@/lib/data-provider';
import { formatCDF, formatPhone } from '@/lib/format';
import { getClientDebt, getTotalDebt } from '@/lib/stats';
import { colors, radius } from '@/lib/theme';

type ClientFilter = 'all' | 'debt';

export default function ClientsScreen() {
  const { data, addClient } = useApp();
  const toast = useToast();
  const [filter, setFilter] = useState<ClientFilter>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clientsWithDebt = useMemo(
    () => data.clients.filter((client) => getClientDebt(data, client.id) > 0),
    [data],
  );
  const totalDebt = useMemo(() => getTotalDebt(data, data.clients), [data]);

  const visibleClients = filter === 'debt' ? clientsWithDebt : data.clients;

  const openAdd = () => {
    setName('');
    setPhone('');
    setErrors({});
    setSheetOpen(true);
  };

  const handleSave = () => {
    const nextErrors: Record<string, string> = {};
    if (name.trim().length < 2) nextErrors.name = 'Entrez le nom du client.';
    if (phone && phone.length !== 9) nextErrors.phone = 'Le numéro doit contenir 9 chiffres.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const result = addClient({ name, phone });
    if (!result.ok) {
      setErrors({ phone: result.message ?? 'Impossible de créer le client.' });
      return;
    }

    setSheetOpen(false);
    toast(`${result.client?.name ?? 'Client'} ajouté.`);
  };

  return (
    <View style={styles.root}>
      <Page>
        <PageHeader
          title="Clients / Dettes"
          subtitle={`${data.clients.length} clients · ${formatCDF(totalDebt)} en dettes`}
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
            count={data.clients.length}
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <Chip
            label="Clients qui doivent"
            count={clientsWithDebt.length}
            selected={filter === 'debt'}
            onPress={() => setFilter('debt')}
          />
        </View>

        {visibleClients.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filter === 'debt' ? 'Personne ne doit rien' : 'Aucun client pour le moment'}
            description={
              filter === 'debt'
                ? 'Les ventes à crédit apparaîtront ici avec le montant dû.'
                : 'Ajoutez un client pour enregistrer une vente à crédit.'
            }
            actionLabel={filter === 'debt' ? 'Voir tous les clients' : 'Ajouter un client'}
            onAction={filter === 'debt' ? () => setFilter('all') : openAdd}
          />
        ) : (
          <View style={styles.list}>
            {visibleClients.map((client, index) => {
              const debt = getClientDebt(data, client.id);
              return (
                <Pressable
                  key={client.id}
                  onPress={() =>
                    router.push({ pathname: '/client/[id]', params: { id: client.id } })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Ouvrir la fiche de ${client.name}`}
                  style={({ pressed }) => [
                    styles.row,
                    index === visibleClients.length - 1 ? styles.rowLast : null,
                    pressed ? styles.rowPressed : null,
                  ]}>
                  <ClientAvatar name={client.name} />
                  <View style={styles.rowTexts}>
                    <KText variant="body" numberOfLines={1} style={styles.rowName}>
                      {client.name}
                    </KText>
                    <KText variant="small" color={colors.textMuted} numberOfLines={1}>
                      {client.phone ? formatPhone(client.phone) : 'Sans numéro'}
                    </KText>
                  </View>
                  <View style={styles.debtBlock}>
                    <KText
                      variant="price"
                      color={debt > 0 ? colors.red : colors.green}
                      numberOfLines={1}>
                      {formatCDF(debt)}
                    </KText>
                    <KText
                      variant="small"
                      color={debt > 0 ? colors.red : colors.textMuted}
                      style={styles.debtHint}>
                      {debt > 0 ? 'dette' : 'à jour'}
                    </KText>
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
        onClose={() => setSheetOpen(false)}
        title="Nouveau client"
        subtitle="Le client pourra acheter à crédit."
        footer={
          <View style={styles.footerButton}>
            <AppButton
              label="Ajouter le client"
              onPress={handleSave}
              icon={<UserPlus size={18} color={colors.black} strokeWidth={2} />}
            />
          </View>
        }>
        <Field
          label="Nom du client"
          value={name}
          onChangeText={(value) => {
            setName(value);
            if (errors.name) setErrors((previous) => ({ ...previous, name: '' }));
          }}
          placeholder="Ex. Maman Georgette"
          autoCapitalize="words"
          autoFocus
          error={errors.name}
        />
        <Field
          label="Téléphone WhatsApp (optionnel)"
          value={phone}
          onChangeText={(value) => {
            setPhone(value.replace(/\D/g, '').slice(0, 9));
            if (errors.phone) setErrors((previous) => ({ ...previous, phone: '' }));
          }}
          placeholder="97 000 0000"
          keyboardType="phone-pad"
          prefix="+243"
          error={errors.phone}
          helper="Utile pour rappeler une dette."
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
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 70,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowPressed: {
    backgroundColor: colors.cardSoft,
  },
  rowTexts: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  rowName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 20,
  },
  debtBlock: {
    alignItems: 'flex-end',
    gap: 1,
    minWidth: 78,
  },
  debtHint: {
    fontSize: 10,
    lineHeight: 13,
  },
  footerButton: {
    flex: 1,
  },
});
