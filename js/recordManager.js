// 记录管理相关功能
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.19.3/package/xlsx.mjs';

class RecordManager {
    // 导出记录为Excel
    exportToExcel(records) {
        const worksheet = XLSX.utils.json_to_sheet(records.map(record => ({
            日期: new Date(record.date).toLocaleString(),
            内容: record.content,
            时长: record.duration,
            是否补卡: record.isMakeup ? '是' : '否'
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '打卡记录');

        // 生成Excel文件并下载
        XLSX.writeFile(workbook, `打卡记录_${new Date().toLocaleDateString()}.xlsx`);
    }

    // 导入Excel记录
    async importFromExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const records = XLSX.utils.sheet_to_json(worksheet);

                    // 转换格式
                    const convertedRecords = records.map(record => ({
                        id: Date.now() + Math.random(),
                        date: new Date(record.日期),
                        content: record.内容 || '',
                        duration: record.时长 || '00:00:00',
                        isMakeup: record.是否补卡 === '是'
                    }));

                    resolve(convertedRecords);
                } catch (error) {
                    reject(new Error('导入失败：文件格式错误'));
                }
            };
            reader.onerror = () => reject(new Error('导入失败：文件读取错误'));
            reader.readAsArrayBuffer(file);
        });
    }

    // 渲染记录列表
    renderRecordList(records, container) {
        const html = `
            <div class="record-item">
                <div class="record-date">打卡时间</div>
                <div class="record-content">内容</div>
                <div class="record-duration">用时</div>
                <div class="record-actions">操作</div>
            </div>
            ${records.map(record => `
                <div class="record-item ${record.isMakeup ? 'makeup' : ''}" data-id="${record.id}">
                    <div class="record-date">${new Date(record.date).toLocaleString()}${record.isMakeup ? '（补卡）' : ''}</div>
                    <div class="record-content">${record.content || '无内容'}</div>
                    <div class="record-duration">${record.duration}</div>
                    <div class="record-actions">
                        <button onclick="app.editRecord('${record.id}')">编辑</button>
                        <button onclick="app.deleteRecord('${record.id}')">删除</button>
                    </div>
                </div>
            `).join('')}`;

        container.innerHTML = html;
    }
}

export default new RecordManager();