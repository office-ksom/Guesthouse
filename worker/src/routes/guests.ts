import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { Env } from '../types';

const guests = new Hono<{ Bindings: Env }>();

// ── GET /api/guests [receptionist+] ──────────────────────────────────────────
guests.get('/', authMiddleware('admin', 'receptionist', 'viewer'), async (c) => {
  const search = c.req.query('search');
  const page = parseInt(c.req.query('page') ?? '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM guests WHERE 1=1';
  const params: (string | number)[] = [];

  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR organization LIKE ? OR designation LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s, s);
  }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ guests: results, page, limit });
});

// ── GET /api/guests/:id [receptionist+] ──────────────────────────────────────
guests.get('/:id', authMiddleware('admin', 'receptionist', 'viewer'), async (c) => {
  const guest = await c.env.DB.prepare('SELECT * FROM guests WHERE id = ?').bind(parseInt(c.req.param('id') || '0')).first();
  if (!guest) return c.json({ error: 'Guest not found' }, 404);

  const { results: bookings } = await c.env.DB.prepare(`
    SELECT b.id, b.booking_ref, b.check_in_date, b.check_out_date, b.status, r.name as room_name
    FROM bookings b JOIN rooms r ON b.room_id = r.id
    WHERE b.guest_id = ? ORDER BY b.check_in_date DESC
  `).bind(parseInt(c.req.param('id') || '0')).all();

  return c.json({ guest, bookings });
});

// ── PUT /api/guests/:id [receptionist+] ──────────────────────────────────────
guests.put('/:id', authMiddleware('admin', 'receptionist'), async (c) => {
  const id = parseInt(c.req.param('id') || '0');
  const body = await c.req.json<Partial<{ name: string; email: string; phone: string; id_type: string; id_number: string; organization: string; designation: string; address: string }>>();
  const existing = await c.env.DB.prepare('SELECT * FROM guests WHERE id = ?').bind(id).first<any>();
  if (!existing) return c.json({ error: 'Guest not found' }, 404);

  await c.env.DB.prepare(
    'UPDATE guests SET name=?, email=?, phone=?, id_type=?, id_number=?, organization=?, designation=?, address=? WHERE id=?'
  ).bind(
    body.name ?? existing.name, body.email ?? existing.email, body.phone ?? existing.phone,
    body.id_type ?? existing.id_type, body.id_number ?? existing.id_number,
    body.organization ?? existing.organization, body.designation ?? existing.designation,
    body.address ?? existing.address, id
  ).run();
  return c.json({ message: 'Guest updated' });
});

export default guests;
