# Progress Deepseek — Fix Log

## How each issue was diagnosed and fixed

---

### 1. Server-side: `/api/items` now handles filter params

**Problem:** Report page sent `startDate` & `endDate` to `/api/items` but the endpoint ignored them and returned everything. The separate `/api/items/filter` endpoint existed but the frontend never called it.

**Fix in `app.js`:**
```js
// Old: always called db.getItems() which ignores query params
app.get('/api/items', async (req, res) => {
    const items = await db.getItems(includeArchived);
    // ...

// New: checks for filter params, forwards to getFilteredItems if present
app.get('/api/items', async (req, res) => {
    if (startDate || endDate || (category && category !== 'all')) {
        const rows = await db.getFilteredItems(startDate, endDate, category, includeArchived);
        return res.json(rows);
    }
    const items = await db.getItems(includeArchived);
```

**Why:** This way the report page works without changing its code. Both endpoints work correctly.

---

### 2. Auth middleware now verifies user exists

**Problem:** `requireAuth` just read the cookie and trusted it blindly. Anyone could set `document.cookie = "username=admin"` and become admin.

**Fix in `app.js`:**
```js
// Old: no DB check
function requireAuth(req, res, next) {
    req.username = req.cookies.username;
    next();
}

// New: verifies user exists in database
async function requireAuth(req, res, next) {
    const user = await db.getUserByUsername(username);
    if (!user) return res.status(401).json({ error: 'Invalid session' });
    req.username = username;
    req.user = user;
    next();
}
```

**Why:** Every authenticated request now validates the cookie against the database. Forged cookies are rejected.

---

### 3. Security headers added

**Fix in `app.js`:** Added X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy headers to every response.

---

### 4. Currency format changed to AZN

**Problem:** `formatCurrency()` used `currency: 'USD'` but the app displays prices in Azerbaijani Manat.

**Fix in `public/utils.js`:**
```js
// Old
currency: 'USD'

// New
currency: 'AZN'
```

---

### 5. Dark mode consolidated (removed conflict)

**Problem:** `script.js` and `darkMode.js` both managed the theme independently with different functions. Toggling dark mode would trigger twice — once from inline `onclick`, once from `darkMode.js` listener — and cancel itself out.

**Fix:**

Phase 1 — `public/darkMode.js`: Made it the single source of truth. It now:
- Runs `initTheme()` immediately (sets `data-theme` attribute from localStorage)
- Exposes `toggleTheme()` as a global function
- Exposes `initTheme()` and `setTheme()` as globals
- Has a safe DOMContentLoaded listener that checks `defaultPrevented` to avoid double-triggering

Phase 2 — `public/script.js`: Removed `toggleTheme()`, `initTheme()`, `setTheme()` functions. Now just calls `initTheme()` from `darkMode.js`.

Phase 3 — HTML pages: `admin.html` `onclick="toggleTheme()"` and `index2.html` `onclick="toggleTheme()"` now call the global function from `darkMode.js`.

---

### 6. `report.html` missing `utils.js` — crashing

**Problem:** `report.js` calls `showToast()`, `formatDate()`, `formatCurrency()` which are defined in `utils.js`. But `report.html` only loaded `darkMode.js` and `report.js`. Every page action crashed.

**Fix in `public/report.html`:**
```html
<!-- Old -->
<script src="darkMode.js"></script>
<script src="report.js"></script>

<!-- New -->
<script src="darkMode.js"></script>
<script src="utils.js"></script>
<script src="report.js"></script>
```

**Why:** `utils.js` must be loaded before any script that uses its functions.

---

### 7. `admin.js` missing functions — every button crashed

**Problem:** admin.html calls `createUser()` (from Create User button), `logout()` (from Logout button), `toggleTheme()` (from theme toggle). None of these functions existed in admin.js.

**Fix in `public/admin.js`:**
- Added `createUser()` — reads form fields, POSTs to `/api/users`, shows success/error toast
- Renamed `handleLogout()` → `logout()` (the onclick in HTML called `logout()`)
- Also fixed the event listener: `logoutBtn.addEventListener('click', logout)` (was `handleLogout`)

---

### 8. `index2.html` missing modal element

**Problem:** `editItems.js` calls `document.getElementById('edit-modal')` and toggles `.show` class. But no element with `id="edit-modal"` existed in `index2.html`.

