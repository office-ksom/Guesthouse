import { Context, Next } from 'hono';
import { verifyJWT } from '../utils/jwt';
import { Env, JWTPayload, Role } from '../types';

declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload;
  }
}

export function authMiddleware(...allowedRoles: Role[]) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return c.json({ error: 'Unauthorized: No token provided' }, 401);
    }

    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    if (!payload) {
      return c.json({ error: 'Unauthorized: Invalid or expired token' }, 401);
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
      return c.json({ error: 'Forbidden: Insufficient permissions' }, 403);
    }

    c.set('user', payload);
    await next();
  };
}
