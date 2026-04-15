import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const TEST_PORT = process.env.SMOKE_TEST_PORT || '3100'
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`

function createCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: { ...process.env, CI: '1' },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr })
      } else {
        reject(new Error(`Command failed (${command} ${args.join(' ')}):\n${stdout}\n${stderr}`))
      }
    })
  })
}

async function waitForHealth(baseUrl, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs
  let lastError = null

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health`)
      if (response.ok) {
        return
      }
      lastError = new Error(`Health responded with ${response.status}`)
    } catch (error) {
      lastError = error
    }

    await delay(500)
  }

  throw new Error(`Timed out waiting for local app health check. Last error: ${lastError?.message || 'unknown'}`)
}

export async function startLocalApp() {
  await createCommand('npm', ['run', 'build'])

  const child = spawn('npx', ['tsx', 'src/server.ts'], {
    cwd: process.cwd(),
    env: { ...process.env, CI: '1', PORT: TEST_PORT },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true
  })

  let logs = ''
  const appendLogs = (chunk) => {
    logs += chunk.toString()
  }

  child.stdout.on('data', appendLogs)
  child.stderr.on('data', appendLogs)

  child.on('exit', (code) => {
    if (code !== null && code !== 0) {
      logs += `\nProcess exited early with code ${code}`
    }
  })

  try {
    await waitForHealth(BASE_URL)
  } catch (error) {
    child.kill('SIGTERM')
    throw new Error(`${error.message}\n\nServer logs:\n${logs}`)
  }

  return {
    child,
    baseUrl: BASE_URL,
    getLogs: () => logs
  }
}

export async function stopLocalApp(app) {
  if (!app?.child) {
    return
  }

  const child = app.child
  if (child.exitCode !== null) {
    return
  }

  const exitPromise = new Promise((resolve) => {
    child.once('exit', resolve)
  })

  try {
    process.kill(-child.pid, 'SIGTERM')
  } catch {
    child.kill('SIGTERM')
  }

  const result = await Promise.race([
    exitPromise.then(() => 'exited'),
    delay(1000).then(() => 'timeout')
  ])

  if (result === 'timeout' && child.exitCode === null) {
    try {
      process.kill(-child.pid, 'SIGKILL')
    } catch {
      child.kill('SIGKILL')
    }
    await exitPromise
  }
}

export async function apiRequest(baseUrl, path, options = {}) {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {})
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  })

  const text = await response.text()
  let body

  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }

  return {
    status: response.status,
    body
  }
}
