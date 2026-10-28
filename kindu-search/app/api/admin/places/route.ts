import { NextResponse } from 'next/server';

import { isAdminAuthenticated } from '@/lib/admin-auth';
import { SEED_PENDING_PLACES } from '@/lib/pending-seed';
import { SEED_PLACES, type Place } from '@/lib/places';
import { mapPlaceRow } from '@/lib/supabase-places';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Row = Record<string, unknown>;

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { ok: false, message: 'Session admin requise.' },
      { status: 401 },
    );
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({
      mode: 'local',
      places: [...SEED_PLACES, ...SEED_PENDING_PLACES],
    });
  }

  const { data, error } = await admin
    .from('places')
    .select('*')
    .eq('est_actif', true)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    mode: 'supabase',
    places: (data ?? [])
      .map((row) => mapPlaceRow(row as Row))
      .filter((place): place is Place => place !== null),
  });
}
