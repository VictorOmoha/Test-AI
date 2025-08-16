// Results Dashboard Module for AI Test Application
class ResultsDashboard {
    constructor(testApp) {
        this.app = testApp;
        this.init();
    }

    init() {
        this.createResultsModal();
        this.setupEventListeners();
    }

    createResultsModal() {
        const resultsModal = document.createElement('div');
        resultsModal.id = 'resultsModal';
        resultsModal.className = 'fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50';
        resultsModal.innerHTML = `
            <div class="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-screen overflow-y-auto">
                <!-- Results Header -->
                <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-lg">
                    <div class="flex justify-between items-start">
                        <div>
                            <h2 class="text-3xl font-bold mb-2">Test Results</h2>
                            <p class="text-blue-100" id="testResultsSubtitle">Your performance summary</p>
                        </div>
                        <button id="closeResultsModal" class="text-white hover:text-gray-200">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                </div>

                <!-- Score Overview -->
                <div class="p-6 border-b">
                    <div class="grid md:grid-cols-4 gap-6">
                        <div class="text-center">
                            <div class="relative w-32 h-32 mx-auto mb-4">
                                <canvas id="scoreChart" width="128" height="128"></canvas>
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <div class="text-center">
                                        <div class="text-3xl font-bold" id="scorePercentage">0%</div>
                                        <div class="text-sm text-gray-600">Score</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="space-y-4">
                            <div class="text-center p-4 bg-green-50 rounded-lg">
                                <div class="text-2xl font-bold text-green-600" id="correctAnswers">0</div>
                                <div class="text-sm text-gray-600">Correct Answers</div>
                            </div>
                            <div class="text-center p-4 bg-red-50 rounded-lg">
                                <div class="text-2xl font-bold text-red-600" id="incorrectAnswers">0</div>
                                <div class="text-sm text-gray-600">Incorrect Answers</div>
                            </div>
                        </div>
                        
                        <div class="space-y-4">
                            <div class="text-center p-4 bg-blue-50 rounded-lg">
                                <div class="text-2xl font-bold text-blue-600" id="totalQuestions">0</div>
                                <div class="text-sm text-gray-600">Total Questions</div>
                            </div>
                            <div class="text-center p-4 bg-purple-50 rounded-lg">
                                <div class="text-2xl font-bold text-purple-600" id="testDuration">0:00</div>
                                <div class="text-sm text-gray-600">Time Taken</div>
                            </div>
                        </div>
                        
                        <div class="space-y-4">
                            <div class="text-center p-4 bg-yellow-50 rounded-lg">
                                <div class="text-2xl font-bold text-yellow-600" id="avgTimePerQuestion">0:00</div>
                                <div class="text-sm text-gray-600">Avg per Question</div>
                            </div>
                            <div class="text-center p-4 bg-gray-50 rounded-lg">
                                <div class="text-2xl font-bold text-gray-600" id="testGrade">-</div>
                                <div class="text-sm text-gray-600">Grade</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Performance Analytics -->
                <div class="p-6">
                    <h3 class="text-xl font-semibold mb-4">Performance Analytics</h3>
                    
                    <div class="grid md:grid-cols-2 gap-6 mb-6">
                        <!-- Question Type Performance -->
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h4 class="font-semibold mb-3">Performance by Question Type</h4>
                            <canvas id="questionTypeChart" width="400" height="200"></canvas>
                        </div>
                        
                        <!-- Time Analysis -->
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h4 class="font-semibold mb-3">Time Analysis</h4>
                            <div class="space-y-3" id="timeAnalysis">
                                <!-- Time analysis content will be populated here -->
                            </div>
                        </div>
                    </div>

                    <!-- Question Review -->
                    <div class="bg-gray-50 p-4 rounded-lg mb-6">
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="font-semibold">Question-by-Question Review</h4>
                            <div class="space-x-2">
                                <button id="showAllQuestions" class="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">
                                    All
                                </button>
                                <button id="showCorrectQuestions" class="px-3 py-1 bg-green-200 text-green-700 rounded text-sm hover:bg-green-300">
                                    Correct
                                </button>
                                <button id="showIncorrectQuestions" class="px-3 py-1 bg-red-200 text-red-700 rounded text-sm hover:bg-red-300">
                                    Incorrect
                                </button>
                            </div>
                        </div>
                        <div id="questionReview" class="space-y-4 max-h-96 overflow-y-auto">
                            <!-- Questions will be populated here -->
                        </div>
                    </div>

                    <!-- AI Recommendations -->
                    <div class="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg mb-6">
                        <h4 class="font-semibold mb-3 flex items-center">
                            <i class="fas fa-robot text-purple-600 mr-2"></i>
                            AI Study Recommendations
                        </h4>
                        <div id="aiRecommendations" class="space-y-2">
                            <div class="flex items-center justify-center py-4">
                                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-2"></div>
                                <span class="text-gray-600">Generating personalized recommendations...</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="p-6 bg-gray-50 rounded-b-lg">
                    <div class="flex justify-between items-center">
                        <div class="space-x-3">
                            <button id="retakeTest" class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                <i class="fas fa-redo mr-2"></i>Retake Test
                            </button>
                            <button id="newTest" class="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors">
                                <i class="fas fa-plus mr-2"></i>New Test
                            </button>
                        </div>
                        
                        <div class="space-x-3">
                            <button id="shareResults" class="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors">
                                <i class="fas fa-share mr-2"></i>Share
                            </button>
                            <button id="exportResults" class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                                <i class="fas fa-download mr-2"></i>Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(resultsModal);
    }

    setupEventListeners() {
        document.getElementById('closeResultsModal').addEventListener('click', () => this.hideResultsModal());
        document.getElementById('retakeTest').addEventListener('click', () => this.retakeTest());
        document.getElementById('newTest').addEventListener('click', () => this.startNewTest());
        document.getElementById('shareResults').addEventListener('click', () => this.shareResults());
        document.getElementById('exportResults').addEventListener('click', () => this.showExportOptions());
        
        // Question filter buttons
        document.getElementById('showAllQuestions').addEventListener('click', () => this.filterQuestions('all'));
        document.getElementById('showCorrectQuestions').addEventListener('click', () => this.filterQuestions('correct'));
        document.getElementById('showIncorrectQuestions').addEventListener('click', () => this.filterQuestions('incorrect'));
    }

    async showResults(resultsData) {
        this.currentResults = resultsData;
        
        // Show modal
        document.getElementById('resultsModal').classList.remove('hidden');
        document.getElementById('resultsModal').classList.add('flex');
        
        // Populate basic information
        this.populateBasicStats(resultsData);
        
        // Create visualizations
        this.createScoreChart(resultsData.attempt.score);
        this.createQuestionTypeChart(resultsData.performance_analytics);
        
        // Populate detailed sections
        this.populateTimeAnalysis(resultsData);
        this.populateQuestionReview(resultsData.questions);
        
        // Generate AI recommendations
        this.generateAIRecommendations(resultsData);
        
        // Update subtitle
        document.getElementById('testResultsSubtitle').textContent = 
            `${resultsData.config.test_type} - ${resultsData.config.difficulty} Level`;
    }

    populateBasicStats(resultsData) {
        const attempt = resultsData.attempt;
        const analytics = resultsData.performance_analytics;
        
        // Basic stats
        document.getElementById('scorePercentage').textContent = `${Math.round(attempt.score)}%`;
        document.getElementById('correctAnswers').textContent = attempt.correct_answers;
        document.getElementById('incorrectAnswers').textContent = attempt.total_questions - attempt.correct_answers;
        document.getElementById('totalQuestions').textContent = attempt.total_questions;
        
        // Time information
        const durationMinutes = Math.floor(attempt.duration_seconds / 60);
        const durationSeconds = attempt.duration_seconds % 60;
        document.getElementById('testDuration').textContent = 
            `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
        
        const avgMinutes = Math.floor(analytics.average_time_per_question / 60);
        const avgSeconds = Math.round(analytics.average_time_per_question % 60);
        document.getElementById('avgTimePerQuestion').textContent = 
            `${avgMinutes}:${avgSeconds.toString().padStart(2, '0')}`;
        
        // Grade calculation
        const grade = this.calculateGrade(attempt.score);
        document.getElementById('testGrade').textContent = grade;
    }

