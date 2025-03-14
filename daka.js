// 存储记录的键名
const STORAGE_KEY = "daka_records";

// 获取记录
function getRecords() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

// 保存记录
function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// 生成唯一ID
function generateId() {
  return Date.now() + Math.random().toString(36).substr(2);
}

// 文件转Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

// 提交打卡记录
async function submitRecord(isStart = true) {
  const content = document.getElementById("content").value.trim();
  const mediaFiles = document.getElementById("mediaInput").files;
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // 检查今天是否已经打卡
  const records = getRecords();
  const todayRecord = records.find((r) => r.date === today);

  // 如果是开始打卡，检查是否已经有开始记录
  if (isStart && todayRecord && todayRecord.startTime) {
    alert("今天已经开始打卡了！");
    return;
  }

  // 如果是结束打卡，检查是否有开始记录
  if (!isStart && (!todayRecord || !todayRecord.startTime)) {
    alert("请先开始打卡！");
    return;
  }

  const mediaData = [];
  for (const file of mediaFiles) {
    const base64 = await fileToBase64(file);
    mediaData.push({
      type: file.type,
      data: base64,
    });
  }

  if (todayRecord) {
    // 更新现有记录
    todayRecord.content = content || todayRecord.content;
    todayRecord.media = mediaData.length ? mediaData : todayRecord.media;
    todayRecord.endTime = !isStart ? now.getTime() : todayRecord.endTime;
  } else {
    // 创建新记录
    const record = {
      id: generateId(),
      content,
      media: mediaData,
      timestamp: Date.now(),
      date: today,
      startTime: isStart ? now.getTime() : null,
      endTime: !isStart ? now.getTime() : null,
    };
    records.push(record);
  }

  saveRecords(records);

  document.getElementById("content").value = "";
  document.getElementById("mediaInput").value = "";
  document.getElementById("mediaPreview").innerHTML = "";

  renderRecords();
  renderCalendar();
}

// 添加打卡切换功能
let clockTimer = null;

function toggleClock() {
  const button = document.getElementById("clockButton");
  const isStart = button.textContent === "开始打卡";

  if (isStart) {
    submitRecord(true);
    button.textContent = "结束打卡";
    // 一小时后自动结束
    clockTimer = setTimeout(() => {
      if (button.textContent === "结束打卡") {
        toggleClock();
      }
    }, 3600000); // 1小时 = 3600000毫秒
  } else {
    submitRecord(false);
    button.textContent = "开始打卡";
    if (clockTimer) {
      clearTimeout(clockTimer);
      clockTimer = null;
    }
  }
}

// 修改渲染记录列表显示时间
function renderRecords(searchText = "") {
  const records = getRecords().filter(
    (record) =>
      !searchText ||
      record.content.toLowerCase().includes(searchText.toLowerCase())
  );

  const recordList = document.getElementById("recordList");
  recordList.innerHTML = records
    .reverse()
    .map(
      (record) => `
        <div class="record-item" data-id="${record.id}">
            <div style="display: flex; justify-content: space-between;">
                <div>
                    ${new Date(record.timestamp).toLocaleDateString()}
                    ${
                      record.startTime
                        ? `
                        <br>开始时间: ${new Date(
                          record.startTime
                        ).toLocaleTimeString()}
                    `
                        : ""
                    }
                    ${
                      record.endTime
                        ? `
                        ~ 结束时间: ${new Date(
                          record.endTime
                        ).toLocaleTimeString()}
                        <br>时长: ${(() => {
                          const duration = Math.floor(
                            (record.endTime - record.startTime) / (1000 * 60)
                          );
                          const hours = Math.floor(duration / 60);
                          const minutes = duration % 60;
                          return `${hours}小时${minutes}分钟`;
                        })()}
                    `
                        : ""
                    }
                </div>
                <div>
                    <button class="btn" onclick="editRecord('${
                      record.id
                    }')">编辑</button>
                    <button class="btn" onclick="deleteRecord('${
                      record.id
                    }')">删除</button>
                </div>
            </div>
            <div style="margin: 10px 0;">${record.content}</div>
            <div>
                ${record.media
                  .map((media) => {
                    if (media.type.startsWith("image/")) {
                      return `<img src="${media.data}" class="media-preview">`;
                    } else if (media.type.startsWith("video/")) {
                      return `<video src="${media.data}" class="media-preview" controls></video>`;
                    }
                    return "";
                  })
                  .join("")}
            </div>
        </div>
    `
    )
    .join("");
}

