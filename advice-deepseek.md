# Advice Deepseek —  Full Handover Document for Next Model (Qwen 3.5 9B)

**Author:** DeepSeek (previous session)  
**Audience:** Qwen 3.5 9B (next model, must continue without prior context)  
**Goal:** Fix all remaining bugs, then rewrite the architecture

---

## 0. How To Start

1. The server is running at `http://localhost:3000`
2. Source code is at `D:\Repos\shop-list`
3. Database: MariaDB (credentials in `.env` file)
4. To restart the server:
   ```powershell
   cd D:\Repos\shop-list
   node app.js
   ```
5. All changes go through git: `git add`, `git commit`, `git push`
6. Never commit `.env`, `memory.md`, `.gitignore` (unless intentional)

---

## 1. Complete File Inventory

### Root files

| File | Purpose | Status |
|------|---------|--------|
| `app.js` | Express server: all routes, middleware, security headers (316 lines) | ⚠️ Works but monolithic |
| `db.js` | MariaDB pool, all queries, table creation (405 lines) | ⚠️ Fixed SELECT archived, fixed getFilteredItems SQL |
| `init-db.js` | Standalone DB initializer, creates tables + seed users | ✅ Works |
| `add-category-column.js` | One-off migration script | ✅ Used once, can delete |
| `config.js` | Root config — **never imported by anything** | 🗑️ Dead code |
| `package.json` | Dependencies: express, mariadb, bcryptjs, dotenv, cookie-parser, morgan | ✅ Clean |
| `.env` | DB credentials — **committed to git** | 🔴 CRITICAL: remove from history |
| `.env.example` | Template for .env | ✅ Added in prev session |
| `advice-deepseek.md` | This document | 📝 You are here |
| `progress-deepsek.md` | Older progress log | 🗑️ Outdated, can delete |
| `memory.md` | Session notes | 🗑️ Not source code |
| `log.txt` | Morgan access log | 🗑️ Gitignored, auto-generated |

### public/ files

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `styles.css` | Unified CSS — dark-first, all pages | ~600 | ✅ Complete |
| `index2.html` | Main shopping list page | 190 | ✅ Cleaned up |
| `login.html` | Login page | 50 | ✅ Updated |
| `admin.html` | Admin panel | 60 | ✅ Cleaned up |
| `report.html` | Report page | 87 | ✅ Updated |
| `darkMode.js` | Theme management (single source) | 58 | ✅ Final version |
| `utils.js` | Shared functions: showToast, formatDate, formatCurrency | ~50 | ✅ Works |
| `script.js` | Main page logic: fetchItems, addItem, markAsBought, filters | ~570 | ✅ Fixed |
| `editItems.js` | Modal-based item editing | 157 | ✅ Works |
| `autocomplete.js` | Autocomplete for item name input | 30 | ✅ Works |
| `admin.js` | Admin page: user CRUD | ~190 | ✅ Fixed |
| `report.js` | Report page: date filters, report generation | ~300 | ⚠️ See bugs |
| `login.js` | Login form handling | 157 | ✅ Works |
| `config.js` | `window.AppConfig` — **never read by any JS** | 3 | 🗑️ Dead code |

---

## 2. API Endpoints (app.js)

| Method | Path | Auth | Purpose | Status |
|--------|------|------|---------|--------|
| GET | `/` | None | Redirect to /login.html | ✅ |
| GET | `/api/items` | None | List items (optional ?includeArchived, ?startDate, ?endDate, ?category) | ✅ Routes to getFilteredItems when params present |
| POST | `/api/items` | requireAuth | Add item | ✅ |
| PUT | `/api/items/:id/bought` | requireAuth | Toggle bought/unbuy | ✅ |
| PUT | `/api/items/:id` | requireAuth | Partial update item | ✅ |
| DELETE | `/api/items/:id` | requireAuth | Archive item (sets archived=1) | ✅ |
| POST | `/api/login` | None | Login, sets cookie | ✅ |
| POST | `/api/logout` | None | Clears cookie | ✅ |
| GET | `/api/current-user` | None | Returns user from cookie | ✅ |
| GET | `/api/users` | requireAdmin | List all users | ✅ |
| GET | `/api/users/:username` | requireAdmin | Get single user | ✅ |
| POST | `/api/users` | requireAdmin | Create user | ✅ |
| PUT | `/api/users/:username` | requireAdmin | Update user (password, isAdmin) | 🔴 Ignores `req.body.username` — renaming impossible |
| DELETE | `/api/users/:username` | requireAdmin | Delete user | ✅ |
| GET | `/report.html` | None | Serve report page | ✅ |

