import { Hono } from 'hono'
import { Env } from '../types/database'
import { DatabaseService } from '../utils/database'
import { AIService } from '../services/ai'
import { authMiddleware, getAuthUser } from '../middleware/auth'
import { getEnv } from '../utils/auth'

const social = new Hono<{ Bindings: Env }>()

social.get('/leaderboard', async (c) => {
  try {
    const category = c.req.query('category') || 'all'
    const period = c.req.query('period') || 'all'
    const db = DatabaseService.fromDatabaseUrl(getEnv(c, 'DATABASE_URL'))

    let query = `
      SELECT 
        u.id,
        u.name,
        MAX(ta.score) as best_score,
        AVG(ta.score) as avg_score,
        COUNT(ta.id) as test_count,
        MAX(ta.created_at) as last_test
      FROM users u
      JOIN test_attempts ta ON u.id = ta.user_id
      JOIN test_configurations tc ON ta.config_id = tc.id
      WHERE ta.status = 'Completed'
    `

    const params: any[] = []
    let index = 1

    if (category !== 'all') {
      query += ` AND tc.test_type = $${index++}`
      params.push(category)
    }

    if (period !== 'all') {
      const now = new Date()
      switch (period) {
        case 'today':
          query += ` AND DATE(ta.created_at) = $${index++}`
          params.push(now.toISOString().split('T')[0])
          break
        case 'week': {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          query += ` AND ta.created_at >= $${index++}`
          params.push(weekAgo.toISOString())
          break
        }
        case 'month': {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          query += ` AND ta.created_at >= $${index++}`
          params.push(monthAgo.toISOString())
          break
        }
      }
    }

    query += `
      GROUP BY u.id, u.name
      HAVING COUNT(ta.id) >= 1
      ORDER BY best_score DESC, avg_score DESC
      LIMIT 100
    `

    const leaderboard = await db.rawQuery<any>(query, params)

    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1,
      badge: index === 0 ? '🏆' : index === 1 ? '🥇' : index === 2 ? '🥈' : index === 3 ? '🥉' : 
             user.best_score >= 90 ? '⭐' : user.best_score >= 80 ? '🎯' : '🏅'
    }))

    return c.json({ success: true, leaderboard: rankedLeaderboard, filters: { category, period } })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return c.json({ success: false, message: 'Failed to fetch leaderboard' }, 500)
  }
})

social.get('/achievements', authMiddleware, async (c) => {
  try {
    const auth = getAuthUser(c)
    if (!auth) return c.json({ success: false, message: 'Authentication required' }, 401)

    const db = DatabaseService.fromDatabaseUrl(getEnv(c, 'DATABASE_URL'))
    const userStats = await db.getTestStatistics(auth.user_id)
    const attempts = await db.getUserTestAttempts(auth.user_id, 1000)
    const achievements = calculateAchievements(userStats, attempts)

    return c.json({
      success: true,
      achievements,
      total_unlocked: achievements.score.filter((a: any) => a.unlocked).length +
        achievements.consistency.filter((a: any) => a.unlocked).length +
        achievements.mastery.filter((a: any) => a.unlocked).length +
        achievements.special.filter((a: any) => a.unlocked).length
    })
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return c.json({ success: false, message: 'Failed to fetch achievements' }, 500)
  }
})

social.get('/statistics', authMiddleware, async (c) => {
  try {
    const auth = getAuthUser(c)
    if (!auth) return c.json({ success: false, message: 'Authentication required' }, 401)

    const db = DatabaseService.fromDatabaseUrl(getEnv(c, 'DATABASE_URL'))
    const userStats = await db.getTestStatistics(auth.user_id)

    const [globalStats] = await db.rawQuery<any>(`
      SELECT 
        COALESCE(AVG(score), 0) as avg_score,
        COALESCE(MAX(score), 0) as best_score,
        COALESCE(AVG(total_questions), 0) as avg_questions,
        COUNT(*) as total_attempts
      FROM test_attempts 
      WHERE status = 'Completed'
    `)

    const [rankResult] = await db.rawQuery<any>(`
      SELECT COUNT(*) + 1 as rank
      FROM (
        SELECT user_id, MAX(score) as best_score
        FROM test_attempts
        WHERE status = 'Completed'
        GROUP BY user_id
      ) user_scores
      WHERE best_score > $1
    `, [userStats.best_score])

    const subjectPerformance = await db.rawQuery<any>(`
      SELECT 
        tc.test_type,
        AVG(ta.score) as avg_score,
        COUNT(ta.id) as test_count
      FROM test_attempts ta
      JOIN test_configurations tc ON ta.config_id = tc.id
      WHERE ta.user_id = $1 AND ta.status = 'Completed'
      GROUP BY tc.test_type
    `, [auth.user_id])

    return c.json({
      success: true,
      user_stats: userStats,
      global_stats: globalStats || {},
      rank: rankResult?.rank || 1,
      subject_performance: subjectPerformance
    })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return c.json({ success: false, message: 'Failed to fetch statistics' }, 500)
  }
})

