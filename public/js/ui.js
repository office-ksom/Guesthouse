/**
 * KSoM Guesthouse — Shared UI Utilities
 * Toast notifications, modals, reveal animations, navbar scroll effect
 */

// ── Toast Notifications ──────────────────────────────────────
let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function toast(message, type = 'success', duration = 4000) {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const container = getToastContainer();

  const el = document.createElement('div');
  el.className = `toast ${type !== 'success' ? type : ''}`;
  el.innerHTML = `
    <span class="toast__icon">${icons[type] || icons.success}</span>
    <span class="toast__message">${message}</span>
    <span class="toast__close" role="button">✕</span>
  `;

  el.querySelector('.toast__close').addEventListener('click', () => removeToast(el));
  container.appendChild(el);

  if (duration > 0) {
    setTimeout(() => removeToast(el), duration);
  }
  return el;
}

function removeToast(el) {
  el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  el.style.opacity = '0';
  el.style.transform = 'translateX(100%)';
  setTimeout(() => el.remove(), 300);
}

// ── Navbar Scroll Effect ─────────────────────────────────────
export function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const update = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });

  // Mobile toggle
  const toggle = navbar.querySelector('.navbar__toggle');
  const nav = navbar.querySelector('.navbar__nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }

  // Active link highlight
  const currentPath = window.location.pathname.replace(/\/index\.html$/, '/');
  navbar.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPath.includes(href) && href !== '/') {
      link.classList.add('active');
    }
  });
}

// ── Scroll Reveal Animation ───────────────────────────────────
export function initReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  elements.forEach(el => observer.observe(el));
}

// ── Format Helpers ────────────────────────────────────────────
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDatetime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function nightsBetween(from, to) {
  return Math.ceil((new Date(to) - new Date(from)) / 86400000);
}

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// ── Status Badge HTML ─────────────────────────────────────────
export function statusBadge(status) {
  const labels = {
    pending: 'Pending', confirmed: 'Confirmed', checked_in: 'Checked In',
    checked_out: 'Checked Out', cancelled: 'Cancelled',
    paid: 'Paid', unpaid: 'Unpaid', partially_paid: 'Partial',
    admin: 'Admin', receptionist: 'Receptionist', viewer: 'Viewer',
  };
  return `<span class="badge badge-${status}">${labels[status] || status}</span>`;
}

// ── Confirm Dialog ────────────────────────────────────────────
export function confirm(message, onConfirm, destructive = false) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:420px">
      <div class="modal__header">
        <h3 class="modal__title">${destructive ? '⚠️ ' : ''}Confirm Action</h3>
      </div>
      <div class="modal__body">
        <p style="color:var(--text-secondary)">${message}</p>
      </div>
      <div class="modal__footer">
        <button class="btn btn-ghost btn-sm" id="confirm-cancel">Cancel</button>
        <button class="btn btn-sm" id="confirm-ok" style="background:${destructive ? 'var(--error)' : 'var(--primary)'}; color:white">Confirm</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#confirm-cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#confirm-ok').addEventListener('click', () => { overlay.remove(); onConfirm(); });
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ── Access Restriction Dialog ──────────────────────────────────
export function showLoginWarning(onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:420px">
      <div class="modal__header">
        <h3 class="modal__title">🔑 Access Restriction</h3>
      </div>
      <div class="modal__body">
        <p style="color:var(--text-secondary); line-height:1.5; font-size:0.95rem;">
          Only persons having KSoM email id are permitted to log into the booking portal.
        </p>
      </div>
      <div class="modal__footer" style="display:flex; justify-content:flex-end; gap:var(--space-2);">
        <button class="btn btn-ghost btn-sm" id="warning-cancel">Cancel</button>
        <button class="btn btn-primary btn-sm" id="warning-login">Login</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#warning-cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#warning-login').addEventListener('click', () => {
    overlay.remove();
    onConfirm();
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initReveal();

  // Intercept click on "Login to Book Rooms" links/buttons
  document.addEventListener('click', e => {
    const loginBtn = e.target.closest('.login-book-btn');
    if (loginBtn) {
      e.preventDefault();
      showLoginWarning(() => {
        window.location.href = '/admin/login.html';
      });
    }
  });
});
