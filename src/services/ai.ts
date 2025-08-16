// AI Service for Question Generation and Scoring
import { AIQuestionRequest, GeneratedQuestion, AIGenerationResponse, TestCategory } from '../types/database'

export class AIService {
  private apiKey: string
  private baseUrl = 'https://api.openai.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  // Generate questions using OpenAI API
  async generateQuestions(request: AIQuestionRequest, category?: TestCategory): Promise<AIGenerationResponse> {
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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
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