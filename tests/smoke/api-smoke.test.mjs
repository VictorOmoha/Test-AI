import test from 'node:test'
import assert from 'node:assert/strict'
import { startLocalApp, stopLocalApp, apiRequest } from './helpers/local-app.mjs'

let app

test.before(async () => {
  app = await startLocalApp()
})

test.after(async () => {
  await stopLocalApp(app)
})

test('health endpoint responds successfully', async () => {
  const response = await apiRequest(app.baseUrl, '/api/health')

  assert.equal(response.status, 200)
  assert.equal(response.body.success, true)
  assert.equal(response.body.database, 'connected')
})

test('register -> create config -> start test succeeds without OpenAI key', async () => {
  const email = `smoke-${Date.now()}@local.test`

  const register = await apiRequest(app.baseUrl, '/api/auth/register', {
    method: 'POST',
    body: {
      email,
      password: 'demo12345',
      name: 'Smoke Test User',
      age: 30,
      education_level: 'College'
    }
  })

  assert.equal(register.status, 201)
  assert.equal(register.body.success, true)
  assert.ok(register.body.token)

  const config = await apiRequest(app.baseUrl, '/api/tests/config', {
    method: 'POST',
    token: register.body.token,
    body: {
      test_type: 'Mathematics',
      difficulty: 'Easy',
      num_questions: 10,
      duration_minutes: 15,
      question_types: ['MCQ', 'ShortAnswer']
    }
  })

  assert.equal(config.status, 201)
  assert.equal(config.body.success, true)
  assert.ok(config.body.config_id)

  const start = await apiRequest(app.baseUrl, '/api/tests/start', {
    method: 'POST',
    token: register.body.token,
    body: { config_id: config.body.config_id }
  })

  assert.equal(start.status, 201)
  assert.equal(start.body.success, true)
  assert.equal(start.body.message, 'Test started successfully')
  assert.equal(start.body.questions.length, 10)
})
