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
  is_collapsed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Card {
  id: string;
  list_id: string;
  title: string;
  description: string;
  position: number;
  story_points?: number | null;
  due_date?: string | null;
  is_complete?: boolean;
  checklist?: ChecklistItem[];
  created_at: string;
  updated_at: string;
}

export interface Label {
  id: string;
  board_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface CardLabel {
  card_id: string;
  label_id: string;
}