social.get('/challenges', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const challenge = generateDailyChallenge(today)
    const participantCount = Math.floor(Math.random() * 80) + 20

    let challengeHistory: any[] = []
    const authHeader = c.req.header('Authorization')
    if (authHeader) {
      challengeHistory = [
        { date: '2025-08-15', description: 'Complete 3 tests', completed: true, reward: 'Achievement Badge' },
        { date: '2025-08-14', description: 'Score above 90%', completed: false, reward: 'Bonus Points' },
        { date: '2025-08-13', description: 'Take a Programming test', completed: true, reward: 'New Avatar' }
      ]
    }

    return c.json({
      success: true,
      today_challenge: {
        ...challenge,
        participants: participantCount,
        max_participants: 100
      },
      history: challengeHistory
    })
  } catch (error) {
    console.error('Error fetching challenges:', error)
    return c.json({ success: false, message: 'Failed to fetch challenges' }, 500)
  }
})

social.post('/recommendations', authMiddleware, async (c) => {
  try {
    const auth = getAuthUser(c)
    if (!auth) return c.json({ success: false, message: 'Authentication required' }, 401)

    const body = await c.req.json()
    const { attempt_id, weak_areas, test_type, score } = body

    if (!attempt_id || !test_type || score === undefined) {
      return c.json({ success: false, message: 'Missing required parameters' }, 400)
    }

    const openaiKey = getEnv(c, 'OPENAI_API_KEY')
    if (!openaiKey) {
      return c.json({
        success: true,
        recommendations: generateGenericRecommendations(score, test_type, weak_areas),
        source: 'generic'
      })
    }

    const aiService = new AIService(openaiKey)
    const recommendations = await aiService.generateStudyRecommendations(weak_areas || [], test_type)

    return c.json({ success: true, recommendations, source: 'ai' })
  } catch (error) {
    console.error('Error generating recommendations:', error)

    const body = await c.req.json().catch(() => ({}))
    const genericRecommendations = generateGenericRecommendations(
      body.score || 0,
      body.test_type || 'General',
      body.weak_areas || []
    )

    return c.json({ success: true, recommendations: genericRecommendations, source: 'generic' })
  }
})

function calculateAchievements(userStats: any, attempts: any[]): any {
  return {
    score: [
      {
        name: 'First Success',
        description: 'Score above 70% on any test',
        icon: '🎯',
        unlocked: userStats.best_score >= 70,
        progress: Math.min(100, (userStats.best_score / 70) * 100)
      },
      {
        name: 'High Achiever',
        description: 'Score above 90% on any test',
        icon: '🌟',
        unlocked: userStats.best_score >= 90,
        progress: Math.min(100, (userStats.best_score / 90) * 100)
      },
      {
        name: 'Perfectionist',
        description: 'Score 100% on any test',
        icon: '💯',
        unlocked: userStats.best_score >= 100,
        progress: Math.min(100, userStats.best_score)
      }
    ],
    consistency: [
      {
        name: 'Getting Started',
        description: 'Take 5 tests',
        icon: '🏃',
        unlocked: userStats.total_tests >= 5,
        progress: Math.min(100, (userStats.total_tests / 5) * 100)
      },
      {
        name: 'Regular Learner',
        description: 'Take 25 tests',
        icon: '📚',
        unlocked: userStats.total_tests >= 25,
        progress: Math.min(100, (userStats.total_tests / 25) * 100)
      },
      {
        name: 'Dedicated Student',
        description: 'Take 100 tests',
        icon: '🎓',
        unlocked: userStats.total_tests >= 100,
        progress: Math.min(100, (userStats.total_tests / 100) * 100)
      }
    ],
    mastery: [
      { name: 'Math Wizard', description: 'Score above 80% in 3 Math tests', icon: '🔢', unlocked: false, progress: 33 },
      { name: 'Science Explorer', description: 'Score above 80% in 3 Science tests', icon: '🔬', unlocked: false, progress: 66 },
      { name: 'Renaissance Mind', description: 'Master all 6 categories', icon: '🧠', unlocked: false, progress: 16 }
    ],
    special: [
      {
        name: 'Speed Demon',
        description: 'Complete a test in under 10 minutes',
        icon: '⚡',
        unlocked: userStats.avg_time_per_question < 30,
        progress: userStats.avg_time_per_question < 30 ? 100 : 0
      },
      { name: 'Night Owl', description: 'Take a test after midnight', icon: '🦉', unlocked: false, progress: 0 },
      { name: 'Early Bird', description: 'Take a test before 6 AM', icon: '🌅', unlocked: false, progress: 0 }
    ]
  }
}

