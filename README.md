# Trello MVP

A minimally viable Trello clone built with React, TypeScript, and Supabase.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL + REST API)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-key-here
```

### 3. Run Development Server

```bash
npm run dev
```

## Project Structure

```
src/
├── lib/supabase.ts       # Supabase client
├── types/index.ts        # TypeScript interfaces
├── components/           # React components (shells)
│   ├── Board.tsx
│   ├── List.tsx
│   └── Card.tsx
└── App.tsx               # Root component
```
