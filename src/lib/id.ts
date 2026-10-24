/**
 * Identifiants locaux. crypto.randomUUID n'est pas garanti sur tous les
 * téléphones Android bas de gamme, on garde un fallback simple.
 */
export function createId(prefix: string): string {
  const cryptoObject = globalThis.crypto as { randomUUID?: () => string } | undefined;
  const random = cryptoObject?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
}
