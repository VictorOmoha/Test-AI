import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/cloudflare-workers'
import { Env } from './types/database'
import { auth } from './routes/auth'
import { tests } from './routes/tests'
import { social } from './routes/social'
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
app.route('/api/social', social)

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
                  primary: '#1E40AF',
                  secondary: '#64748B',
                  success: '#10B981',
                  warning: '#F59E0B',
                  error: '#EF4444',
                  purple: '#8B5CF6'
                },
                borderWidth: {
                  '3': '3px'
                }
              }
            }
          }
        </script>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- Top Navigation -->
        <nav class="bg-white shadow-sm border-b border-gray-200">
            <div class="max-w-full px-6">
                <div class="flex justify-between items-center h-16">
                    <!-- Logo -->
                    <div class="flex items-center">
                        <div class="bg-primary text-white w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                            <i class="fas fa-graduation-cap text-sm"></i>
                        </div>
                        <span class="font-bold text-xl text-gray-900">TestAI</span>
                    </div>
                    
                    <!-- Navigation Tabs -->
                    <div id="mainNavTabs" class="hidden md:flex space-x-8">
                        <button class="nav-tab active" data-tab="dashboard">
                            <i class="fas fa-chart-pie mr-1"></i>Dashboard
                        </button>
                        <button class="nav-tab" data-tab="tests">
                            <i class="fas fa-tasks mr-1"></i>Tests
                        </button>
                        <button class="nav-tab" data-tab="history">
                            <i class="fas fa-history mr-1"></i>History
                        </button>
                        <button class="nav-tab" data-tab="analytics">
                            <i class="fas fa-chart-line mr-1"></i>Analytics
                        </button>
                    </div>
                    
                    <!-- User Menu -->
                    <div class="flex items-center space-x-4">
                        <button id="loginBtn" class="text-primary hover:text-blue-700 font-medium">
                            <i class="fas fa-sign-in-alt mr-1"></i>Login
                        </button>
                        <button id="registerBtn" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-user-plus mr-1"></i>Register
                        </button>
                        <div id="userMenu" class="hidden flex items-center space-x-4">
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-bell text-gray-400"></i>
                                <i class="fas fa-cog text-gray-400"></i>
                                <div class="flex items-center space-x-2">
                                    <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                        <span id="userInitials" class="text-white text-sm font-medium"></span>
                                    </div>
                                    <span id="userName" class="text-gray-700 font-medium"></span>
                                    <i class="fas fa-chevron-down text-gray-400 text-xs"></i>
                                </div>
                            </div>
                            <button id="logoutBtn" class="text-red-600 hover:text-red-800 ml-4">
                                <i class="fas fa-sign-out-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="flex bg-gray-50 min-h-screen">
            <!-- Sidebar (shown when logged in) -->
            <div id="sidebar" class="hidden w-64 bg-white border-r border-gray-200 min-h-screen">
                <div class="flex flex-col h-full">
                    <!-- Logo Section -->
                    <div class="px-6 py-6 border-b border-gray-200">
                        <div class="flex items-center">
                            <div class="bg-primary text-white w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                                <i class="fas fa-graduation-cap text-sm"></i>
                            </div>
                            <span class="font-bold text-xl text-gray-900">TestAI</span>
                        </div>
                    </div>
                    
                    <!-- Navigation -->
                    <nav class="flex-1 px-4 py-6">
                        <div class="space-y-1">
                            <a href="#" class="sidebar-item active" data-section="dashboard">
                                <i class="fas fa-home w-5"></i>
                                <span>Dashboard</span>
                            </a>
                            <a href="#" class="sidebar-item" data-section="tests">
                                <i class="fas fa-tasks w-5"></i>
                                <span>Tests</span>
                            </a>
                            <a href="#" class="sidebar-item" data-section="history">
                                <i class="fas fa-history w-5"></i>
                                <span>History</span>
                            </a>
                            <a href="#" class="sidebar-item" data-section="analytics">
                                <i class="fas fa-chart-line w-5"></i>
                                <span>Analytics</span>
                            </a>
                            <a href="#" class="sidebar-item" data-section="profile">
                                <i class="fas fa-user w-5"></i>
                                <span>Profile</span>
                            </a>
                            <a href="#" class="sidebar-item" data-section="settings">
                                <i class="fas fa-cog w-5"></i>
                                <span>Settings</span>
                            </a>
                        </div>
                    </nav>
                    
                    <!-- Bottom Section -->
                    <div class="px-4 py-6 border-t border-gray-200">
                        <div class="space-y-1">
                            <a href="#" class="sidebar-item">
                                <i class="fas fa-question-circle w-5"></i>
                                <span>Help & Support</span>
                            </a>
                            <a href="#" class="sidebar-item" onclick="testApp.logout()">
                                <i class="fas fa-sign-out-alt w-5"></i>
                                <span>Logout</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Content Area -->
            <div class="flex-1">
                <!-- Welcome Section -->
                <div id="welcomeSection" class="py-12 px-8">
                    <div class="text-center max-w-4xl mx-auto">
                        <h1 class="text-4xl font-bold text-gray-900 mb-4">
                            Welcome to AI Test Application
                        </h1>
                        <p class="text-xl text-gray-600 mb-8">
                            Create personalized tests, take unlimited attempts, and get AI-powered scoring and insights. 
                            Improve your knowledge with adaptive questions tailored to your skill level.
                        </p>
                        <div class="grid md:grid-cols-3 gap-8 mt-12">
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
                </div>

                <!-- Dashboard Section (hidden by default) -->
                <div id="dashboardSection" class="hidden flex-1 bg-gray-50">
                    <!-- Top Bar -->
                    <div class="bg-white border-b border-gray-200 px-6 py-4">
                        <div>
                            <h1 class="text-2xl font-bold text-gray-900" id="welcomeMessage">Welcome back, John!</h1>
                            <p class="text-gray-600 text-sm mt-1">Here's an overview of your test activities and performance.</p>
                        </div>
                    </div>
                    
                    <div class="p-6">

                        <!-- Statistics Cards -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div class="bg-white p-6 rounded-lg shadow-sm border">
                                <div class="flex items-center">
                                    <div class="flex-1">
                                        <p class="text-sm text-gray-600 mb-1">Tests Taken</p>
                                        <p class="text-2xl font-bold text-gray-900" id="testsTaken">24</p>
                                        <p class="text-xs text-success flex items-center mt-1">
                                            <i class="fas fa-arrow-up mr-1"></i>+2% vs last month
                                        </p>
                                    </div>
                                    <div class="ml-4">
                                        <i class="fas fa-tasks text-2xl text-primary"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white p-6 rounded-lg shadow-sm border">
                                <div class="flex items-center">
                                    <div class="flex-1">
                                        <p class="text-sm text-gray-600 mb-1">Average Score</p>
                                        <p class="text-2xl font-bold text-gray-900" id="averageScore">78%</p>
                                        <p class="text-xs text-success flex items-center mt-1">
                                            <i class="fas fa-arrow-up mr-1"></i>+5% vs last month
                                        </p>
                                    </div>
                                    <div class="ml-4">
                                        <i class="fas fa-chart-line text-2xl text-success"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white p-6 rounded-lg shadow-sm border">
                                <div class="flex items-center">
                                    <div class="flex-1">
                                        <p class="text-sm text-gray-600 mb-1">Test Categories</p>
                                        <p class="text-2xl font-bold text-gray-900" id="testCategories">5</p>
                                        <p class="text-xs text-success flex items-center mt-1">
                                            <i class="fas fa-arrow-up mr-1"></i>+2 new categories added
                                        </p>
                                    </div>
                                    <div class="ml-4">
                                        <i class="fas fa-layer-group text-2xl text-purple"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white p-6 rounded-lg shadow-sm border">
                                <div class="flex items-center">
                                    <div class="flex-1">
                                        <p class="text-sm text-gray-600 mb-1">Time Spent</p>
                                        <p class="text-2xl font-bold text-gray-900" id="timeSpent">12h 30m</p>
                                        <p class="text-xs text-warning flex items-center mt-1">
                                            <i class="fas fa-arrow-down mr-1"></i>-3% vs last month
                                        </p>
                                    </div>
                                    <div class="ml-4">
                                        <i class="fas fa-clock text-2xl text-warning"></i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Performance Chart and Recent Tests -->
                        <div class="grid lg:grid-cols-3 gap-8 mb-8">
                            <!-- Performance Trend Chart -->
                            <div class="lg:col-span-2">
                                <div class="bg-white p-6 rounded-lg shadow-sm border">
                                    <div class="flex justify-between items-center mb-6">
                                        <h3 class="text-lg font-semibold text-gray-900">Performance Trend</h3>
                                        <div class="flex space-x-2">
                                            <button class="chart-tab-btn active" data-period="weekly">Weekly</button>
                                            <button class="chart-tab-btn" data-period="monthly">Monthly</button>
                                            <button class="chart-tab-btn" data-period="yearly">Yearly</button>
                                        </div>
                                    </div>
                                    <div class="h-64">
                                        <canvas id="performanceChart" class="w-full h-full"></canvas>
                                    </div>
                                </div>
                            </div>

                            <!-- Recent Tests -->
                            <div>
                                <div class="bg-white p-6 rounded-lg shadow-sm border">
                                    <div class="flex justify-between items-center mb-6">
                                        <h3 class="text-lg font-semibold text-gray-900">Recent Tests</h3>
                                        <a href="#" class="text-primary text-sm font-medium hover:text-blue-700">View All</a>
                                    </div>
                                    <div class="space-y-4" id="recentTestsList">
                                        <!-- Recent tests will be loaded here -->
                                    </div>
                                    <button id="takeNewTestBtn" class="w-full mt-6 bg-primary text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                                        Take New Test
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Test Categories and Quick Test Creator -->
                        <div class="grid lg:grid-cols-3 gap-8">
                            <!-- Test Categories -->
                            <div class="lg:col-span-2">
                                <div class="bg-white p-6 rounded-lg shadow-sm border">
                                    <div class="flex justify-between items-center mb-6">
                                        <h3 class="text-lg font-semibold text-gray-900">Test Categories</h3>
                                        <a href="#" class="text-primary text-sm font-medium hover:text-blue-700">View All</a>
                                    </div>
                                    <div class="grid md:grid-cols-2 gap-4" id="testCategoriesGrid">
                                        <!-- Test categories will be loaded here -->
                                    </div>
                                </div>
                            </div>

                            <!-- Create New Test -->
                            <div>
                                <div class="bg-white p-6 rounded-lg shadow-sm border">
                                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Create New Test</h3>
                                    <form id="quickTestForm">
                                        <div class="space-y-4">
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-2">Test Category</label>
                                                <select id="quickTestCategory" class="w-full p-2 border border-gray-300 rounded-lg text-sm">
                                                    <option value="">Select category...</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                                                <div class="flex space-x-2">
                                                    <button type="button" class="difficulty-btn active" data-difficulty="Easy">Easy</button>
                                                    <button type="button" class="difficulty-btn" data-difficulty="Medium">Medium</button>
                                                    <button type="button" class="difficulty-btn" data-difficulty="Hard">Hard</button>
                                                </div>
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                                    Number of Questions: <span id="questionCount">15</span>
                                                </label>
                                                <input type="range" id="questionSlider" min="10" max="50" value="15" class="w-full">
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-2">Question Types</label>
                                                <div class="flex flex-wrap gap-2">
                                                    <label class="flex items-center">
                                                        <input type="checkbox" value="MCQ" checked class="mr-1">
                                                        <span class="text-sm">Multiple Choice</span>
                                                    </label>
                                                    <label class="flex items-center">
                                                        <input type="checkbox" value="TrueFalse" class="mr-1">
                                                        <span class="text-sm">True/False</span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-2">Time Limit</label>
                                                <select id="timeLimitSelect" class="w-full p-2 border border-gray-300 rounded-lg text-sm">
                                                    <option value="">No time limit</option>
                                                    <option value="15">15 minutes</option>
                                                    <option value="30">30 minutes</option>
                                                    <option value="45">45 minutes</option>
                                                    <option value="60">1 hour</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button type="submit" class="w-full mt-6 bg-primary text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                                            Generate Test
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>

                        <!-- Test in Progress -->
                        <div class="bg-white p-6 rounded-lg shadow-sm border mb-8">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Test in Progress</h3>
                            <div id="testInProgress">
                                <!-- Test in progress will be loaded here -->
                            </div>
                        </div>

                        <!-- Areas for Improvement and AI Recommendations -->
                        <div class="grid lg:grid-cols-2 gap-8">
                            <!-- Areas for Improvement -->
                            <div class="bg-white p-6 rounded-lg shadow-sm border">
                                <h3 class="text-lg font-semibold text-gray-900 mb-6">Areas for Improvement</h3>
                                <div class="space-y-4" id="improvementAreas">
                                    <!-- Improvement areas will be loaded here -->
                                </div>
                            </div>

                            <!-- AI Recommendations -->
                            <div class="bg-white p-6 rounded-lg shadow-sm border">
                                <div class="flex justify-between items-center mb-6">
                                    <h3 class="text-lg font-semibold text-gray-900">AI Recommendations</h3>
                                    <span class="text-xs text-purple-600 font-medium px-2 py-1 bg-purple-100 rounded-full">Powered by AI</span>
                                </div>
                                <div class="space-y-4" id="aiRecommendations">
                                    <!-- AI recommendations will be loaded here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tests Section -->
                <div id="testsSection" class="hidden flex-1 bg-gray-50">
                    <div class="bg-white border-b border-gray-200 px-6 py-4">
                        <div>
                            <h1 class="text-2xl font-bold text-gray-900">My Tests</h1>
                            <p class="text-gray-600 text-sm mt-1">Create and manage your tests</p>
                        </div>
                    </div>
                    <div class="p-6">
                        <!-- Test Creation Form -->
                        <div class="bg-white p-6 rounded-lg shadow-sm border mb-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Create New Test</h3>
                            <div id="testCreationForm">
                                <!-- Test creation form will be loaded here -->
                                <div class="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Test Category</label>
                                        <select id="testCategory" class="w-full p-3 border border-gray-300 rounded-lg">
                                            <option value="">Select category...</option>
                                            <option value="mathematics">Mathematics</option>
                                            <option value="science">Science</option>
                                            <option value="programming">Programming</option>
                                            <option value="history">History</option>
                                            <option value="english">English</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                                        <div class="flex space-x-2">
                                            <button type="button" class="difficulty-btn active" data-difficulty="Easy">Easy</button>
                                            <button type="button" class="difficulty-btn" data-difficulty="Medium">Medium</button>
                                            <button type="button" class="difficulty-btn" data-difficulty="Hard">Hard</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                            Number of Questions: <span id="questionCountDisplay">15</span>
                                        </label>
                                        <input type="range" id="questionCountSlider" min="5" max="50" value="15" class="w-full">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Time Limit</label>
                                        <select id="timeLimit" class="w-full p-3 border border-gray-300 rounded-lg">
                                            <option value="">No time limit</option>
                                            <option value="15">15 minutes</option>
                                            <option value="30">30 minutes</option>
                                            <option value="45">45 minutes</option>
                                            <option value="60">1 hour</option>
                                        </select>
                                    </div>
                                </div>
                                <button id="createTestBtn" class="mt-6 bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                                    Generate Test
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- History Section -->
                <div id="historySection" class="hidden flex-1 bg-gray-50">
                    <div class="bg-white border-b border-gray-200 px-6 py-4">
                        <div>
                            <h1 class="text-2xl font-bold text-gray-900">Test History</h1>
                            <p class="text-gray-600 text-sm mt-1">Review your past test performances</p>
                        </div>
                    </div>
                    <div class="p-6">
                        <div class="bg-white p-6 rounded-lg shadow-sm border">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Test Results</h3>
                            <div id="testHistoryList">
                                <!-- Test history will be loaded here -->
                                <div class="text-center py-8 text-gray-500">
                                    <i class="fas fa-history text-4xl mb-4"></i>
                                    <p>No test history available yet. Take a test to see your results here!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Analytics Section -->
                <div id="analyticsSection" class="hidden flex-1 bg-gray-50">
                    <div class="bg-white border-b border-gray-200 px-6 py-4">
                        <div>
                            <h1 class="text-2xl font-bold text-gray-900">Analytics</h1>
                            <p class="text-gray-600 text-sm mt-1">Detailed performance insights and trends</p>
                        </div>
                    </div>
                    <div class="p-6">
                        <div class="grid lg:grid-cols-2 gap-6">
                            <div class="bg-white p-6 rounded-lg shadow-sm border">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
                                <div class="h-64 flex items-center justify-center text-gray-500">
                                    <div class="text-center">
                                        <i class="fas fa-chart-line text-4xl mb-4"></i>
                                        <p>Analytics charts will appear here</p>
                                    </div>
                                </div>
                            </div>
                            <div class="bg-white p-6 rounded-lg shadow-sm border">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">Subject Breakdown</h3>
                                <div class="h-64 flex items-center justify-center text-gray-500">
                                    <div class="text-center">
                                        <i class="fas fa-chart-pie text-4xl mb-4"></i>
                                        <p>Subject performance breakdown</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Profile Section -->
                <div id="profileSection" class="hidden flex-1 bg-gray-50">
                    <div class="bg-white border-b border-gray-200 px-6 py-4">
                        <div>
                            <h1 class="text-2xl font-bold text-gray-900">Profile Settings</h1>
                            <p class="text-gray-600 text-sm mt-1">Manage your account and preferences</p>
                        </div>
                    </div>
                    <div class="p-6">
                        <div class="bg-white p-6 rounded-lg shadow-sm border">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                            <div id="profileForm">
                                <div class="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                        <input type="text" id="profileName" class="w-full p-3 border border-gray-300 rounded-lg" placeholder="Your full name">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                        <input type="email" id="profileEmail" class="w-full p-3 border border-gray-300 rounded-lg" placeholder="your@email.com">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Age</label>
                                        <input type="number" id="profileAge" class="w-full p-3 border border-gray-300 rounded-lg" placeholder="Age">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Education Level</label>
                                        <select id="profileEducation" class="w-full p-3 border border-gray-300 rounded-lg">
                                            <option value="">Select education level</option>
                                            <option value="High School">High School</option>
                                            <option value="Associate's Degree">Associate's Degree</option>
                                            <option value="Bachelor's Degree">Bachelor's Degree</option>
                                            <option value="Master's Degree">Master's Degree</option>
                                            <option value="Doctorate">Doctorate</option>
                                        </select>
                                    </div>
                                </div>
                                <button id="updateProfileBtn" class="mt-6 bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                                    Update Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Settings Section -->
                <div id="settingsSection" class="hidden flex-1 bg-gray-50">
                    <div class="bg-white border-b border-gray-200 px-6 py-4">
                        <div>
                            <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
                            <p class="text-gray-600 text-sm mt-1">Configure your application preferences</p>
                        </div>
                    </div>
                    <div class="p-6">
                        <div class="bg-white p-6 rounded-lg shadow-sm border">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Application Settings</h3>
                            <div class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <span class="text-sm font-medium text-gray-700">Email Notifications</span>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" class="sr-only peer">
                                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-sm font-medium text-gray-700">Auto-save Progress</span>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" class="sr-only peer" checked>
                                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

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
        <script src="/static/test-interface.js"></script>
        <script src="/static/results-dashboard.js"></script>
        <script src="/static/social-features.js"></script>
    </body>
    </html>
  `)
})

export default app
