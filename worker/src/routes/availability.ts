import { Hono } from 'hono';
import { Env } from '../types';

const availability = new Hono<{ Bindings: Env }>();

// ── GET /api/availability (public) ───────────────────────────────────────────
// Query params: start (YYYY-MM-DD), end (YYYY-MM-DD), room_id (optional)
availability.get('/', async (c) => {
  const start = c.req.query('start');
  const end = c.req.query('end');
  const roomId = c.req.query('room_id');

  if (!start || !end) {
    return c.json({ error: 'start and end query parameters are required' }, 400);
  }

  // All active rooms
  let roomQuery = 'SELECT id, name, type, capacity, price_per_night FROM rooms WHERE is_active = 1';
  const roomParams: (string | number)[] = [];
  if (roomId) { roomQuery += ' AND id = ?'; roomParams.push(parseInt(roomId)); }
  const { results: rooms } = await c.env.DB.prepare(roomQuery).bind(...roomParams).all();

  // Bookings overlapping the range
  let bookingQuery = `
    SELECT room_id, check_in_date, check_out_date, status
    FROM bookings
    WHERE status NOT IN ('cancelled')
    AND check_in_date < ? AND check_out_date > ?
  `;
  const bookingParams: string[] = [end, start];
  if (roomId) { bookingQuery += ' AND room_id = ?'; bookingParams.push(roomId); }

  const { results: bookings } = await c.env.DB.prepare(bookingQuery).bind(...bookingParams).all();

  // Build availability map per room
  const result = rooms.map(room => {
    const roomBookings = bookings.filter(b => b.room_id === room.id);
    const bookedRanges = roomBookings.map(b => ({
      from: b.check_in_date as string,
      to: b.check_out_date as string,
      status: b.status as string,
    }));
    return { ...room, booked_ranges: bookedRanges };
  });

  return c.json({ rooms: result, query: { start, end } });
});

export default availability;