---

## 3. Database Schema (MariaDB)

### items table
```sql
id            INT AUTO_INCREMENT PRIMARY KEY
name          VARCHAR(255) NOT NULL
date          DATETIME NOT NULL
bought_date   DATETIME DEFAULT NULL
category      VARCHAR(100)
price         DECIMAL(10,2) DEFAULT 0.00
quantity      INT DEFAULT 1
total         DECIMAL(10,2) GENERATED ALWAYS AS (price * quantity) STORED
created_by    VARCHAR(255)
bought_by     VARCHAR(255) DEFAULT NULL
archived      BOOLEAN DEFAULT FALSE
```

### users table
```sql
username      VARCHAR(255) PRIMARY KEY
password      VARCHAR(255) NOT NULL    -- bcrypt hashed
isAdmin       BOOLEAN DEFAULT FALSE
created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

---

## 4. CSS Design System (styles.css)

### Color scheme (dark-first: `:root` = dark, `[data-theme="light"]` overrides)

| Variable | Dark value | Light value |
|----------|-----------|-------------|
| `--bg-page` | `#07070d` | `#f0f0f5` |
| `--bg-surface` | `#0e0e16` | `#ffffff` |
| `--bg-elevated` | `#16161f` | `#f8f8fc` |
| `--bg-hover` | `#1e1e2a` | `#eeeef4` |
| `--bg-input` | `#16161f` | `#ffffff` |
| `--text-primary` | `#e8e8ef` | `#1a1a2e` |
| `--text-secondary` | `#8888a0` | `#6b6b80` |
| `--text-muted` | `#5a5a72` | `#9a9ab0` |
| `--border` | `#1e1e2a` | `#e2e2ea` |
| `--border-hover` | `#2e2e40` | `#c8c8d4` |
| `--primary` | `#00d4aa` (teal) | `#0d9488` |
| `--primary-hover` | `#00bf9a` | `#0f766e` |
| `--primary-dim` | `rgba(0,212,170,0.08)` | `rgba(13,148,136,0.08)` |
| `--primary-glow` | `rgba(0,212,170,0.2)` | `rgba(13,148,136,0.2)` |
| `--error` | `#ff4757` | `#ff4757` |
| `--warning` | `#ffa502` | `#ffa502` |
| `--info` | `#4dabf7` | `#4dabf7` |
| `--radius-sm` | `6px` | `6px` |
| `--radius-md` | `10px` | `10px` |
| `--radius-lg` | `14px` | `14px` |

### CSS class index (all pages)

**Layout:** `.container`, `.header`, `.header-left`, `.header-right`, `.header-nav`, `.report-nav`, `.admin-nav`, `.nav-link`

**Theme:** `.theme-toggle`, `.theme-toggle.fixed`

**Cards:** `.section`, `.login-container`, `.admin-header`, `.report-header`, `.create-user-section`, `.admin-create-user-section`

**Forms:** `.input-container`, `.input-group`, `.form-group`, `.form-row`, `.admin-form-row`, `.filter-row`, `.report-filter-row`, `.filter-group`, `.report-filter-group`, `.form-control`, `.edit-form`, `.form-actions`

**Inputs:** `.price-input`, `.quantity-input`, `.item-input`, `.edit-category-input`, `.edit-price-input`, `.edit-quantity-input`, `.date-input`, `.date-picker`, `.period-select`

