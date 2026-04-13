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
        this.studyMaterials = [];
        this.currentSection = 'dashboard';
        this.hasCompletedOnboarding = localStorage.getItem('ai_test_onboarding_done') === '1';
        this.materialsState = {
            loading: false,
            importing: false,
            warning: '',
            error: ''
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthState();
        this.setupAxiosInterceptors();
        this.initializeModules();
        try {
            this.loadTestCategories();
        } catch (e) {}
    }

    initializeModules() {
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
        document.getElementById('loginBtn').addEventListener('click', () => this.showLoginModal());
        document.getElementById('registerBtn').addEventListener('click', () => this.showRegisterModal());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        document.getElementById('closeLoginModal').addEventListener('click', () => this.hideLoginModal());
        document.getElementById('closeRegisterModal').addEventListener('click', () => this.hideRegisterModal());

        document.getElementById('switchToRegister').addEventListener('click', () => {
            this.hideLoginModal();
            this.showRegisterModal();
        });
        document.getElementById('switchToLogin').addEventListener('click', () => {
            this.hideRegisterModal();
            this.showLoginModal();
        });

        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));

        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const section = tab.getAttribute('data-tab');
                this.switchSection(section);
            });
        });

        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                if (section) {
                    this.switchSection(section);
                }
            });
        });

        this.setupDashboardEventListeners();

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.hideAllModals();
            }
        });
    }

    setupDashboardEventListeners() {
        document.querySelectorAll('.chart-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.chart-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const period = btn.getAttribute('data-period');
                this.updatePerformanceChart(period);
            });
        });

        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const parent = btn.parentElement;
                if (parent) {
                    parent.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                }
                btn.classList.add('active');
            });
        });

        const questionSlider = document.getElementById('questionSlider');
        const questionCount = document.getElementById('questionCount');
        if (questionSlider && questionCount) {
            questionSlider.addEventListener('input', () => {
                questionCount.textContent = questionSlider.value;
            });
        }

        const quickTestForm = document.getElementById('quickTestForm');
        if (quickTestForm) {
            quickTestForm.addEventListener('submit', (e) => this.handleQuickTest(e));
        }

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
            let response;
            try {
                response = await axios.post('/api/auth/login', { email, password }, {
                    timeout: 5000
                });
            } catch (primaryError) {
                console.warn('POST /api/auth/login failed, falling back to query login', primaryError?.response?.data || primaryError?.message || primaryError);
                response = await axios.get('/api/auth/query-login', {
                    params: { email, password },
                    timeout: 5000
                });
            }

            if (response.data.success && response.data.token && response.data.user) {
                this.user = response.data.user;
                this.token = response.data.token;
                localStorage.setItem('ai_test_token', this.token);

                this.hideLoginModal();
                this.updateUI();
                await this.loadUserData();
                this.handlePostAuthRouting();
                this.showSuccess('Login successful!');
                return;
            }

            this.showError(response.data.message || 'Login failed');
        } catch (error) {
            console.error('API login failed:', error?.response?.data || error?.message || error);
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
            let response;
            try {
                response = await axios.post('/api/auth/register', userData, {
                    timeout: 5000
                });
            } catch (primaryError) {
                console.warn('POST /api/auth/register failed, falling back to query register', primaryError?.response?.data || primaryError?.message || primaryError);
                response = await axios.get('/api/auth/query-register', {
                    params: userData,
                    timeout: 5000
                });
            }

            if (response.data.success && response.data.token && response.data.user) {
                this.user = response.data.user;
                this.token = response.data.token;
                localStorage.setItem('ai_test_token', this.token);

                this.hideRegisterModal();
                this.updateUI();
                await this.loadUserData();
                this.handlePostAuthRouting(true);
                this.showSuccess('Registration successful! Welcome to TestAI!');
                return;
            }

            this.showError(response.data.message || 'Registration failed');
        } catch (error) {
            console.error('API registration failed:', error?.response?.data || error?.message || error);
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

        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const userMenu = document.getElementById('userMenu');

        if (loginBtn) loginBtn.style.display = isLoggedIn ? 'none' : 'inline-flex';
        if (registerBtn) registerBtn.style.display = isLoggedIn ? 'none' : 'inline-flex';
        if (userMenu) userMenu.style.display = isLoggedIn ? 'flex' : 'none';

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

        const welcomeSection = document.getElementById('welcomeSection');
        if (welcomeSection) {
            welcomeSection.style.display = isLoggedIn ? 'none' : 'block';
            welcomeSection.classList.toggle('hidden', isLoggedIn);
        }

        document.querySelectorAll('[data-guest-only="true"]').forEach(element => {
            element.style.display = isLoggedIn ? 'none' : '';
            element.classList.toggle('hidden', isLoggedIn);
        });

        const sections = ['dashboardSection', 'testsSection', 'historySection', 'analyticsSection', 'materialsSection', 'profileSection', 'settingsSection'];
        sections.forEach(sectionId => {
            const element = document.getElementById(sectionId);
            if (element) {
                element.classList.add('hidden');
                element.style.display = '';
            }
        });

        if (isLoggedIn) {
            this.switchSection('dashboard');
        }
    }

    switchSection(section) {
        if (!this.user && ['dashboard', 'tests', 'history', 'analytics', 'materials', 'profile', 'settings'].includes(section)) {
            this.showRegisterModal();
            return;
        }

        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === section);
        });

        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-section') === section);
        });

        this.currentSection = section;

        const sections = ['dashboardSection', 'testsSection', 'historySection', 'analyticsSection', 'materialsSection', 'profileSection', 'settingsSection'];
        sections.forEach(sectionId => {
            const element = document.getElementById(sectionId);
            if (element) {
                element.classList.add('hidden');
            }
        });

        const targetSection = `${section}Section`;
        const element = document.getElementById(targetSection);
        if (element) {
            element.classList.remove('hidden');
            element.style.display = 'block';
        }

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
            case 'materials':
                this.showMaterials();
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
        this.loadUserData();
    }

    handlePostAuthRouting(isNewUser = false) {
        const hasMaterials = Array.isArray(this.studyMaterials) && this.studyMaterials.length > 0;

        if (isNewUser || !this.hasCompletedOnboarding || !hasMaterials) {
            this.hasCompletedOnboarding = true;
            localStorage.setItem('ai_test_onboarding_done', '1');
            this.switchSection('materials');
            this.showInfo(hasMaterials
                ? 'You are ready to generate a grounded test from your materials.'
                : 'Start in Materials: upload a study file, generate a grounded test, then review and retry weak areas.');
            return;
        }

        this.switchSection('dashboard');
        this.showInfo('Tip: the strongest TestAI workflow starts in Materials, not generic category tests.');
    }

    showTests() {
        this.setupTestCreationForm();
    }

    showHistory() {
        this.loadTestHistory();
    }

    showAnalytics() {
        this.loadAnalytics();
    }

    showMaterials() {
        this.setupMaterialsSection();
        this.loadStudyMaterials();
    }

    showProfile() {
        this.loadProfile();
    }

    showSettings() {
        this.loadSettings();
    }

    async loadUserData() {
        try {
            let stats = {
                tests_taken: 24,
                average_score: 78,
                categories_count: 5,
                total_time: 750
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

            this.displayDashboardStats(stats);
            await this.loadTestCategories();
            await this.loadRecentTests();
            this.initializePerformanceChart();
            this.loadTestInProgress();
            this.loadImprovementAreas();
            this.loadAIRecommendations();

        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }

    displayDashboardStats(stats) {
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
        const fallbackCategories = [
            { id: 'cat_math', name: 'Mathematics', description: 'Algebra, Calculus, Geometry, Statistics' },
            { id: 'cat_programming', name: 'Programming', description: 'Python, JavaScript, Java, Algorithms' },
            { id: 'cat_science', name: 'Science', description: 'Physics, Chemistry, Biology' },
            { id: 'cat_history', name: 'History', description: 'World History, Ancient Civilizations' }
        ];

        let categories = fallbackCategories;

        try {
            if (typeof window !== 'undefined' && Array.isArray(window.__CATEGORIES__) && window.__CATEGORIES__.length > 0) {
                categories = window.__CATEGORIES__;
            }
        } catch (e) {}

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
            const testsTaken = Math.floor(Math.random() * 10 + 5);
            const safeName = String(category.name || 'Category').replace(/'/g, "\\'");

            return `
                <button type="button" class="test-category-card category-card-clean cursor-pointer text-left w-full" onclick="testApp.createTestForCategory('${safeName}')">
                    <div class="category-card-top">
                        <div class="category-card-icon ${colorClass}">
                            <i class="${icon}"></i>
                        </div>
                        <div class="category-card-score-wrap">
                            <div class="category-card-score">${progress}%</div>
                            <div class="category-card-score-label">mastery</div>
                        </div>
                    </div>
                    <div class="category-card-body">
                        <h4 class="category-card-title">${category.name}</h4>
                        <p class="category-card-desc">${category.description}</p>
                    </div>
                    <div class="category-card-footer">
                        <div class="progress-bar">
                            <div class="progress-fill ${colorClass}" style="width: ${progress}%"></div>
                        </div>
                        <div class="category-card-meta">
                            <span>${testsTaken} tests taken</span>
                            <span>General practice</span>
                        </div>
                    </div>
                </button>
            `;
        }).join('');
    }

    populateQuickTestCategories(categories) {
        const select = document.getElementById('quickTestCategory');
        if (!select) return;

        const opts = categories.map(category => `<option value="${category.name}">${category.name}</option>`).join('');
        select.innerHTML = '<option value="">Select category...</option>' + opts;
    }

    populateTestCreationCategories(categories) {
        const select = document.getElementById('testCategory');
        if (!select) return;
        const opts2 = categories.map(category => `<option value="${category.name}">${category.name}</option>`).join('');
        select.innerHTML = '<option value="">Select category...</option>' + opts2;
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
                    <div class="flex-1 min-w-0">
                        <h4 class="font-medium text-slate-900 text-sm truncate">${test.subject}</h4>
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

        const ctx = this.prepareHiDPICanvas(canvas);
        const datasets = this.performanceData || this.buildPerformanceDatasets(this.testHistoryData || []);
        this.performanceData = datasets;

        this.performanceChart = this.createSimpleLineChart(ctx, datasets.weekly);
    }

    prepareHiDPICanvas(canvas) {
        const rect = canvas.getBoundingClientRect();
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const displayWidth = Math.max(320, Math.floor(rect.width || canvas.clientWidth || 800));
        const displayHeight = Math.max(220, Math.floor(rect.height || canvas.clientHeight || 320));

        canvas.width = Math.floor(displayWidth * ratio);
        canvas.height = Math.floor(displayHeight * ratio);
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        const ctx = canvas.getContext('2d');
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        return ctx;
    }

    createSimpleLineChart(ctx, data) {
        const canvas = ctx.canvas;
        const width = canvas.width / Math.max(window.devicePixelRatio || 1, 1);
        const height = canvas.height / Math.max(window.devicePixelRatio || 1, 1);

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

    updatePerformanceChart(period) {
        if (!this.performanceChart) return;

        const canvas = this.performanceChart.ctx.canvas;
        const ctx = this.prepareHiDPICanvas(canvas);
        const datasets = this.performanceData || this.buildPerformanceDatasets(this.testHistoryData || []);
        const selected = datasets[period] || datasets.weekly;
        this.performanceChart = this.createSimpleLineChart(ctx, selected);
    }

    async handleQuickTest(e) {
        e.preventDefault();

        const category = document.getElementById('quickTestCategory').value;
        const difficulty = document.querySelector('#quickTestForm .difficulty-btn.active')?.getAttribute('data-difficulty') || 'Medium';
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
            const configResponse = await axios.post('/api/tests/config', {
                test_type: category,
                difficulty: difficulty,
                num_questions: parseInt(numQuestions),
                duration_minutes: timeLimit ? parseInt(timeLimit) : 30,
                question_types: questionTypes
            });

            if (configResponse.data.success) {
                const startResponse = await axios.post('/api/tests/start', {
                    config_id: configResponse.data.config_id
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

    createTestForCategory(categoryName) {
        const select = document.getElementById('quickTestCategory');
        if (select) {
            select.value = categoryName;
        }
        const testSelect = document.getElementById('testCategory');
        if (testSelect) {
            testSelect.value = categoryName;
        }
    }

    loadImprovementAreas() {
        const container = document.getElementById('improvementAreas');
        if (!container) return;

        if (!this.testHistoryData.length) {
            container.innerHTML = `
                <div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 leading-6">
                    Take a few tests and TestAI will surface your weakest areas here so you know what to review next.
                </div>
            `;
            return;
        }

        const categoryMap = new Map();
        this.testHistoryData.forEach(test => {
            const subject = test.test_type || 'General';
            const score = Math.round(Number(test.score || 0));
            const existing = categoryMap.get(subject) || { total: 0, count: 0 };
            existing.total += score;
            existing.count += 1;
            categoryMap.set(subject, existing);
        });

        const improvementAreas = Array.from(categoryMap.entries())
            .map(([subject, data]) => ({
                subject,
                percentage: Math.round(data.total / Math.max(1, data.count))
            }))
            .sort((a, b) => a.percentage - b.percentage)
            .slice(0, 4);

        container.innerHTML = improvementAreas.map(area => `
            <div class="improvement-item">
                <div class="improvement-subject">${area.subject}</div>
                <div class="improvement-progress-container">
                    <div class="improvement-progress-bar">
                        <div class="improvement-progress-fill" style="width: ${area.percentage}%"></div>
                    </div>
                    <span class="improvement-percentage">${area.percentage}%</span>
                </div>
            </div>
        `).join('');
    }

    loadAIRecommendations() {
        const container = document.getElementById('aiRecommendations');
        if (!container) return;

        const recommendations = this.studyMaterials.length
            ? [
                {
                    title: 'Generate a test from your latest material',
                    description: 'You already have study material imported. Turn it into a focused test to measure retention immediately.'
                },
                {
                    title: 'Use focus areas for tougher subjects',
                    description: 'Narrowing the topic, like a chapter or concept, creates sharper questions and better review loops.'
                },
                {
                    title: 'Ask follow-up questions after each test',
                    description: 'Use the material Q&A flow to clarify concepts you missed instead of guessing what to study next.'
                }
            ]
            : [
                {
                    title: 'Start with your real study material',
                    description: 'Upload notes, slides, or a PDF first. That gives TestAI something real to generate high-value questions from.'
                },
                {
                    title: 'Use generic tests for warm-up only',
                    description: 'Category tests are useful, but the strongest workflow is material-based practice built from what you are actually studying.'
                },
                {
                    title: 'Build a feedback loop',
                    description: 'Import material, generate a test, review mistakes, then ask TestAI follow-up questions until the topic clicks.'
                }
            ];

        container.innerHTML = recommendations.map(rec => `
            <div class="ai-recommendation p-4">
                <h4 class="font-semibold text-slate-900 mb-1">${rec.title}</h4>
                <p class="text-sm text-slate-500 leading-6">${rec.description}</p>
            </div>
        `).join('');
    }

    loadTestInProgress() {
        const container = document.getElementById('testInProgress');
        if (!container) return;

        if (!this.studyMaterials.length) {
            container.innerHTML = `
                <div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div class="font-semibold text-slate-900">No study workflow started yet</div>
                            <div class="text-sm text-slate-500 mt-1">Import a file to create your first material-based test. That is the fastest path to a meaningful result.</div>
                        </div>
                        <button type="button" class="btn-primary" onclick="testApp.switchSection('materials')">
                            <i class="fas fa-upload mr-2"></i>Upload Material
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        const latestMaterial = this.studyMaterials[0];
        container.innerHTML = `
            <div class="test-progress-card progress-card-clean">
                <div class="progress-card-main">
                    <div class="progress-card-icon-wrap">
                        <div class="test-progress-icon">
                            <i class="fas fa-file-lines text-blue-600"></i>
                        </div>
                    </div>
                    <div class="test-progress-info">
                        <div class="progress-card-header-row">
                            <div>
                                <div class="test-progress-title">${latestMaterial.title}</div>
                                <div class="test-progress-meta">${latestMaterial.file_type.toUpperCase()} imported ${this.formatRelativeDate(latestMaterial.created_at)} • Ready for a custom test</div>
                            </div>
                            <div class="progress-chip">Ready</div>
                        </div>
                        <div class="test-progress-text">Generate a focused test from this material or ask TestAI questions directly from the source text.</div>
                    </div>
                </div>
                <div class="test-progress-actions clean-actions">
                    <button class="continue-btn" type="button" onclick="testApp.switchSection('materials')">Generate Test</button>
                    <button type="button" class="resume-link" onclick="testApp.switchSection('materials')">Open Materials</button>
                </div>
            </div>
        `;
    }

    setupTestCreationForm() {
        const slider = document.getElementById('questionCountSlider');
        const display = document.getElementById('questionCountDisplay');
        const createBtn = document.getElementById('createTestBtn');

        if (slider && display) {
            slider.addEventListener('input', (e) => {
                display.textContent = e.target.value;
            });
        }

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
        const difficulty = document.querySelector('#testCreationForm .difficulty-btn.active')?.dataset.difficulty || 'Medium';
        const questionCount = document.getElementById('questionCountSlider')?.value || 15;
        const timeLimit = document.getElementById('timeLimit')?.value;

        if (!category) {
            this.showError('Please select a test category');
            return;
        }

        try {
            const configResponse = await axios.post('/api/tests/config', {
                test_type: category,
                difficulty,
                num_questions: parseInt(questionCount),
                duration_minutes: timeLimit ? parseInt(timeLimit) : 30,
                question_types: ['MCQ']
            });

            if (!configResponse.data.success) {
                this.showError(configResponse.data.message || 'Failed to create test');
                return;
            }

            const startResponse = await axios.post('/api/tests/start', {
                config_id: configResponse.data.config_id
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

    setupMaterialsSection() {
        const importBtn = document.getElementById('importMaterialBtn');
        const generateBtn = document.getElementById('generateStudyTestBtn');
        const askBtn = document.getElementById('askMaterialBtn');
        const fileInput = document.getElementById('materialFile');
        const materialSelect = document.getElementById('studyMaterialSelect');
        const askMaterialSelect = document.getElementById('askMaterialSelect');
        const statusBox = document.getElementById('materialsStatus');

        if (importBtn && !importBtn.dataset.bound) {
            importBtn.dataset.bound = '1';
            importBtn.addEventListener('click', () => this.handleImportMaterial());
        }
        if (generateBtn && !generateBtn.dataset.bound) {
            generateBtn.dataset.bound = '1';
            generateBtn.addEventListener('click', () => this.handleGenerateStudyTest());
        }
        if (askBtn && !askBtn.dataset.bound) {
            askBtn.dataset.bound = '1';
            askBtn.addEventListener('click', () => this.handleAskMaterial());
        }
        if (fileInput && !fileInput.dataset.bound) {
            fileInput.dataset.bound = '1';
            fileInput.addEventListener('change', () => {
                const file = fileInput.files?.[0];
                const titleInput = document.getElementById('materialTitle');
                if (file && titleInput && !titleInput.value) {
                    titleInput.value = file.name.replace(/\.[^.]+$/, '');
                }
            });
        }

        if (materialSelect && this.studyMaterials.length && !materialSelect.value) {
            materialSelect.value = this.studyMaterials[0].id;
        }
        if (askMaterialSelect && this.studyMaterials.length && !askMaterialSelect.value) {
            askMaterialSelect.value = this.studyMaterials[0].id;
        }

        if (generateBtn) {
            generateBtn.disabled = !this.studyMaterials.length || this.materialsState.loading;
            generateBtn.classList.toggle('opacity-60', generateBtn.disabled);
            generateBtn.classList.toggle('cursor-not-allowed', generateBtn.disabled);
        }
        if (askBtn) {
            askBtn.disabled = !this.studyMaterials.length || this.materialsState.loading;
            askBtn.classList.toggle('opacity-60', askBtn.disabled);
            askBtn.classList.toggle('cursor-not-allowed', askBtn.disabled);
        }
        if (importBtn) {
            importBtn.disabled = this.materialsState.importing;
            importBtn.classList.toggle('opacity-60', importBtn.disabled);
            importBtn.classList.toggle('cursor-not-allowed', importBtn.disabled);
            importBtn.innerHTML = this.materialsState.importing
                ? '<i class="fas fa-spinner fa-spin mr-2"></i>Importing...'
                : '<i class="fas fa-upload mr-2"></i>Import Material';
        }

        if (statusBox) {
            if (this.materialsState.error) {
                statusBox.className = 'rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700';
                statusBox.textContent = this.materialsState.error;
            } else if (this.materialsState.warning) {
                statusBox.className = 'rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700';
                statusBox.textContent = this.materialsState.warning;
            } else if (this.materialsState.loading) {
                statusBox.className = 'rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500';
                statusBox.textContent = 'Loading study materials...';
            } else {
                statusBox.className = 'hidden';
                statusBox.textContent = '';
            }
        }
    }

    async handleImportMaterial() {
        const fileInput = document.getElementById('materialFile');
        const titleInput = document.getElementById('materialTitle');
        const file = fileInput?.files?.[0];

        if (!file) {
            this.showError('Choose a file to import first.');
            return;
        }

        this.materialsState.importing = true;
        this.materialsState.error = '';
        this.setupMaterialsSection();

        try {
            const base64 = await this.readFileAsBase64(file);
            const response = await axios.post('/api/tests/materials/import', {
                title: titleInput?.value || undefined,
                file_name: file.name,
                mime_type: file.type,
                file_content_base64: base64
            });

            if (response.data?.success) {
                this.showSuccess('Study material imported.');
                if (fileInput) fileInput.value = '';
                if (titleInput) titleInput.value = '';
                await this.loadStudyMaterials(response.data?.material?.id);
            } else {
                this.materialsState.error = response.data?.message || 'Import failed.';
                this.showError(this.materialsState.error);
            }
        } catch (error) {
            console.error('Material import failed:', error);
            this.materialsState.error = error.response?.data?.message || 'Failed to import file.';
            this.showError(this.materialsState.error);
        } finally {
            this.materialsState.importing = false;
            this.setupMaterialsSection();
        }
    }

    async loadStudyMaterials(selectMaterialId = '') {
        this.materialsState.loading = true;
        this.materialsState.error = '';
        this.materialsState.warning = '';
        this.setupMaterialsSection();

        try {
            const response = await axios.get('/api/tests/materials');
            if (response.data?.success) {
                this.studyMaterials = response.data.materials || [];
                if (selectMaterialId && response.data?.material) {
                    const existing = this.studyMaterials.find(item => item.id === response.data.material.id);
                    if (!existing) {
                        this.studyMaterials.unshift(response.data.material);
                    }
                }
                this.materialsState.warning = response.data.warning || '';
                this.renderStudyMaterials();
                this.populateStudyMaterialSelects(selectMaterialId);
                this.setupMaterialsSection();
                if (response.data.warning) {
                    this.showInfo(response.data.warning);
                }
            }
        } catch (error) {
            console.error('Failed to load study materials:', error);
            if (error.response?.status === 401) {
                return;
            }
            this.materialsState.error = error.response?.data?.message || 'Failed to load study materials.';
        } finally {
            this.materialsState.loading = false;
            this.setupMaterialsSection();
        }
    }

    renderStudyMaterials() {
        const list = document.getElementById('materialsList');
        if (!list) return;

        if (!this.studyMaterials.length) {
            list.innerHTML = `
                <div class="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 leading-6">
                    No materials imported yet. Import a TXT, Markdown, PDF, or DOCX file to unlock material-based test generation.
                </div>
            `;
            return;
        }

        list.innerHTML = this.studyMaterials.map(material => {
            const quality = material.extraction_quality || 'high';
            const qualityClass = quality === 'high'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : quality === 'medium'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200';
            const status = material.processing_status || 'ready';
            const warnings = Array.isArray(material.extraction_warnings) ? material.extraction_warnings : [];
            const fileSize = material.file_size_bytes
                ? `${Math.max(1, Math.round(material.file_size_bytes / 1024))} KB`
                : 'Unknown size';

            return `
            <div class="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <div class="font-semibold text-slate-900">${material.title}</div>
                        <div class="text-xs text-slate-400 mt-1">${material.file_name} • ${material.file_type.toUpperCase()}</div>
                    </div>
                    <div class="text-xs text-slate-400">${this.formatRelativeDate(material.created_at)}</div>
                </div>
                <div class="flex flex-wrap gap-2 mt-3">
                    <span class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${qualityClass}">Extraction: ${quality}</span>
                    <span class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">Type: ${material.material_type || material.file_type}</span>
                    <span class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">Status: ${status}</span>
                    <span class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">Chunks: ${material.chunk_count || 0}</span>
                    <span class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">Size: ${fileSize}</span>
                </div>
                ${warnings.length ? `
                    <div class="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        ${warnings.map(warning => `<div>• ${warning}</div>`).join('')}
                    </div>
                ` : ''}
                <p class="text-sm text-slate-500 mt-3 leading-6">${material.text_preview || ''}...</p>
            </div>
        `}).join('');
    }

    populateStudyMaterialSelects(preferredId = '') {
        const selects = [document.getElementById('studyMaterialSelect'), document.getElementById('askMaterialSelect')];
        selects.forEach(select => {
            if (!select) return;
            const current = select.value;
            const placeholder = this.studyMaterials.length
                ? 'Choose imported material...'
                : 'No imported materials yet';
            select.innerHTML = `<option value="">${placeholder}</option>` + this.studyMaterials.map(material => {
                const quality = material.extraction_quality ? ` [${material.extraction_quality}]` : '';
                return `<option value="${material.id}">${material.title}${quality}</option>`;
            }).join('');
            const targetValue = preferredId || current || this.studyMaterials[0]?.id || '';
            if (targetValue) select.value = targetValue;
            select.disabled = !this.studyMaterials.length;
        });
    }

    async handleGenerateStudyTest() {
        const materialId = document.getElementById('studyMaterialSelect')?.value;
        const difficulty = document.getElementById('studyDifficulty')?.value || 'Medium';
        const numQuestions = parseInt(document.getElementById('studyQuestionCount')?.value || '10');
        const topicFocus = document.getElementById('studyTopicFocus')?.value || '';
        const useWebSources = Boolean(document.getElementById('studyUseWebSources')?.checked);

        if (!materialId) {
            this.showError('Choose a material first.');
            return;
        }

        try {
            const response = await axios.post('/api/tests/materials/generate-test', {
                material_id: materialId,
                difficulty,
                num_questions: numQuestions,
                question_types: ['MCQ', 'TrueFalse', 'ShortAnswer'],
                topic_focus: topicFocus || undefined,
                use_web_sources: useWebSources
            });

            if (response.data?.success && this.testInterface) {
                this.showSuccess('Material-based test ready.');
                this.testInterface.startTest(response.data);
            } else {
                this.showError(response.data?.message || 'Failed to generate study test.');
            }
        } catch (error) {
            console.error('Generate study test failed:', error);
            this.showError(error.response?.data?.message || 'Failed to generate study test.');
        }
    }

    async handleAskMaterial() {
        const materialId = document.getElementById('askMaterialSelect')?.value;
        const question = document.getElementById('materialQuestion')?.value;
        const answerBox = document.getElementById('materialAnswer');
        const useWebSources = Boolean(document.getElementById('studyUseWebSources')?.checked);

        if (!materialId || !question) {
            this.showError('Choose a material and enter a question.');
            return;
        }

        if (answerBox) {
            answerBox.innerHTML = '<div class="text-slate-400">Thinking...</div>';
        }

        try {
            const response = await axios.post('/api/tests/materials/ask', {
                material_id: materialId,
                question,
                use_web_sources: useWebSources
            });

            if (response.data?.success) {
                if (answerBox) {
                    answerBox.innerHTML = `<div class="p-4 rounded-xl bg-slate-50 border border-slate-200 whitespace-pre-wrap">${response.data.answer}</div>`;
                }
            } else {
                this.showError(response.data?.message || 'Failed to answer from study material.');
                if (answerBox) answerBox.innerHTML = '';
            }
        } catch (error) {
            console.error('Ask material failed:', error);
            this.showError(error.response?.data?.message || 'Failed to answer from study material.');
            if (answerBox) answerBox.innerHTML = '';
        }
    }

    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result || '';
                const base64 = String(result).split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
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

        if (nameField) nameField.value = this.user.name || '';
        if (emailField) emailField.value = this.user.email || '';
        if (ageField) ageField.value = this.user.age || '';
        if (educationField) educationField.value = this.user.education_level || '';

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
        console.log('Settings section loaded');
    }

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
            this.switchSection('materials');
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
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl transition-all duration-300 transform translate-x-full border`;
        notification.style.background = type === 'success' ? '#ecfdf5' : type === 'error' ? '#fff1f2' : '#eff6ff';
        notification.style.borderColor = type === 'success' ? '#a7f3d0' : type === 'error' ? '#fecdd3' : '#bfdbfe';
        notification.style.color = type === 'success' ? '#065f46' : type === 'error' ? '#9f1239' : '#1d4ed8';
        notification.textContent = message;

        document.body.appendChild(notification);
        requestAnimationFrame(() => {
            notification.classList.remove('translate-x-full');
        });

        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }, 2800);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.testApp = new TestApp();
});
