// Test Interface Module for AI Test Application
class TestInterface {
    constructor(testApp) {
        this.app = testApp;
        this.currentAttempt = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.answers = new Map();
        this.questionTimes = new Map();
        this.timer = null;
        this.startTime = null;
        this.questionStartTime = null;
        this.bookmarkedQuestions = new Set();
        this.init();
    }

    init() {
        this.createTestInterface();
        this.setupEventListeners();
    }

    createTestInterface() {
        // Create test configuration modal
        const testConfigModal = document.createElement('div');
        testConfigModal.id = 'testConfigModal';
        testConfigModal.className = 'fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50';
        testConfigModal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-semibold">Configure Your Test</h2>
                    <button id="closeTestConfigModal" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <form id="testConfigForm">
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Test Category</label>
                            <select id="testCategory" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" required>
                                <option value="">Select a category...</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                            <select id="testDifficulty" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" required>
                                <option value="Easy">Easy</option>
                                <option value="Medium" selected>Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
                            <input type="range" id="testQuestions" min="10" max="50" value="20" class="w-full">
                            <div class="flex justify-between text-sm text-gray-600 mt-1">
                                <span>10</span>
                                <span id="questionsValue" class="font-medium">20</span>
                                <span>50</span>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                            <input type="range" id="testDuration" min="5" max="180" value="30" class="w-full">
                            <div class="flex justify-between text-sm text-gray-600 mt-1">
                                <span>5</span>
                                <span id="durationValue" class="font-medium">30</span>
                                <span>180</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-6">
                        <label class="block text-sm font-medium text-gray-700 mb-3">Question Types</label>
                        <div class="grid grid-cols-3 gap-4">
                            <label class="flex items-center">
                                <input type="checkbox" id="typeMCQ" value="MCQ" checked class="mr-2">
                                <span>Multiple Choice</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" id="typeTrueFalse" value="TrueFalse" class="mr-2">
                                <span>True/False</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" id="typeShortAnswer" value="ShortAnswer" class="mr-2">
                                <span>Short Answer</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="mt-8 flex justify-end space-x-4">
                        <button type="button" id="cancelTestConfig" class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-play mr-2"></i>Start Test
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(testConfigModal);

        // Create test taking interface
        const testTakingModal = document.createElement('div');
        testTakingModal.id = 'testTakingModal';
        testTakingModal.className = 'fixed inset-0 bg-gray-100 hidden z-50';
        testTakingModal.innerHTML = `
            <div class="h-screen flex flex-col">
                <!-- Test Header -->
                <div class="bg-white shadow-sm border-b px-6 py-4">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center space-x-4">
                            <h1 class="text-xl font-semibold" id="testTitle">Test in Progress</h1>
                            <div class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm" id="testProgress">
                                Question 1 of 20
                            </div>
                        </div>
                        
                        <div class="flex items-center space-x-6">
                            <div class="text-center">
                                <div class="text-2xl font-bold text-primary" id="timeRemaining">30:00</div>
                                <div class="text-sm text-gray-600">Time Remaining</div>
                            </div>
                            <button id="pauseTest" class="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors">
                                <i class="fas fa-pause mr-1"></i>Pause
                            </button>
                            <button id="submitTest" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                                <i class="fas fa-flag-checkered mr-1"></i>Submit
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Test Content -->
                <div class="flex-1 flex">
                    <!-- Question Panel -->
                    <div class="flex-1 p-6">
                        <div class="max-w-4xl mx-auto">
                            <!-- Question Content -->
                            <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
                                <div class="flex justify-between items-start mb-4">
                                    <div class="flex items-center space-x-2">
                                        <span class="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium" id="questionNumber">1</span>
                                        <span class="text-gray-600" id="questionType">Multiple Choice</span>
                                        <button id="bookmarkQuestion" class="text-gray-400 hover:text-yellow-500 transition-colors">
                                            <i class="far fa-bookmark"></i>
                                        </button>
                                    </div>
                                    <div class="text-sm text-gray-500">
                                        Time on this question: <span id="questionTime" class="font-medium">0:00</span>
                                    </div>
                                </div>
                                
                                <div class="mb-6">
                                    <h3 class="text-lg font-medium mb-4" id="questionText">Loading question...</h3>
                                    <div id="questionOptions" class="space-y-3">
                                        <!-- Options will be populated here -->
                                    </div>
                                </div>
                                
                                <div class="flex justify-between items-center">
                                    <button id="prevQuestion" class="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        <i class="fas fa-chevron-left mr-2"></i>Previous
                                    </button>
                                    
                                    <div class="flex space-x-3">
                                        <button id="clearAnswer" class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                                            <i class="fas fa-eraser mr-1"></i>Clear
                                        </button>
                                        <button id="saveAnswer" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                                            <i class="fas fa-save mr-1"></i>Save
                                        </button>
                                    </div>
                                    
                                    <button id="nextQuestion" class="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors">
                                        Next<i class="fas fa-chevron-right ml-2"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Progress Bar -->
                            <div class="bg-white rounded-lg shadow-sm border p-4">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-sm font-medium">Progress</span>
                                    <span class="text-sm text-gray-600" id="progressText">0 of 20 answered</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-primary h-2 rounded-full transition-all duration-300" id="progressBar" style="width: 0%"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Question Navigator -->
                    <div class="w-80 bg-white border-l p-6">
                        <h3 class="font-semibold mb-4">Question Navigator</h3>
                        
                        <div class="mb-4">
                            <div class="flex items-center space-x-2 text-sm">
                                <div class="w-3 h-3 bg-green-500 rounded"></div>
                                <span>Answered</span>
                                <div class="w-3 h-3 bg-yellow-500 rounded ml-4"></div>
                                <span>Bookmarked</span>
                                <div class="w-3 h-3 bg-gray-300 rounded ml-4"></div>
                                <span>Not Answered</span>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-5 gap-2" id="questionNavigator">
                            <!-- Question navigation buttons will be populated here -->
                        </div>
                        
                        <div class="mt-6 pt-6 border-t">
                            <h4 class="font-medium mb-3">Quick Stats</h4>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span>Answered:</span>
                                    <span id="answeredCount" class="font-medium">0</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Remaining:</span>
                                    <span id="remainingCount" class="font-medium">20</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Bookmarked:</span>
                                    <span id="bookmarkedCount" class="font-medium">0</span>
                                </div>
                            </div>
                        </div>
                        
                        <button id="reviewAnswers" class="w-full mt-6 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                            <i class="fas fa-eye mr-2"></i>Review Mode
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(testTakingModal);
    }

    setupEventListeners() {
        // Test configuration modal events
        document.getElementById('closeTestConfigModal').addEventListener('click', () => this.hideTestConfigModal());
        document.getElementById('cancelTestConfig').addEventListener('click', () => this.hideTestConfigModal());
        document.getElementById('testConfigForm').addEventListener('submit', (e) => this.handleTestConfigSubmit(e));
        
        // Range input updates
        document.getElementById('testQuestions').addEventListener('input', (e) => {
            document.getElementById('questionsValue').textContent = e.target.value;
        });
        document.getElementById('testDuration').addEventListener('input', (e) => {
            document.getElementById('durationValue').textContent = e.target.value;
        });

        // Test taking interface events
        document.getElementById('pauseTest').addEventListener('click', () => this.pauseTest());
        document.getElementById('submitTest').addEventListener('click', () => this.submitTest());
        document.getElementById('prevQuestion').addEventListener('click', () => this.previousQuestion());
        document.getElementById('nextQuestion').addEventListener('click', () => this.nextQuestion());
        document.getElementById('saveAnswer').addEventListener('click', () => this.saveCurrentAnswer());
        document.getElementById('clearAnswer').addEventListener('click', () => this.clearCurrentAnswer());
        document.getElementById('bookmarkQuestion').addEventListener('click', () => this.toggleBookmark());
        document.getElementById('reviewAnswers').addEventListener('click', () => this.showReviewMode());
    }

    async showTestConfigModal() {
        try {
            // Load test categories
            const response = await axios.get('/api/tests/categories');
            if (response.data.success) {
                const categorySelect = document.getElementById('testCategory');
                categorySelect.innerHTML = '<option value="">Select a category...</option>';
                
                response.data.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.name;
                    option.textContent = `${category.name} - ${category.description}`;
                    option.dataset.category = JSON.stringify(category);
                    categorySelect.appendChild(option);
                });
            }
            
            document.getElementById('testConfigModal').classList.remove('hidden');
            document.getElementById('testConfigModal').classList.add('flex');
        } catch (error) {
            console.error('Error loading test categories:', error);
            this.app.showError('Failed to load test categories');
        }
    }

    hideTestConfigModal() {
        document.getElementById('testConfigModal').classList.add('hidden');
        document.getElementById('testConfigModal').classList.remove('flex');
    }

    async handleTestConfigSubmit(e) {
        e.preventDefault();
        
        const category = document.getElementById('testCategory').value;
        const difficulty = document.getElementById('testDifficulty').value;
        const numQuestions = parseInt(document.getElementById('testQuestions').value);
        const duration = parseInt(document.getElementById('testDuration').value);
        
        const questionTypes = [];
        if (document.getElementById('typeMCQ').checked) questionTypes.push('MCQ');
        if (document.getElementById('typeTrueFalse').checked) questionTypes.push('TrueFalse');
        if (document.getElementById('typeShortAnswer').checked) questionTypes.push('ShortAnswer');
        
        if (questionTypes.length === 0) {
            this.app.showError('Please select at least one question type');
            return;
        }

        try {
            this.app.showInfo('Creating test configuration...');
            
            // Create test configuration
            const configResponse = await axios.post('/api/tests/config', {
                test_type: category,
                difficulty,
                num_questions: numQuestions,
                duration_minutes: duration,
                question_types: questionTypes
            });

            if (configResponse.data.success) {
                this.app.showInfo('Generating AI questions... This may take a few moments.');
                
                // Start the test
                const startResponse = await axios.post('/api/tests/start', {
                    config_id: configResponse.data.config_id
                });

                if (startResponse.data.success) {
                    this.hideTestConfigModal();
                    this.startTest(startResponse.data);
                    this.app.showSuccess('Test started successfully!');
                } else {
                    this.app.showError(startResponse.data.message || 'Failed to start test');
                }
            } else {
                this.app.showError(configResponse.data.message || 'Failed to create test configuration');
            }
        } catch (error) {
            console.error('Error starting test:', error);
            this.app.showError(error.response?.data?.message || 'Failed to start test');
        }
    }

    startTest(testData) {
        this.currentAttempt = testData.attempt_id;
        this.questions = testData.questions;
        this.currentQuestionIndex = 0;
        this.answers = new Map();
        this.questionTimes = new Map();
        this.startTime = Date.now();
        this.bookmarkedQuestions = new Set();
        
        // Initialize question times
        this.questions.forEach(q => this.questionTimes.set(q.id, 0));
        
        // Set up timer
        this.setupTimer(testData.config.duration_minutes);
        
        // Show test interface
        document.getElementById('testTakingModal').classList.remove('hidden');
        
        // Hide dashboard
        document.getElementById('dashboardSection').style.display = 'none';
        
        // Setup test UI
        this.setupTestUI(testData);
        this.displayCurrentQuestion();
        this.updateNavigator();
        
        // Start question timer
        this.questionStartTime = Date.now();
        this.startQuestionTimer();
    }

    setupTimer(durationMinutes) {
        const endTime = Date.now() + (durationMinutes * 60 * 1000);
        
        this.timer = setInterval(() => {
            const remaining = endTime - Date.now();
            
            if (remaining <= 0) {
                this.submitTest(true); // Auto-submit when time is up
                return;
            }
            
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            document.getElementById('timeRemaining').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Warning when 5 minutes left
            if (remaining <= 5 * 60 * 1000) {
                document.getElementById('timeRemaining').className = 'text-2xl font-bold text-red-500';
            }
        }, 1000);
    }

    startQuestionTimer() {
        if (this.questionTimer) clearInterval(this.questionTimer);
        
        this.questionTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.questionStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('questionTime').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    setupTestUI(testData) {
        document.getElementById('testTitle').textContent = 
            `${testData.config.test_type} Test - ${testData.config.difficulty}`;
        document.getElementById('testProgress').textContent = 
            `Question 1 of ${this.questions.length}`;
        
        // Setup question navigator
        this.setupQuestionNavigator();
    }

    setupQuestionNavigator() {
        const navigator = document.getElementById('questionNavigator');
        navigator.innerHTML = '';
        
        this.questions.forEach((question, index) => {
            const button = document.createElement('button');
            button.className = 'w-8 h-8 rounded bg-gray-300 text-sm font-medium hover:bg-gray-400 transition-colors';
            button.textContent = index + 1;
            button.onclick = () => this.goToQuestion(index);
            navigator.appendChild(button);
        });
    }

    displayCurrentQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        if (!question) return;
        
        document.getElementById('questionNumber').textContent = this.currentQuestionIndex + 1;
        document.getElementById('questionType').textContent = this.getQuestionTypeLabel(question.question_type);
        document.getElementById('questionText').textContent = question.question_text;
        
        // Update progress
        document.getElementById('testProgress').textContent = 
            `Question ${this.currentQuestionIndex + 1} of ${this.questions.length}`;
        
        // Display options based on question type
        this.displayQuestionOptions(question);
        
        // Update navigation buttons
        document.getElementById('prevQuestion').disabled = this.currentQuestionIndex === 0;
        document.getElementById('nextQuestion').textContent = 
            this.currentQuestionIndex === this.questions.length - 1 ? 'Finish' : 'Next';
        
        // Update bookmark status
        const bookmarkBtn = document.getElementById('bookmarkQuestion');
        if (this.bookmarkedQuestions.has(question.id)) {
            bookmarkBtn.innerHTML = '<i class="fas fa-bookmark text-yellow-500"></i>';
        } else {
            bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i>';
        }
        
        // Reset question timer
        this.questionStartTime = Date.now();
    }

    displayQuestionOptions(question) {
        const optionsContainer = document.getElementById('questionOptions');
        optionsContainer.innerHTML = '';
        
        const savedAnswer = this.answers.get(question.id);
        
        if (question.question_type === 'MCQ') {
            const options = question.options;
            options.forEach((option, index) => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer';
                
                const letter = String.fromCharCode(65 + index); // A, B, C, D
                const isSelected = savedAnswer === letter;
                
                optionDiv.innerHTML = `
                    <input type="radio" name="answer" value="${letter}" id="option${letter}" 
                           class="mr-3" ${isSelected ? 'checked' : ''}>
                    <label for="option${letter}" class="flex-1 cursor-pointer">
                        <span class="font-medium mr-2">${letter}.</span>${option.substring(option.indexOf('.') + 1).trim()}
                    </label>
                `;
                
                optionDiv.onclick = () => {
                    document.getElementById(`option${letter}`).checked = true;
                };
                
                optionsContainer.appendChild(optionDiv);
            });
        } else if (question.question_type === 'TrueFalse') {
            const options = ['True', 'False'];
            options.forEach(option => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer';
                
                const isSelected = savedAnswer === option;
                
                optionDiv.innerHTML = `
                    <input type="radio" name="answer" value="${option}" id="option${option}" 
                           class="mr-3" ${isSelected ? 'checked' : ''}>
                    <label for="option${option}" class="flex-1 cursor-pointer font-medium">
                        ${option}
                    </label>
                `;
                
                optionDiv.onclick = () => {
                    document.getElementById(`option${option}`).checked = true;
                };
                
                optionsContainer.appendChild(optionDiv);
            });
        } else if (question.question_type === 'ShortAnswer') {
            const textArea = document.createElement('textarea');
            textArea.name = 'answer';
            textArea.className = 'w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent';
            textArea.rows = 4;
            textArea.placeholder = 'Enter your answer here...';
            textArea.value = savedAnswer || '';
            
            optionsContainer.appendChild(textArea);
        }
    }

    getQuestionTypeLabel(type) {
        const labels = {
            'MCQ': 'Multiple Choice',
            'TrueFalse': 'True/False',
            'ShortAnswer': 'Short Answer'
        };
        return labels[type] || type;
    }

    saveCurrentAnswer() {
        const question = this.questions[this.currentQuestionIndex];
        let answer = '';
        
        if (question.question_type === 'ShortAnswer') {
            answer = document.querySelector('textarea[name="answer"]').value.trim();
        } else {
            const selectedOption = document.querySelector('input[name="answer"]:checked');
            answer = selectedOption ? selectedOption.value : '';
        }
        
        if (answer) {
            this.answers.set(question.id, answer);
            
            // Update question time
            const timeSpent = Math.floor((Date.now() - this.questionStartTime) / 1000);
            this.questionTimes.set(question.id, this.questionTimes.get(question.id) + timeSpent);
            
            // Submit answer to backend
            this.submitAnswer(question.id, answer, this.questionTimes.get(question.id));
            
            this.updateNavigator();
            this.app.showSuccess('Answer saved');
        } else {
            this.app.showError('Please select or enter an answer');
        }
    }

    async submitAnswer(questionId, userAnswer, timeSpent) {
        try {
            await axios.post('/api/tests/answer', {
                question_id: questionId,
                user_answer: userAnswer,
                time_spent_seconds: timeSpent
            });
        } catch (error) {
            console.error('Error submitting answer:', error);
        }
    }

    clearCurrentAnswer() {
        const question = this.questions[this.currentQuestionIndex];
        this.answers.delete(question.id);
        
        // Clear form inputs
        const radioInputs = document.querySelectorAll('input[name="answer"]');
        radioInputs.forEach(input => input.checked = false);
        
        const textArea = document.querySelector('textarea[name="answer"]');
        if (textArea) textArea.value = '';
        
        this.updateNavigator();
        this.app.showInfo('Answer cleared');
    }

    toggleBookmark() {
        const question = this.questions[this.currentQuestionIndex];
        
        if (this.bookmarkedQuestions.has(question.id)) {
            this.bookmarkedQuestions.delete(question.id);
        } else {
            this.bookmarkedQuestions.add(question.id);
        }
        
        this.displayCurrentQuestion();
        this.updateNavigator();
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.saveQuestionTime();
            this.currentQuestionIndex--;
            this.displayCurrentQuestion();
            this.questionStartTime = Date.now();
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.saveQuestionTime();
            this.currentQuestionIndex++;
            this.displayCurrentQuestion();
            this.questionStartTime = Date.now();
        } else {
            // Last question - show submit confirmation
            this.confirmSubmitTest();
        }
    }

    goToQuestion(index) {
        if (index >= 0 && index < this.questions.length) {
            this.saveQuestionTime();
            this.currentQuestionIndex = index;
            this.displayCurrentQuestion();
            this.questionStartTime = Date.now();
        }
    }

    saveQuestionTime() {
        const question = this.questions[this.currentQuestionIndex];
        const timeSpent = Math.floor((Date.now() - this.questionStartTime) / 1000);
        this.questionTimes.set(question.id, this.questionTimes.get(question.id) + timeSpent);
    }

    updateNavigator() {
        const navigator = document.getElementById('questionNavigator');
        const buttons = navigator.children;
        
        let answeredCount = 0;
        
        this.questions.forEach((question, index) => {
            const button = buttons[index];
            const isAnswered = this.answers.has(question.id);
            const isBookmarked = this.bookmarkedQuestions.has(question.id);
            
            if (isAnswered) {
                button.className = 'w-8 h-8 rounded bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors';
                answeredCount++;
            } else if (isBookmarked) {
                button.className = 'w-8 h-8 rounded bg-yellow-500 text-white text-sm font-medium hover:bg-yellow-600 transition-colors';
            } else {
                button.className = 'w-8 h-8 rounded bg-gray-300 text-sm font-medium hover:bg-gray-400 transition-colors';
            }
            
            if (index === this.currentQuestionIndex) {
                button.style.border = '2px solid #3B82F6';
            } else {
                button.style.border = 'none';
            }
        });
        
        // Update stats
        document.getElementById('answeredCount').textContent = answeredCount;
        document.getElementById('remainingCount').textContent = this.questions.length - answeredCount;
        document.getElementById('bookmarkedCount').textContent = this.bookmarkedQuestions.size;
        document.getElementById('progressText').textContent = `${answeredCount} of ${this.questions.length} answered`;
        
        // Update progress bar
        const progressPercent = (answeredCount / this.questions.length) * 100;
        document.getElementById('progressBar').style.width = `${progressPercent}%`;
    }

    pauseTest() {
        if (this.timer) {
            clearInterval(this.timer);
            clearInterval(this.questionTimer);
            this.app.showInfo('Test paused. Click resume to continue.');
            
            document.getElementById('pauseTest').innerHTML = '<i class="fas fa-play mr-1"></i>Resume';
            document.getElementById('pauseTest').onclick = () => this.resumeTest();
        }
    }

    resumeTest() {
        // Restart timers (this is simplified - in production, you'd want to track pause time)
        this.questionStartTime = Date.now();
        this.startQuestionTimer();
        
        document.getElementById('pauseTest').innerHTML = '<i class="fas fa-pause mr-1"></i>Pause';
        document.getElementById('pauseTest').onclick = () => this.pauseTest();
        
        this.app.showSuccess('Test resumed');
    }

    confirmSubmitTest() {
        const unanswered = this.questions.length - this.answers.size;
        let message = 'Are you sure you want to submit your test?';
        
        if (unanswered > 0) {
            message += `\n\nYou have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}.`;
        }
        
        if (confirm(message)) {
            this.submitTest();
        }
    }

    async submitTest(autoSubmit = false) {
        try {
            this.saveQuestionTime(); // Save time for current question
            
            if (this.timer) clearInterval(this.timer);
            if (this.questionTimer) clearInterval(this.questionTimer);
            
            if (autoSubmit) {
                this.app.showInfo('Time is up! Submitting your test...');
            } else {
                this.app.showInfo('Submitting your test...');
            }
            
            const response = await axios.post(`/api/tests/complete/${this.currentAttempt}`);
            
            if (response.data.success) {
                this.hideTestInterface();
                this.app.showResultsModal(response.data.results);
                this.app.showSuccess('Test submitted successfully!');
            } else {
                this.app.showError(response.data.message || 'Failed to submit test');
            }
        } catch (error) {
            console.error('Error submitting test:', error);
            this.app.showError('Failed to submit test');
        }
    }

    hideTestInterface() {
        document.getElementById('testTakingModal').classList.add('hidden');
        document.getElementById('dashboardSection').style.display = 'block';
        
        // Reset state
        this.currentAttempt = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.answers = new Map();
        this.questionTimes = new Map();
        this.bookmarkedQuestions = new Set();
        
        if (this.timer) clearInterval(this.timer);
        if (this.questionTimer) clearInterval(this.questionTimer);
    }

    showReviewMode() {
        // TODO: Implement review mode functionality
        this.app.showInfo('Review mode feature coming soon!');
    }
}

// Make TestInterface available globally
window.TestInterface = TestInterface;