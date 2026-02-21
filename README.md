# Student Life Dashboard

Inventory feature is implemented with:
- Backend: Node.js + Express + SQLite
- Frontend: React + Vite
- Auth: Mock email/password gate in inventory UI

## Project Structure

```txt
student-life-dashboard/
  backend/
    index.js
    routes/inventory/
      db.js
      index.js
      items.controller.js
      items.routes.js
    db/
      migrations/001_inventory_schema.sql
      seed/inventory_seed.sql
  frontend/
    src/features/inventory/
      InventoryFeature.jsx
      inventory.css
      services/inventoryApi.js
```

## Setup

### 1) Backend

```bash
cd backend
npm install
node index.js
```

Backend runs on `http://localhost:5000`.

SQLite DB file is auto-created at:
- `backend/db/inventory.sqlite`

Migration and seed run automatically on first startup.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on Vite default URL (usually `http://localhost:5173`).

## Inventory Endpoints

Required endpoints implemented:
- `GET /api/inventory/items`
- `POST /api/inventory/items`
- `PUT /api/inventory/items/:id`
- `GET /api/inventory/borrowed`
- `POST /api/inventory/borrowed`
- `POST /api/inventory/borrowed/:id/return`
- `GET /api/inventory/stats`

Also added for Categories page:
- `GET /api/inventory/categories`
- `POST /api/inventory/categories`
- `PUT /api/inventory/categories/:id`
- `DELETE /api/inventory/categories/:id`

## API Examples

### Get Items

```bash
curl http://localhost:5000/api/inventory/items
```

### Create Item

```bash
curl -X POST http://localhost:5000/api/inventory/items \
  -H "Content-Type: application/json" \
  -d '{
    "name":"USB C Cable",
    "sku":"CAB-USB-C-001",
    "category_id":"cat_gadgets",
    "quantity_total":10,
    "low_stock_threshold":2,
    "description":"Type-C cable 1m",
    "location":"Shelf A"
  }'
```

### Borrow Item

```bash
curl -X POST http://localhost:5000/api/inventory/borrowed \
  -H "Content-Type: application/json" \
  -d '{
    "item_id":"item_01",
    "borrower_name":"Fenil",
    "quantity":2,
    "due_date":"2026-03-01"
  }'
```

If stock is insufficient, API returns:
- `400 { "message": "Not enough stock available" }`

### Return Borrowed Item

```bash
curl -X POST http://localhost:5000/api/inventory/borrowed/b_01/return \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Get Stats

```bash
curl http://localhost:5000/api/inventory/stats
```

## Seed Data

Initial seed includes:
- 10 items
- 5 borrow records
- 4 categories

## Frontend Inventory Pages

Implemented pages:
- `/inventory/dashboard`
- `/inventory/items`
- `/inventory/borrowed`
- `/inventory/categories`
- `/inventory/analytics`
