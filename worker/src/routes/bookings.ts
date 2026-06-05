import { Hono, Context } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { generateBookingRef } from '../utils/refs';
import { sendGroupApprovalEmail } from '../utils/email';
import { Env } from '../types';

const bookings = new Hono<{ Bindings: Env }>();

// ── POST /api/bookings (authenticated: admin, receptionist, sponsor) ───────────
bookings.post('/', authMiddleware('admin', 'receptionist', 'sponsor'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{
    guest?: { name: string; email?: string; phone?: string; id_type?: string; id_number?: string; organization?: string; designation?: string };
    guests?: { name: string; email?: string; phone?: string; id_type?: string; id_number?: string; organization?: string; designation?: string }[];
    room_id?: number | null;
    requested_type?: string;
    requested_ac?: number;
    is_rent_waived?: number;
    check_in_date: string;
    check_out_date: string;
    num_guests?: number;
    purpose_of_visit?: string;
    special_requests?: string;
    sponsor_email?: string;
  }>();

  // Support both single guest and multiple guests array
  const guestsList = body.guests && Array.isArray(body.guests)
    ? body.guests
    : (body.guest ? [body.guest] : []);

  // Validate required fields
  if (guestsList.length === 0 || !body.check_in_date || !body.check_out_date) {
    return c.json({ error: 'Guest name(s), check_in_date, and check_out_date are required' }, 400);
  }

  for (const g of guestsList) {
    if (!g || !g.name) {
      return c.json({ error: 'Guest name is required for all guest entries' }, 400);
    }
  }

  // Validate dates
  const checkIn = new Date(body.check_in_date);
  const checkOut = new Date(body.check_out_date);
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut <= checkIn) {
    return c.json({ error: 'Invalid dates: check_out must be after check_in' }, 400);
  }

  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);
  let roomId: number | null = body.room_id ? parseInt(body.room_id as any) : null;
  let total = 0;
  const isRentWaived = body.is_rent_waived !== undefined ? body.is_rent_waived : 1;

  if (roomId) {
    // Check room exists
    const room = await c.env.DB.prepare('SELECT * FROM rooms WHERE id = ? AND is_active = 1').bind(roomId).first<any>();
    if (!room) return c.json({ error: 'Room not found or unavailable' }, 404);

    // Check availability
    const conflict = await c.env.DB.prepare(`
      SELECT id FROM bookings
      WHERE room_id = ? AND status NOT IN ('cancelled')
      AND check_in_date < ? AND check_out_date > ?
    `).bind(roomId, body.check_out_date, body.check_in_date).first();
    if (conflict) return c.json({ error: 'Room is not available for selected dates' }, 409);

    if (isRentWaived === 0) {
      total = nights * room.price_per_night;
    }
  }

  const sponsorEmail = body.sponsor_email || user.email || null;
  const groupRef = guestsList.length > 1 ? `GRP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}` : null;
  const createdBookings = [];

  for (const g of guestsList) {
    // Upsert guest
    const guestResult = await c.env.DB.prepare(`
      INSERT INTO guests (name, email, phone, id_type, id_number, organization, designation)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      g.name, g.email ?? null, g.phone ?? null,
      g.id_type ?? null, g.id_number ?? null, g.organization ?? null, g.designation ?? null
    ).run();
    const guestId = guestResult.meta.last_row_id;

    // Insert booking
    const bookingResult = await c.env.DB.prepare(`
      INSERT INTO bookings (
        booking_ref, group_ref, guest_id, room_id, check_in_date, check_out_date, num_guests,
        purpose_of_visit, special_requests, total_amount, requested_type, requested_ac,
        sponsor_email, is_rent_waived
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      'PENDING', groupRef, guestId, roomId, body.check_in_date, body.check_out_date,
      body.num_guests ?? 1, body.purpose_of_visit ?? null, body.special_requests ?? null,
      total, body.requested_type ?? null, body.requested_ac ?? null,
      sponsorEmail, isRentWaived
    ).run();

    const bookingId = bookingResult.meta.last_row_id as number;
    const bookingRef = generateBookingRef(bookingId);
    await c.env.DB.prepare('UPDATE bookings SET booking_ref = ? WHERE id = ?').bind(bookingRef, bookingId).run();

    createdBookings.push({ booking_ref: bookingRef, booking_id: bookingId });
  }

  return c.json({
    message: 'Booking request(s) submitted successfully',
    group_ref: groupRef,
    bookings: createdBookings,
    booking_ref: createdBookings[0]?.booking_ref, // fallback for legacy clients
    booking_id: createdBookings[0]?.booking_id,   // fallback for legacy clients
    total_amount: total * guestsList.length,
    nights
  }, 201);
});

