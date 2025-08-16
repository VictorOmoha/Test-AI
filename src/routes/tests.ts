// Test management routes for AI Test Application
import { Hono } from 'hono'
import { Env, CreateTestConfigRequest, StartTestRequest, SubmitAnswerRequest } from '../types/database'
import { DatabaseService } from '../utils/database'
import { AIService } from '../services/ai'
import { authMiddleware, getAuthUser } from '../middleware/auth'
import { generateUUID } from '../utils/auth'

const tests = new Hono<{ Bindings: Env }>()

// Get all available test categories
tests.get('/categories', async (c) => {
  try {
    const db = new DatabaseService(c.env.DB)
    const categories = await db.getAllTestCategories()
    
    return c.json({
      success: true,
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        default_difficulty: cat.default_difficulty,
        default_duration: cat.default_duration,
        default_questions: cat.default_questions,
        available_types: JSON.parse(cat.available_types)
      }))
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return c.json({ success: false, message: 'Failed to fetch test categories' }, 500)
  }
})

// Create test configuration
tests.post('/config', authMiddleware, async (c) => {
  try {
    const auth = getAuthUser(c)
    if (!auth) {
      return c.json({ success: false, message: 'Authentication required' }, 401)
    }

    const body: CreateTestConfigRequest = await c.req.json()
    const { test_type, difficulty, num_questions, duration_minutes, question_types } = body

    // Validation
    if (!test_type || !difficulty || !num_questions || !duration_minutes || !question_types) {
      return c.json({ success: false, message: 'All fields are required' }, 400)
    }

    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return c.json({ success: false, message: 'Invalid difficulty level' }, 400)
    }

    if (num_questions < 10 || num_questions > 50) {
      return c.json({ success: false, message: 'Number of questions must be between 10 and 50' }, 400)
    }

    if (duration_minutes < 5 || duration_minutes > 180) {
      return c.json({ success: false, message: 'Duration must be between 5 and 180 minutes' }, 400)
    }

    const validQuestionTypes = ['MCQ', 'TrueFalse', 'ShortAnswer']
    if (!question_types.every(type => validQuestionTypes.includes(type))) {
      return c.json({ success: false, message: 'Invalid question types' }, 400)
    }

    // Create configuration
    const db = new DatabaseService(c.env.DB)
    const configId = await db.createTestConfiguration({
      user_id: auth.user_id,
      test_type,
      difficulty,
      num_questions,
      duration_minutes,
      question_types
    })

    return c.json({
      success: true,
      message: 'Test configuration created',
      config_id: configId
    }, 201)

  } catch (error) {
    console.error('Error creating test config:', error)
    return c.json({ success: false, message: 'Failed to create test configuration' }, 500)
  }
})

// Get user's test configurations
tests.get('/config', authMiddleware, async (c) => {
  try {
    const auth = getAuthUser(c)
    if (!auth) {
      return c.json({ success: false, message: 'Authentication required' }, 401)
    }

    const db = new DatabaseService(c.env.DB)
    const configs = await db.getUserTestConfigurations(auth.user_id)
    
    return c.json({
      success: true,
      configurations: configs.map(config => ({
        ...config,
        question_types: JSON.parse(config.question_types)
      }))
    })

  } catch (error) {
    console.error('Error fetching test configs:', error)
    return c.json({ success: false, message: 'Failed to fetch test configurations' }, 500)
  }
})

