// Database type definitions for AI Test Application

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  age?: number;
  education_level?: string;
  created_at: string;
  updated_at: string;
}

export interface TestConfiguration {
  id: string;
  user_id: string;
  test_type: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  num_questions: number;
  duration_minutes: number;
  question_types: string; // JSON array
  created_at: string;
}

export interface TestAttempt {
  id: string;
  user_id: string;
  config_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  status: 'InProgress' | 'Completed' | 'Abandoned';
  created_at: string;
}

export interface Question {
  id: string;
  attempt_id: string;
  question_number: number;
  question_type: 'MCQ' | 'TrueFalse' | 'ShortAnswer';
  question_text: string;
  options?: string; // JSON array for MCQ
  correct_answer: string;
  user_answer?: string;
  is_correct: boolean;
  ai_explanation?: string;
  time_spent_seconds: number;
  created_at: string;
  answered_at?: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  created_at: string;
  last_accessed: string;
  user_agent?: string;
  ip_address?: string;
}

export interface TestCategory {
  id: string;
  name: string;
  description?: string;
  default_difficulty: 'Easy' | 'Medium' | 'Hard';
  default_duration: number;
  default_questions: number;
  available_types: string; // JSON array
  ai_prompt_template: string;
  is_active: boolean;
  created_at: string;
}

// API Request/Response types
export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  age?: number;
  education_level?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: Omit<User, 'password_hash'>;
  token?: string;
  message?: string;
}

export interface CreateTestConfigRequest {
  test_type: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  num_questions: number;
  duration_minutes: number;
  question_types: ('MCQ' | 'TrueFalse' | 'ShortAnswer')[];
}

export interface StartTestRequest {
  config_id: string;
}

export interface SubmitAnswerRequest {
  question_id: string;
  user_answer: string;
  time_spent_seconds: number;
}

export interface TestResultsResponse {
  attempt: TestAttempt;
  questions: Question[];
  config: TestConfiguration;
  performance_analytics: {
    average_time_per_question: number;
    fastest_question: number;
    slowest_question: number;
    correct_by_type: Record<string, number>;
    total_by_type: Record<string, number>;
  };
}

// Runtime environment bindings / vars
export interface Env {
  DATABASE_URL?: string;
  OPENAI_API_KEY?: string;
  JWT_SECRET?: string;
}

export interface StudyMaterial {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  file_type: string;
  extracted_text: string;
  summary?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStudyMaterialRequest {
  title?: string;
  file_name: string;
  mime_type?: string;
  file_content_base64: string;
}

export interface GenerateStudyTestRequest {
  material_id: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  num_questions: number;
  question_types: ('MCQ' | 'TrueFalse' | 'ShortAnswer')[];
  topic_focus?: string;
  use_web_sources?: boolean;
}

// AI Question Generation types
export interface AIQuestionRequest {
  test_type: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  num_questions: number;
  question_types: ('MCQ' | 'TrueFalse' | 'ShortAnswer')[];
  topic_focus?: string;
}

export interface GeneratedQuestion {
  question: string;
  type: 'MCQ' | 'TrueFalse' | 'ShortAnswer';
  options?: string[];
  correct_answer: string;
  explanation: string;
}

export interface AIGenerationResponse {
  success: boolean;
  questions?: GeneratedQuestion[];
  error?: string;
  tokens_used?: number;
  cost_estimate?: number;
}