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
│   ├── styles.css      → Qwen (minor polish only)
│   ├── script.js       → Qwen (XSS fix, dead code removal)
│   ├── editItems.js    → Qwen
│   ├── admin.js        → Qwen
│   ├── report.js       → Qwen
│   ├── darkMode.js     → Qwen
│   ├── utils.js        → Qwen
│   ├── autocomplete.js → Qwen
│   ├── login.js        → Qwen
│   ├── index2.html     → Qwen
│   ├── login.html      → Qwen
│   ├── admin.html      → Qwen
│   └── report.html     → Qwen
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

### Qwen Tasks (frontend, UX, polish)

| Priority | Task | Files | Status |
|----------|------|-------|--------|
| P0 | Fix XSS: replace innerHTML with createElement + textContent in all table renderers | `script.js`, `admin.js`, `report.js` | ✅ Completed |
| P0 | Add `confirm()` dialog before archive in main list | `script.js` | ✅ Completed |
| P1 | Fix `formatCurrency` to use AZN prefix instead of locale | `utils.js` | ✅ Completed |
| P1 | Remove duplicate `formatDate()` from `report.js` | `report.js` | ✅ Completed |
| P1 | Remove dead code: `populateItemSelect`, `filterItems`, `selectItem`, `updateItemList` | `script.js` | Qwen ✅ | Completed |
| P1 | Consolidate showBought/showNotBought/showArchived into single `showFilteredItems(type)` | `script.js` | Qwen ✅ | Completed |
| P1 | Fix admin.js editUser prompt — replace with modal (like editItems.js pattern) | `admin.js`, `admin.html` | Qwen ✅ | Completed |
| P1 | Add text search bar that filters items by name/category in real-time | `index2.html`, `script.js`, `styles.css` | 🔴 Pending |
| P1 | Add sortable table columns (click header to sort name/price/date/category) | `script.js`, `report.js`, `admin.js`, `styles.css` | 🔴 Pending |
| P1 | Add loading spinner/overlay during all API fetches (no empty white flash) | `script.js`, `admin.js`, `report.js`, `styles.css` | 🔴 Pending |
| P2 | Add default SVG icons to theme-toggle buttons (prevents empty flash) | `index2.html`, `login.html`, `admin.html`, `report.html` | 🔴 Pending |
| P2 | Add favicon to all pages | All HTML `<head>` sections | 🔴 Pending |
| P2 | UX: Bulk select actions (checkbox per item, select all, bulk archive/bought/delete) | `script.js`, `index2.html`, `styles.css` | 🔴 Pending |
| P2 | UX: Undo toast after archive ("Item archived — Undo?") | `script.js`, `utils.js` | 🔴 Pending |
| P2 | UX: Quick-add keyboard shortcut (Enter auto-advances, Ctrl+Enter submits) | `script.js`, `index2.html` | 🔴 Pending |
| P2 | UX: Favorite/frequent items section (top 10 most added) | `script.js`, `index2.html`, `styles.css` | 🔴 Pending |
| P2 | UX: Item notes/description field (optional text per item) | All layers | 🔴 Pending |
| P2 | Mobile: Card-based layout on small screens (table wraps poorly at 480px) | `styles.css`, all HTML | 🔴 Pending |
| P2 | Print: Add print stylesheet (hide nav/buttons, clean checkbox list) | `styles.css` | 🔴 Pending |

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
| Session | DeepSeek | P0: Remove .env from git tracking ✅ |
| Session | DeepSeek | P0: Add rate limiting to login ✅ |
| Session | DeepSeek | P1: Fix editUser rename in app.js+db.js ✅ |
| Session | DeepSeek | P1: Add unarchiveItem to db.js + export ✅ |
| Session | DeepSeek | P1: un-archive route in app.js + frontend Restore button ✅ |
| Session | DeepSeek | P1: Helmet security headers middleware ✅ |
| Session | DeepSeek | P1: All four P1 tasks done — commit 6eb66b6 ✅ |
| Session | DeepSeek | P2: Split app.js into routes/ + middleware/ — app.js 337→49 lines ✅ |