**Buttons:** `.button`, `.button-secondary`, `.primary-btn`, `.secondary-btn`, `.generate-btn`, `.admin-primary-btn`, `.report-generate-btn`, `.admin-button`, `.back-btn`, `.logout-btn`, `.btn`, `.btn-primary`, `.btn-secondary`

**Action buttons:** `.actions`, `.action-button`, `.bought-button`, `.delete-button`, `.edit-button`, `.archive-button`, `.action-buttons`, `.action-btn`, `.edit-btn`, `.delete-btn`

**Filters:** `.filter-section`, `.category-filter`, `.category-chip`, `.category-chip.active`, `.filter-buttons`, `.filter-buttons .button.active`

**Table:** `.table-container`, `table`, `thead`, `th`, `td`, `.item-name`, `.item-name.bought`

**Totals:** `.total-section`, `.total-amount`, `.total-label`

**Modal:** `.modal`, `.modal.show`, `.modal-content`, `.modal-header`, `.modal-title`, `.modal-close`, `.modal-body`

**Toast:** `.toast-container`, `.toast`, `.toast.success`, `.toast.error`, `.toast.info`

**States:** `.empty-state`, `.empty-state-icon`, `.no-data`

**Badges:** `.badge`, `.badge-primary`, `.badge-secondary`

**Buyer summary:** `.buyer-summary`, `.buyer-items`, `.buyer-item`, `.buyer-item-name`, `.buyer-item-total`, `.buyer-item-count`

**Autocomplete:** `.autocomplete`, `#autocomplete-list`, `.autocomplete-items`

---

## 5. Complete JS Function Index

### darkMode.js (58 lines — single source of theme)
```js
function toggleTheme()          // Toggles data-theme between dark/light, saves to localStorage, updates icons
function initTheme()            // Reads localStorage, defaults to 'dark', sets data-theme
function setTheme(theme)        // Sets theme + saves to localStorage + updates icons
function updateToggleIcon()     // Replaces innerHTML of all .theme-toggle with sun/moon SVG
// initTheme() called immediately
// DOMContentLoaded: updateToggleIcon() + adds click listener to .theme-toggle
```

### utils.js (shared helpers)
```js
function showToast(msg, type)    // Creates toast notification, auto-removes after 3s
function formatDate(date)        // Date → YYYY-MM-DD string
function formatCurrency(amount)  // Number → "AZN X.XX" string (uses Intl with AZN currency)
```

### script.js (main page logic, 570 lines)
```js
fetchItems()                     // Fetches /api/items (or ?includeArchived=true), renders table + totals
updatePrice(itemId, newPrice)    // PUT price inline
updateQuantity(itemId, qty)      // PUT quantity inline
toggleCategoryFilter(category)   // Toggles category chip active class, refetches
enableEditing(row)               // 🔴 OLD inline editing — shadowed by editItems.js version
cancelEditing(itemId)            // Refreshes list
saveEditing(itemId)              // PUT name/category/price/qty
populateItemSelect(items)        // Populates dropdown (unused?)
filterItems()                    // Filters dropdown (unused?)
selectItem()                     // Selects from dropdown (unused?)
addItem()                        // POST new item, clears form, refreshes
markAsBought(itemId)             // PUT toggle bought
archiveItem(itemId)              // DELETE (archives) item
generateReport()                 // Redirects to report.html
logout()                         // POST /api/logout, redirects
showBoughtItems(event)           // Filter: shows only bought items
showNotBoughtItems(event)        // Filter: shows only unbought items
showArchivedItems(event)         // Filter: shows only archived items (uses ?includeArchived=true)
initCategoryFilter()             // Adds click listeners to category chips
updateItemList(html)             // Unused utility
// fetchItems() called immediately
// DOMContentLoaded: initCategoryFilter()
```

