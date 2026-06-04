import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors';
import authRouter from './routes/auth';
import roomsRouter from './routes/rooms';
import bookingsRouter from './routes/bookings';
import guestsRouter from './routes/guests';
import availabilityRouter from './routes/availability';
import invoicesRouter from './routes/invoices';
import usersRouter from './routes/users';
import settingsRouter from './routes/settings';
import { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

// ── Global middleware ─────────────────────────────────────────────────────────
app.use('*', corsMiddleware);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Route mounting ────────────────────────────────────────────────────────────
app.route('/api/auth', authRouter);
app.route('/api/rooms', roomsRouter);
app.route('/api/bookings', bookingsRouter);
app.route('/api/guests', guestsRouter);
app.route('/api/availability', availabilityRouter);
app.route('/api/invoices', invoicesRouter);
app.route('/api/users', usersRouter);
app.route('/api/settings', settingsRouter);

// ── Dashboard stats [receptionist+] ──────────────────────────────────────────
import { authMiddleware } from './middleware/auth';

app.get('/api/stats', authMiddleware('admin', 'receptionist', 'viewer'), async (c) => {
  const today = new Date().toISOString().split('T')[0];

  const [arrivals, departures, occupied, totalRevenue, pending] = await Promise.all([
    c.env.DB.prepare("SELECT COUNT(*) as count FROM bookings WHERE check_in_date = ? AND status = 'confirmed'").bind(today).first<{ count: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) as count FROM bookings WHERE check_out_date = ? AND status = 'checked_in'").bind(today).first<{ count: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'checked_in'").first<{ count: number }>(),
    c.env.DB.prepare("SELECT COALESCE(SUM(amount),0) as total FROM invoices WHERE payment_status = 'paid'").first<{ total: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'").first<{ count: number }>(),
  ]);

  const totalRooms = await c.env.DB.prepare('SELECT COUNT(*) as count FROM rooms WHERE is_active = 1').first<{ count: number }>();

  return c.json({
    today_arrivals: arrivals?.count ?? 0,
    today_departures: departures?.count ?? 0,
    currently_occupied: occupied?.count ?? 0,
    total_rooms: totalRooms?.count ?? 0,
    occupancy_rate: totalRooms?.count ? Math.round(((occupied?.count ?? 0) / totalRooms.count) * 100) : 0,
    total_revenue_paid: totalRevenue?.total ?? 0,
    pending_bookings: pending?.count ?? 0,
  });
});

// ── 404 fallback ─────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'API endpoint not found' }, 404));

export default app;
