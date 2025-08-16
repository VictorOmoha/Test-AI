// Social Features Module for AI Test Application
class SocialFeatures {
    constructor(testApp) {
        this.app = testApp;
        this.init();
    }

    init() {
        this.createSocialModal();
        this.setupEventListeners();
    }

    createSocialModal() {
        const socialModal = document.createElement('div');
        socialModal.id = 'socialModal';
        socialModal.className = 'fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50';
        socialModal.innerHTML = `
            <div class="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-screen overflow-y-auto">
                <!-- Header -->
                <div class="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-lg">
                    <div class="flex justify-between items-center">
                        <div>
                            <h2 class="text-3xl font-bold mb-2">Social Hub</h2>
                            <p class="text-purple-100">Compare your performance with others</p>
                        </div>
                        <button id="closeSocialModal" class="text-white hover:text-gray-200">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                </div>

                <!-- Navigation Tabs -->
                <div class="bg-gray-50 border-b">
                    <div class="flex">
                        <button id="leaderboardTab" class="px-6 py-3 font-medium border-b-2 border-purple-500 text-purple-600 bg-white">
                            <i class="fas fa-trophy mr-2"></i>Leaderboards
                        </button>
                        <button id="achievementsTab" class="px-6 py-3 font-medium text-gray-600 hover:text-gray-800">
                            <i class="fas fa-medal mr-2"></i>Achievements
                        </button>
                        <button id="statsComparisonTab" class="px-6 py-3 font-medium text-gray-600 hover:text-gray-800">
                            <i class="fas fa-chart-bar mr-2"></i>Statistics
                        </button>
                        <button id="challengesTab" class="px-6 py-3 font-medium text-gray-600 hover:text-gray-800">
                            <i class="fas fa-fire mr-2"></i>Challenges
                        </button>
                    </div>
                </div>

                <!-- Content Container -->
                <div class="p-6">
                    <!-- Leaderboard Content -->
                    <div id="leaderboardContent" class="block">
                        <div class="mb-6">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-xl font-semibold">Global Leaderboards</h3>
                                <div class="flex space-x-2">
                                    <select id="leaderboardCategory" class="px-3 py-2 border border-gray-300 rounded-lg">
                                        <option value="all">All Categories</option>
                                        <option value="Mathematics">Mathematics</option>
                                        <option value="Science">Science</option>
                                        <option value="Programming">Programming</option>
                                        <option value="History">History</option>
                                        <option value="English Language">English Language</option>
                                        <option value="General Knowledge">General Knowledge</option>
                                    </select>
                                    <select id="leaderboardPeriod" class="px-3 py-2 border border-gray-300 rounded-lg">
                                        <option value="all">All Time</option>
                                        <option value="month">This Month</option>
                                        <option value="week">This Week</option>
                                        <option value="today">Today</option>
                                    </select>
                                </div>
                            </div>

                            <!-- Top 3 Podium -->
                            <div class="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 mb-6">
                                <h4 class="text-lg font-semibold mb-4 text-center">Top Performers</h4>
                                <div class="flex justify-center items-end space-x-4" id="topThreePodium">
                                    <!-- Podium will be populated here -->
                                </div>
                            </div>

                            <!-- Full Leaderboard -->
                            <div class="bg-white border rounded-lg overflow-hidden">
                                <div class="bg-gray-50 px-6 py-3 border-b">
                                    <div class="grid grid-cols-12 gap-4 font-medium text-gray-600">
                                        <div class="col-span-1">Rank</div>
                                        <div class="col-span-4">User</div>
                                        <div class="col-span-2">Best Score</div>
                                        <div class="col-span-2">Avg Score</div>
                                        <div class="col-span-2">Tests Taken</div>
                                        <div class="col-span-1">Badge</div>
                                    </div>
                                </div>
                                <div id="leaderboardList" class="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                                    <!-- Leaderboard items will be populated here -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Achievements Content -->
                    <div id="achievementsContent" class="hidden">
                        <div class="mb-6">
                            <h3 class="text-xl font-semibold mb-4">Your Achievements</h3>
                            
                            <!-- Achievement Progress -->
                            <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h4 class="text-lg font-semibold">Achievement Progress</h4>
                                        <p class="text-gray-600">Keep testing to unlock more achievements!</p>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-3xl font-bold text-purple-600" id="achievementCount">0</div>
                                        <div class="text-sm text-gray-600">Unlocked</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Achievement Categories -->
                            <div class="grid md:grid-cols-2 gap-6">
                                <!-- Score Achievements -->
                                <div class="bg-white border rounded-lg p-6">
                                    <h4 class="font-semibold mb-4 flex items-center">
                                        <i class="fas fa-star text-yellow-500 mr-2"></i>
                                        Score Achievements
                                    </h4>
                                    <div id="scoreAchievements" class="space-y-3">
                                        <!-- Score achievements will be populated here -->
                                    </div>
                                </div>

                                <!-- Consistency Achievements -->
                                <div class="bg-white border rounded-lg p-6">
                                    <h4 class="font-semibold mb-4 flex items-center">
                                        <i class="fas fa-calendar-check text-green-500 mr-2"></i>
                                        Consistency Achievements
                                    </h4>
                                    <div id="consistencyAchievements" class="space-y-3">
                                        <!-- Consistency achievements will be populated here -->
                                    </div>
                                </div>

                                <!-- Subject Mastery -->
                                <div class="bg-white border rounded-lg p-6">
                                    <h4 class="font-semibold mb-4 flex items-center">
                                        <i class="fas fa-graduation-cap text-blue-500 mr-2"></i>
                                        Subject Mastery
                                    </h4>
                                    <div id="masteryAchievements" class="space-y-3">
                                        <!-- Mastery achievements will be populated here -->
                                    </div>
                                </div>

                                <!-- Special Achievements -->
                                <div class="bg-white border rounded-lg p-6">
                                    <h4 class="font-semibold mb-4 flex items-center">
                                        <i class="fas fa-crown text-purple-500 mr-2"></i>
                                        Special Achievements
                                    </h4>
                                    <div id="specialAchievements" class="space-y-3">
                                        <!-- Special achievements will be populated here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Statistics Comparison Content -->
                    <div id="statsComparisonContent" class="hidden">
                        <div class="mb-6">
                            <h3 class="text-xl font-semibold mb-4">Performance Comparison</h3>
                            
                            <!-- Your Stats vs Global Average -->
                            <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
                                <h4 class="text-lg font-semibold mb-4">You vs Global Average</h4>
                                <div class="grid md:grid-cols-4 gap-4" id="globalComparison">
                                    <!-- Comparison stats will be populated here -->
                                </div>
                            </div>

                            <!-- Performance Charts -->
                            <div class="grid md:grid-cols-2 gap-6">
                                <div class="bg-white border rounded-lg p-6">
                                    <h4 class="font-semibold mb-4">Score Distribution</h4>
                                    <canvas id="scoreDistributionChart" width="400" height="200"></canvas>
                                </div>
                                
                                <div class="bg-white border rounded-lg p-6">
                                    <h4 class="font-semibold mb-4">Subject Performance</h4>
                                    <canvas id="subjectPerformanceChart" width="400" height="200"></canvas>
                                </div>
                            </div>

                            <!-- Detailed Stats Table -->
                            <div class="bg-white border rounded-lg mt-6 overflow-hidden">
                                <div class="bg-gray-50 px-6 py-3 border-b">
                                    <h4 class="font-semibold">Detailed Statistics</h4>
                                </div>
                                <div class="p-6">
                                    <div id="detailedStats" class="grid md:grid-cols-3 gap-6">
                                        <!-- Detailed stats will be populated here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Challenges Content -->
                    <div id="challengesContent" class="hidden">
                        <div class="mb-6">
                            <h3 class="text-xl font-semibold mb-4">Daily Challenges</h3>
                            
                            <!-- Active Challenge -->
                            <div class="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 mb-6">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h4 class="text-lg font-semibold text-orange-800">Today's Challenge</h4>
                                        <p class="text-orange-600" id="todaysChallenge">Loading challenge...</p>
                                    </div>
                                    <button id="startChallenge" class="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors">
                                        <i class="fas fa-play mr-2"></i>Start Challenge
                                    </button>
                                </div>
                                <div class="mt-4">
                                    <div class="flex justify-between text-sm text-orange-600 mb-2">
                                        <span>Progress</span>
                                        <span id="challengeProgress">0/100 participants</span>
                                    </div>
                                    <div class="w-full bg-orange-200 rounded-full h-2">
                                        <div class="bg-orange-500 h-2 rounded-full transition-all duration-300" id="challengeProgressBar" style="width: 0%"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Challenge History -->
                            <div class="bg-white border rounded-lg">
                                <div class="bg-gray-50 px-6 py-3 border-b">
                                    <h4 class="font-semibold">Challenge History</h4>
                                </div>
                                <div id="challengeHistory" class="p-6">
                                    <!-- Challenge history will be populated here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(socialModal);
    }

    setupEventListeners() {
        // Modal controls
        document.getElementById('closeSocialModal').addEventListener('click', () => this.hideSocialModal());
        
        // Tab navigation
        document.getElementById('leaderboardTab').addEventListener('click', () => this.showTab('leaderboard'));
        document.getElementById('achievementsTab').addEventListener('click', () => this.showTab('achievements'));
        document.getElementById('statsComparisonTab').addEventListener('click', () => this.showTab('statsComparison'));
        document.getElementById('challengesTab').addEventListener('click', () => this.showTab('challenges'));
        
        // Leaderboard filters
        document.getElementById('leaderboardCategory').addEventListener('change', () => this.loadLeaderboard());
        document.getElementById('leaderboardPeriod').addEventListener('change', () => this.loadLeaderboard());
        
        // Challenge actions
        document.getElementById('startChallenge').addEventListener('click', () => this.startDailyChallenge());
    }

    async showSocialModal() {
        document.getElementById('socialModal').classList.remove('hidden');
        document.getElementById('socialModal').classList.add('flex');
        
        // Load initial data
        await this.loadLeaderboard();
        await this.loadAchievements();
        await this.loadStatistics();
        await this.loadChallenges();
    }

    hideSocialModal() {
        document.getElementById('socialModal').classList.add('hidden');
        document.getElementById('socialModal').classList.remove('flex');
    }

    showTab(tabName) {
        // Hide all tab contents
        document.getElementById('leaderboardContent').classList.add('hidden');
        document.getElementById('achievementsContent').classList.add('hidden');
        document.getElementById('statsComparisonContent').classList.add('hidden');
        document.getElementById('challengesContent').classList.add('hidden');
        
        // Remove active styling from all tabs
        document.querySelectorAll('[id$="Tab"]').forEach(tab => {
            tab.className = 'px-6 py-3 font-medium text-gray-600 hover:text-gray-800';
        });
        
        // Show selected tab content and style
        document.getElementById(`${tabName}Content`).classList.remove('hidden');
        document.getElementById(`${tabName}Tab`).className = 'px-6 py-3 font-medium border-b-2 border-purple-500 text-purple-600 bg-white';
    }

    async loadLeaderboard() {
        try {
            const category = document.getElementById('leaderboardCategory').value;
            const period = document.getElementById('leaderboardPeriod').value;
            
            // For demo purposes, generate mock leaderboard data
            // In production, this would call: /api/social/leaderboard
            const leaderboardData = this.generateMockLeaderboard(category, period);
            
            this.displayTopThree(leaderboardData.slice(0, 3));
            this.displayLeaderboard(leaderboardData);
            
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.app.showError('Failed to load leaderboard');
        }
    }

    generateMockLeaderboard(category, period) {
        const mockUsers = [
            { name: 'Alex Chen', avatar: '👨‍💻', bestScore: 98, avgScore: 92, testsCount: 45, badge: '🏆' },
            { name: 'Sarah Johnson', avatar: '👩‍🔬', bestScore: 96, avgScore: 89, testsCount: 38, badge: '🥇' },
            { name: 'Mike Rodriguez', avatar: '👨‍🎓', bestScore: 94, avgScore: 87, testsCount: 52, badge: '🥈' },
            { name: 'Emma Davis', avatar: '👩‍🏫', bestScore: 93, avgScore: 85, testsCount: 29, badge: '🥉' },
            { name: 'James Wilson', avatar: '👨‍💼', bestScore: 91, avgScore: 83, testsCount: 34, badge: '🎯' },
            { name: 'Lisa Wang', avatar: '👩‍💻', bestScore: 90, avgScore: 82, testsCount: 41, badge: '⭐' },
            { name: 'David Brown', avatar: '👨‍🔬', bestScore: 89, avgScore: 81, testsCount: 27, badge: '🎖️' },
            { name: 'Anna Taylor', avatar: '👩‍🎨', bestScore: 88, avgScore: 79, testsCount: 33, badge: '🏅' },
            { name: 'You', avatar: '👤', bestScore: 0, avgScore: 0, testsCount: 0, badge: '🆕', isCurrentUser: true }
        ];
        
        // Add current user's actual stats if available
        if (this.app.user) {
            const currentUserIndex = mockUsers.findIndex(u => u.isCurrentUser);
            if (currentUserIndex !== -1) {
                // This would be populated from actual user stats
                mockUsers[currentUserIndex].name = this.app.user.name;
                // For demo, use random values
                mockUsers[currentUserIndex].bestScore = Math.floor(Math.random() * 40) + 60;
                mockUsers[currentUserIndex].avgScore = Math.floor(Math.random() * 30) + 50;
                mockUsers[currentUserIndex].testsCount = Math.floor(Math.random() * 20) + 5;
            }
        }
        
        // Sort by best score
        return mockUsers.sort((a, b) => b.bestScore - a.bestScore);
    }

    displayTopThree(topUsers) {
        const podiumContainer = document.getElementById('topThreePodium');
        podiumContainer.innerHTML = '';
        
        if (topUsers.length < 3) return;
        
        // Rearrange for podium display: 2nd, 1st, 3rd
        const podiumOrder = [topUsers[1], topUsers[0], topUsers[2]];
        const heights = ['h-24', 'h-32', 'h-20'];
        const positions = ['2nd', '1st', '3rd'];
        const colors = ['bg-gray-400', 'bg-yellow-400', 'bg-orange-400'];
        
        podiumOrder.forEach((user, index) => {
            if (!user) return;
            
            const podiumDiv = document.createElement('div');
            podiumDiv.className = 'text-center';
            podiumDiv.innerHTML = `
                <div class="mb-2">
                    <div class="text-3xl mb-1">${user.avatar}</div>
                    <div class="font-semibold text-sm ${user.isCurrentUser ? 'text-purple-600' : 'text-gray-800'}">${user.name}</div>
                    <div class="text-lg font-bold text-gray-600">${user.bestScore}%</div>
                </div>
                <div class="${heights[index]} w-20 ${colors[index]} rounded-t-lg flex items-end justify-center pb-2">
                    <span class="text-white font-bold">${positions[index]}</span>
                </div>
            `;
            podiumContainer.appendChild(podiumDiv);
        });
    }

    displayLeaderboard(leaderboardData) {
        const container = document.getElementById('leaderboardList');
        container.innerHTML = '';
        
        leaderboardData.forEach((user, index) => {
            const row = document.createElement('div');
            row.className = `px-6 py-4 hover:bg-gray-50 ${user.isCurrentUser ? 'bg-purple-50 border-l-4 border-purple-500' : ''}`;
            row.innerHTML = `
                <div class="grid grid-cols-12 gap-4 items-center">
                    <div class="col-span-1">
                        <span class="font-bold text-lg ${index < 3 ? 'text-yellow-600' : 'text-gray-600'}">#${index + 1}</span>
                    </div>
                    <div class="col-span-4 flex items-center space-x-3">
                        <span class="text-2xl">${user.avatar}</span>
                        <div>
                            <div class="font-medium ${user.isCurrentUser ? 'text-purple-600' : 'text-gray-800'}">${user.name}</div>
                            ${user.isCurrentUser ? '<div class="text-sm text-purple-500">You</div>' : ''}
                        </div>
                    </div>
                    <div class="col-span-2 font-semibold ${user.bestScore >= 90 ? 'text-green-600' : user.bestScore >= 70 ? 'text-yellow-600' : 'text-red-600'}">
                        ${user.bestScore}%
                    </div>
                    <div class="col-span-2 text-gray-600">
                        ${user.avgScore}%
                    </div>
                    <div class="col-span-2 text-gray-600">
                        ${user.testsCount}
                    </div>
                    <div class="col-span-1 text-center">
                        <span class="text-xl">${user.badge}</span>
                    </div>
                </div>
            `;
            container.appendChild(row);
        });
    }

    async loadAchievements() {
        try {
            // In production, this would call: /api/social/achievements
            const achievements = this.generateMockAchievements();
            
            this.displayAchievements(achievements);
            
        } catch (error) {
            console.error('Error loading achievements:', error);
            this.app.showError('Failed to load achievements');
        }
    }

    generateMockAchievements() {
        return {
            score: [
                { name: 'First Success', description: 'Score above 70% on any test', icon: '🎯', unlocked: true, progress: 100 },
                { name: 'High Achiever', description: 'Score above 90% on any test', icon: '🌟', unlocked: false, progress: 75 },
                { name: 'Perfectionist', description: 'Score 100% on any test', icon: '💯', unlocked: false, progress: 0 }
            ],
            consistency: [
                { name: 'Getting Started', description: 'Take 5 tests', icon: '🏃', unlocked: true, progress: 100 },
                { name: 'Regular Learner', description: 'Take 25 tests', icon: '📚', unlocked: false, progress: 40 },
                { name: 'Dedicated Student', description: 'Take 100 tests', icon: '🎓', unlocked: false, progress: 10 }
            ],
            mastery: [
                { name: 'Math Novice', description: 'Score above 80% in 3 Math tests', icon: '🔢', unlocked: false, progress: 33 },
                { name: 'Science Explorer', description: 'Score above 80% in 3 Science tests', icon: '🔬', unlocked: true, progress: 100 },
                { name: 'Renaissance Mind', description: 'Master all 6 categories', icon: '🧠', unlocked: false, progress: 16 }
            ],
            special: [
                { name: 'Speed Demon', description: 'Complete a test in under 10 minutes', icon: '⚡', unlocked: false, progress: 0 },
                { name: 'Night Owl', description: 'Take a test after midnight', icon: '🦉', unlocked: true, progress: 100 },
                { name: 'Early Bird', description: 'Take a test before 6 AM', icon: '🌅', unlocked: false, progress: 0 }
            ]
        };
    }

    displayAchievements(achievements) {
        const categories = ['score', 'consistency', 'mastery', 'special'];
        const containers = ['scoreAchievements', 'consistencyAchievements', 'masteryAchievements', 'specialAchievements'];
        
        let totalUnlocked = 0;
        
        categories.forEach((category, categoryIndex) => {
            const container = document.getElementById(containers[categoryIndex]);
            container.innerHTML = '';
            
            achievements[category].forEach(achievement => {
                if (achievement.unlocked) totalUnlocked++;
                
                const achievementDiv = document.createElement('div');
                achievementDiv.className = `flex items-center space-x-3 p-3 rounded-lg ${achievement.unlocked ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`;
                
                achievementDiv.innerHTML = `
                    <div class="text-2xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}">${achievement.icon}</div>
                    <div class="flex-1">
                        <div class="font-medium ${achievement.unlocked ? 'text-green-800' : 'text-gray-600'}">${achievement.name}</div>
                        <div class="text-sm text-gray-600">${achievement.description}</div>
                        ${!achievement.unlocked && achievement.progress > 0 ? `
                            <div class="mt-2">
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-blue-500 h-2 rounded-full" style="width: ${achievement.progress}%"></div>
                                </div>
                                <div class="text-xs text-gray-500 mt-1">${achievement.progress}% complete</div>
                            </div>
                        ` : ''}
                    </div>
                    ${achievement.unlocked ? '<i class="fas fa-check-circle text-green-500"></i>' : '<i class="fas fa-lock text-gray-400"></i>'}
                `;
                
                container.appendChild(achievementDiv);
            });
        });
        
        document.getElementById('achievementCount').textContent = totalUnlocked;
    }

    async loadStatistics() {
        try {
            // In production, this would call: /api/social/statistics
            const stats = await this.generateMockStatistics();
            
            this.displayGlobalComparison(stats.comparison);
            this.createStatisticsCharts(stats);
            this.displayDetailedStats(stats.detailed);
            
        } catch (error) {
            console.error('Error loading statistics:', error);
            this.app.showError('Failed to load statistics');
        }
    }

    async generateMockStatistics() {
        // Get user's actual stats
        let userStats = { total_tests: 0, avg_score: 0, best_score: 0 };
        
        try {
            const response = await axios.get('/api/tests/stats');
            if (response.data.success) {
                userStats = response.data.statistics;
            }
        } catch (error) {
            console.error('Failed to load user stats:', error);
        }
        
        return {
            comparison: {
                yourAvgScore: userStats.avg_score || 0,
                globalAvgScore: 73,
                yourBestScore: userStats.best_score || 0,
                globalBestScore: 87,
                yourTestCount: userStats.total_tests || 0,
                globalAvgTests: 18,
                yourRank: Math.max(1, Math.floor(Math.random() * 1000))
            },
            scoreDistribution: [
                { range: '0-40', count: 5 },
                { range: '41-60', count: 15 },
                { range: '61-80', count: 45 },
                { range: '81-90', count: 25 },
                { range: '91-100', count: 10 }
            ],
            subjectPerformance: {
                Mathematics: userStats.avg_score ? Math.max(0, userStats.avg_score + Math.random() * 20 - 10) : 65,
                Science: userStats.avg_score ? Math.max(0, userStats.avg_score + Math.random() * 20 - 10) : 72,
                Programming: userStats.avg_score ? Math.max(0, userStats.avg_score + Math.random() * 20 - 10) : 68,
                History: userStats.avg_score ? Math.max(0, userStats.avg_score + Math.random() * 20 - 10) : 71,
                'English Language': userStats.avg_score ? Math.max(0, userStats.avg_score + Math.random() * 20 - 10) : 74,
                'General Knowledge': userStats.avg_score ? Math.max(0, userStats.avg_score + Math.random() * 20 - 10) : 69
            },
            detailed: {
                totalTimeSpent: Math.floor((userStats.total_questions_answered || 0) * (userStats.avg_time_per_question || 60)),
                averageSessionTime: Math.floor(Math.random() * 1800) + 600, // 10-40 minutes
                mostActiveDay: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][Math.floor(Math.random() * 7)],
                favoriteCategory: 'Science',
                improvementRate: Math.floor(Math.random() * 20) + 5,
                streakDays: Math.floor(Math.random() * 30)
            }
        };
    }

    displayGlobalComparison(comparison) {
        const container = document.getElementById('globalComparison');
        container.innerHTML = '';
        
        const comparisons = [
            {
                title: 'Average Score',
                your: `${Math.round(comparison.yourAvgScore)}%`,
                global: `${comparison.globalAvgScore}%`,
                better: comparison.yourAvgScore > comparison.globalAvgScore
            },
            {
                title: 'Best Score',
                your: `${Math.round(comparison.yourBestScore)}%`,
                global: `${comparison.globalBestScore}%`,
                better: comparison.yourBestScore > comparison.globalBestScore
            },
            {
                title: 'Tests Taken',
                your: comparison.yourTestCount.toString(),
                global: comparison.globalAvgTests.toString(),
                better: comparison.yourTestCount > comparison.globalAvgTests
            },
            {
                title: 'Global Rank',
                your: `#${comparison.yourRank}`,
                global: '#500',
                better: comparison.yourRank < 500
            }
        ];
        
