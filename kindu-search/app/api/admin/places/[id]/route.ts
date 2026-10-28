import { NextResponse } from 'next/server';

import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { ok: false, message: 'Session admin requise.' },
      { status: 401 },
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { ok: false, message: 'Commerce invalide.' },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Corps JSON invalide.' },
      { status: 400 },
    );
  }

  const action =
    body && typeof body === 'object'
      ? (body as Record<string, unknown>).action
      : undefined;

  if (action !== 'verify' && action !== 'refuse') {
    return NextResponse.json(
      { ok: false, message: 'Action admin invalide.' },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    // Mode local : la page /admin met à jour son stockage local.
    return NextResponse.json({ ok: true, mode: 'local', action });
  }

  const now = new Date().toISOString();
  const update =
    action === 'verify'
      ? {
          est_verifie: true,
          est_actif: true,
          verifie_le: now,
          motif_refus: null,
        }
      : {
          est_verifie: false,
          est_actif: false,
          verifie_le: now,
          motif_refus: 'Refusé par l’admin',
        };

  const { data, error } = await admin
    .from('places')
    .update(update)
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json(
      { ok: false, message: 'Commerce introuvable.' },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, mode: 'supabase', action });
}
