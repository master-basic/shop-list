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
| P2 | Split app.js into routes/middleware layers | `routes/`, `middleware/` | ⬜ Pending |

### Qwen Tasks (frontend, UX, polish)

| Priority | Task | Files | Depends On |
|----------|------|-------|------------|
| P0 | Fix XSS: replace innerHTML with createElement + textContent in all table renderers | `script.js`, `admin.js`, `report.js` | Qwen ✅ | Completed |
| P0 | Add `confirm()` dialog before archive in main list | `script.js` | Qwen ✅ | Completed |
| P1 | Fix `formatCurrency` to use decimal format with AZN prefix | `utils.js` | Qwen ✅ | Completed |
| P1 | Remove duplicate `formatDate()` from `report.js` | `report.js` | Qwen ✅ | Completed |
| P1 | Fix formatCurrency locale from en-US to az-AZ | `utils.js` | Nothing |
| P1 | Remove duplicate `formatDate()` from report.js (use utils.js version) | `report.js` | Nothing |
| P1 | Remove dead code: `populateItemSelect`, `filterItems`, `selectItem`, `updateItemList` | `script.js` | Nothing |
| P1 | Consolidate showBought/showNotBought/showArchived into single `showFilteredItems(type)` | `script.js` | Nothing |
| P2 | Add default SVG icons to theme-toggle buttons (prevents empty flash) | `index2.html`, `login.html`, `admin.html`, `report.html` | Nothing |
| P2 | Add favicon to all pages | All HTML `<head>` sections | Nothing |

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
