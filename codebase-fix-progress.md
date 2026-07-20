# Codebase Fix Progress

## Date: Mon Jul 20 2026

---

## Plan Overview

Fix all identified bugs, security issues (auth + cookie), and duplicate implementations in the shop-list codebase. Work is organized by file for efficiency.

---

## Fixes By File

### 1. `db.js` — Connection pool + updateUser fix

**Problem:** Pool is defined (line 59) but never used. Every function calls `createConnection()` (new single connection per query). Also `updateUser()` sets password to `null` when not provided.

**Changes:**
- Replace all `createConnection()` calls with `pool.getConnection()` (pool is already defined)
- Remove the standalone `createConnection()` function
- In `updateUser()`: only update password when provided, otherwise skip it (use conditional UPDATE)
- Add a `getFilteredItems(startDate, endDate, category, includeArchived)` function for the filter endpoint

### 2. `app.js` — Filter endpoint, partial update, auth, cookies, error handling

**Problem A:** `/api/items/filter` (lines 64-96) builds SQL but ignores it, calls `db.getItems()`.

**Changes:**
- Replace `db.getItems(includeArchived)` with `db.getFilteredItems(...)` passing query params

**Problem B:** `PUT /api/items/:id` (lines 158-180) expects full payload, breaks on partial updates from `updatePrice()`/`updateQuantity()`.

**Changes:**
- Refactor to handle partial updates: fetch current item first, merge only provided fields, then update

**Problem C:** No auth on user management endpoints (POST/PUT/DELETE `/api/users`).

**Changes:**
- Add `requireAdmin` middleware that checks `req.cookies.username` + verifies admin via `db.getUserByUsername()`
- Apply to: `POST /api/users`, `PUT /api/users/:username`, `DELETE /api/users/:username`, `GET /api/users`

**Problem D:** Cookie has no security flags.

**Changes:**
- Add `{ httpOnly: true, secure: false, sameSite: 'lax' }` to login cookie set
- Add matching flags to `clearCookie` call

**Problem E:** Missing try/catch on: `PUT /api/items/:id/bought`, `DELETE /api/items/:id`, all user routes.

**Changes:**
- Wrap in try/catch with 500 error responses

### 3. `init-db.js` — Variable ordering

**Problem:** `pool` is used on line 10 (`pool.getConnection()`) but defined on line 71. Crashes with `ReferenceError`.

**Changes:**
- Move pool definition before `initializeDatabase()` function
- Remove unused `require('mariadb')` import (pool is in db.js already)

### 4. `public/config.js` — Browser compatibility

**Problem:** Uses `module.exports` (CommonJS) which doesn't work in browser `<script>` tags.

**Changes:**
- Replace `module.exports = {...}` with `window.AppConfig = {...}`

### 5. `public/report.js` — Wrong API routes + duplicate showToast

**Problem A:** Calls `/api/item/bought` (line 266) and `/api/item/${itemId}` (line 290) instead of `/api/items/:id/bought` and `/api/items/:id`.

**Changes:**
- Fix `toggleBought()`: change route to `/api/items/${itemId}/bought` with PUT method
- Fix `deleteItem()`: change route to `/api/items/${itemId}` with DELETE method

**Problem B:** Has its own `utils` object with showToast fallback (lines 6-21).

**Changes:**
- Remove the duplicate `utils` object, rely on `utils.js` loaded before it

### 6. `public/login.js` — Duplicate showToast

**Problem:** Full `showToast()` implementation (lines 4-77) duplicated from `utils.js`. Injects `<style>` tags on every call.

**Changes:**
- Remove the entire `showToast()` function (lines 4-77)
- Keep `validateInput()`, `validateLoginForm()`, `handleLogin()`, `handleAdminLogin()`, `adminLogin()`

### 7. `public/admin.js` — Duplicate showToast + fallback utils

**Problem:** Has duplicate `showToast()` (lines 174-192) and a fallback `utils` object (lines 6-16).

**Changes:**
- Remove the duplicate `showToast()` function
- Remove the fallback `utils` object, rely on `utils.js`

### 8. `public/editItems.js` — Duplicate showToast

**Problem:** Has its own `utils` object with `showToast()` (lines 5-20).

**Changes:**
- Remove the `utils` object, rely on `utils.js` loaded via HTML

### 9. `public/index2.html` — Script load order

**Problem:** `script.js` (line 132) is loaded before `utils.js` (line 133). `script.js` calls `showToast()` from `utils.js`.

**Changes:**
- Move `utils.js` before `script.js`
- Also move `config.js` before other scripts (it provides `window.AppConfig`)
- Remove `moment.js` CDN import (deprecated, not used meaningfully)

### 10. `public/utils.js` — Fix showToast style injection

**Problem:** `showToast()` injects a `<style>` block into `<head>` on every single call. After multiple calls, duplicate style blocks accumulate.

**Changes:**
- Check if toast styles already exist before injecting (use an ID on the style element)

### 11. `public/script.js` — Implicit event.target usage

**Problem:** `showBoughtItems()` (line 430), `showNotBoughtItems()` (line 476), `showArchivedItems()` (line 526) use `event.target` without `event` being passed as a parameter.

**Changes:**
- Add `event` parameter to the inline `onclick` handlers in `index2.html`
- Or use `this` keyword instead of `event.target`

---

## Execution Order

1. `db.js` — pool refactor + getFilteredItems + updateUser fix
2. `app.js` — filter, partial update, auth middleware, cookies, error handling
3. `init-db.js` — variable ordering
4. `public/config.js` — browser compat
5. `public/utils.js` — style dedup
6. `public/login.js` — remove showToast duplicate
7. `public/admin.js` — remove showToast duplicate + fallback utils
8. `public/editItems.js` — remove utils duplicate
9. `public/report.js` — fix API routes + remove utils duplicate
10. `public/index2.html` — script order fix
11. `public/script.js` — event.target fix

---

## Status

- [x] Plan written
- [x] db.js fixes — pool refactor, getFilteredItems, getItemById, updateUser fix
- [x] app.js fixes — filter endpoint, partial update, auth middleware, cookies, error handling
- [x] init-db.js fixes — variable ordering, removed unused import
- [x] public/config.js fix — module.exports -> window.AppConfig
- [x] public/utils.js fix — toast style deduplication (ID check)
- [x] public/login.js fix — removed duplicate showToast
- [x] public/admin.js fix — removed duplicate showToast + fallback utils
- [x] public/editItems.js fix — removed utils duplicate
- [x] public/report.js fix — fixed API routes + removed utils duplicate
- [x] public/index2.html fix — script load order, removed moment.js CDN
- [x] public/script.js — event.target fix (via index2.html onclick handlers)
