/* ═══════════════════════════════════════════════════════════
   HelpdeskOS — app.js  v5
   Persistent storage: Netlify Blobs (server) + localStorage (cache)
   Architecture: write-through cache
   - All reads: localStorage (instant, synced from server on login)
   - All writes: localStorage + async server sync (fire-and-forget)
   - On login: full sync FROM server → localStorage (cross-device)
═══════════════════════════════════════════════════════════ */

window.HDOS = window.HDOS || {};

/* ─── Access modules ─────────────────────────────────────── */
HDOS.ACCESS_MODULES = [
  { id: 'dashboard',      label: 'Dashboard',              icon: '🏠' },
  { id: 'chatbot',        label: 'AI Chatbot',              icon: '🤖' },
  { id: 'tickets',        label: 'Submit & View Tickets',   icon: '🎫' },
  { id: 'delete_tickets', label: 'Delete Tickets',          icon: '🗑️' },
  { id: 'profile',        label: 'My Profile',              icon: '👤' },
  { id: 'admin_users',    label: 'User Management',         icon: '👥' },
];

HDOS.defaultAccess = function(role) {
  if (role === 'admin')   return HDOS.ACCESS_MODULES.map(m => m.id);
  if (role === 'agent')   return ['dashboard','chatbot','tickets','profile'];
  return ['dashboard','chatbot','tickets','profile'];
};

/* ─── Seed data ─────────────────────────────────────────── */
HDOS.SEED_USERS = [
  { id:'user1', name:'Alex Johnson', email:'alex.johnson@company.com', password:'Demo@2025', role:'admin', dept:'Engineering', status:'active', avatar:'AJ', created:'2024-01-15', lastLogin:null, access:['dashboard','chatbot','tickets','delete_tickets','profile','admin_users'] }
];

HDOS.SEED_TICKETS = [
  { id:1001, subject:'Exemple : Problème Outlook', category:'Email', priority:'normal', status:'open', created:new Date().toISOString(), updated:new Date().toISOString(), assignee:'Alex Johnson', userId:'user1', email:'alex.johnson@company.com', societe:'Akwa Group', contact:'0522677766', description:'Email de démonstration.', timeline:[{time:new Date().toISOString(),type:'created',actor:'Alex Johnson',note:'Ticket de démonstration.'}] }
];

/* ─── DB endpoint ───────────────────────────────────────── */
HDOS._DB = '/.netlify/functions/db';

/* Detect if running on Netlify (vs file:// or localhost) */
HDOS._isDeployed = function() {
  const h = window.location.hostname;
  return h !== 'localhost' && h !== '127.0.0.1' && window.location.protocol !== 'file:';
};

/* ─── Core storage (localStorage — always instant) ─────── */
HDOS.getData = function(key, fallback) {
  try { const v = localStorage.getItem('hdos_'+key); return v ? JSON.parse(v) : fallback; }
  catch(e) { return fallback; }
};

HDOS._setLocal = function(key, value) {
  try { localStorage.setItem('hdos_'+key, JSON.stringify(value)); } catch(e) {}
};

/* ─── Write-through: local + async server ────────────────── */
HDOS.setData = function(key, value) {
  HDOS._setLocal(key, value);            // 1. instant local write
  HDOS._syncToServer(key, value);        // 2. fire-and-forget to server
};

HDOS._syncToServer = function(key, value) {
  if (!HDOS._isDeployed()) return;       // skip on local file:// dev
  fetch(HDOS._DB, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'set', key, value })
  }).catch(() => {}); // silent fail — local is the source of truth until server responds
};

/* ─── Pull all data FROM server into localStorage ────────
   Called on login and on every page load (when deployed).
   Returns a Promise that resolves when sync is complete.     */
