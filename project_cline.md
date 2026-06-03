# Project Analysis Report - Shop List

This document outlines the identified issues and a step-by-step plan for improvements, focusing on functionality, UI/UX, and access control as requested.

## 1. Access & Permissions

### 1.1 Admin Page Access
- **Issue:** Currently, `admin.js` only verifies if a user is logged in. Any authenticated user can access `admin.html` by navigating directly to the URL.
- **Requirement:** The admin page must only be accessible to accounts with `isAdmin: true`.
- **Fix:** Update the authentication check in `admin.js` to verify the `isAdmin` property of the user object.

### 1.2 User Management Restrictions
- **Issue:** The admin interface currently allows for editing user information (usernames, passwords, etc.) via `editUser` functions.
- **Requirement:** The admin page should not allow editing of user accounts.
- **Fix:** Remove or disable user editing capabilities within the admin dashboard to restrict it to viewing or other non-editing administrative tasks.

### 1.3 API Access Control
- **Issue:** The `/api/users` endpoints in `app.js` lack authorization checks. Any user can send requests to create, update, or delete users.
- **Fix:** Implement middleware in `app.js` to ensure only admin users can access user-related API routes.

## 2. Functionality Issues

### 2.1 Reporting & Filtering
- **Issue:** The reporting functionality in `report.js` relies on parameters (`startDate`, `endDate`, `category`) that are not currently implemented in the backend. The `/api/items/filter` route in `app.js` currently returns all items without applying any filters.
- **Issue:** The report does not clearly distinguish between "Current/Expected Spending" (items not yet bought) and "Historical/Actual Spending" (items already bought).
- **Requirement:** Reports should show a breakdown of what has been spent versus what is expected to be spent.
- **Fix:** 
    - Update `db.js` and `app.js` to support SQL-based filtering for dates and categories.
    - Refactor the report logic to group and display spending by status (Bought vs. Not Bought).

### 2.2 Item Ownership & Updates
- **Issue:** Users can update any item via the `PUT /api/items/:id` endpoint. There is no check to ensure a user is only updating their own items or that an admin is performing the update.
- **Fix:** Implement logic to validate item ownership during update requests.