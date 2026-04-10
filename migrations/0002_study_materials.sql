CREATE TABLE IF NOT EXISTS study_materials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  extracted_text TEXT NOT NULL,
  summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_study_materials_user_id ON study_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_created_at ON study_materials(created_at);