### editItems.js (modal editing, 157 lines)
```js
init()                           // checkAuthentication() → setupEventListeners()
checkAuthentication()            // GET /api/current-user, redirects to /login.html if fails
setupEventListeners()            // Listens for .edit-form submit
enableEditing(row)               // Opens modal with form, fills from row.dataset.*
saveFromForm()                   // PUT updated item from form data
cancelEditing(itemId)            // Closes modal + refreshes list
showModal(title, content)        // Shows #edit-modal, sets title + body HTML
closeModal()                     // Hides #edit-modal
// DOMContentLoaded: init()
```

### admin.js (admin page, ~190 lines)
```js
init()                           // checkAuthentication() → setupEventListeners() → fetchUsers()
checkAuthentication()            // Redirects to login if not authenticated
setupEventListeners()            // Adds click listener to .logout-btn
logout()                         // POST /api/logout with confirm(), redirects
fetchUsers()                     // GET /api/users, calls renderUserTable()
renderUserTable(users)           // Builds table rows with Edit/Delete buttons
editUser(username)               // Uses prompt() for new values, PUT update
deleteUser(username)             // confirm() then DELETE user
createUser()                     // Reads form inputs, POST new user, clears form
// DOMContentLoaded: init()
```

### report.js (report page, ~300 lines)
```js
init()                           // checkAuthentication() → setupEventListeners() → generateReport()
checkAuthentication()            // Redirects to login if not authenticated
setupEventListeners()            // change/input listeners on dates + period selects
setDefaultDateRange()            // Sets start = 1st of month, end = last day of month
setPeriodDates()                 // Calculates dates from period selects, calls generateReport
formatDateInput()                // Normalizes input to YYYY-MM-DD
formatDate(date)                 // Date → YYYY-MM-DD (duplicate of utils.js version)
generateReport()                 // GET /api/items?includeArchived=true&startDate=&endDate=
renderReportTable(items)         // Renders report table rows
calculateReportStats(items)      // Updates total + buyer summary
toggleBought(button)             // Toggle bought/unbuy for a specific item
deleteItem(itemId)               // confirm() then DELETE item
// DOMContentLoaded: init(), setDefaultDateRange()
```

### autocomplete.js (30 lines)
```js
autocomplete()                   // Fetches items, filters by input, shows dropdown
```

### login.js (157 lines)
```js
validateInput(input, fieldName)  // Returns trimmed value or null with toast error
validateLoginForm()              // Validates username + password
handleLogin()                    // form submit handler → POST /api/login → redirect
handleAdminLogin()               // Admin login button → POST /api/login → redirect
adminLogin()                     // Called from onclick, same as handleAdminLogin
// DOMContentLoaded: handleLogin(), handleAdminLogin()
```

---

## 6. HTML Page Structures

### index2.html (Shopping List)
```
.container
  .header
    .header-left → h1 "Shopping List", h2 #month-name
    .header-nav → nav links (Login, Report, Admin)
    .header-right → .theme-toggle button
  .section.add-item-section
    h3 "Add New Item"
    .input-container
      .input-group: label + .autocomplete + input#item-name
      .input-group: label + select#item-category
      .input-group: label + input#item-price
      .input-group: label + input#item-quantity
      .button "Add Item"
  .filter-section
    .category-filter → .category-chip elements
    .filter-buttons → Bought / Not Bought / Archived
  .table-container
    table#shopping-table: thead(9 cols) + tbody#shopping-list
  .total-section: Total Items / Total Amount / Purchased
#edit-modal.modal: .modal-content > .modal-header + .modal-body
.toast-container#toast-container
Scripts: config.js, utils.js, script.js, editItems.js, autocomplete.js, darkMode.js
```

### login.html
```
.login-container
  .login-header: h1 "Login", p "Welcome back"
  form#login-form: username + password + .primary-btn
  .admin-login-section: h3 + admin-username + admin-password + .admin-button
  .back-btn "Back to Shopping List"
.theme-toggle.fixed
Scripts: darkMode.js, utils.js, login.js
```

