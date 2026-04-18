import crypto from 'crypto';

const SECRET = process.env.RECYCLER_SESSION_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'rh-recycler-portal-2026';

export function signToken(id: string): string {
  const hmac = crypto.createHmac('sha256', SECRET).update(id).digest('hex');
  return `${id}:${hmac}`;
}

export function verifyToken(token: string): string | null {
  const [id, sig] = token.split(':');
  if (!id || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(id).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? id : null;
}
