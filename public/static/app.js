// AI Test Application Frontend JavaScript - Enhanced Dashboard
class TestApp {
    constructor() {
        this.user = null;
        this.token = null;
        this.testInterface = null;
        this.resultsDashboard = null;
        this.socialFeatures = null;
        this.performanceChart = null;
        this.performanceData = null;
        this.testHistoryData = [];
        this.currentSection = 'dashboard';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthState();
        this.setupAxiosInterceptors();
        this.initializeModules();
        // Ensure categories populate regardless of auth timing
        try {
            this.loadTestCategories();
        } catch (e) {}
    }

    initializeModules() {
        // Initialize modules once available
        if (typeof TestInterface !== 'undefined') {
            this.testInterface = new TestInterface(this);
        }
        if (typeof ResultsDashboard !== 'undefined') {
            this.resultsDashboard = new ResultsDashboard(this);
        }
        if (typeof SocialFeatures !== 'undefined') {
            this.socialFeatures = new SocialFeatures(this);
        }
    }

    setupAxiosInterceptors() {
        // Add token to all requests
        axios.interceptors.request.use(
            config => {
                config.headers = config.headers || {};
                config.__skipGlobal401Handler = config.__skipGlobal401Handler || false;

                if (this.token && !config.headers.Authorization) {
                    config.headers.Authorization = `Bearer ${this.token}`;
                }
                return config;
            },
            error => Promise.reject(error)
        );

        // Handle auth errors
        axios.interceptors.response.use(
            response => response,
            error => {
                const status = error.response?.status;
                const skipGlobal401Handler = error.config?.__skipGlobal401Handler;

                if (status === 401 && !skipGlobal401Handler) {
                    this.logout(false);
                    this.showError('Your session expired or is invalid. Please log in again.');
                }
                return Promise.reject(error);
            }
        );
    }

