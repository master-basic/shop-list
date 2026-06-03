Comprehensive Debug Plan for Shop-List Project
Project Overview
Stack: Express.js (backend), MariaDB (database), Vanilla JavaScript (frontend)
Key Dependencies: mariadb, bcryptjs, body-parser, cookie-parser, dotenv, moment, morgan
Architecture: Server-side database operations, client-side state management
Phase 1: Database Module Debug (db.js)
Debug Focus Areas:
Connection Pool Configuration

Verify pool initialization with correct environment variables
Check connection limit (currently set to 5)
Test connection pooling behavior under load
Transaction Functions

initializeDatabase() - Verify table creation with IF NOT EXISTS
addItem() - Check INSERT success and return value handling
updateItem() - Verify all fields updated (name, date, bought_date, category, price, quantity)
markAsBought() - Check UPDATE query and parameter order
Query Function Debug Points

getItems() - Verify WHERE clause for archived filter
authenticateUser() - Check bcrypt async comparison
getUserByUsername() - Verify user lookup without password
Error Handling

Verify all try/catch/finally blocks release connections
Check error messages are descriptive
Debug Steps:

// Test connection
pool.getConnection().then(conn => {
  console.log('Connected:', conn.info.connectionName);
  conn.release();
});

// Test insert
db.addItem({name: 'Test Item', date: '2024-01-01', bought_date: null, category: null, price: 10.00, quantity: 1, created_by: 'admin'}).then(item => {
  console.log('Insert result:', item);
});
Phase 2: Express Server Debug (app.js)
Debug Focus Areas:
Middleware Chain

bodyParser.json() - Verify JSON parsing works
cookieParser() - Check cookie handling
express.static() - Verify static file serving
Date Formatting Function

formatDateToSQL() - Test edge cases (empty string, invalid format)
Line 36-44: toLocaleString with timeZone option - verify format output
Route Handlers

GET /api/items - Check includeArchived query parameter handling
GET /api/items/filter - Debug unused filter implementation (line 89)
POST /api/items - Verify authentication via cookies
PUT /api/items/:id/bought - Check parameter binding
PUT /api/items/:id - Verify update response format
Authentication Flow

POST /api/login - Verify cookie setting with httpOnly flag
GET /api/current-user - Check cookie retrieval
Debug Steps:

// Log middleware execution
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Test authentication
app.post('/api/test-auth', (req, res) => {
  console.log('Cookie username:', req.cookies.username);
  res.json({ authenticated: !!req.cookies.username });
});
Phase 3: Frontend Utility Modules Debug
utils.js Debug Focus Areas:
Toast Notification System

showToast() - Verify DOM manipulation and cleanup
Check animation keyframes work correctly
Test duration timeout removal
Validation Functions

validateItemName() - Test boundary conditions (empty, >100 chars)
validatePrice() - Test NaN handling, negative values
validateQuantity() - Test zero/negative values
Date/Number Formatting

formatDate() - Test null/undefined handling
formatCurrency() - Verify locale formatting
formatNumber() - Test comma separation
Performance Functions

debounce() - Test with rapid calls
throttle() - Verify limit enforcement
Debug Steps:

// Test validation
validateItemName('');
validateItemName('a'.repeat(101));

// Test formatting
formatDate(null);
formatCurrency(-10);

// Test debounce
let calls = 0;
const debounced = debounce(() => calls++, 100);
debounced(); debounced(); debounced();
console.log('Calls:', calls); // Should be 1
Phase 4: Feature Modules Debug
script.js Debug Focus Areas:
fetchItems() Function

Verify API call handles errors
Check category filter logic (line 68-71)
Verify bought/not-bought filter logic (line 88-90)
Check archived filter logic
Update Functions

updatePrice() - Verify authentication check
updateQuantity() - Test parameter binding
saveEditing() - Verify form data capture
Filter Functions

showBoughtItems() - Test filter logic
showNotBoughtItems() - Verify inverse filter
showArchivedItems() - Check archived detection
Theme Management

toggleTheme() - Verify localStorage persistence
initTheme() - Test dark mode detection
Debug Steps:

// Test API call
fetch('/api/items')
  .then(res => res.json())
  .then(data => console.log('Items:', data))
  .catch(err => console.error('Error:', err));
Phase 5: Authentication Module Debug
login.js Debug Focus Areas:
Form Validation

validateInput() - Test empty and long inputs
validateLoginForm() - Verify both fields required
Login Handler

handleLogin() - Check redirect logic
handleAdminLogin() - Verify admin detection
Test error handling in catch blocks
admin.js Debug Focus Areas:
Authentication Check

checkAuthentication() - Verify redirect on failure
Check currentUser state management
User Management

fetchUsers() - Test error handling
editUser() - Verify prompt handling
deleteUser() - Check confirmation dialog
Debug Tools to Use
Browser DevTools - Network tab, Console, Application tab
Backend Console - Monitor database queries and Express logs
Test Database Queries - Connect to MariaDB directly
Summary of Debug Checklist
Module	Priority	Key Debug Points
Database	High	Connection, CRUD functions, error handling
Express	High	Routes, middleware, auth flow
Utils	Medium	Validation, formatting, toast system
Features	Medium	API calls, filters, theme
Auth	High	Login, logout, session management