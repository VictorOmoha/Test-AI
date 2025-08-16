// AI Test Application Frontend JavaScript
class TestApp {
    constructor() {
        this.user = null;
        this.token = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthState();
        this.setupAxiosInterceptors();
    }

    setupAxiosInterceptors() {
        // Add token to all requests
        axios.interceptors.request.use(
            config => {
                if (this.token) {
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
                if (error.response?.status === 401) {
                    this.logout();
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

        // Dashboard cards
        document.getElementById('newTestCard')?.addEventListener('click', () => this.showTestCreation());
        document.getElementById('historyCard')?.addEventListener('click', () => this.showTestHistory());
        document.getElementById('profileCard')?.addEventListener('click', () => this.showProfile());

        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('fixed') && e.target.classList.contains('bg-black')) {
                this.hideAllModals();
            }
        });
    }

    async checkAuthState() {
        const token = localStorage.getItem('ai_test_token');
        if (token) {
            this.token = token;
            try {
                const response = await axios.post('/api/auth/verify');
                if (response.data.success && response.data.user) {
                    this.user = response.data.user;
                    this.updateUI();
                    await this.loadUserData();
                } else {
                    this.logout();
                }
            } catch (error) {
                console.error('Token verification failed:', error);
                this.logout();
            }
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await axios.post('/api/auth/login', { email, password });
            
            if (response.data.success) {
                this.user = response.data.user;
                this.token = response.data.token;
                localStorage.setItem('ai_test_token', this.token);
                
                this.hideLoginModal();
                this.updateUI();
                await this.loadUserData();
                this.showSuccess('Login successful!');
            } else {
                this.showError(response.data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError(error.response?.data?.message || 'Login failed');
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
            const response = await axios.post('/api/auth/register', userData);
            
            if (response.data.success) {
                this.user = response.data.user;
                this.token = response.data.token;
                localStorage.setItem('ai_test_token', this.token);
                
                this.hideRegisterModal();
                this.updateUI();
                await this.loadUserData();
                this.showSuccess('Registration successful! Welcome to AI Test Application!');
            } else {
                this.showError(response.data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError(error.response?.data?.message || 'Registration failed');
        }
    }

    logout() {
        this.user = null;
        this.token = null;
        localStorage.removeItem('ai_test_token');
        this.updateUI();
        this.showSuccess('Logged out successfully');
    }

    updateUI() {
        const isLoggedIn = this.user !== null;
        
        // Toggle navigation elements
        document.getElementById('loginBtn').style.display = isLoggedIn ? 'none' : 'inline-flex';
        document.getElementById('registerBtn').style.display = isLoggedIn ? 'none' : 'inline-flex';
        document.getElementById('userMenu').style.display = isLoggedIn ? 'flex' : 'none';
        
        // Update user name
        if (isLoggedIn) {
            document.getElementById('userName').textContent = `Hello, ${this.user.name}`;
        }
        
        // Toggle main sections
        document.getElementById('welcomeSection').style.display = isLoggedIn ? 'none' : 'block';
        document.getElementById('dashboardSection').style.display = isLoggedIn ? 'block' : 'none';
    }

    async loadUserData() {
        if (!this.user) return;
        
        try {
            // Load user statistics
            const statsResponse = await axios.get('/api/tests/stats');
            if (statsResponse.data.success) {
                this.displayStats(statsResponse.data.statistics);
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }

    displayStats(stats) {
        const statsGrid = document.getElementById('statsGrid');
        if (!statsGrid) return;

        statsGrid.innerHTML = `
            <div class="text-center">
                <div class="text-2xl font-bold text-primary">${stats.total_tests || 0}</div>
                <div class="text-sm text-gray-600">Tests Taken</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-primary">${Math.round(stats.avg_score || 0)}%</div>
                <div class="text-sm text-gray-600">Average Score</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-primary">${Math.round(stats.best_score || 0)}%</div>
                <div class="text-sm text-gray-600">Best Score</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-primary">${stats.total_questions_answered || 0}</div>
                <div class="text-sm text-gray-600">Questions Answered</div>
            </div>
        `;
    }

    // Modal Management
    showLoginModal() {
        document.getElementById('loginModal').classList.remove('hidden');
        document.getElementById('loginModal').classList.add('flex');
    }

    hideLoginModal() {
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('loginModal').classList.remove('flex');
    }

    showRegisterModal() {
        document.getElementById('registerModal').classList.remove('hidden');
        document.getElementById('registerModal').classList.add('flex');
    }

    hideRegisterModal() {
        document.getElementById('registerModal').classList.add('hidden');
        document.getElementById('registerModal').classList.remove('flex');
    }

    hideAllModals() {
        this.hideLoginModal();
        this.hideRegisterModal();
    }

    // Dashboard Features
    showTestCreation() {
        // TODO: Implement test creation interface
        this.showInfo('Test creation feature coming soon!');
    }

    showTestHistory() {
        // TODO: Implement test history interface
        this.showInfo('Test history feature coming soon!');
    }

    showProfile() {
        // TODO: Implement profile management interface
        this.showInfo('Profile management feature coming soon!');
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
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
        
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
});