// 渲染日历
// 添加当前显示月份的全局变量
let currentDisplayDate = new Date();

function renderCalendar() {
  const records = getRecords();
  const currentMonth = currentDisplayDate.getMonth();
  const currentYear = currentDisplayDate.getFullYear();

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  const recordDates = new Map(records.map(r => [r.date, r]));

  let calendarHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <button class="btn" onclick="changeMonth(-1)">上个月</button>
            <h2>${currentYear}年${currentMonth + 1}月</h2>
            <button class="btn" onclick="changeMonth(1)">下个月</button>
        </div>
        <div class="calendar-grid">
            <div class="calendar-day">日</div>
            <div class="calendar-day">一</div>
            <div class="calendar-day">二</div>
            <div class="calendar-day">三</div>
            <div class="calendar-day">四</div>
            <div class="calendar-day">五</div>
            <div class="calendar-day">六</div>
    `;

  // 填充月初空白天数
  for (let i = 0; i < firstDay.getDay(); i++) {
    calendarHTML += '<div class="calendar-day"></div>';
  }

  // 填充日期
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const record = recordDates.get(date);
    const isToday = date === new Date().toISOString().split("T")[0];
    calendarHTML += `
            <div class="calendar-day ${record ? "has-record" : ""} ${isToday ? "today" : ""}" 
                onclick="handleDayClick('${date}')" 
                data-date="${date}">
                <div>${day}</div>
                ${record ? `<div class="calendar-content">${record.content}</div>` : ''}
            </div>
        `;
  }

  calendarHTML += "</div>";
  document.getElementById("calendar").innerHTML = calendarHTML;
}

// 修改点击处理函数
async function handleDayClick(date) {
  const today = new Date().toISOString().split("T")[0];
  if (date !== today) {
    return; // 只允许点击当天日期
  }

  const content = prompt("请输入打卡内容：");
  if (content === null) return; // 用户取消输入

  document.getElementById("content").value = content;
  
  const records = getRecords();
  const todayRecord = records.find((r) => r.date === today);

  if (!todayRecord) {
    // 如果今天没有记录，则开始打卡
    const button = document.getElementById("clockButton");
    if (button.textContent === "开始打卡") {
      toggleClock();
    }
  } else if (todayRecord.startTime && !todayRecord.endTime) {
    // 如果已经开始但未结束，则结束打卡
    const button = document.getElementById("clockButton");
    if (button.textContent === "结束打卡") {
      toggleClock();
    }
  }
}

// 添加月份切换函数
function changeMonth(delta) {
  currentDisplayDate.setMonth(currentDisplayDate.getMonth() + delta);
  renderCalendar();
}

// 修改初始化函数
window.onload = () => {
  currentDisplayDate = new Date(); // 重置为当前月份
  renderRecords();
  renderCalendar();
};

// 导出记录为 Excel
function exportRecords() {
  const records = getRecords();

  // 转换数据格式为 Excel 友好的格式
  const excelData = records.map((record) => ({
    日期: record.date,
    开始时间: record.startTime
      ? new Date(record.startTime).toLocaleTimeString()
      : "",
    结束时间: record.endTime
      ? new Date(record.endTime).toLocaleTimeString()
      : "",
    时长:
      record.startTime && record.endTime
        ? (() => {
            const duration = Math.floor(
              (record.endTime - record.startTime) / (1000 * 60)
            );
            const hours = Math.floor(duration / 60);
            const minutes = duration % 60;
            return `${hours}小时${minutes}分钟`;
          })()
        : "",
    内容: record.content,
  }));

  // 创建工作簿和工作表
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // 设置列宽
  const colWidths = [
    { wch: 12 }, // 日期
    { wch: 10 }, // 开始时间
    { wch: 10 }, // 结束时间
    { wch: 15 }, // 时长
    { wch: 50 }, // 内容
  ];
  ws["!cols"] = colWidths;

  // 添加工作表到工作簿
  XLSX.utils.book_append_sheet(wb, ws, "打卡记录");

  // 生成文件并下载
  XLSX.writeFile(wb, `打卡记录_${new Date().toISOString().split("T")[0]}.xlsx`);
}

// 导入记录
document.getElementById("importFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const reader = new FileReader();
    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      // 获取第一个工作表
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // 转换数据格式
      const importedRecords = jsonData.map((row) => {
        const date = row["日期"];
        const startTimeStr = row["开始时间"];
        const endTimeStr = row["结束时间"];

        // 将时间字符串转换为时间戳
        const getTimeStamp = (dateStr, timeStr) => {
          if (!timeStr) return null;
          const [hours, minutes, seconds] = timeStr.split(":").map(Number);
          const timestamp = new Date(dateStr);
          timestamp.setHours(hours, minutes, seconds);
          return timestamp.getTime();
        };

        return {
          id: generateId(),
          date: date,
          content: row["内容"] || "",
          startTime: getTimeStamp(date, startTimeStr),
          endTime: getTimeStamp(date, endTimeStr),
          timestamp: new Date(date).getTime(),
          media: [],
        };
      });

      // 合并记录
      const currentRecords = getRecords();
      const recordMap = new Map(currentRecords.map((r) => [r.date, r]));

      importedRecords.forEach((record) => {
        recordMap.set(record.date, record);
      });

      const mergedRecords = Array.from(recordMap.values());
      saveRecords(mergedRecords);

      renderRecords();
      renderCalendar();

      alert("导入成功！");
    };
    reader.readAsArrayBuffer(file);
  } catch (error) {
    alert("导入失败：" + error.message);
  }
  e.target.value = "";
});

// 编辑记录
// 编辑记录
function editRecord(id) {
    const records = getRecords();
    const record = records.find(r => r.id === id);
    if (!record) return;

    const newContent = prompt('编辑内容：', record.content);
    if (newContent === null) return;

    record.content = newContent.trim();
    saveRecords(records);
    renderRecords();
    renderCalendar(); // 添加这行来更新日历显示
}

// 删除记录
function deleteRecord(id) {
  if (!confirm("确定要删除这条记录吗？")) return;

  const records = getRecords();
  const index = records.findIndex((r) => r.id === id);
  if (index === -1) return;

  records.splice(index, 1);
  saveRecords(records);
  renderRecords();
  renderCalendar();
}

// 搜索功能
document.querySelector(".search-box").addEventListener("input", (e) => {
  renderRecords(e.target.value);
});

// 预览媒体文件
document.getElementById("mediaInput").addEventListener("change", async (e) => {
  const preview = document.getElementById("mediaPreview");
  preview.innerHTML = "";

  for (const file of e.target.files) {
    const reader = new FileReader();
    reader.onload = function (e) {
      if (file.type.startsWith("image/")) {
        preview.innerHTML += `<img src="${e.target.result}" class="media-preview">`;
      } else if (file.type.startsWith("video/")) {
        preview.innerHTML += `<video src="${e.target.result}" class="media-preview" controls></video>`;
      }
    };
    reader.readAsDataURL(file);
  }
});

// 初始化
window.onload = () => {
  renderRecords();
  renderCalendar();
};
