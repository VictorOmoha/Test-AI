// AI Service for Question Generation and Scoring
import { AIQuestionRequest, GeneratedQuestion, AIGenerationResponse, TestCategory } from '../types/database'
import { StudyMaterialService } from './study-material'

export class AIService {
  private apiKey: string
  private baseUrl = 'https://api.openai.com/v1'
  private studyMaterialService = new StudyMaterialService()

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  // Generate questions using OpenAI API
  async generateQuestions(request: AIQuestionRequest, category?: TestCategory): Promise<AIGenerationResponse> {
    // Check if API key is properly configured
    if (!this.apiKey || this.apiKey === 'your-openai-api-key-here' || this.apiKey.length < 10) {
      console.log('OpenAI API key not configured, using fallback question generation')
      return this.generateFallbackQuestions(request, category)
    }

    try {
      const prompt = this.buildPrompt(request, category)
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Cost-effective model for question generation
          messages: [
            {
              role: 'system',
              content: 'You are an expert educational content creator. Generate accurate, well-formatted questions for educational testing. Always respond with valid JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 3000,
          temperature: 0.7,
          response_format: { type: 'json_object' }
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        throw new Error('No content received from OpenAI API')
      }

      // Parse the JSON response
      let parsedQuestions: { questions: GeneratedQuestion[] }
      try {
        parsedQuestions = JSON.parse(content)
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content)
        throw new Error('Invalid JSON response from AI')
      }

      // Validate questions
      const validatedQuestions = this.validateQuestions(parsedQuestions.questions, request)

      return {
        success: true,
        questions: validatedQuestions,
        tokens_used: data.usage?.total_tokens || 0,
        cost_estimate: this.estimateCost(data.usage?.total_tokens || 0)
      }

    } catch (error) {
      console.error('AI question generation failed:', error)
      console.log('Falling back to demo question generation')
      return this.generateFallbackQuestions(request, category)
    }
  }

  async generateQuestionsFromMaterial(request: AIQuestionRequest & {
    sourceText: string;
    sourceTitle: string;
    useWebSources?: boolean;
  }): Promise<AIGenerationResponse> {
    if (!this.apiKey || this.apiKey === 'your-openai-api-key-here' || this.apiKey.length < 10) {
      return this.generateQuestionsFromMaterialFallback(request)
    }

    try {
      const context = this.studyMaterialService.buildContextSnippet(request.sourceText)
      const prompt = `You are TestAI, an intelligent study coach. Generate exactly ${request.num_questions} questions from the uploaded study material titled "${request.sourceTitle}".

Use the study material as the primary source of truth.
${request.useWebSources ? 'If useful, you may include brief supporting source suggestions from the web inside explanations, but every question must still be grounded in the uploaded material.' : 'Do not rely on external web facts. Stay grounded in the uploaded material.'}

Study material excerpt:
${context}

Requested question types: ${request.question_types.join(', ')}
Difficulty: ${request.difficulty}
${request.topic_focus ? `Focus area: ${request.topic_focus}` : ''}

Respond with valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text here",
      "type": "MCQ" | "TrueFalse" | "ShortAnswer",
      "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
      "correct_answer": "A" | "True" | "exact answer text",
      "explanation": "Detailed explanation grounded in the uploaded material"
    }
  ]
}`

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You create rigorous study questions from user-provided learning material. Stay faithful to the source text and always return valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 3200,
          temperature: 0.5,
          response_format: { type: 'json_object' }
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      if (!content) throw new Error('No content received from OpenAI API')

      const parsed = JSON.parse(content)
      const validatedQuestions = this.validateQuestions(parsed.questions, request)

      return {
        success: true,
        questions: validatedQuestions,
        tokens_used: data.usage?.total_tokens || 0,
        cost_estimate: this.estimateCost(data.usage?.total_tokens || 0)
      }
    } catch (error) {
      console.error('Material question generation failed:', error)
      return this.generateQuestionsFromMaterialFallback(request)
    }
  }

