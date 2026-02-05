# Trello MVP

A minimally viable Trello clone built with React, TypeScript, and Supabase.

## Features

- **Multiple Boards**: Create, switch, delete boards with per-board backgrounds
- **Drag & Drop**: Reorder lists and cards, move cards across lists (dnd-kit)
- **Lists**: Add, rename, delete, collapse/expand, sort by story points or due date
- **Cards**: Add, edit, delete with modal detail view
- **Card Details**: Description, checklist with progress bar, story points, due dates
- **Labels**: Colored tags with editable names, shared across all cards
- **Persistence**: All data stored in Supabase (PostgreSQL + JSONB for checklists)
- **Optimistic Updates**: Instant UI feedback with rollback on errors

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL + REST API)
- **Styling**: CSS (no frameworks)

## Getting Started

### Quick Start

```bash
git clone https://github.com/zachsevart/Trello-MVP.git
cd Trello-MVP
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

> **Note:** Supabase credentials are included in `.env` for demo purposes. In production, API keys should never be committed to public repositories.

## Project Structure

```
src/
├── lib/supabase.ts          # Supabase client
├── types/index.ts           # TypeScript interfaces
├── hooks/                   # Data fetching & state
│   ├── useBoard.ts          # Board CRUD, switching
│   ├── useLists.ts          # List CRUD, reordering
│   ├── useBoardCards.ts     # Card CRUD, cross-list drag
│   └── useLabels.ts         # Labels & card-label associations
├── components/              # React components
│   ├── Board.tsx            # Main container, DnD context
│   ├── List.tsx             # List column with sorting
│   ├── Card.tsx             # Card display & menus
│   ├── CardModal.tsx        # Card detail modal
│   ├── SortableList.tsx     # DnD wrapper for lists
│   ├── SortableCard.tsx     # DnD wrapper for cards
│   ├── AddList.tsx          # New list form
│   └── AddCard.tsx          # New card form
└── App.tsx
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