// Start a new test attempt
tests.post('/start', authMiddleware, async (c) => {
  try {
    const auth = getAuthUser(c)
    if (!auth) {
      return c.json({ success: false, message: 'Authentication required' }, 401)
    }

    const body: StartTestRequest = await c.req.json()
    const { config_id } = body

    if (!config_id) {
      return c.json({ success: false, message: 'Configuration ID is required' }, 400)
    }

    const db = new DatabaseService(c.env.DB)
    
    // Get test configuration
    const config = await db.getTestConfiguration(config_id)
    if (!config) {
      return c.json({ success: false, message: 'Test configuration not found' }, 404)
    }

    if (config.user_id !== auth.user_id) {
      return c.json({ success: false, message: 'Access denied' }, 403)
    }

    // Get test category for AI prompt
    const category = await db.getTestCategoryByName(config.test_type)
    
    // Generate questions using AI
    const openaiKey = c.env.OPENAI_API_KEY
    if (!openaiKey) {
      return c.json({ success: false, message: 'AI service not configured' }, 503)
    }

    const aiService = new AIService(openaiKey)
    const questionTypes = JSON.parse(config.question_types)
    
    const aiResponse = await aiService.generateQuestions({
      test_type: config.test_type,
      difficulty: config.difficulty,
      num_questions: config.num_questions,
      question_types: questionTypes
    }, category || undefined)

    if (!aiResponse.success || !aiResponse.questions) {
      return c.json({ 
        success: false, 
        message: 'Failed to generate questions',
        error: aiResponse.error 
      }, 500)
    }

    // Create test attempt
    const attemptId = await db.createTestAttempt({
      user_id: auth.user_id,
      config_id,
      total_questions: aiResponse.questions.length
    })

    // Save generated questions
    for (let i = 0; i < aiResponse.questions.length; i++) {
      const question = aiResponse.questions[i]
      await db.createQuestion({
        attempt_id: attemptId,
        question_number: i + 1,
        question_type: question.type,
        question_text: question.question,
        options: question.options,
        correct_answer: question.correct_answer,
        ai_explanation: question.explanation
      })
    }

    // Get questions for the test (without correct answers)
    const questions = await db.getTestQuestions(attemptId)
    const questionsForClient = questions.map(q => ({
      id: q.id,
      question_number: q.question_number,
      question_type: q.question_type,
      question_text: q.question_text,
      options: q.options ? JSON.parse(q.options) : undefined
      // Don't send correct_answer or ai_explanation to client
    }))

    return c.json({
      success: true,
      message: 'Test started successfully',
      attempt_id: attemptId,
      questions: questionsForClient,
      config: {
        ...config,
        question_types: questionTypes
      },
      ai_info: {
        tokens_used: aiResponse.tokens_used,
        cost_estimate: aiResponse.cost_estimate
      }
    }, 201)

  } catch (error) {
    console.error('Error starting test:', error)
    return c.json({ success: false, message: 'Failed to start test' }, 500)
  }
})

// Submit answer for a question
tests.post('/answer', authMiddleware, async (c) => {
  try {
    const auth = getAuthUser(c)
    if (!auth) {
      return c.json({ success: false, message: 'Authentication required' }, 401)
    }

    const body: SubmitAnswerRequest = await c.req.json()
    const { question_id, user_answer, time_spent_seconds } = body

    if (!question_id || user_answer === undefined || time_spent_seconds === undefined) {
      return c.json({ success: false, message: 'Question ID, answer, and time spent are required' }, 400)
    }

    const db = new DatabaseService(c.env.DB)
    
    // Update question with user's answer
    await db.updateQuestionAnswer(question_id, user_answer, time_spent_seconds)

    return c.json({
      success: true,
      message: 'Answer submitted successfully'
    })

  } catch (error) {
    console.error('Error submitting answer:', error)
    return c.json({ success: false, message: 'Failed to submit answer' }, 500)
  }
})

