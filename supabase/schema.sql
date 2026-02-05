-- Trello MVP Database Schema for Supabase

-- ============================================
-- TABLES
-- ============================================

-- Boards table
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Lists table
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_collapsed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Cards table
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '' NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  story_points INTEGER DEFAULT NULL,
  due_date DATE DEFAULT NULL,
  is_complete BOOLEAN DEFAULT FALSE NOT NULL,
  checklist JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Labels table
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name TEXT DEFAULT '' NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Card-Label junction table (many-to-many)
CREATE TABLE card_labels (
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Index for faster list lookups by board
CREATE INDEX idx_lists_board_id ON lists(board_id);

-- Index for ordering lists within a board
CREATE INDEX idx_lists_position ON lists(board_id, position);

-- Index for faster card lookups by list
CREATE INDEX idx_cards_list_id ON cards(list_id);

-- Index for ordering cards within a list
CREATE INDEX idx_cards_position ON cards(list_id, position);

-- Index for faster label lookups by board
CREATE INDEX idx_labels_board_id ON labels(board_id);

-- Indexes for card_labels junction table
CREATE INDEX idx_card_labels_card_id ON card_labels(card_id);
CREATE INDEX idx_card_labels_label_id ON card_labels(label_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at for boards
CREATE TRIGGER trigger_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for lists
CREATE TRIGGER trigger_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for cards
CREATE TRIGGER trigger_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Note: These policies allow public access for MVP.
-- For production, you should add user authentication
-- and restrict access based on user ownership.

-- Enable RLS on all tables
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_labels ENABLE ROW LEVEL SECURITY;

-- Boards policies (public access for MVP)
CREATE POLICY "Allow public read access on boards"
  ON boards FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on boards"
  ON boards FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access on boards"
  ON boards FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access on boards"
  ON boards FOR DELETE
  USING (true);

-- Lists policies (public access for MVP)
CREATE POLICY "Allow public read access on lists"
  ON lists FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on lists"
  ON lists FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access on lists"
  ON lists FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access on lists"
  ON lists FOR DELETE
  USING (true);

-- Cards policies (public access for MVP)
CREATE POLICY "Allow public read access on cards"
  ON cards FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on cards"
  ON cards FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access on cards"
  ON cards FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access on cards"
  ON cards FOR DELETE
  USING (true);

-- Labels policies (public access for MVP)
CREATE POLICY "Allow public read access on labels"
  ON labels FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on labels"
  ON labels FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access on labels"
  ON labels FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access on labels"
  ON labels FOR DELETE
  USING (true);

-- Card_labels policies (public access for MVP)
CREATE POLICY "Allow public read access on card_labels"
  ON card_labels FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on card_labels"
  ON card_labels FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public delete access on card_labels"
  ON card_labels FOR DELETE
  USING (true);

-- ============================================
-- MIGRATION: Run these if you have an existing database
-- ============================================

-- Add missing card fields
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS story_points INTEGER DEFAULT NULL;
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS due_date DATE DEFAULT NULL;
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT FALSE NOT NULL;
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb NOT NULL;

-- Create labels table (if not exists)
-- CREATE TABLE IF NOT EXISTS labels (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
--   name TEXT DEFAULT '' NOT NULL,
--   color TEXT NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
-- );

-- Create card_labels junction table (if not exists)
-- CREATE TABLE IF NOT EXISTS card_labels (
--   card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
--   label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
--   PRIMARY KEY (card_id, label_id)
-- );

-- Enable RLS on new tables
-- ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE card_labels ENABLE ROW LEVEL SECURITY;

-- Labels policies
-- CREATE POLICY "Allow public read access on labels" ON labels FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert access on labels" ON labels FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public update access on labels" ON labels FOR UPDATE USING (true);
-- CREATE POLICY "Allow public delete access on labels" ON labels FOR DELETE USING (true);

-- Card_labels policies
-- CREATE POLICY "Allow public read access on card_labels" ON card_labels FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert access on card_labels" ON card_labels FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public delete access on card_labels" ON card_labels FOR DELETE USING (true);

