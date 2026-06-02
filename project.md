# Shop-List Project Review

## Overview
This document summarizes issues found in the `shop-list` project and lists the changes and fixes needed. It is organized by priority, with actionable steps to improve correctness, security, and maintainability.

---

## 1. Critical Backend Issues

### 1.1 Broken filter endpoint
- File: `app.js`
- Problem: `GET /api/items/filter` builds a SQL filter query, but then ignores it and calls `db.getItems(includeArchived)` instead.
- Fix: Implement filtering in `db.js` or route logic, and return only the filtered rows.

### 1.2 Partial update payloads fail
- Files: `app.js`, `public/script.js`
- Problem: `PUT /api/items/:id` expects full item fields, but `updatePrice` and `updateQuantity` send only `id` and one field.
- Fix: Support partial updates in the route and/or require the frontend to send complete item payloads.

### 1.3 Update date handling is broken
- Files: `app.js`
- Problem: `formatDateToSQL(new Date(date))` breaks when `date` is `undefined` or when `date` is already a valid string.
- Fix: Use correct ISO formatting and validate dates explicitly. Avoid using locale string replacements.

### 1.4 `GET /api/items` hides archived state
- Files: `db.js`, `app.js`, `public/script.js`
- Problem: The SQL query does not select `archived`, but client code reads `item.archived`.
- Fix: Include `archived` in the SELECT column list or expose a dedicated archived field.

### 1.5 `updateUser()` can nullify passwords
- File: `db.js`
- Problem: When no password is provided, `updateUser` sets `password = null`, which can break user login.
- Fix: Only update the password column when a new password is supplied.

### 1.6 User endpoint mismatch / missing rename support
- Files: `admin.js`, `app.js`, `db.js`
- Problem: `admin.js` prompts for a new username, but `PUT /api/users/:username` does not support username changes.
- Fix: either disallow renaming or implement a dedicated rename flow.

### 1.7 Authentication is weak and incomplete
- Files: `app.js`, `db.js`
- Problems:
  - Session is only stored as `username` cookie.
  - No secure cookie settings, no session token, no CSRF protection.
  - `POST /api/login` sets a username cookie without expiration or secure flags.
- Fix: Use a proper session/authentication mechanism such as JWT or server-side sessions; set secure cookie flags and add CSRF protection.

---

## 2. Critical Frontend Issues

### 2.1 Inline editing does not work
- File: `public/script.js`
- Problem: `enableEditing()` assigns DOM elements to `innerHTML`, which results in string conversion instead of rendering inputs.
- Fix: Use `appendChild()` or create proper HTML string markup, then handle input values correctly.

### 2.2 Report page calls non-existent APIs
- File: `public/report.js`
- Problems:
  - Uses `/api/item/bought` instead of `/api/items/:id/bought`.
  - Uses `/api/item/${itemId}` instead of `/api/items/${itemId}`.
- Fix: Update report routes to call the correct backend endpoints or add backend aliases.

### 2.3 Frontend date filtering is inconsistent
- File: `public/report.js`
- Problem: Date range selection and generated report still fetch from `/api/items?` rather than the intended filter endpoint. The existing `filter` route is unused.
- Fix: either use `/api/items/filter` with correct back-end filter support or update frontend to filter locally after fetching data.

### 2.4 Admin user editing UI and backend mismatch
- File: `public/admin.js`
- Problems:
  - UI allows editing username but backend ignores it.
  - `PUT /api/users/:username` expects password and isAdmin, but the frontend may send `null` for password.
- Fix: align admin UI with backend capabilities and support partial updates safely.

### 2.5 Multiple toast/message implementations
- Files: `public/login.js`, `public/admin.js`, `public/report.js`, `public/editItems.js`, `public/utils.js`
- Problem: Duplicate/overlapping `showToast()` implementations and styles exist in several files.
- Fix: Consolidate toast and common helper functions into `public/utils.js` and import/use them consistently.

### 2.6 No client-side validation for updates
- Files: `public/script.js`, `public/editItems.js`
- Problem: Update and edit flows send values without validation and may submit invalid or incomplete data.
- Fix: Add validation before calling update APIs.

---

## 3. Database and Schema Issues

