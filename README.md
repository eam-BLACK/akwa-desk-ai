# HelpdeskOS — Internal IT Support Portal

A complete, production-grade internal IT support portal front-end.

## Pages & Features

### Employee-facing
| Page | File | Description |
|------|------|-------------|
| Login | `index.html` | Sign in with company email; demo accounts pre-filled |
| Dashboard | `dashboard.html` | Hero console, KB quick-access, ticket summary, system status |
| Knowledge Base | `kb.html` | Search, filter, sort across all KB articles |
| KB Article | `kb-article.html` | Full article view with step-by-step instructions, related articles |
| My Tickets | `tickets.html` | View, filter, sort your own tickets with pagination |
| Ticket Detail | `ticket-detail.html` | Full activity timeline, granular updates, file attach, escalate |
| New Ticket | `new-ticket.html` | Category-routed form, smart KB suggestions, drag-and-drop attachments |
| System Status | `status.html` | Live service health, 90-day uptime bars, incidents, maintenance |
| Live Chat | `chat.html` | HelpBot AI with real responses + live agent escalation |
| My Profile | `profile.html` | Account info, password change, 2FA, sessions, notifications, activity |

### Admin / IT Agent
| Page | File | Description |
|------|------|-------------|
| Admin Dashboard | `admin/index.html` | KPIs, charts, agent performance, live ticket feed |
| User Management | `admin/users.html` | Create, edit, activate/deactivate accounts; CSV export |
| All Tickets | `admin/tickets.html` | Full queue with bulk actions, quick-edit modal, assignment |

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Employee | alex.johnson@company.com | any |
| Admin | jordan.lee@company.com | any |
| IT Agent | sam.rivera@company.com | any |
| Employee 2 | dana.parker@company.com | any |

## Tech Stack
- **HTML5** (semantic, accessible)  
- **Tailwind CSS** via CDN  
- **Vanilla JS** — no frameworks, no build step  
- **localStorage** — data persists across sessions in the same browser  

## Architecture
```
it-portal/
├── index.html          ← Login
├── dashboard.html      ← Main dashboard
├── kb.html             ← Knowledge Base listing
├── kb-article.html     ← KB article detail
├── tickets.html        ← My Tickets
├── ticket-detail.html  ← Ticket detail + timeline
├── new-ticket.html     ← Submit new ticket
├── status.html         ← System status
├── chat.html           ← Live chat
├── profile.html        ← User profile & settings
├── css/
│   └── styles.css      ← Shared design system
├── js/
│   ├── app.js          ← Data store, auth, search, utilities
│   └── nav.js          ← Sidebar & topbar (injected on every page)
└── admin/
    ├── index.html      ← Admin analytics dashboard
    ├── users.html      ← User management (create accounts)
    └── tickets.html    ← Agent ticket queue with bulk actions
```

## How to Run
Simply open `index.html` in any modern browser. No server required.

## Design System
- **Fonts**: Plus Jakarta Sans (display) + DM Sans (body)
- **Colors**: Blue-600 primary, semantic green/amber/red for status
- **Shapes**: Rounded-2xl/3xl cards, soft drop shadows
- **Motion**: Spring-physics hovers, staggered load animations
