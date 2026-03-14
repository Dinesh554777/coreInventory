# coreInventory
# CoreInventory — Full-Stack Inventory Management System

## Tech Stack
- **Backend**: Python FastAPI + PostgreSQL + SQLAlchemy + Redis + Celery
- **Frontend**: Vanilla HTML/CSS/JS (single-file responsive dashboard)
- **Auth**: JWT + bcrypt + OTP email reset

## Project Structure
```
coreinventory/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # Route handlers
│   │   ├── core/               # Config, security, JWT
│   │   ├── db/                 # Database session, base
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── services/           # Business logic
│   │   └── utils/              # Helpers (email, OTP)
│   ├── alembic/                # DB migrations
│   ├── main.py
│   ├── .env.example
│   └── requirements.txt
└── frontend/
    └── index.html              # Full responsive SPA dashboard
```

## Quick Start

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # Fill in your DB credentials
alembic upgrade head
uvicorn main:app --reload
```

### Frontend
Open `frontend/index.html` in a browser, or serve with any static server.
Update `API_BASE` in the JS to point to your backend URL.

## API Documentation
Visit `http://localhost:8000/docs` for the interactive Swagger UI.

## Features
- JWT Authentication (login, signup, OTP password reset)
- Dashboard KPIs (total stock, low stock, pending receipts/deliveries)
- Product Management (SKU, category, unit, initial stock)
- Multi-Warehouse Management
- Inventory Operations: Receipts, Delivery Orders, Transfers, Adjustments
- Stock Ledger (full audit trail per product/warehouse)
- Low Stock Alerts with dynamic threshold
- REST API with filtering, pagination, and sorting
