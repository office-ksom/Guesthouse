import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { hashPassword } from './auth';
import { Env } from '../types';

const users = new Hono<{ Bindings: Env }>();

// ── GET /api/users [admin] ────────────────────────────────────────────────────
users.get('/', authMiddleware('admin'), async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, name, email, role, is_active, last_login, created_at FROM staff_users ORDER BY created_at DESC'
  ).all();
  return c.json({ users: results });
});

// ── POST /api/users [admin] ───────────────────────────────────────────────────
users.post('/', authMiddleware('admin'), async (c) => {
  const body = await c.req.json<{ name: string; email: string; password?: string; role: string }>();
  if (!body.name || !body.email || !body.role) {
    return c.json({ error: 'name, email, and role are required' }, 400);
  }
  if (!['admin', 'receptionist', 'viewer'].includes(body.role)) {
    return c.json({ error: 'Invalid role' }, 400);
  }

  const existing = await c.env.DB.prepare('SELECT id FROM staff_users WHERE email = ?').bind(body.email).first();
  if (existing) return c.json({ error: 'Email already in use' }, 409);

  // Generate a random secure placeholder password if not specified
  const password = body.password || crypto.randomUUID();
  const hash = await hashPassword(password);
  const result = await c.env.DB.prepare(
    'INSERT INTO staff_users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).bind(body.name, body.email.toLowerCase().trim(), hash, body.role).run();

  return c.json({ id: result.meta.last_row_id, message: 'User created' }, 201);
});

// ── PUT /api/users/:id [admin] ────────────────────────────────────────────────
users.put('/:id', authMiddleware('admin'), async (c) => {
  const id = parseInt(c.req.param('id') || '0');
  const body = await c.req.json<{ name?: string; role?: string; is_active?: number; password?: string }>();
  const existing = await c.env.DB.prepare('SELECT * FROM staff_users WHERE id = ?').bind(id).first();
  if (!existing) return c.json({ error: 'User not found' }, 404);

  const hash = body.password ? await hashPassword(body.password) : existing.password_hash;

  await c.env.DB.prepare(
    'UPDATE staff_users SET name=?, role=?, is_active=?, password_hash=? WHERE id=?'
  ).bind(
    body.name ?? existing.name, body.role ?? existing.role,
    body.is_active ?? existing.is_active, hash, id
  ).run();
  return c.json({ message: 'User updated' });
});

// ── DELETE /api/users/:id [admin] — deactivate ───────────────────────────────
users.delete('/:id', authMiddleware('admin'), async (c) => {
  const id = parseInt(c.req.param('id') || '0');
  const me = c.get('user');
  if (me.sub === id) return c.json({ error: 'Cannot deactivate your own account' }, 400);
  await c.env.DB.prepare('UPDATE staff_users SET is_active = 0 WHERE id = ?').bind(id).run();
  return c.json({ message: 'User deactivated' });
});

export default users;
