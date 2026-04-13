import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { Env } from './types/database'
import { auth } from './routes/auth'
import { tests } from './routes/tests'
import { social } from './routes/social'
import { DatabaseService } from './utils/database'

const app = new Hono<{ Bindings: Env }>()

function getEnvValue(c: any, key: 'DATABASE_URL' | 'OPENAI_API_KEY' | 'JWT_SECRET') {
  const processEnv = typeof process !== 'undefined' ? process.env : undefined
  return c?.env?.[key] || processEnv?.[key]
}

function getDb(c: any) {
  return DatabaseService.fromDatabaseUrl(getEnvValue(c, 'DATABASE_URL'))
}

// Middleware
app.use('*', logger())
app.use('/api/*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// Fail-fast middleware: reject API calls immediately if DB is unavailable
app.use('/api/auth/*', async (c, next) => {
  if (!getEnvValue(c, 'DATABASE_URL')) {
    return c.json({ success: false, message: 'Database not available' }, 503)
  }
  await next()
})
app.use('/api/tests/*', async (c, next) => {
  if (!getEnvValue(c, 'DATABASE_URL')) {
    return c.json({ success: false, message: 'Database not available' }, 503)
  }
  await next()
})
app.use('/api/social/*', async (c, next) => {
  if (!getEnvValue(c, 'DATABASE_URL')) {
    return c.json({ success: false, message: 'Database not available' }, 503)
  }
  await next()
})

// API Routes
app.route('/api/auth', auth)
app.route('/api/tests', tests)
app.route('/api/social', social)

// Health check endpoint
app.get('/api/health', async (c) => {
  try {
    const db = getDb(c)
    await db.rawQuery('SELECT 1')
    
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
app.get('/', async (c) => {
  // Preload categories for immediate rendering (SSR -> client bootstrap)
  let ssrCategories: Array<{ id: string; name: string; description: string }> = []
  try {
    const db = getDb(c)
    const all = await db.getAllTestCategories()
    ssrCategories = all.map(cat => ({ id: cat.id, name: cat.name, description: cat.description }))
  } catch (e) {
    // ignore; frontend will fallback/fetch
  }
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TestAI — AI-Powered Testing Platform</title>
        <link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <link href="/static/style.css" rel="stylesheet">
        <style>
          * { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
        </style>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: { DEFAULT: '#2563EB', light: '#3B82F6', dark: '#1D4ED8' },
                  secondary: '#475569',
                  success: '#10B981',
                  warning: '#F59E0B',
                  error: '#F43F5E',
                  purple: '#8B5CF6',
                  cyan: '#06B6D4',
                  rose: '#F43F5E'
                },
                fontFamily: {
                  sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif']
                },
                animation: {
                  'fade-up': 'fadeInUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both'
                },
                keyframes: {
                  fadeInUp: {
                    from: { opacity: 0, transform: 'translateY(20px)' },
                    to: { opacity: 1, transform: 'translateY(0)' }
                  }
                }
              }
            }
          }
        </script>
    </head>
    <body class="bg-[#F8FAFC] min-h-screen antialiased text-slate-900">

        <!-- ========== NAVIGATION ========== -->
        <nav class="glass-nav sticky top-0 z-40">
            <div class="max-w-7xl mx-auto px-6">
                <div class="flex justify-between items-center h-16">
                    <!-- Logo -->
                    <div class="flex items-center group cursor-pointer">
                        <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white flex items-center justify-center mr-3 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-all duration-300 group-hover:-rotate-3">
                            <i class="fas fa-brain text-base"></i>
                        </div>
                        <span class="font-extrabold text-xl tracking-tight"><span class="gradient-text">Test</span><span class="text-slate-900">AI</span></span>
                    </div>

                    <!-- Nav Tabs -->
                    <div id="mainNavTabs" class="hidden md:flex space-x-1">
                        <button class="nav-tab active" data-tab="dashboard">
                            <i class="fas fa-chart-pie mr-1.5"></i>Dashboard
                        </button>
                        <button class="nav-tab" data-tab="tests">
                            <i class="fas fa-flask mr-1.5"></i>Tests
                        </button>
                        <button class="nav-tab" data-tab="history">
                            <i class="fas fa-clock-rotate-left mr-1.5"></i>History
                        </button>
                        <button class="nav-tab" data-tab="analytics">
                            <i class="fas fa-chart-line mr-1.5"></i>Analytics
                        </button>
                        <button class="nav-tab" data-tab="materials">
                            <i class="fas fa-file-import mr-1.5"></i>Materials
                        </button>
                    </div>

                    <!-- Auth Buttons / User Menu -->
                    <div class="flex items-center gap-3">
                        <button id="loginBtn" class="btn-ghost px-4 py-2">
                            <i class="fas fa-arrow-right-to-bracket mr-1.5"></i>Login
                        </button>
                        <button id="registerBtn" class="btn-primary-sm !px-5 !py-2.5">
                            <i class="fas fa-rocket mr-1.5"></i>Get Started
                        </button>
                        <div id="userMenu" class="hidden flex items-center gap-3">
                            <button class="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all duration-200 flex items-center justify-center border border-slate-200">
                                <i class="fas fa-bell text-sm"></i>
                            </button>
                            <div class="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl hover:bg-slate-50 transition-all duration-200 cursor-pointer">
                                <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple flex items-center justify-center shadow-md shadow-blue-500/15">
                                    <span id="userInitials" class="text-white text-xs font-bold"></span>
                                </div>
                                <span id="userName" class="text-slate-700 font-semibold text-sm hidden sm:block"></span>
                                <i class="fas fa-chevron-down text-slate-400 text-xs"></i>
                            </div>
                            <button id="logoutBtn" class="text-rose-500 hover:text-rose-600 transition-colors duration-200 ml-1" title="Logout">
                                <i class="fas fa-right-from-bracket"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Layout Wrapper -->
        <div class="flex min-h-screen">
            <!-- Sidebar (logged-in) -->
            <aside id="sidebar" class="hidden w-64 min-h-screen">
                <div class="flex flex-col h-full py-5">
                    <div class="px-5 pb-4 mb-2 border-b border-slate-200">
                        <div class="flex items-center">
                            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white flex items-center justify-center mr-3 shadow-lg shadow-blue-500/20">
                                <i class="fas fa-brain text-base"></i>
                            </div>
                            <span class="font-extrabold text-lg tracking-tight"><span class="gradient-text">Test</span><span class="text-slate-900">AI</span></span>
                        </div>
                    </div>
                    <nav class="flex-1 px-3 overflow-y-auto custom-scrollbar">
                        <div class="space-y-0.5">
                            <a href="#" class="sidebar-item active" data-section="dashboard">
                                <i class="fas fa-grid-2"></i>
                                <span>Dashboard</span>
                            </a>
                            <a href="#" class="sidebar-item" data-section="tests">
                                <i class="fas fa-flask"></i>
                                <span>Tests</span>
                            </a>
                            <a href="#" class="sidebar-item" data-section="history">
                                <i class="fas fa-clock-rotate-left"></i>
                                <span>History</span>
                            </a>
                            <a href="#" class="sidebar-item" data-section="analytics">
                                <i class="fas fa-chart-simple"></i>
                                <span>Analytics</span>
                            </a>
                            <a href="#" class="sidebar-item" data-section="materials">
                                <i class="fas fa-file-import"></i>
                                <span>Materials</span>
                            </a>
                            <a href="#" class="sidebar-item" data-section="profile">
                                <i class="fas fa-user-circle"></i>
                                <span>Profile</span>
                            </a>
                            <a href="#" class="sidebar-item" data-section="settings">
                                <i class="fas fa-gear"></i>
                                <span>Settings</span>
                            </a>
                        </div>
                    </nav>
                    <div class="px-3 pt-4 mt-2 border-t border-slate-200 bottom-section">
                        <div class="space-y-0.5">
                            <a href="#" class="sidebar-item">
                                <i class="fas fa-life-ring"></i>
                                <span>Help & Support</span>
                            </a>
                            <a href="#" class="sidebar-item" onclick="testApp.logout()">
                                <i class="fas fa-right-from-bracket"></i>
                                <span>Logout</span>
                            </a>
                        </div>
                    </div>
                </div>
            </aside>

            <!-- Main Content Area -->
            <main class="flex-1">

                <!-- ======== HERO / LANDING SECTION ======== -->
                <div data-guest-only="true">
                    <section id="welcomeSection" class="relative overflow-hidden">
                        <!-- Hero BG -->
                        <div class="gradient-bg-hero relative pt-24 pb-36 px-6">
                            <!-- Orbs -->
                            <div class="hero-glow-orb" style="top: -10%; left: -15%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%);"></div>
                            <div class="hero-glow-orb" style="bottom: -15%; right: -10%; width: 600px; height: 600px; animation-delay: -7s; background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%);"></div>

                            <div class="relative max-w-4xl mx-auto text-center">
                                <!-- Badge -->
                                <div class="hero-badge mb-8 animate-fade-up">
                                    <i class="fas fa-bolt"></i>
                                    AI-Powered Testing
                                </div>

                                <!-- Headline -->
                                <h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] mb-6 text-white animate-fade-up" style="animation-delay: 0.08s;">
                                    Test Smarter.<br>
                                    <span class="gradient-text-white">Learn Faster.</span>
                                </h1>

                                <!-- Subheadline -->
                                <p class="text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed animate-fade-up text-blue-100/70" style="animation-delay: 0.16s;">
                                    Turn your notes, PDFs, and study materials into custom AI tests with instant scoring,
                                    explanations, and progress tracking that actually helps you improve.
                                </p>

                                <!-- CTA Buttons -->
                                <div class="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up" style="animation-delay: 0.24s">
                                    <button onclick="window.testApp ? window.testApp.showTestCreation() : document.getElementById('registerModal').classList.add('show')" class="hero-cta-primary">
                                        Start Testing Free <i class="fas fa-arrow-right text-sm"></i>
                                    </button>
                                    <button class="hero-cta-secondary">
                                        <i class="fas fa-play-circle"></i> Watch Demo
                                    </button>
                                </div>

                                <div class="hero-proof-grid mt-10 animate-fade-up" style="animation-delay: 0.32s">
                                    <div class="hero-proof-card">
                                        <div class="hero-proof-label">From your own material</div>
                                        <div class="hero-proof-value">Generate tests from notes and PDFs</div>
                                    </div>
                                    <div class="hero-proof-card">
                                        <div class="hero-proof-label">Actionable review</div>
                                        <div class="hero-proof-value">Instant scoring with explanations</div>
                                    </div>
                                    <div class="hero-proof-card">
                                        <div class="hero-proof-label">Built for real studying</div>
                                        <div class="hero-proof-value">Track progress across every practice run</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div class="relative max-w-6xl mx-auto px-6 -mt-20 mb-24">
                        <div class="grid md:grid-cols-3 gap-6 stagger-children">
                            <div class="feature-card">
                                <div class="icon-wrap relative z-10">
                                    <i class="fas fa-sliders"></i>
                                </div>
                                <h3 class="relative z-10">Study From Your Own Content</h3>
                                <p class="relative z-10">Upload notes, handouts, or PDFs and turn them into focused tests in seconds.</p>
                            </div>
                            <div class="feature-card">
                                <div class="icon-wrap relative z-10">
                                    <i class="fas fa-wand-magic-sparkles"></i>
                                </div>
                                <h3 class="relative z-10">AI Question Engine</h3>
                                <p class="relative z-10">Generate fresh, context-aware questions with explanations tailored to what you are studying.</p>
                            </div>
                            <div class="feature-card">
                                <div class="icon-wrap relative z-10">
                                    <i class="fas fa-chart-line"></i>
                                </div>
                                <h3 class="relative z-10">Deep Analytics</h3>
                                <p class="relative z-10">See weak areas, measure improvement, and know exactly what to review next.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Stats Bar -->
                    <div data-guest-only="true" class="max-w-5xl mx-auto px-6 mb-28">
                        <div class="glass-card rounded-2xl p-8 md:p-12 relative overflow-hidden">
                            <div class="absolute inset-0 bg-gradient-to-r from-primary/5 via-purple/5 to-cyan/5"></div>
                            <div class="relative stats-bar">
                                <div class="stat-item">
                                    <div class="stat-number gradient-text">50K+</div>
                                    <div class="stat-label">Tests Taken</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-number gradient-text">98%</div>
                                    <div class="stat-label">Accuracy Rate</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-number gradient-text">200+</div>
                                    <div class="stat-label">Categories</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-number gradient-text">4.9<span class="text-lg">/5</span></div>
                                    <div class="stat-label">User Rating</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- How It Works -->
                    <div data-guest-only="true" class="max-w-5xl mx-auto px-6 mb-28">
                        <div class="text-center mb-14">
                            <p class="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">How It Works</p>
                            <h2 class="text-3xl md:text-4xl font-extrabold text-slate-900">Three steps to smarter studying</h2>
                        </div>
                        <div class="grid md:grid-cols-3 gap-10">
                            <div class="step-card">
                                <div class="step-number">1</div>
                                <div class="step-title">Upload or choose material</div>
                                <div class="step-desc">Start from your own notes, PDFs, or a subject you want to practice.</div>
                            </div>
                            <div class="step-card">
                                <div class="step-number">2</div>
                                <div class="step-title">Take the AI-generated test</div>
                                <div class="step-desc">Practice with custom questions tailored to your selected material and difficulty.</div>
                            </div>
                            <div class="step-card">
                                <div class="step-number">3</div>
                                <div class="step-title">Review and improve</div>
                                <div class="step-desc">Get instant feedback, explanations, and clear insight into what needs work.</div>
                            </div>
                        </div>
                    </div>

                    <!-- CTA Banner -->
                    <div data-guest-only="true" class="max-w-5xl mx-auto px-6 pb-28">
                        <div class="rounded-2xl p-10 md:p-14 text-center relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700">
                            <div class="relative">
                                <h2 class="text-3xl md:text-4xl font-extrabold text-white mb-4">Ready to study smarter?</h2>
                                <p class="text-blue-100/80 text-base mb-8 max-w-lg mx-auto">Turn study materials into AI-powered practice tests and improve faster with every session.</p>
                                <button onclick="window.testApp ? window.testApp.showTestCreation() : document.getElementById('registerModal').classList.add('show')" class="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-blue-700 font-bold rounded-xl hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]">
                                    Get Started Free <i class="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <footer class="site-footer" data-guest-only="true">
                    <div class="footer-grid">
                        <div class="footer-col">
                            <h4>Product</h4>
                            <a href="#">Features</a>
                            <a href="#">Pricing</a>
                            <a href="#">API</a>
                        </div>
                        <div class="footer-col">
                            <h4>Resources</h4>
                            <a href="#">Documentation</a>
                            <a href="#">Blog</a>
                            <a href="#">Tutorials</a>
                        </div>
                        <div class="footer-col">
                            <h4>Company</h4>
                            <a href="#">About</a>
                            <a href="#">Careers</a>
                            <a href="#">Contact</a>
                        </div>
                        <div class="footer-col">
                            <h4>Legal</h4>
                            <a href="#">Privacy</a>
                            <a href="#">Terms</a>
                            <a href="#">Security</a>
                        </div>
                    </div>
                    <div class="footer-bottom">
                        <p>&copy; 2026 TestAI. Built with <i class="fas fa-heart text-rose-500 text-xs"></i> and AI.</p>
                    </div>
                </footer>

                <!-- ======== DASHBOARD SECTION (hidden by default) ======== -->
                <section id="dashboardSection" class="hidden flex-1 bg-[#F8FAFC]">
                    <header class="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 lg:px-8 py-6">
                        <div>
                            <h1 class="text-2xl font-extrabold text-slate-900" id="welcomeMessage">Welcome back!</h1>
                            <p class="text-slate-500 text-sm mt-1.5">Here's an overview of your test activities and performance.</p>
                        </div>
                    </header>
                    
                    <div class="p-6 lg:p-8">
                        <!-- Stats Grid -->
                        <div class="flex flex-wrap gap-3 mb-5">
                            <span class="metric-chip"><i class="fas fa-graduation-cap"></i> Personalized assessment paths</span>
                            <span class="metric-chip"><i class="fas fa-chart-line"></i> Weekly momentum tracking</span>
                            <span class="metric-chip"><i class="fas fa-brain"></i> AI-assisted review</span>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                            <div class="stat-card">
                                <div class="stat-card-content">
                                    <div class="stat-card-info">
                                        <p class="stat-card-label text-slate-500">Tests Taken</p>
                                        <p class="stat-card-value text-slate-900" id="testsTaken">24</p>
                                        <p class="stat-card-change positive">
                                            <i class="fas fa-arrow-trend-up mr-1"></i>Momentum is building
                                        </p>
                                    </div>
                                    <div class="stat-card-icon primary">
                                        <i class="fas fa-flask text-xl"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="stat-card">
                                <div class="stat-card-content">
                                    <div class="stat-card-info">
                                        <p class="stat-card-label text-slate-500">Average Score</p>
                                        <p class="stat-card-value text-slate-900" id="averageScore">78%</p>
                                        <p class="stat-card-change positive">
                                            <i class="fas fa-arrow-trend-up mr-1"></i>Consistent improvement
                                        </p>
                                    </div>
                                    <div class="stat-card-icon success">
                                        <i class="fas fa-bullseye text-xl"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="stat-card">
                                <div class="stat-card-content">
                                    <div class="stat-card-info">
                                        <p class="stat-card-label text-slate-500">Test Categories</p>
                                        <p class="stat-card-value text-slate-900" id="testCategories">5</p>
                                        <p class="stat-card-change positive">
                                            <i class="fas fa-plus mr-1"></i>Broader subject coverage
                                        </p>
                                    </div>
                                    <div class="stat-card-icon purple">
                                        <i class="fas fa-layer-group text-xl"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="stat-card">
                                <div class="stat-card-content">
                                    <div class="stat-card-info">
                                        <p class="stat-card-label text-slate-500">Time Spent</p>
                                        <p class="stat-card-value text-slate-900" id="timeSpent">12h 30m</p>
                                        <p class="stat-card-change positive">
                                            <i class="fas fa-book-open mr-1"></i>Focused practice hours
                                        </p>
                                    </div>
                                    <div class="stat-card-icon warning">
                                        <i class="fas fa-stopwatch text-xl"></i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Chart + Recent Tests -->
                        <div class="grid lg:grid-cols-3 gap-6 mb-8">
                            <div class="lg:col-span-2 glass-card analytics-panel rounded-3xl p-6 md:p-7 overflow-hidden relative">
                                <div class="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/70 pointer-events-none"></div>
                                <div class="relative">
                                    <div class="flex flex-col gap-5 mb-6 xl:flex-row xl:items-start xl:justify-between">
                                        <div>
                                            <div class="section-kicker">Learning analytics</div>
                                            <h3 class="text-xl font-bold text-slate-900">Performance command center</h3>
                                            <p class="text-sm text-slate-500 mt-1">Track score momentum, consistency, and volume from real completed tests.</p>
                                        </div>
                                        <div class="flex gap-1.5 self-start bg-white/80 backdrop-blur-sm p-1 rounded-2xl border border-slate-200/80 shadow-sm">
                                            <button class="chart-tab-btn active" data-period="weekly">Weekly</button>
                                            <button class="chart-tab-btn" data-period="monthly">Monthly</button>
                                            <button class="chart-tab-btn" data-period="yearly">Yearly</button>
                                        </div>
                                    </div>

                                    <div class="grid md:grid-cols-3 gap-4 mb-6">
                                        <div class="analytics-mini-card rounded-2xl bg-white/88 border border-slate-200/80 p-4 shadow-sm">
                                            <div class="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold mb-2">Latest score</div>
                                            <div id="chartHeadlineScore" class="text-3xl font-extrabold text-slate-900">--%</div>
                                            <div id="chartHeadlineDelta" class="text-sm font-semibold text-emerald-600 mt-1">No data yet</div>
                                        </div>
                                        <div class="analytics-mini-card rounded-2xl bg-white/88 border border-slate-200/80 p-4 shadow-sm">
                                            <div class="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold mb-2">Consistency</div>
                                            <div id="chartConsistency" class="text-3xl font-extrabold text-slate-900">--%</div>
                                            <div class="text-sm text-slate-500 mt-1">Average score across selected period</div>
                                        </div>
                                        <div class="analytics-mini-card rounded-2xl bg-slate-900 text-white p-4 shadow-lg shadow-slate-900/10">
                                            <div class="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold mb-2">Volume</div>
                                            <div id="chartAttemptCount" class="text-3xl font-extrabold">0</div>
                                            <div id="chartAttemptLabel" class="text-sm text-slate-300 mt-1">Completed attempts in this view</div>
                                        </div>
                                    </div>

                                    <div class="analytics-chart-shell rounded-[28px] border border-slate-200/80 bg-white/92 shadow-inner shadow-slate-100 p-4 md:p-5">
                                        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                                            <div>
                                                <div class="text-sm font-semibold text-slate-700">Score trajectory</div>
                                                <div id="chartSummaryText" class="text-xs text-slate-500 mt-1">See how performance is changing over time.</div>
                                            </div>
                                            <div class="flex items-center gap-3 text-xs text-slate-500">
                                                <span class="inline-flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>Average score</span>
                                                <span class="inline-flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Trend insight</span>
                                            </div>
                                        </div>
                                        <div class="h-72">
                                            <canvas id="performanceChart" class="w-full h-full"></canvas>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="glass-card rounded-2xl p-6">
                                <div class="flex justify-between items-center mb-5">
                                    <div>
                                        <div class="section-kicker">Recent activity</div>
                                        <h3 class="text-lg font-bold text-slate-900">Recent Tests</h3>
                                    </div>
                                    <a href="#" class="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">View All</a>
                                </div>
                                <div class="space-y-3" id="recentTestsList"></div>
                                <button id="takeNewTestBtn" class="btn-primary-sm w-full mt-5">
                                    <i class="fas fa-plus mr-1.5"></i> Take New Test
                                </button>
                            </div>
                        </div>

                        <!-- Categories + Quick Test -->
                        <div class="grid lg:grid-cols-3 gap-6 mb-8">
                            <div class="lg:col-span-2 glass-card rounded-2xl p-6">
                                <div class="flex justify-between items-center mb-6">
                                    <div>
                                        <div class="section-kicker">Subject intelligence</div>
                                        <h3 class="text-lg font-bold text-slate-900">Test Categories</h3>
                                    </div>
                                    <a href="#" class="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">View All</a>
                                </div>
                                <div class="grid sm:grid-cols-2 gap-4" id="testCategoriesGrid"></div>
                            </div>

                            <div class="glass-card rounded-2xl p-6">
                                <div class="section-kicker">Start focused practice</div>
                                <h3 class="text-lg font-bold text-slate-900 mb-5">Quick Test</h3>
                                <form id="quickTestForm">
                                    <div class="space-y-4">
                                        <div>
                                            <label class="form-label">Category</label>
                                            <select id="quickTestCategory" class="form-select">
                                                <option value="">Select category...</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="form-label">Difficulty</label>
                                            <div class="flex gap-2">
                                                <button type="button" class="difficulty-btn active" data-difficulty="Easy">Easy</button>
                                                <button type="button" class="difficulty-btn" data-difficulty="Medium">Medium</button>
                                                <button type="button" class="difficulty-btn" data-difficulty="Hard">Hard</button>
                                            </div>
                                        </div>
                                        <div>
                                            <label class="form-label">Questions: <span id="questionCount" class="font-bold text-blue-600">15</span></label>
                                            <input type="range" id="questionSlider" min="10" max="50" value="15" class="w-full accent-primary">
                                        </div>
                                        <div>
                                            <label class="form-label">Types</label>
                                            <div class="flex flex-wrap gap-3">
                                                <label class="flex items-center gap-1.5 cursor-pointer">
                                                    <input type="checkbox" value="MCQ" checked class="w-4 h-4 accent-primary rounded">
                                                    <span class="text-sm text-slate-600">MCQ</span>
                                                </label>
                                                <label class="flex items-center gap-1.5 cursor-pointer">
                                                    <input type="checkbox" value="TrueFalse" class="w-4 h-4 accent-primary rounded">
                                                    <span class="text-sm text-slate-600">T/F</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <label class="form-label">Time Limit</label>
                                            <select id="timeLimitSelect" class="form-select">
                                                <option value="">No limit</option>
                                                <option value="15">15 min</option>
                                                <option value="30">30 min</option>
                                                <option value="45">45 min</option>
                                                <option value="60">1 hour</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button type="submit" class="btn-primary mt-5">
                                        <i class="fas fa-wand-magic-sparkles mr-2"></i> Generate Test
                                    </button>
                                </form>
                            </div>
                        </div>

                        <!-- Study Workflow -->
                        <div class="glass-card rounded-2xl p-6 mb-8">
                            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                                <div>
                                    <h3 class="text-lg font-bold text-slate-900">Study workflow</h3>
                                    <p class="text-sm text-slate-500 mt-1">Use real material, generate a test, then review what needs work.</p>
                                </div>
                                <button type="button" onclick="window.testApp && window.testApp.switchSection('materials')" class="btn-primary-sm">
                                    <i class="fas fa-file-import mr-1.5"></i>Open Materials
                                </button>
                            </div>
                            <div id="testInProgress"></div>
                        </div>

                        <!-- Improvement + AI Recs -->
                        <div class="grid lg:grid-cols-2 gap-6">
                            <div class="glass-card rounded-2xl p-6">
                                <h3 class="text-lg font-bold text-slate-900 mb-6">What needs work</h3>
                                <div class="space-y-4" id="improvementAreas"></div>
                            </div>
                            <div class="glass-card rounded-2xl p-6">
                                <div class="flex justify-between items-center mb-6 gap-3">
                                    <div>
                                        <h3 class="text-lg font-bold text-slate-900">Recommended next move</h3>
                                        <p class="text-xs text-slate-400 mt-1">Guidance based on your actual workflow</p>
                                    </div>
                                    <span class="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 whitespace-nowrap">
                                        <i class="fas fa-sparkles mr-1"></i>AI Workflow
                                    </span>
                                </div>
                                <div class="space-y-4" id="aiRecommendations"></div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ======== TESTS SECTION ======== -->
                <section id="testsSection" class="hidden flex-1 bg-[#F8FAFC]">
                    <header class="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 lg:px-8 py-6">
                        <div>
                            <h1 class="text-2xl font-extrabold text-slate-900">My Tests</h1>
                            <p class="text-slate-500 text-sm mt-1.5">Create and manage your tests</p>
                        </div>
                    </header>
                    <div class="p-6 lg:p-8">
                        <div class="glass-card rounded-2xl p-7 mb-6 border border-blue-100 bg-gradient-to-br from-blue-50/70 to-white">
                            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                                <div>
                                    <h3 class="text-lg font-bold text-slate-900">Quick category test</h3>
                                    <p class="text-sm text-slate-500 mt-1">Good for warm-ups. For the strongest results, use the Materials tab to generate tests from your own notes and PDFs.</p>
                                </div>
                                <button type="button" onclick="window.testApp && window.testApp.switchSection('materials')" class="btn-ghost px-4 py-2">
                                    <i class="fas fa-file-import mr-1.5"></i>Use Study Materials Instead
                                </button>
                            </div>
                            <div id="testCreationForm">
                                <div class="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="form-label">Test Category</label>
                                        <select id="testCategory" class="form-select">
                                            <option value="">Select category...</option>
                                            <option value="mathematics">Mathematics</option>
                                            <option value="science">Science</option>
                                            <option value="programming">Programming</option>
                                            <option value="history">History</option>
                                            <option value="english">English</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="form-label">Difficulty Level</label>
                                        <div class="flex gap-2">
                                            <button type="button" class="difficulty-btn active" data-difficulty="Easy">Easy</button>
                                            <button type="button" class="difficulty-btn" data-difficulty="Medium">Medium</button>
                                            <button type="button" class="difficulty-btn" data-difficulty="Hard">Hard</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label class="form-label">Questions: <span id="questionCountDisplay" class="font-bold text-blue-600">15</span></label>
                                        <input type="range" id="questionCountSlider" min="5" max="50" value="15" class="w-full accent-primary">
                                    </div>
                                    <div>
                                        <label class="form-label">Time Limit</label>
                                        <select id="timeLimit" class="form-select">
                                            <option value="">No time limit</option>
                                            <option value="15">15 minutes</option>
                                            <option value="30">30 minutes</option>
                                            <option value="45">45 minutes</option>
                                            <option value="60">1 hour</option>
                                        </select>
                                    </div>
                                </div>
                                <button id="createTestBtn" class="mt-6 btn-primary">
                                    <i class="fas fa-wand-magic-sparkles mr-2"></i>Generate Test
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ======== HISTORY SECTION ======== -->
                <section id="historySection" class="hidden flex-1 bg-[#F8FAFC]">
                    <header class="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 lg:px-8 py-6">
                        <div>
                            <h1 class="text-2xl font-extrabold text-slate-900">Test History</h1>
                            <p class="text-slate-500 text-sm mt-1.5">Review your past test performances</p>
                        </div>
                    </header>
                    <div class="p-6 lg:p-8">
                        <div class="glass-card rounded-2xl p-7">
                            <h3 class="text-lg font-bold text-slate-900 mb-5">Recent Test Results</h3>
                            <div id="testHistoryList">
                                <div class="text-center py-14 text-slate-400">
                                    <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <i class="fas fa-clock-rotate-left text-2xl"></i>
                                    </div>
                                    <p class="font-medium">No test history yet</p>
                                    <p class="text-sm mt-1">Take a test to see your results here!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ======== ANALYTICS SECTION ======== -->
                <section id="analyticsSection" class="hidden flex-1 bg-[#F8FAFC]">
                    <header class="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 lg:px-8 py-6">
                        <div>
                            <h1 class="text-2xl font-extrabold text-slate-900">Analytics</h1>
                            <p class="text-slate-500 text-sm mt-1.5">Detailed performance insights and trends</p>
                        </div>
                    </header>
                    <div class="p-6 lg:p-8">
                        <div class="grid lg:grid-cols-2 gap-6">
                            <div class="glass-card rounded-2xl p-7">
                                <h3 class="text-lg font-bold text-slate-900 mb-4">Performance Trends</h3>
                                <div class="h-72 flex items-center justify-center text-slate-400">
                                    <div class="text-center">
                                        <div class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <i class="fas fa-chart-line text-xl"></i>
                                        </div>
                                        <p class="font-medium">Analytics charts will appear here</p>
                                    </div>
                                </div>
                            </div>
                            <div class="glass-card rounded-2xl p-7">
                                <h3 class="text-lg font-bold text-slate-900 mb-4">Subject Breakdown</h3>
                                <div class="h-72 flex items-center justify-center text-slate-400">
                                    <div class="text-center">
                                        <div class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <i class="fas fa-chart-pie text-xl"></i>
                                        </div>
                                        <p class="font-medium">Subject performance breakdown</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ======== MATERIALS SECTION ======== -->
                <section id="materialsSection" class="hidden flex-1 bg-[#F8FAFC]">
                    <header class="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 lg:px-8 py-6">
                        <div>
                            <h1 class="text-2xl font-extrabold text-slate-900">Study Materials</h1>
                            <p class="text-slate-500 text-sm mt-1.5">Import files, generate tests from them, and ask TestAI questions grounded in your study docs.</p>
                        </div>
                        <div class="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div>
                                    <div class="text-sm font-semibold text-slate-900">Recommended first step</div>
                                    <div class="text-sm text-slate-500 mt-1">Upload a note, handout, TXT, Markdown, or DOCX file, then generate a test from it. This is the fastest way to get real value from TestAI. PDF import is temporarily unavailable in production.</div>
                                </div>
                                <span class="text-xs font-bold px-3 py-1 rounded-full bg-white text-blue-600 border border-blue-200 whitespace-nowrap">Best workflow</span>
                            </div>
                        </div>
                    </header>
                    <div class="p-6 lg:p-8 space-y-6">
                        <div class="grid lg:grid-cols-2 gap-6">
                            <div class="glass-card rounded-2xl p-7">
                                <h3 class="text-lg font-bold text-slate-900 mb-5">Import a file</h3>
                                <div id="materialsStatus" class="hidden"></div>
                                <div class="space-y-4 mt-4">
                                    <div>
                                        <label class="form-label">Title (optional)</label>
                                        <input type="text" id="materialTitle" class="form-input" placeholder="e.g. Biology Chapter 3 Notes">
                                    </div>
                                    <div>
                                        <label class="form-label">Choose file</label>
                                        <input type="file" id="materialFile" class="form-input" accept=".txt,.md,.markdown,.docx">
                                        <p class="text-xs text-slate-400 mt-2">Best supported right now: TXT, Markdown, and DOCX under about 2 MB. PDF import is temporarily unavailable in production while the parser runtime is being stabilized.</p>
                                    </div>
                                    <button id="importMaterialBtn" class="btn-primary">
                                        <i class="fas fa-upload mr-2"></i>Import Material
                                    </button>
                                </div>
                            </div>
                            <div class="glass-card rounded-2xl p-7">
                                <h3 class="text-lg font-bold text-slate-900 mb-5">Generate a study test</h3>
                                <div class="space-y-4">
                                    <div>
                                        <label class="form-label">Material</label>
                                        <select id="studyMaterialSelect" class="form-select">
                                            <option value="">Choose imported material...</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="form-label">Focus area (optional)</label>
                                        <input type="text" id="studyTopicFocus" class="form-input" placeholder="chapter 2, enzymes, constitutional law...">
                                    </div>
                                    <div>
                                        <label class="form-label">Difficulty</label>
                                        <select id="studyDifficulty" class="form-select">
                                            <option value="Easy">Easy</option>
                                            <option value="Medium" selected>Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="form-label">Questions</label>
                                        <input type="number" id="studyQuestionCount" class="form-input" min="5" max="30" value="10">
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <input type="checkbox" id="studyUseWebSources" class="w-4 h-4 accent-primary rounded">
                                        <label for="studyUseWebSources" class="text-sm text-slate-600">Allow web-supported explanations when helpful</label>
                                    </div>
                                    <button id="generateStudyTestBtn" class="btn-primary">
                                        <i class="fas fa-wand-magic-sparkles mr-2"></i>Generate From Material
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="grid lg:grid-cols-2 gap-6">
                            <div class="glass-card rounded-2xl p-7">
                                <h3 class="text-lg font-bold text-slate-900 mb-5">Ask TestAI about a file</h3>
                                <div class="space-y-4">
                                    <div>
                                        <label class="form-label">Material</label>
                                        <select id="askMaterialSelect" class="form-select">
                                            <option value="">Choose imported material...</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="form-label">Question</label>
                                        <textarea id="materialQuestion" class="form-input min-h-[120px]" placeholder="Ask about the uploaded file, request a summary, or ask for supporting sources..."></textarea>
                                    </div>
                                    <button id="askMaterialBtn" class="btn-primary">
                                        <i class="fas fa-comments mr-2"></i>Ask TestAI
                                    </button>
                                </div>
                                <div id="materialAnswer" class="mt-5 text-sm text-slate-600 leading-7"></div>
                            </div>
                            <div class="glass-card rounded-2xl p-7">
                                <div class="flex justify-between items-center mb-5 gap-3">
                                    <div>
                                        <h3 class="text-lg font-bold text-slate-900">Imported materials</h3>
                                        <p class="text-sm text-slate-500 mt-1">This is your source library for grounded test generation.</p>
                                    </div>
                                    <span class="text-xs text-slate-400">Recent first</span>
                                </div>
                                <div id="materialsList" class="space-y-3">
                                    <div class="text-sm text-slate-400">No materials imported yet.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ======== PROFILE SECTION ======== -->
                <section id="profileSection" class="hidden flex-1 bg-[#F8FAFC]">
                    <header class="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 lg:px-8 py-6">
                        <div>
                            <h1 class="text-2xl font-extrabold text-slate-900">Profile Settings</h1>
                            <p class="text-slate-500 text-sm mt-1.5">Manage your account and preferences</p>
                        </div>
                    </header>
                    <div class="p-6 lg:p-8">
                        <div class="glass-card rounded-2xl p-7 max-w-3xl">
                            <h3 class="text-lg font-bold text-slate-900 mb-6">Account Information</h3>
                            <form id="profileForm">
                                <div class="grid md:grid-cols-2 gap-5">
                                    <div>
                                        <label class="form-label">Full Name</label>
                                        <input type="text" id="profileName" class="form-input" placeholder="Your full name">
                                    </div>
                                    <div>
                                        <label class="form-label">Email</label>
                                        <input type="email" id="profileEmail" class="form-input" placeholder="your@email.com">
                                    </div>
                                    <div>
                                        <label class="form-label">Age</label>
                                        <input type="number" id="profileAge" class="form-input" placeholder="Age">
                                    </div>
                                    <div>
                                        <label class="form-label">Education Level</label>
                                        <select id="profileEducation" class="form-select">
                                            <option value="">Select education level</option>
                                            <option value="High School">High School</option>
                                            <option value="Associate's Degree">Associate's Degree</option>
                                            <option value="Bachelor's Degree">Bachelor's Degree</option>
                                            <option value="Master's Degree">Master's Degree</option>
                                            <option value="Doctorate">Doctorate</option>
                                        </select>
                                    </div>
                                </div>
                                <button id="updateProfileBtn" class="btn-primary mt-6 !w-auto px-10">
                                    Update Profile
                                </button>
                            </form>
                        </div>
                    </div>
                </section>

                <!-- ======== SETTINGS SECTION ======== -->
                <section id="settingsSection" class="hidden flex-1 bg-[#F8FAFC]">
                    <header class="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 lg:px-8 py-6">
                        <div>
                            <h1 class="text-2xl font-extrabold text-slate-900">Settings</h1>
                            <p class="text-slate-500 text-sm mt-1.5">Configure your application preferences</p>
                        </div>
                    </header>
                    <div class="p-6 lg:p-8">
                        <div class="glass-card rounded-2xl p-7 max-w-3xl">
                            <h3 class="text-lg font-bold text-slate-900 mb-6">Preferences</h3>
                            <div class="space-y-5">
                                <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <span class="font-semibold text-slate-700 text-sm">Email Notifications</span>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" class="sr-only peer">
                                        <div class="w-12 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-blue-500"></div>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <span class="font-semibold text-slate-700 text-sm">Auto-save Progress</span>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" class="sr-only peer" checked>
                                        <div class="w-12 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-blue-500"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>

            </main>
        </div>

        <!-- ======== LOGIN MODAL ======== -->
        <div id="loginModal" class="modal-overlay hidden items-center justify-center z-50">
            <div class="modal-content glass-card rounded-[28px] p-8 w-full max-w-md mx-4 relative overflow-hidden">
                <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_35%)] pointer-events-none"></div>
                <button id="closeLoginModal" class="modal-close-btn absolute top-5 right-5 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all">
                    <i class="fas fa-xmark text-lg"></i>
                </button>
                <div class="relative">
                    <div class="section-kicker">Welcome back</div>
                    <h2 class="text-3xl font-extrabold text-slate-900 mb-2">Continue your learning flow</h2>
                    <p class="text-slate-500 text-sm mb-7">Sign in to access your personalized dashboard, progress insights, and AI-powered practice.</p>
                    <form id="loginForm">
                        <div class="mb-5">
                            <label class="form-label">Email Address</label>
                            <input type="email" id="loginEmail" class="form-input" placeholder="you@example.com" required>
                        </div>
                        <div class="mb-7">
                            <label class="form-label">Password</label>
                            <input type="password" id="loginPassword" class="form-input" placeholder="Enter your password" autocomplete="current-password" required>
                        </div>
                        <button type="submit" class="btn-primary w-full">
                            <i class="fas fa-arrow-right-to-bracket mr-2"></i>Sign In
                        </button>
                    </form>
                    <p class="mt-6 text-center text-sm text-slate-400">
                        Don't have an account? 
                        <button type="button" id="switchToRegister" class="font-bold text-blue-600 hover:text-cyan transition-colors">Create one</button>
                    </p>
                </div>
            </div>
        </div>

        <!-- ======== REGISTER MODAL ======== -->
        <div id="registerModal" class="modal-overlay hidden items-center justify-center z-50">
            <div class="modal-content glass-card rounded-[28px] p-8 w-full max-w-lg mx-4 relative overflow-hidden">
                <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_35%)] pointer-events-none"></div>
                <button id="closeRegisterModal" class="modal-close-btn absolute top-5 right-5 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all">
                    <i class="fas fa-xmark text-lg"></i>
                </button>
                <div class="relative">
                    <div class="section-kicker">Create your account</div>
                    <h2 class="text-3xl font-extrabold text-slate-900 mb-2">Start building academic momentum</h2>
                    <p class="text-slate-500 text-sm mb-7">Create your profile and get access to guided practice, AI-generated tests, and deeper learning analytics.</p>
                    <form id="registerForm">
                        <div class="mb-4">
                            <label class="form-label">Full Name</label>
                            <input type="text" id="registerName" class="form-input" placeholder="Your full name" required>
                        </div>
                        <div class="mb-4">
                            <label class="form-label">Email Address</label>
                            <input type="email" id="registerEmail" class="form-input" placeholder="you@example.com" required>
                        </div>
                        <div class="mb-4">
                            <label class="form-label">Password</label>
                            <input type="password" id="registerPassword" class="form-input" placeholder="Create a strong password" autocomplete="new-password" required>
                        </div>
                        <div class="grid md:grid-cols-2 gap-4">
                            <div class="mb-4 md:mb-0">
                                <label class="form-label">Age (optional)</label>
                                <input type="number" id="registerAge" class="form-input" placeholder="Your age" min="13" max="120">
                            </div>
                            <div class="mb-7 md:mb-0">
                                <label class="form-label">Education Level</label>
                                <select id="registerEducation" class="form-select">
                                    <option value="">Select level</option>
                                    <option value="High School">High School</option>
                                    <option value="Associate's Degree">Associate's Degree</option>
                                    <option value="Bachelor's Degree">Bachelor's Degree</option>
                                    <option value="Master's Degree">Master's Degree</option>
                                    <option value="Doctorate">Doctorate</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn-primary w-full mt-3">
                            <i class="fas fa-user-plus mr-2"></i>Create Account
                        </button>
                    </form>
                    <p class="mt-6 text-center text-sm text-slate-400">
                        Already have an account? 
                        <button type="button" id="switchToLogin" class="font-bold text-blue-600 hover:text-cyan transition-colors">Sign in</button>
                    </p>
                </div>
            </div>
        </div>

        <script>
          window.__CATEGORIES__ = ${JSON.stringify(ssrCategories)};
        </script>
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
