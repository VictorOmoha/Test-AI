import { debug } from './debug.js';

const SECTION_IDS = ['dashboardSection', 'testsSection', 'historySection', 'analyticsSection', 'profileSection', 'settingsSection'];

export const coreMethods = {
    init() {
        this.setupEventListeners();
        this.checkAuthState();
        this.setupAxiosInterceptors();
        this.initializeModules();

        try {
            this.loadTestCategories();
        } catch (error) {
            debug.log('Initial category load failed', error);
        }
    },

    initializeModules() {
        if (this.TestInterface) {
            this.testInterface = new this.TestInterface(this);
        }

        if (this.ResultsDashboard) {
            this.resultsDashboard = new this.ResultsDashboard(this);
        }

        if (this.SocialFeatures) {
            this.socialFeatures = new this.SocialFeatures(this);
        }
    },

    setupAxiosInterceptors() {
        window.axios.interceptors.request.use(
            (config) => {
                if (this.token) {
                    config.headers = config.headers || {};
                    config.headers.Authorization = `Bearer ${this.token}`;
                }

                return config;
            },
            (error) => Promise.reject(error)
        );

        window.axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401 && this.user) {
                    this.logout();
                }

                return Promise.reject(error);
            }
        );
    },

    setupEventListeners() {
        document.getElementById('loginBtn')?.addEventListener('click', () => this.showLoginModal());
        document.getElementById('registerBtn')?.addEventListener('click', () => this.showRegisterModal());
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());

        document.getElementById('closeLoginModal')?.addEventListener('click', () => this.hideLoginModal());
        document.getElementById('closeRegisterModal')?.addEventListener('click', () => this.hideRegisterModal());

        document.getElementById('switchToRegister')?.addEventListener('click', () => {
            this.hideLoginModal();
            this.showRegisterModal();
        });

        document.getElementById('switchToLogin')?.addEventListener('click', () => {
            this.hideRegisterModal();
            this.showLoginModal();
        });

        document.getElementById('loginForm')?.addEventListener('submit', (event) => this.handleLogin(event));
        document.getElementById('registerForm')?.addEventListener('submit', (event) => this.handleRegister(event));

        document.querySelectorAll('.nav-tab').forEach((tab) => {
            tab.addEventListener('click', (event) => {
                event.preventDefault();
                const section = tab.getAttribute('data-tab');
                if (section) {
                    this.switchSection(section);
                }
            });
        });

        document.querySelectorAll('.sidebar-item').forEach((item) => {
            item.addEventListener('click', (event) => {
                event.preventDefault();
                const section = item.getAttribute('data-section');
                if (section) {
                    this.switchSection(section);
                }
            });
        });

        this.setupDashboardEventListeners();

        document.addEventListener('click', (event) => {
            const target = event.target;
            if (target instanceof HTMLElement && target.classList.contains('fixed') && target.classList.contains('bg-black')) {
                this.hideAllModals();
            }
        });
    },

    setupDashboardEventListeners() {
        document.querySelectorAll('.chart-tab-btn').forEach((button) => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.chart-tab-btn').forEach((tab) => tab.classList.remove('active'));
                button.classList.add('active');
                const period = button.getAttribute('data-period') || 'weekly';
                this.updatePerformanceChart(period);
            });
        });

        document.querySelectorAll('.difficulty-btn').forEach((button) => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.difficulty-btn').forEach((tab) => tab.classList.remove('active'));
                button.classList.add('active');
            });
        });

        const questionSlider = document.getElementById('questionSlider');
        const questionCount = document.getElementById('questionCount');
        if (questionSlider && questionCount) {
            questionSlider.addEventListener('input', () => {
                questionCount.textContent = questionSlider.value;
            });
        }

        document.getElementById('quickTestForm')?.addEventListener('submit', (event) => this.handleQuickTest(event));
        document.getElementById('takeNewTestBtn')?.addEventListener('click', () => this.showTestCreation());
    },

    async checkAuthState() {
        const token = localStorage.getItem('ai_test_token');
        if (!token) {
            return;
        }

        this.token = token;

        try {
            const response = await window.axios.post('/api/auth/verify');
            if (response.data.success && response.data.user) {
                this.user = response.data.user;
                this.updateUI();
                await this.loadUserData();
                return;
            }
        } catch (error) {
            console.error('Token verification failed:', error);
        }

        this.logout({ silent: true });
    },

    async handleLogin(event) {
        event.preventDefault();

        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;

        if (!email || !password) {
            this.showError('Please enter both email and password');
            return;
        }

        try {
            const response = await window.axios.post('/api/auth/login', { email, password });
            if (!response.data.success) {
                this.showError(response.data.message || 'Login failed');
                return;
            }

            this.user = response.data.user;
            this.token = response.data.token;
            localStorage.setItem('ai_test_token', this.token);
            this.hideLoginModal();
            this.updateUI();
            await this.loadUserData();
            this.showSuccess('Login successful!');
        } catch (error) {
            debug.log('API login failed', error);
            this.showError(error.response?.data?.message || 'Login failed');
        }
    },

    async handleRegister(event) {
        event.preventDefault();

        const userData = {
            name: document.getElementById('registerName')?.value,
            email: document.getElementById('registerEmail')?.value,
            password: document.getElementById('registerPassword')?.value
        };

        const age = document.getElementById('registerAge')?.value;
        const educationLevel = document.getElementById('registerEducation')?.value;

        if (age) {
            userData.age = parseInt(age, 10);
        }

        if (educationLevel) {
            userData.education_level = educationLevel;
        }

        try {
            const response = await window.axios.post('/api/auth/register', userData);
            if (!response.data.success) {
                this.showError(response.data.message || 'Registration failed');
                return;
            }

            this.user = response.data.user;
            this.token = response.data.token;
            localStorage.setItem('ai_test_token', this.token);
            this.hideRegisterModal();
            this.updateUI();
            await this.loadUserData();
            this.showSuccess('Registration successful! Welcome to TestAI!');
        } catch (error) {
            console.error('Registration error:', error);
            this.showError(error.response?.data?.message || 'Registration failed');
        }
    },

    logout(options = {}) {
        this.user = null;
        this.token = null;
        localStorage.removeItem('ai_test_token');
        this.updateUI();

        if (!options.silent) {
            this.showSuccess('Logged out successfully');
        }
    },

    updateUI() {
        const isLoggedIn = this.user !== null;

        const loginButton = document.getElementById('loginBtn');
        const registerButton = document.getElementById('registerBtn');
        const userMenu = document.getElementById('userMenu');
        const sidebar = document.getElementById('sidebar');
        const mainNavTabs = document.getElementById('mainNavTabs');
        const welcomeSection = document.getElementById('welcomeSection');

        if (loginButton) loginButton.style.display = isLoggedIn ? 'none' : 'inline-flex';
        if (registerButton) registerButton.style.display = isLoggedIn ? 'none' : 'inline-flex';
        if (userMenu) userMenu.style.display = isLoggedIn ? 'flex' : 'none';

        if (sidebar) {
            sidebar.classList.toggle('hidden', !isLoggedIn);
            sidebar.classList.toggle('block', isLoggedIn);
        }

        if (mainNavTabs) {
            mainNavTabs.classList.toggle('hidden', !isLoggedIn);
            mainNavTabs.classList.toggle('flex', isLoggedIn);
        }

        if (isLoggedIn && this.user) {
            const userName = document.getElementById('userName');
            const userInitials = document.getElementById('userInitials');
            const welcomeMessage = document.getElementById('welcomeMessage');

            if (userName) userName.textContent = this.user.name;
            if (userInitials) {
                const initials = this.user.name.split(' ').map((part) => part[0]).join('').toUpperCase();
                userInitials.textContent = initials;
            }
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome back, ${this.user.name.split(' ')[0]}!`;
            }
        }

        if (welcomeSection) {
            welcomeSection.style.display = isLoggedIn ? 'none' : 'block';
        }

        SECTION_IDS.forEach((sectionId) => {
            const element = document.getElementById(sectionId);
            if (!element) {
                return;
            }

            element.classList.add('hidden');
            element.style.display = '';
        });

        if (isLoggedIn) {
            this.switchSection('dashboard');
        }
    },

    switchSection(section) {
        debug.log('switchSection called with:', section);

        document.querySelectorAll('.nav-tab').forEach((tab) => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === section);
        });

        document.querySelectorAll('.sidebar-item').forEach((item) => {
            item.classList.toggle('active', item.getAttribute('data-section') === section);
        });

        this.currentSection = section;

        SECTION_IDS.forEach((sectionId) => {
            const element = document.getElementById(sectionId);
            if (element) {
                element.classList.add('hidden');
            }
        });

        const targetSection = document.getElementById(`${section}Section`);
        debug.log('Target section:', `${section}Section`, 'Element found:', Boolean(targetSection));
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.style.display = 'block';
        }

        switch (section) {
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
    },

    showDashboard() {
        debug.log('showDashboard called');
        this.loadUserData();
    },

    showTests() {
        this.setupTestCreationForm();
    },

    showHistory() {
        this.loadTestHistory();
    },

    showAnalytics() {
        this.loadAnalytics();
    },

    showProfile() {
        this.loadProfile();
    },

    showSettings() {
        this.loadSettings();
    },

    showTestCreation() {
        if (this.testInterface) {
            this.testInterface.showTestConfigModal();
            return;
        }

        this.showError('Test interface not loaded. Please refresh the page.');
    },

    showSocialHub() {
        if (this.socialFeatures) {
            this.socialFeatures.showSocialModal();
            return;
        }

        this.showError('Social features not loaded. Please refresh the page.');
    },

    showResultsModal(resultsData) {
        if (this.resultsDashboard) {
            this.resultsDashboard.showResults(resultsData);
            return;
        }

        this.showError('Results dashboard not loaded. Please refresh the page.');
    },

    showLoginModal() {
        document.getElementById('loginModal')?.classList.remove('hidden');
        document.getElementById('loginModal')?.classList.add('flex');
    },

    hideLoginModal() {
        document.getElementById('loginModal')?.classList.add('hidden');
        document.getElementById('loginModal')?.classList.remove('flex');
    },

    showRegisterModal() {
        document.getElementById('registerModal')?.classList.remove('hidden');
        document.getElementById('registerModal')?.classList.add('flex');
    },

    hideRegisterModal() {
        document.getElementById('registerModal')?.classList.add('hidden');
        document.getElementById('registerModal')?.classList.remove('flex');
    },

    hideAllModals() {
        this.hideLoginModal();
        this.hideRegisterModal();
    },

    showSuccess(message) {
        this.showNotification(message, 'success');
    },

    showError(message) {
        this.showNotification(message, 'error');
    },

    showInfo(message) {
        this.showNotification(message, 'info');
    },

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full';

        const colors = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            info: 'bg-blue-500 text-white'
        };

        notification.classList.add(...colors[type].split(' '));
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle mr-2"></i>
                <span>${message}</span>
                <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.remove('translate-x-full'), 10);
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
};
