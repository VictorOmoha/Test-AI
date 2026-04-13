import { Pool, neon } from '@neondatabase/serverless'
import { User, TestConfiguration, TestAttempt, Question, TestCategory, StudyMaterial, StudyMaterialChunk } from '../types/database'
import { generateUUID } from './auth'

export interface SqlLike {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>
}

function normalizeBool(value: any): boolean {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 't'
}

function mapQuestion(row: any): Question {
  return {
    ...row,
    is_correct: normalizeBool(row.is_correct),
    time_spent_seconds: Number(row.time_spent_seconds || 0)
  } as Question
}

export class DatabaseService {
  constructor(private db: SqlLike) {}

  static fromDatabaseUrl(databaseUrl?: string): DatabaseService {
    if (!databaseUrl) throw new Error('DATABASE_URL is not configured')
    // Use Neon HTTP driver for serverless — avoids TCP cold-start latency
    const sql = neon(databaseUrl)
    const httpAdapter: SqlLike = {
      async query(text: string, params: any[] = []) {
        const rows = await sql(text, params)
        return { rows: rows as any[] }
      }
    }
    return new DatabaseService(httpAdapter)
  }

  async rawQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
    const result = await this.db.query(query, params)
    return result.rows as T[]
  }

  async createUser(userData: {
    email: string;
    password_hash: string;
    name: string;
    age?: number;
    education_level?: string;
  }): Promise<string> {
    const id = generateUUID()
    const now = new Date().toISOString()

    await this.db.query(
      `INSERT INTO users (id, email, password_hash, name, age, education_level, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, userData.email, userData.password_hash, userData.name, userData.age || null, userData.education_level || null, now, now]
    )

    return id
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.db.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email])
    return (result.rows[0] as User) || null
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.db.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id])
    return (result.rows[0] as User) || null
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const keys = Object.keys(updates).filter(key => key !== 'id')
    if (keys.length === 0) return

    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ')
    const values = keys.map(key => (updates as any)[key])
    values.push(new Date().toISOString(), id)

    await this.db.query(
      `UPDATE users SET ${setClause}, updated_at = $${keys.length + 1} WHERE id = $${keys.length + 2}`,
      values
    )
  }

  async getAllTestCategories(): Promise<TestCategory[]> {
    const result = await this.db.query('SELECT * FROM test_categories WHERE is_active = true ORDER BY name')
    return result.rows as TestCategory[]
  }

  async getTestCategoryByName(name: string): Promise<TestCategory | null> {
    const result = await this.db.query(
      'SELECT * FROM test_categories WHERE name = $1 AND is_active = true LIMIT 1',
      [name]
    )
    return (result.rows[0] as TestCategory) || null
  }

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

    await this.db.query(
      `INSERT INTO test_configurations (id, user_id, test_type, difficulty, num_questions, duration_minutes, question_types, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, configData.user_id, configData.test_type, configData.difficulty, configData.num_questions, configData.duration_minutes, JSON.stringify(configData.question_types), now]
    )

    return id
  }

  async getTestConfiguration(id: string): Promise<TestConfiguration | null> {
    const result = await this.db.query('SELECT * FROM test_configurations WHERE id = $1 LIMIT 1', [id])
    return (result.rows[0] as TestConfiguration) || null
  }

  async getUserTestConfigurations(user_id: string, limit: number = 10): Promise<TestConfiguration[]> {
    const result = await this.db.query(
      'SELECT * FROM test_configurations WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [user_id, limit]
    )
    return result.rows as TestConfiguration[]
  }

  async createTestAttempt(attemptData: {
    user_id: string;
    config_id: string;
    total_questions: number;
  }): Promise<string> {
    const id = generateUUID()
    const now = new Date().toISOString()

    await this.db.query(
      `INSERT INTO test_attempts (id, user_id, config_id, total_questions, start_time, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, attemptData.user_id, attemptData.config_id, attemptData.total_questions, now, now]
    )

    return id
  }

  async getTestAttempt(id: string): Promise<TestAttempt | null> {
    const result = await this.db.query('SELECT * FROM test_attempts WHERE id = $1 LIMIT 1', [id])
    return (result.rows[0] as TestAttempt) || null
  }

  async updateTestAttempt(id: string, updates: {
    score?: number;
    correct_answers?: number;
    end_time?: string;
    duration_seconds?: number;
    status?: string;
  }): Promise<void> {
    const keys = Object.keys(updates)
    if (keys.length === 0) return

    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ')
    const values = keys.map(key => (updates as any)[key])
    values.push(id)

    await this.db.query(`UPDATE test_attempts SET ${setClause} WHERE id = $${keys.length + 1}`, values)
  }

  async getUserTestAttempts(user_id: string, limit: number = 20): Promise<any[]> {
    const result = await this.db.query(
      `SELECT ta.*, tc.test_type, tc.difficulty
       FROM test_attempts ta
       LEFT JOIN test_configurations tc ON tc.id = ta.config_id
       WHERE ta.user_id = $1
       ORDER BY ta.created_at DESC
       LIMIT $2`,
      [user_id, limit]
    )
    return result.rows
  }

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

    await this.db.query(
      `INSERT INTO questions (id, attempt_id, question_number, question_type, question_text, options, correct_answer, ai_explanation, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, questionData.attempt_id, questionData.question_number, questionData.question_type, questionData.question_text, questionData.options ? JSON.stringify(questionData.options) : null, questionData.correct_answer, questionData.ai_explanation || null, now]
    )

    return id
  }

  async updateQuestionAnswer(question_id: string, user_answer: string, time_spent: number): Promise<void> {
    const question = await this.getQuestionById(question_id)
    if (!question) throw new Error('Question not found')

    const is_correct = this.isAnswerCorrect(question, user_answer)
    const now = new Date().toISOString()

    await this.db.query(
      `UPDATE questions
       SET user_answer = $1, is_correct = $2, time_spent_seconds = $3, answered_at = $4
       WHERE id = $5`,
      [user_answer, is_correct, time_spent, now, question_id]
    )
  }

  async getQuestionById(id: string): Promise<Question | null> {
    const result = await this.db.query('SELECT * FROM questions WHERE id = $1 LIMIT 1', [id])
    return result.rows[0] ? mapQuestion(result.rows[0]) : null
  }

  async getTestQuestions(attempt_id: string): Promise<Question[]> {
    const result = await this.db.query(
      'SELECT * FROM questions WHERE attempt_id = $1 ORDER BY question_number',
      [attempt_id]
    )
    return result.rows.map(mapQuestion)
  }

  private isAnswerCorrect(question: Question, user_answer: string): boolean {
    const correct = question.correct_answer.toLowerCase().trim()
    const user = user_answer.toLowerCase().trim()

    if (question.question_type === 'MCQ') {
      return correct.charAt(0) === user.charAt(0)
    }

    if (question.question_type === 'TrueFalse') {
      return correct === user ||
        (correct === 'true' && (user === 't' || user === '1')) ||
        (correct === 'false' && (user === 'f' || user === '0'))
    }

    return correct === user
  }

  async createStudyMaterial(material: {
    user_id: string;
    title: string;
    file_name: string;
    file_type: string;
    mime_type?: string;
    file_size_bytes?: number;
    source_kind?: 'upload' | 'note' | 'url';
    material_type?: 'notes' | 'pdf' | 'slide' | 'doc' | 'other';
    processing_status?: 'pending' | 'ready' | 'failed';
    error_message?: string;
    extracted_text: string;
    summary?: string;
  }): Promise<string> {
    const id = generateUUID()
    const now = new Date().toISOString()

    await this.db.query(
      `INSERT INTO study_materials (
        id, user_id, title, file_name, file_type, mime_type, file_size_bytes, source_kind,
        material_type, processing_status, error_message, extracted_text, summary, created_at, updated_at
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        id,
        material.user_id,
        material.title,
        material.file_name,
        material.file_type,
        material.mime_type || null,
        material.file_size_bytes || null,
        material.source_kind || 'upload',
        material.material_type || 'other',
        material.processing_status || 'ready',
        material.error_message || null,
        material.extracted_text,
        material.summary || null,
        now,
        now
      ]
    )

    return id
  }

  async updateStudyMaterialReady(id: string, data: { extracted_text: string; summary: string; file_type: string }): Promise<void> {
    const now = new Date().toISOString()
    await this.db.query(
      `UPDATE study_materials SET processing_status = 'ready', extracted_text = $1, summary = $2, file_type = $3, updated_at = $4 WHERE id = $5`,
      [data.extracted_text, data.summary, data.file_type, now, id]
    )
  }

  async updateStudyMaterialFailed(id: string, errorMessage: string): Promise<void> {
    const now = new Date().toISOString()
    await this.db.query(
      `UPDATE study_materials SET processing_status = 'failed', error_message = $1, updated_at = $2 WHERE id = $3`,
      [errorMessage, now, id]
    )
  }

  async createStudyMaterialChunks(material_id: string, chunks: Array<{ content: string; token_count?: number }>): Promise<void> {
    if (!chunks.length) return

    const now = new Date().toISOString()
    const values: any[] = []
    const placeholders = chunks.map((chunk, index) => {
      const base = index * 6
      values.push(generateUUID(), material_id, index + 1, chunk.content, chunk.token_count || null, now)
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
    })

    await this.db.query(
      `INSERT INTO study_material_chunks (id, material_id, chunk_index, content, token_count, created_at)
       VALUES ${placeholders.join(', ')}`,
      values
    )
  }

  async getStudyMaterialChunks(material_id: string): Promise<StudyMaterialChunk[]> {
    const result = await this.db.query(
      'SELECT * FROM study_material_chunks WHERE material_id = $1 ORDER BY chunk_index ASC',
      [material_id]
    )
    return result.rows as StudyMaterialChunk[]
  }

  async createMaterialTestLink(material_id: string, test_configuration_id: string, test_attempt_id: string): Promise<void> {
    await this.db.query(
      `INSERT INTO material_test_links (id, material_id, test_configuration_id, test_attempt_id, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [generateUUID(), material_id, test_configuration_id, test_attempt_id, new Date().toISOString()]
    )
  }

  async getMaterialByAttemptId(test_attempt_id: string): Promise<Pick<StudyMaterial, 'id' | 'title' | 'file_name'> | null> {
    const result = await this.db.query(
      `SELECT sm.id, sm.title, sm.file_name
       FROM material_test_links mtl
       INNER JOIN study_materials sm ON sm.id = mtl.material_id
       WHERE mtl.test_attempt_id = $1
       ORDER BY mtl.created_at DESC
       LIMIT 1`,
      [test_attempt_id]
    )
    return (result.rows[0] as Pick<StudyMaterial, 'id' | 'title' | 'file_name'>) || null
  }

  async getStudyMaterialById(id: string): Promise<StudyMaterial | null> {
    const result = await this.db.query('SELECT * FROM study_materials WHERE id = $1 LIMIT 1', [id])
    return (result.rows[0] as StudyMaterial) || null
  }

  async getUserStudyMaterials(user_id: string, limit: number = 20): Promise<StudyMaterial[]> {
    const result = await this.db.query(
      `SELECT sm.*, COALESCE(chunk_counts.chunk_count, 0)::int AS chunk_count
       FROM study_materials sm
       LEFT JOIN (
         SELECT material_id, COUNT(*) AS chunk_count
         FROM study_material_chunks
         GROUP BY material_id
       ) chunk_counts ON chunk_counts.material_id = sm.id
       WHERE sm.user_id = $1
       ORDER BY sm.created_at DESC
       LIMIT $2`,
      [user_id, limit]
    )
    return result.rows as StudyMaterial[]
  }

  async searchStudyMaterialChunks(material_id: string, query: string, limit: number = 4): Promise<StudyMaterialChunk[]> {
    const normalizedTerms = query
      .toLowerCase()
      .split(/\W+/)
      .map(term => term.trim())
      .filter(term => term.length >= 3)
      .slice(0, 8)

    const chunks = await this.getStudyMaterialChunks(material_id)
    if (normalizedTerms.length === 0) {
      return chunks.slice(0, limit)
    }

    const scored = chunks
      .map(chunk => {
        const text = chunk.content.toLowerCase()
        const score = normalizedTerms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0)
        return { chunk, score }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || a.chunk.chunk_index - b.chunk.chunk_index)

    return (scored.length > 0 ? scored.map(item => item.chunk) : chunks).slice(0, limit)
  }

  async getTestStatistics(user_id: string): Promise<{
    total_tests: number;
    avg_score: number;
    best_score: number;
    total_questions_answered: number;
    avg_time_per_question: number;
  }> {
    const result = await this.db.query(
      `SELECT
         COUNT(*)::int as total_tests,
         COALESCE(AVG(score), 0) as avg_score,
         COALESCE(MAX(score), 0) as best_score,
         COALESCE(SUM(total_questions), 0)::int as total_questions_answered,
         COALESCE(AVG(CASE WHEN total_questions > 0 THEN duration_seconds::float / total_questions ELSE 0 END), 0) as avg_time_per_question
       FROM test_attempts
       WHERE user_id = $1 AND status = 'Completed'`,
      [user_id]
    )

    const stats: any = result.rows[0] || {}

    return {
      total_tests: Number(stats.total_tests || 0),
      avg_score: Number(stats.avg_score || 0),
      best_score: Number(stats.best_score || 0),
      total_questions_answered: Number(stats.total_questions_answered || 0),
      avg_time_per_question: Number(stats.avg_time_per_question || 0)
    }
  }
}
