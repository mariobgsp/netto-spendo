# Netto Spendo — Comprehensive Expense Tracker

**Netto Spendo** is a modern, minimalist expense tracking application built with performance and user experience in mind. It helps you track both income and expenses, calculate net balances, and visualize your financial health with an intuitive dark-themed interface.

## Key Features

### 1. **Dual Transaction Tracking**
-   **Expense Tracking**: Log daily expenses with descriptions and amounts.
-   **Income Tracking**: Record income sources (salary, freelance, etc.).
-   **Real-time Balance**: View your current Net Balance (Income - Expenses) instantly.

### 2. **Financial Insights**
-   **Interactive Charts**: Visualize spending trends over weekly, monthly, and yearly periods.
-   **Summary Cards**: Quick stats for Today, This Week, This Month, and This Year.

### 3. **Book Closing (Tutup Buku)**
-   **Close Accounting Period**: Reset your tracking at the end of a month or year.
-   **Carry Forward**: Option to automatically carry your remaining balance forward as the starting balance for the new period.
-   **Start Fresh**: Option to archive old data and start from zero.

### 4. **Clean Minimalist Design**
-   **Focus Mode**: A distraction-free "Dark Zinc" theme designed for readability.
-   **Responsive**: Works seamlessly on desktop and mobile.

---

## Tech Stack

-   **Frontend**: React + TypeScript + Vite (`src/`)
-   **Backend**: Node.js + Express (`backend/src/`)
-   **Database**: PostgreSQL 16
-   **Infrastructure**: Docker Compose

---

## Quick Start (Recommended)

Run the entire application stack with a single command using Docker:

```bash
# Start all services (PostgreSQL + Backend + Frontend)
docker compose up --build
```

Access the application:
-   **Web App**: [http://localhost:5173](http://localhost:5173)
-   **API**: [http://localhost:3001/api/expenses](http://localhost:3001/api/expenses)

---

## Local Development (Manual Setup)

If you prefer running services individually for development:

**1. Database**
```bash
# Copy example environment file
cp .env.example .env
# Edit .env to set your secure password
# nano .env

# Start PostgreSQL via Docker
docker compose up db -d
```

**2. Backend**
```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:3001
```

**3. Frontend**
```bash
# From project root
npm install
npm run dev
# App runs on http://localhost:5173
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/expenses` | List all active (unarchived) transactions |
| `POST` | `/api/expenses` | Create a new transaction (income/expense) |
| `PUT` | `/api/expenses/:id` | Update an existing transaction |
| `DELETE` | `/api/expenses/:id` | Delete a transaction |
| `POST` | `/api/expenses/close-book` | Close current period (Archive + optional Carry Forward) |

---

## License

This project is open source and available under the [MIT License](LICENSE).
