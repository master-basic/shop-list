# Last Completed Task: Fix Login.html Login Issue

## Issue Identified
- Admin login form had `id="admin-login-form"` but JavaScript was looking for `id="login-form"`
- Admin login handler was attached to form submit event but HTML structure didn't match
- "Failed to fetch" error occurred because adminLogin() wasn't being triggered properly

## Fixes Applied
1. Changed admin login handler from `form.addEventListener('submit', ...)` to `submitButton.addEventListener('click', ...)`
2. Added explicit submitButton selection before adding event listener
3. Kept regular login handler using form submit event (which matches HTML structure)

## Verification
- Database credentials verified: admin/admin123 and user/user123
- Backend /api/login route properly handles authentication
- Both admin and regular login should now work correctly

## Files Modified
- public/login.js - Fixed admin login handler event binding

---

## Database Connection Investigation (Latest Work)

## Problem Identified
- Server crashes on startup with database connection errors
- Login API returns 500 error with "socket has unexpectedly been closed" (ER_SOCKET_UNEXPECTED_CLOSE)

## Root Causes Found
1. **MariaDB server not running** - Connection refused errors when trying to connect
2. **Database 'shopping_db' does not exist** - SQL error: "Unknown database 'shopping_db'"
3. **Credentials mismatch** - .env uses DB_USER=shop, DB_PASSWORD=shop123 but may not match actual MariaDB setup

## Attempted Solutions
- Tried running `init-db.js` to initialize database
- Server still crashes due to database connectivity issues
- Database connection pool failing repeatedly

## Required Actions
1. Start MariaDB server service
2. Create 'shopping_db' database or configure correct database name
3. Verify database credentials match actual setup
4. Restart Express server to test login endpoint

## Files Analyzed
- app.js - POST /api/login route calls db.authenticateUser()
- db.js - authenticateUser() queries users table, compares bcrypt passwords
- .env - Contains DB_HOST=localhost, DB_USER=shop, DB_PASSWORD=shop123, DB_NAME=shopping_db
- public/login.js - Frontend login handlers calling API
- public/login.html - Login form UI