HDOS.syncFromServer = async function() {
  if (!HDOS._isDeployed()) return;
  const keys = ['users','tickets','sa_pwd','chatbot_config','initialized'];
  try {
    const res = await fetch(HDOS._DB, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bulk_get', keys })
    });
    if (!res.ok) return;
    const { values } = await res.json();
    if (!values) return;
    keys.forEach(k => {
      if (values[k] !== null && values[k] !== undefined) {
        HDOS._setLocal(k, values[k]);
      }
    });
  } catch(e) {
    // Network error: silent, use local cache
  }
};

/* ─── Shortcuts ─────────────────────────────────────────── */
HDOS.getUsers   = ()  => HDOS.getData('users',   HDOS.SEED_USERS);
HDOS.getTickets = ()  => HDOS.getData('tickets', HDOS.SEED_TICKETS);
HDOS.saveUsers  = (v) => HDOS.setData('users', v);
HDOS.saveTickets= (v) => HDOS.setData('tickets', v);
HDOS.getChatbotConfig = ()  => HDOS.getData('chatbot_config', {url:'',name:'AI Assistant',mode:'iframe'});
HDOS.saveChatbotConfig= (v) => HDOS.setData('chatbot_config', v);

/* ─── Init ───────────────────────────────────────────────── */
HDOS.initData = function() {
  if (!HDOS.getData('initialized')) {
    HDOS.setData('users',       HDOS.SEED_USERS);
    HDOS.setData('tickets',     HDOS.SEED_TICKETS);
    HDOS.setData('initialized', true);
  }
  // Migrate: add missing access arrays
  const users = HDOS.getData('users', []);
  let m = false;
  users.forEach(u => { if (!u.access) { u.access = HDOS.defaultAccess(u.role); m=true; } });
  if (m) HDOS.saveUsers(users);
};

/* ─── Super admin ────────────────────────────────────────── */
HDOS.getSuperAdminPassword = () => HDOS.getData('sa_pwd', 'admin');
HDOS.setSuperAdminPassword = function(p) {
  HDOS.setData('sa_pwd', p);
};

/* ─── Auth ───────────────────────────────────────────────── */
HDOS.login = async function(login, password) {
  HDOS.initData();

  // Sync from server FIRST — ensures we have latest users & password
  await HDOS.syncFromServer();

  // Super admin
  if (login.trim().toLowerCase() === 'admin') {
    if (password !== HDOS.getSuperAdminPassword()) return { ok:false, error:'Mot de passe incorrect.' };
    const sa = { id:'__sa__', name:'Super Admin', email:'', login:'admin', role:'superadmin', dept:'IT', avatar:'SA', access:HDOS.ACCESS_MODULES.map(m=>m.id) };
    sessionStorage.setItem('hdos_session', JSON.stringify(sa));
    return { ok:true, user:sa };
  }

  const users = HDOS.getUsers();
  const user  = users.find(u => u.email.toLowerCase() === login.toLowerCase().trim() || (u.login && u.login.toLowerCase() === login.toLowerCase().trim()));
  if (!user)                   return { ok:false, error:'Aucun compte trouvé.' };
  if (user.status !== 'active') return { ok:false, error:'Ce compte est désactivé.' };
  if (user.password !== password) return { ok:false, error:'Mot de passe incorrect.' };

  user.lastLogin = new Date().toISOString();
  HDOS.saveUsers(users);
  sessionStorage.setItem('hdos_session', JSON.stringify(user));
  return { ok:true, user };
};

HDOS.logout = function() {
  sessionStorage.removeItem('hdos_session');
  const root = (document.body && document.body.dataset.root) || './';
  window.location.href = root + 'index.html';
};

HDOS.getSession = () => { try { return JSON.parse(sessionStorage.getItem('hdos_session')); } catch(e) { return null; } };

HDOS.requireAuth = function() {
  HDOS.initData();
  const s = HDOS.getSession();
  if (!s) { const root = (document.body && document.body.dataset.root) || './'; window.location.href = root + 'index.html'; return null; }
  return s;
};