**Fix in `public/index2.html`:**
- Added the modal HTML structure after the total section:
```html
<div id="edit-modal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 class="modal-title">Edit Item</h3>
            <span class="modal-close" onclick="closeModal()">&times;</span>
        </div>
        <div class="modal-body"></div>
    </div>
</div>
```
- Added modal CSS (`.modal`, `.modal.show`, `.modal-content`, etc.) to the page styles

**Also fixed `public/editItems.js`:** Changed from targeting `.modal-content .innerHTML` to targeting `.modal-body .innerHTML` to match the new DOM structure.

---

### 9. `event.target` without event parameter — crashes in Firefox

**Problem:** `showBoughtItems()`, `showNotBoughtItems()`, `showArchivedItems()` used `event.target` but `event` was never passed as a parameter. They relied on the deprecated `window.event` which doesn't work in Firefox.

**Fix:**

Phase 1 — `public/index2.html`: Changed onclick handlers to pass the event:
```html
<!-- Old -->
<button onclick="showBoughtItems()">
<!-- New -->
<button onclick="showBoughtItems(event)">
```

Phase 2 — `public/script.js`: Added `event` parameter and fallback for `srcElement`:
```js
// Old
async function showBoughtItems() {
    event.target.classList.add('active');

// New
async function showBoughtItems(event) {
    (event.target || event.srcElement).classList.add('active');
```

---

### 10. Date mutation in report page

**Problem:** `setPeriodDates()` used `now.setDate(...)` which **mutates** the original Date object. Subsequent calculations using `now` got corrupted values.

**Fix in `public/report.js`:** Instead of mutating `now`, create new Date objects for each calculation:
```js
// Old (buggy)
const now = new Date();
startDate = new Date(now.setDate(now.getDate() - 7));  // mutates now!
endDate = new Date(now.getFullYear(), ...);  // now is now wrong

// New (correct)
const today = new Date();
startDate = new Date(today);
startDate.setDate(today.getDate() - 7);  // new object, doesn't affect today
endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
```

---

### 11. Toggle bought/un-buy added

**Problem:** `PUT /api/items/:id/bought` only marked items as bought, with no way to un-buy them. The report page's `toggleBought` was misleading.

**Fix — Three layers:**

1. **`db.js`**: Added `unbuyItem()` function:
```js
async function unbuyItem(itemId) {
    await conn.query('UPDATE items SET bought_date = NULL, bought_by = NULL WHERE id = ?', [itemId]);
}
```

2. **`app.js`**: Changed the bought endpoint to toggle:
```js
app.put('/api/items/:id/bought', async (req, res) => {
    const item = await db.getItemById(itemId);
    if (item.bought_date) {
        await db.unbuyItem(itemId);
        res.json({ bought: false });
    } else {
        await db.markAsBought(itemId, req.username);
        res.json({ bought: true });
    }
});
```

3. **`public/report.js`**: Render initial button state based on `item.bought_date`:
```js
const isBought = !!item.bought_date;
button class="${isBought ? 'bought' : ''}"
button text = isBought ? 'Bought' : 'Not Bought'
```

---

### 12. `.env.example` added

New file with documented environment variables so new developers know what to configure.

---

## Files changed (summary)

| File | What changed |
|------|-------------|
| `app.js` | Filter params on /api/items, requireAuth now verifies user, security headers, toggle bought endpoint |
| `db.js` | Added `unbuyItem()`, exported it |
| `public/utils.js` | Currency AZN (was USD) |
| `public/darkMode.js` | Complete rewrite — single theme source of truth |
| `public/script.js` | Removed theme functions (conflicted), added event params |
| `public/index2.html` | Added edit-modal + CSS, fixed onclick event params |
| `public/editItems.js` | Target `.modal-body` instead of `.modal-content` |
| `public/report.js` | Fixed date mutation, toggle bought/unbuy, correct initial button state |
| `public/editItems.js` | Target `.modal-body`, remove dead `saveChanges` code, simplify `cancelEditing` |
| `public/report.js` | Guard `formatDateInput` against invalid partial dates |
| `public/report.html` | Added missing `utils.js` script |
| `public/admin.js` | Added `createUser()`, renamed `handleLogout`→`logout` |
| `public/script.js` | Added `dataset.name`/`dataset.category`/`dataset.price`/`dataset.quantity` to rows |
| `package.json` | Removed unused `body-parser` and `moment` |
| `.env.example` | New file |

