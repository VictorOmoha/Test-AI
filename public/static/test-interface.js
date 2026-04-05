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
        // Create test configuration modal (Keep this somewhat standard but slightly cleaner)
        const testConfigModal = document.createElement('div');
        testConfigModal.id = 'testConfigModal';
        testConfigModal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm hidden items-center justify-center z-50';
        testConfigModal.innerHTML = `
            <div class="bg-white rounded-3xl p-8 w-full max-w-2xl mx-4 shadow-2xl">
                <div class="flex justify-between items-center mb-8">
                    <h2 class="text-3xl font-black text-gray-900">Configure Test</h2>
                    <button id="closeTestConfigModal" class="text-gray-400 hover:text-gray-600 transition-colors">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
                
                <form id="testConfigForm" class="space-y-6">
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Category</label>
                            <select id="testCategoryModal" class="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" required>
                                <option value="">Select a category...</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Difficulty</label>
                            <select id="testDifficulty" class="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" required>
                                <option value="Easy">Easy</option>
                                <option value="Medium" selected>Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Questions: <span id="questionsValue" class="text-primary">20</span></label>
                            <input type="range" id="testQuestions" min="10" max="50" value="20" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Duration: <span id="durationValue" class="text-primary">30</span>m</label>
                            <input type="range" id="testDuration" min="5" max="180" value="30" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Question Types</label>
                        <div class="grid grid-cols-3 gap-4">
                            <label class="flex items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer hover:bg-indigo-50 transition-all">
                                <input type="checkbox" id="typeMCQ" value="MCQ" checked class="hidden peer">
                                <div class="peer-checked:text-primary peer-checked:bg-indigo-50 peer-checked:border-primary border border-transparent rounded-xl p-2 text-center w-full transition-all">
                                    <i class="fas fa-list-ul mb-1 text-lg"></i>
                                    <div class="text-xs font-bold">MCQ</div>
                                </div>
                            </label>
                            <label class="flex items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer hover:bg-indigo-50 transition-all">
                                <input type="checkbox" id="typeTrueFalse" value="TrueFalse" class="hidden peer">
                                <div class="peer-checked:text-primary peer-checked:bg-indigo-50 peer-checked:border-primary border border-transparent rounded-xl p-2 text-center w-full transition-all">
                                    <i class="fas fa-check-double mb-1 text-lg"></i>
                                    <div class="text-xs font-bold">T/F</div>
                                </div>
                            </label>
                            <label class="flex items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer hover:bg-indigo-50 transition-all">
                                <input type="checkbox" id="typeShortAnswer" value="ShortAnswer" class="hidden peer">
                                <div class="peer-checked:text-primary peer-checked:bg-indigo-50 peer-checked:border-primary border border-transparent rounded-xl p-2 text-center w-full transition-all">
                                    <i class="fas fa-pen mb-1 text-lg"></i>
                                    <div class="text-xs font-bold">Short</div>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <div class="pt-4">
                        <button type="submit" class="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-[0.98]">
                            <i class="fas fa-wand-magic-sparkles mr-2"></i> Generate AI Test
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(testConfigModal);

        // Create Zen Test Taking Interface
        const testTakingModal = document.createElement('div');
        testTakingModal.id = 'testTakingModal';
        testTakingModal.className = 'fixed inset-0 hidden z-50 test-mode-body overflow-hidden';
        testTakingModal.innerHTML = `
            <div class="test-progress-slim">
                <div id="progressBar" class="test-progress-fill-slim" style="width: 0%"></div>
            </div>

            <div class="test-container relative h-full flex flex-col">
                <!-- Header Info -->
                <div class="flex justify-between items-center mb-12 mt-8">
                    <div class="flex items-center gap-4">
                        <div class="test-timer-pill" id="timeRemaining">30:00</div>
                        <div class="test-timer-pill text-gray-400" id="questionTime">0:00</div>
                    </div>
                    <div class="text-sm font-medium text-gray-400" id="testProgress">Question 1 of 20</div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-500" id="questionNumber">#1</span>
                        <button id="pauseTest" class="text-gray-400 hover:text-white transition-colors"><i class="fas fa-pause"></i></button>
                    </div>
                </div>

                <!-- Question Area -->
                <div id="questionContainer" class="flex-1 flex flex-col justify-center">
                    <div class="test-question-card question-slide-in">
                        <div class="flex justify-between items-start mb-8">
                            <span id="questionType" class="text-xs uppercase tracking-[0.2em] text-indigo-400 font-black">Multiple Choice</span>
                            <button id="bookmarkQuestion" class="text-gray-600 hover:text-yellow-500 transition-colors">
                                <i class="far fa-bookmark text-xl"></i>
                            </button>
                        </div>
                        
                        <h3 id="questionText" class="text-2xl md:text-3xl font-medium leading-relaxed mb-12 text-white">
                            Loading your personalized test...
                        </h3>

                        <div id="questionOptions" class="space-y-4">
                            <!-- Options populated here -->
                        </div>
                    </div>
                </div>

                <!-- Floating Navigation -->
                <div class="test-nav-floating">
                    <button id="prevQuestion" class="text-gray-400 hover:text-white transition-all disabled:opacity-20">
                        <i class="fas fa-chevron-left text-xl"></i>
                    </button>

                    <div id="questionNavigator" class="flex gap-2 px-4">
                        <!-- Nav dots -->
                    </div>

                    <button id="nextQuestion" class="text-indigo-400 hover:text-white transition-all">
                        <i class="fas fa-chevron-right text-xl"></i>
                    </button>

                    <div class="w-[1px] h-6 bg-white/10 mx-2"></div>

                    <button id="submitTest" class="text-rose-500 hover:text-rose-400 transition-colors px-2" title="Finish Test">
                        <i class="fas fa-flag-checkered text-xl"></i>
                    </button>
                </div>

                <!-- Hidden stats for updateNavigator -->
                <div class="hidden">
                    <span id="answeredCount">0</span>
                    <span id="remainingCount">0</span>
                    <span id="bookmarkedCount">0</span>
                    <span id="progressText">0 of 0 answered</span>
                    <span id="testTitle"></span>
                </div>
            </div>
        `;
        document.body.appendChild(testTakingModal);
    }

    setupEventListeners() {
        // Test configuration modal events
        const closeTestConfig = document.getElementById('closeTestConfigModal');
        const cancelTestConfig = document.getElementById('cancelTestConfig');
        const testConfigForm = document.getElementById('testConfigForm');
        
        if (closeTestConfig) closeTestConfig.addEventListener('click', () => this.hideTestConfigModal());
        if (cancelTestConfig) cancelTestConfig.addEventListener('click', () => this.hideTestConfigModal());
        if (testConfigForm) testConfigForm.addEventListener('submit', (e) => this.handleTestConfigSubmit(e));
        
        // Range input updates
        const testQuestions = document.getElementById('testQuestions');
        const testDuration = document.getElementById('testDuration');
        if (testQuestions) testQuestions.addEventListener('input', (e) => {
            const el = document.getElementById('questionsValue');
            if (el) el.textContent = e.target.value;
        });
        if (testDuration) testDuration.addEventListener('input', (e) => {
            const el = document.getElementById('durationValue');
            if (el) el.textContent = e.target.value;
        });

        // Test taking interface events
        const pauseTest = document.getElementById('pauseTest');
        const submitTest = document.getElementById('submitTest');
        const prevQuestion = document.getElementById('prevQuestion');
        const nextQuestion = document.getElementById('nextQuestion');
        const saveAnswer = document.getElementById('saveAnswer');
        const clearAnswer = document.getElementById('clearAnswer');
        const bookmarkQuestion = document.getElementById('bookmarkQuestion');
        const reviewAnswers = document.getElementById('reviewAnswers');
        
        if (pauseTest) pauseTest.addEventListener('click', () => this.pauseTest());
        if (submitTest) submitTest.addEventListener('click', () => this.submitTest());
        if (prevQuestion) prevQuestion.addEventListener('click', () => this.previousQuestion());
        if (nextQuestion) nextQuestion.addEventListener('click', () => this.nextQuestion());
        if (saveAnswer) saveAnswer.addEventListener('click', () => this.saveCurrentAnswer());
        if (clearAnswer) clearAnswer.addEventListener('click', () => this.clearCurrentAnswer());
        if (bookmarkQuestion) bookmarkQuestion.addEventListener('click', () => this.toggleBookmark());
        if (reviewAnswers) reviewAnswers.addEventListener('click', () => this.showReviewMode());
    }

    async showTestConfigModal() {
        try {
            // Load test categories
            const response = await axios.get('/api/tests/categories');
            if (response.data.success) {
                const categorySelect = document.getElementById('testCategoryModal');
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
        
        const category = document.getElementById('testCategoryModal').value;
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
        const takingModal = document.getElementById('testTakingModal');
        const dashboardSection = document.getElementById('dashboardSection');
        if (takingModal) takingModal.classList.remove('hidden');
        if (dashboardSection) dashboardSection.style.display = 'none';
        
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
            const tr = document.getElementById('timeRemaining');
            if (tr) {
                tr.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                // Warning when 5 minutes left
                if (remaining <= 5 * 60 * 1000) {
                    tr.className = 'text-2xl font-bold text-red-500';
                }
            }
        }, 1000);
    }

    startQuestionTimer() {
        if (this.questionTimer) clearInterval(this.questionTimer);
        
        this.questionTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.questionStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            const qt = document.getElementById('questionTime');
            if (qt) qt.textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    setupTestUI(testData) {
        const testTitle = document.getElementById('testTitle');
        const testProgress = document.getElementById('testProgress');
        if (testTitle) testTitle.textContent = 
            `${testData.config.test_type} Test - ${testData.config.difficulty}`;
        if (testProgress) testProgress.textContent = 
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
        
        const qn = document.getElementById('questionNumber');
        if (qn) qn.textContent = this.currentQuestionIndex + 1;
        
        const qt = document.getElementById('questionType');
        if (qt) qt.textContent = this.getQuestionTypeLabel(question.question_type);
        
        const qtxt = document.getElementById('questionText');
        if (qtxt) qtxt.textContent = question.question_text;
        
        // Update progress
        const tp = document.getElementById('testProgress');
        if (tp) tp.textContent = 
            `Question ${this.currentQuestionIndex + 1} of ${this.questions.length}`;
        
        // Display options based on question type
        this.displayQuestionOptions(question);
        
        // Update navigation buttons
        const prevBtn = document.getElementById('prevQuestion');
        const nextBtn = document.getElementById('nextQuestion');
        if (prevBtn) prevBtn.disabled = this.currentQuestionIndex === 0;
        if (nextBtn) nextBtn.textContent = 
            this.currentQuestionIndex === this.questions.length - 1 ? 'Finish' : 'Next';
        
        // Update bookmark status
        const bookmarkBtn = document.getElementById('bookmarkQuestion');
        if (bookmarkBtn) {
            if (this.bookmarkedQuestions.has(question.id)) {
                bookmarkBtn.innerHTML = '<i class="fas fa-bookmark text-yellow-500"></i>';
            } else {
                bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i>';
            }
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
                optionDiv.className = `test-option-card ${savedAnswer === String.fromCharCode(65 + index) ? 'selected' : ''}`;
                
                const letter = String.fromCharCode(65 + index); // A, B, C, D
                const isSelected = savedAnswer === letter;
                
                optionDiv.innerHTML = `
                    <div class="flex items-center w-full">
                        <div class="w-8 h-8 rounded-full border-2 ${isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-gray-500'} flex items-center justify-center mr-4 font-bold transition-all">
                            ${letter}
                        </div>
                        <span class="text-lg">${option.substring(option.indexOf('.') + 1).trim()}</span>
                    </div>
                `;
                
                optionDiv.onclick = () => {
                    // Remove selected class from others
                    Array.from(optionsContainer.children).forEach(child => child.classList.remove('selected'));
                    optionDiv.classList.add('selected');
                    
                    // Set hidden input for compatibility if needed, or just handle via state
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = 'answer';
                    radio.value = letter;
                    radio.checked = true;
                    radio.style.display = 'none';
                    optionsContainer.appendChild(radio);
                    
                    this.tempSelectedAnswer = letter;
                };
                
                optionsContainer.appendChild(optionDiv);
            });
        } else if (question.question_type === 'TrueFalse') {
            const options = ['True', 'False'];
            options.forEach(option => {
                const optionDiv = document.createElement('div');
                optionDiv.className = `test-option-card ${savedAnswer === option ? 'selected' : ''}`;
                
                const isSelected = savedAnswer === option;
                
                optionDiv.innerHTML = `
                    <div class="flex items-center w-full">
                        <div class="w-8 h-8 rounded-full border-2 ${isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-gray-500'} flex items-center justify-center mr-4 font-bold transition-all">
                            ${option.charAt(0)}
                        </div>
                        <span class="text-lg">${option}</span>
                    </div>
                `;
                
                optionDiv.onclick = () => {
                    Array.from(optionsContainer.children).forEach(child => child.classList.remove('selected'));
                    optionDiv.classList.add('selected');
                    this.tempSelectedAnswer = option;
                };
                
                optionsContainer.appendChild(optionDiv);
            });
        } else if (question.question_type === 'ShortAnswer') {
            const textArea = document.createElement('textarea');
            textArea.name = 'answer';
            textArea.className = 'w-full p-6 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-lg text-white resize-none';
            textArea.rows = 5;
            textArea.placeholder = 'Type your answer here...';
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
        if (!navigator) return;
        const buttons = navigator.children;
        
        let answeredCount = 0;
        
        this.questions.forEach((question, index) => {
            const button = buttons[index];
            if (!button) return;
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
        const ac = document.getElementById('answeredCount');
        const rc = document.getElementById('remainingCount');
        const bc = document.getElementById('bookmarkedCount');
        const pt = document.getElementById('progressText');
        const pb = document.getElementById('progressBar');
        if (ac) ac.textContent = answeredCount;
        if (rc) rc.textContent = this.questions.length - answeredCount;
        if (bc) bc.textContent = this.bookmarkedQuestions.size;
        if (pt) pt.textContent = `${answeredCount} of ${this.questions.length} answered`;
        if (pb) pb.style.width = `${answeredCount === 0 ? 0 : (answeredCount / this.questions.length) * 100}%`;
    }

    pauseTest() {
        if (this.timer) {
            clearInterval(this.timer);
            clearInterval(this.questionTimer);
            this.app.showInfo('Test paused. Click resume to continue.');
            
            const pt = document.getElementById('pauseTest');
            if (pt) { pt.innerHTML = '<i class="fas fa-play mr-1"></i>Resume'; pt.onclick = () => this.resumeTest(); }
        }
    }

    resumeTest() {
        // Restart timers (this is simplified - in production, you'd want to track pause time)
        this.questionStartTime = Date.now();
        this.startQuestionTimer();
        
        const pt2 = document.getElementById('pauseTest');
        if (pt2) { pt2.innerHTML = '<i class="fas fa-pause mr-1"></i>Pause'; pt2.onclick = () => this.pauseTest(); }
        
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
        const tm = document.getElementById('testTakingModal');
        const ds = document.getElementById('dashboardSection');
        if (tm) tm.classList.add('hidden');
        if (ds) ds.style.display = 'block';
        
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