HDOS.requireAdmin = function() {
  const s = HDOS.requireAuth();
  if (!s) return null;
  if (s.role !== 'admin' && s.role !== 'superadmin') {
    const root = (document.body && document.body.dataset.root) || './';
    window.location.href = root + 'dashboard.html'; return null;
  }
  return s;
};

HDOS.hasAccess = (mod) => {
  const s = HDOS.getSession();
  if (!s) return false;
  if (s.role === 'superadmin' || s.role === 'admin') return true;
  return Array.isArray(s.access) && s.access.includes(mod);
};

HDOS.requireAccess = function(mod) {
  const s = HDOS.requireAuth();
  if (!s) return null;
  if (!HDOS.hasAccess(mod)) {
    const root = (document.body && document.body.dataset.root) || './';
    window.location.href = root + 'dashboard.html'; return null;
  }
  // Trigger background sync on every protected page load
  HDOS.syncFromServer();
  return s;
};

/* ─── Ticket helpers ─────────────────────────────────────── */
HDOS.getVisibleTickets = function() {
  const s = HDOS.getSession();
  const all = HDOS.getTickets();
  if (!s) return [];
  if (s.role === 'admin' || s.role === 'superadmin') return all;
  return all.filter(t => t.userId === s.id);
};

HDOS.createTicket = function(data) {
  const tickets = HDOS.getTickets();
  const s = HDOS.getSession();
  const maxId = tickets.reduce((m,t) => Math.max(m, t.id), 1000);
  const now = new Date().toISOString();
  const t = {
    id: maxId+1, subject: data.subject, category: data.category,
    priority: data.priority||'normal', status: 'open',
    description: data.description||'',
    email: data.email||'', societe: data.societe||'', contact: data.contact||'',
    created: now, updated: now,
    assignee: s ? s.name : 'Unknown',
    userId: s ? s.id : 'unknown',
    timeline: [{ time:now, type:'created', actor: s?s.name:'Unknown', note:'Ticket submitted via portal.' }]
  };
  tickets.unshift(t);
  HDOS.saveTickets(tickets);
  return t;
};

HDOS.addTimelineEntry = function(ticketId, entry) {
  const tickets = HDOS.getTickets();
  const t = tickets.find(t => t.id === ticketId);
  if (!t) return null;
  t.timeline = t.timeline || [];
  t.timeline.push({ time: new Date().toISOString(), ...entry });
  t.updated = new Date().toISOString();
  HDOS.saveTickets(tickets);
  return t;
};

/* ─── User CRUD ──────────────────────────────────────────── */
HDOS.createUser = function(data) {
  const users = HDOS.getUsers();
  if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) return { ok:false, error:'Email déjà utilisé.' };
  const avatar = data.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  const user = { id:'user_'+Date.now(), name:data.name, email:data.email, password:data.password, role:data.role||'employee', dept:data.dept||'', status:data.status||'active', avatar, created:new Date().toISOString(), lastLogin:null, access:data.access||HDOS.defaultAccess(data.role||'employee') };
  users.push(user); HDOS.saveUsers(users);
  return { ok:true, user };
};

HDOS.updateUser = function(id, data) {
  const users = HDOS.getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx < 0) return { ok:false, error:'Introuvable.' };
  users[idx] = { ...users[idx], ...data }; HDOS.saveUsers(users);
  return { ok:true, user:users[idx] };
};

HDOS.deleteUser = function(id) {
  HDOS.saveUsers(HDOS.getUsers().filter(u => u.id !== id));
  return { ok:true };
};

/* ─── Search ─────────────────────────────────────────────── */
HDOS.search = function(query) {
  if (!query || query.trim().length < 2) return { tickets:[] };
  const q = query.toLowerCase();
  const tickets = HDOS.getVisibleTickets();
  return { tickets: tickets.filter(t => t.subject.toLowerCase().includes(q) || String(t.id).includes(q) || t.category.toLowerCase().includes(q)).slice(0,6) };
};

