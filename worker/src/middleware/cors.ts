import { Context, Next } from 'hono';
import { Env } from '../types';

const ALLOWED_ORIGINS = [
  'https://guesthouse.ksom.res.in',
  'https://ksom-guesthouse.pages.dev',
  'http://localhost:8788',
  'http://127.0.0.1:8788',
  'http://localhost:8789',
  'http://127.0.0.1:8789',
];

export async function corsMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const origin = c.req.header('Origin') ?? '';
  let allowedOrigin = ALLOWED_ORIGINS[0];

  if (ALLOWED_ORIGINS.includes(origin)) {
    allowedOrigin = origin;
  } else if (origin.endsWith('.pages.dev') || origin.startsWith('https://') && origin.includes('.pages.dev')) {
    allowedOrigin = origin;
  }

  // Handle preflight
  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  await next();

  c.res.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
