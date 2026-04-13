CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  education_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_configurations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  num_questions INTEGER NOT NULL CHECK (num_questions >= 10 AND num_questions <= 50),
  duration_minutes INTEGER NOT NULL,
  question_types TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  config_id TEXT NOT NULL REFERENCES test_configurations(id) ON DELETE CASCADE,
  score REAL NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'InProgress' CHECK (status IN ('InProgress', 'Completed', 'Abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('MCQ', 'TrueFalse', 'ShortAnswer')),
  question_text TEXT NOT NULL,
  options TEXT,
  correct_answer TEXT NOT NULL,
  user_answer TEXT,
  is_correct BOOLEAN DEFAULT FALSE,
  ai_explanation TEXT,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT
);

CREATE TABLE IF NOT EXISTS test_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  default_difficulty TEXT DEFAULT 'Medium',
  default_duration INTEGER DEFAULT 30,
  default_questions INTEGER DEFAULT 20,
  available_types TEXT NOT NULL,
  ai_prompt_template TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_test_configurations_user_id ON test_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_attempt_id ON questions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_test_categories_name ON test_categories(name);
CREATE INDEX IF NOT EXISTS idx_study_materials_user_id ON study_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_created_at ON study_materials(created_at);
CREATE INDEX IF NOT EXISTS idx_study_materials_processing_status ON study_materials(processing_status);
CREATE INDEX IF NOT EXISTS idx_study_material_chunks_material_id ON study_material_chunks(material_id);
CREATE INDEX IF NOT EXISTS idx_study_material_chunks_chunk_index ON study_material_chunks(material_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_material_test_links_material_id ON material_test_links(material_id);
CREATE INDEX IF NOT EXISTS idx_material_test_links_attempt_id ON material_test_links(test_attempt_id);