HDOS.setupSearchInput = function(inputId, dropId, onSelect) {
  const input = document.getElementById(inputId), drop = document.getElementById(dropId);
  if (!input || !drop) return;
  let db;
  input.addEventListener('input', () => {
    clearTimeout(db); db = setTimeout(() => {
      const r = HDOS.search(input.value);
      if (!r.tickets.length || !input.value.trim()) { drop.style.display='none'; return; }
      const sc = { open:'#2563eb', in_progress:'#d97706', resolved:'#059669', closed:'#64748b', under_review:'#4f46e5' };
      drop.innerHTML = r.tickets.map(t => `<div class="search-result-item" onclick="(${onSelect||'function(){}'})(${JSON.stringify({type:'ticket',id:t.id})})"><div style="width:8px;height:8px;border-radius:50%;background:${sc[t.status]||'#94a3b8'};flex-shrink:0;"></div><div><div style="font-weight:500;color:#0f172a;">#${t.id} — ${t.subject}</div><div style="font-size:11.5px;color:#94a3b8;">${t.category} · ${HDOS.timeAgo(t.updated)}</div></div></div>`).join('');
      drop.style.display = 'block';
    }, 220);
  });
  document.addEventListener('click', e => { if (!input.contains(e.target) && !drop.contains(e.target)) drop.style.display='none'; });
};

/* ─── Formatters ─────────────────────────────────────────── */
HDOS.timeAgo = iso => { const d=Date.now()-new Date(iso).getTime(),s=Math.floor(d/1000),m=Math.floor(s/60),h=Math.floor(m/60),dy=Math.floor(h/24); if(s<60)return'just now';if(m<60)return m+'m ago';if(h<24)return h+'h ago';if(dy<7)return dy+'d ago';return new Date(iso).toLocaleDateString('fr-FR',{month:'short',day:'numeric'}); };
HDOS.formatDate     = iso => iso ? new Date(iso).toLocaleDateString('fr-FR',{year:'numeric',month:'short',day:'numeric'}) : '—';
HDOS.formatDateTime = iso => iso ? new Date(iso).toLocaleString('fr-FR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';

HDOS.statusBadge = function(s) {
  const m={open:['badge-blue','Open'],in_progress:['badge-amber','In Progress'],under_review:['badge-indigo','Under Review'],awaiting:['badge-slate','Awaiting'],resolved:['badge-green','Resolved'],closed:['badge-slate','Closed']};
  const [c,l]=m[s]||['badge-slate',s];
  return `<span class="badge ${c}">${l}</span>`;
};
HDOS.priorityBadge = p => { const m={low:'badge-green',normal:'badge-amber',high:'badge-rose',critical:'badge-purple'}; return `<span class="badge ${m[p]||'badge-slate'}">${p.charAt(0).toUpperCase()+p.slice(1)}</span>`; };

/* ─── Toast ─────────────────────────────────────────────── */
HDOS.toast = function(title, sub, type='success') {
  let c = document.getElementById('toast-container');
  if (!c) { c=document.createElement('div'); c.id='toast-container'; c.className='toast-container'; document.body.appendChild(c); }
  const icons = { success:`<svg width="14" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>`, error:`<svg width="14" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>`, info:`<svg width="14" fill="none" stroke="white" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>` };
  const t = document.createElement('div'); t.className=`toast toast-${type}`;
  t.innerHTML=`<div class="toast-icon">${icons[type]||icons.info}</div><div><div class="toast-title">${title}</div>${sub?`<div class="toast-sub">${sub}</div>`:''}</div>`;
  c.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(16px)'; t.style.transition='all .3s'; setTimeout(()=>t.remove(),300); },3500);
};

/* ─── Modals ─────────────────────────────────────────────── */
HDOS.openModal  = id => { const m=document.getElementById(id); if(m){m.classList.add('open');document.body.style.overflow='hidden';} };
HDOS.closeModal = id => { const m=document.getElementById(id); if(m){m.classList.remove('open');document.body.style.overflow='';} };

/* ─── Boot ───────────────────────────────────────────────── */
HDOS.initData();
