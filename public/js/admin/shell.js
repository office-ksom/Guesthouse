/**
 * Shared Admin Sidebar HTML generator
 * Import and call renderAdminShell() in each admin page
 */
export function renderAdminShell() {
  return `
  <aside class="sidebar" id="sidebar">
    <div class="sidebar__header">
      <div class="sidebar__logo">KG</div>
      <div>
        <div class="sidebar__title">KSoM Guesthouse</div>
        <div class="sidebar__sub">ADMIN PORTAL</div>
      </div>
    </div>

    <nav class="sidebar__nav">
      <div class="sidebar__section-label">Main</div>

      <a href="/admin/dashboard.html" class="sidebar__item" data-page="dashboard">
        <span class="sidebar__item-icon">📊</span> Dashboard
      </a>
      <a href="/admin/bookings.html" class="sidebar__item" data-page="bookings">
        <span class="sidebar__item-icon">📅</span> Bookings
      </a>
      <a href="/admin/guests.html" class="sidebar__item" data-page="guests">
        <span class="sidebar__item-icon">👥</span> Guests
      </a>
      <a href="/admin/invoices.html" class="sidebar__item" data-page="invoices">
        <span class="sidebar__item-icon">🧾</span> Invoices
      </a>

      <div class="sidebar__section-label">Management</div>

      <a href="/admin/rooms.html" class="sidebar__item" data-page="rooms">
        <span class="sidebar__item-icon">🏠</span> Rooms
      </a>
      <a href="/admin/users.html" class="sidebar__item" data-page="users" data-admin-only>
        <span class="sidebar__item-icon">🔑</span> Staff Users
      </a>

      <div class="sidebar__section-label">Site</div>

      <a href="/admin/site-settings.html" class="sidebar__item" data-page="site-settings" data-admin-only>
        <span class="sidebar__item-icon">📝</span> Site Content
      </a>
      <a href="/" class="sidebar__item" target="_blank">
        <span class="sidebar__item-icon">🌐</span> View Public Site
      </a>
    </nav>

    <div class="sidebar__footer">
      <div class="sidebar__user">
        <div class="sidebar__avatar" id="sidebar-avatar">A</div>
        <div>
          <div class="sidebar__user-name" id="sidebar-user-name">Loading…</div>
          <div class="sidebar__user-role" id="sidebar-user-role"></div>
        </div>
      </div>
      <button class="sidebar__item" id="logout-btn" style="width:100%;border-radius:var(--radius-md);">
        <span class="sidebar__item-icon">🚪</span> Sign Out
      </button>
    </div>
  </aside>
  `;
}

export function renderAdminTopbar(title, breadcrumb = '') {
  return `
  <div class="admin-topbar">
    <div class="admin-topbar__left">
      <button style="display:none;background:none;border:none;cursor:pointer;padding:8px;color:var(--text-primary)" id="sidebar-toggle">☰</button>
      <div>
        <div class="admin-topbar__title" id="topbar-title">${title}</div>
        ${breadcrumb ? `<div class="admin-topbar__breadcrumb">${breadcrumb}</div>` : ''}
      </div>
    </div>
    <div class="admin-topbar__right">
      <a href="/admin/sponsor.html" class="btn btn-primary btn-sm">+ New Booking</a>
    </div>
  </div>
  `;
}
