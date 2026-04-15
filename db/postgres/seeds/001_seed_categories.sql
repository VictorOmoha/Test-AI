INSERT INTO test_categories (
  id,
  name,
  description,
  default_difficulty,
  default_duration,
  default_questions,
  available_types,
  ai_prompt_template
)
VALUES
  ('cat_math', 'Mathematics', 'Mathematical concepts including algebra, geometry, calculus, and statistics', 'Medium', 30, 20, '["MCQ", "ShortAnswer"]', 'Generate {num_questions} {difficulty}-level mathematics questions covering {topic_focus}. Include problems on algebra, geometry, and basic calculus.'),
  ('cat_science', 'Science', 'General science covering physics, chemistry, biology, and earth science', 'Medium', 30, 20, '["MCQ", "TrueFalse", "ShortAnswer"]', 'Generate {num_questions} {difficulty}-level science questions covering {topic_focus}.'),
  ('cat_programming', 'Programming', 'Computer programming concepts, algorithms, and software development', 'Medium', 45, 15, '["MCQ", "ShortAnswer"]', 'Generate {num_questions} {difficulty}-level programming questions covering {topic_focus}.'),
  ('cat_history', 'History', 'World history, civilizations, and historical events', 'Medium', 30, 25, '["MCQ", "TrueFalse", "ShortAnswer"]', 'Generate {num_questions} {difficulty}-level history questions covering {topic_focus}.'),
  ('cat_english', 'English Language', 'Grammar, vocabulary, reading comprehension, and writing skills', 'Medium', 30, 20, '["MCQ", "TrueFalse", "ShortAnswer"]', 'Generate {num_questions} {difficulty}-level English language questions covering {topic_focus}.'),
  ('cat_general', 'General Knowledge', 'Mixed topics including current events, geography, culture, and trivia', 'Medium', 25, 30, '["MCQ", "TrueFalse"]', 'Generate {num_questions} {difficulty}-level general knowledge questions covering {topic_focus}.')
ON CONFLICT (id) DO NOTHING;