// Complete test and get results
tests.post('/complete/:attempt_id', authMiddleware, async (c) => {
  try {
    const auth = getAuthUser(c)
    if (!auth) {
      return c.json({ success: false, message: 'Authentication required' }, 401)
    }

    const attempt_id = c.req.param('attempt_id')
    if (!attempt_id) {
      return c.json({ success: false, message: 'Attempt ID is required' }, 400)
    }

    const db = new DatabaseService(c.env.DB)
    
    // Get test attempt
    const attempt = await db.getTestAttempt(attempt_id)
    if (!attempt) {
      return c.json({ success: false, message: 'Test attempt not found' }, 404)
    }

    if (attempt.user_id !== auth.user_id) {
      return c.json({ success: false, message: 'Access denied' }, 403)
    }

    if (attempt.status === 'Completed') {
      return c.json({ success: false, message: 'Test already completed' }, 400)
    }

    // Get all questions and calculate score
    const questions = await db.getTestQuestions(attempt_id)
    const answeredQuestions = questions.filter(q => q.user_answer !== null)
    const correctAnswers = questions.filter(q => q.is_correct).length
    const totalQuestions = questions.length
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0

    // Calculate duration
    const startTime = new Date(attempt.start_time).getTime()
    const endTime = Date.now()
    const durationSeconds = Math.floor((endTime - startTime) / 1000)

    // Update test attempt
    await db.updateTestAttempt(attempt_id, {
      score,
      correct_answers: correctAnswers,
      end_time: new Date().toISOString(),
      duration_seconds: durationSeconds,
      status: 'Completed'
    })

    // Get configuration for context
    const config = await db.getTestConfiguration(attempt.config_id)

    // Calculate performance analytics
    const totalTimeSpent = questions.reduce((sum, q) => sum + q.time_spent_seconds, 0)
    const avgTimePerQuestion = totalTimeSpent > 0 ? totalTimeSpent / questions.length : 0
    
    const questionTimes = questions.map(q => q.time_spent_seconds).filter(t => t > 0)
    const fastestQuestion = questionTimes.length > 0 ? Math.min(...questionTimes) : 0
    const slowestQuestion = questionTimes.length > 0 ? Math.max(...questionTimes) : 0

    // Performance by question type
    const correctByType: Record<string, number> = {}
    const totalByType: Record<string, number> = {}
    
    questions.forEach(q => {
      if (!totalByType[q.question_type]) {
        totalByType[q.question_type] = 0
        correctByType[q.question_type] = 0
      }
      totalByType[q.question_type]++
      if (q.is_correct) {
        correctByType[q.question_type]++
      }
    })

    return c.json({
      success: true,
      message: 'Test completed successfully',
      results: {
        attempt: {
          ...attempt,
          score,
          correct_answers: correctAnswers,
          end_time: new Date().toISOString(),
          duration_seconds: durationSeconds,
          status: 'Completed'
        },
        questions: questions.map(q => ({
          ...q,
          options: q.options ? JSON.parse(q.options) : undefined
        })),
        config: config ? {
          ...config,
          question_types: JSON.parse(config.question_types)
        } : null,
        performance_analytics: {
          average_time_per_question: avgTimePerQuestion,
          fastest_question: fastestQuestion,
          slowest_question: slowestQuestion,
          correct_by_type: correctByType,
          total_by_type: totalByType
        }
      }
    })

  } catch (error) {
    console.error('Error completing test:', error)
    return c.json({ success: false, message: 'Failed to complete test' }, 500)
  }
})

// Get test history
tests.get('/history', authMiddleware, async (c) => {
  try {
    const auth = getAuthUser(c)
    if (!auth) {
      return c.json({ success: false, message: 'Authentication required' }, 401)
    }

    const limit = parseInt(c.req.query('limit') || '20')
    const db = new DatabaseService(c.env.DB)
    
    const attempts = await db.getUserTestAttempts(auth.user_id, limit)
    
    return c.json({
      success: true,
      attempts
    })

  } catch (error) {
    console.error('Error fetching test history:', error)
    return c.json({ success: false, message: 'Failed to fetch test history' }, 500)
  }
})

// Get user statistics
tests.get('/stats', authMiddleware, async (c) => {
  try {
    const auth = getAuthUser(c)
    if (!auth) {
      return c.json({ success: false, message: 'Authentication required' }, 401)
    }

    const db = new DatabaseService(c.env.DB)
    const stats = await db.getTestStatistics(auth.user_id)
    
    return c.json({
      success: true,
      statistics: stats
    })

  } catch (error) {
    console.error('Error fetching statistics:', error)
    return c.json({ success: false, message: 'Failed to fetch statistics' }, 500)
  }
})

export { tests }