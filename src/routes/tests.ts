// Test management routes for AI Test Application
import { Hono } from 'hono'
import { Env, CreateTestConfigRequest, StartTestRequest, SubmitAnswerRequest, CreateStudyMaterialRequest, GenerateStudyTestRequest } from '../types/database'
import { DatabaseService } from '../utils/database'
import { AIService } from '../services/ai'
import { authMiddleware, getAuthUser } from '../middleware/auth'
import { generateUUID } from '../utils/auth'
import { StudyMaterialService } from '../services/study-material'

function envValue(c: any, key: 'DATABASE_URL' | 'OPENAI_API_KEY') {
  return c?.env?.[key] || process.env[key]
}

const tests = new Hono<{ Bindings: Env }>()
const studyMaterialService = new StudyMaterialService()

function inferMaterialQuality(item: any): 'high' | 'medium' | 'low' {
  const chunkCount = Number(item?.chunk_count || 0)
  const textLength = Number(item?.extracted_text?.length || 0)
  if (textLength < 300 || chunkCount <= 1) return 'low'
  if (textLength < 1200 || chunkCount <= 2) return 'medium'
  return 'high'
}

function readQueryArray(value?: string): string[] {
  if (!value) return []
  return value.split(',').map(v => v.trim()).filter(Boolean)
}

// Query-param workaround for config creation
tests.get('/query-config', authMiddleware, async (c) => {
  try {
    const auth = getAuthUser(c)
    if (!auth) {
      return c.json({ success: false, message: 'Authentication required' }, 401)
    }

    const test_type = c.req.query('test_type') || ''
    const difficulty = c.req.query('difficulty') || 'Medium'
    const num_questions = parseInt(c.req.query('num_questions') || '10')
    const duration_minutes = parseInt(c.req.query('duration_minutes') || '30')
    const question_types = readQueryArray(c.req.query('question_types'))

    if (!test_type || !difficulty || !num_questions || !duration_minutes || question_types.length === 0) {
      return c.json({ success: false, message: 'All fields are required' }, 400)
    }

    const validQuestionTypes = ['MCQ', 'TrueFalse', 'ShortAnswer']
    if (!question_types.every(type => validQuestionTypes.includes(type))) {
      return c.json({ success: false, message: 'Invalid question types' }, 400)
    }

    const db = DatabaseService.fromDatabaseUrl(envValue(c, 'DATABASE_URL'))
    const configId = await db.createTestConfiguration({
      user_id: auth.user_id,
      test_type,
      difficulty,
      num_questions,
      duration_minutes,
      question_types
    })

    return c.json({ success: true, message: 'Test configuration created', config_id: configId }, 201)
  } catch (error) {
    console.error('Error creating query test config:', error)
    return c.json({ success: false, message: 'Failed to create test configuration' }, 500)
  }
})