    calculateGrade(score) {
        if (score >= 90) return 'A+';
        if (score >= 85) return 'A';
        if (score >= 80) return 'A-';
        if (score >= 75) return 'B+';
        if (score >= 70) return 'B';
        if (score >= 65) return 'B-';
        if (score >= 60) return 'C+';
        if (score >= 55) return 'C';
        if (score >= 50) return 'C-';
        return 'F';
    }

    createScoreChart(score) {
        const canvas = document.getElementById('scoreChart');
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 50;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Background circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 8;
        ctx.stroke();
        
        // Score arc
        const scoreAngle = (score / 100) * 2 * Math.PI - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, scoreAngle);
        
        // Color based on score
        if (score >= 80) ctx.strokeStyle = '#10B981'; // Green
        else if (score >= 60) ctx.strokeStyle = '#F59E0B'; // Yellow
        else ctx.strokeStyle = '#EF4444'; // Red
        
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    createQuestionTypeChart(analytics) {
        const canvas = document.getElementById('questionTypeChart');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const types = Object.keys(analytics.total_by_type);
        if (types.length === 0) return;
        
        const barWidth = canvas.width / (types.length * 2);
        const maxHeight = canvas.height - 60;
        
        types.forEach((type, index) => {
            const correct = analytics.correct_by_type[type] || 0;
            const total = analytics.total_by_type[type];
            const percentage = (correct / total) * 100;
            
            const x = (index + 0.5) * (canvas.width / types.length);
            const barHeight = (percentage / 100) * maxHeight;
            
            // Bar background
            ctx.fillStyle = '#E5E7EB';
            ctx.fillRect(x - barWidth/2, canvas.height - maxHeight - 40, barWidth, maxHeight);
            
            // Bar fill
            ctx.fillStyle = percentage >= 70 ? '#10B981' : percentage >= 50 ? '#F59E0B' : '#EF4444';
            ctx.fillRect(x - barWidth/2, canvas.height - barHeight - 40, barWidth, barHeight);
            
            // Labels
            ctx.fillStyle = '#374151';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(type, x, canvas.height - 25);
            ctx.fillText(`${Math.round(percentage)}%`, x, canvas.height - 10);
            ctx.fillText(`${correct}/${total}`, x, canvas.height - barHeight - 45);
        });
    }

