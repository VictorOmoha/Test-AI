import { debug } from './debug.js';

const FALLBACK_CATEGORIES = [
    { id: 'cat_math', name: 'Mathematics', description: 'Algebra, Calculus, Geometry, Statistics' },
    { id: 'cat_programming', name: 'Programming', description: 'Python, JavaScript, Java, Algorithms' },
    { id: 'cat_science', name: 'Science', description: 'Physics, Chemistry, Biology' },
    { id: 'cat_history', name: 'History', description: 'World History, Ancient Civilizations' }
];

const CHART_DATA = {
    weekly: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        values: [65, 70, 75, 68, 80, 85, 82]
    },
    monthly: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        values: [70, 75, 82, 88]
    },
    yearly: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        values: [65, 70, 78, 82, 85, 88]
    }
};

export const dashboardMethods = {
    async loadUserData() {
        try {
            debug.log('loadUserData called, user:', this.user);

            let stats = {
                tests_taken: 24,
                average_score: 78,
                categories_count: 5,
                total_time: 750
            };

            if (this.user) {
                try {
                    const statsResponse = await window.axios.get('/api/tests/stats');
                    if (statsResponse.data.success) {
                        stats = statsResponse.data.statistics;
                    }
                } catch (error) {
                    debug.log('Using fallback stats data');
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
    },

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
    },

    async loadTestCategories() {
        let categories = FALLBACK_CATEGORIES;

        if (Array.isArray(window.__CATEGORIES__) && window.__CATEGORIES__.length > 0) {
            categories = window.__CATEGORIES__;
            debug.log('Using SSR categories', categories.length);
        }

        try {
            const response = await window.axios.get('/api/tests/categories');
            if (response.data?.success && Array.isArray(response.data.categories) && response.data.categories.length > 0) {
                categories = response.data.categories;
            }
        } catch (error) {
            debug.log('Using fallback categories data');
        }

        this.displayTestCategories(categories);
        this.populateQuickTestCategories(categories);
        this.populateTestCreationCategories(categories);
    },

    displayTestCategories(categories) {
        const grid = document.getElementById('testCategoriesGrid');
        if (!grid) {
            return;
        }

        const progressData = {
            cat_math: 92,
            cat_programming: 75,
            cat_science: 62,
            cat_history: 88,
            cat_english: 71,
            cat_general: 65
        };

        const categoryIcons = {
            cat_math: 'fas fa-calculator',
            cat_programming: 'fas fa-code',
            cat_science: 'fas fa-atom',
            cat_history: 'fas fa-landmark',
            cat_english: 'fas fa-book',
            cat_general: 'fas fa-globe'
        };

        const colors = ['mathematics', 'programming', 'science', 'history', 'english', 'general'];

        grid.innerHTML = categories.map((category, index) => {
            const progress = progressData[category.id] || Math.floor(Math.random() * 40 + 60);
            const icon = categoryIcons[category.id] || 'fas fa-book';
            const colorClass = colors[index % colors.length];
            const description = category.description || 'Practice questions and performance tracking';

            return `
                <div class="test-category-card cursor-pointer" onclick="testApp.createTestForCategory('${category.name}')">
                    <div class="flex items-center justify-between mb-3">
                        <i class="${icon} text-xl text-primary"></i>
                        <span class="text-right text-sm font-medium">${progress}%</span>
                    </div>
                    <h4 class="font-medium text-gray-900 mb-1">${category.name}</h4>
                    <p class="text-xs text-gray-600 mb-3 line-clamp-2">${description}</p>
                    <div class="progress-bar">
                        <div class="progress-fill ${colorClass}" style="width: ${progress}%"></div>
                    </div>
                    <p class="text-xs text-gray-500 mt-2">${Math.floor(Math.random() * 10 + 5)} tests taken</p>
                </div>
            `;
        }).join('');
    },

    populateQuickTestCategories(categories) {
        const select = document.getElementById('quickTestCategory');
        if (!select) {
            return;
        }

        const options = categories.map((category) => `<option value="${category.name}">${category.name}</option>`).join('');
        select.innerHTML = '<option value="">Select category...</option>' + options;
        debug.log('Populated quickTestCategory with', categories.length, 'categories');
    },

    populateTestCreationCategories(categories) {
        const configSelect = document.getElementById('testCategory');
        if (configSelect) {
            const options = categories.map((category) => `<option value="${category.name}">${category.name}</option>`).join('');
            configSelect.innerHTML = '<option value="">Select category...</option>' + options;
            debug.log('Populated testCategory with', categories.length, 'categories');
        }

        const modalSelect = document.getElementById('testCategoryModal');
        if (modalSelect) {
            const options = categories.map((category) => `<option value="${category.name}">${category.name}</option>`).join('');
            modalSelect.innerHTML = '<option value="">Select a category...</option>' + options;
        }
    },

    async loadRecentTests() {
        try {
            const recentTests = [
                { subject: 'Mathematics', score: 92, timestamp: 'Today', questions: 20 },
                { subject: 'Programming', score: 75, timestamp: 'Yesterday', questions: 15 },
                { subject: 'Science', score: 62, timestamp: '3 days ago', questions: 30 },
                { subject: 'History', score: 88, timestamp: '5 days ago', questions: 25 }
            ];

            this.displayRecentTests(recentTests);
        } catch (error) {
            console.error('Failed to load recent tests:', error);
        }
    },

    displayRecentTests(tests) {
        const container = document.getElementById('recentTestsList');
        if (!container) {
            return;
        }

        container.innerHTML = tests.map((test) => {
            const scoreClass = test.score >= 85 ? 'excellent' : test.score >= 70 ? 'good' : test.score >= 50 ? 'average' : 'poor';

            return `
                <div class="recent-test-item">
                    <div class="flex-1">
                        <h4 class="font-medium text-gray-900 text-sm">${test.subject}</h4>
                        <p class="text-xs text-gray-600">${test.questions} questions • ${test.timestamp}</p>
                    </div>
                    <div class="score-badge ${scoreClass}">${test.score}%</div>
                </div>
            `;
        }).join('');
    },

    initializePerformanceChart() {
        const canvas = document.getElementById('performanceChart');
        if (!canvas) {
            return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        this.performanceChart = this.createSimpleLineChart(context, CHART_DATA.weekly);
    },

    createSimpleLineChart(context, data) {
        const { canvas } = context;
        const { width, height } = canvas;
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        const minValue = Math.min(...data.values) - 10;
        const maxValue = Math.max(...data.values) + 10;
        const range = maxValue - minValue;

        context.clearRect(0, 0, width, height);
        context.strokeStyle = '#E5E7EB';
        context.lineWidth = 1;

        for (let index = 0; index <= 5; index += 1) {
            const y = padding + (chartHeight * index) / 5;
            context.beginPath();
            context.moveTo(padding, y);
            context.lineTo(width - padding, y);
            context.stroke();
        }

        context.strokeStyle = '#1E40AF';
        context.lineWidth = 3;
        context.beginPath();

        data.values.forEach((value, index) => {
            const x = padding + (chartWidth * index) / (data.values.length - 1);
            const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
            if (index === 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
        });

        context.stroke();
        context.fillStyle = '#1E40AF';

        data.values.forEach((value, index) => {
            const x = padding + (chartWidth * index) / (data.values.length - 1);
            const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
            context.beginPath();
            context.arc(x, y, 4, 0, Math.PI * 2);
            context.fill();
        });

        return { data, ctx: context };
    },

    updatePerformanceChart(period) {
        if (!this.performanceChart) {
            return;
        }

        this.createSimpleLineChart(this.performanceChart.ctx, CHART_DATA[period] || CHART_DATA.weekly);
    },

    loadImprovementAreas() {
        const container = document.getElementById('improvementAreas');
        if (!container) {
            return;
        }

        const improvementAreas = [
            { subject: 'Calculus - Derivatives', percentage: 45, level: 'critical' },
            { subject: 'Physics - Thermodynamics', percentage: 62, level: 'needs-work' },
            { subject: 'Programming - Algorithms', percentage: 74, level: 'good' },
            { subject: 'History - Ancient Civilizations', percentage: 58, level: 'needs-work' }
        ];

        container.innerHTML = improvementAreas.map((area) => `
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
    },

    loadAIRecommendations() {
        const container = document.getElementById('aiRecommendations');
        if (!container) {
            return;
        }

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

        container.innerHTML = recommendations.map((recommendation) => `
            <div class="ai-recommendation">
                <div class="ai-recommendation-header">
                    <div class="ai-recommendation-icon">
                        <i class="${recommendation.icon}"></i>
                    </div>
                    <div class="ai-recommendation-content">
                        <div class="ai-recommendation-title">${recommendation.title}</div>
                        <div class="ai-recommendation-text">${recommendation.text}</div>
                        <div class="ai-recommendation-actions">
                            ${recommendation.actions.map((action) => `<span class="ai-action-btn ${action.toLowerCase()}">${action}</span>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    loadTestInProgress() {
        const container = document.getElementById('testInProgress');
        if (!container) {
            return;
        }

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
};
