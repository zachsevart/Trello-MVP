# Trello MVP

A minimally viable Trello clone built with React, TypeScript, and Supabase.

## Features

- **Boards**: Editable board name, board switcher UI
- **Lists**: Add, rename, delete, collapse/expand
- **Cards**: Add, edit title, delete
- **Move Cards**: Transfer cards between lists
- **Card Fields**: Story points, due dates (with overdue highlighting)
- **Labels**: Colored tags with toggle on/off per card
- **Persistence**: All data stored in Supabase (PostgreSQL)

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL + REST API)
- **Styling**: CSS (no frameworks)

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account

### 1. Clone and Install

```bash
git clone <repo-url>
cd Trello-MVP
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL from `supabase/schema.sql` in the SQL Editor
3. Copy your project URL and publishable key from Settings > API

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-key-here
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Project Structure

```
src/
├── lib/supabase.ts       # Supabase client
├── types/index.ts        # TypeScript interfaces
├── hooks/                # Data fetching & state
│   ├── useBoard.ts
│   ├── useLists.ts
│   ├── useCards.ts
│   └── useLabels.ts
├── components/           # React components
│   ├── Board.tsx
│   ├── List.tsx
│   ├── Card.tsx
│   ├── AddList.tsx
│   └── AddCard.tsx
└── App.tsx
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