### admin.html
```
.container
  .admin-header: h1 "Admin Panel" + .admin-nav (Shopping List, Report, Login)
  .create-user-section: h2 + .form-row (username, password, isAdmin checkbox, .primary-btn)
  .table-container > table: thead + tbody#user-list
  .logout-btn
  .theme-toggle.fixed
Scripts: darkMode.js, utils.js, admin.js
```

### report.html
```
.container
  .report-header: h1 "Report" + .report-nav (Shopping List, Login, Admin)
  .section > .filter-row
    .filter-group: start-date label + .date-picker (select#start-period + input#start-date)
    .filter-group: end-date label + .date-picker (select#end-period + input#end-date)
    .generate-btn "Generate Report"
  .table-container > table#report-table: thead + tbody#report-list
  .total-section: .total-label + .total-amount#report-total
  .buyer-summary: h2 + .buyer-items#buyer-summary
  .back-btn "Back to Home"
Scripts: darkMode.js, utils.js, report.js
```

---

## 7. Data Flow

### Adding an item
1. User fills form, clicks "Add Item"
2. `script.js:addItem()` → POST /api/items with `{name, price, quantity, category, date, bought_date: null}`
3. `app.js:POST /api/items` (requireAuth) → `db.addItem()` → INSERT into items table
4. Returns 201 with new item → `showToast()` → `fetchItems()`

### Marking as bought
1. User clicks "Bought" button on a row
2. `script.js:markAsBought(itemId)` → GET /api/current-user → PUT /api/items/:id/bought with `{bought_by: username}`
3. `app.js:PUT /api/items/:id/bought` → `db.getItemById()` → if bought_date exists, `db.unbuyItem()` else `db.markAsBought()`
4. Returns `{bought: true/false}` → `showToast()` → `fetchItems()`

### Archiving an item
1. User clicks "Archive" button on a row
2. `script.js:archiveItem(itemId)` → DELETE /api/items/:id
3. `app.js:DELETE /api/items/:id` → `db.archiveItem()` → UPDATE items SET archived=1
4. Returns `{archived: true}` → `showToast()` → `fetchItems()`

### Filtering by "Archived"
1. User clicks "Archived" filter button
2. `script.js:showArchivedItems()` → sets .active on button → `GET /api/items?includeArchived=true`
3. Server returns ALL items (with `archived` field now)
4. JS filters client-side: `items.filter(item => item.archived)`
5. Renders table + updates totals

### Report generation
1. User sets dates or period, clicks "Generate Report"
2. `report.js:generateReport()` → `GET /api/items?includeArchived=true&startDate=...&endDate=...`
3. Server sees params → calls `db.getFilteredItems(startDate, endDate, category, includeArchived=true)`
4. Returns matching items → `renderReportTable()` + `calculateReportStats()`

### User authentication
1. User submits login form → POST /api/login with `{username, password}`
2. Server: `db.authenticateUser()` → bcrypt.compare → if match, set cookie `username=username` (httpOnly, sameSite=lax)
3. Frontend redirects based on `isAdmin` flag
4. Every authenticated route: `requireAuth` middleware reads cookie, calls `db.getUserByUsername()` to verify user exists
5. Logout: clears cookie

---

## 8. CURRENT BUGS — Ordered by Severity 🔴🟡🟢

### 🔴 CRITICAL — Fix immediately

| # | Bug | File:Line | Details | Fix | Status |
|---|-----|-----------|---------|-----|--------|
| B1 | **XSS everywhere** | All JS files | Item names inserted via `innerHTML` template strings. | Replace all `innerHTML` with `document.createElement()` + `textContent`. | ✅ Fixed — Qwen |
| B2 | **.env committed to git** | .gitignore | `.env` with DB credentials tracked in git history | `git rm --cached .env`, add to `.gitignore` | ✅ Fixed |
| B3 | **No rate limiting on login** | app.js | POST /api/login had no rate limiter. | Add `express-rate-limit` middleware | ✅ Fixed |

