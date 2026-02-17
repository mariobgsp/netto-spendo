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

### 3. **Book Management (Buku Kas)**
-   **Multiple Books**: Create different books for different events (e.g., "Monthly Budget", "Bali Trip", "Wedding").
-   **Easy Switching**: seamless switching between active books.
-   **Book Lifecycle**:
    -   **Create**: Start a new book at any time.
    -   **Rename**: Edit book names for better organization.
    -   **Close**: Mark a book as "Closed" to prevent new transactions.
    -   **Carry Forward**: Automatically transfer remaining balance to a new book upon closing.

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

1.  **Configure Environment**:
    ```bash
    cp .env.example .env
    # Optionally edit .env to set your secrets
    ```

2.  **Start Services**:
    ```bash
    docker compose up --build
    ```

3.  **Access Application**:
    -   **Web App**: [http://localhost:5173](http://localhost:5173)
    -   **API**: [http://localhost:3001/api/expenses](http://localhost:3001/api/expenses)

---

## Local Development (Manual Setup)

If you prefer running services individually for development:

**1. Database**
```bash
# Copy example environment file
cp .env.example .env
# Edit .env to set your secure password (default is 'netto_password_secure')
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

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/expenses?bookId={id}` | List transactions for a specific book |
| `POST` | `/api/expenses` | Create a new transaction |
| `PUT` | `/api/expenses/:id` | Update a transaction |
| `DELETE` | `/api/expenses/:id` | Delete a transaction |
| `POST` | `/api/expenses/close-book` | Close current book (Archive + optional Carry Forward) |

### Books
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/books` | List all books |
| `POST` | `/api/books` | Create a new book |
| `PUT` | `/api/books/:id` | Rename a book |
| `DELETE` | `/api/books/:id` | Delete a book (and all its data) |

---

## License

This project is open source and available under the [MIT License](LICENSE).