// ── GET /api/bookings [receptionist+ & sponsor] ────────────────────────────────
bookings.get('/', authMiddleware('admin', 'receptionist', 'viewer', 'sponsor'), async (c) => {
  const user = c.get('user');
  const status = c.req.query('status');
  const date = c.req.query('date');
  const roomId = c.req.query('room_id');
  const page = parseInt(c.req.query('page') ?? '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = `
    SELECT b.*, g.name as guest_name, g.email as guest_email, g.phone as guest_phone,
           g.designation, g.organization,
           r.name as room_name, r.type as room_type
    FROM bookings b
    JOIN guests g ON b.guest_id = g.id
    LEFT JOIN rooms r ON b.room_id = r.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (user.role === 'sponsor') {
    query += ' AND b.sponsor_email = ?';
    params.push(user.email);
  }

  if (status) { query += ' AND b.status = ?'; params.push(status); }
  if (date) { query += ' AND (b.check_in_date = ? OR b.check_out_date = ?)'; params.push(date, date); }
  if (roomId) { query += ' AND b.room_id = ?'; params.push(parseInt(roomId)); }

  query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ bookings: results, page, limit });
});

// ── GET /api/bookings/:id [receptionist+ & sponsor] ────────────────────────────
bookings.get('/:id', authMiddleware('admin', 'receptionist', 'viewer', 'sponsor'), async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id') || '0');

  const booking = await c.env.DB.prepare(`
    SELECT b.*, g.name as guest_name, g.email as guest_email, g.phone as guest_phone,
           g.id_type, g.id_number, g.organization, g.designation,
           r.name as room_name, r.type as room_type, r.price_per_night
    FROM bookings b
    JOIN guests g ON b.guest_id = g.id
    LEFT JOIN rooms r ON b.room_id = r.id
    WHERE b.id = ?
  `).bind(id).first<any>();

  if (!booking) return c.json({ error: 'Booking not found' }, 404);

  if (user.role === 'sponsor' && booking.sponsor_email !== user.email) {
    return c.json({ error: 'Forbidden: Insufficient permissions' }, 403);
  }

  return c.json({ booking });
});

// ── Centralized Email Trigger Helper ───────────────────────────────────────────
async function triggerBookingEmail(c: Context<{ Bindings: Env }>, bookingId: number, oldStatus: string, newStatus: string, senderEmail?: string, senderName?: string) {
  if (oldStatus === newStatus) return;
  // We only trigger when a booking gets resolved (status changes from pending to confirmed or cancelled)
  if (oldStatus !== 'pending' || (newStatus !== 'confirmed' && newStatus !== 'cancelled')) return;

  try {
    const booking = await c.env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(bookingId).first<any>();
    if (!booking) return;

    const sponsorMail = booking.sponsor_email;

    if (newStatus === 'confirmed') {
      const guestObj = await c.env.DB.prepare('SELECT name, email, designation FROM guests WHERE id = ?').bind(booking.guest_id).first<any>();
      let rName = 'Not Allotted';
      if (booking.room_id) {
        const roomObj = await c.env.DB.prepare('SELECT name FROM rooms WHERE id = ?').bind(booking.room_id).first<any>();
        rName = roomObj?.name || 'Allotted';
      }
      const bInfo = {
        booking_ref: booking.booking_ref,
        guest_name: guestObj?.name || 'Guest',
        designation: guestObj?.designation || '',
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        room_name: rName,
        status: 'confirmed'
      };

      // Send confirmation to the sponsor
      if (sponsorMail) {
        await sendGroupApprovalEmail(c.env, sponsorMail, booking.group_ref, [bInfo], senderEmail, senderName);
      }
      // Send confirmation to the guest if guest email exists and is different from sponsor's email
      if (guestObj?.email && guestObj.email !== sponsorMail) {
        await sendGroupApprovalEmail(c.env, guestObj.email, null, [bInfo], senderEmail, senderName);
      }
    }
  } catch (err: any) {
    console.error('[Email System] Failed to send booking approval email:', err.message);
  }
}