  async answerFromMaterial(params: {
    sourceText: string;
    sourceTitle: string;
    question: string;
    useWebSources?: boolean;
  }): Promise<{ success: boolean; answer: string; error?: string }> {
    if (!this.apiKey || this.apiKey === 'your-openai-api-key-here' || this.apiKey.length < 10) {
      const context = this.studyMaterialService.buildContextSnippet(params.sourceText, 3500)
      return {
        success: true,
        answer: `Based on ${params.sourceTitle}, here is the most relevant study context I found:\n\n${context}\n\nQuestion: ${params.question}\n\nWeb-supported answers need a live search integration next.`
      }
    }

    try {
      const context = this.studyMaterialService.buildContextSnippet(params.sourceText)
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are TestAI. Answer questions using the uploaded study material first. ${params.useWebSources ? 'If the material is incomplete, say what came from the material and what should be supplemented from the web.' : 'Do not invent facts beyond the material.'}`
            },
            {
              role: 'user',
              content: `Study material title: ${params.sourceTitle}\n\nStudy material excerpt:\n${context}\n\nUser question: ${params.question}`
            }
          ],
          max_tokens: 900,
          temperature: 0.3
        })
      })

      if (!response.ok) throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      const data = await response.json()
      return { success: true, answer: data.choices?.[0]?.message?.content || 'No answer generated.' }
    } catch (error) {
      console.error('Material answer generation failed:', error)
      return { success: false, answer: '', error: error instanceof Error ? error.message : 'Failed to answer from material' }
    }
  }

  // Fallback question generation when OpenAI API is not available
  private generateFallbackQuestions(request: AIQuestionRequest, category?: TestCategory): AIGenerationResponse {
    console.log(`Generating fallback questions for ${request.test_type} - ${request.difficulty}`)

    // Use a dynamic generator for Mathematics to avoid repeats
    if ((request.test_type || '').toLowerCase().includes('math')) {
      return this.generateDynamicMathQuestions(request)
    }

    const questions: GeneratedQuestion[] = []
    const { test_type, difficulty, num_questions, question_types } = request

    // Question templates by category
    const questionTemplates = this.getQuestionTemplates(test_type, difficulty)

    // Build a non-repeating rotation of template questions
    const usedText = new Set<string>()

    for (let i = 0; i < num_questions; i++) {
      const questionType = question_types[i % question_types.length]
      const template = questionTemplates[questionType] || questionTemplates['MCQ']

      // Shuffle index pick with retry to reduce duplicates
      let picked: any | null = null
      for (let attempt = 0; attempt < 10; attempt++) {
        const idx = Math.floor(Math.random() * template.length)
        const candidate = template[idx]
        if (!usedText.has(candidate.question)) {
          picked = candidate
          usedText.add(candidate.question)
          break
        }
      }
      if (!picked) picked = template[i % template.length]

      questions.push({
        question: picked.question,
        type: questionType,
        options: picked.options,
        correct_answer: picked.correct_answer,
        explanation: picked.explanation
      })
    }

    return {
      success: true,
      questions: questions.slice(0, num_questions),
      tokens_used: 0,
      cost_estimate: 0
    }
  }

  private generateQuestionsFromMaterialFallback(request: AIQuestionRequest & {
    sourceText: string;
    sourceTitle: string;
    useWebSources?: boolean;
  }): AIGenerationResponse {
    const chunks = this.studyMaterialService.chunkText(request.sourceText)
    const questions: GeneratedQuestion[] = []

    for (let i = 0; i < request.num_questions; i++) {
      const chunk = chunks[i % Math.max(1, chunks.length)]
      const excerpt = (chunk?.content || request.sourceText).slice(0, 220)
      const type = request.question_types[i % request.question_types.length]
      if (type === 'TrueFalse') {
        questions.push({
          question: `True or False: This statement is supported by section ${chunk?.index || 1} of ${request.sourceTitle}.`,
          type: 'TrueFalse',
          correct_answer: 'True',
          explanation: excerpt
        })
      } else if (type === 'ShortAnswer') {
        questions.push({
          question: `In your own words, summarize the key idea from section ${chunk?.index || 1}.`,
          type: 'ShortAnswer',
          correct_answer: excerpt.slice(0, 120),
          explanation: excerpt
        })
      } else {
        questions.push({
          question: `Which option best matches the main idea in section ${chunk?.index || 1} of ${request.sourceTitle}?`,
          type: 'MCQ',
          options: [
            `A. ${excerpt.slice(0, 70)}`,
            'B. An unrelated historical claim',
            'C. A random definition not in the material',
            'D. A conclusion from a different topic'
          ],
          correct_answer: 'A',
          explanation: excerpt
        })
      }
    }

    return { success: true, questions }
  }

  // Dynamically generate varied math questions to avoid repetition in fallback mode
  private generateDynamicMathQuestions(request: AIQuestionRequest): AIGenerationResponse {
    const { num_questions, question_types, difficulty } = request
    const questions: GeneratedQuestion[] = []
    const used = new Set<string>()

    const makeUnique = (gen: () => GeneratedQuestion): GeneratedQuestion => {
      for (let i = 0; i < 20; i++) {
        const q = gen()
        if (!used.has(q.question)) {
          used.add(q.question)
          return q
        }
      }
      return gen()
    }

    const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

    const genMCQ = (): GeneratedQuestion => {
      // Randomly choose a pattern
      const pattern = randInt(1, 6)
      let question = ''
      let answerNum: number = 0
      let explanation = ''

      if (pattern === 1) {
        const a = randInt(10, 99), b = randInt(10, 99)
        question = `What is ${a} + ${b}?`
        answerNum = a + b
        explanation = `${a} + ${b} = ${answerNum}`
      } else if (pattern === 2) {
        let a = randInt(30, 120), b = randInt(10, 29)
        if (b > a) [a, b] = [b, a]
        question = `What is ${a} − ${b}?`
        answerNum = a - b
        explanation = `${a} − ${b} = ${answerNum}`
      } else if (pattern === 3) {
        const a = randInt(5, 20), b = randInt(3, 12)
        question = `What is ${a} × ${b}?`
        answerNum = a * b
        explanation = `${a} × ${b} = ${answerNum}`
      } else if (pattern === 4) {
        const a = randInt(3, 12), b = randInt(3, 12)
        const dividend = a * b
        question = `What is ${dividend} ÷ ${a}?`
        answerNum = b
        explanation = `${dividend} ÷ ${a} = ${b}`
      } else if (pattern === 5) {
        const k = randInt(3, 15)
        const n = k * k
        question = `What is the square root of ${n}?`
        answerNum = k
        explanation = `√${n} = ${k} because ${k} × ${k} = ${n}`
      } else {
        const a = randInt(2, 12)
        const x = randInt(2, 20)
        const b = randInt(1, 30)
        const c = a * x + b
        question = `Solve for x: ${a}x + ${b} = ${c}`
        answerNum = x
        explanation = `${a}x + ${b} = ${c} → ${a}x = ${c - b} → x = ${(c - b)}/${a} = ${x}`
      }

      // Build options with plausible distractors
      const correct = answerNum
      const optsSet = new Set<number>([correct])
      while (optsSet.size < 4) {
        const delta = randInt(1, Math.max(2, Math.floor(Math.abs(correct) * 0.2) + 2))
        const sign = Math.random() < 0.5 ? -1 : 1
        const candidate = correct + sign * delta
        optsSet.add(candidate)
      }
      const values = Array.from(optsSet)
      // Shuffle values and place correct randomly
      for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[values[i], values[j]] = [values[j], values[i]]
      }
      const correctIndex = values.indexOf(correct)
      const letters = ['A', 'B', 'C', 'D']
      const options = values.map((v, i) => `${letters[i]}. ${v}`)
      const correct_answer = letters[correctIndex]

      return { question, type: 'MCQ', options, correct_answer, explanation }
    }

    const genTF = (): GeneratedQuestion => {
      const a = randInt(5, 30), b = randInt(5, 30)
      const left = a * b
      const right = a * b + (Math.random() < 0.5 ? 0 : randInt(1, 5))
      const isTrue = left === right
      const question = `${a} × ${b} = ${right}. Is this statement true?`
      return {
        question,
        type: 'TrueFalse',
        correct_answer: isTrue ? 'True' : 'False',
        explanation: `${a} × ${b} = ${a * b}${isTrue ? '' : `, not ${right}`}`
      }
    }

    const genSA = (): GeneratedQuestion => {
      const a = randInt(20, 120), b = randInt(2, 12)
      const question = `Compute ${a} ÷ ${b}.`
      const exact = (a / b).toFixed(2)
      return {
        question,
        type: 'ShortAnswer',
        correct_answer: `${exact}`,
        explanation: `${a} ÷ ${b} = ${a / b}`
      }
    }

    for (let i = 0; i < num_questions; i++) {
      const qType = question_types[i % question_types.length]
      let q: GeneratedQuestion
      if (qType === 'TrueFalse') q = makeUnique(genTF)
      else if (qType === 'ShortAnswer') q = makeUnique(genSA)
      else q = makeUnique(genMCQ)
      questions.push(q)
    }

    // Adjust difficulty lightly by nudging number ranges
    if (difficulty === 'Easy') {
      // nothing extra; ranges already easy-ish
    } else if (difficulty === 'Hard') {
      // Could increase ranges in the future
    }

    return { success: true, questions, tokens_used: 0, cost_estimate: 0 }
  }

  // Get question templates for fallback generation
  private getQuestionTemplates(testType: string, difficulty: string): Record<string, any[]> {
    const baseTemplates = {
      'Mathematics': {
        'MCQ': [
          {
            question: "What is 15 + 27?",
            options: ["A. 42", "B. 41", "C. 43", "D. 40"],
            correct_answer: "A",
            explanation: "15 + 27 = 42. This is basic addition."
          },
          {
            question: "What is the square root of 64?",
            options: ["A. 6", "B. 8", "C. 7", "D. 9"],
            correct_answer: "B",
            explanation: "√64 = 8 because 8 × 8 = 64."
          },
          {
            question: "If x + 5 = 12, what is x?",
            options: ["A. 7", "B. 6", "C. 8", "D. 5"],
            correct_answer: "A",
            explanation: "x + 5 = 12, so x = 12 - 5 = 7."
          }
        ],
        'TrueFalse': [
          {
            question: "The sum of angles in a triangle is always 180°.",
            correct_answer: "True",
            explanation: "Yes, the sum of interior angles in any triangle is always 180°."
          },
          {
            question: "Zero is a positive number.",
            correct_answer: "False",
            explanation: "Zero is neither positive nor negative; it's neutral."
          }
        ],
        'ShortAnswer': [
          {
            question: "Calculate 12 × 8.",
            correct_answer: "96",
            explanation: "12 × 8 = 96. This is basic multiplication."
          }
        ]
      },
      'Science': {
        'MCQ': [
          {
            question: "What is the chemical symbol for water?",
            options: ["A. H2O", "B. CO2", "C. O2", "D. H2"],
            correct_answer: "A",
            explanation: "Water is composed of 2 hydrogen atoms and 1 oxygen atom, hence H2O."
          },
          {
            question: "Which planet is closest to the Sun?",
            options: ["A. Venus", "B. Earth", "C. Mercury", "D. Mars"],
            correct_answer: "C",
            explanation: "Mercury is the planet closest to the Sun in our solar system."
          },
          {
            question: "What gas do plants absorb from the atmosphere during photosynthesis?",
            options: ["A. Oxygen", "B. Nitrogen", "C. Carbon dioxide", "D. Hydrogen"],
            correct_answer: "C",
            explanation: "Plants absorb carbon dioxide (CO2) and release oxygen during photosynthesis."
          }
        ],
        'TrueFalse': [
          {
            question: "The Earth revolves around the Sun.",
            correct_answer: "True",
            explanation: "Yes, Earth orbits around the Sun, completing one revolution in about 365.25 days."
          },
          {
            question: "Sound travels faster than light.",
            correct_answer: "False",
            explanation: "Light travels much faster than sound. Light speed is about 300,000 km/s while sound is about 343 m/s in air."
          }
        ],
        'ShortAnswer': [
          {
            question: "Name the process by which plants make their food.",
            correct_answer: "photosynthesis",
            explanation: "Photosynthesis is the process where plants use sunlight, CO2, and water to make glucose and oxygen."
          }
        ]
      },
      'Programming': {
        'MCQ': [
          {
            question: "Which of the following is used to declare a variable in JavaScript?",
            options: ["A. var", "B. let", "C. const", "D. All of the above"],
            correct_answer: "D",
            explanation: "JavaScript has three ways to declare variables: var, let, and const, each with different scoping rules."
          },
          {
            question: "What does HTML stand for?",
            options: ["A. Hyper Text Markup Language", "B. High Tech Modern Language", "C. Home Tool Markup Language", "D. Hyperlink and Text Markup Language"],
            correct_answer: "A",
            explanation: "HTML stands for Hyper Text Markup Language, used for creating web pages."
          },
          {
            question: "Which loop is guaranteed to execute at least once?",
            options: ["A. for loop", "B. while loop", "C. do-while loop", "D. foreach loop"],
            correct_answer: "C",
            explanation: "A do-while loop checks the condition after executing the code block, so it runs at least once."
          },
          {
            question: "What is the correct way to create a function in Python?",
            options: ["A. function myFunc()", "B. def myFunc():", "C. create myFunc()", "D. func myFunc():"],
            correct_answer: "B",
            explanation: "In Python, functions are defined using the 'def' keyword followed by the function name and colon."
          }
        ],
        'TrueFalse': [
          {
            question: "Python is a compiled programming language.",
            correct_answer: "False",
            explanation: "Python is an interpreted language, not compiled. It's executed line by line by the Python interpreter."
          },
          {
            question: "Arrays in JavaScript can hold different data types.",
            correct_answer: "True",
            explanation: "JavaScript arrays are dynamic and can contain elements of different data types in the same array."
          }
        ],
        'ShortAnswer': [
          {
            question: "What method is used to add an element to the end of an array in JavaScript?",
            correct_answer: "push",
            explanation: "The push() method adds one or more elements to the end of an array."
          },
          {
            question: "What keyword is used to define a class in most object-oriented languages?",
            correct_answer: "class",
            explanation: "The 'class' keyword is used to define a class in languages like Java, C++, Python, and JavaScript."
          }
        ]
      },
      'History': {
        'MCQ': [
          {
            question: "In which year did World War II end?",
            options: ["A. 1944", "B. 1945", "C. 1946", "D. 1943"],
            correct_answer: "B",
            explanation: "World War II ended in 1945 with the surrender of Japan in September."
          },
          {
            question: "Who was the first President of the United States?",
            options: ["A. Thomas Jefferson", "B. John Adams", "C. George Washington", "D. Benjamin Franklin"],
            correct_answer: "C",
            explanation: "George Washington was the first President of the United States, serving from 1789 to 1797."
          },
          {
            question: "The Great Wall of China was primarily built to protect against invasions from which direction?",
            options: ["A. South", "B. East", "C. West", "D. North"],
            correct_answer: "D",
            explanation: "The Great Wall was built primarily to protect against invasions from northern nomadic tribes."
          }
        ],
        'TrueFalse': [
          {
            question: "The Berlin Wall fell in 1989.",
            correct_answer: "True",
            explanation: "The Berlin Wall fell on November 9, 1989, marking a significant moment in German reunification."
          },
          {
            question: "The American Civil War lasted for 10 years.",
            correct_answer: "False",
            explanation: "The American Civil War lasted from 1861 to 1865, approximately 4 years."
          }
        ],
        'ShortAnswer': [
          {
            question: "What ancient wonder of the world was located in Alexandria, Egypt?",
            correct_answer: "Lighthouse of Alexandria",
            explanation: "The Lighthouse of Alexandria (Pharos of Alexandria) was one of the Seven Wonders of the Ancient World."
          }
        ]
      },
      'English Language': {
        'MCQ': [
          {
            question: "Which of the following is a proper noun?",
            options: ["A. city", "B. river", "C. London", "D. mountain"],
            correct_answer: "C",
            explanation: "London is a proper noun because it's the specific name of a city and should be capitalized."
          },
          {
            question: "What is the past tense of 'go'?",
            options: ["A. goed", "B. went", "C. gone", "D. going"],
            correct_answer: "B",
            explanation: "'Went' is the past tense of 'go'. 'Gone' is the past participle."
          }
        ],
        'TrueFalse': [
          {
            question: "An adjective describes a noun.",
            correct_answer: "True",
            explanation: "Yes, adjectives are words that describe or modify nouns and pronouns."
          },
          {
            question: "The word 'quickly' is a noun.",
            correct_answer: "False",
            explanation: "'Quickly' is an adverb, not a noun. It describes how an action is performed."
          }
        ],
        'ShortAnswer': [
          {
            question: "What do you call a word that has the opposite meaning of another word?",
            correct_answer: "antonym",
            explanation: "An antonym is a word that has the opposite meaning of another word."
          }
        ]
      },
      'General Knowledge': {
        'MCQ': [
          {
            question: "What is the capital of Australia?",
            options: ["A. Sydney", "B. Melbourne", "C. Canberra", "D. Brisbane"],
            correct_answer: "C",
            explanation: "Canberra is the capital city of Australia, though Sydney and Melbourne are larger cities."
          },
          {
            question: "How many continents are there?",
            options: ["A. 5", "B. 6", "C. 7", "D. 8"],
            correct_answer: "C",
            explanation: "There are 7 continents: Asia, Africa, North America, South America, Antarctica, Europe, and Australia/Oceania."
          }
        ],
        'TrueFalse': [
          {
            question: "The Great Pyramid of Giza is located in Egypt.",
            correct_answer: "True",
            explanation: "Yes, the Great Pyramid of Giza is located in Giza, Egypt, and is one of the Seven Wonders of the Ancient World."
          },
          {
            question: "Dolphins are fish.",
            correct_answer: "False",
            explanation: "Dolphins are mammals, not fish. They are warm-blooded, breathe air, and give birth to live young."
          }
        ],
        'ShortAnswer': [
          {
            question: "What is the largest ocean on Earth?",
            correct_answer: "Pacific Ocean",
            explanation: "The Pacific Ocean is the largest ocean, covering about one-third of Earth's surface."
          }
        ]
      }
    }

    // Get templates for the test type, fallback to general questions
    const templates = baseTemplates[testType as keyof typeof baseTemplates] || baseTemplates['Science']
    
    // Adjust difficulty by modifying question complexity (simplified approach)
    if (difficulty === 'Easy') {
      // Use simpler versions or first few questions
      return {
        'MCQ': templates['MCQ'].slice(0, 2),
        'TrueFalse': templates['TrueFalse'],
        'ShortAnswer': templates['ShortAnswer']
      }
    } else if (difficulty === 'Hard') {
      // Could add more complex variations, for now just use all
      return templates
    }
    
    return templates
  }

  // Build the prompt for question generation
  private buildPrompt(request: AIQuestionRequest, category?: TestCategory): string {
    const { test_type, difficulty, num_questions, question_types, topic_focus } = request
    
    let prompt = ''
    
    if (category?.ai_prompt_template) {
      // Use category-specific template
      prompt = category.ai_prompt_template
        .replace('{num_questions}', num_questions.toString())
        .replace('{difficulty}', difficulty)
        .replace('{topic_focus}', topic_focus || test_type)
        .replace('{question_type}', question_types.join(', '))
    } else {
      // Use generic template
      prompt = `Generate exactly ${num_questions} ${difficulty}-level questions about ${test_type}.`
      
      if (topic_focus) {
        prompt += ` Focus on: ${topic_focus}.`
      }
      
      prompt += ` Include the following question types: ${question_types.join(', ')}.`
    }

    prompt += `

IMPORTANT: Respond with valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text here",
      "type": "MCQ" | "TrueFalse" | "ShortAnswer",
      "options": ["A. option1", "B. option2", "C. option3", "D. option4"], // Only for MCQ
      "correct_answer": "A" | "True" | "exact answer text",
      "explanation": "Detailed explanation of why this is correct"
    }
  ]
}

