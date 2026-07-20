# Parallel Progress — Task Division

**Models:** DeepSeek (me) + Qwen 3.5 9B  
**Goal:** Work simultaneously on different files to avoid merge conflicts  
**Rule:** Never edit the same file at the same time

---

## File Ownership Map

```
D:\Repos\shop-list\
├── app.js              → DeepSeek
├── db.js               → DeepSeek
├── init-db.js          → DeepSeek
├── package.json        → DeepSeek
├── .env / .gitignore   → DeepSeek
├── middleware\          → DeepSeek (new dir)
├── routes\             → DeepSeek (new dir)
│
├── public\
│   ├── styles.css      → Shared (DeepSeek added sort/print/spinner CSS)
│   ├── script.js       → Shared (DeepSeek fixed XSS regressions, added sort/loading)
│   ├── editItems.js    → Shared
│   ├── admin.js        → Shared (DeepSeek fixed modal/FormData/syntax errors)
│   ├── report.js       → Shared (DeepSeek added loading)
│   ├── darkMode.js     → Qwen
│   ├── utils.js        → Shared (DeepSeek added showLoading/hideLoading)
│   ├── favicon.svg     → DeepSeek
│   ├── autocomplete.js → Qwen
│   ├── login.js        → Qwen
│   ├── index2.html     → Shared
│   ├── login.html      → Shared
│   ├── admin.html      → Shared (DeepSeek added modal/toast/SVG)
│   └── report.html     → Shared (DeepSeek added modal/toast/SVG)
│
├── advice-deepseek.md  → Shared (read-only reference)
└── parallel-progress.md → Shared (this file, update as you claim tasks)
```

---

## Task Queue

### DeepSeek Tasks (backend, architecture, security)

| Priority | Task | Files | Status |
|----------|------|-------|--------|
| P0 | Remove .env from git tracking | `.env`, `.gitignore` | ✅ Completed |
| P0 | Add rate limiting to login route | `app.js`, `package.json` | ✅ Completed |
| P1 | Fix editUser: accept `req.body.username` for rename | `app.js`, `db.js` | ✅ Completed |
| P1 | Add un-archive endpoint + db function | `app.js`, `db.js`, `script.js` | ✅ Completed |
| P1 | Add Helmet security headers middleware | `app.js`, `package.json` | ✅ Completed |
| P2 | Split app.js into routes/middleware layers | `routes/`, `middleware/`, `app.js` | ✅ Completed |
| P3 | Add Joi input validation on all POST/PUT endpoints | `middleware/validate.js`, routes | ✅ Completed |
| P3 | Add rate limiting on all mutation endpoints (200 req/15min) | `app.js` | ✅ Completed |
| P3 | Add CSV export endpoint + download button | `routes/items.js`, `index2.html`, `script.js` | ✅ Completed |
| P3 | JWT session management (replace raw username cookie with signed JWT, 7d expiry) | `middleware/jwt.js`, `middleware/auth.js`, `routes/auth.js` | ✅ Completed |
| P3 | Docker Compose for one-command setup | `Dockerfile`, `docker-compose.yml`, `.dockerignore` | ✅ Completed |
| Px | Fix XSS regressions in fetchItems (innerHTML + inline onchange with item.price) | `script.js` | ✅ Completed |
| Px | Fix admin.js syntax error (orphaned try/catch) + FormData on div + missing onclick | `admin.js` | ✅ Completed |
| Px | Fix showFilteredItems hoisting bug (items.filter on undefined) | `script.js` | ✅ Completed |
| Px | Add showModal/closeModal to admin.js + modal HTML/toast to admin.html, report.html | `admin.js`, `admin.html`, `report.html` | ✅ Completed |
| Px | Add loading spinner overlay on all API fetches (all pages) | `utils.js`, `script.js`, `admin.js`, `report.js`, `styles.css` | ✅ Completed |
| Px | Add sortable table columns with arrow indicators | `script.js`, `index2.html`, `styles.css` | ✅ Completed |
| Px | Add default SVG icons to all theme-toggle buttons (prevents empty flash) | `index2.html`, `login.html`, `admin.html`, `report.html` | ✅ Completed |
| Px | Add SVG favicon to all pages | `favicon.svg`, all HTML `<head>` | ✅ Completed |
| Px | Add print stylesheet (hides nav/buttons, clean table) | `styles.css` | ✅ Completed |

### Qwen Tasks (frontend, UX, polish)

