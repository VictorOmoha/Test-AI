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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_test_configurations_user_id ON test_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_attempt_id ON questions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_test_categories_name ON test_categories(name);