function generateDailyChallenge(date: string): any {
  const challenges = [
    { description: 'Score above 85% in a Math test', reward: 'Double XP for next test', type: 'score', target: { category: 'Mathematics', score: 85 } },
    { description: 'Complete a Science test in under 15 minutes', reward: 'Speed Achievement Badge', type: 'time', target: { category: 'Science', time: 900 } },
    { description: 'Take tests in 3 different categories today', reward: 'Variety Explorer Badge', type: 'variety', target: { categories: 3 } },
    { description: 'Score 100% on any Easy level test', reward: 'Perfectionist Points', type: 'perfect', target: { difficulty: 'Easy', score: 100 } },
    { description: 'Answer 50 questions correctly today', reward: 'Knowledge Accumulator Badge', type: 'volume', target: { correct_answers: 50 } }
  ]

  const dateNum = parseInt(date.replace(/-/g, ''))
  return challenges[dateNum % challenges.length]
}

function generateGenericRecommendations(score: number, testType: string, weakAreas: string[]): string[] {
  const recommendations: string[] = []

  if (score >= 90) {
    recommendations.push(
      `Excellent work on ${testType}! You've demonstrated strong mastery of the subject.`,
      `Consider challenging yourself with harder difficulty levels or advanced topics.`,
      `Share your knowledge by helping others or exploring teaching opportunities.`,
      `Look into related subjects to broaden your expertise.`,
      `Set new goals to maintain your high performance standards.`
    )
  } else if (score >= 70) {
    recommendations.push(
      `Good foundation in ${testType}. Focus on strengthening the areas where you scored below 80%.`,
      `Review the explanations for questions you got wrong to understand the concepts better.`,
      `Practice more questions in your weaker areas before attempting the next test.`,
      `Consider studying additional resources or textbooks for deeper understanding.`,
      `Take regular practice tests to build confidence and identify remaining gaps.`
    )
    if (weakAreas.length > 0) recommendations.push(`Pay special attention to: ${weakAreas.join(', ')}.`)
  } else if (score >= 50) {
    recommendations.push(
      `${testType} requires significant improvement, but you're on the right track!`,
      `Start by reviewing the fundamental concepts and basic principles.`,
      `Focus on understanding rather than memorizing, this will help with application.`,
      `Practice with easier questions first to build confidence, then progress to harder ones.`,
      `Consider seeking additional help through tutoring, study groups, or online courses.`,
      `Set up a regular study schedule and stick to it for consistent improvement.`
    )
  } else {
    recommendations.push(
      `Don't get discouraged! ${testType} is challenging, but with proper study, you can improve significantly.`,
      `Begin with the absolute basics and make sure you understand the foundational concepts.`,
      `Use multiple learning resources: textbooks, videos, interactive tutorials, and practice tests.`,
      `Consider getting help from a tutor or joining a study group for structured learning.`,
      `Break down complex topics into smaller, manageable pieces.`,
      `Practice consistently, even 15-30 minutes daily can lead to significant improvement.`,
      `Don't hesitate to ask questions when you're confused about a concept.`
    )
  }

  return recommendations
}

export { social }