// ── PUT /api/bookings/:id [receptionist+] ──────────────────────────────────────
bookings.put('/:id', authMiddleware('admin', 'receptionist'), async (c) => {
  const id = parseInt(c.req.param('id') || '0');
  const body = await c.req.json<{
    status?: string;
    special_requests?: string;
    room_id?: number | null;
    total_amount?: number;
    is_rent_waived?: number;
  }>();

  const validStatuses = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];
  if (body.status && !validStatuses.includes(body.status)) {
    return c.json({ error: 'Invalid status' }, 400);
  }

  const existing = await c.env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first<any>();
  if (!existing) return c.json({ error: 'Booking not found' }, 404);

  let roomId = body.room_id !== undefined ? body.room_id : existing.room_id;
  let totalAmount = body.total_amount !== undefined ? body.total_amount : existing.total_amount;
  let isRentWaived = body.is_rent_waived !== undefined ? body.is_rent_waived : existing.is_rent_waived;

  if (roomId && roomId !== existing.room_id) {
    const room = await c.env.DB.prepare('SELECT * FROM rooms WHERE id = ? AND is_active = 1').bind(roomId).first<any>();
    if (!room) return c.json({ error: 'Room not found or unavailable' }, 404);

    const conflict = await c.env.DB.prepare(`
      SELECT id FROM bookings
      WHERE room_id = ? AND id != ? AND status NOT IN ('cancelled')
      AND check_in_date < ? AND check_out_date > ?
    `).bind(roomId, id, existing.check_out_date, existing.check_in_date).first();
    if (conflict) return c.json({ error: 'Room is not available for selected dates' }, 409);

    if (isRentWaived === 0 && body.total_amount === undefined) {
      const checkIn = new Date(existing.check_in_date);
      const checkOut = new Date(existing.check_out_date);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);
      totalAmount = nights * room.price_per_night;
    }
  }

  if (isRentWaived === 1) {
    totalAmount = 0;
  }

  await c.env.DB.prepare(
    'UPDATE bookings SET status=?, special_requests=?, room_id=?, total_amount=?, is_rent_waived=? WHERE id=?'
  ).bind(
    body.status ?? existing.status,
    body.special_requests ?? existing.special_requests,
    roomId,
    totalAmount,
    isRentWaived,
    id
  ).run();

  // Trigger email notification if status updated
  if (body.status && body.status !== existing.status) {
    const adminUser = c.get('user');
    await triggerBookingEmail(c, id, existing.status, body.status, adminUser?.email, adminUser?.name);
  }

  return c.json({ message: 'Booking updated', total_amount: totalAmount });
});

// ── DELETE /api/bookings/:id [admin & sponsor] ──────────────────────────────────
bookings.delete('/:id', authMiddleware('admin', 'sponsor'), async (c) => {
  const id = parseInt(c.req.param('id') || '0');
  const user = c.get('user');

  const existing = await c.env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first<any>();
  if (!existing) return c.json({ error: 'Booking not found' }, 404);

  if (user.role === 'sponsor') {
    if (existing.sponsor_email !== user.email) {
      return c.json({ error: 'Forbidden: Insufficient permissions' }, 403);
    }
    if (existing.status !== 'pending' && existing.status !== 'confirmed') {
      return c.json({ error: 'Cannot cancel booking in current status' }, 400);
    }
  }

  await c.env.DB.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").bind(id).run();

  // Trigger email notification if cancelled
  if (existing.status !== 'cancelled') {
    await triggerBookingEmail(c, id, existing.status, 'cancelled', user?.email, user?.name);
  }

  return c.json({ message: 'Booking cancelled' });
});

export default bookings;
