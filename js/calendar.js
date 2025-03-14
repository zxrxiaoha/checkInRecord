// 日历相关功能
class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
    }

    // 生成日历HTML
    generateCalendar(records) {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        let html = `
            <div class="calendar-header">
                <button onclick="calendar.prevMonth()">&lt;</button>
                <span>${year}年${month + 1}月</span>
                <button onclick="calendar.nextMonth()">&gt;</button>
            </div>
            <div class="calendar-body">
                <div class="weekdays">
                    <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
                </div>
                <div class="days">
        `;

        // 填充月初空白日期
        for (let i = 0; i < firstDay.getDay(); i++) {
            html += '<div class="day empty"></div>';
        }

        // 生成日期格子
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const currentDate = new Date(year, month, day);
            const isToday = this.isToday(currentDate);
            const hasRecord = this.hasCheckInRecord(currentDate, records);
            
            html += `
                <div class="day ${isToday ? 'today' : ''} ${hasRecord ? 'checked' : ''}" 
                     onclick="calendar.selectDate(${year}, ${month}, ${day})">
                    ${day}
                </div>
            `;
        }

        html += '</div></div>';
        return html;
    }

    // 检查是否是今天
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    // 检查当天是否有打卡记录
    hasCheckInRecord(date, records) {
        return records.some(record => {
            const recordDate = new Date(record.date);
            return recordDate.getDate() === date.getDate() &&
                   recordDate.getMonth() === date.getMonth() &&
                   recordDate.getFullYear() === date.getFullYear();
        });
    }

    // 选择日期
    selectDate(year, month, day) {
        this.selectedDate = new Date(year, month, day);
        document.dispatchEvent(new CustomEvent('dateSelected', { 
            detail: { date: this.selectedDate }
        }));
    }

    // 上个月
    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        document.dispatchEvent(new CustomEvent('monthChanged'));
    }

    // 下个月
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        document.dispatchEvent(new CustomEvent('monthChanged'));
    }
}

export default new Calendar();