# CoreInventory - Inventory Management System

## Overview

Full-stack Inventory Management System (IMS) built with React + Vite frontend and Express 5 + PostgreSQL backend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui (artifacts/core-inventory)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: JWT (bcryptjs + jsonwebtoken), stored in localStorage
- **Forms**: react-hook-form + zod validation
- **Charts**: Recharts
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts/
├── api-server/       # Express 5 API server with all routes
└── core-inventory/   # React Vite frontend SPA

lib/
├── api-spec/         # OpenAPI spec + Orval codegen config
├── api-client-react/ # Generated React Query hooks
├── api-zod/          # Generated Zod schemas from OpenAPI
└── db/               # Drizzle ORM schema + DB connection
    └── src/schema/
        ├── users.ts
        ├── otps.ts
        ├── categories.ts
        ├── warehouses.ts
        ├── products.ts
        ├── stock.ts
        ├── receipts.ts
        ├── deliveries.ts
        ├── transfers.ts
        ├── adjustments.ts
        └── ledger.ts
```

## Features

### Authentication
- Login, Signup, OTP-based password reset
- JWT token stored in `localStorage` under key `core_inventory_token`
- Demo account: admin@coreinventory.com / admin123

### Dashboard
- KPI cards: Total Products, Total Stock, Low Stock, Out of Stock, Pending Receipts/Deliveries/Transfers/Adjustments
- Low stock alerts table

### Product Management
- Create/edit/delete products with SKU, category, unit, reorder point
- Multi-warehouse stock visibility
- Low stock filtering, SKU search

### Warehouse Management
- Multi-warehouse support via Settings page
- Per-warehouse stock tracking

### Inventory Operations
- **Receipts** - Incoming goods from suppliers → increases stock on validate
- **Delivery Orders** - Outgoing goods to customers → decreases stock on validate
- **Internal Transfers** - Move stock between warehouses
- **Stock Adjustments** - Correct mismatches between system and physical count

### Stock Ledger
- Full audit trail of all stock movements with filters

## API Routes

All routes at `/api/`:
- `POST /auth/signup|login|logout|request-otp|verify-otp`, `GET /auth/me`
- `GET|POST /categories`, `GET|PATCH|DELETE /categories/:id`
- `GET|POST /warehouses`, `GET|PATCH|DELETE /warehouses/:id`
- `GET|POST /products`, `GET|PATCH|DELETE /products/:id`
- `GET|POST /receipts|deliveries|transfers|adjustments`
- `GET|PATCH /:operation/:id`, `POST /:operation/:id/validate`
- `GET /ledger`, `GET /dashboard/kpis`, `GET /dashboard/low-stock`

## Development

```bash
# Start API server
pnpm --filter @workspace/api-server run dev

# Start frontend
pnpm --filter @workspace/core-inventory run dev

# Push DB schema changes
pnpm --filter @workspace/db run push

# Run codegen after OpenAPI changes
pnpm --filter @workspace/api-spec run codegen
```
