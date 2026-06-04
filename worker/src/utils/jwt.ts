import { JWTPayload } from '../types';

// ── Minimal JWT implementation using Web Crypto (no external deps) ──────────

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function decodeBase64url(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function getKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  );
}

export async function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = { ...payload, iat: now, exp: now + 8 * 60 * 60 }; // 8h

  const enc = new TextEncoder();
  const header = base64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = base64url(enc.encode(JSON.stringify(fullPayload)));
  const signingInput = `${header}.${body}`;

  const key = await getKey(secret, 'sign');
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput));

  return `${signingInput}.${base64url(new Uint8Array(signature))}`;
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, sig] = parts;
  const enc = new TextEncoder();
  const key = await getKey(secret, 'verify');

  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    decodeBase64url(sig),
    enc.encode(`${header}.${body}`)
  );
  if (!valid) return null;

  const payload: JWTPayload = JSON.parse(new TextDecoder().decode(decodeBase64url(body)));
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;

  return payload;
}
