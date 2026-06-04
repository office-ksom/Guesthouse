import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { generateInvoiceNumber } from '../utils/refs';
import { Env } from '../types';

const invoices = new Hono<{ Bindings: Env }>();

// ── GET /api/invoices [receptionist+] ────────────────────────────────────────
invoices.get('/', authMiddleware('admin', 'receptionist', 'viewer'), async (c) => {
  const paymentStatus = c.req.query('payment_status');
  let query = `
    SELECT i.*, b.booking_ref, g.name as guest_name, r.name as room_name
    FROM invoices i
    JOIN bookings b ON i.booking_id = b.id
    JOIN guests g ON b.guest_id = g.id
    JOIN rooms r ON b.room_id = r.id
    WHERE 1=1
  `;
  const params: string[] = [];
  if (paymentStatus) { query += ' AND i.payment_status = ?'; params.push(paymentStatus); }
  query += ' ORDER BY i.created_at DESC';

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ invoices: results });
});

// ── GET /api/invoices/:id [receptionist+] ─────────────────────────────────────
invoices.get('/:id', authMiddleware('admin', 'receptionist', 'viewer'), async (c) => {
  const invoice = await c.env.DB.prepare(`
    SELECT i.*, b.booking_ref, b.check_in_date, b.check_out_date, b.num_guests,
           g.name as guest_name, g.email as guest_email, g.phone as guest_phone,
           g.organization, g.address,
           r.name as room_name, r.type as room_type, r.price_per_night
    FROM invoices i
    JOIN bookings b ON i.booking_id = b.id
    JOIN guests g ON b.guest_id = g.id
    JOIN rooms r ON b.room_id = r.id
    WHERE i.id = ?
  `).bind(parseInt(c.req.param('id') || '0')).first();
  if (!invoice) return c.json({ error: 'Invoice not found' }, 404);
  return c.json({ invoice });
});

// ── POST /api/invoices [receptionist+] ───────────────────────────────────────
invoices.post('/', authMiddleware('admin', 'receptionist'), async (c) => {
  const body = await c.req.json<{ booking_id: number; notes?: string }>();
  if (!body.booking_id) return c.json({ error: 'booking_id is required' }, 400);

  const booking = await c.env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(body.booking_id).first<any>();
  if (!booking) return c.json({ error: 'Booking not found' }, 404);

  // Check if invoice already exists
  const existing = await c.env.DB.prepare('SELECT id FROM invoices WHERE booking_id = ?').bind(body.booking_id).first();
  if (existing) return c.json({ error: 'Invoice already exists for this booking' }, 409);

  const result = await c.env.DB.prepare(
    'INSERT INTO invoices (booking_id, invoice_number, amount, notes) VALUES (?, ?, ?, ?)'
  ).bind('PENDING', body.booking_id, booking.total_amount, body.notes ?? null).run();

  const invoiceId = result.meta.last_row_id as number;
  const invoiceNumber = generateInvoiceNumber(invoiceId);
  await c.env.DB.prepare('UPDATE invoices SET invoice_number = ? WHERE id = ?').bind(invoiceNumber, invoiceId).run();

  return c.json({ invoice_id: invoiceId, invoice_number: invoiceNumber }, 201);
});

// ── PUT /api/invoices/:id [receptionist+] — update payment ───────────────────
invoices.put('/:id', authMiddleware('admin', 'receptionist'), async (c) => {
  const id = parseInt(c.req.param('id') || '0');
  const body = await c.req.json<{ payment_status?: string; payment_mode?: string; notes?: string }>();
  const existing = await c.env.DB.prepare('SELECT * FROM invoices WHERE id = ?').bind(id).first();
  if (!existing) return c.json({ error: 'Invoice not found' }, 404);

  await c.env.DB.prepare(
    'UPDATE invoices SET payment_status=?, payment_mode=?, notes=? WHERE id=?'
  ).bind(
    body.payment_status ?? existing.payment_status,
    body.payment_mode ?? existing.payment_mode,
    body.notes ?? existing.notes,
    id
  ).run();
  return c.json({ message: 'Invoice updated' });
});

export default invoices;
