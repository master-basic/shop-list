# Codebase Analysis Report: shop-list

**Date:** Mon Jul 20 2026
**Repository:** https://github.com/master-basic/shop-list.git
**Branch:** master (12 commits)

---

## 1. Project Overview

| Attribute | Detail |
|-----------|--------|
| **Type** | Full-stack web application — Shopping List manager with multi-user support, admin panel, and reporting |
| **Backend** | Node.js (CommonJS), Express.js 4.21.2 |
| **Database** | MariaDB 3.4.0 (via `mariadb` npm driver) |
| **Frontend** | Vanilla JavaScript, HTML5, CSS3 (no framework) |
| **Authentication** | Cookie-based (plain username cookie), bcrypt password hashing |

---

## 2. Directory Structure

```
shop-list/
├── .env                          # Environment variables (COMMITTED — security issue)
├── .gitignore                    # Minimal: node_modules, log.txt
├── app.js                        # Express server + all API routes (267 lines)
├── db.js                         # Database layer — schema + CRUD (366 lines)
├── config.js                     # Server config wrapper (unused, 11 lines)
├── init-db.js                    # Database seeding script (79 lines)
├── add-category-column.js        # One-off DB migration (36 lines)
├── log.txt                       # Runtime log (COMMITTED)
├── memory.md                     # AI session memory
├── project.md                    # Known issues/audit document
├── package.json
├── public/
│   ├── index2.html               # Main shopping list page
│   ├── login.html                # Login page
│   ├── admin.html                # Admin panel page
│   ├── report.html               # Report page
│   ├── script.js                 # Main shopping list logic (592 lines)
│   ├── login.js                  # Login logic (232 lines)
│   ├── admin.js                  # Admin panel logic (197 lines)
│   ├── report.js                 # Report logic (309 lines)
│   ├── editItems.js              # Item editing modal (235 lines)
│   ├── utils.js                  # Shared utilities (265 lines)
│   ├── darkMode.js               # Dark mode toggle (33 lines)
│   ├── autocomplete.js           # Item name autocomplete (30 lines)
│   ├── config.js                 # Client config (uses module.exports — broken in browser)
│   └── styles.css                # Unified CSS (1106 lines)
└── sequentialdebug.md            # Debug notes
```

---

## 3. Dependencies

| Package | Version | Purpose | Issue |
|---------|---------|---------|-------|
| `express` | ^4.21.2 | Web framework | — |
| `mariadb` | ^3.4.0 | MariaDB client | — |
| `bcryptjs` | ^3.0.3 | Password hashing | — |
| `body-parser` | ^1.20.3 | Body parsing | **Redundant** — Express 4.16+ has `express.json()` |
| `cookie-parser` | ^1.4.7 | Cookie parsing | — |
| `dotenv` | ^16.4.7 | Env vars | — |
| `moment` | ^2.30.1 | Date formatting | **Deprecated** — should use `luxon` or native `Intl` |
| `morgan` | ^1.10.0 | HTTP logging | — |

**Missing:** `nodemon` used in `npm run dev` but NOT in devDependencies. No `devDependencies` section exists at all.

---

## 4. Database Schema

### `items` table
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT AUTO_INCREMENT | Primary key |
| `name` | VARCHAR(255) NOT NULL | Item name |
| `date` | DATETIME | Creation date |
| `bought_date` | DATETIME NULL | Purchase date |
| `category` | VARCHAR(100) | Item category |
| `price` | DECIMAL(10,2) | Unit price |
| `quantity` | INT | Quantity |
| `total` | DECIMAL(10,2) GENERATED | `price * quantity` |
| `created_by` | VARCHAR(255) | Creator username |
| `bought_by` | VARCHAR(255) NULL | Buyer username |
| `archived` | BOOLEAN | Soft-delete flag |

### `users` table
| Column | Type | Notes |
|--------|------|-------|
| `username` | VARCHAR(255) PRIMARY KEY | Login name |
| `password` | VARCHAR(255) NOT NULL | bcrypt hash |
| `isAdmin` | BOOLEAN | Admin flag |
| `created_at` | DATETIME | Timestamp |
| `updated_at` | DATETIME | Auto-updated |

**Default seeded users:** `admin/admin123` (admin), `user/user123` (regular)

---

## 5. API Endpoints

| Method | Route | Auth | Purpose | Issue |
|--------|-------|------|---------|-------|
| `GET` | `/` | No | Redirect to login | — |
| `GET` | `/api/items` | No | List items | — |
| `GET` | `/api/items/filter` | No | Filter items | **BROKEN** — builds SQL but ignores it |
| `POST` | `/api/items` | Cookie | Create item | — |
| `PUT` | `/api/items/:id/bought` | Cookie | Mark bought | — |
| `PUT` | `/api/items/:id` | No | Update item | **No auth**, partial updates break |
| `DELETE` | `/api/items/:id` | No | Archive item | **No auth** |
| `POST` | `/api/login` | No | Authenticate | — |
| `POST` | `/api/logout` | No | Clear cookie | — |
| `GET` | `/api/current-user` | Cookie | Get user info | — |
| `GET` | `/api/users` | No | List users | **No auth — admin endpoint exposed** |
| `POST` | `/api/users` | No | Create user | **No auth — anyone can create users** |
| `PUT` | `/api/users/:username` | No | Update user | **No auth**, can nullify passwords |
| `DELETE` | `/api/users/:username` | No | Delete user | **No auth** |

