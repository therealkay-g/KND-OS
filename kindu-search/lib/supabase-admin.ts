import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Client serveur réservé à l'admin. La clé service_role contourne RLS : elle ne
 * doit jamais être exposée au navigateur ni préfixée NEXT_PUBLIC_.
 *
 * Sans clé service_role, /admin fonctionne en mode démo local (2 fiches en
 * attente + fiches ajoutées dans ce navigateur).
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  if (!client) {
    client = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