    setupEventListeners() {
        // Modal controls
        document.getElementById('loginBtn').addEventListener('click', () => this.showLoginModal());
        document.getElementById('registerBtn').addEventListener('click', () => this.showRegisterModal());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Modal close buttons
        document.getElementById('closeLoginModal').addEventListener('click', () => this.hideLoginModal());
        document.getElementById('closeRegisterModal').addEventListener('click', () => this.hideRegisterModal());

        // Modal switch buttons
        document.getElementById('switchToRegister').addEventListener('click', () => {
            this.hideLoginModal();
            this.showRegisterModal();
        });
        document.getElementById('switchToLogin').addEventListener('click', () => {
            this.hideRegisterModal();
            this.showLoginModal();
        });

        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));

        // Navigation tabs (top)
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const section = tab.getAttribute('data-tab');
                this.switchSection(section);
            });
        });

        // Sidebar navigation
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                if (section) {
                    this.switchSection(section);
                }
            });
        });

        // Dashboard functionality
        this.setupDashboardEventListeners();

        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.hideAllModals();
            }
        });
    }

    setupDashboardEventListeners() {
        // Chart period buttons
        document.querySelectorAll('.chart-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.chart-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const period = btn.getAttribute('data-period');
                this.updatePerformanceChart(period);
            });
        });

        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Question slider
        const questionSlider = document.getElementById('questionSlider');
        const questionCount = document.getElementById('questionCount');
        if (questionSlider && questionCount) {
            questionSlider.addEventListener('input', () => {
                questionCount.textContent = questionSlider.value;
            });
        }

        // Quick test form
        const quickTestForm = document.getElementById('quickTestForm');
        if (quickTestForm) {
            quickTestForm.addEventListener('submit', (e) => this.handleQuickTest(e));
        }

        // Take new test button
        const takeNewTestBtn = document.getElementById('takeNewTestBtn');
        if (takeNewTestBtn) {
            takeNewTestBtn.addEventListener('click', () => this.showTestCreation());
        }
    }

    async checkAuthState() {
        const token = localStorage.getItem('ai_test_token');
        if (!token) return;

        this.token = token;
        try {
            const response = await axios.post('/api/auth/verify', {}, {
                timeout: 3000,
                headers: {
                    Authorization: `Bearer ${token}`
                },
                __skipGlobal401Handler: true
            });

            if (response.data.success && response.data.user) {
                this.user = response.data.user;
                this.updateUI();
                await this.loadUserData();
            } else {
                this.logout(false);
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            this.logout(false);
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showError('Please enter both email and password');
            return;
        }

        try {
            const response = await axios.get('/api/auth/query-login', {
                params: { email, password },
                timeout: 5000
            });

            if (response.data.success && response.data.token && response.data.user) {
                this.user = response.data.user;
                this.token = response.data.token;
                localStorage.setItem('ai_test_token', this.token);

                this.hideLoginModal();
                this.updateUI();
                await this.loadUserData();
                this.showSuccess('Login successful!');
                return;
            }

            this.showError(response.data.message || 'Login failed');
        } catch (error) {
            console.error('API login failed:', error);
            this.showError(error.response?.data?.message || 'Login failed. Please try again.');
        }
    }

    async handleRegister(e) {
        e.preventDefault();

        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const age = document.getElementById('registerAge').value;
        const education_level = document.getElementById('registerEducation').value;

        const userData = { name, email, password };
        if (age) userData.age = parseInt(age);
        if (education_level) userData.education_level = education_level;

        try {
            const response = await axios.get('/api/auth/query-register', {
                params: userData,
                timeout: 5000
            });

            if (response.data.success && response.data.token && response.data.user) {
                this.user = response.data.user;
                this.token = response.data.token;
                localStorage.setItem('ai_test_token', this.token);

                this.hideRegisterModal();
                this.updateUI();
                await this.loadUserData();
                this.showSuccess('Registration successful! Welcome to TestAI!');
                return;
            }

            this.showError(response.data.message || 'Registration failed');
        } catch (error) {
            console.error('API registration failed:', error);
            this.showError(error.response?.data?.message || 'Registration failed. Please try again.');
        }
    }

    logout(showMessage = true) {
        this.user = null;
        this.token = null;
        localStorage.removeItem('ai_test_token');
        this.updateUI();

        if (showMessage) {
            this.showSuccess('Logged out successfully');
        }
    }

    updateUI() {
        const isLoggedIn = this.user !== null;

        // Toggle navigation elements
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const userMenu = document.getElementById('userMenu');

        if (loginBtn) loginBtn.style.display = isLoggedIn ? 'none' : 'inline-flex';
        if (registerBtn) registerBtn.style.display = isLoggedIn ? 'none' : 'inline-flex';
        if (userMenu) userMenu.style.display = isLoggedIn ? 'flex' : 'none';

        // Toggle sidebar
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            if (isLoggedIn) {
                sidebar.classList.remove('hidden');
                sidebar.classList.add('block');
            } else {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('block');
            }
        }

        // Toggle main nav tabs
        const mainNavTabs = document.getElementById('mainNavTabs');
        if (mainNavTabs) {
            if (isLoggedIn) {
                mainNavTabs.classList.remove('hidden');
                mainNavTabs.classList.add('flex');
            } else {
                mainNavTabs.classList.add('hidden');
                mainNavTabs.classList.remove('flex');
            }
        }

        // Update user name and initials
        if (isLoggedIn) {
            const userName = document.getElementById('userName');
            const userInitials = document.getElementById('userInitials');
            const welcomeMessage = document.getElementById('welcomeMessage');

            if (userName) userName.textContent = this.user.name;
            if (userInitials) {
                const initials = this.user.name.split(' ').map(n => n[0]).join('').toUpperCase();
                userInitials.textContent = initials;
            }
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome back, ${this.user.name.split(' ')[0]}!`;
            }
        }

        // Toggle landing/marketing content
        const welcomeSection = document.getElementById('welcomeSection');
        if (welcomeSection) {
            welcomeSection.style.display = isLoggedIn ? 'none' : 'block';
            welcomeSection.classList.toggle('hidden', isLoggedIn);
        }

        document.querySelectorAll('[data-guest-only="true"]').forEach(element => {
            element.style.display = isLoggedIn ? 'none' : '';
            element.classList.toggle('hidden', isLoggedIn);
        });

        // Hide all sections initially
        const sections = ['dashboardSection', 'testsSection', 'historySection', 'analyticsSection', 'profileSection', 'settingsSection'];
        sections.forEach(sectionId => {
            const element = document.getElementById(sectionId);
            if (element) {
                element.classList.add('hidden');
                element.style.display = '';
            }
        });

        // Show dashboard by default when logged in
        if (isLoggedIn) {
            this.switchSection('dashboard');
        }
    }

    switchSection(section) {
        if (!this.user && ['dashboard', 'tests', 'history', 'analytics', 'profile', 'settings'].includes(section)) {
            this.showRegisterModal();
            return;
        }

        console.log('switchSection called with:', section);

        // Update navigation active states
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === section);
        });

        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-section') === section);
        });

        this.currentSection = section;

        // Hide all sections first
        const sections = ['dashboardSection', 'testsSection', 'historySection', 'analyticsSection', 'profileSection', 'settingsSection'];
        sections.forEach(sectionId => {
            const element = document.getElementById(sectionId);
            if (element) {
                element.classList.add('hidden');
            }
        });

        // Show the selected section
        const targetSection = `${section}Section`;
        const element = document.getElementById(targetSection);
        console.log('Target section:', targetSection, 'Element found:', !!element);
        if (element) {
            element.classList.remove('hidden');
            element.style.display = 'block';
            console.log('Removed hidden class from', targetSection);
        }

        // Handle section-specific logic
        switch(section) {
            case 'dashboard':
                this.showDashboard();
                break;
            case 'tests':
                this.showTests();
                break;
            case 'history':
                this.showHistory();
                break;
            case 'analytics':
                this.showAnalytics();
                break;
            case 'profile':
                this.showProfile();
                break;
            case 'settings':
                this.showSettings();
                break;
            default:
                this.showDashboard();
        }
    }

    showDashboard() {
        // Dashboard is already visible, just refresh data
        console.log('showDashboard called');
        this.loadUserData();
    }

    showTests() {
        // Initialize test creation functionality
        this.setupTestCreationForm();
    }

    showHistory() {
        // Load test history
        this.loadTestHistory();
    }

    showAnalytics() {
        // Load analytics data
        this.loadAnalytics();
    }

    showProfile() {
        // Load user profile data
        this.loadProfile();
    }

    showSettings() {
        // Initialize settings
        this.loadSettings();
    }

    async loadUserData() {
        try {
            console.log('loadUserData called, user:', this.user);

            // Load user statistics (with fallback data)
            let stats = {
                tests_taken: 24,
                average_score: 78,
                categories_count: 5,
                total_time: 750 // in minutes
            };

            if (this.user) {
                try {
                    const statsResponse = await axios.get('/api/tests/stats');
                    if (statsResponse.data.success) {
                        stats = statsResponse.data.statistics;
                    }
                } catch (error) {
                    console.log('Using fallback stats data');
                }
            }

            console.log('Displaying dashboard stats:', stats);
            this.displayDashboardStats(stats);

            // Load test categories
            await this.loadTestCategories();

            // Load recent tests
            await this.loadRecentTests();

            // Initialize performance chart
            this.initializePerformanceChart();

            // Load improvement areas and AI recommendations
            this.loadTestInProgress();
            this.loadImprovementAreas();
            this.loadAIRecommendations();

        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }

    displayDashboardStats(stats) {
        // Update main statistics cards
        const testsTaken = document.getElementById('testsTaken');
        const averageScore = document.getElementById('averageScore');
        const testCategories = document.getElementById('testCategories');
        const timeSpent = document.getElementById('timeSpent');

        if (testsTaken) testsTaken.textContent = stats.tests_taken || stats.total_tests || 24;
        if (averageScore) averageScore.textContent = `${Math.round(stats.average_score || stats.avg_score || 78)}%`;
        if (testCategories) testCategories.textContent = stats.categories_count || stats.categories_attempted || 5;
        if (timeSpent) {
            const minutes = stats.total_time || stats.total_time_minutes || 750;
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            timeSpent.textContent = `${hours}h ${remainingMinutes}m`;
        }
    }

    async loadTestCategories() {
        // Fallback categories data
        const fallbackCategories = [
            { id: 'cat_math', name: 'Mathematics', description: 'Algebra, Calculus, Geometry, Statistics' },
            { id: 'cat_programming', name: 'Programming', description: 'Python, JavaScript, Java, Algorithms' },
            { id: 'cat_science', name: 'Science', description: 'Physics, Chemistry, Biology' },
            { id: 'cat_history', name: 'History', description: 'World History, Ancient Civilizations' }
        ];

        let categories = fallbackCategories;

        try {
            // Use SSR-provided categories first if present
            if (typeof window !== 'undefined' && Array.isArray(window.__CATEGORIES__) && window.__CATEGORIES__.length > 0) {
                categories = window.__CATEGORIES__;
                console.log('Using SSR categories', categories.length);
            }
        } catch (e) {}

        // Always try API fetch to ensure latest
        try {
            const response = await axios.get('/api/tests/categories');
            if (response.data?.success && Array.isArray(response.data.categories) && response.data.categories.length > 0) {
                categories = response.data.categories;
            }
        } catch (error) {
            console.log('Using fallback categories data');
        }

        this.displayTestCategories(categories);
        this.populateQuickTestCategories(categories);
        this.populateTestCreationCategories(categories);
    }

    displayTestCategories(categories) {
        const grid = document.getElementById('testCategoriesGrid');
        if (!grid) return;

        // Sample progress data (would come from API in real app)
        const progressData = {
            'cat_math': 92,
            'cat_programming': 75,
            'cat_science': 62,
            'cat_history': 88,
            'cat_english': 71,
            'cat_general': 65
        };

        const categoryIcons = {
            'cat_math': 'fas fa-calculator',
            'cat_programming': 'fas fa-code',
            'cat_science': 'fas fa-atom',
            'cat_history': 'fas fa-landmark',
            'cat_english': 'fas fa-book',
            'cat_general': 'fas fa-globe'
        };

        const colors = ['mathematics', 'programming', 'science', 'history', 'english', 'general'];

        grid.innerHTML = categories.map((category, index) => {
            const progress = progressData[category.id] || Math.floor(Math.random() * 40 + 60);
            const icon = categoryIcons[category.id] || 'fas fa-book';
            const colorClass = colors[index % colors.length];

            return `
                <div class="test-category-card cursor-pointer" onclick="testApp.createTestForCategory('${category.name}')">
                    <div class="flex items-center justify-between mb-3">
                        <i class="${icon} text-xl text-primary"></i>
                        <span class="text-right text-sm font-medium">${progress}%</span>
                    </div>
                    <h4 class="font-medium text-slate-900 mb-1">${category.name}</h4>
                    <p class="text-xs text-slate-400 mb-3 line-clamp-2">${category.description}</p>
                    <div class="progress-bar">
                        <div class="progress-fill ${colorClass}" style="width: ${progress}%"></div>
                    </div>
                    <p class="text-xs text-gray-500 mt-2">${Math.floor(Math.random() * 10 + 5)} tests taken</p>
                </div>
            `;
        }).join('');
    }

    populateQuickTestCategories(categories) {
        const select = document.getElementById('quickTestCategory');
        if (!select) return;

        const opts = categories.map(category => `<option value="${category.name}">${category.name}</option>`).join('');
        select.innerHTML = '<option value="">Select category...</option>' + opts;
        console.log('Populated quickTestCategory with', categories.length, 'categories');
    }

    populateTestCreationCategories(categories) {
        const select = document.getElementById('testCategory');
        if (!select) return;
        const opts2 = categories.map(category => `<option value="${category.name}">${category.name}</option>`).join('');
        select.innerHTML = '<option value="">Select category...</option>' + opts2;
        console.log('Populated testCategory with', categories.length, 'categories');
    }

    async loadRecentTests() {
        try {
            let attempts = [];

            if (this.user) {
                try {
                    const response = await axios.get('/api/tests/history', { params: { limit: 24 } });
                    if (response.data?.success && Array.isArray(response.data.attempts)) {
                        attempts = response.data.attempts;
                    }
                } catch (error) {
                    console.log('Using fallback recent tests data');
                }
            }

            if (!attempts.length) {
                attempts = [
                    { test_type: 'Mathematics', score: 92, end_time: new Date().toISOString(), total_questions: 20 },
                    { test_type: 'Programming', score: 75, end_time: new Date(Date.now() - 86400000).toISOString(), total_questions: 15 },
                    { test_type: 'Science', score: 62, end_time: new Date(Date.now() - 3 * 86400000).toISOString(), total_questions: 30 },
                    { test_type: 'History', score: 88, end_time: new Date(Date.now() - 5 * 86400000).toISOString(), total_questions: 25 }
                ];
            }

            this.testHistoryData = attempts;
            const recentTests = attempts.slice(0, 4).map(test => ({
                subject: test.test_type || 'Test',
                score: Math.round(test.score || 0),
                timestamp: this.formatRelativeDate(test.end_time || test.start_time),
                questions: test.total_questions || 0
            }));

            this.displayRecentTests(recentTests);
            this.performanceData = this.buildPerformanceDatasets(attempts);
            this.initializePerformanceChart();
        } catch (error) {
            console.error('Failed to load recent tests:', error);
        }
    }

    displayRecentTests(tests) {
        const container = document.getElementById('recentTestsList');
        if (!container) return;

        container.innerHTML = tests.map(test => {
            const scoreClass = test.score >= 85 ? 'excellent' :
                             test.score >= 70 ? 'good' :
                             test.score >= 50 ? 'average' : 'poor';

            return `
                <div class="recent-test-item">
                    <div class="flex-1">
                        <h4 class="font-medium text-slate-900 text-sm">${test.subject}</h4>
                        <p class="text-xs text-gray-500">${test.questions} questions • ${test.timestamp}</p>
                    </div>
                    <div class="score-badge ${scoreClass}">${test.score}%</div>
                </div>
            `;
        }).join('');
    }

    initializePerformanceChart() {
        const canvas = document.getElementById('performanceChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const datasets = this.performanceData || this.buildPerformanceDatasets(this.testHistoryData || []);
        this.performanceData = datasets;

        this.performanceChart = this.createSimpleLineChart(ctx, datasets.weekly);
    }

    createSimpleLineChart(ctx, data) {
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        const padding = { top: 34, right: 24, bottom: 50, left: 48 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const rawMin = Math.min(...data.values);
        const rawMax = Math.max(...data.values);
        const minValue = Math.max(0, Math.floor(rawMin - 10));
        const maxValue = Math.min(100, Math.ceil(rawMax + 10));
        const range = Math.max(1, maxValue - minValue);

        const points = data.values.map((value, index) => ({
            x: padding.left + (chartWidth * index) / Math.max(1, data.values.length - 1),
            y: padding.top + chartHeight - ((value - minValue) / range) * chartHeight,
            value,
            label: data.labels[index]
        }));

        const getControlPoint = (current, previous, next, reverse = false) => {
            const p = previous || current;
            const n = next || current;
            const smoothing = 0.18;
            const o = {
                length: Math.hypot(n.x - p.x, n.y - p.y),
                angle: Math.atan2(n.y - p.y, n.x - p.x)
            };
            const angle = o.angle + (reverse ? Math.PI : 0);
            const length = o.length * smoothing;
            return {
                x: current.x + Math.cos(angle) * length,
                y: current.y + Math.sin(angle) * length
            };
        };

        ctx.save();

        const cardGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        cardGradient.addColorStop(0, 'rgba(255,255,255,0.96)');
        cardGradient.addColorStop(1, 'rgba(248,250,252,0.92)');
        ctx.fillStyle = cardGradient;
        ctx.fillRect(padding.left, padding.top, chartWidth, chartHeight);

        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight * i) / 4;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        ctx.fillStyle = '#94A3B8';
        ctx.font = '12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const value = Math.round(maxValue - (range * i) / 4);
            const y = padding.top + (chartHeight * i) / 4 + 4;
            ctx.fillText(`${value}%`, padding.left - 12, y);
        }

        ctx.textAlign = 'center';
        data.labels.forEach((label, index) => {
            const x = padding.left + (chartWidth * index) / Math.max(1, data.labels.length - 1);
            ctx.fillText(label, x, height - 16);
        });

        const areaGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        areaGradient.addColorStop(0, 'rgba(37, 99, 235, 0.28)');
        areaGradient.addColorStop(0.65, 'rgba(59, 130, 246, 0.10)');
        areaGradient.addColorStop(1, 'rgba(59, 130, 246, 0.01)');

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
            const cps = getControlPoint(points[i], points[i - 1], points[i + 1]);
            const cpe = getControlPoint(points[i + 1], points[i], points[i + 2], true);
            ctx.bezierCurveTo(cps.x, cps.y, cpe.x, cpe.y, points[i + 1].x, points[i + 1].y);
        }
        ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
        ctx.lineTo(points[0].x, padding.top + chartHeight);
        ctx.closePath();
        ctx.fillStyle = areaGradient;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
            const cps = getControlPoint(points[i], points[i - 1], points[i + 1]);
            const cpe = getControlPoint(points[i + 1], points[i], points[i + 2], true);
            ctx.bezierCurveTo(cps.x, cps.y, cpe.x, cpe.y, points[i + 1].x, points[i + 1].y);
        }

        const trendPositive = points[points.length - 1].value >= points[0].value;
        const lineGradient = ctx.createLinearGradient(padding.left, 0, width - padding.right, 0);
        lineGradient.addColorStop(0, '#2563EB');
        lineGradient.addColorStop(1, trendPositive ? '#10B981' : '#F97316');
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        points.forEach((point, index) => {
            const ringColor = index === points.length - 1 ? (trendPositive ? '#10B981' : '#F97316') : '#2563EB';
            const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 14);
            glow.addColorStop(0, 'rgba(37, 99, 235, 0.24)');
            glow.addColorStop(1, 'rgba(37, 99, 235, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 14, 0, 2 * Math.PI);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(point.x, point.y, index === points.length - 1 ? 8 : 6.5, 0, 2 * Math.PI);
            ctx.fill();

            ctx.fillStyle = ringColor;
            ctx.beginPath();
            ctx.arc(point.x, point.y, index === points.length - 1 ? 5 : 4, 0, 2 * Math.PI);
            ctx.fill();
        });

        const avg = data.values.reduce((sum, value) => sum + value, 0) / Math.max(1, data.values.length);
        const last = data.values[data.values.length - 1];
        const first = data.values[0];
        const delta = Math.round((last - first) * 10) / 10;
        const headlineScore = document.getElementById('chartHeadlineScore');
        const headlineDelta = document.getElementById('chartHeadlineDelta');
        const consistency = document.getElementById('chartConsistency');
        const attemptCount = document.getElementById('chartAttemptCount');
        const attemptLabel = document.getElementById('chartAttemptLabel');
        const summaryText = document.getElementById('chartSummaryText');

        if (headlineScore) headlineScore.textContent = `${Math.round(last)}%`;
        if (headlineDelta) {
            const direction = delta > 0 ? 'Improving' : delta < 0 ? 'Cooling off' : 'Holding steady';
            headlineDelta.textContent = `${direction} ${delta === 0 ? 'from your first point' : `${delta > 0 ? '+' : ''}${delta} pts vs start`}`;
            headlineDelta.className = `text-sm font-semibold mt-1 ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-orange-500' : 'text-slate-500'}`;
        }
        if (consistency) consistency.textContent = `${Math.round(avg)}%`;
        if (attemptCount) attemptCount.textContent = `${data.values.length}`;
        if (attemptLabel) attemptLabel.textContent = `${data.values.length} scored checkpoints in this ${data.periodLabel || 'view'}`;
        if (summaryText) {
            const directionWord = delta > 0 ? 'upward momentum' : delta < 0 ? 'a recent dip' : 'stable output';
            summaryText.textContent = `This ${data.periodLabel || 'period'} shows ${directionWord}, with ${Math.round(avg)}% average performance across ${data.values.length} scored checkpoints.`;
        }

        ctx.restore();
        return { data, ctx };
    }

    updatePerformanceChart(period) {
        if (!this.performanceChart) return;

        const datasets = this.performanceData || this.buildPerformanceDatasets(this.testHistoryData || []);
        const selected = datasets[period] || datasets.weekly;
        this.createSimpleLineChart(this.performanceChart.ctx, selected);
    }

    async handleQuickTest(e) {
        e.preventDefault();

        const category = document.getElementById('quickTestCategory').value;
        const difficulty = document.querySelector('.difficulty-btn.active')?.getAttribute('data-difficulty') || 'Medium';
        const numQuestions = document.getElementById('questionSlider').value;
        const timeLimit = document.getElementById('timeLimitSelect').value;

        if (!category) {
            this.showError('Please select a test category');
            return;
        }

        const questionTypes = [];
        document.querySelectorAll('#quickTestForm input[type="checkbox"]:checked').forEach(cb => {
            questionTypes.push(cb.value);
        });

        if (questionTypes.length === 0) {
            this.showError('Please select at least one question type');
            return;
        }

        try {
            // Create test configuration
            const configResponse = await axios.get('/api/tests/query-config', {
                params: {
                    test_type: category,
                    difficulty: difficulty,
                    num_questions: parseInt(numQuestions),
                    duration_minutes: timeLimit ? parseInt(timeLimit) : 30,
                    question_types: questionTypes.join(',')
                }
            });

            if (configResponse.data.success) {
                // Start the test
                const startResponse = await axios.get('/api/tests/query-start', {
                    params: {
                        config_id: configResponse.data.config_id
                    }
                });

                if (startResponse.data.success && this.testInterface) {
                    this.testInterface.startTest(startResponse.data);
                } else {
                    this.showError('Failed to start test');
                }
            } else {
                this.showError(configResponse.data.message || 'Failed to create test');
            }
        } catch (error) {
            console.error('Quick test error:', error);
            this.showError(error.response?.data?.message || 'Failed to create test');
        }
    }

    buildPerformanceDatasets(attempts = []) {
        const normalized = (attempts || [])
            .filter(item => item && (item.end_time || item.start_time || item.created_at))
            .map(item => ({
                score: Number(item.score || 0),
                date: new Date(item.end_time || item.start_time || item.created_at)
            }))
            .filter(item => !Number.isNaN(item.date.getTime()))
            .sort((a, b) => a.date - b.date);

        const aggregate = (items, labelFormatter, keyFormatter) => {
            const grouped = new Map();
            items.forEach(item => {
                const key = keyFormatter(item.date);
                if (!grouped.has(key)) {
                    grouped.set(key, { total: 0, count: 0, label: labelFormatter(item.date) });
                }
                const bucket = grouped.get(key);
                bucket.total += item.score;
                bucket.count += 1;
            });

            const entries = Array.from(grouped.entries()).map(([key, bucket]) => ({
                key,
                label: bucket.label,
                value: Math.round(bucket.total / Math.max(1, bucket.count))
            }));

            return {
                labels: entries.map(entry => entry.label),
                values: entries.map(entry => entry.value)
            };
        };

        const fallback = {
            weekly: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [72, 74, 76, 75, 81, 84, 86], periodLabel: 'week' },
            monthly: { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], values: [71, 75, 79, 84], periodLabel: 'month' },
            yearly: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], values: [68, 72, 76, 80, 83, 86], periodLabel: 'year' }
        };

        if (!normalized.length) return fallback;

        const recentSeven = normalized.slice(-7);
        const weekly = {
            labels: recentSeven.map(item => item.date.toLocaleDateString(undefined, { weekday: 'short' })),
            values: recentSeven.map(item => Math.round(item.score)),
            periodLabel: 'week'
        };

        const recentThirty = normalized.filter(item => item.date >= new Date(Date.now() - 30 * 86400000));
        const monthly = aggregate(
            recentThirty.length ? recentThirty : normalized.slice(-12),
            (date) => `Wk ${Math.ceil(date.getDate() / 7)}`,
            (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${Math.ceil(date.getDate() / 7)}`
        );

        const recentYear = normalized.filter(item => item.date >= new Date(Date.now() - 365 * 86400000));
        const yearly = aggregate(
            recentYear.length ? recentYear : normalized,
            (date) => date.toLocaleDateString(undefined, { month: 'short' }),
            (date) => `${date.getFullYear()}-${date.getMonth()}`
        );

        return {
            weekly: weekly.values.length ? weekly : fallback.weekly,
            monthly: monthly.values.length ? { ...monthly, periodLabel: 'month' } : fallback.monthly,
            yearly: yearly.values.length ? { ...yearly, periodLabel: 'year' } : fallback.yearly
        };
    }

    formatRelativeDate(dateInput) {
        if (!dateInput) return 'Recently';
        const date = new Date(dateInput);
        if (Number.isNaN(date.getTime())) return 'Recently';
        const diffMs = Date.now() - date.getTime();
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffDays <= 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    createTestForCategory(categoryName) {
        const select = document.getElementById('quickTestCategory');
        if (select) {
            select.value = categoryName;
        }
        const testSelect = document.getElementById('testCategory');
        if (testSelect) {
            testSelect.value = categoryName;
        }
        // Could scroll to or highlight the quick test form
    }

    loadImprovementAreas() {
        const container = document.getElementById('improvementAreas');
        if (!container) return;

        // Mock improvement data based on performance analysis
        const improvementAreas = [
            { subject: 'Calculus - Derivatives', percentage: 45, level: 'critical' },
            { subject: 'Physics - Thermodynamics', percentage: 62, level: 'needs-work' },
            { subject: 'Programming - Algorithms', percentage: 74, level: 'good' },
            { subject: 'History - Ancient Civilizations', percentage: 58, level: 'needs-work' }
        ];

        container.innerHTML = improvementAreas.map(area => `
            <div class="improvement-item">
                <div class="improvement-subject">${area.subject}</div>
                <div class="improvement-progress-container">
                    <div class="improvement-progress-bar">
                        <div class="improvement-progress-fill ${area.level}" style="width: ${area.percentage}%"></div>
                    </div>
                    <div class="improvement-percentage ${area.level}">${area.percentage}%</div>
                </div>
            </div>
        `).join('');
    }

    loadAIRecommendations() {
        const container = document.getElementById('aiRecommendations');
        if (!container) return;

        // Mock AI recommendations based on performance analysis
        const recommendations = [
            {
                icon: 'fas fa-calculator',
                title: 'Focus on Calculus Fundamentals',
                text: 'Your performance in derivatives suggests reviewing basic differentiation rules would help improve your scores.',
                actions: ['Select', 'Move', 'Notes']
            },
            {
                icon: 'fas fa-code',
                title: 'Practice More Algorithm Questions',
                text: 'Spend 20 minutes daily on algorithm practice to improve your problem-solving skills.',
                actions: ['Select', 'Move', 'Notes']
            }
        ];

        container.innerHTML = recommendations.map(rec => `
            <div class="ai-recommendation">
                <div class="ai-recommendation-header">
                    <div class="ai-recommendation-icon">
                        <i class="${rec.icon}"></i>
                    </div>
                    <div class="ai-recommendation-content">
                        <div class="ai-recommendation-title">${rec.title}</div>
                        <div class="ai-recommendation-text">${rec.text}</div>
                        <div class="ai-recommendation-actions">
                            ${rec.actions.map(action => `
                                <span class="ai-action-btn ${action.toLowerCase()}">
                                    ${action}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    loadTestInProgress() {
        const container = document.getElementById('testInProgress');
        if (!container) return;

        // Mock test in progress data
        const testInProgress = {
            title: 'Programming - JavaScript Basics',
            difficulty: 'Medium',
            questions: 30,
            answered: 12,
            progress: 40
        };

        container.innerHTML = `
            <div class="test-progress-card">
                <div class="test-progress-icon">
                    <i class="fas fa-code text-blue-600"></i>
                </div>
                <div class="test-progress-info">
                    <div class="test-progress-title">${testInProgress.title}</div>
                    <div class="test-progress-meta">${testInProgress.difficulty} • ${testInProgress.answered}/${testInProgress.questions} questions • 45 Minutes</div>
                    <div class="test-progress-bar">
                        <div class="test-progress-fill" style="width: ${testInProgress.progress}%"></div>
                    </div>
                    <div class="test-progress-text">Progress: ${testInProgress.answered}/${testInProgress.questions} questions</div>
                </div>
                <div class="test-progress-actions">
                    <button class="continue-btn">Continue</button>
                    <div class="resume-link">Resume Test</div>
                </div>
            </div>
        `;
    }

    // Section-specific functionality
    setupTestCreationForm() {
        // Setup test creation form interactions
        const slider = document.getElementById('questionCountSlider');
        const display = document.getElementById('questionCountDisplay');
        const createBtn = document.getElementById('createTestBtn');

        if (slider && display) {
            slider.addEventListener('input', (e) => {
                display.textContent = e.target.value;
            });
        }

        // Setup difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        if (createBtn) {
            createBtn.addEventListener('click', () => this.handleCreateTest());
        }
    }

    async handleCreateTest() {
        const category = document.getElementById('testCategory')?.value;
        const difficulty = document.querySelector('.difficulty-btn.active')?.dataset.difficulty || 'Medium';
        const questionCount = document.getElementById('questionCountSlider')?.value || 15;
        const timeLimit = document.getElementById('timeLimit')?.value;

        if (!category) {
            this.showError('Please select a test category');
            return;
        }

        try {
            const configResponse = await axios.get('/api/tests/query-config', {
                params: {
                    test_type: category,
                    difficulty,
                    num_questions: parseInt(questionCount),
                    duration_minutes: timeLimit ? parseInt(timeLimit) : 30,
                    question_types: 'MCQ'
                }
            });

            if (!configResponse.data.success) {
                this.showError(configResponse.data.message || 'Failed to create test');
                return;
            }

            const startResponse = await axios.get('/api/tests/query-start', {
                params: {
                    config_id: configResponse.data.config_id
                }
            });

            if (startResponse.data.success && this.testInterface) {
                this.showSuccess('Test created successfully!');
                this.testInterface.startTest(startResponse.data);
            } else {
                this.showError(startResponse.data?.message || 'Failed to start test');
            }
        } catch (error) {
            console.error('Test creation error:', error);
            this.showError(error.response?.data?.message || 'Failed to create test. Please try again.');
        }
    }

    async loadTestHistory() {
        const container = document.getElementById('testHistoryList');
        if (!container) return;

        try {
            const response = await axios.get('/api/tests/history');
            const attempts = response.data?.attempts || [];

            if (response.data.success && attempts.length > 0) {
                container.innerHTML = attempts.map(test => `
                    <div class="recent-test-item mb-4">
                        <div class="flex-1">
                            <div class="font-medium text-slate-900">${test.test_type || 'Test'} - ${test.difficulty || 'Mixed'}</div>
                            <div class="text-sm text-gray-500">${new Date(test.end_time || test.start_time).toLocaleDateString()}</div>
                        </div>
                        <div class="text-right">
                            <div class="score-badge ${this.getScoreBadgeClass(test.score || 0)}">${Math.round(test.score || 0)}%</div>
                            <div class="text-xs text-gray-500">${test.total_questions || 0} questions</div>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-history text-4xl mb-4"></i>
                        <p>No test history available yet. Take a test to see your results here!</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Failed to load test history:', error);
            container.innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p>Failed to load test history. Please try again later.</p>
                </div>
            `;
        }
    }

    showProfileSection() {
        this.loadProfile();
    }

    showAnalyticsSection() {
        this.loadAnalytics();
    }

    getScoreBadgeClass(score) {
        if (score >= 90) return 'excellent';
        if (score >= 75) return 'good';
        if (score >= 60) return 'average';
        return 'poor';
    }

    loadAnalytics() {
        console.log('Analytics section loaded');
    }

    async loadProfile() {
        if (!this.user) return;

        const nameField = document.getElementById('profileName');
        const emailField = document.getElementById('profileEmail');
        const ageField = document.getElementById('profileAge');
        const educationField = document.getElementById('profileEducation');
        const updateBtn = document.getElementById('updateProfileBtn');

        // Populate current user data
        if (nameField) nameField.value = this.user.name || '';
        if (emailField) emailField.value = this.user.email || '';
        if (ageField) ageField.value = this.user.age || '';
        if (educationField) educationField.value = this.user.education || '';

        // Setup update functionality
        if (updateBtn) {
            updateBtn.addEventListener('click', () => this.handleUpdateProfile());
        }
    }

    async handleUpdateProfile() {
        const name = document.getElementById('profileName')?.value;
        const age = document.getElementById('profileAge')?.value;
        const education = document.getElementById('profileEducation')?.value;

        this.user = {
            ...this.user,
            name: name || this.user?.name,
            age: age ? parseInt(age) : null,
            education_level: education || null
        };

        localStorage.setItem('ai_test_user_draft', JSON.stringify({
            name: this.user.name,
            age: this.user.age,
            education_level: this.user.education_level
        }));

        this.updateUI();
        this.showSuccess('Profile updated locally. Server sync is not enabled yet.');
    }

    loadSettings() {
        // Placeholder for settings functionality
        console.log('Settings section loaded');
    }

    // Dashboard Features
    showTestCreation() {
        if (!this.user) {
            this.showRegisterModal();
            return;
        }

        this.switchSection('tests');

        if (this.testInterface) {
            this.testInterface.showTestConfigModal();
        } else {
            this.showError('Test interface not loaded. Please refresh the page.');
        }
    }

    showTestHistory() {
        this.showInfo('Loading your test history...');
        // TODO: Implement comprehensive test history interface
        this.showInfo('Test history feature coming soon!');
    }

    showSocialHub() {
        if (this.socialFeatures) {
            this.socialFeatures.showSocialModal();
        } else {
            this.showError('Social features not loaded. Please refresh the page.');
        }
    }

    showResultsModal(resultsData) {
        if (this.resultsDashboard) {
            this.resultsDashboard.showResults(resultsData);
        } else {
            this.showError('Results dashboard not loaded. Please refresh the page.');
        }
    }

    // Modal Management
    showLoginModal() {
        if (this.user) {
            this.switchSection('dashboard');
            return;
        }

        document.getElementById('loginModal').classList.add('show');
    }

    hideLoginModal() {
        document.getElementById('loginModal').classList.remove('show');
    }

    showRegisterModal() {
        if (this.user) {
            this.switchSection('tests');
            return;
        }

        document.getElementById('registerModal').classList.add('show');
    }

    hideRegisterModal() {
        document.getElementById('registerModal').classList.remove('show');
    }

    hideAllModals() {
        this.hideLoginModal();
        this.hideRegisterModal();
    }

    // Notification Methods
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl transition-all duration-300 transform translate-x-full border`;

        const colors = {
            success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            error: 'bg-red-50 text-red-700 border-red-200',
            info: 'bg-blue-50 text-blue-700 border-blue-200'
        };

        notification.classList.add(...colors[type].split(' '));
        notification.style.backdropFilter = 'blur(8px)';
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle mr-2"></i>
                <span class="font-medium">${message}</span>
                <button class="ml-4 opacity-60 hover:opacity-100 transition-opacity" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 10);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.testApp = new TestApp();

    // Initialize modules if they exist
    if (window.testApp.testInterface === null && typeof TestInterface !== 'undefined') {
        window.testApp.testInterface = new TestInterface(window.testApp);
    }
    if (window.testApp.resultsDashboard === null && typeof ResultsDashboard !== 'undefined') {
        window.testApp.resultsDashboard = new ResultsDashboard(window.testApp);
    }
    if (window.testApp.socialFeatures === null && typeof SocialFeatures !== 'undefined') {
        window.testApp.socialFeatures = new SocialFeatures(window.testApp);
    }
});