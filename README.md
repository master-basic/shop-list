# 🛒 Shop List

A full-featured shopping list web application with multi-user support, categories, reporting, and admin management.

## Features

- **Item Management** — add, edit, mark as bought, archive, restore, or permanently delete items
- **Bulk Actions** — select multiple items and mark bought, archive, or delete in one click
- **Categories** — filter items by category (Dairy, Meat, Produce, Bakery, Household, etc.)
- **Filters** — view all items, bought, not-bought, or archived
- **Sorting** — click any column header to sort by name, price, quantity, date, category, or total
- **Search** — real-time text search across item names and categories
- **Autocomplete** — item name suggestions based on existing items
- **Inline Editing** — edit name, category, price, and quantity directly in the table
- **CSV Export** — download the current filtered view as a CSV file
- **Reporting** — date-range filtered reports with per-buyer summaries
- **User Auth** — JWT-based login/logout with cookie storage (7-day expiry)
- **Admin Panel** — create, edit, and delete users with admin privileges
- **Dark Mode** — toggle between dark and light themes (persisted in localStorage)
- **Responsive** — desktop table layout switches to stacked cards on mobile (≤640px)
- **Undo Archive** — 10-second undo toast after archiving an item
- **Loading Spinner** — visual feedback during all API calls
- **Keyboard Shortcuts** — Enter advances between fields, Ctrl+Enter submits the add form
- **Security** — Helmet headers, rate limiting (global + login), Joi input validation, JWT auth

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express 4 |
| Database | MariaDB 11 |
| Auth | JWT (jsonwebtoken) |
| Validation | Joi |
| Security | Helmet, express-rate-limit, bcryptjs |
| Frontend | Vanilla JS, CSS custom properties |
| Container | Docker + Docker Compose |

## Quick Start

### Docker (recommended)

```bash
docker compose up -d
```

This starts MariaDB and the app on port 3000. The database is initialized automatically on first startup.

### Manual Setup

1. Install MariaDB and create a database:

```sql
CREATE DATABASE shopping_db;
```

2. Clone and install dependencies:

```bash
git clone <repo-url>
cd shop-list
npm install
```

3. Copy the environment file:

```bash
cp .env.example .env
# Edit .env with your database credentials and a JWT secret
```

4. Initialize the database:

```bash
npm run init-db
```

5. Start the server:

```bash
npm start        # production
npm run dev      # development with nodemon
```

6. Open http://localhost:3000

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `DB_HOST` | localhost | MariaDB host |
| `DB_USER` | shop | Database user |
| `DB_PASSWORD` | shop123 | Database password |
| `DB_NAME` | shopping_db | Database name |
| `JWT_SECRET` | (change me) | Secret key for JWT signing |
| `NODE_ENV` | development | Environment mode |

## Project Structure

```
shop-list/
├── app.js                  # Express app entry point
├── db.js                   # Database functions (items, users)
├── init-db.js              # Database initialization script
├── routes/
│   ├── items.js            # Item CRUD + CSV export endpoints
│   ├── users.js            # User management endpoints
│   └── auth.js             # Login/logout endpoints
├── middleware/
│   ├── auth.js             # JWT authentication middleware
│   ├── jwt.js              # Token generation/verification
│   └── validate.js         # Joi validation schemas
├── public/
│   ├── index2.html         # Main shopping list page
│   ├── login.html          # Login page
│   ├── admin.html          # Admin panel
│   ├── report.html         # Reports page
│   ├── styles.css          # Global stylesheet
│   ├── script.js           # Main list logic
│   ├── admin.js            # Admin panel logic
│   ├── report.js           # Report page logic
│   ├── editItems.js        # Edit item modal logic
│   ├── utils.js            # Shared utilities (toast, loading, formatting)
│   ├── darkMode.js         # Theme toggle
│   ├── autocomplete.js     # Item name autocomplete
│   ├── login.js            # Login page logic
│   └── favicon.svg         # SVG favicon
├── Dockerfile              # Node.js container image
├── docker-compose.yml      # MariaDB + app containers
├── .env.example            # Environment template
└── package.json
```

## API Endpoints

### Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | List items (optional: `?includeArchived=true`) |
| POST | `/api/items` | Add an item |
| PUT | `/api/items/:id` | Update an item |
| PUT | `/api/items/:id/bought` | Toggle bought status |
| DELETE | `/api/items/:id` | Archive an item (soft delete) |
| PUT | `/api/items/:id/restore` | Restore an archived item |
| DELETE | `/api/items/:id/hard-delete` | Permanently delete an item |
| GET | `/api/items/export/csv` | Export items as CSV |

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Log in (returns JWT cookie) |
| POST | `/api/logout` | Log out (clears JWT cookie) |
| GET | `/api/current-user` | Get current authenticated user |

### Users (admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create a user |
| PUT | `/api/users/:username` | Update a user |
| DELETE | `/api/users/:username` | Delete a user |

## License

ISC