### 🟡 HIGH — Fix soon

| # | Bug | File:Line | Details | Fix | Status |
|---|-----|-----------|---------|-----|--------|
| B4 | **editUser cannot rename** | `routes/users.js`, `db.js` | PUT /api/users/:username ignores `req.body.username`. | Read `req.body.username` → pass to `db.updateUser()` | ✅ Fixed |
| B5 | **editUser prompts are ugly** | admin.js:108-112 | Uses `prompt()` for editing. No validation, bad UX. | Should open a modal or inline form | 🔴 Pending |
| B6 | **No un-archive** | `routes/items.js` / `script.js` | No way to restore archived items. | Add PUT /api/items/:id/restore endpoint + Restore button | ✅ Fixed |
| B7 | **No confirmation on archive in main list** | script.js | `archiveItem()` called DELETE without `confirm()`. | Add `if (!confirm('Archive this item?')) return;` | ✅ Fixed — Qwen |
| B8 | **formatCurrency uses wrong locale** | utils.js | en-US locale doesn't support AZN. | `AZN ${amount.toFixed(2)}` prefix format | ✅ Fixed |
| B9 | **No loading states** | All pages | No visual feedback during API calls. | Add spinner/overlay during fetch | 🔴 Pending |

### 🟢 LOW — Polish

| # | Bug | File:Line | Details | Fix | Status |
|---|-----|-----------|---------|-----|--------|
| B10 | **No empty state styling** | styles.css | Empty state messages not styled. | Added `.empty-state` CSS | ✅ Fixed |
| B11 | **showBought/NotBought/Archived duplicate code** | script.js | Three nearly identical functions. | Consolidate into single `showFilteredItems(type)` | 🔴 Pending |
| B12 | **Dead code in script.js** | script.js | `populateItemSelect()`, `filterItems()`, `selectItem()`, `updateItemList()` | Remove | 🔴 Pending |
| B13 | **Dead endpoint /api/items/filter** | app.js | Nothing calls it. | Already removed in architecture split | ✅ Fixed |
| B14 | **No page title icons** | All HTML | No favicon | Add favicon to all HTML pages | 🔴 Pending |
| B15 | **Theme toggle button empty before DOMContentLoaded** | darkMode.js | Button empty until DOMContentLoaded. | Put default SVG in HTML | 🔴 Pending |
| B16 | **duplicate formatDate in report.js** | report.js:136 | Same as utils.js. | Remove from report.js | ✅ Fixed |
| B17 | **admin.js prompt editing** | admin.js:108 | Only edits username/password via prompts. | Modal or inline form | 🔴 Pending |
| B18 | **No sort on any table** | All | No click-to-sort on headers. | Add sort handlers | 🔴 Pending |

---

## 9. EXACT SPOTS WHERE innerHTML MUST BE REPLACED (XSS Fix)

These are all locations where user-controlled data (`item.name`, `item.category`, etc.) is interpolated into HTML without sanitization. Each must be replaced with `document.createElement()` + `textContent`.

### script.js
```
Line ~73:  tr.innerHTML = `...${item.name}...${item.category}...${item.price}...`
Line ~77:  tr.innerHTML = `... (bought items view)
Line ~87:  tr.innerHTML = `... (not bought view)  
Line ~97:  cells[0].innerHTML = nameInput (and others)
Line ~201: actionsCell.innerHTML = `...`
```
→ In fetchItems(): lines 73-87, and in showBoughtItems, showNotBoughtItems, showArchivedItems.

### admin.js
```
Line ~88:  row.innerHTML = `...${user.username}...`
```

### report.js
```
Line ~183: tr.innerHTML = `...${item.name}...${item.category}...`
Line ~231: buyerSummaryHTML += `...${buyer}...${amount}...`
```

### autocomplete.js
```
Line ~20: div.textContent = match.name  ← ✅ Already uses textContent, no fix needed
```

