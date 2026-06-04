-- ============================================================
-- KSoM Guesthouse Database Schema
-- Cloudflare D1 (SQLite-compatible)
-- ============================================================

-- PRAGMA journal_mode = WAL;
-- PRAGMA foreign_keys = ON;

-- ────────────────────────────────────────────────────────────
-- ROOMS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL,
  type            TEXT    NOT NULL CHECK(type IN ('single', 'double', 'suite')),
  capacity        INTEGER NOT NULL DEFAULT 1,
  price_per_night REAL    NOT NULL,
  is_ac           INTEGER NOT NULL DEFAULT 1 CHECK(is_ac IN (0, 1)),
  description     TEXT,
  amenities       TEXT    DEFAULT '[]',   -- JSON array
  photos          TEXT    DEFAULT '[]',   -- JSON array of URLs
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      DATETIME DEFAULT (datetime('now')),
  updated_at      DATETIME DEFAULT (datetime('now'))
);

-- ────────────────────────────────────────────────────────────
-- GUESTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guests (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  id_type       TEXT CHECK(id_type IN ('aadhaar', 'passport', 'driving_license', 'other')),
  id_number     TEXT,
  organization  TEXT,
  designation   TEXT,
  address       TEXT,
  created_at    DATETIME DEFAULT (datetime('now')),
  updated_at    DATETIME DEFAULT (datetime('now'))
);

-- ────────────────────────────────────────────────────────────
-- BOOKINGS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id                INTEGER  PRIMARY KEY AUTOINCREMENT,
  booking_ref       TEXT     NOT NULL UNIQUE,
  group_ref         TEXT,
  guest_id          INTEGER  NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
  room_id           INTEGER  REFERENCES rooms(id)  ON DELETE RESTRICT,
  check_in_date     DATE     NOT NULL,
  check_out_date    DATE     NOT NULL,
  num_guests        INTEGER  NOT NULL DEFAULT 1,
  status            TEXT     NOT NULL DEFAULT 'pending'
                             CHECK(status IN ('pending','confirmed','checked_in','checked_out','cancelled')),
  purpose_of_visit  TEXT,
  special_requests  TEXT,
  total_amount      REAL     NOT NULL DEFAULT 0,
  requested_type    TEXT     CHECK(requested_type IN ('single','double','suite')),
  requested_ac      INTEGER  CHECK(requested_ac IN (0,1)),
  sponsor_email     TEXT,
  is_rent_waived    INTEGER  NOT NULL DEFAULT 1 CHECK(is_rent_waived IN (0,1)),
  created_at        DATETIME DEFAULT (datetime('now')),
  updated_at        DATETIME DEFAULT (datetime('now')),
  CHECK(check_out_date > check_in_date)
);

CREATE INDEX IF NOT EXISTS idx_bookings_room_dates   ON bookings(room_id, check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_guest        ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status       ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_checkin_date ON bookings(check_in_date);

-- ────────────────────────────────────────────────────────────
-- INVOICES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id             INTEGER  PRIMARY KEY AUTOINCREMENT,
  booking_id     INTEGER  NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  invoice_number TEXT     NOT NULL UNIQUE,
  issued_at      DATETIME DEFAULT (datetime('now')),
  amount         REAL     NOT NULL,
  payment_status TEXT     NOT NULL DEFAULT 'unpaid'
                          CHECK(payment_status IN ('unpaid','paid','partially_paid')),
  payment_mode   TEXT     CHECK(payment_mode IN ('cash','upi','bank_transfer','card','cheque')),
  notes          TEXT,
  created_at     DATETIME DEFAULT (datetime('now')),
  updated_at     DATETIME DEFAULT (datetime('now'))
);

-- ────────────────────────────────────────────────────────────
-- STAFF USERS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'viewer'
                        CHECK(role IN ('admin','receptionist','viewer')),
  is_active     INTEGER NOT NULL DEFAULT 1,
  last_login    DATETIME,
  created_at    DATETIME DEFAULT (datetime('now')),
  updated_at    DATETIME DEFAULT (datetime('now'))
);

-- ────────────────────────────────────────────────────────────
-- TRIGGERS: auto-update updated_at
-- ────────────────────────────────────────────────────────────
CREATE TRIGGER IF NOT EXISTS rooms_updated_at
  AFTER UPDATE ON rooms
  BEGIN UPDATE rooms SET updated_at = datetime('now') WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS guests_updated_at
  AFTER UPDATE ON guests
  BEGIN UPDATE guests SET updated_at = datetime('now') WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS bookings_updated_at
  AFTER UPDATE ON bookings
  BEGIN UPDATE bookings SET updated_at = datetime('now') WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS invoices_updated_at
  AFTER UPDATE ON invoices
  BEGIN UPDATE invoices SET updated_at = datetime('now') WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS staff_users_updated_at
  AFTER UPDATE ON staff_users
  BEGIN UPDATE staff_users SET updated_at = datetime('now') WHERE id = NEW.id; END;

-- ────────────────────────────────────────────────────────────
-- SITE SETTINGS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at DATETIME DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS site_settings_updated_at
  AFTER UPDATE ON site_settings
  BEGIN UPDATE site_settings SET updated_at = datetime('now') WHERE key = NEW.key; END;

