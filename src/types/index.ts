// Core data types for the Trello MVP

export interface Board {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface List {
  id: string;
  board_id: string;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  list_id: string;
  title: string;
  description: string;
  position: number;
  created_at: string;
  updated_at: string;
}