    populateTimeAnalysis(resultsData) {
        const analytics = resultsData.performance_analytics;
        const container = document.getElementById('timeAnalysis');
        
        const fastestMinutes = Math.floor(analytics.fastest_question / 60);
        const fastestSeconds = analytics.fastest_question % 60;
        const slowestMinutes = Math.floor(analytics.slowest_question / 60);
        const slowestSeconds = analytics.slowest_question % 60;
        
        container.innerHTML = `
            <div class="flex justify-between">
                <span class="text-gray-600">Fastest Question:</span>
                <span class="font-medium">${fastestMinutes}:${fastestSeconds.toString().padStart(2, '0')}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Slowest Question:</span>
                <span class="font-medium">${slowestMinutes}:${slowestSeconds.toString().padStart(2, '0')}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Total Time:</span>
                <span class="font-medium">${Math.floor(resultsData.attempt.duration_seconds / 60)}:${(resultsData.attempt.duration_seconds % 60).toString().padStart(2, '0')}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Efficiency:</span>
                <span class="font-medium ${analytics.average_time_per_question < 60 ? 'text-green-600' : analytics.average_time_per_question < 120 ? 'text-yellow-600' : 'text-red-600'}">
                    ${analytics.average_time_per_question < 60 ? 'Excellent' : analytics.average_time_per_question < 120 ? 'Good' : 'Needs Improvement'}
                </span>
            </div>
        `;
    }

