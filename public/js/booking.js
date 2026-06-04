/**
 * KSoM Guesthouse — Booking Form Logic
 * Multi-step booking form with availability checking
 */
import { api } from '/js/api.js';
import { initNavbar, toast, formatCurrency, nightsBetween, todayISO } from '/js/ui.js';

initNavbar();

// ── State ──────────────────────────────────────────────────────
let state = {
  rooms: [],
  selectedRoom: null,
  checkIn: '',
  checkOut: '',
  numGuests: 1,
  purpose: '',
  specialRequests: '',
  guest: {},
};

// ── DOM References ─────────────────────────────────────────────
const panels = document.querySelectorAll('.step-panel');
const stepInds = [1, 2, 3].map(n => document.getElementById(`step-ind-${n}`));
const connectors = [1, 2].map(n => document.getElementById(`conn-${n}`));

function goToStep(n) {
  panels.forEach(p => p.classList.remove('active'));
  document.getElementById(`panel-${n === 4 ? 'success' : n}`).classList.add('active');

  stepInds.forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i + 1 < n) s.classList.add('done');
    else if (i + 1 === n) s.classList.add('active');
  });
  connectors.forEach((c, i) => {
    c.classList.toggle('done', i + 1 < n);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Load Rooms ─────────────────────────────────────────────────
async function loadRooms() {
  const select = document.getElementById('room-select');
  try {
    const data = await api.getRooms();
    state.rooms = data.rooms || [];
    select.innerHTML = `<option value="">— Select a room —</option>` +
      state.rooms.map(r => `<option value="${r.id}">${r.name} (${r.type}) — ${formatCurrency(r.price_per_night)}/night</option>`).join('');

    // Pre-select from URL param
    const params = new URLSearchParams(window.location.search);
    if (params.get('room')) { select.value = params.get('room'); select.dispatchEvent(new Event('change')); }
    if (params.get('checkin'))  { document.getElementById('checkin').value = params.get('checkin'); }
    if (params.get('checkout')) { document.getElementById('checkout').value = params.get('checkout'); }
  } catch(e) {
    select.innerHTML = '<option>Failed to load rooms</option>';
  }
}

// ── Update Sidebar Summary ─────────────────────────────────────
function updateSummary() {
  const sidebar = document.getElementById('sidebar-summary');
  const room = state.rooms.find(r => r.id === parseInt(state.selectedRoom));

  if (!room || !state.checkIn || !state.checkOut) {
    sidebar.innerHTML = `<p style="color:rgba(255,255,255,0.6);font-size:0.875rem;">Select a room and dates to see your summary.</p>`;
    return;
  }

  const nights = nightsBetween(state.checkIn, state.checkOut);
  if (nights <= 0) { sidebar.innerHTML = `<p style="color:rgba(255,100,100,0.9);font-size:0.875rem;">Invalid dates selected.</p>`; return; }

  const total = nights * room.price_per_night;
  sidebar.innerHTML = `
    <div class="summary-row"><span>Room</span><span>${room.name}</span></div>
    <div class="summary-row"><span>Type</span><span style="text-transform:capitalize">${room.type}</span></div>
    <div class="summary-row"><span>Check-in</span><span>${new Date(state.checkIn).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span></div>
    <div class="summary-row"><span>Check-out</span><span>${new Date(state.checkOut).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span></div>
    <div class="summary-row"><span>Nights</span><span>${nights}</span></div>
    <div class="summary-row"><span>Rate/night</span><span>${formatCurrency(room.price_per_night)}</span></div>
    <div class="summary-row total"><span>Total</span><span>${formatCurrency(total)}</span></div>
    <p style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-top:var(--space-4)">Payment at check-out. GST extra if applicable.</p>
  `;
}

// ── Step 1 Logic ───────────────────────────────────────────────
const today = todayISO();
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
document.getElementById('checkin').min = today;
document.getElementById('checkin').value = today;
document.getElementById('checkout').min = tomorrow;
document.getElementById('checkout').value = tomorrow;

document.getElementById('room-select').addEventListener('change', e => { state.selectedRoom = e.target.value; updateSummary(); });
document.getElementById('checkin').addEventListener('change', e => {
  state.checkIn = e.target.value;
  const next = new Date(new Date(e.target.value).getTime() + 86400000).toISOString().split('T')[0];
  document.getElementById('checkout').min = next;
  if (state.checkOut <= state.checkIn) { state.checkOut = next; document.getElementById('checkout').value = next; }
  updateSummary();
});
document.getElementById('checkout').addEventListener('change', e => { state.checkOut = e.target.value; updateSummary(); });

document.getElementById('step1-next').addEventListener('click', async () => {
  state.selectedRoom = document.getElementById('room-select').value;
  state.checkIn     = document.getElementById('checkin').value;
  state.checkOut    = document.getElementById('checkout').value;
  state.numGuests   = parseInt(document.getElementById('num-guests').value);
  state.purpose     = document.getElementById('purpose').value;

  if (!state.selectedRoom) { toast('Please select a room.', 'error'); return; }
  if (!state.checkIn || !state.checkOut) { toast('Please select check-in and check-out dates.', 'error'); return; }
  if (nightsBetween(state.checkIn, state.checkOut) <= 0) { toast('Check-out must be after check-in.', 'error'); return; }

  // Check availability
  const btn = document.getElementById('step1-next');
  btn.disabled = true; btn.textContent = 'Checking availability…';
  const msgEl = document.getElementById('availability-msg');
  try {
    const data = await api.getAvailability(state.checkIn, state.checkOut, state.selectedRoom);
    const roomData = data.rooms?.find(r => r.id === parseInt(state.selectedRoom));
    const conflict = roomData?.booked_ranges?.some(b => b.status !== 'cancelled');
    if (conflict) {
      msgEl.style.display = 'block';
      msgEl.style.background = '#fff1f2'; msgEl.style.color = '#be123c';
      msgEl.innerHTML = '❌ This room is not available for the selected dates. Please choose different dates or another room.';
      btn.disabled = false; btn.textContent = 'Next: Your Details →';
      return;
    }
    msgEl.style.display = 'block';
    msgEl.style.background = '#f0fdf4'; msgEl.style.color = '#15803d';
    msgEl.innerHTML = '✅ Room is available for your selected dates!';
    setTimeout(() => goToStep(2), 600);
  } catch(e) {
    toast('Failed to check availability. Please try again.', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Next: Your Details →';
  }
});

// ── Step 2 Logic ───────────────────────────────────────────────
document.getElementById('step2-back').addEventListener('click', () => goToStep(1));
document.getElementById('step2-next').addEventListener('click', () => {
  const name = document.getElementById('guest-name').value.trim();
  if (!name) { toast('Please enter your full name.', 'error'); return; }

  state.guest = {
    name,
    email:    document.getElementById('guest-email').value.trim(),
    phone:    document.getElementById('guest-phone').value.trim(),
    organization: document.getElementById('guest-org').value.trim(),
    id_type:  document.getElementById('guest-id-type').value,
    id_number:document.getElementById('guest-id-number').value.trim(),
  };
  state.specialRequests = document.getElementById('special-requests').value.trim();

  // Populate review
  const room = state.rooms.find(r => r.id === parseInt(state.selectedRoom));
  const nights = nightsBetween(state.checkIn, state.checkOut);
  document.getElementById('booking-review').innerHTML = `
    <h4 style="margin-bottom:var(--space-4);color:var(--primary)">📋 Review your booking</h4>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-2);">
      <div><strong>Room:</strong></div><div>${room?.name}</div>
      <div><strong>Type:</strong></div><div style="text-transform:capitalize">${room?.type}</div>
      <div><strong>Check-in:</strong></div><div>${new Date(state.checkIn+'T12:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})}</div>
      <div><strong>Check-out:</strong></div><div>${new Date(state.checkOut+'T11:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})}</div>
      <div><strong>Nights:</strong></div><div>${nights}</div>
      <div><strong>Guests:</strong></div><div>${state.numGuests}</div>
      <div><strong>Total:</strong></div><div style="font-weight:700;color:var(--primary)">${formatCurrency(nights * (room?.price_per_night || 0))}</div>
      <hr style="grid-column:1/-1;border:none;border-top:1px solid var(--border);margin:var(--space-2) 0">
      <div><strong>Name:</strong></div><div>${state.guest.name}</div>
      ${state.guest.email ? `<div><strong>Email:</strong></div><div>${state.guest.email}</div>` : ''}
      ${state.guest.phone ? `<div><strong>Phone:</strong></div><div>${state.guest.phone}</div>` : ''}
      ${state.guest.organization ? `<div><strong>Organization:</strong></div><div>${state.guest.organization}</div>` : ''}
      ${state.purpose ? `<div><strong>Purpose:</strong></div><div>${state.purpose}</div>` : ''}
    </div>
  `;
  goToStep(3);
});

// ── Step 3 Logic ───────────────────────────────────────────────
document.getElementById('step3-back').addEventListener('click', () => goToStep(2));
document.getElementById('submit-booking').addEventListener('click', async () => {
  const btn = document.getElementById('submit-booking');
  btn.disabled = true; btn.textContent = 'Submitting…';

  try {
    const data = await api.createBooking({
      room_id:         parseInt(state.selectedRoom),
      check_in_date:   state.checkIn,
      check_out_date:  state.checkOut,
      num_guests:      state.numGuests,
      purpose_of_visit:state.purpose,
      special_requests:state.specialRequests,
      guest:           state.guest,
    });

    document.getElementById('success-ref').textContent = data.booking_ref;
    document.getElementById('steps-indicator').style.display = 'none';
    document.getElementById('booking-sidebar-wrap').style.display = 'none';
    goToStep(4);
  } catch(e) {
    toast(e.message || 'Failed to submit booking. Please try again.', 'error');
    btn.disabled = false; btn.textContent = '✅ Submit Booking';
  }
});

// ── Init ───────────────────────────────────────────────────────
loadRooms();
goToStep(1);