---

## 6. Critical Bugs

### BUG: `GET /api/items/filter` is completely broken
**File:** `app.js:64-96`
Builds a SQL query string with parameters but then ignores it entirely, calling `db.getItems()` instead.

### BUG: `PUT /api/items/:id` breaks on partial updates
**File:** `app.js:113-138`, `public/script.js:205-230`
Frontend sends only changed fields (`updatePrice`, `updateQuantity`) but endpoint expects a full payload, causing other fields to become `undefined`/`NaN`.

### BUG: `init-db.js` references `pool` before definition
**File:** `init-db.js:10` — calls `pool.getConnection()` but `pool` is defined on line 71. Would crash with `ReferenceError`.

### BUG: `updateUser()` can set password to null
**File:** `db.js` — When no password is provided, it sets `password = null`, breaking user login.

### BUG: Report page calls non-existent API routes
**File:** `public/report.js` — calls `/api/item/bought` and `/api/item/${itemId}` instead of `/api/items/:id/bought` and `/api/items/:id`.

### BUG: `public/config.js` uses CommonJS `module.exports` in browser
**File:** `public/config.js:31` — Uses `module.exports` which won't work in browser context. File is loaded via `<script>` tags.

### BUG: Script load order issues
**File:** `public/index2.html` — `script.js` is loaded before `utils.js`, but `script.js` calls `showToast()` which is defined in `utils.js`.

---

## 7. Security Issues

### CRITICAL: `.env` committed to version control
Contains database credentials (`DB_PASSWORD=shop123`) in plaintext. **Must be added to `.gitignore` immediately.**

### CRITICAL: No authorization on admin/user management APIs
Any unauthenticated user can create, modify, or delete users via direct API calls. User CRUD endpoints have zero auth checks.

### HIGH: Cookie security weaknesses
- No `secure` flag (sends over HTTP)
- No `sameSite` attribute (CSRF vulnerability)
- No session expiry
- Plain username cookie — no JWT or session token

### HIGH: No CSRF protection
Cookie-based mutations (create, buy, archive items) are vulnerable to CSRF attacks.

### MEDIUM: No input validation
Most endpoints accept any input without validation. SQL injection is mitigated by parameterized queries, but XSS and data corruption are possible.

---

## 8. Code Quality Issues

### Anti-patterns

1. **Connection pool defined but never used** — `db.js:59` defines a pool with limit 5 but every function calls `createConnection()` (new single connection each time). Performance and reliability are impacted.

2. **Duplicate `showToast()` implementations** — Defined in 4 files: `utils.js`, `login.js`, `admin.js`, `editItems.js`. Each injects `<style>` tags into `<head>` on every call.

3. **Mixed concerns in `app.js`** — Route definitions, date formatting, and server setup all in one 267-line file. No route separation.

4. **No error handling in several routes** — `PUT /api/items/:id/bought`, `DELETE /api/items/:id`, and all user management routes have no try/catch.

5. **Excessive console.log statements** — Debug logging left in production code.

6. **Client-side filtering duplicated** — Filter functions duplicate `fetchItems()` logic instead of reusing it.

7. **Inconsistent category options** — `index2.html` and `editItems.js` define different category lists.

8. **`moment.js` loaded twice** — Once server-side via npm, once client-side via CDN. Also deprecated.

9. **`event.target` used without parameter** — `script.js` references implicit `window.event` instead of passing event as parameter.

10. **Hardcoded credentials** — `admin/admin123` and `user/user123` hardcoded in both `db.js` and `init-db.js`.

---

## 9. Missing Infrastructure

| Category | Status |
|----------|--------|
| **Testing** | None — no test framework, no test files, no test scripts |
| **Linting** | None — no ESLint, Prettier, or any code style tooling |
| **Type checking** | None — no TypeScript, no JSDoc type annotations |
| **Build tools** | None — vanilla JS served directly |
| **CI/CD** | None — no GitHub Actions, no pipeline config |
| **Docker** | None — no containerization |
| **Documentation** | Minimal — no API docs, no JSDoc, no README |
| **Environment docs** | No `.env.example` file |

---

## 10. Recommendations (Priority Order)

### Immediate (Security)
1. Remove `.env` from git tracking and add to `.gitignore`
2. Add authorization middleware to all user management endpoints
3. Add `secure`, `sameSite` flags to auth cookies
4. Implement session tokens instead of plain username cookies

### High Priority (Bugs)
5. Fix `/api/items/filter` endpoint to actually use the built query
6. Fix `PUT /api/items/:id` to handle partial updates correctly
7. Fix `init-db.js` variable ordering
8. Fix `updateUser()` to not allow null passwords
9. Fix report page API route paths
10. Fix `public/config.js` to use `window` object instead of `module.exports`

### Medium Priority (Code Quality)
11. Refactor `db.js` to actually use the connection pool
12. Consolidate `showToast()` into a single implementation
13. Add error handling to all API routes
14. Separate routes into individual files
15. Remove debug console.log statements
16. Replace `moment.js` with native `Intl` or `luxon`

### Low Priority (Infrastructure)
17. Add ESLint and Prettier configuration
18. Add unit and integration tests
19. Add TypeScript or JSDoc for type safety
20. Add CI/CD pipeline
21. Add `.env.example` with documentation
22. Improve git commit message quality
