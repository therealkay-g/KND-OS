import React from 'react';
import { TabList, TabSlot, Tabs, TabTrigger } from 'expo-router/ui';
import { LayoutDashboard, Package, Search, ShoppingCart, Users } from 'lucide-react-native';

import { BottomNav, NavItem } from '@/components/bottom-nav';

/**
 * Navigation principale : uniquement les cinq onglets de l'Étape 1.
 * Les écrans poussés (paramètres, fiche client) vivent au-dessus, dans la pile
 * de (app), pour ne pas être traités comme des onglets par expo-router/ui.
 *
 * Important : les <TabTrigger> doivent être écrits littéralement ici, dans les
 * enfants de <TabList>. expo-router/ui ne découvre les onglets qu'en parcourant
 * le JSX littéral — un composant intermédiaire (ex. <AppTabsNav />) casserait
 * silencieusement la déclaration des onglets.
 */
export default function TabsLayout() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <BottomNav>
          <TabTrigger name="dashboard" href="/dashboard" asChild>
            <NavItem label="Dashboard" icon={LayoutDashboard} />
          </TabTrigger>
          <TabTrigger name="vente" href="/vente" asChild>
            <NavItem label="Vente" icon={ShoppingCart} />
          </TabTrigger>
          <TabTrigger name="stock" href="/stock" asChild>
            <NavItem label="Stock" icon={Package} />
          </TabTrigger>
          <TabTrigger name="clients" href="/clients" asChild>
            <NavItem label="Clients" icon={Users} />
          </TabTrigger>
          <TabTrigger name="search" href="/search" asChild>
            <NavItem label="Search" icon={Search} />
          </TabTrigger>
        </BottomNav>
      </TabList>
    </Tabs>
  );
}
