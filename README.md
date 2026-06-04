# KSoM Guesthouse Web Portal

A full-featured guesthouse management portal for the **Kerala School of Mathematics (KSoM)**, built with:

- **Frontend**: Static HTML/CSS/JS on **Cloudflare Pages**
- **Backend**: Hono.js REST API on **Cloudflare Workers**
- **Database**: **Cloudflare D1** (serverless SQLite)

## Features

### Public Site
- 🏠 Room listings with filtering by type
- 📅 Multi-step online booking form with real-time availability check
- 📆 Interactive availability calendar
- 🖼️ Photo gallery with category filters
- 📞 Contact form and guesthouse information

### Admin Portal (`/admin/`)
- 📊 Dashboard with live KPIs (occupancy, arrivals, revenue)
- 📋 Booking management (confirm, check-in, check-out, cancel)
- 🏠 Room management (add, edit, deactivate)
- 👥 Guest directory with booking history
- 🧾 Invoice generation and payment tracking
- 🔑 Staff user management with roles (Admin / Receptionist / Viewer)

---

## Setup

### Prerequisites
- Node.js v18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm install -g wrangler`)
- Cloudflare account (free tier works)

### 1. Configure Cloudflare

```bash
# Log in to Cloudflare
wrangler login

# Create the D1 database
wrangler d1 create ksom-guesthouse-db
```

Copy the `database_id` from the output and update `worker/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "ksom-guesthouse-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

Also set your account ID and a strong JWT secret in `wrangler.toml`.

### 2. Install Worker Dependencies

```bash
cd worker
npm install
```

### 3. Run Database Migrations & Seed

```bash
# Apply schema
npm run db:migrate

# Seed sample rooms and default admin
npm run db:seed
```

**Default admin credentials** (change immediately!):
- Email: `admin@ksom.res.in`
- Password: `Admin@KSoM2025`

### 4. Run Locally

```bash
# In /worker — starts the API
npm run dev

# In /public — serve static files (use any static server)
npx serve public
# or
npx wrangler pages dev public --compatibility-date=2024-11-01
```

Open `http://localhost:8788` for the API and `http://localhost:3000` (or wherever Pages dev serves) for the frontend.

### 5. Deploy to Cloudflare

```bash
# Deploy Worker
cd worker && npm run deploy

# Deploy Pages
wrangler pages deploy public --project-name=ksom-guesthouse
```

---

## CI/CD

Add these secrets to your GitHub repository (`Settings → Secrets → Actions`):

| Secret | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Your Cloudflare API token (with Workers + Pages + D1 permissions) |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |

On every push to `main`, GitHub Actions will automatically deploy the Worker and then the Pages frontend.

---

## Project Structure

```
Guesthouse/
├── public/                  # Static frontend (Cloudflare Pages)
│   ├── index.html           # Home page
│   ├── rooms.html           # Room listings
│   ├── booking.html         # Booking form
│   ├── availability.html    # Availability calendar
│   ├── gallery.html         # Photo gallery
│   ├── contact.html         # Contact page
│   ├── admin/               # Admin portal pages
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   ├── bookings.html
│   │   ├── rooms.html
│   │   ├── guests.html
│   │   ├── invoices.html
│   │   └── users.html
│   ├── css/                 # Stylesheets
│   └── js/                  # JavaScript modules
├── worker/                  # Cloudflare Worker (API)
│   ├── src/
│   │   ├── index.ts         # Hono app entry point
│   │   ├── db/              # Schema & seed SQL
│   │   ├── routes/          # API route handlers
│   │   ├── middleware/       # Auth & CORS
│   │   └── utils/           # JWT, ref generators
│   └── wrangler.toml
└── .github/workflows/       # CI/CD
```

---

## Roles

| Role | Permissions |
|---|---|
| **Admin** | Full access — manage rooms, bookings, guests, invoices, and staff users |
| **Receptionist** | Manage bookings, check-in/out, guests, and invoices |
| **Viewer** | Read-only access to all data |

---

## License

© 2025 Kerala School of Mathematics. All rights reserved.