### 3.1 Duplicate schema initialization logic
- Files: `db.js`, `init-db.js`
- Problem: Both files define table creation and user creation logic separately, which can diverge.
- Fix: Consolidate schema initialization into a single module and make `init-db.js` a thin wrapper or one-time seeding script.

### 3.2 `init-db.js` truncates users and hardcodes credentials
- File: `init-db.js`
- Problem: The script uses `TRUNCATE TABLE users`, which is destructive, and hardcodes admin credentials.
- Fix: Remove destructive resets from the main script, or clearly document it as a demo reset script. Use safer seed logic.

### 3.3 `users` table stores passwords without lookup invariants
- File: `db.js`
- Problem: `getUserByUsername()` returns only `username` and `isAdmin`, but admin routes may need more context. The table allows `password VARCHAR(255)` without enforcing bcrypt length or validation.
- Fix: Keep password hashing consistent and validate user input before insert/update.

---

## 4. Project Hygiene and Maintainability

### 4.1 `package.json` uses `body-parser` unnecessarily
- Files: `package.json`, `app.js`
- Problem: Express 4.16+ has `express.json()` built in, so `body-parser` is redundant.
- Fix: Use `app.use(express.json())` and remove `body-parser` dependency if not needed elsewhere.

### 4.2 Missing documentation and .env sample
- Problem: There is no `README.md`, no `.env.example`, and no developer setup notes.
- Fix: Add `README.md` and `.env.example` describing required DB env variables and startup commands.

### 4.3 `log.txt` is tracked in repository root
- Problem: `log.txt` is likely a runtime log file that should not be committed.
- Fix: Add `log.txt` to `.gitignore` and remove it from git if it should not be versioned.

### 4.4 Stale or unused files
- Problem: `add-category-column.js` and `public/config.js` appear redundant or not integrated.
- Fix: Audit stale scripts, remove unused files, or clearly document their purpose.

### 4.5 Inconsistent route naming and HTML structure
- Problems:
  - The main page is `index2.html` instead of `index.html`.
  - Backend routes use plural `items` but report page uses singular `item`.
- Fix: Standardize route names and frontend page naming.

---

## 5. Recommended Step-by-Step Fix Plan

### Step 1: Fix core backend API behavior
1. Fix `GET /api/items/filter` to return filtered rows based on query parameters.
2. Update `db.getItems()` to select `archived` and any fields needed by the frontend.
3. Adjust `PUT /api/items/:id` to support partial updates safely and validate incoming data.
4. Repair `updateUser()` so it preserves the old password when none is provided.
5. Fix route naming in `public/report.js` to match backend APIs.

### Step 2: Fix frontend integration and editing flows
1. Correct `enableEditing()` in `public/script.js` so input elements render properly.
2. Make `updatePrice` and `updateQuantity` send a full item payload or implement partial update API support.
3. Align admin user editing UI with backend semantics or add proper rename support.
4. Consolidate toast helpers and common utilities into `public/utils.js`.

### Step 3: Harden security and authentication
1. Replace the simple `username` cookie auth with a secure session or token-based system.
2. Set cookies with `httpOnly`, `secure`, and `sameSite` flags.
3. Add input validation and sanitization for all user-controlled fields.
4. Add error handling and proper HTTP status codes for all backend routes.

### Step 4: Consolidate schema and initialization
1. Merge schema creation logic into one module or clarify `init-db.js` as setup-only.
2. Remove destructive `TRUNCATE TABLE users` from normal initialization.
3. Add a `README.md` and `.env.example` describing the database environment.

### Step 5: Improve repository hygiene
1. Add `log.txt` to `.gitignore` if it should not be tracked.
2. Remove or document unused helper scripts and duplicate files.
3. Standardize route and filename conventions (`index2.html` should be `index.html` or renamed consistently).

---

## 6. Optional Improvements

- Add unit tests for backend routes and database operations.
- Add frontend unit/integration tests for API interactions and form validation.
- Add ESLint and Prettier configuration for consistent code style.
- Replace `moment` with built-in date handling or a lighter modern library.
- Add role-based authorization for admin operations.

---

## Summary
This project needs several fixes across backend APIs, frontend integration, authentication, and schema initialization. The highest priority is making the API routes match the frontend expectations and fixing update/filter behavior. After that, improve security, consolidate duplicate code, and add documentation for developers.