### editItems.js
```
Line ~47: showModal('Edit Item', `...<input value="${itemName}">...`)  
```
→ The modal body is set via `innerHTML` with item name in the value attribute. Need to escape or use createElement.

---

## 10. Step-by-Step Fix Plan (For Qwen)

### PHASE 1: Security (do first, before anything else)

**Step 1: Remove .env from git**
```powershell
git rm --cached .env
echo ".env" >> .gitignore   # (if not already there)
git commit -m "chore: remove .env from tracking"
```
⚠️ This only removes it from FUTURE commits. The file is still in git history. For a full purge you'd need `git filter-branch` or `BFG Repo-Cleaner`, but for now removing from HEAD is sufficient if credentials are already rotated.

**Step 2: Add rate limiting**
```bash
npm install express-rate-limit
```
In app.js, add before routes:
```js
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 10,                    // 10 attempts per window
    message: { error: 'Too many login attempts, try again later' }
});
app.post('/api/login', loginLimiter, async (req, res) => { ... });
```

**Step 3: Fix XSS in script.js fetchItems()**
Replace the `tr.innerHTML = \`...\`` pattern with:
```js
const tr = document.createElement('tr');
const td1 = document.createElement('td');
td1.textContent = item.name;
if (item.bought_date) td1.classList.add('bought');
tr.appendChild(td1);
// ... repeat for each column ...
```
Do this for ALL 6 places where innerHTML is used for table rows:
- `fetchItems()` in script.js
- `showBoughtItems()` in script.js
- `showNotBoughtItems()` in script.js
- `showArchivedItems()` in script.js
- `renderUserTable()` in admin.js
- `renderReportTable()` in report.js

For the price/quantity inline inputs, use createElement for the `<input>` too:
```js
const priceInput = document.createElement('input');
priceInput.type = 'number';
priceInput.value = item.price;
priceInput.step = '0.01';
priceInput.className = 'price-input';
priceInput.onchange = () => updatePrice(item.id, priceInput.value);
td.appendChild(priceInput);
```

### PHASE 2: Functional bugs

**Step 4: Fix editUser rename**
In `app.js`, update PUT /api/users/:username to also handle `req.body.username`:
```js
const newUsername = req.body.username || username;
// Update the username column too if changed
```

**Step 5: Add un-archive endpoint**
In `app.js`, add:
```js
app.put('/api/items/:id/restore', requireAuth, async (req, res) => {
    await db.unarchiveItem(itemId);  // UPDATE items SET archived=0
    res.json({ success: true });
});
```
In `db.js`, add `unarchiveItem()` function.
In `script.js` showArchivedItems rendering, add a "Restore" button that calls this.

**Step 6: Add confirmation to archiveItem**
In `script.js`, add `if (!confirm('Archive this item?')) return;` at the top of `archiveItem()`.

### PHASE 3: Code quality

**Step 7: Consolidate duplicate code**
- Remove `formatDate()` from `report.js` (use the one in `utils.js`)
- Remove unused functions from `script.js`: `populateItemSelect`, `filterItems`, `selectItem`, `updateItemList`
- The three filter functions (showBought/showNotBought/showArchived) are 90% identical. Consolidate into one `showFilteredItems(type)` function.

**Step 8: Add favicon**
Create or download a simple SVG favicon, add to all HTML `<head>`:
```html
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,...">
```

**Step 9: Add default SVG to theme toggle buttons**
In each HTML file, add the moon SVG as default innerHTML for `.theme-toggle`:
```html
<button class="theme-toggle" onclick="toggleTheme()" title="Toggle theme">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
</button>
```

### PHASE 4: Architecture rewrite (biggest effort)

**Step 10: Split app.js into layers**
Create directories:
```
middleware/
  auth.js          → requireAuth, requireAdmin
  errorHandler.js  → centralized error handler
routes/
  items.js         → all /api/item routes
  users.js         → all /api/user routes
  auth.js          → login, logout, current-user
```
app.js becomes:
```js
require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
// security headers
// mount routes
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/items'));
app.use('/api', require('./routes/users'));
// error handler
app.listen(PORT);
```