    populateQuestionReview(questions) {
        this.allQuestions = questions;
        this.filterQuestions('all');
    }

    filterQuestions(filter) {
        const container = document.getElementById('questionReview');
        let filteredQuestions = this.allQuestions;
        
        if (filter === 'correct') {
            filteredQuestions = this.allQuestions.filter(q => q.is_correct);
        } else if (filter === 'incorrect') {
            filteredQuestions = this.allQuestions.filter(q => !q.is_correct);
        }
        
        // Update button styles
        document.querySelectorAll('#questionReview').forEach(btn => {
            btn.className = btn.className.replace(' bg-blue-500 text-white', ' bg-gray-200 text-gray-700');
        });
        
        const buttons = {
            'all': 'showAllQuestions',
            'correct': 'showCorrectQuestions',
            'incorrect': 'showIncorrectQuestions'
        };
        
        if (buttons[filter]) {
            const btn = document.getElementById(buttons[filter]);
            btn.className = btn.className.replace('bg-gray-200 text-gray-700', 'bg-blue-500 text-white');
        }
        
        // Populate questions
        container.innerHTML = '';
        
        filteredQuestions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = `p-4 border rounded-lg ${question.is_correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`;
            
            const options = question.options ? JSON.parse(question.options) : null;
            const timeMinutes = Math.floor(question.time_spent_seconds / 60);
            const timeSeconds = question.time_spent_seconds % 60;
            
            questionDiv.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center space-x-2">
                        <span class="w-6 h-6 rounded-full ${question.is_correct ? 'bg-green-500' : 'bg-red-500'} text-white text-sm flex items-center justify-center">
                            ${question.question_number}
                        </span>
                        <span class="text-sm text-gray-600">${question.question_type}</span>
                        <span class="text-sm text-gray-500">(${timeMinutes}:${timeSeconds.toString().padStart(2, '0')})</span>
                    </div>
                    <i class="fas fa-${question.is_correct ? 'check' : 'times'} ${question.is_correct ? 'text-green-500' : 'text-red-500'}"></i>
                </div>
                
                <div class="mb-3">
                    <p class="font-medium text-gray-800">${question.question_text}</p>
                </div>
                
                ${options ? `
                    <div class="mb-3 space-y-1">
                        ${options.map(option => `
                            <div class="text-sm ${option.startsWith(question.correct_answer) ? 'text-green-600 font-medium' : 'text-gray-600'}">
                                ${option}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="font-medium text-gray-700">Your Answer: </span>
                        <span class="${question.is_correct ? 'text-green-600' : 'text-red-600'}">
                            ${question.user_answer || 'Not answered'}
                        </span>
                    </div>
                    <div>
                        <span class="font-medium text-gray-700">Correct Answer: </span>
                        <span class="text-green-600">${question.correct_answer}</span>
                    </div>
                </div>
                
                ${question.ai_explanation ? `
                    <div class="mt-3 p-3 bg-white rounded border-l-4 border-blue-500">
                        <p class="text-sm text-gray-700">
                            <i class="fas fa-lightbulb text-blue-500 mr-1"></i>
                            ${question.ai_explanation}
                        </p>
                    </div>
                ` : ''}
            `;
            
            container.appendChild(questionDiv);
        });
        
        if (filteredQuestions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-search text-2xl mb-2"></i>
                    <p>No questions found for this filter.</p>
                </div>
            `;
        }
    }

