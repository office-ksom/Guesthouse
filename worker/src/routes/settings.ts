import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { Env } from '../types';

import { DEFAULT_SECTIONS } from '../utils/defaults';

const settings = new Hono<{ Bindings: Env }>();

// ── GET /api/settings (public) ────────────────────────────────────────────────
settings.get('/', async (c) => {
  try {
    const { results } = await c.env.DB
      .prepare('SELECT key, value FROM site_settings')
      .all<{ key: string; value: string }>();

    // Transform list of rows into a single key-value object
    const settingsObj: Record<string, string> = { ...DEFAULT_SECTIONS };
    results.forEach(row => {
      settingsObj[row.key] = row.value;
    });

    return c.json({ settings: settingsObj });
  } catch (err: any) {
    return c.json({ error: `Failed to fetch settings: ${err.message}` }, 500);
  }
});

// ── PUT /api/settings (admin only) ────────────────────────────────────────────
settings.put('/', authMiddleware('admin'), async (c) => {
  try {
    const body = await c.req.json<Record<string, string>>();

    // Iterate through key-values and batch update/insert them
    const statements = Object.entries(body).map(([key, val]) => {
      return c.env.DB
        .prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)')
        .bind(key, typeof val === 'string' ? val : JSON.stringify(val));
    });

    if (statements.length > 0) {
      await c.env.DB.batch(statements);
    }

    return c.json({ message: 'Settings updated successfully' });
  } catch (err: any) {
    return c.json({ error: `Failed to save settings: ${err.message}` }, 500);
  }
});

export default settings;
