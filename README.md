# Netto Spendo

App to count net spend daily / weekly / monthly / yearly.

## Tech Stack

- **Frontend**: Vite + React + TypeScript + Chart.js
- **Backend**: Node.js + Express + PostgreSQL (`pg` driver)
- **Database**: PostgreSQL 16
- **Infrastructure**: Docker Compose

## Quick Start (Docker)

```bash
# Start all services (PostgreSQL + Backend + Frontend)
docker compose up --build

# App:      http://localhost:5173
# API:      http://localhost:3001/api/expenses
# Postgres: localhost:5432
```

## Local Development

```bash
# 1. Start PostgreSQL (via Docker or locally)
docker compose up db -d

# 2. Install backend deps & run
cd backend && npm install && npm run dev

# 3. Install frontend deps & run (from root)
npm install && npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List all expenses |
| POST | `/api/expenses` | Create an expense |
| DELETE | `/api/expenses/:id` | Delete an expense |
| GET | `/api/health` | Health check |

## Environment Variables

Copy `.env` and adjust as needed:

```env
POSTGRES_USER=netto
POSTGRES_PASSWORD=netto_secret_2026
POSTGRES_DB=netto_spendo
DATABASE_URL=postgresql://netto:netto_secret_2026@localhost:5432/netto_spendo
PORT=3001
VITE_API_URL=http://localhost:3001
```
