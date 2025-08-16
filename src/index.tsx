import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/cloudflare-workers'
import { Env } from './types/database'
import { auth } from './routes/auth'
import { tests } from './routes/tests'
import { DatabaseService } from './utils/database'

const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', logger())
app.use('/api/*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// API Routes
app.route('/api/auth', auth)
app.route('/api/tests', tests)

// Health check endpoint
app.get('/api/health', async (c) => {
  try {
    // Test database connection
    const db = new DatabaseService(c.env.DB)
    await c.env.DB.prepare('SELECT 1').first()
    
    return c.json({
      success: true,
      message: 'AI Test Application is running',
      timestamp: new Date().toISOString(),
      database: 'connected'
    })
  } catch (error) {
    return c.json({
      success: false,
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 503)
  }
})

// Main application route
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Test Application</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#3B82F6',
                  secondary: '#64748B'
                }
              }
            }
          }
        </script>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- Navigation -->
        <nav class="bg-white shadow-sm border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <i class="fas fa-brain text-primary text-2xl mr-3"></i>
                        <span class="font-bold text-xl text-gray-900">AI Test Application</span>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button id="loginBtn" class="text-primary hover:text-blue-700 font-medium">
                            <i class="fas fa-sign-in-alt mr-1"></i>Login
                        </button>
                        <button id="registerBtn" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-user-plus mr-1"></i>Register
                        </button>
                        <div id="userMenu" class="hidden flex items-center space-x-4">
                            <span id="userName" class="text-gray-700"></span>
                            <button id="logoutBtn" class="text-red-600 hover:text-red-800">
                                <i class="fas fa-sign-out-alt mr-1"></i>Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <!-- Welcome Section -->
            <div id="welcomeSection" class="text-center py-12">
                <h1 class="text-4xl font-bold text-gray-900 mb-4">
                    Welcome to AI Test Application
                </h1>
                <p class="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                    Create personalized tests, take unlimited attempts, and get AI-powered scoring and insights. 
                    Improve your knowledge with adaptive questions tailored to your skill level.
                </p>
                <div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-12">
                    <div class="bg-white p-6 rounded-lg shadow-sm border">
                        <i class="fas fa-cogs text-primary text-3xl mb-4"></i>
                        <h3 class="font-semibold text-lg mb-2">Customizable Tests</h3>
                        <p class="text-gray-600">Choose from multiple subjects, difficulty levels, and question types</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-sm border">
                        <i class="fas fa-robot text-primary text-3xl mb-4"></i>
                        <h3 class="font-semibold text-lg mb-2">AI-Generated Questions</h3>
                        <p class="text-gray-600">Fresh questions every time with intelligent explanations</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-sm border">
                        <i class="fas fa-chart-line text-primary text-3xl mb-4"></i>
                        <h3 class="font-semibold text-lg mb-2">Performance Analytics</h3>
                        <p class="text-gray-600">Track your progress and identify areas for improvement</p>
                    </div>
                </div>
            </div>

            <!-- Dashboard Section (hidden by default) -->
            <div id="dashboardSection" class="hidden">
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div class="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-shadow" id="newTestCard">
                        <i class="fas fa-plus-circle text-primary text-3xl mb-4"></i>
                        <h3 class="font-semibold text-lg mb-2">Start New Test</h3>
                        <p class="text-gray-600">Create and configure a new test</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-shadow" id="historyCard">
                        <i class="fas fa-history text-primary text-3xl mb-4"></i>
                        <h3 class="font-semibold text-lg mb-2">Test History</h3>
                        <p class="text-gray-600">View your past test attempts</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-shadow" id="profileCard">
                        <i class="fas fa-user text-primary text-3xl mb-4"></i>
                        <h3 class="font-semibold text-lg mb-2">Profile</h3>
                        <p class="text-gray-600">Manage your account settings</p>
                    </div>
                </div>

                <!-- Statistics Overview -->
                <div id="statsSection" class="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <h3 class="font-semibold text-lg mb-4">Your Statistics</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="statsGrid">
                        <!-- Statistics will be loaded here -->
                    </div>
                </div>
            </div>
        </main>

        <!-- Modals -->
        <!-- Login Modal -->
        <div id="loginModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold">Login</h2>
                    <button id="closeLoginModal" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="loginForm">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input type="email" id="loginEmail" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" required>
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input type="password" id="loginPassword" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" required>
                    </div>
                    <button type="submit" class="w-full bg-primary text-white py-3 rounded-lg hover:bg-blue-700 transition-colors">
                        Login
                    </button>
                </form>
                <p class="mt-4 text-center text-sm text-gray-600">
                    Don't have an account? 
                    <button id="switchToRegister" class="text-primary hover:text-blue-700 font-medium">Register here</button>
                </p>
            </div>
        </div>

        <!-- Register Modal -->
        <div id="registerModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold">Register</h2>
                    <button id="closeRegisterModal" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="registerForm">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input type="text" id="registerName" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input type="email" id="registerEmail" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input type="password" id="registerPassword" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Age (optional)</label>
                        <input type="number" id="registerAge" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" min="13" max="120">
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Education Level (optional)</label>
                        <select id="registerEducation" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                            <option value="">Select education level</option>
                            <option value="High School">High School</option>
                            <option value="Associate's Degree">Associate's Degree</option>
                            <option value="Bachelor's Degree">Bachelor's Degree</option>
                            <option value="Master's Degree">Master's Degree</option>
                            <option value="Doctorate">Doctorate</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <button type="submit" class="w-full bg-primary text-white py-3 rounded-lg hover:bg-blue-700 transition-colors">
                        Register
                    </button>
                </form>
                <p class="mt-4 text-center text-sm text-gray-600">
                    Already have an account? 
                    <button id="switchToLogin" class="text-primary hover:text-blue-700 font-medium">Login here</button>
                </p>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
