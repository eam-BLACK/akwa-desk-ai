/* ═══════════════════════════════════════
   HelpdeskOS — nav.js  v3
   Horizontal top header navigation
═══════════════════════════════════════ */
(function() {
  'use strict';

  // The 4 fixed nav links shown in header
  const NAV_LINKS = [
    { id:'dashboard',  label:'Dashboard',        href:'dashboard.html',  module:'dashboard', icon:'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
    { id:'chatbot',    label:'AI Chatbot',        href:'chatbot.html',    module:'chatbot',   icon:'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
    { id:'new-ticket', label:'Submit a Ticket',   href:'new-ticket.html', module:'tickets',   icon:'M12 5v14M5 12h14' },
    { id:'tickets',    label:'My Tickets',        href:'tickets.html',    module:'tickets',   icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  ];

  function buildHeader(session, root, activePage) {
    const initials = session.name.split(' ').map(n=>n[0]).join('').slice(0,2);
    const isAdmin   = session.role === 'admin' || session.role === 'superadmin';
    const roleLabel = {superadmin:'Super Admin', admin:'Admin', agent:'Agent IT', employee:'Employé'}[session.role] || session.role;
    const roleColor = {superadmin:'#f59e0b', admin:'#7c3aed', agent:'#0ea5e9', employee:'#10b981'}[session.role] || '#64748b';

    // Build nav links — only show if user has access
    const navLinks = NAV_LINKS.map(item => {
      // Always show dashboard; for others check access
      if (item.id !== 'dashboard' && !HDOS.hasAccess(item.module || item.id)) return '';
      const isActive = activePage === item.id || (item.id === 'new-ticket' && activePage === 'new-ticket');
      return `<a href="${root}${item.href}" class="hnav-link${isActive?' active':''}" title="${item.label}">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${item.icon}"/></svg>
        <span>${item.label}</span>
        ${item.id==='tickets'?'<span class="hnav-badge" id="ticket-badge"></span>':''}
      </a>`;
    }).join('');

    // Avatar dropdown items
    const adminItems = isAdmin ? `
      <a href="${root}admin/users.html" class="pmenu-item">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
        Gestion Utilisateurs
      </a>
      <a href="${root}admin/index.html" class="pmenu-item">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
        Admin Dashboard
      </a>` : '';

    return `
      <!-- Logo -->
      <a href="${root}dashboard.html" class="hnav-logo" style="text-decoration:none;display:flex;align-items:center;gap:9px;flex-shrink:0;">
        <img src="${root}images/logo.png" alt="Logo" style="width:34px;height:34px;border-radius:10px;object-fit:contain;flex-shrink:0;" onerror="this.style.display='none'" />
        <div style="display:flex;flex-direction:column;line-height:1.1;">
          <span style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:14.5px;color:#0f172a;letter-spacing:-.01em;">HelpdeskOS</span>
          <span style="font-size:9.5px;color:#60a5fa;font-weight:600;letter-spacing:.07em;text-transform:uppercase;">IT Support</span>
        </div>
      </a>

      <!-- Divider -->
      <div style="width:1px;height:28px;background:#e8effd;margin:0 4px;flex-shrink:0;"></div>

      <!-- Nav links -->
      <nav class="hnav-links" id="hnav-links">
        ${navLinks}
      </nav>

      <!-- Spacer -->
      <div style="flex:1;"></div>

      <!-- Search -->
      <div style="position:relative;max-width:280px;flex:1;" class="hnav-search-wrap hide-sm">
        <div style="display:flex;align-items:center;gap:7px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:11px;padding:6px 12px;transition:all .15s;" onfocusin="this.style.borderColor='#60a5fa';this.style.boxShadow='0 0 0 3px rgba(96,165,250,.12)'" onfocusout="this.style.borderColor='#e2e8f0';this.style.boxShadow='none'">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input id="topbar-search" placeholder="Rechercher dans les tickets…" style="flex:1;border:none;background:transparent;font-family:'DM Sans',sans-serif;font-size:13px;color:#0f172a;outline:none;" />
          <kbd style="padding:1px 5px;background:#e8effd;color:#60a5fa;font-size:10px;border-radius:4px;border:1px solid #bfdbfe;font-family:monospace;">⌘K</kbd>
        </div>
        <div id="topbar-dropdown" class="search-dropdown" style="display:none;"></div>
      </div>

      <!-- Avatar / profile menu -->
      <div style="position:relative;flex-shrink:0;margin-left:8px;">
        <button id="avatar-btn" onclick="toggleProfileMenu()" style="display:flex;align-items:center;gap:8px;padding:5px 10px 5px 5px;border-radius:11px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;transition:all .15s;" onmouseover="this.style.background='#eff6ff';this.style.borderColor='#bfdbfe'" onmouseout="this.style.background='#fff';this.style.borderColor='#e2e8f0'">
          <div class="avatar-placeholder" style="width:30px;height:30px;font-size:11px;flex-shrink:0;">${initials}</div>
          <div style="display:flex;flex-direction:column;align-items:flex-start;" class="hide-sm">
            <span style="font-size:13px;font-weight:600;color:#0f172a;line-height:1.2;">${session.name.split(' ')[0]}</span>
            <span style="font-size:10.5px;font-weight:600;color:${roleColor};line-height:1.2;">${roleLabel}</span>
          </div>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
        </button>

        <div id="profile-menu" style="display:none;position:absolute;top:calc(100%+8px);right:0;width:210px;background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;box-shadow:0 10px 36px -6px rgba(0,0,0,.14);z-index:200;overflow:hidden;padding:6px;animation:dropdown-in .18s ease;">
          <div style="padding:10px 12px 8px;border-bottom:1px solid #f1f5f9;margin-bottom:4px;">
            <div style="font-weight:700;font-size:13px;color:#0f172a;">${session.name}</div>
            <div style="font-size:11.5px;color:${roleColor};font-weight:600;">${roleLabel}</div>
          </div>
          <a href="${root}profile.html" class="pmenu-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="11" r="4"/></svg>
            Mon Profil
          </a>
          ${adminItems}
          <hr style="border:none;border-top:1px solid #f1f5f9;margin:4px 0;">
          <button onclick="HDOS.logout()" style="width:100%;display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:9px;border:none;background:transparent;cursor:pointer;color:#dc2626;font-size:13px;font-family:'DM Sans',sans-serif;font-weight:500;transition:background .12s;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='transparent'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Déconnexion
          </button>
        </div>
      </div>

      <!-- Mobile hamburger -->
      <button id="mobile-menu-btn" onclick="toggleMobileNav()" class="show-mobile" style="display:none;width:36px;height:36px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;align-items:center;justify-content:center;margin-left:4px;flex-shrink:0;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12h18M3 6h18M3 18h18" stroke-linecap="round"/></svg>
      </button>`;
  }

  // Toggle helpers
  window.toggleProfileMenu = function() {
    const m = document.getElementById('profile-menu');
    if (!m) return;
    const open = m.style.display !== 'none';
    document.querySelectorAll('.hnav-dropdown').forEach(el => el.style.display = 'none');
    m.style.display = open ? 'none' : 'block';
  };

  window.toggleMobileNav = function() {
    const nav = document.getElementById('hnav-links');
    if (!nav) return;
    nav.classList.toggle('mobile-open');
  };

  document.addEventListener('click', e => {
    if (!e.target.closest('#avatar-btn') && !e.target.closest('#profile-menu')) {
      const m = document.getElementById('profile-menu');
      if (m) m.style.display = 'none';
    }
    if (!e.target.closest('#mobile-menu-btn') && !e.target.closest('#hnav-links')) {
      const nav = document.getElementById('hnav-links');
      if (nav) nav.classList.remove('mobile-open');
    }
  });

  function inject() {
    const body       = document.body;
    const activePage = body.getAttribute('data-page') || '';
    const root       = body.getAttribute('data-root') || './';
    if (activePage === 'login') return;

    const session = HDOS.getSession();
    if (!session) { window.location.href = root + 'index.html'; return; }

    // Remove any old sidebar
    const oldSidebar = document.getElementById('sidebar');
    if (oldSidebar) oldSidebar.remove();
    const oldOverlay = document.getElementById('sidebar-overlay');
    if (oldOverlay) oldOverlay.remove();

    // Inject into topbar
    const topbar = document.getElementById('topbar');
    if (topbar) {
      topbar.innerHTML = buildHeader(session, root, activePage);

      // Search
      HDOS.setupSearchInput('topbar-search', 'topbar-dropdown', result => {
        window.location.href = root + 'ticket-detail.html?id=' + result.id;
      });
      // ⌘K
      document.addEventListener('keydown', e => {
        if ((e.metaKey||e.ctrlKey) && e.key==='k') {
          e.preventDefault();
          const inp = document.getElementById('topbar-search');
          if (inp) inp.focus();
        }
      });
    }

    // Mobile btn visible
    const mb = document.getElementById('mobile-menu-btn');
    if (mb) mb.style.display = 'flex';

    // Ticket badge
    const badge = document.getElementById('ticket-badge');
    if (badge) {
      const open = HDOS.getTickets().filter(t => ['open','in_progress','under_review','awaiting'].includes(t.status) && (session.role==='admin'||session.role==='superadmin'||t.userId===session.id)).length;
      if (open > 0) { badge.textContent = open; badge.style.display = 'inline-flex'; } else badge.style.display = 'none';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();
