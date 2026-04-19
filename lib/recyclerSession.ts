import crypto from 'crypto';

const RAW_SECRET = process.env.RECYCLER_SESSION_SECRET ?? process.env.NEXTAUTH_SECRET;
if (!RAW_SECRET || RAW_SECRET.length < 32) {
  throw new Error(
    'RECYCLER_SESSION_SECRET (or NEXTAUTH_SECRET) must be set to a 32+ char random string.',
  );
}
const SECRET: string = RAW_SECRET;

const MAX_AGE_SEC = 60 * 60 * 24 * 7;

export function signToken(id: string): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = `${id}.${exp}`;
  const hmac = crypto.createHmac('sha512', SECRET).update(payload).digest('hex');
  return `${payload}.${hmac}`;
}

export function verifyToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [id, expStr, sig] = parts;
  if (!id || !expStr || !sig) return null;

  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;

  const expected = crypto.createHmac('sha512', SECRET).update(`${id}.${exp}`).digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return crypto.timingSafeEqual(a, b) ? id : null;
}
