import React from 'react';
import { Redirect } from 'expo-router';

import { useApp } from '@/lib/data-provider';

export default function IndexScreen() {
  const { hydrated, isLoggedIn } = useApp();

  if (!hydrated) return null;
  return <Redirect href={isLoggedIn ? '/dashboard' : '/login'} />;
}
