// 统计和图表展示功能
import checkIn from './checkIn.js';

class StatsManager {
    constructor() {
        this.trendChart = null;
        this.durationChart = null;
        this.distributionChart = null;
    }

    // 计算统计数据
    calculateStats(records) {
        // 计算平均打卡时长
        let totalDuration = 0;
        records.forEach(record => {
            const [hours, minutes] = record.duration.split(':');
            totalDuration += parseInt(hours) + parseInt(minutes) / 60;
        });
        const averageDuration = records.length > 0 ? (totalDuration / records.length).toFixed(1) : 0;

        // 计算本周打卡次数
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weeklyRecords = records.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate >= weekStart && recordDate <= today;
        });
        const weeklyCount = weeklyRecords.length;

        // 计算连续打卡天数
        const sortedDates = records.map(record => new Date(record.date).toISOString().split('T')[0])
            .sort()
            .filter((date, index, array) => array.indexOf(date) === index);
        let currentStreak = 0;
        let maxStreak = 0;
        let currentDate = new Date();

        for (let i = sortedDates.length - 1; i >= 0; i--) {
            const date = new Date(sortedDates[i]);
            const expectedDate = new Date(currentDate);
            expectedDate.setDate(currentDate.getDate() - 1);

            if (date.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
                currentStreak++;
                currentDate = date;
            } else {
                break;
            }
        }
        maxStreak = Math.max(currentStreak, maxStreak);

        // 总打卡次数
        const totalCount = records.length;

        return {
            averageDuration,
            weeklyCount,
            streak: maxStreak,
            totalCount
        };
    }

    // 更新统计面板
    updateStatsPanel() {
        const records = checkIn.getAllRecords();
        const stats = this.calculateStats(records);

        // 创建或更新统计面板
        let statsPanel = document.querySelector('.stats-panel');
        if (!statsPanel) {
            statsPanel = document.createElement('div');
            statsPanel.className = 'stats-panel';
            document.querySelector('.stats-section').insertBefore(statsPanel, document.querySelector('.chart-container'));
        }

        statsPanel.innerHTML = `
            <div class="stats-card">
                <h3>平均打卡时长</h3>
                <p>${stats.averageDuration} 小时</p>
            </div>
            <div class="stats-card">
                <h3>本周打卡次数</h3>
                <p>${stats.weeklyCount} 次</p>
            </div>
            <div class="stats-card">
                <h3>连续打卡天数</h3>
                <p>${stats.streak} 天</p>
            </div>
            <div class="stats-card">
                <h3>总打卡次数</h3>
                <p>${stats.totalCount} 次</p>
            </div>
        `;
    }

    initCharts() {
        if (this.trendChart || this.durationChart || this.distributionChart) return;
        // 初始化趋势图
        const trendCtx = document.getElementById('trendChart');
        this.trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '打卡次数',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '打卡趋势'
                    }
                }
            }
        });

        // 初始化时长图
        const durationCtx = document.getElementById('durationChart');
        this.durationChart = new Chart(durationCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: '平均打卡时长（小时）',
                    data: [],
                    backgroundColor: 'rgba(54, 162, 235, 0.5)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '每日平均打卡时长'
                    }
                }
            }
        });

        // 初始化分布图
        const distributionCtx = document.getElementById('distributionChart');
        this.distributionChart = new Chart(distributionCtx, {
            type: 'pie',
            data: {
                labels: ['早晨 (5:00-12:00)', '下午 (12:00-18:00)', '晚上 (18:00-5:00)'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '打卡时段分布'
                    }
                }
            }
        });
    }

    // 更新所有图表
    updateCharts() {
        if (!this.trendChart || !this.durationChart || !this.distributionChart) {
            this.initCharts();
        }
        const records = checkIn.getAllRecords();
        this.updateStatsPanel(); // 添加统计面板更新
        this.updateTrendChart(records);
        this.updateDurationChart(records);
        this.updateDistributionChart(records);
    }

    // 更新趋势图
    updateTrendChart(records) {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 6);

        const dailyCounts = new Map();
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            dailyCounts.set(date.toISOString().split('T')[0], 0);
        }

        records.forEach(record => {
            const date = new Date(record.date).toISOString().split('T')[0];
            if (dailyCounts.has(date)) {
                dailyCounts.set(date, dailyCounts.get(date) + 1);
            }
        });

        this.trendChart.data.labels = Array.from(dailyCounts.keys());
        this.trendChart.data.datasets[0].data = Array.from(dailyCounts.values());
        this.trendChart.update();
    }

    // 更新时长图
    updateDurationChart(records) {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 6);

        const dailyDurations = new Map();
        const dailyRecords = new Map();

        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            dailyDurations.set(dateStr, 0);
            dailyRecords.set(dateStr, 0);
        }

        records.forEach(record => {
            const date = new Date(record.date).toISOString().split('T')[0];
            if (dailyDurations.has(date)) {
                const [hours, minutes] = record.duration.split(':');
                const duration = parseInt(hours) + parseInt(minutes) / 60;
                dailyDurations.set(date, dailyDurations.get(date) + duration);
                dailyRecords.set(date, dailyRecords.get(date) + 1);
            }
        });

        const averageDurations = Array.from(dailyDurations.entries()).map(([date, total]) => {
            const count = dailyRecords.get(date);
            return count > 0 ? total / count : 0;
        });

        this.durationChart.data.labels = Array.from(dailyDurations.keys());
        this.durationChart.data.datasets[0].data = averageDurations;
        this.durationChart.update();
    }

    // 更新分布图
    updateDistributionChart(records) {
        const distribution = [0, 0, 0]; // 早晨、下午、晚上

        records.forEach(record => {
            const date = new Date(record.date);
            const hours = date.getHours();

            if (hours >= 5 && hours < 12) {
                distribution[0]++;
            } else if (hours >= 12 && hours < 18) {
                distribution[1]++;
            } else {
                distribution[2]++;
            }
        });

        this.distributionChart.data.datasets[0].data = distribution;
        this.distributionChart.update();
    }
}

export default new StatsManager();