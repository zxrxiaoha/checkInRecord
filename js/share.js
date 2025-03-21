// 分享功能模块
import stats from './stats.js';
import checkIn from './checkIn.js';

class ShareManager {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
    }

    // 生成成就图片
    async generateAchievementImage() {
        const records = checkIn.getAllRecords();
        const totalDays = new Set(records.map(r => new Date(r.date).toDateString())).size;
        const totalHours = records.reduce((acc, cur) => {
            const [h] = cur.duration.split(':').map(Number);
            return acc + h;
        }, 0);

        // 创建渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#4158D0');
        gradient.addColorStop(0.46, '#C850C0');
        gradient.addColorStop(1, '#FFCC70');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 添加半透明白色覆盖层增加可读性
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        this.ctx.fillRect(40, 40, this.canvas.width - 80, this.canvas.height - 80);

        // 绘制标题
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 48px "Microsoft YaHei", Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('我的打卡成就', this.canvas.width / 2, 100);

        // 绘制装饰线
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2 - 100, 120);
        this.ctx.lineTo(this.canvas.width / 2 + 100, 120);
        this.ctx.strokeStyle = '#C850C0';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // 绘制主要统计数据
        this.ctx.font = 'bold 36px "Microsoft YaHei", Arial';
        this.ctx.fillStyle = '#4158D0';
        this.ctx.fillText(`${totalDays}`, this.canvas.width / 3, 200);
        this.ctx.fillText(`${totalHours}`, (this.canvas.width / 3) * 2, 200);

        this.ctx.font = '24px "Microsoft YaHei", Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.fillText('累计打卡天数', this.canvas.width / 3, 240);
        this.ctx.fillText('累计学习时长', (this.canvas.width / 3) * 2, 240);

        // 绘制最近记录标题
        this.ctx.font = 'bold 28px "Microsoft YaHei", Arial';
        this.ctx.fillStyle = '#333';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('最近打卡记录', 80, 300);

        // 绘制最近记录列表
        const recentRecords = records.slice(0, 5);
        this.ctx.font = '20px "Microsoft YaHei", Arial';
        this.ctx.fillStyle = '#555';
        recentRecords.forEach((record, index) => {
            const date = new Date(record.date).toLocaleDateString();
            const content = record.content || '无内容';
            const y = 350 + index * 45;

            // 绘制记录圆点
            this.ctx.beginPath();
            this.ctx.arc(90, y - 8, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = '#C850C0';
            this.ctx.fill();

            // 绘制记录内容
            this.ctx.fillStyle = '#555';
            this.ctx.fillText(
                `${date} - ${record.duration}`,
                120,
                y
            );
            this.ctx.fillText(
                `${content.slice(0, 25)}${content.length > 25 ? '...' : ''}`,
                120,
                y + 25
            );
        });

        // 添加底部装饰
        this.ctx.font = '16px "Microsoft YaHei", Arial';
        this.ctx.fillStyle = '#999';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('继续加油，未来可期！', this.canvas.width / 2, this.canvas.height - 60);

        return this.canvas.toDataURL('image/png');
    }

    // 分享成就
    async shareAchievement() {
        try {
            const imageUrl = await this.generateAchievementImage();
            
            // 尝试使用Web Share API
            if (navigator.share) {
                const blob = await (await fetch(imageUrl)).blob();
                const file = new File([blob], 'achievement.png', { type: 'image/png' });
                
                await navigator.share({
                    title: '我的打卡成就',
                    text: '查看我的打卡记录！',
                    files: [file]
                });
            } else {
                // 降级方案：创建下载链接
                const link = document.createElement('a');
                link.download = 'achievement.png';
                link.href = imageUrl;
                link.click();
            }
        } catch (error) {
            console.error('分享失败：', error);
        }
    }

    // 预览成就图片
    async previewAchievement() {
        const imageUrl = await this.generateAchievementImage();
        const previewContainer = document.createElement('div');
        previewContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.2);
            z-index: 1000;
        `;

        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '关闭';
        closeBtn.style.marginTop = '10px';
        closeBtn.onclick = () => document.body.removeChild(previewContainer);

        const shareBtn = document.createElement('button');
        shareBtn.textContent = '分享';
        shareBtn.style.marginLeft = '10px';
        shareBtn.onclick = () => this.shareAchievement();

        const buttonContainer = document.createElement('div');
        buttonContainer.style.textAlign = 'center';
        buttonContainer.appendChild(closeBtn);
        buttonContainer.appendChild(shareBtn);

        previewContainer.appendChild(img);
        previewContainer.appendChild(buttonContainer);
        document.body.appendChild(previewContainer);
    }
}

export default new ShareManager();