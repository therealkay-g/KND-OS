import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'kindu_admin';

/** Code de démonstration. En production, définir ADMIN_ACCESS_CODE. */
export function adminAccessCode(): string {
  return process.env.ADMIN_ACCESS_CODE?.trim() || 'kay-demo';
}

function sessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET?.trim() || adminAccessCode();
}

export function adminSessionToken(): string {
  return createHmac('sha256', sessionSecret())
    .update('kindu-search-admin-v1')
    .digest('hex');
}

export function isAdminCodeValid(input: unknown): boolean {
  if (typeof input !== 'string') return false;
  const expected = Buffer.from(adminAccessCode());
  const received = Buffer.from(input.trim());
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

export function isAdminTokenValid(value: string | undefined): boolean {
  if (!value) return false;
  const expected = Buffer.from(adminSessionToken());
  const received = Buffer.from(value);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return isAdminTokenValid(store.get(ADMIN_COOKIE)?.value);
}

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 8 * 60 * 60,
};