Rules:
1. For MCQ: provide exactly 4 options labeled A, B, C, D
2. For TrueFalse: correct_answer should be "True" or "False"
3. For ShortAnswer: provide the exact expected answer
4. Make questions ${difficulty} difficulty level
5. Ensure all questions are educationally valuable
6. Include clear, informative explanations
7. Distribute question types as requested: ${question_types.join(', ')}`

    return prompt
  }

  // Validate generated questions
  private validateQuestions(questions: GeneratedQuestion[], request: AIQuestionRequest): GeneratedQuestion[] {
    const validated: GeneratedQuestion[] = []
    
    for (const question of questions) {
      if (this.isValidQuestion(question, request)) {
        validated.push(question)
      } else {
        console.warn('Invalid question filtered out:', question)
      }
    }
    
    return validated
  }

  // Check if a question is valid
  private isValidQuestion(question: GeneratedQuestion, request: AIQuestionRequest): boolean {
    // Basic validation
    if (!question.question || !question.type || !question.correct_answer) {
      return false
    }

    // Type-specific validation
    if (question.type === 'MCQ') {
      if (!question.options || question.options.length !== 4) {
        return false
      }
      // Check if correct_answer is one of A, B, C, D
      if (!['A', 'B', 'C', 'D'].includes(question.correct_answer)) {
        return false
      }
    }

    if (question.type === 'TrueFalse') {
      if (!['True', 'False', 'true', 'false'].includes(question.correct_answer)) {
        return false
      }
    }

    // Check if question type is in requested types
    if (!request.question_types.includes(question.type)) {
      return false
    }

    return true
  }

  // Estimate cost based on tokens (rough estimate for gpt-4o-mini)
  private estimateCost(tokens: number): number {
    // gpt-4o-mini pricing: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
    // Rough estimate assuming 70% input, 30% output
    const inputTokens = tokens * 0.7
    const outputTokens = tokens * 0.3
    
    const inputCost = (inputTokens / 1000000) * 0.15
    const outputCost = (outputTokens / 1000000) * 0.60
    
    return inputCost + outputCost
  }

  // Score short answer questions using AI (for more sophisticated scoring)
  async scoreShortAnswer(question: string, correctAnswer: string, userAnswer: string): Promise<{
    isCorrect: boolean;
    score: number; // 0-1
    feedback?: string;
  }> {
    try {
      const prompt = `
