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
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
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

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Uncomment below to insert sample data:

/*
-- Sample board
INSERT INTO boards (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'My First Board');

-- Sample lists
INSERT INTO lists (board_id, name, position) VALUES
  ('11111111-1111-1111-1111-111111111111', 'To Do', 0),
  ('11111111-1111-1111-1111-111111111111', 'In Progress', 1),
  ('11111111-1111-1111-1111-111111111111', 'Done', 2);

-- Sample cards (get list IDs from above inserts)
INSERT INTO cards (list_id, title, description, position) VALUES
  ((SELECT id FROM lists WHERE name = 'To Do' LIMIT 1), 'First task', 'This is my first task', 0),
  ((SELECT id FROM lists WHERE name = 'To Do' LIMIT 1), 'Second task', 'This is my second task', 1),
  ((SELECT id FROM lists WHERE name = 'In Progress' LIMIT 1), 'Working on this', 'Currently in progress', 0);
*/