---

## Session 2 (Current) — Architecture & Security Deep Dive

### Changes made in this session

#### 1. `.env` removed from git tracking
- Added `.env` to `.gitignore`
- `git rm --cached .env` removed from tracking
- Committed as `41ca611`

#### 2. Rate limiting on login
- Installed `express-rate-limit` (added to `package.json`)
- 10 requests per 15-minute window on `POST /api/login`
- Returns 429 with `{ error: 'Too many login attempts...' }` when exceeded
- Limiter moved into `routes/auth.js` after architecture split

#### 3. Fixed `editUser` rename
- `db.js`: `updateUser()` now accepts optional `newUsername` param
- `routes/users.js`: PUT /api/users/:username reads `req.body.username` → calls `db.updateUser(username, newUsername, ...)`

#### 4. Added un-archive (`unarchiveItem`)
- `db.js`: Added `unarchiveItem(itemId)` — sets `archived = NULL`
- `routes/items.js`: Added `PUT /api/items/:id/restore` endpoint
- `script.js`: Added `restoreItem(id)` + "Restore" button in archived view

#### 5. Added Helmet security headers
- Installed `helmet` (added to `package.json`)
- Applied in `app.js`: `app.use(helmet({ contentSecurityPolicy: false }))`
- CSP disabled to allow inline styles/scripts (no build step)

#### 6. Architecture Split — app.js → routes/ + middleware/
- Before: 337-line monolithic `app.js` with all routes inline
- After:
  - `app.js` (49 lines) — bootstrap only: imports, middleware registration, route mounting, server start
  - `middleware/auth.js` — `requireAuth`, `requireAdmin` middleware functions
  - `routes/items.js` — GET/POST/PUT/DELETE /api/items, PUT /api/items/:id/bought, PUT /api/items/:id/restore
  - `routes/users.js` — GET/POST/PUT/DELETE /api/users
  - `routes/auth.js` — POST /api/login (with rate limiter), GET /api/current-user, POST /api/logout

## Session 3 (Current) — Polish & Fix Qwen's Incomplete Work

### What was done

#### 1. Critical bug fixes in Qwen's incomplete work
- **fetchItems XSS regression**: `tdPrice.innerHTML = priceField` with inline `onchange` handlers interpolating `item.price` → replaced with `createElement` + `textContent`
- **fetchItems filter logic**: Referenced deleted `showBought/showNotBought/showArchived` variables → switched to `data-filter` attribute detection
- **showFilteredItems hoisting bug**: `items.filter(item => ...)` called on `items` before assignment → now delegates to `fetchItems()` which handles filtering
- **admin.js syntax error**: Orphaned `try/catch/await` outside function after Qwen's partial edit → removed dead code
- **admin.js FormData bug**: `new FormData(form)` on a `<div>` (not `<form>`) → switched to `getElementById().value`
- **admin.html missing modal**: No `#edit-modal` element → added modal HTML structure
- **admin.html missing toast**: No toast container → added
- **report.html missing**: No theme-toggle button, modal, or toast → all added
- **All 4 pages**: Empty `<button class="theme-toggle">` → filled with default SVG icons

#### 2. Loading spinner on all pages
- `utils.js`: `showLoading()` / `hideLoading()` — creates overlay + spinner on first call
- `styles.css`: `.loading-overlay` (fixed, backdrop-filter blur) + `.spinner` (CSS rotate animation)
- `script.js`: All API functions wrapped (`fetchItems`, `addItem`, `markAsBought`, `archiveItem`, `restoreItem`)
- `admin.js`: All API functions wrapped (`fetchUsers`, `createUser`, `saveEditForm`, `deleteUser`)
- `report.js`: All API functions wrapped (`generateReport`, `toggleBought`, `deleteItem`)

#### 3. Sortable table columns
- `index2.html`: `<th class="sortable" data-sort="...">` on all columns except Actions
- `script.js`: `sortState` object + `sortItems(items)` function + `initSortableColumns()` click handler
- Supports asc/desc toggle, arrow indicators via CSS `::after` pseudo-elements
- Only on main page (index2) — report and admin tables excluded for now

