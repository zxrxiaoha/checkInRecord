// 打卡操作相关功能
import modal from './modal.js';

class CheckInManager {
    constructor() {
        this.timer = null;
        this.startTime = null;
        this.records = this.loadRecords();
    }

    // 加载打卡记录
    loadRecords() {
        const records = localStorage.getItem('checkInRecords');
        return records ? JSON.parse(records) : [];
    }

    // 保存打卡记录
    saveRecords() {
        localStorage.setItem('checkInRecords', JSON.stringify(this.records));
    }

    // 开始打卡
    startCheckIn() {
        this.startTime = new Date();
        this.timer = setInterval(() => {
            const duration = this.calculateDuration();
            document.getElementById('timer').textContent = duration;
        }, 1000);
    }

    // 结束打卡
    endCheckIn(content = '') {
        if (!this.startTime) return;
        
        const endTime = new Date();
        const duration = this.calculateDuration();
        clearInterval(this.timer);

        const record = {
            id: Date.now(),
            date: this.startTime,
            content,
            duration,
            endTime
        };

        this.records.push(record);
        this.saveRecords();
        this.startTime = null;
        return record;
    }

    // 计算时长
    calculateDuration() {
        if (!this.startTime) return '00:00:00';
        const diff = new Date() - this.startTime;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // 补卡
    makeupCheckIn(date, content = '', endTime = null) {
        const startTime = new Date(date);
        const recordEndTime = endTime ? new Date(endTime) : startTime;
        
        // 验证结束时间必须大于开始时间
        // 验证时间有效性
        if (recordEndTime <= startTime) {
            modal.alert('补卡结束时间必须大于开始时间');
            return;
        }

        const diff = recordEndTime - startTime;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        const duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const record = {
            id: Date.now(),
            date: startTime,
            content,
            duration,
            endTime: recordEndTime,
            isMakeup: true
        };

        this.records.push(record);
        this.saveRecords();
        return record;
    }

    // 编辑记录
    editRecord(id, content) {
        const record = this.records.find(r => r.id === id);
        if (record) {
            record.content = content;
            this.saveRecords();
            return true;
        }
        return false;
    }

    // 删除记录
    deleteRecord(id) {
        const index = this.records.findIndex(r => r.id === id);
        if (index !== -1) {
            this.records.splice(index, 1);
            this.saveRecords();
            return true;
        }
        return false;
    }

    // 获取所有记录（按时间排序）
    getAllRecords() {
        return [...this.records].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
}

export default new CheckInManager();