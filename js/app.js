// 主应用模块
import checkIn from './checkIn.js';
import calendar from './calendar.js';
import recordManager from './recordManager.js';
import modal from './modal.js';
import stats from './stats.js';

class App {
    constructor() {
        this.init();
    }

    init() {
        // 初始化事件监听
        this.initEventListeners();
        // 初始化界面
        this.updateUI();
    }

    initEventListeners() {
        // 打卡按钮事件
        document.getElementById('startCheckIn').addEventListener('click', () => {
            if (!checkIn.startTime) {
                checkIn.startCheckIn();
                document.getElementById('startCheckIn').textContent = '结束打卡';
            } else {
                this.endCheckIn();
            }
        });

        // 统计页面切换事件
        document.getElementById('toggleStats').addEventListener('click', () => {
            const mainContent = document.getElementById('mainContent');
            const statsContent = document.getElementById('statsContent');
            const toggleBtn = document.getElementById('toggleStats');

            if (mainContent.style.display !== 'none') {
                mainContent.style.display = 'none';
                statsContent.style.display = 'block';
                toggleBtn.textContent = '返回主页';
                stats.initCharts();
                stats.updateCharts();
            } else {
                mainContent.style.display = 'block';
                statsContent.style.display = 'none';
                toggleBtn.textContent = '查看统计';
            }
        });

        // 搜索按钮事件
        document.getElementById('searchRecords').addEventListener('click', () => {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const keyword = document.getElementById('searchKeyword').value.trim();
            
            const filteredRecords = recordManager.searchRecords(checkIn.getAllRecords(), {
                startDate,
                endDate,
                keyword
            });
            
            this.updateRecordList(filteredRecords);
        });

        // 日历日期选择事件
        document.addEventListener('dateSelected', (e) => {
            const date = e.detail.date;
            // 验证日期
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

            if (selectedDate > today) {
                modal.alert('不能补卡未来日期！');
                return;
            }

            modal.confirm('是否要在这一天补卡？', () => {
                const dialog = document.createElement('div');
                dialog.innerHTML = `
                    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                                background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 1001;">
                        <h3>补卡信息</h3>
                        <div style="margin: 10px 0;">
                            <label>开始时间：</label>
                            <input type="time" id="startTime" value="09:00">
                        </div>
                        <div style="margin: 10px 0;">
                            <label>结束时间：</label>
                            <input type="time" id="endTime" value="18:00">
                        </div>
                        <div style="margin: 10px 0;">
                            <label>打卡内容：</label>
                            <input type="text" id="makeupContent" placeholder="可选">
                        </div>
                        <div style="text-align: right; margin-top: 15px;">
                            <button id="cancelMakeup" style="margin-right: 10px;">取消</button>
                            <button id="confirmMakeup">确定</button>
                        </div>
                    </div>
                    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                                background: rgba(0,0,0,0.5); z-index: 1000;">
                    </div>
                `;
                document.body.appendChild(dialog);

                document.getElementById('cancelMakeup').onclick = () => {
                    document.body.removeChild(dialog);
                };

                document.getElementById('confirmMakeup').onclick = () => {
                    const startTime = document.getElementById('startTime').value;
                    const endTime = document.getElementById('endTime').value;
                    const content = document.getElementById('makeupContent').value;
                    if (startTime && endTime) {
                        const [startHours, startMinutes] = startTime.split(':');
                        const [endHours, endMinutes] = endTime.split(':');
                        const startDate = new Date(date);
                        const endDate = new Date(date);
                        startDate.setHours(parseInt(startHours), parseInt(startMinutes));
                        endDate.setHours(parseInt(endHours), parseInt(endMinutes));
                        
                        // 验证当天的补卡时间
                        if (selectedDate.getTime() === today.getTime() && 
                            (startDate > now || endDate > now)) {
                            modal.alert('今天只能补卡当前时间之前的时段！');
                            return;
                        }

                        checkIn.makeupCheckIn(startDate, content, endDate);
                        this.updateUI();
                    }
                    document.body.removeChild(dialog);
                };
            });
        });

        // 日历月份变化事件
        document.addEventListener('monthChanged', () => {
            this.updateCalendar();
        });

        // 导出按钮事件
        document.getElementById('exportRecords').addEventListener('click', () => {
            recordManager.exportToExcel(checkIn.getAllRecords());
        });

        // 导入按钮事件
        document.getElementById('importRecords').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const importedRecords = await recordManager.importFromExcel(file);
                    checkIn.records.push(...importedRecords);
                    checkIn.saveRecords();
                    this.updateUI();
                    modal.alert('导入成功！');
                } catch (error) {
                    modal.alert(error.message);
                }
            }
        });

        // 生成测试数据
        if (!localStorage.getItem('checkInRecords')) {
            const testRecords = recordManager.generateTestData();
            checkIn.records.push(...testRecords);
            checkIn.saveRecords();
            this.updateUI();
        }
    }

    // 结束打卡
    endCheckIn() {
        modal.prompt('请输入打卡内容（可选）：', '', (content) => {
            checkIn.endCheckIn(content);
            document.getElementById('startCheckIn').textContent = '开始打卡';
            document.getElementById('timer').textContent = '00:00:00';
            this.updateUI();
        });
    }

    // 编辑记录
    editRecord(id) {
        const record = checkIn.records.find(r => r.id === parseInt(id));
        if (record) {
            modal.prompt('请输入新的内容：', record.content, (newContent) => {
                checkIn.editRecord(parseInt(id), newContent);
                this.updateUI();
            });
        }
    }

    // 删除记录
    deleteRecord(id) {
        modal.confirm('确定要删除这条记录吗？', () => {
            checkIn.deleteRecord(parseInt(id));
            this.updateUI();
        });
    }

    // 更新界面
    updateUI() {
        this.updateCalendar();
        this.updateRecordList();
        stats.updateCharts();
    }

    // 更新日历
    updateCalendar() {
        const calendarContainer = document.getElementById('calendar');
        calendarContainer.innerHTML = calendar.generateCalendar(checkIn.getAllRecords());
    }

    // 更新记录列表
    updateRecordList(records = checkIn.getAllRecords()) {
        const recordsContainer = document.getElementById('records');
        recordManager.renderRecordList(records, recordsContainer);
    }
}

window.app = new App();
// 将calendar对象暴露给全局，供日历HTML事件使用
window.calendar = calendar;