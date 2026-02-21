# API Contract - Student Life Dashboard

## Inventory

Required endpoints:

```txt
GET    /api/inventory/items
POST   /api/inventory/items
PUT    /api/inventory/items/:id
GET    /api/inventory/borrowed
POST   /api/inventory/borrowed
POST   /api/inventory/borrowed/:id/return
GET    /api/inventory/stats
```

Extra endpoints used by Categories UI:

```txt
GET    /api/inventory/categories
POST   /api/inventory/categories
PUT    /api/inventory/categories/:id
DELETE /api/inventory/categories/:id
```
