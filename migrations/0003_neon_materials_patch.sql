-- Safe-ish Neon patch for material-based study workflow
-- Use this on an existing Postgres/Neon database that already has the base TestAI schema.
-- It adds the material workflow tables and indexes if they are missing.

CREATE TABLE IF NOT EXISTS study_materials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT,
  file_size_bytes INTEGER,
  source_kind TEXT DEFAULT 'upload' CHECK (source_kind IN ('upload', 'note', 'url')),
  material_type TEXT DEFAULT 'other' CHECK (material_type IN ('notes', 'pdf', 'slide', 'doc', 'other')),
  processing_status TEXT DEFAULT 'ready' CHECK (processing_status IN ('pending', 'ready', 'failed')),
  error_message TEXT,
  extracted_text TEXT NOT NULL,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS file_size_bytes INTEGER;
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS source_kind TEXT DEFAULT 'upload';
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS material_type TEXT DEFAULT 'other';
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'ready';
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS study_material_chunks (
  id TEXT PRIMARY KEY,
  material_id TEXT NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS material_test_links (
  id TEXT PRIMARY KEY,
  material_id TEXT NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  test_configuration_id TEXT NOT NULL REFERENCES test_configurations(id) ON DELETE CASCADE,
  test_attempt_id TEXT NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_materials_user_id ON study_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_created_at ON study_materials(created_at);
CREATE INDEX IF NOT EXISTS idx_study_materials_processing_status ON study_materials(processing_status);
CREATE INDEX IF NOT EXISTS idx_study_material_chunks_material_id ON study_material_chunks(material_id);
CREATE INDEX IF NOT EXISTS idx_study_material_chunks_chunk_index ON study_material_chunks(material_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_material_test_links_material_id ON material_test_links(material_id);
CREATE INDEX IF NOT EXISTS idx_material_test_links_attempt_id ON material_test_links(test_attempt_id);

-- Optional verification queries to run manually after applying:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('study_materials', 'study_material_chunks', 'material_test_links');
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'study_materials' ORDER BY ordinal_position;
