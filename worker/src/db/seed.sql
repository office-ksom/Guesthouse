-- ============================================================
-- KSoM Guesthouse — Seed Data
-- ============================================================

-- Default admin user
-- Password: Admin@KSoM2025  (bcrypt hash — change immediately after first login)
INSERT OR IGNORE INTO staff_users (name, email, password_hash, role)
VALUES (
  'Guesthouse Admin',
  'admin@ksom.res.in',
  '$2b$10$xQKR8xFbC3G7NqP.2KNVBexYxH3L4WmMHkJqK1kP8OgXgCMzRfmOy',
  'admin'
);

-- Sreejith Admin (G-Suite OAuth)
INSERT OR IGNORE INTO staff_users (name, email, password_hash, role)
VALUES (
  'Sreejith',
  'sreejith@ksom.res.in',
  'google-oauth',
  'admin'
);

-- Sample rooms
INSERT OR IGNORE INTO rooms (name, type, capacity, price_per_night, is_ac, description, amenities, photos) VALUES
(
  'Room 101',
  'single',
  1,
  800.00,
  1,
  'A comfortable AC single-occupancy room with garden view, ideal for solo visiting scholars and researchers.',
  '["Air Conditioning","Wi-Fi","Attached Bathroom","Study Desk","Hot Water","TV"]',
  '[]'
),
(
  'Room 102',
  'single',
  1,
  600.00,
  0,
  'Well-appointed Non-AC single room on the ground floor with easy courtyard access.',
  '["Wi-Fi","Attached Bathroom","Study Desk","Hot Water","TV"]',
  '[]'
),
(
  'Room 201',
  'double',
  2,
  1400.00,
  1,
  'Spacious AC double room suitable for couples or two colleagues attending the same programme.',
  '["Air Conditioning","Wi-Fi","Attached Bathroom","Study Desk","Hot Water","TV","Balcony"]',
  '[]'
),
(
  'Room 202',
  'double',
  2,
  1100.00,
  0,
  'Bright Non-AC double room with a serene campus view and premium bedding.',
  '["Wi-Fi","Attached Bathroom","Study Desk","Hot Water","TV","Balcony"]',
  '[]'
),
(
  'Suite 301',
  'suite',
  3,
  2500.00,
  1,
  'Our premium AC suite offering a separate living area, ideal for senior faculty and distinguished guests.',
  '["Air Conditioning","Wi-Fi","Attached Bathroom","Sitting Area","Study Desk","Hot Water","Smart TV","Mini Kitchen","Balcony","Room Service"]',
  '[]'
);

-- Default Site Settings
INSERT OR IGNORE INTO site_settings (key, value) VALUES
(
  'home_headline',
  'A Home Away from Academia'
),
(
  'home_subtitle',
  'The KSoM Guesthouse offers serene, well-appointed rooms on the Kerala School of Mathematics campus — the ideal base for visiting scholars, researchers, and faculty attending programmes at KSoM.'
),
(
  'contact_email',
  'guesthouse@ksom.res.in'
),
(
  'contact_phone',
  '+91-495-2809000'
),
(
  'contact_address',
  'Kerala School of Mathematics
Kozhikode, Kerala — 673 016
India'
),
(
  'gallery_items',
  '[{"cat":"rooms","label":"Single Room — Room 101","emoji":"🛏️","h":260,"grad":"linear-gradient(135deg,#003366,#0055a5)"},{"cat":"campus","label":"Campus Garden","emoji":"🌿","h":340,"grad":"linear-gradient(135deg,#14532d,#16a34a)"},{"cat":"rooms","label":"Double Room — Room 201","emoji":"🛏️🛏️","h":300,"grad":"linear-gradient(135deg,#004080,#0070cc)"},{"cat":"facilities","label":"Reception Area","emoji":"🏛️","h":220,"grad":"linear-gradient(135deg,#1e1b4b,#4338ca)"},{"cat":"rooms","label":"Suite 301 — Living Area","emoji":"🏨","h":280,"grad":"linear-gradient(135deg,#7c2d12,#ea580c)"},{"cat":"campus","label":"KSoM Main Building","emoji":"🏫","h":200,"grad":"linear-gradient(135deg,#1e3a5f,#003366)"},{"cat":"facilities","label":"Study Lounge","emoji":"📚","h":320,"grad":"linear-gradient(135deg,#4a044e,#a21caf)"},{"cat":"rooms","label":"Room Bathroom","emoji":"🚿","h":250,"grad":"linear-gradient(135deg,#0f172a,#1e40af)"},{"cat":"campus","label":"Evening Campus Walk","emoji":"🌅","h":260,"grad":"linear-gradient(135deg,#92400e,#f59e0b)"},{"cat":"facilities","label":"Dining Area","emoji":"🍽️","h":230,"grad":"linear-gradient(135deg,#064e3b,#10b981)"},{"cat":"rooms","label":"Suite 301 — Bedroom","emoji":"🛌","h":300,"grad":"linear-gradient(135deg,#1c1917,#78350f)"},{"cat":"campus","label":"Courtyard","emoji":"☀️","h":350,"grad":"linear-gradient(135deg,#0c4a6e,#0284c7)"}]'
);
