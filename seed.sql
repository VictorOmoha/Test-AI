-- Insert default test categories
INSERT OR IGNORE INTO test_categories (id, name, description, default_difficulty, default_duration, default_questions, available_types, ai_prompt_template) VALUES 
  (
    'cat_math',
    'Mathematics',
    'Mathematical concepts including algebra, geometry, calculus, and statistics',
    'Medium',
    30,
    20,
    '["MCQ", "ShortAnswer"]',
    'Generate {num_questions} {difficulty}-level mathematics questions covering {topic_focus}. Include problems on algebra, geometry, and basic calculus. Format each question as: {question: "question text", type: "{question_type}", options: ["A. option1", "B. option2", "C. option3", "D. option4"], correct_answer: "A", explanation: "detailed explanation"}'
  ),
  (
    'cat_science',
    'Science',
    'General science covering physics, chemistry, biology, and earth science',
    'Medium',
    30,
    20,
    '["MCQ", "TrueFalse", "ShortAnswer"]',
    'Generate {num_questions} {difficulty}-level science questions covering {topic_focus}. Include questions from physics, chemistry, biology, and earth science. Format each question as: {question: "question text", type: "{question_type}", options: ["A. option1", "B. option2", "C. option3", "D. option4"], correct_answer: "A", explanation: "detailed explanation"}'
  ),
  (
    'cat_programming',
    'Programming',
    'Computer programming concepts, algorithms, and software development',
    'Medium',
    45,
    15,
    '["MCQ", "ShortAnswer"]',
    'Generate {num_questions} {difficulty}-level programming questions covering {topic_focus}. Include questions about algorithms, data structures, programming languages (JavaScript, Python, Java), and software engineering concepts. Format each question as: {question: "question text", type: "{question_type}", options: ["A. option1", "B. option2", "C. option3", "D. option4"], correct_answer: "A", explanation: "detailed explanation with code examples if applicable"}'
  ),
  (
    'cat_history',
    'History',
    'World history, civilizations, and historical events',
    'Medium',
    30,
    25,
    '["MCQ", "TrueFalse", "ShortAnswer"]',
    'Generate {num_questions} {difficulty}-level history questions covering {topic_focus}. Include questions about world history, major civilizations, important events, and historical figures. Format each question as: {question: "question text", type: "{question_type}", options: ["A. option1", "B. option2", "C. option3", "D. option4"], correct_answer: "A", explanation: "detailed historical context and explanation"}'
  ),
  (
    'cat_english',
    'English Language',
    'Grammar, vocabulary, reading comprehension, and writing skills',
    'Medium',
    30,
    20,
    '["MCQ", "TrueFalse", "ShortAnswer"]',
    'Generate {num_questions} {difficulty}-level English language questions covering {topic_focus}. Include grammar, vocabulary, reading comprehension, and language usage questions. Format each question as: {question: "question text", type: "{question_type}", options: ["A. option1", "B. option2", "C. option3", "D. option4"], correct_answer: "A", explanation: "detailed grammar or language explanation"}'
  ),
  (
    'cat_general',
    'General Knowledge',
    'Mixed topics including current events, geography, culture, and trivia',
    'Medium',
    25,
    30,
    '["MCQ", "TrueFalse"]',
    'Generate {num_questions} {difficulty}-level general knowledge questions covering {topic_focus}. Include geography, current events, culture, sports, entertainment, and general trivia. Format each question as: {question: "question text", type: "{question_type}", options: ["A. option1", "B. option2", "C. option3", "D. option4"], correct_answer: "A", explanation: "informative explanation with context"}'
  );

-- Insert a demo user for testing (password: "demo123" - bcrypt hashed)
INSERT OR IGNORE INTO users (id, email, password_hash, name, age, education_level) VALUES 
  (
    'user_demo_001',
    'demo@testapp.dev',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Demo User',
    25,
    'Bachelor''s Degree'
  );