// Query-param workaround for starting tests
tests.get('/query-start', authMiddleware, async (c) => {
  try {
    const auth = getAuthUser(c)
    if (!auth) {
      return c.json({ success: false, message: 'Authentication required' }, 401)
    }

    const config_id = c.req.query('config_id') || ''
    if (!config_id) {
      return c.json({ success: false, message: 'Configuration ID is required' }, 400)
    }

    const db = DatabaseService.fromDatabaseUrl(envValue(c, 'DATABASE_URL'))
    const config = await db.getTestConfiguration(config_id)
    if (!config) {
      return c.json({ success: false, message: 'Test configuration not found' }, 404)
    }

    if (config.user_id !== auth.user_id) {
      return c.json({ success: false, message: 'Access denied' }, 403)
    }

    const category = await db.getTestCategoryByName(config.test_type)
    const openaiKey = envValue(c, 'OPENAI_API_KEY')
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
      return c.json({ success: false, message: 'Failed to generate questions', error: aiResponse.error }, 500)
    }

    const attemptId = await db.createTestAttempt({
      user_id: auth.user_id,
      config_id,
      total_questions: aiResponse.questions.length
    })

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

    const questions = await db.getTestQuestions(attemptId)
    const questionsForClient = questions.map(q => ({
      id: q.id,
      question_number: q.question_number,
      question_type: q.question_type,
      question_text: q.question_text,
      options: q.options ? JSON.parse(q.options) : undefined
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
    console.error('Error starting query test:', error)
    return c.json({ success: false, message: 'Failed to start test' }, 500)
  }
})

tests.get('/materials', authMiddleware, async (c) => {
  try {
    const auth = getAuthUser(c)
    if (!auth) {
      return c.json({ success: false, message: 'Authentication required' }, 401)
    }

    const db = DatabaseService.fromDatabaseUrl(envValue(c, 'DATABASE_URL'))
    const materials = await db.getUserStudyMaterials(auth.user_id)

    return c.json({
      success: true,
      materials: materials.map(item => ({
        id: item.id,
        title: item.title,
        file_name: item.file_name,
        file_type: item.file_type,
        mime_type: item.mime_type,
        material_type: item.material_type,
        processing_status: item.processing_status,
        file_size_bytes: item.file_size_bytes,
        chunk_count: (item as any).chunk_count || 0,
        extraction_quality: inferMaterialQuality(item),
        extraction_warnings: Array.isArray((item as any).extraction_warnings) ? (item as any).extraction_warnings : [],
        summary: item.summary,
        created_at: item.created_at,
        text_preview: item.extracted_text.slice(0, 280)
      }))
    })
  } catch (error) {
    console.error('Error fetching study materials:', error)
    const message = error instanceof Error ? error.message : ''
    if (message.includes('study_materials')) {
      return c.json({
        success: true,
        materials: [],
        warning: 'Study materials table is not available yet. Run the study materials migration in Neon to enable this feature.'
      })
    }
    return c.json({ success: false, message: 'Failed to fetch study materials' }, 500)
  }
})

tests.post('/materials/import', authMiddleware, async (c) => {
  try {
    const auth = getAuthUser(c)
    if (!auth) {
      return c.json({ success: false, message: 'Authentication required' }, 401)
    }

    const body: CreateStudyMaterialRequest = await c.req.json()
    if (!body?.file_name || !body?.file_content_base64) {
      return c.json({ success: false, message: 'File name and file content are required' }, 400)
    }

    const parsed = await studyMaterialService.parseBase64File(body.file_name, body.mime_type || '', body.file_content_base64)
    const db = DatabaseService.fromDatabaseUrl(envValue(c, 'DATABASE_URL'))
    const chunks = studyMaterialService.chunkText(parsed.text)
    const fileBytes = Buffer.from(body.file_content_base64, 'base64').length
    const fileExt = parsed.fileType
    const materialType = fileExt === 'docx' ? 'doc' : ['md', 'markdown', 'txt'].includes(fileExt) ? 'notes' : 'other'

    const materialId = await db.createStudyMaterial({
      user_id: auth.user_id,
      title: body.title || parsed.title,
      file_name: body.file_name,
      file_type: fileExt,
      mime_type: body.mime_type,
      file_size_bytes: fileBytes,
      source_kind: body.source_kind || 'upload',
      material_type: body.material_type || materialType,
      processing_status: 'ready',
      extracted_text: parsed.text,
      summary: parsed.text.slice(0, 500)
    })
    await db.createStudyMaterialChunks(materialId, chunks.map(chunk => ({
      content: chunk.content,
      token_count: Math.ceil(chunk.content.length / 4)
    })))

    return c.json({
      success: true,
      message: 'Study material imported successfully',
      material: {
        id: materialId,
        title: body.title || parsed.title,
        file_name: body.file_name,
        file_type: fileExt,
        mime_type: body.mime_type,
        material_type: body.material_type || materialType,
        processing_status: 'ready',
        file_size_bytes: fileBytes,
        stats: parsed.stats,
        chunk_count: chunks.length,
        extraction_quality: parsed.stats.extractionQuality,
        extraction_warnings: parsed.stats.warnings,
        created_at: new Date().toISOString(),
        text_preview: parsed.text.slice(0, 500)
      }
    }, 201)
  } catch (error) {
    console.error('Error importing study material:', error)
    const message = error instanceof Error ? error.message : 'Failed to import study material'
    if (message.includes('study_materials')) {
      return c.json({
        success: false,
        message: 'Study materials are not enabled in the database yet. Run the Neon study_materials migration first.'
      }, 503)
    }
    return c.json({ success: false, message }, 500)
  }
})

tests.post('/materials/generate-test', authMiddleware, async (c) => {
  try {
    const auth = getAuthUser(c)
    if (!auth) {
      return c.json({ success: false, message: 'Authentication required' }, 401)
    }

    const body: GenerateStudyTestRequest = await c.req.json()
    if (!body?.material_id) {
      return c.json({ success: false, message: 'Material ID is required' }, 400)
    }

    const normalizedNumQuestions = Math.min(Math.max(Number(body?.num_questions || 10), 10), 50)

    const db = DatabaseService.fromDatabaseUrl(envValue(c, 'DATABASE_URL'))
    const material = await db.getStudyMaterialById(body.material_id)
    if (!material) {
      return c.json({ success: false, message: 'Study material not found' }, 404)
    }
    if (material.user_id !== auth.user_id) {
      return c.json({ success: false, message: 'Access denied' }, 403)
    }

    const openaiKey = envValue(c, 'OPENAI_API_KEY')
    if (!openaiKey) {
      return c.json({ success: false, message: 'AI service not configured' }, 503)
    }

    const aiService = new AIService(openaiKey)
    const relevantChunks = await db.searchStudyMaterialChunks(
      material.id,
      body.topic_focus || material.title,
      Math.max(4, Math.min(8, normalizedNumQuestions))
    )
    const aiResponse = await aiService.generateQuestionsFromMaterial({
      test_type: `Study Material: ${material.title}`,
      difficulty: body.difficulty,
      num_questions: normalizedNumQuestions,
      question_types: body.question_types,
      topic_focus: body.topic_focus,
      sourceText: material.extracted_text,
      sourceTitle: material.title,
      sourceChunks: relevantChunks.map(chunk => chunk.content),
      useWebSources: body.use_web_sources
    })

    if (!aiResponse.success || !aiResponse.questions) {
      return c.json({ success: false, message: 'Failed to generate material-based questions', error: aiResponse.error }, 500)
    }

    const configId = await db.createTestConfiguration({
      user_id: auth.user_id,
      test_type: `Study Material: ${material.title}`,
      difficulty: body.difficulty,
      num_questions: normalizedNumQuestions,
      duration_minutes: Math.max(15, normalizedNumQuestions * 2),
      question_types: body.question_types
    })

    const attemptId = await db.createTestAttempt({
      user_id: auth.user_id,
      config_id: configId,
      total_questions: aiResponse.questions.length
    })

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

    await db.createMaterialTestLink(material.id, configId, attemptId)

    const questions = await db.getTestQuestions(attemptId)
    return c.json({
      success: true,
      message: 'Material-based test generated successfully',
      attempt_id: attemptId,
      material: {
        id: material.id,
        title: material.title,
        file_name: material.file_name,
        file_type: material.file_type,
        material_type: material.material_type,
        processing_status: material.processing_status,
        chunk_count: relevantChunks.length
      },
      questions: questions.map(q => ({
        id: q.id,
        question_number: q.question_number,
        question_type: q.question_type,
        question_text: q.question_text,
        options: q.options ? JSON.parse(q.options) : undefined
      }))
    }, 201)
  } catch (error) {
    console.error('Error generating material test:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate material test'
    if (message.includes('study_materials')) {
      return c.json({
        success: false,
        message: 'Study materials are not enabled in the database yet. Run the Neon study_materials migration first.'
      }, 503)
    }
    return c.json({ success: false, message: 'Failed to generate material test' }, 500)
  }
})

tests.post('/materials/retry-test', authMiddleware, async (c) => {
  try {
    const auth = getAuthUser(c)
    if (!auth) {
      return c.json({ success: false, message: 'Authentication required' }, 401)
    }

    const body = await c.req.json()
    const materialId = body?.material_id
    const missedQuestions = Array.isArray(body?.missed_questions) ? body.missed_questions : []
    const difficulty = body?.difficulty || 'Medium'
    const numQuestions = Math.min(Math.max(parseInt(String(body?.num_questions || '6')), 3), 20)
    const questionTypes = Array.isArray(body?.question_types) && body.question_types.length > 0
      ? body.question_types
      : ['MCQ', 'TrueFalse']

    if (!materialId || missedQuestions.length === 0) {
      return c.json({ success: false, message: 'Material ID and missed questions are required' }, 400)
    }

    const db = DatabaseService.fromDatabaseUrl(envValue(c, 'DATABASE_URL'))
    const material = await db.getStudyMaterialById(materialId)
    if (!material) return c.json({ success: false, message: 'Study material not found' }, 404)
    if (material.user_id !== auth.user_id) return c.json({ success: false, message: 'Access denied' }, 403)

    const openaiKey = envValue(c, 'OPENAI_API_KEY')
    if (!openaiKey) {
      return c.json({ success: false, message: 'AI service not configured' }, 503)
    }

    const searchQuery = missedQuestions
      .map((item: any) => `${item.question || ''} ${item.correct_answer || ''}`.trim())
      .join(' ')
      .trim() || material.title

    const normalizedNumQuestions = Math.min(Math.max(numQuestions, 10), 50)
    const relevantChunks = await db.searchStudyMaterialChunks(material.id, searchQuery, Math.min(8, normalizedNumQuestions + 2))
    const aiService = new AIService(openaiKey)
    const aiResponse = await aiService.generateRetryQuestionsFromMissedConcepts({
      sourceTitle: material.title,
      sourceChunks: relevantChunks.map(chunk => chunk.content),
      missedQuestions: missedQuestions.map((item: any) => ({
        question: item.question || '',
        correct_answer: item.correct_answer || '',
        explanation: item.explanation || ''
      })),
      difficulty,
      num_questions: normalizedNumQuestions,
      question_types: questionTypes
    })

    if (!aiResponse.success || !aiResponse.questions) {
      return c.json({ success: false, message: 'Failed to generate retry test', error: aiResponse.error }, 500)
    }

    const configId = await db.createTestConfiguration({
      user_id: auth.user_id,
      test_type: `Retry: ${material.title}`,
      difficulty,
      num_questions: normalizedNumQuestions,
      duration_minutes: Math.max(10, normalizedNumQuestions * 2),
      question_types: questionTypes
    })

    const attemptId = await db.createTestAttempt({
      user_id: auth.user_id,
      config_id: configId,
      total_questions: aiResponse.questions.length
    })

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

    await db.createMaterialTestLink(material.id, configId, attemptId)

    const questions = await db.getTestQuestions(attemptId)
    return c.json({
      success: true,
      message: 'Retry test generated successfully',
      attempt_id: attemptId,
      material: {
        id: material.id,
        title: material.title,
        file_name: material.file_name,
        file_type: material.file_type,
        material_type: material.material_type,
        processing_status: material.processing_status,
        chunk_count: relevantChunks.length
      },
      questions: questions.map(q => ({
        id: q.id,
        question_number: q.question_number,
        question_type: q.question_type,
        question_text: q.question_text,
        options: q.options ? JSON.parse(q.options) : undefined
      })),
      config: {
        id: configId,
        test_type: `Retry: ${material.title}`,
        difficulty,
        num_questions: normalizedNumQuestions,
        duration_minutes: Math.max(10, normalizedNumQuestions * 2),
        question_types: questionTypes
      }
    }, 201)
  } catch (error) {
    console.error('Error generating retry test:', error)
    return c.json({ success: false, message: 'Failed to generate retry test' }, 500)
  }
})

tests.post('/materials/ask', authMiddleware, async (c) => {
  try {
    const auth = getAuthUser(c)
    if (!auth) {
      return c.json({ success: false, message: 'Authentication required' }, 401)
    }

    const body = await c.req.json()
    const materialId = body?.material_id
    const question = body?.question
    const useWebSources = Boolean(body?.use_web_sources)

    if (!materialId || !question) {
      return c.json({ success: false, message: 'Material ID and question are required' }, 400)
    }

    const db = DatabaseService.fromDatabaseUrl(envValue(c, 'DATABASE_URL'))
    const material = await db.getStudyMaterialById(materialId)
    if (!material) return c.json({ success: false, message: 'Study material not found' }, 404)
    if (material.user_id !== auth.user_id) return c.json({ success: false, message: 'Access denied' }, 403)

    const openaiKey = envValue(c, 'OPENAI_API_KEY')
    if (!openaiKey) {
      return c.json({ success: false, message: 'AI service not configured' }, 503)
    }

    const aiService = new AIService(openaiKey)
    const relevantChunks = await db.searchStudyMaterialChunks(material.id, question, 5)
    const answer = await aiService.answerFromMaterial({
      sourceText: material.extracted_text,
      sourceTitle: material.title,
      sourceChunks: relevantChunks.map(chunk => chunk.content),
      question,
      useWebSources
    })

    return c.json({
      success: answer.success,
      answer: answer.answer,
      source: {
        material_id: material.id,
        title: material.title,
        used_web_sources: useWebSources,
        chunk_count: relevantChunks.length
      },
      error: answer.error
    })
  } catch (error) {
    console.error('Error answering from study material:', error)
    const message = error instanceof Error ? error.message : 'Failed to answer from study material'
    if (message.includes('study_materials')) {
      return c.json({
        success: false,
        message: 'Study materials are not enabled in the database yet. Run the Neon study_materials migration first.'
      }, 503)
    }
    return c.json({ success: false, message: 'Failed to answer from study material' }, 500)
  }
})

// Get all available test categories
tests.get('/categories', async (c) => {
  try {
    const db = DatabaseService.fromDatabaseUrl(envValue(c, 'DATABASE_URL'))
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
    const db = DatabaseService.fromDatabaseUrl(envValue(c, 'DATABASE_URL'))
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

    const db = DatabaseService.fromDatabaseUrl(envValue(c, 'DATABASE_URL'))
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

    const db = DatabaseService.fromDatabaseUrl(envValue(c, 'DATABASE_URL'))
    
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
    const openaiKey = envValue(c, 'OPENAI_API_KEY')
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

    const db = DatabaseService.fromDatabaseUrl(envValue(c, 'DATABASE_URL'))
    
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

    const db = DatabaseService.fromDatabaseUrl(envValue(c, 'DATABASE_URL'))
    
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
    const material = await db.getMaterialByAttemptId(attempt_id)

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
        material,
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
    const db = DatabaseService.fromDatabaseUrl(envValue(c, 'DATABASE_URL'))
    
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

    const db = DatabaseService.fromDatabaseUrl(envValue(c, 'DATABASE_URL'))
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