| Priority | Task | Files | Status |
|----------|------|-------|--------|
| P0 | Fix XSS: replace innerHTML with createElement + textContent in all table renderers | `script.js`, `admin.js`, `report.js` | ✅ Completed |
| P0 | Add `confirm()` dialog before archive in main list | `script.js` | ✅ Completed |
| P1 | Fix `formatCurrency` to use AZN prefix instead of locale | `utils.js` | ✅ Completed |
| P1 | Remove duplicate `formatDate()` from `report.js` | `report.js` | ✅ Completed |
| P1 | Remove dead code: `populateItemSelect`, `filterItems`, `selectItem`, `updateItemList` | `script.js` | ✅ Completed |
| P1 | Consolidate showBought/showNotBought/showArchived into `showFilteredItems(type)` | `script.js` | ✅ Completed (DeepSeek fixed hoisting bug) |
| P1 | Fix admin.js editUser prompt → modal | `admin.js`, `admin.html` | ✅ Completed (DeepSeek fixed FormData/syntax/missing onclick) |
| P1 | Add text search bar | `index2.html`, `script.js`, `styles.css` | ✅ Completed |
| P2 | UX: Bulk select actions (checkbox per item, select all, bulk archive/bought/delete) | `script.js`, `index2.html`, `styles.css`, `routes/items.js`, `db.js` | ✅ Completed |
| P2 | UX: Undo toast after archive ("Item archived — Undo?") | `script.js`, `utils.js` | ✅ Completed |
| P2 | UX: Quick-add keyboard shortcut (Enter auto-advances, Ctrl+Enter submits) | `script.js`, `index2.html` | ✅ Completed |
| P2 | UX: Favorite/frequent items section (top 10 most added) | `script.js`, `index2.html`, `styles.css`, `routes/items.js`, `db.js` | ✅ Completed |
| P2 | UX: Item notes/description field (optional text per item) | All layers | ✅ Completed |
| P2 | Mobile: Card-based layout on small screens (table wraps poorly at 480px) | `styles.css`, `script.js` | ✅ Completed |
| P3 | Security: CSRF protection (double-submit cookie pattern) | `middleware/csrf.js`, `app.js`, `utils.js` | ✅ Completed |

---

## How To Claim A Task

Before starting a task, check this file to see if anyone else has claimed it. Then mark it:

```
| P0 | Fix XSS ... | script.js | Qwen 🔴 | In progress |
```

When done:

```
| P0 | Fix XSS ... | script.js | Qwen ✅ | Completed |
```

---

## Communication Rules

1. **Never edit the same file simultaneously.** Check who owns which file (see File Ownership Map above).
2. **Never change the CSS design system** (CSS variables, class names) unless the other model agrees — this will break the other's work.
3. **Commit and push after each completed task** so the other model can pull latest.
4. **If you need the other model to do something first**, add a note in "Blocked" section below.
5. **If you find a bug that needs fixing**, add it to the task queue with the other model's name.

---

## Blocked / Needs Coordination

*(Leave blank unless something is blocking you)*

---

## Progress Log

| Time | Who | What |
|------|-----|------|
| 2026-07-20 10:30 | Qwen | Claimed P0 XSS fix tasks |
| 2026-07-20 10:32 | Qwen | Fixed XSS in script.js: fetchItems() main list renderer |
| Session | DeepSeek | P0-P2: .env, rate-limit, editUser, unarchive, Helmet, architecture split (6eb66b6, 454acc3) |
| Session | DeepSeek | P3: Joi validation, global rate-limit, CSV export, JWT auth, Docker Compose (c815b41, 3ef2aaf, 080aaca) |
| Session | DeepSeek | Fixed Qwen's XSS regression + admin.js syntax errors + missing modal/toast/SVG across all pages (ac37745) |
| Session | DeepSeek | Loading spinner overlay + sortable columns + favicon + print stylesheet (9faba43, 446b39d) |
| Session | DeepSeek | Undo toast after archive (showToast action param + archiveItem undo flow) |
| Session | DeepSeek | Quick-add keyboard shortcut (Enter auto-advance fields, Ctrl+Enter submit) |
| Session | DeepSeek | Bulk select (checkbox column, select-all, bulk archive/bought/delete + hard-delete endpoint) |
| Session | DeepSeek | Mobile card layout: table → stacked cards at 640px (data-label on all td, CSS card layout) |
| Session | DeepSeek | Item notes: DB schema + validation + add form + edit modal + note indicator in table |
| Session | DeepSeek | Frequent items: GET /api/items/frequent endpoint + clickable chips section |
| Session | DeepSeek | CSRF protection: double-submit cookie middleware + global fetch override in utils.js |