You are grading a short answer question. Determine if the user's answer is correct and provide a score from 0 to 1.

Question: ${question}
Correct Answer: ${correctAnswer}
User Answer: ${userAnswer}

Consider:
- Exact matches get score 1.0
- Semantically equivalent answers get score 0.8-1.0
- Partially correct answers get score 0.3-0.7
- Wrong answers get score 0-0.2

Respond with JSON:
{
  "score": 0.0-1.0,
  "isCorrect": true/false,
  "feedback": "Brief explanation of the scoring"
}
`

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to score answer')
      }

      const data = await response.json()
      const result = JSON.parse(data.choices[0].message.content)
      
      return {
        isCorrect: result.score >= 0.7, // Consider 0.7+ as correct
        score: result.score,
        feedback: result.feedback
      }

    } catch (error) {
      console.error('AI scoring failed:', error)
      // Fallback to simple string matching
      const isExactMatch = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
      return {
        isCorrect: isExactMatch,
        score: isExactMatch ? 1.0 : 0.0,
        feedback: 'Basic text matching used due to AI scoring failure'
      }
    }
  }

  // Generate follow-up study recommendations based on test results
  async generateStudyRecommendations(weakAreas: string[], testType: string): Promise<string[]> {
    try {
      const prompt = `
Based on a student's performance in a ${testType} test, they showed weakness in these areas: ${weakAreas.join(', ')}.

Provide 5-7 specific, actionable study recommendations to help them improve. Focus on:
1. Specific topics to review
2. Study methods and resources
3. Practice exercises
4. Key concepts to reinforce

Respond with JSON:
{
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}
`

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.7,
          response_format: { type: 'json_object' }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate recommendations')
      }

      const data = await response.json()
      const result = JSON.parse(data.choices[0].message.content)
      
      return result.recommendations || []

    } catch (error) {
      console.error('Failed to generate study recommendations:', error)
      return [
        `Review the fundamental concepts of ${testType}`,
        'Practice more questions in your weak areas',
        'Seek additional resources or tutoring if needed',
        'Take regular practice tests to track improvement'
      ]
    }
  }
}