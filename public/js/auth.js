/**
 * Admin Auth Guard — include in every admin page
 */
import { auth, api } from '/js/api.js';

// Redirect to login if not authenticated
if (!auth.isLoggedIn()) {
  window.location.href = '/admin/login.html';
  throw new Error('Not authenticated');
}

const user = auth.getUser();

// Redirect sponsors to their dashboard if they try to access staff admin pages
if (user && user.role === 'sponsor' && !window.location.pathname.endsWith('sponsor.html')) {
  window.location.href = '/admin/sponsor.html';
  throw new Error('Sponsors are restricted to the Sponsor dashboard');
}

// ── Populate sidebar user info ────────────────────────────────
export function initAdminLayout(pageTitle = '', activePage = '') {
  // Set page title
  document.title = `${pageTitle ? pageTitle + ' — ' : ''}KSoM Guesthouse Admin`;

  const topbarTitle = document.getElementById('topbar-title');
  if (topbarTitle) topbarTitle.textContent = pageTitle || 'Dashboard';

  // Sidebar user
  const avatarEl = document.getElementById('sidebar-avatar');
  const nameEl   = document.getElementById('sidebar-user-name');
  const roleEl   = document.getElementById('sidebar-user-role');

  if (avatarEl && user) {
    avatarEl.textContent = user.name?.charAt(0).toUpperCase() || 'U';
  }
  if (nameEl && user) nameEl.textContent = user.name;
  if (roleEl && user) {
    roleEl.textContent = { admin: 'Administrator', receptionist: 'Receptionist', viewer: 'Viewer' }[user.role] || user.role;
  }

  // Highlight active sidebar item
  if (activePage) {
    document.querySelectorAll('.sidebar__item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === activePage);
    });
  }

  // Sidebar mobile toggle
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try { await api.logout(); } catch {}
    auth.clearSession();
    window.location.href = '/admin/login.html';
  });

  // Role-based visibility
  if (user.role === 'viewer') {
    document.querySelectorAll('[data-admin-only]').forEach(el => el.remove());
    document.querySelectorAll('[data-receptionist-plus]').forEach(el => {
      // viewer can see but not interact
    });
  }
  if (user.role !== 'admin') {
    document.querySelectorAll('[data-admin-only]').forEach(el => el.style.display = 'none');
  }
}

export { user, auth, api };
