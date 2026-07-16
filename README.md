# Netto Spendo

A modern expense tracker built with Next.js and Firebase — track income and expenses across multiple books with interactive charts and label-based categorization.

## Features

- **Dual Transaction Tracking** — log expenses and income; real-time net balance
- **Interactive Charts** — weekly/monthly/yearly spending trends with expense/income comparison (bar chart) and label breakdown (pie chart)
- **Book Management (Buku Kas)** — create, rename, close books; carry forward balance on close
- **Label-based Categorization** — create/manage labels with custom colors, filter expenses by label
- **Dark Minimalist UI** — responsive design, works on desktop and mobile

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Firebase Firestore
- **Auth**: Firebase Auth (optional, currently client-only)
- **Charts**: Chart.js via react-chartjs-2
- **Styling**: CSS Modules (globals.css)

## Getting Started

1. Clone the repo
2. Create a Firebase project and enable Firestore
3. Copy your Firebase config into `src/lib/firebase.ts`
4. Install dependencies and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/            # Next.js App Router pages/layouts
├── components/     # React components (ExpenseForm, SpendingChart, etc.)
├── hooks/          # useExpenses — all Firestore CRUD + state
├── lib/            # Firebase client init
└── types/          # TypeScript types (Expense, Book, Label)
```