    async generateAIRecommendations(resultsData) {
        try {
            // Analyze weak areas
            const weakAreas = this.analyzeWeakAreas(resultsData);
            
            // If no OpenAI API key is available, show generic recommendations
            if (!weakAreas.length) {
                this.showGenericRecommendations(resultsData);
                return;
            }
            
            // Generate AI recommendations (this would call the backend AI service)
            const response = await axios.post('/api/tests/recommendations', {
                attempt_id: resultsData.attempt.id,
                weak_areas: weakAreas,
                test_type: resultsData.config.test_type,
                score: resultsData.attempt.score
            });
            
            if (response.data.success && response.data.recommendations) {
                this.displayAIRecommendations(response.data.recommendations);
            } else {
                this.showGenericRecommendations(resultsData);
            }
        } catch (error) {
            console.error('Error generating AI recommendations:', error);
            this.showGenericRecommendations(resultsData);
        }
    }

    analyzeWeakAreas(resultsData) {
        const weakAreas = [];
        const analytics = resultsData.performance_analytics;
        
        // Analyze by question type
        Object.keys(analytics.total_by_type).forEach(type => {
            const correct = analytics.correct_by_type[type] || 0;
            const total = analytics.total_by_type[type];
            const percentage = (correct / total) * 100;
            
            if (percentage < 70) {
                weakAreas.push(`${type} questions (${Math.round(percentage)}% accuracy)`);
            }
        });
        
        // Analyze time management
        if (analytics.average_time_per_question > 120) {
            weakAreas.push('Time management');
        }
        
        return weakAreas;
    }

    showGenericRecommendations(resultsData) {
        const score = resultsData.attempt.score;
        const testType = resultsData.config.test_type;
        
        let recommendations = [];
        
        if (score >= 80) {
            recommendations = [
                `Excellent work on ${testType}! You've demonstrated strong mastery.`,
                `Consider taking advanced-level tests to challenge yourself further.`,
                `Share your knowledge by helping others or teaching the subject.`,
                `Explore related topics to broaden your understanding.`
            ];
        } else if (score >= 60) {
            recommendations = [
                `Good foundation in ${testType}. Focus on strengthening weak areas.`,
                `Review the questions you got wrong and understand the explanations.`,
                `Practice more questions in areas where you scored below 70%.`,
                `Consider studying the fundamental concepts again.`,
                `Take additional practice tests to improve your confidence.`
            ];
        } else {
            recommendations = [
                `${testType} needs significant improvement. Don't get discouraged!`,
                `Start with the basics - review fundamental concepts thoroughly.`,
                `Practice regularly with easier questions before attempting harder ones.`,
                `Consider seeking additional resources or tutoring help.`,
                `Focus on understanding concepts rather than memorizing answers.`,
                `Set up a study schedule and practice consistently.`
            ];
        }
        
        this.displayAIRecommendations(recommendations);
    }

    displayAIRecommendations(recommendations) {
        const container = document.getElementById('aiRecommendations');
        container.innerHTML = '';
        
        recommendations.forEach((recommendation, index) => {
            const item = document.createElement('div');
            item.className = 'flex items-start space-x-3 p-3 bg-white rounded-lg';
            item.innerHTML = `
                <div class="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    ${index + 1}
                </div>
                <p class="text-gray-700 text-sm">${recommendation}</p>
            `;
            container.appendChild(item);
        });
    }

    hideResultsModal() {
        document.getElementById('resultsModal').classList.add('hidden');
        document.getElementById('resultsModal').classList.remove('flex');
    }

