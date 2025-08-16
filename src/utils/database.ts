// Database utility functions for AI Test Application
import { Env, User, TestConfiguration, TestAttempt, Question, TestCategory } from '../types/database'
import { generateUUID } from './auth'

export class DatabaseService {
  constructor(private db: D1Database) {}

  // User operations
  async createUser(userData: {
    email: string;
    password_hash: string;
    name: string;
    age?: number;
    education_level?: string;
  }): Promise<string> {
    const id = generateUUID()
    const now = new Date().toISOString()
    
    await this.db.prepare(`
      INSERT INTO users (id, email, password_hash, name, age, education_level, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, userData.email, userData.password_hash, userData.name, 
            userData.age || null, userData.education_level || null, now, now).run()
    
    return id
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()
    return result as User | null
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()
    return result as User | null
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const fields = Object.keys(updates).filter(key => key !== 'id').map(key => `${key} = ?`).join(', ')
    const values = Object.keys(updates).filter(key => key !== 'id').map(key => updates[key as keyof User])
    values.push(new Date().toISOString()) // updated_at
    
    await this.db.prepare(`
      UPDATE users SET ${fields}, updated_at = ? WHERE id = ?
    `).bind(...values, id).run()
  }

  // Test Category operations
  async getAllTestCategories(): Promise<TestCategory[]> {
    const result = await this.db.prepare('SELECT * FROM test_categories WHERE is_active = 1 ORDER BY name').all()
    return result.results as TestCategory[]
  }

  async getTestCategoryByName(name: string): Promise<TestCategory | null> {
    const result = await this.db.prepare('SELECT * FROM test_categories WHERE name = ? AND is_active = 1').bind(name).first()
    return result as TestCategory | null
  }

  // Test Configuration operations
  async createTestConfiguration(configData: {
    user_id: string;
    test_type: string;
    difficulty: string;
    num_questions: number;
    duration_minutes: number;
    question_types: string[];
  }): Promise<string> {
    const id = generateUUID()
    const now = new Date().toISOString()
    
    await this.db.prepare(`
      INSERT INTO test_configurations (id, user_id, test_type, difficulty, num_questions, duration_minutes, question_types, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, 
      configData.user_id, 
      configData.test_type, 
      configData.difficulty, 
      configData.num_questions, 
      configData.duration_minutes,
      JSON.stringify(configData.question_types),
      now
    ).run()
    
    return id
  }

  async getTestConfiguration(id: string): Promise<TestConfiguration | null> {
    const result = await this.db.prepare('SELECT * FROM test_configurations WHERE id = ?').bind(id).first()
    return result as TestConfiguration | null
  }

  async getUserTestConfigurations(user_id: string, limit: number = 10): Promise<TestConfiguration[]> {
    const result = await this.db.prepare(`
      SELECT * FROM test_configurations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
    `).bind(user_id, limit).all()
    return result.results as TestConfiguration[]
  }

  // Test Attempt operations
  async createTestAttempt(attemptData: {
    user_id: string;
    config_id: string;
    total_questions: number;
  }): Promise<string> {
    const id = generateUUID()
    const now = new Date().toISOString()
    
    await this.db.prepare(`
      INSERT INTO test_attempts (id, user_id, config_id, total_questions, start_time, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, attemptData.user_id, attemptData.config_id, attemptData.total_questions, now, now).run()
    
    return id
  }

  async getTestAttempt(id: string): Promise<TestAttempt | null> {
    const result = await this.db.prepare('SELECT * FROM test_attempts WHERE id = ?').bind(id).first()
    return result as TestAttempt | null
  }

  async updateTestAttempt(id: string, updates: {
    score?: number;
    correct_answers?: number;
    end_time?: string;
    duration_seconds?: number;
    status?: string;
  }): Promise<void> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ')
    const values = Object.values(updates)
    
    await this.db.prepare(`UPDATE test_attempts SET ${fields} WHERE id = ?`).bind(...values, id).run()
  }

  async getUserTestAttempts(user_id: string, limit: number = 20): Promise<TestAttempt[]> {
    const result = await this.db.prepare(`
      SELECT * FROM test_attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
    `).bind(user_id, limit).all()
    return result.results as TestAttempt[]
  }

  // Question operations
  async createQuestion(questionData: {
    attempt_id: string;
    question_number: number;
    question_type: string;
    question_text: string;
    options?: string[];
    correct_answer: string;
    ai_explanation?: string;
  }): Promise<string> {
    const id = generateUUID()
    const now = new Date().toISOString()
    
    await this.db.prepare(`
      INSERT INTO questions (id, attempt_id, question_number, question_type, question_text, options, correct_answer, ai_explanation, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      questionData.attempt_id,
      questionData.question_number,
      questionData.question_type,
      questionData.question_text,
      questionData.options ? JSON.stringify(questionData.options) : null,
      questionData.correct_answer,
      questionData.ai_explanation || null,
      now
    ).run()
    
    return id
  }

  async updateQuestionAnswer(question_id: string, user_answer: string, time_spent: number): Promise<void> {
    // First get the question to check if answer is correct
    const question = await this.db.prepare('SELECT * FROM questions WHERE id = ?').bind(question_id).first() as Question
    if (!question) throw new Error('Question not found')
    
    const is_correct = this.isAnswerCorrect(question, user_answer)
    const now = new Date().toISOString()
    
    await this.db.prepare(`
      UPDATE questions SET user_answer = ?, is_correct = ?, time_spent_seconds = ?, answered_at = ? WHERE id = ?
    `).bind(user_answer, is_correct ? 1 : 0, time_spent, now, question_id).run()
  }

  async getTestQuestions(attempt_id: string): Promise<Question[]> {
    const result = await this.db.prepare(`
      SELECT * FROM questions WHERE attempt_id = ? ORDER BY question_number
    `).bind(attempt_id).all()
    return result.results as Question[]
  }

  // Helper function to determine if answer is correct
  private isAnswerCorrect(question: Question, user_answer: string): boolean {
    const correct = question.correct_answer.toLowerCase().trim()
    const user = user_answer.toLowerCase().trim()
    
    if (question.question_type === 'MCQ') {
      // For MCQ, extract just the letter (A, B, C, D)
      const correctLetter = correct.charAt(0)
      const userLetter = user.charAt(0)
      return correctLetter === userLetter
    } else if (question.question_type === 'TrueFalse') {
      return correct === user || 
             (correct === 'true' && (user === 't' || user === '1')) ||
             (correct === 'false' && (user === 'f' || user === '0'))
    } else {
      // For short answer, use basic string matching (can be enhanced with AI)
      return correct === user
    }
  }

  // Analytics and reporting
  async getTestStatistics(user_id: string): Promise<{
    total_tests: number;
    avg_score: number;
    best_score: number;
    total_questions_answered: number;
    avg_time_per_question: number;
  }> {
    const stats = await this.db.prepare(`
      SELECT 
        COUNT(*) as total_tests,
        AVG(score) as avg_score,
        MAX(score) as best_score,
        SUM(total_questions) as total_questions_answered,
        AVG(duration_seconds / total_questions) as avg_time_per_question
      FROM test_attempts 
      WHERE user_id = ? AND status = 'Completed'
    `).bind(user_id).first()
    
    return {
      total_tests: stats?.total_tests || 0,
      avg_score: stats?.avg_score || 0,
      best_score: stats?.best_score || 0,
      total_questions_answered: stats?.total_questions_answered || 0,
      avg_time_per_question: stats?.avg_time_per_question || 0
    }
  }
}