**Step 11: Add Helmet for security headers**
```bash
npm install helmet
```
Replace the manual security headers middleware with `app.use(helmet())`.

---

## 11. Testing Checklist (After Each Fix)

After making changes, restart the server (`node app.js`) and verify:

- [ ] `http://localhost:3000` → login page loads with dark theme
- [ ] Login with valid credentials → redirects to index2.html
- [ ] Login with invalid credentials → shows error toast
- [ ] Admin login → redirects to admin.html
- [ ] Main page: add an item → appears in table
- [ ] Main page: click "Bought" → item moves to bought state
- [ ] Main page: click "Bought" again → item unbought
- [ ] Main page: click "Archive" → item disappears
- [ ] Main page: click "Archived" filter → archived items appear
- [ ] Main page: click category chip → filters by category
- [ ] Main page: edit button → modal opens with form filled
- [ ] Main page: edit modal save → item updates
- [ ] Report page: default dates → table shows items
- [ ] Report page: change period → table updates
- [ ] Report page: toggle bought → item toggles
- [ ] Report page: delete item → item deleted
- [ ] Admin page: create user → user appears in table
- [ ] Admin page: edit user → changes saved
- [ ] Admin page: delete user → user removed
- [ ] Admin page: logout → redirects to login
- [ ] Theme toggle on every page → switches dark/light
- [ ] Mobile responsive: resize to <768px → layout adapts
- [ ] No console errors on any page

---

## 12. Git History (For Context)

```
5916c2a fix: remove broken initTheme, add filter active state, add empty state
a49131b feat: complete frontend UI redesign - dark-first neon aesthetic
82fe5ec docs: update progress-deepsek with latest fixes
8dbd417 chore: remove unused body-parser and moment dependencies
c96b1df fix: add missing dataset attributes for edit modal, remove dead code
3b14cfe docs: add progress-deepsek.md explaining all fixes made
5359e54 chore: add .env.example for environment setup reference
89a24d0 fix: resolve crash on login page (showToast undefined)
b83911b docs: add codebase-fix-progress.md tracking all fixes
12e12a0 Your commit
... (older history)
```

---

## 13. Server / Environment

- **OS:** Windows (PowerShell 5.1)
- **Node:** (whatever is installed, check with `node -v`)
- **DB:** MariaDB (local, credentials in .env)
- **Server startup:** `node app.js` (runs on port 3000)
- **Process management:** Use `Get-Process -Name node` to find, `Stop-Process -Id <PID>` to kill
- **Start in background:** `Start-Process -WindowStyle Hidden -FilePath "node" -WorkingDirectory "D:\Repos\shop-list" -ArgumentList "app.js"`
- **File paths:** Use backslashes `\` for Windows. When passing to tools, use absolute paths like `D:\Repos\shop-list\public\script.js`

### Tool usage notes for Qwen:
- To read a file: use the `read` tool with `filePath: "D:\Repos\shop-list\public\script.js"`
- To edit: use `edit` with `filePath`, `oldString`, `newString`
- To write new files: use `write` with `filePath` and `content`
- To search: use `grep` with `pattern` and `path`
- To run commands: use `bash` with `command` and `workdir: "D:\Repos\shop-list"`
- When editing, ALWAYS read the file first with `read`
- When the server dies, restart it (common issue on Windows)

---

## Quick Start

The most impactful thing you can do first: **fix XSS**. Every `innerHTML` with user data is a ticking bomb. After that, add rate limiting to login. These two changes alone will make the app significantly more secure.

Then fix the functional bugs (editUser rename, un-archive, archive confirmation). Then clean up dead code and consolidate duplicates. Finally, restructure the backend architecture.

Good luck, Qwen 3.5 9B. The app works but is fragile. Make it solid.
