-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- UUID as text
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  education_level TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Test Configurations table
CREATE TABLE IF NOT EXISTS test_configurations (
  id TEXT PRIMARY KEY, -- UUID as text
  user_id TEXT NOT NULL,
  test_type TEXT NOT NULL, -- Math, Science, Programming, History, etc.
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  num_questions INTEGER NOT NULL CHECK (num_questions >= 10 AND num_questions <= 50),
  duration_minutes INTEGER NOT NULL,
  question_types TEXT NOT NULL, -- JSON array: ["MCQ", "TrueFalse", "ShortAnswer"]
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Test Attempts table
CREATE TABLE IF NOT EXISTS test_attempts (
  id TEXT PRIMARY KEY, -- UUID as text
  user_id TEXT NOT NULL,
  config_id TEXT NOT NULL,
  score REAL NOT NULL DEFAULT 0.0, -- Percentage score (0-100)
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_time DATETIME,
  duration_seconds INTEGER, -- Actual time taken
  status TEXT NOT NULL DEFAULT 'InProgress' CHECK (status IN ('InProgress', 'Completed', 'Abandoned')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (config_id) REFERENCES test_configurations(id) ON DELETE CASCADE
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY, -- UUID as text
  attempt_id TEXT NOT NULL,
  question_number INTEGER NOT NULL, -- Order in the test (1, 2, 3, etc.)
  question_type TEXT NOT NULL CHECK (question_type IN ('MCQ', 'TrueFalse', 'ShortAnswer')),
  question_text TEXT NOT NULL,
  options TEXT, -- JSON array for MCQ options: ["A. Option 1", "B. Option 2", ...]
  correct_answer TEXT NOT NULL,
  user_answer TEXT,
  is_correct BOOLEAN DEFAULT 0,
  ai_explanation TEXT, -- AI-generated explanation for the answer
  time_spent_seconds INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  answered_at DATETIME,
  FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE
);

-- User Sessions table (for JWT token management)
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY, -- UUID as text
  user_id TEXT NOT NULL,
  session_token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  ip_address TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Test Categories table (predefined test types and their configurations)
CREATE TABLE IF NOT EXISTS test_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- Math, Science, Programming, History, etc.
  description TEXT,
  default_difficulty TEXT DEFAULT 'Medium',
  default_duration INTEGER DEFAULT 30, -- minutes
  default_questions INTEGER DEFAULT 20,
  available_types TEXT NOT NULL, -- JSON array of available question types
  ai_prompt_template TEXT, -- Template for AI question generation
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_test_configurations_user_id ON test_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_test_configurations_type ON test_configurations(test_type);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_config_id ON test_attempts(config_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_status ON test_attempts(status);
CREATE INDEX IF NOT EXISTS idx_test_attempts_created_at ON test_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_questions_attempt_id ON questions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_questions_question_number ON questions(question_number);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_test_categories_name ON test_categories(name);
CREATE INDEX IF NOT EXISTS idx_test_categories_active ON test_categories(is_active);