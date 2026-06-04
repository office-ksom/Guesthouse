import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { Env } from '../types';

const rooms = new Hono<{ Bindings: Env }>();

// ── GET /api/rooms ───────────────────────────────────────────────────────────
rooms.get('/', async (c) => {
  const type = c.req.query('type');
  const showAll = c.req.query('all') === 'true';
  let query = 'SELECT * FROM rooms WHERE 1=1';
  const params: string[] = [];
  if (!showAll) {
    query += ' AND is_active = 1';
  }
  if (type && ['single', 'double', 'suite'].includes(type)) {
    query += ' AND type = ?';
    params.push(type);
  }
  query += ' ORDER BY type, name';

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  // Query live status: find active bookings (status is confirmed or checked_in) covering today
  const today = new Date().toISOString().split('T')[0];
  const activeBookings = await c.env.DB
    .prepare("SELECT room_id, status FROM bookings WHERE ? >= check_in_date AND ? < check_out_date AND status IN ('confirmed', 'checked_in')")
    .bind(today, today)
    .all<{ room_id: number; status: string }>();

  const statusMap = new Map<number, string>();
  activeBookings.results.forEach(b => {
    if (b.room_id) {
      statusMap.set(b.room_id, b.status === 'checked_in' ? 'Occupied' : 'Reserved');
    }
  });

  const rooms = results.map(r => ({
    ...r,
    amenities: JSON.parse(r.amenities as string || '[]'),
    photos: JSON.parse(r.photos as string || '[]'),
    status: statusMap.get(r.id as number) || 'Vacant'
  }));

  return c.json({ rooms });
});

// ── GET /api/rooms/:id (public) ───────────────────────────────────────────────
rooms.get('/:id', async (c) => {
  const room = await c.env.DB
    .prepare('SELECT * FROM rooms WHERE id = ? AND is_active = 1')
    .bind(parseInt(c.req.param('id') || '0'))
    .first();
  if (!room) return c.json({ error: 'Room not found' }, 404);
  return c.json({ room: { ...room, amenities: JSON.parse(room.amenities as string || '[]'), photos: JSON.parse(room.photos as string || '[]') } });
});

// ── POST /api/rooms [admin] ───────────────────────────────────────────────────
rooms.post('/', authMiddleware('admin'), async (c) => {
  const body = await c.req.json<{
    name: string; type: string; capacity: number; price_per_night: number; is_ac?: number;
    description?: string; amenities?: string[]; photos?: string[];
  }>();

  if (!body.name || !body.type || !body.capacity || body.price_per_night === undefined) {
    return c.json({ error: 'name, type, capacity, and price_per_night are required' }, 400);
  }

  const result = await c.env.DB.prepare(
    'INSERT INTO rooms (name, type, capacity, price_per_night, is_ac, description, amenities, photos) VALUES (?,?,?,?,?,?,?,?)'
  ).bind(
    body.name, body.type, body.capacity, body.price_per_night, body.is_ac ?? 1,
    body.description ?? null,
    JSON.stringify(body.amenities ?? []),
    JSON.stringify(body.photos ?? [])
  ).run();

  return c.json({ id: result.meta.last_row_id, message: 'Room created' }, 201);
});

// ── PUT /api/rooms/:id [admin] ────────────────────────────────────────────────
rooms.put('/:id', authMiddleware('admin'), async (c) => {
  const id = parseInt(c.req.param('id') || '0');
  const body = await c.req.json<Partial<{
    name: string; type: string; capacity: number; price_per_night: number; is_ac: number;
    description: string; amenities: string[]; photos: string[]; is_active: number;
  }>>();

  const existing = await c.env.DB.prepare('SELECT * FROM rooms WHERE id = ?').bind(id).first<any>();
  if (!existing) return c.json({ error: 'Room not found' }, 404);

  await c.env.DB.prepare(
    'UPDATE rooms SET name=?, type=?, capacity=?, price_per_night=?, is_ac=?, description=?, amenities=?, photos=?, is_active=? WHERE id=?'
  ).bind(
    body.name ?? existing.name,
    body.type ?? existing.type,
    body.capacity ?? existing.capacity,
    body.price_per_night ?? existing.price_per_night,
    body.is_ac ?? existing.is_ac,
    body.description ?? existing.description,
    body.amenities ? JSON.stringify(body.amenities) : existing.amenities,
    body.photos ? JSON.stringify(body.photos) : existing.photos,
    body.is_active ?? existing.is_active,
    id
  ).run();

  return c.json({ message: 'Room updated' });
});

// ── DELETE /api/rooms/:id [admin] — soft delete ───────────────────────────────
rooms.delete('/:id', authMiddleware('admin'), async (c) => {
  const id = parseInt(c.req.param('id') || '0');
  await c.env.DB.prepare('UPDATE rooms SET is_active = 0 WHERE id = ?').bind(id).run();
  return c.json({ message: 'Room deactivated' });
});

export default rooms;