        comparisons.forEach(comp => {
            const compDiv = document.createElement('div');
            compDiv.className = 'text-center p-4 bg-white rounded-lg border';
            compDiv.innerHTML = `
                <div class="text-sm text-gray-600 mb-1">${comp.title}</div>
                <div class="text-2xl font-bold ${comp.better ? 'text-green-600' : 'text-blue-600'} mb-1">${comp.your}</div>
                <div class="text-xs text-gray-500">vs ${comp.global} avg</div>
                <div class="mt-2">
                    <i class="fas fa-${comp.better ? 'arrow-up text-green-500' : 'arrow-down text-red-500'}"></i>
                </div>
            `;
            container.appendChild(compDiv);
        });
    }

    createStatisticsCharts(stats) {
        // Score Distribution Chart
        const scoreCanvas = document.getElementById('scoreDistributionChart');
        const scoreCtx = scoreCanvas.getContext('2d');
        this.createBarChart(scoreCtx, stats.scoreDistribution, 'Score Ranges', '#3B82F6');
        
        // Subject Performance Chart
        const subjectCanvas = document.getElementById('subjectPerformanceChart');
        const subjectCtx = subjectCanvas.getContext('2d');
        const subjectData = Object.entries(stats.subjectPerformance).map(([subject, score]) => ({
            range: subject.replace(' Language', ''),
            count: Math.round(score)
        }));
        this.createBarChart(subjectCtx, subjectData, 'Subject Scores', '#10B981');
    }

    createBarChart(ctx, data, title, color) {
        const canvas = ctx.canvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const maxValue = Math.max(...data.map(d => d.count));
        const barWidth = canvas.width / (data.length * 1.5);
        const maxHeight = canvas.height - 60;
        
        data.forEach((item, index) => {
            const x = (index + 0.5) * (canvas.width / data.length);
            const barHeight = (item.count / maxValue) * maxHeight;
            
            // Draw bar
            ctx.fillStyle = color;
            ctx.fillRect(x - barWidth/2, canvas.height - barHeight - 40, barWidth, barHeight);
            
            // Draw labels
            ctx.fillStyle = '#374151';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.range, x, canvas.height - 25);
            ctx.fillText(item.count.toString(), x, canvas.height - barHeight - 45);
        });
    }

    displayDetailedStats(detailed) {
        const container = document.getElementById('detailedStats');
        container.innerHTML = '';
        
        const stats = [
            { title: 'Total Study Time', value: `${Math.floor(detailed.totalTimeSpent / 3600)}h ${Math.floor((detailed.totalTimeSpent % 3600) / 60)}m`, icon: 'clock' },
            { title: 'Avg Session Time', value: `${Math.floor(detailed.averageSessionTime / 60)}m`, icon: 'stopwatch' },
            { title: 'Most Active Day', value: detailed.mostActiveDay, icon: 'calendar' },
            { title: 'Favorite Category', value: detailed.favoriteCategory, icon: 'heart' },
            { title: 'Improvement Rate', value: `+${detailed.improvementRate}%`, icon: 'trending-up' },
            { title: 'Current Streak', value: `${detailed.streakDays} days`, icon: 'fire' }
        ];
        
        stats.forEach(stat => {
            const statDiv = document.createElement('div');
            statDiv.className = 'text-center p-4 bg-gray-50 rounded-lg';
            statDiv.innerHTML = `
                <i class="fas fa-${stat.icon} text-blue-500 text-xl mb-2"></i>
                <div class="text-lg font-bold text-gray-800">${stat.value}</div>
                <div class="text-sm text-gray-600">${stat.title}</div>
            `;
            container.appendChild(statDiv);
        });
    }

    async loadChallenges() {
        try {
            // In production, this would call: /api/social/challenges
            const challenges = this.generateMockChallenges();
            
            this.displayTodaysChallenge(challenges.today);
            this.displayChallengeHistory(challenges.history);
            
        } catch (error) {
            console.error('Error loading challenges:', error);
            this.app.showError('Failed to load challenges');
        }
    }

    generateMockChallenges() {
        const challengeTypes = [
            'Score above 85% in a Math test',
            'Complete a Science test in under 15 minutes',
            'Take tests in 3 different categories today',
            'Score 100% on any Easy level test',
            'Answer 50 questions correctly today'
        ];
        
        return {
            today: {
                description: challengeTypes[Math.floor(Math.random() * challengeTypes.length)],
                participants: Math.floor(Math.random() * 80) + 20,
                reward: 'Double XP for next test',
                timeLeft: '18h 32m'
            },
            history: [
                { date: '2025-08-15', description: 'Complete 3 tests', completed: true, reward: 'Achievement Badge' },
                { date: '2025-08-14', description: 'Score above 90%', completed: false, reward: 'Bonus Points' },
                { date: '2025-08-13', description: 'Take a Programming test', completed: true, reward: 'New Avatar' }
            ]
        };
    }

    displayTodaysChallenge(challenge) {
        document.getElementById('todaysChallenge').textContent = challenge.description;
        document.getElementById('challengeProgress').textContent = `${challenge.participants}/100 participants`;
        document.getElementById('challengeProgressBar').style.width = `${challenge.participants}%`;
    }

    displayChallengeHistory(history) {
        const container = document.getElementById('challengeHistory');
        container.innerHTML = '';
        
        history.forEach(challenge => {
            const historyDiv = document.createElement('div');
            historyDiv.className = `flex items-center justify-between p-4 border rounded-lg ${challenge.completed ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`;
            historyDiv.innerHTML = `
                <div class="flex items-center space-x-3">
                    <i class="fas fa-${challenge.completed ? 'check-circle text-green-500' : 'times-circle text-red-500'} text-xl"></i>
                    <div>
                        <div class="font-medium">${challenge.description}</div>
                        <div class="text-sm text-gray-600">${challenge.date}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-sm font-medium ${challenge.completed ? 'text-green-600' : 'text-gray-500'}">${challenge.reward}</div>
                    <div class="text-xs text-gray-500">${challenge.completed ? 'Earned' : 'Missed'}</div>
                </div>
            `;
            container.appendChild(historyDiv);
        });
    }

    startDailyChallenge() {
        this.app.showInfo('Starting daily challenge! Complete the challenge to earn rewards.');
        this.hideSocialModal();
        this.app.testInterface.showTestConfigModal();
    }
}

// Make SocialFeatures available globally
window.SocialFeatures = SocialFeatures;