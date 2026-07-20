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

## What's still pending

### Qwen tasks (frontend, UX, polish)

| Priority | Task | Files |
|----------|------|-------|
| P1 | Remove dead code: `populateItemSelect`, `filterItems`, `selectItem`, `updateItemList` | `script.js` |
| P1 | Consolidate showBought/showNotBought/showArchived into `showFilteredItems(type)` | `script.js` |
| P1 | Replace admin.js editUser prompt with modal (like editItems.js pattern) | `admin.js`, `admin.html` |
| P1 | Add text search bar filtering items by name/category in real-time | `index2.html`, `script.js`, `styles.css` |
| P1 | Add sortable table columns (click header to sort name/price/date/category) | `script.js`, `report.js`, `admin.js`, `styles.css` |
| P1 | Add loading spinner/overlay during all API fetches | `script.js`, `admin.js`, `report.js`, `styles.css` |
| P2 | Default SVG icons in theme-toggle buttons (prevent empty flash) | `index2.html`, `login.html`, `admin.html`, `report.html` |
| P2 | Add favicon to all pages | All HTML `<head>` |
| P2 | Bulk select actions + "Select all" | `script.js`, `index2.html`, `styles.css` |
| P2 | Undo toast after archive | `script.js`, `utils.js` |
| P2 | Quick-add keyboard shortcut (Enter auto-advance, Ctrl+Enter submit) | `script.js`, `index2.html` |
| P2 | Favorite/frequent items section (top 10) | `script.js`, `index2.html`, `styles.css` |
| P2 | Item notes/description field | All layers |
| P2 | Card-based mobile layout (table wraps poorly at 480px) | `styles.css`, all HTML |
| P2 | Print stylesheet (hide nav/buttons, clean list) | `styles.css` |

### DeepSeek tasks (backend/infra, future)

| Priority | Task |
|----------|------|
| P3 | Input validation with Joi/Zod |
| P3 | Real session management (JWT or express-session) |
| P3 | CSRF protection |
| P3 | Docker + Docker Compose for one-command setup |
| P3 | Rate limiting on all mutation endpoints |
| P3 | Multiple shopping lists (database support) |
| P3 | Sharing lists with other users + permission levels |
| P3 | Export to CSV / PDF |
| P3 | Spending history charts (monthly, category breakdown) |
| P3 | Migration system (db-migrate or similar) |
