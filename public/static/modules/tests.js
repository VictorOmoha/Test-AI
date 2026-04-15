import { debug } from './debug.js';

export const testMethods = {
    async handleQuickTest(event) {
        event.preventDefault();

        const category = document.getElementById('quickTestCategory')?.value;
        const difficulty = document.querySelector('.difficulty-btn.active')?.getAttribute('data-difficulty') || 'Medium';
        const numQuestions = document.getElementById('questionSlider')?.value;
        const timeLimit = document.getElementById('timeLimitSelect')?.value;

        if (!category) {
            this.showError('Please select a test category');
            return;
        }

        const questionTypes = [];
        document.querySelectorAll('#quickTestForm input[type="checkbox"]:checked').forEach((checkbox) => {
            questionTypes.push(checkbox.value);
        });

        if (questionTypes.length === 0) {
            this.showError('Please select at least one question type');
            return;
        }

        try {
            const configResponse = await window.axios.post('/api/tests/config', {
                test_type: category,
                difficulty,
                num_questions: parseInt(numQuestions, 10),
                duration_minutes: timeLimit ? parseInt(timeLimit, 10) : 30,
                question_types: questionTypes
            });

            if (!configResponse.data.success) {
                this.showError(configResponse.data.message || 'Failed to create test');
                return;
            }

            const startResponse = await window.axios.post('/api/tests/start', {
                config_id: configResponse.data.config_id
            });

            if (startResponse.data.success && this.testInterface) {
                this.testInterface.startTest(startResponse.data);
                return;
            }

            this.showError(startResponse.data.message || 'Failed to start test');
        } catch (error) {
            console.error('Quick test error:', error);
            this.showError(error.response?.data?.message || 'Failed to create test');
        }
    },

    createTestForCategory(categoryName) {
        const quickSelect = document.getElementById('quickTestCategory');
        if (quickSelect) {
            quickSelect.value = categoryName;
        }

        const configSelect = document.getElementById('testCategory');
        if (configSelect) {
            configSelect.value = categoryName;
        }
    },

    setupTestCreationForm() {
        const slider = document.getElementById('questionCountSlider');
        const display = document.getElementById('questionCountDisplay');
        const createButton = document.getElementById('createTestBtn');

        if (slider && display && !slider.dataset.bound) {
            slider.dataset.bound = 'true';
            slider.addEventListener('input', (event) => {
                display.textContent = event.target.value;
            });
        }

        document.querySelectorAll('.difficulty-btn').forEach((button) => {
            if (button.dataset.bound) {
                return;
            }

            button.dataset.bound = 'true';
            button.addEventListener('click', () => {
                document.querySelectorAll('.difficulty-btn').forEach((tab) => tab.classList.remove('active'));
                button.classList.add('active');
            });
        });

        if (createButton && !createButton.dataset.bound) {
            createButton.dataset.bound = 'true';
            createButton.addEventListener('click', () => this.handleCreateTest());
        }
    },

    async handleCreateTest() {
        const category = document.getElementById('testCategory')?.value;
        const difficulty = document.querySelector('.difficulty-btn.active')?.dataset.difficulty || 'Medium';
        const questionCount = document.getElementById('questionCountSlider')?.value || '15';
        const timeLimit = document.getElementById('timeLimit')?.value;

        if (!category) {
            this.showError('Please select a test category');
            return;
        }

        try {
            const configResponse = await window.axios.post('/api/tests/config', {
                test_type: category,
                difficulty,
                num_questions: parseInt(questionCount, 10),
                duration_minutes: timeLimit ? parseInt(timeLimit, 10) : 30,
                question_types: ['MCQ']
            });

            if (!configResponse.data.success) {
                this.showError(configResponse.data.message || 'Failed to create test');
                return;
            }

            const startResponse = await window.axios.post('/api/tests/start', {
                config_id: configResponse.data.config_id
            });

            if (startResponse.data.success && this.testInterface) {
                this.showSuccess('Test created successfully! Starting test...');
                this.testInterface.startTest(startResponse.data);
                return;
            }

            this.showError(startResponse.data.message || 'Failed to start test');
        } catch (error) {
            console.error('Test creation error:', error);
            this.showError(error.response?.data?.message || 'Failed to create test. Please try again.');
        }
    },

    async loadTestHistory() {
        const container = document.getElementById('testHistoryList');
        if (!container) {
            return;
        }

        try {
            const response = await window.axios.get('/api/tests/history');
            const tests = response.data.tests || response.data.history || [];

            if (response.data.success && Array.isArray(tests) && tests.length > 0) {
                container.innerHTML = tests.map((test) => `
                    <div class="recent-test-item mb-4">
                        <div class="flex-1">
                            <div class="font-medium text-gray-900">${test.category || test.test_type || 'Test'} - ${test.difficulty || 'Mixed'}</div>
                            <div class="text-sm text-gray-500">${new Date(test.completed_at || test.created_at || Date.now()).toLocaleDateString()}</div>
                        </div>
                        <div class="text-right">
                            <div class="score-badge ${this.getScoreBadgeClass(test.score || 0)}">${Math.round(test.score || 0)}%</div>
                            <div class="text-xs text-gray-500">${test.questions_count || test.total_questions || 0} questions</div>
                        </div>
                    </div>
                `).join('');
                return;
            }

            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-history text-4xl mb-4"></i>
                    <p>No test history available yet. Take a test to see your results here!</p>
                </div>
            `;
        } catch (error) {
            console.error('Failed to load test history:', error);
            container.innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p>Failed to load test history. Please try again later.</p>
                </div>
            `;
        }
    },

    getScoreBadgeClass(score) {
        if (score >= 90) return 'excellent';
        if (score >= 75) return 'good';
        if (score >= 60) return 'average';
        return 'poor';
    },

    loadAnalytics() {
        debug.log('Analytics section loaded');
        this.showInfo('Advanced analytics dashboard coming soon!');
    },

    async loadProfile() {
        if (!this.user) {
            return;
        }

        const nameField = document.getElementById('profileName');
        const emailField = document.getElementById('profileEmail');
        const ageField = document.getElementById('profileAge');
        const educationField = document.getElementById('profileEducation');
        const updateButton = document.getElementById('updateProfileBtn');

        if (nameField) nameField.value = this.user.name || '';
        if (emailField) emailField.value = this.user.email || '';
        if (ageField) ageField.value = this.user.age || '';
        if (educationField) educationField.value = this.user.education_level || this.user.education || '';

        if (updateButton && !updateButton.dataset.bound) {
            updateButton.dataset.bound = 'true';
            updateButton.addEventListener('click', () => this.handleUpdateProfile());
        }
    },

    async handleUpdateProfile() {
        const name = document.getElementById('profileName')?.value;
        const age = document.getElementById('profileAge')?.value;
        const education_level = document.getElementById('profileEducation')?.value;

        try {
            const response = await window.axios.put('/api/auth/profile', {
                name,
                age: age ? parseInt(age, 10) : null,
                education_level
            });

            if (response.data.success) {
                this.user = { ...this.user, ...response.data.user };
                this.showSuccess('Profile updated successfully!');
                return;
            }

            this.showError(response.data.message || 'Failed to update profile.');
        } catch (error) {
            console.error('Profile update error:', error);
            this.showError(error.response?.data?.message || 'Failed to update profile. Please try again.');
        }
    },

    loadSettings() {
        debug.log('Settings section loaded');
    }
};
