/**
 * KSoM Guesthouse — Availability Calendar Logic
 */
import { api } from '/js/api.js';
import { initNavbar, formatCurrency } from '/js/ui.js';
import { initCMS } from '/js/cms.js';

initNavbar();

let currentDate = new Date();
currentDate.setDate(1);

const todayStr = new Date().toISOString().split('T')[0];

function monthStart(d)  { return new Date(d.getFullYear(), d.getMonth(), 1); }
function monthEnd(d)    { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function toISO(d)       { return d.toISOString().split('T')[0]; }
function pad2(n)        { return String(n).padStart(2,'0'); }
function dayISO(y,m,d)  { return `${y}-${pad2(m+1)}-${pad2(d)}`; }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── Mini Calendar ──────────────────────────────────────────────
function renderMiniCal() {
  const label = document.getElementById('month-label');
  const grid  = document.getElementById('mini-cal');

  label.textContent = `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const start = monthStart(currentDate);
  const end   = monthEnd(currentDate);
  const days  = [];

  // Blank cells for start offset (Sunday=0)
  for (let i = 0; i < start.getDay(); i++) days.push(null);
  for (let d = 1; d <= end.getDate(); d++) days.push(d);

  const today = new Date();
  grid.innerHTML = days.map(d => {
    if (!d) return `<div class="cal-day other-month"></div>`;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
    const isToday = date.toDateString() === today.toDateString();
    const isPast  = date < new Date(today.toDateString());
    return `<div class="cal-day ${isToday?'today':''} ${isPast?'past':''}">${d}</div>`;
  }).join('');
}

// ── Availability Grid ──────────────────────────────────────────
async function loadAvailability() {
  const grid = document.getElementById('room-avail-grid');
  const title = document.getElementById('grid-title');

  const start = monthStart(currentDate);
  const end   = monthEnd(currentDate);
  const daysInMonth = end.getDate();
  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();

  title.textContent = `Room Availability — ${MONTHS[m]} ${y}`;
  grid.innerHTML = `<div style="text-align:center;padding:3rem;"><div class="spinner" style="margin:0 auto 1rem"></div><p>Loading availability…</p></div>`;

  try {
    const data = await api.getAvailability(toISO(start), toISO(end));
    const rooms = data.rooms || [];

    if (!rooms.length) {
      grid.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--text-muted)">No rooms found.</div>`;
      return;
    }

    // Day headers (1-31)
    const dayNums = Array.from({length: daysInMonth}, (_, i) => i + 1);

    grid.innerHTML = rooms.map(room => {
      // Build a set of booked days
      const bookedDays = new Set();
      (room.booked_ranges || []).forEach(range => {
        const ci = new Date(range.from);
        const co = new Date(range.to);
        for (let d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
          if (d.getMonth() === m && d.getFullYear() === y) {
            bookedDays.add(d.getDate());
          }
        }
      });

      const today = new Date();

      const dayCells = dayNums.map(d => {
        const cellDate = new Date(y, m, d);
        const isPast   = cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const isToday  = cellDate.toDateString() === today.toDateString();
        const isBooked = bookedDays.has(d);
        const cls = isPast ? 'past-cell' : (isBooked ? 'booked' : 'available');
        return `<div class="day-cell ${cls} ${isToday?'today-cell':''}" title="${dayISO(y,m,d)}">${d}</div>`;
      }).join('');

      const availCount = dayNums.filter(d => {
        const cellDate = new Date(y, m, d);
        const isPast = cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return !isPast && !bookedDays.has(d);
      }).length;

      return `
        <div class="room-row">
          <div class="room-row-header">
            <div>
              <div class="room-row-header__name">${room.name}</div>
              <div class="room-row-header__type">${room.type} · Capacity: ${room.capacity}</div>
            </div>
            <div style="display:flex;align-items:center;gap:var(--space-4);">
              <span style="font-size:0.75rem;color:var(--success);font-weight:600">${availCount} days available</span>
              <span class="room-row-header__price">${formatCurrency(room.price_per_night)}/night</span>
              <a href="/booking.html?room=${room.id}" class="btn btn-primary btn-sm">Book</a>
            </div>
          </div>
          <div class="room-cal-row">${dayCells}</div>
        </div>
      `;
    }).join('');

  } catch(e) {
    grid.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--error)">Failed to load availability. Please try again.</div>`;
  }
}

// ── Navigation ─────────────────────────────────────────────────
document.getElementById('prev-month').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderMiniCal();
  loadAvailability();
});
document.getElementById('next-month').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderMiniCal();
  loadAvailability();
});

// ── Init ───────────────────────────────────────────────────────
renderMiniCal();
loadAvailability();
initCMS('availability', '#main-content');
