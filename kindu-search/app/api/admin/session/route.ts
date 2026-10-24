import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_OPTIONS,
  adminSessionToken,
  isAdminAuthenticated,
  isAdminCodeValid,
} from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ authenticated: await isAdminAuthenticated() });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Corps JSON invalide.' },
      { status: 400 },
    );
  }

  const code =
    body && typeof body === 'object'
      ? (body as Record<string, unknown>).code
      : undefined;

  if (!isAdminCodeValid(code)) {
    return NextResponse.json(
      { ok: false, message: 'Code admin incorrect.' },
      { status: 401 },
    );
  }

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const secure =
    forwardedProto === 'https' || new URL(request.url).protocol === 'https:';

  const store = await cookies();
  store.set(ADMIN_COOKIE, adminSessionToken(), {
    ...ADMIN_COOKIE_OPTIONS,
    secure,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const secure =
    forwardedProto === 'https' || new URL(request.url).protocol === 'https:';

  const store = await cookies();
  store.set(ADMIN_COOKIE, '', {
    ...ADMIN_COOKIE_OPTIONS,
    maxAge: 0,
    secure,
  });
  return NextResponse.json({ ok: true });
}