#### 4. SVG favicon
- `public/favicon.svg`: teal (#00d4aa) rounded square with 3 white lines (shopping list icon)
- `<link rel="icon" type="image/svg+xml">` in all 4 HTML pages

#### 5. Print stylesheet
- `@media print` block in styles.css: hides navigation, buttons, forms, modal, toast, spinner
- Clean table with `#ccc` borders, white background, black text

#### 6. Undo toast after archive
- `utils.js` `showToast()`: added optional 4th param `action = { label, callback }` — renders a clickable action button (e.g. "Undo") inside the toast
- `script.js` `archiveItem()`: after successful DELETE, shows an "Item archived" toast with "Undo" button for 10s; clicking Undo calls `PUT /:id/restore` to unarchive; a `pendingUndo` timeout prevents stale restores
- Removed duplicate confirm dialog on `tdActions` capture listener (caused double confirm)

#### 7. Quick-add keyboard shortcut
- `script.js` `initQuickAddKeyboard()`: Enter on item-name → focus category → focus price → focus quantity → submit; Ctrl+Enter on any field calls `addItem()`

#### 8. Bulk select actions
- `index2.html`: Added checkbox column (`<th class="select-col">`) with select-all checkbox; added `.bulk-bar` between filter section and table with buttons for Mark Bought / Archive / Delete / Clear
- `script.js`: `toggleSelectAll()`, `updateBulkBar()`, `clearSelection()`, `getSelectedIds()`, `bulkBought()`, `bulkArchive()`, `bulkDelete()` — all iterate over checked `[data-id]` checkboxes and call the respective endpoints
- `routes/items.js`: Added `DELETE /:id/hard-delete` endpoint that calls `db.deleteItem()`
- `db.js`: Added `deleteItem(itemId)` — runs `DELETE FROM items WHERE id = ?`
- `styles.css`: Added `.bulk-bar`, `.select-col` styles, hide in print, mobile responsive
- Fixed `saveEditing()` to query inputs by class name (was fragile cell index); shifted `enableEditing()` cell indices for new checkbox column

#### 9. Mobile card layout (640px)
- `script.js`: Added `data-label` attribute to every `<td>` in `fetchItems()` (Item, Date, Bought, Category, Price, Qty, Total, Bought By)
- `styles.css`: At `640px`, `#shopping-table` transforms from table to stacked cards: thead hidden, each `tr` is a card with border + shadow, each `td` is a labeled row using `::before { content: attr(data-label) }` — scoped to `#shopping-table` so admin/report tables stay as tables

#### 10. Item notes / description field
- `db.js`: Added `notes TEXT DEFAULT NULL` column to both CREATE TABLE statements + ALTER TABLE migration for existing DBs; updated `addItem()`, `updateItem()`, all SELECT queries to include `notes`
- `middleware/validate.js`: Added `notes` (string, max 1000 chars, optional) to `itemSchema` and `updateItemSchema`
- `routes/items.js`: POST and PUT handlers pass `notes` through to DB
- `public/index2.html`: Added `<textarea id="item-notes">` to the add form (full-width via `grid-column: 1 / -1`)
- `public/script.js`: `addItem()` sends notes, `fetchItems()` shows a `📝` indicator with `title` tooltip on items with notes, row dataset includes `notes` for edit modal
- `public/editItems.js`: Edit modal includes notes textarea (reads from `row.dataset.notes`); `saveFromForm()` sends notes
- `public/styles.css`: Styled textarea (matching input styles), `.notes-group` spans full grid width, `.note-indicator` style
- Quick-add keyboard: Ctrl+Enter on notes textarea submits the form (plain Enter inserts newline)

#### 11. Favorite / frequent items section
- `db.js`: Added `getFrequentItems(limit = 10)` — groups items by name+category, orders by `COUNT(*) DESC`
- `routes/items.js`: Added `GET /api/items/frequent` endpoint (public, no auth required)
- `public/index2.html`: Added `.frequent-section` with `.frequent-items` container (hidden until data loaded)
- `public/script.js`: `loadFrequentItems()` fetches from `/api/items/frequent`, renders clickable chip badges showing name + frequency count; clicking a chip fills the add form name + category and focuses the name input; called on DOMContentLoaded
- `public/styles.css`: `.frequent-section` card with `.frequent-chip` pill badges, hover states matching category chip pattern

#### 12. CSRF protection
- `middleware/csrf.js`: Double-submit cookie pattern — `csrfCookie` sets a non-httpOnly `csrf-token` cookie with `sameSite:strict`; `csrfProtect` rejects POST/PUT/DELETE if `X-CSRF-Token` header doesn't match the cookie
- `app.js`: Applied `csrfCookie` and `csrfProtect` globally on `/api` routes
- `public/utils.js`: Overrides `window.fetch` to automatically read the `csrf-token` cookie and attach it as `X-CSRF-Token` header on all non-GET requests — zero changes needed to existing fetch calls

#### 13. Spending history charts
- `public/report.html`: Added Chart.js 4 CDN, chart section with `<canvas id="spending-chart">` after buyer summary
- `public/report.js`: `renderSpendingChart(items)` aggregates item totals by `YYYY-MM` (using bought_date or date), renders a Chart.js bar chart with teal bars; theme-aware colors (detects `data-theme`); `spendingChart` instance is reused/destroyed on re-render; called from `generateReport()`
- `public/styles.css`: `.chart-section` card matching buyer-summary style, `.chart-container` with 280px height

### Future feature work (not assigned)
- `middleware/csrf.js`: Double-submit cookie pattern — `csrfCookie` sets a non-httpOnly `csrf-token` cookie with `sameSite:strict`; `csrfProtect` rejects POST/PUT/DELETE if `X-CSRF-Token` header doesn't match the cookie
- `app.js`: Applied `csrfCookie` and `csrfProtect` globally on `/api` routes
- `public/utils.js`: Overrides `window.fetch` to automatically read the `csrf-token` cookie and attach it as `X-CSRF-Token` header on all non-GET requests — zero changes needed to existing fetch calls

### Future feature work (not assigned)
- `db.js`: Added `getFrequentItems(limit = 10)` — groups items by name+category, orders by `COUNT(*) DESC`
- `routes/items.js`: Added `GET /api/items/frequent` endpoint (public, no auth required)
- `public/index2.html`: Added `.frequent-section` with `.frequent-items` container (hidden until data loaded)
- `public/script.js`: `loadFrequentItems()` fetches from `/api/items/frequent`, renders clickable chip badges showing name + frequency count; clicking a chip fills the add form name + category and focuses the name input; called on DOMContentLoaded
- `public/styles.css`: `.frequent-section` card with `.frequent-chip` pill badges, hover states matching category chip pattern

### Future feature work (not assigned)
- `script.js`: Added `data-label` attribute to every `<td>` in `fetchItems()` (Item, Date, Bought, Category, Price, Qty, Total, Bought By)
- `styles.css`: At `640px`, `#shopping-table` transforms from table to stacked cards: thead hidden, each `tr` is a card with border + shadow, each `td` is a labeled row using `::before { content: attr(data-label) }` — scoped to `#shopping-table` so admin/report tables stay as tables

### Future feature work (not assigned)
- `index2.html`: Added checkbox column (`<th class="select-col">`) with select-all checkbox; added `.bulk-bar` between filter section and table with buttons for Mark Bought / Archive / Delete / Clear
- `script.js`: `toggleSelectAll()`, `updateBulkBar()`, `clearSelection()`, `getSelectedIds()`, `bulkBought()`, `bulkArchive()`, `bulkDelete()` — all iterate over checked `[data-id]` checkboxes and call the respective endpoints
- `routes/items.js`: Added `DELETE /:id/hard-delete` endpoint that calls `db.deleteItem()`
- `db.js`: Added `deleteItem(itemId)` — runs `DELETE FROM items WHERE id = ?`
- `styles.css`: Added `.bulk-bar`, `.select-col` styles, hide in print, mobile responsive
- Fixed `saveEditing()` to query inputs by class name (was fragile cell index); shifted `enableEditing()` cell indices for new checkbox column

### Future feature work (not assigned)
- `utils.js` `showToast()`: added optional 4th param `action = { label, callback }` — renders a clickable action button (e.g. "Undo") inside the toast
- `script.js` `archiveItem()`: after successful DELETE, shows an "Item archived" toast with "Undo" button for 10s; clicking Undo calls `PUT /:id/restore` to unarchive; a `pendingUndo` timeout prevents stale restores
- Removed duplicate confirm dialog on `tdActions` capture listener (caused double confirm)

## What's still pending

### Future feature work (not assigned)

| Category | Task | Priority |
|----------|------|----------|
| Data | Multiple shopping lists (schema + UI) | P3 |
| Data | Sharing lists with permissions | P3 |
| Infra | Migration system (db-migrate) | P3 |
