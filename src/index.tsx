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

// Fail-fast middleware: reject API calls immediately if DB is unavailable
app.use('/api/auth/*', async (c, next) => {
  if (!c.env?.DB) {
    return c.json({ success: false, message: 'Database not available' }, 503)
  }
  await next()
})
app.use('/api/tests/*', async (c, next) => {
  if (!c.env?.DB) {
    return c.json({ success: false, message: 'Database not available' }, 503)
  }
  await next()
})
app.use('/api/social/*', async (c, next) => {
  if (!c.env?.DB) {
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
app.get('/', async (c) => {
  // Preload categories for immediate rendering (SSR -> client bootstrap)
  let ssrCategories: Array<{ id: string; name: string; description: string }> = []
  try {
    const db = new DatabaseService(c.env.DB)
    const all = await db.getAllTestCategories()
    ssrCategories = all.map(cat => ({ id: cat.id, name: cat.name, description: cat.description }))
  } catch (e) {
    // ignore; frontend will fallback/fetch
  }
  return c.html(`
    <!DOCTYPE html>
    <html lang="en" class="dark">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TestAI — AI-Powered Testing Platform</title>
        <link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Instrument+Serif&display=swap" rel="stylesheet">
        <link href="/static/style.css" rel="stylesheet">
        <style>
          * { font-family: 'DM Sans', system-ui, -apple-system, sans-serif; }
        </style>
        <script>
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                colors: {
                  primary: { DEFAULT: '#E2A039', light: '#F0C060', dark: '#C88A20' },
                  secondary: '#9B9588',
                  success: '#95D5B2',
                  warning: '#FBBF24',
                  error: '#FF6B6B',
                  purple: '#B4A7D6',
                  cyan: '#4ECDC4',
                  rose: '#FF6B6B',
                  amber: { DEFAULT: '#E2A039', light: '#F0C060' },
                  midnight: { 50: '#222236', 100: '#1A1A2E', 200: '#0D0D14' }
                },
                fontFamily: {
                  sans: ['DM Sans', 'system-ui', 'sans-serif'],
                  display: ['Instrument Serif', 'Georgia', 'serif']
                },
                borderRadius: {
                  '2xl': '1rem',
                  '3xl': '1.25rem',
                  '4xl': '1.5rem'
                },
                animation: {
                  'float': 'float 6s ease-in-out infinite',
                  'fade-up': 'fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both'
                },
                keyframes: {
                  float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' }
                  },
                  fadeInUp: {
                    from: { opacity: 0, transform: 'translateY(32px)' },
                    to: { opacity: 1, transform: 'translateY(0)' }
                  }
                }
              }
            }
          }
        </script>
    </head>
    <body class="bg-[#0B0F1A] min-h-screen antialiased text-gray-100">

        <!-- ========== NAVIGATION ========== -->
        <nav class="glass-nav sticky top-0 z-40">
            <div class="max-w-7xl mx-auto px-6">
                <div class="flex justify-between items-center h-16">
                    <!-- Logo -->
                    <div class="flex items-center group cursor-pointer">
                        <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-purple text-white flex items-center justify-center mr-3 shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-all duration-300 group-hover:-rotate-3">
                            <i class="fas fa-brain text-base"></i>
                        </div>
                        <span class="font-extrabold text-xl tracking-tight"><span class="gradient-text">Test</span><span class="text-white">AI</span></span>
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
                            <button class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-all duration-200 flex items-center justify-center border border-white/5">
                                <i class="fas fa-bell text-sm"></i>
                            </button>
                            <div class="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl hover:bg-white/5 transition-all duration-200 cursor-pointer">
                                <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple flex items-center justify-center shadow-md shadow-primary/20">
                                    <span id="userInitials" class="text-white text-xs font-bold"></span>
                                </div>
                                <span id="userName" class="text-gray-300 font-semibold text-sm hidden sm:block"></span>
                                <i class="fas fa-chevron-down text-gray-500 text-xs"></i>
                            </div>
                            <button id="logoutBtn" class="text-rose hover:text-rose/80 transition-colors duration-200 ml-1" title="Logout">
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
                    <div class="px-5 pb-4 mb-2 border-b border-white/5">
                        <div class="flex items-center">
                            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-purple text-white flex items-center justify-center mr-3 shadow-lg shadow-primary/25">
                                <i class="fas fa-brain text-base"></i>
                            </div>
                            <span class="font-extrabold text-lg tracking-tight"><span class="gradient-text">Test</span><span class="text-white">AI</span></span>
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
                    <div class="px-3 pt-4 mt-2 border-t border-white/5 bottom-section">
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
<section id="welcomeSection" class="relative overflow-hidden">
    <!-- Hero BG -->
    <div class="gradient-bg-hero relative pt-24 pb-36 px-6">
        <!-- Ambient orbs -->
        <div class="hero-glow-orb" style="top: -10%; left: -15%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(226, 160, 57, 0.06) 0%, transparent 70%);"></div>
        <div class="hero-glow-orb" style="bottom: -15%; right: -10%; width: 600px; height: 600px; animation-delay: -7s; background: radial-gradient(circle, rgba(78, 205, 196, 0.04) 0%, transparent 70%);"></div>

        <!-- Subtle dot grid -->
        <div class="absolute inset-0 opacity-[0.02]" style="background-image: radial-gradient(rgba(226, 160, 57, 0.4) 1px, transparent 1px); background-size: 32px 32px;"></div>

        <div class="relative max-w-5xl mx-auto text-center">
            <!-- Badge -->
            <div class="hero-badge mb-10 animate-fade-up">
                <i class="fas fa-sparkles"></i>
                AI-Powered Learning
            </div>

            <!-- Headline: editorial serif -->
            <h1 class="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] mb-8 animate-fade-up" style="animation-delay: 0.1s; font-weight: 400;">
                <span style="color: var(--text-hero);">Master Any</span><br>
                <span class="gradient-text" style="font-style: italic;">Subject</span>
            </h1>

            <!-- Editorial rule -->
            <div class="editorial-rule mx-auto mb-8 animate-fade-up" style="animation-delay: 0.15s;"></div>

            <!-- Subheadline -->
            <p class="text-base md:text-lg max-w-xl mx-auto mb-12 leading-relaxed animate-fade-up" style="animation-delay: 0.2s; color: var(--text-secondary);">
                Adaptive tests crafted by AI. Instant scoring. Deep analytics.
                Personalized paths to mastery.
            </p>

            <!-- CTA Buttons -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style="animation-delay: 0.3s">
                <button onclick="document.getElementById('registerModal').classList.add('show')" class="hero-cta-primary">
                    <i class="fas fa-arrow-right"></i> Begin Your Journey
                </button>
                <button class="hero-cta-secondary">
                    <i class="fas fa-play-circle"></i> See It in Action
                </button>
            </div>

            <!-- Trust line -->
            <div class="mt-20 animate-fade-up" style="animation-delay: 0.5s">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style="color: var(--text-muted);">Trusted by curious minds everywhere</p>
                <div class="flex items-center justify-center gap-10 opacity-25">
                    <i class="fas fa-graduation-cap text-xl"></i>
                    <i class="fas fa-university text-xl"></i>
                    <i class="fas fa-book-open text-xl"></i>
                    <i class="fas fa-laptop-code text-xl"></i>
                    <i class="fas fa-flask text-xl"></i>
                </div>
            </div>
        </div>
    </div>
    ...
</section>
                    <div class="relative max-w-6xl mx-auto px-6 -mt-20 mb-24">
                        <div class="grid md:grid-cols-3 gap-6 stagger-children">
                            <div class="feature-card">
                                <div class="icon-wrap relative z-10">
                                    <i class="fas fa-sliders"></i>
                                </div>
                                <h3 class="relative z-10">Fully Customizable</h3>
                                <p class="relative z-10">Pick subjects, difficulty, question types — build tests that match your exact needs.</p>
                            </div>
                            <div class="feature-card">
                                <div class="icon-wrap relative z-10">
                                    <i class="fas fa-wand-magic-sparkles"></i>
                                </div>
                                <h3 class="relative z-10">AI Question Engine</h3>
                                <p class="relative z-10">Fresh, context-aware questions every time with smart explanations.</p>
                            </div>
                            <div class="feature-card">
                                <div class="icon-wrap relative z-10">
                                    <i class="fas fa-chart-line"></i>
                                </div>
                                <h3 class="relative z-10">Deep Analytics</h3>
                                <p class="relative z-10">Track progress, spot weaknesses, get AI-driven recommendations.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Stats Bar -->
                    <div class="max-w-5xl mx-auto px-6 mb-28">
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
                    <div class="max-w-5xl mx-auto px-6 mb-28">
                        <div class="text-center mb-14">
                            <p class="text-xs font-bold uppercase tracking-[0.2em] mb-4" style="color: var(--amber);">How It Works</p>
                            <h2 class="font-display text-3xl md:text-4xl text-white" style="font-weight: 400;">Three steps to <em>mastery</em></h2>
                        </div>
                        <div class="grid md:grid-cols-3 gap-10">
                            <div class="step-card">
                                <div class="step-number">1</div>
                                <div class="step-title">Create Your Test</div>
                                <div class="step-desc">Choose a subject, set difficulty, pick question types. Takes 30 seconds.</div>
                            </div>
                            <div class="step-card">
                                <div class="step-number">2</div>
                                <div class="step-title">Take It Anywhere</div>
                                <div class="step-desc">Answer AI-generated questions at your own pace, on any device.</div>
                            </div>
                            <div class="step-card">
                                <div class="step-number">3</div>
                                <div class="step-title">Get Smart Insights</div>
                                <div class="step-desc">Review results, see analytics, and get personalized improvement tips.</div>
                            </div>
                        </div>
                    </div>

                    <!-- CTA Banner -->
                    <div class="max-w-5xl mx-auto px-6 pb-28">
                        <div class="rounded-2xl p-10 md:p-16 text-center relative overflow-hidden border border-white/5" style="background: linear-gradient(135deg, var(--surface) 0%, var(--surface-raised) 100%);">
                            <!-- Ambient glow -->
                            <div class="absolute inset-0" style="background: radial-gradient(ellipse at 50% 50%, rgba(226, 160, 57, 0.06) 0%, transparent 60%);"></div>
                            <div class="relative">
                                <h2 class="font-display text-3xl md:text-4xl text-white mb-4" style="font-weight: 400;">Ready to <em>level up?</em></h2>
                                <p class="text-base mb-8 max-w-lg mx-auto" style="color: var(--text-secondary);">Join thousands of learners using AI to master any subject, faster.</p>
                                <button onclick="document.getElementById('registerModal').classList.add('show')" class="hero-cta-primary text-base">
                                    Get Started Free <i class="fas fa-arrow-right ml-1"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <footer class="site-footer">
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
                            <p>&copy; 2026 TestAI. Built with <i class="fas fa-heart text-rose text-xs"></i> and AI.</p>
                        </div>
                    </footer>
                </section>

                <!-- ======== DASHBOARD SECTION (hidden by default) ======== -->
                <section id="dashboardSection" class="hidden flex-1 bg-[#0B0F1A]">
                    <header class="bg-[#0B0F1A]/80 backdrop-blur-sm border-b border-white/5 px-6 lg:px-8 py-6">
                        <div>
                            <h1 class="text-2xl font-extrabold text-white" id="welcomeMessage">Welcome back!</h1>
                            <p class="text-gray-400 text-sm mt-1.5">Here's an overview of your test activities and performance.</p>
                        </div>
                    </header>
                    
                    <div class="p-6 lg:p-8">
                        <!-- Stats Grid -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                            <div class="stat-card">
                                <div class="stat-card-content">
                                    <div class="stat-card-info">
                                        <p class="stat-card-label text-gray-400">Tests Taken</p>
                                        <p class="stat-card-value text-white" id="testsTaken">24</p>
                                        <p class="stat-card-change positive">
                                            <i class="fas fa-arrow-trend-up mr-1"></i>+2% vs last month
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
                                        <p class="stat-card-label text-gray-400">Average Score</p>
                                        <p class="stat-card-value text-white" id="averageScore">78%</p>
                                        <p class="stat-card-change positive">
                                            <i class="fas fa-arrow-trend-up mr-1"></i>+5% vs last month
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
                                        <p class="stat-card-label text-gray-400">Test Categories</p>
                                        <p class="stat-card-value text-white" id="testCategories">5</p>
                                        <p class="stat-card-change positive">
                                            <i class="fas fa-plus mr-1"></i>2 new added
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
                                        <p class="stat-card-label text-gray-400">Time Spent</p>
                                        <p class="stat-card-value text-white" id="timeSpent">12h 30m</p>
                                        <p class="stat-card-change negative">
                                            <i class="fas fa-arrow-trend-down mr-1"></i>-3% vs last month
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
                            <div class="lg:col-span-2 glass-card rounded-2xl p-6">
                                <div class="flex justify-between items-center mb-6">
                                    <h3 class="text-lg font-bold text-white">Performance Trend</h3>
                                    <div class="flex gap-1.5">
                                        <button class="chart-tab-btn active" data-period="weekly">Weekly</button>
                                        <button class="chart-tab-btn" data-period="monthly">Monthly</button>
                                        <button class="chart-tab-btn" data-period="yearly">Yearly</button>
                                    </div>
                                </div>
                                <div class="h-72">
                                    <canvas id="performanceChart" class="w-full h-full"></canvas>
                                </div>
                            </div>

                            <div class="glass-card rounded-2xl p-6">
                                <div class="flex justify-between items-center mb-5">
                                    <h3 class="text-lg font-bold text-white">Recent Tests</h3>
                                    <a href="#" class="text-sm font-semibold text-primary-light hover:text-cyan transition-colors">View All</a>
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
                                    <h3 class="text-lg font-bold text-white">Test Categories</h3>
                                    <a href="#" class="text-sm font-semibold text-primary-light hover:text-cyan transition-colors">View All</a>
                                </div>
                                <div class="grid sm:grid-cols-2 gap-4" id="testCategoriesGrid"></div>
                            </div>

                            <div class="glass-card rounded-2xl p-6">
                                <h3 class="text-lg font-bold text-white mb-5">Quick Test</h3>
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
                                            <label class="form-label">Questions: <span id="questionCount" class="font-bold text-primary-light">15</span></label>
                                            <input type="range" id="questionSlider" min="10" max="50" value="15" class="w-full accent-primary">
                                        </div>
                                        <div>
                                            <label class="form-label">Types</label>
                                            <div class="flex flex-wrap gap-3">
                                                <label class="flex items-center gap-1.5 cursor-pointer">
                                                    <input type="checkbox" value="MCQ" checked class="w-4 h-4 accent-primary rounded">
                                                    <span class="text-sm text-gray-300">MCQ</span>
                                                </label>
                                                <label class="flex items-center gap-1.5 cursor-pointer">
                                                    <input type="checkbox" value="TrueFalse" class="w-4 h-4 accent-primary rounded">
                                                    <span class="text-sm text-gray-300">T/F</span>
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

                        <!-- Test In Progress -->
                        <div class="glass-card rounded-2xl p-6 mb-8">
                            <h3 class="text-lg font-bold text-white mb-4">In Progress</h3>
                            <div id="testInProgress"></div>
                        </div>

                        <!-- Improvement + AI Recs -->
                        <div class="grid lg:grid-cols-2 gap-6">
                            <div class="glass-card rounded-2xl p-6">
                                <h3 class="text-lg font-bold text-white mb-6">Areas for Improvement</h3>
                                <div class="space-y-4" id="improvementAreas"></div>
                            </div>
                            <div class="glass-card rounded-2xl p-6">
                                <div class="flex justify-between items-center mb-6">
                                    <h3 class="text-lg font-bold text-white">AI Recommendations</h3>
                                    <span class="text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-purple/20 to-primary/20 text-purple border border-purple/20">
                                        <i class="fas fa-sparkles mr-1"></i>Powered by AI
                                    </span>
                                </div>
                                <div class="space-y-4" id="aiRecommendations"></div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ======== TESTS SECTION ======== -->
                <section id="testsSection" class="hidden flex-1 bg-[#0B0F1A]">
                    <header class="bg-[#0B0F1A]/80 backdrop-blur-sm border-b border-white/5 px-6 lg:px-8 py-6">
                        <div>
                            <h1 class="text-2xl font-extrabold text-white">My Tests</h1>
                            <p class="text-gray-400 text-sm mt-1.5">Create and manage your tests</p>
                        </div>
                    </header>
                    <div class="p-6 lg:p-8">
                        <div class="glass-card rounded-2xl p-7 mb-6">
                            <h3 class="text-lg font-bold text-white mb-5">Create New Test</h3>
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
                                        <label class="form-label">Questions: <span id="questionCountDisplay" class="font-bold text-primary-light">15</span></label>
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
                <section id="historySection" class="hidden flex-1 bg-[#0B0F1A]">
                    <header class="bg-[#0B0F1A]/80 backdrop-blur-sm border-b border-white/5 px-6 lg:px-8 py-6">
                        <div>
                            <h1 class="text-2xl font-extrabold text-white">Test History</h1>
                            <p class="text-gray-400 text-sm mt-1.5">Review your past test performances</p>
                        </div>
                    </header>
                    <div class="p-6 lg:p-8">
                        <div class="glass-card rounded-2xl p-7">
                            <h3 class="text-lg font-bold text-white mb-5">Recent Test Results</h3>
                            <div id="testHistoryList">
                                <div class="text-center py-14 text-gray-400">
                                    <div class="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
                <section id="analyticsSection" class="hidden flex-1 bg-[#0B0F1A]">
                    <header class="bg-[#0B0F1A]/80 backdrop-blur-sm border-b border-white/5 px-6 lg:px-8 py-6">
                        <div>
                            <h1 class="text-2xl font-extrabold text-white">Analytics</h1>
                            <p class="text-gray-400 text-sm mt-1.5">Detailed performance insights and trends</p>
                        </div>
                    </header>
                    <div class="p-6 lg:p-8">
                        <div class="grid lg:grid-cols-2 gap-6">
                            <div class="glass-card rounded-2xl p-7">
                                <h3 class="text-lg font-bold text-white mb-4">Performance Trends</h3>
                                <div class="h-72 flex items-center justify-center text-gray-400">
                                    <div class="text-center">
                                        <div class="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <i class="fas fa-chart-line text-xl"></i>
                                        </div>
                                        <p class="font-medium">Analytics charts will appear here</p>
                                    </div>
                                </div>
                            </div>
                            <div class="glass-card rounded-2xl p-7">
                                <h3 class="text-lg font-bold text-white mb-4">Subject Breakdown</h3>
                                <div class="h-72 flex items-center justify-center text-gray-400">
                                    <div class="text-center">
                                        <div class="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <i class="fas fa-chart-pie text-xl"></i>
                                        </div>
                                        <p class="font-medium">Subject performance breakdown</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ======== PROFILE SECTION ======== -->
                <section id="profileSection" class="hidden flex-1 bg-[#0B0F1A]">
                    <header class="bg-[#0B0F1A]/80 backdrop-blur-sm border-b border-white/5 px-6 lg:px-8 py-6">
                        <div>
                            <h1 class="text-2xl font-extrabold text-white">Profile Settings</h1>
                            <p class="text-gray-400 text-sm mt-1.5">Manage your account and preferences</p>
                        </div>
                    </header>
                    <div class="p-6 lg:p-8">
                        <div class="glass-card rounded-2xl p-7 max-w-3xl">
                            <h3 class="text-lg font-bold text-white mb-6">Account Information</h3>
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
                <section id="settingsSection" class="hidden flex-1 bg-[#0B0F1A]">
                    <header class="bg-[#0B0F1A]/80 backdrop-blur-sm border-b border-white/5 px-6 lg:px-8 py-6">
                        <div>
                            <h1 class="text-2xl font-extrabold text-white">Settings</h1>
                            <p class="text-gray-400 text-sm mt-1.5">Configure your application preferences</p>
                        </div>
                    </header>
                    <div class="p-6 lg:p-8">
                        <div class="glass-card rounded-2xl p-7 max-w-3xl">
                            <h3 class="text-lg font-bold text-white mb-6">Preferences</h3>
                            <div class="space-y-5">
                                <div class="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                    <span class="font-semibold text-gray-300 text-sm">Email Notifications</span>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" class="sr-only peer">
                                        <div class="w-12 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-purple"></div>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                    <span class="font-semibold text-gray-300 text-sm">Auto-save Progress</span>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" class="sr-only peer" checked>
                                        <div class="w-12 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-purple"></div>
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
        <div id="loginModal" class="modal-overlay">
            <div class="modal-content">
                <button id="closeLoginModal" class="modal-close-btn">
                    <i class="fas fa-xmark text-lg"></i>
                </button>
                <h2>Welcome back</h2>
                <form id="loginForm">
                    <div class="mb-5">
                        <label class="form-label">Email Address</label>
                        <input type="email" id="loginEmail" class="form-input" placeholder="you@example.com" required>
                    </div>
                    <div class="mb-7">
                        <label class="form-label">Password</label>
                        <input type="password" id="loginPassword" class="form-input" placeholder="Enter your password" autocomplete="current-password" required>
                    </div>
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-arrow-right-to-bracket mr-2"></i>Sign In
                    </button>
                </form>
                <p class="mt-6 text-center text-sm text-gray-400">
                    Don't have an account? 
                    <button id="switchToRegister" class="font-bold text-primary-light hover:text-cyan transition-colors">Create one</button>
                </p>
            </div>
        </div>

        <!-- ======== REGISTER MODAL ======== -->
        <div id="registerModal" class="modal-overlay">
            <div class="modal-content">
                <button id="closeRegisterModal" class="modal-close-btn">
                    <i class="fas fa-xmark text-lg"></i>
                </button>
                <h2>Create your account</h2>
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
                    <div class="mb-4">
                        <label class="form-label">Age (optional)</label>
                        <input type="number" id="registerAge" class="form-input" placeholder="Your age" min="13" max="120">
                    </div>
                    <div class="mb-7">
                        <label class="form-label">Education Level (optional)</label>
                        <select id="registerEducation" class="form-select">
                            <option value="">Select education level</option>
                            <option value="High School">High School</option>
                            <option value="Associate's Degree">Associate's Degree</option>
                            <option value="Bachelor's Degree">Bachelor's Degree</option>
                            <option value="Master's Degree">Master's Degree</option>
                            <option value="Doctorate">Doctorate</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-user-plus mr-2"></i>Create Account
                    </button>
                </form>
                <p class="mt-6 text-center text-sm text-gray-400">
                    Already have an account? 
                    <button id="switchToLogin" class="font-bold text-primary-light hover:text-cyan transition-colors">Sign in</button>
                </p>
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