    retakeTest() {
        // Hide results modal and start test configuration with same settings
        this.hideResultsModal();
        
        if (this.currentResults && this.currentResults.config) {
            const config = this.currentResults.config;
            
            // Pre-fill the test configuration modal with previous settings
            document.getElementById('testCategory').value = config.test_type;
            document.getElementById('testDifficulty').value = config.difficulty;
            document.getElementById('testQuestions').value = config.num_questions;
            document.getElementById('testDuration').value = config.duration_minutes;
            
            // Update display values
            document.getElementById('questionsValue').textContent = config.num_questions;
            document.getElementById('durationValue').textContent = config.duration_minutes;
            
            // Set question types
            const questionTypes = JSON.parse(config.question_types);
            document.getElementById('typeMCQ').checked = questionTypes.includes('MCQ');
            document.getElementById('typeTrueFalse').checked = questionTypes.includes('TrueFalse');
            document.getElementById('typeShortAnswer').checked = questionTypes.includes('ShortAnswer');
        }
        
        this.app.testInterface.showTestConfigModal();
    }

    startNewTest() {
        this.hideResultsModal();
        this.app.testInterface.showTestConfigModal();
    }

    shareResults() {
        if (!this.currentResults) return;
        
        const shareData = {
            title: 'AI Test Results',
            text: `I scored ${Math.round(this.currentResults.attempt.score)}% on a ${this.currentResults.config.test_type} test!`,
            url: window.location.href
        };
        
        if (navigator.share) {
            navigator.share(shareData).catch(console.error);
        } else {
            // Fallback to clipboard
            const shareText = `${shareData.text}\n${shareData.url}`;
            navigator.clipboard.writeText(shareText).then(() => {
                this.app.showSuccess('Results copied to clipboard!');
            }).catch(() => {
                this.app.showError('Failed to copy to clipboard');
            });
        }
    }

    showExportOptions() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 class="text-lg font-semibold mb-4">Export Results</h3>
                <div class="space-y-3">
                    <button onclick="this.exportToPDF()" class="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center">
                        <i class="fas fa-file-pdf text-red-500 mr-3"></i>
                        Export as PDF
                    </button>
                    <button onclick="this.exportToCSV()" class="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center">
                        <i class="fas fa-file-csv text-green-500 mr-3"></i>
                        Export as CSV
                    </button>
                    <button onclick="this.exportToJSON()" class="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center">
                        <i class="fas fa-file-code text-blue-500 mr-3"></i>
                        Export as JSON
                    </button>
                </div>
                <div class="mt-6 flex justify-end">
                    <button onclick="document.body.removeChild(this.closest('.fixed'))" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        // Bind export methods to buttons
        modal.querySelector('button[onclick="this.exportToPDF()"]').onclick = () => {
            this.exportToPDF();
            document.body.removeChild(modal);
        };
        modal.querySelector('button[onclick="this.exportToCSV()"]').onclick = () => {
            this.exportToCSV();
            document.body.removeChild(modal);
        };
        modal.querySelector('button[onclick="this.exportToJSON()"]').onclick = () => {
            this.exportToJSON();
            document.body.removeChild(modal);
        };
        
        document.body.appendChild(modal);
    }

    exportToPDF() {
        // This would typically use a library like jsPDF
        this.app.showInfo('PDF export feature coming soon!');
    }

    exportToCSV() {
        if (!this.currentResults) return;
        
        const questions = this.currentResults.questions;
        const csvContent = [
            ['Question #', 'Type', 'Question', 'Your Answer', 'Correct Answer', 'Correct', 'Time (seconds)', 'Explanation'],
            ...questions.map(q => [
                q.question_number,
                q.question_type,
                q.question_text.replace(/"/g, '""'),
                q.user_answer || '',
                q.correct_answer,
                q.is_correct ? 'Yes' : 'No',
                q.time_spent_seconds,
                (q.ai_explanation || '').replace(/"/g, '""')
            ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        
        this.downloadFile(csvContent, 'test-results.csv', 'text/csv');
    }

    exportToJSON() {
        if (!this.currentResults) return;
        
        const jsonContent = JSON.stringify(this.currentResults, null, 2);
        this.downloadFile(jsonContent, 'test-results.json', 'application/json');
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.app.showSuccess(`${filename} downloaded successfully!`);
    }
}

// Make ResultsDashboard available globally
window.ResultsDashboard = ResultsDashboard;