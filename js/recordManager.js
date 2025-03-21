// 记录管理相关功能
import modal from "./modal.js";

class RecordManager {
  constructor() {
    this.itemHeight = this.getItemHeight(); // 根据设备动态设置记录项高度
    this.bufferSize = 5; // 上下缓冲区的记录数
    this.visibleCount = 0; // 可视区域内可显示的记录数
    this.startIndex = 0; // 当前渲染的起始索引
    this.container = null; // 列表容器元素
    this.content = null; // 内容容器元素
    this.records = []; // 当前显示的记录数据

    // 监听窗口大小变化
    window.addEventListener("resize", () => {
      const newHeight = this.getItemHeight();
      if (newHeight !== this.itemHeight) {
        this.itemHeight = newHeight;
        if (this.container) {
          this.visibleCount = Math.ceil(
            this.container.clientHeight / this.itemHeight
          );
          this.renderItems();
        }
      }
    });
  }

  // 根据设备宽度返回合适的记录项高度
  getItemHeight() {
    return window.innerWidth > 768 ? 120 : 180;
  }

  // 搜索记录
  searchRecords(records, { startDate, endDate, keyword }) {
    return records.filter((record) => {
      const recordDate = new Date(record.date);
      const matchesDate =
        (!startDate || recordDate >= new Date(startDate)) &&
        (!endDate || recordDate <= new Date(endDate));
      const matchesKeyword =
        !keyword ||
        record.content.toLowerCase().includes(keyword.toLowerCase());
      return matchesDate && matchesKeyword;
    });
  }

  // 导出到Excel
  async exportToExcel(records) {
    modal.showLoading("正在导出数据...");
    try {
      const XLSX = await import(
        "https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs"
      );
      const ws = XLSX.utils.json_to_sheet(
        records.map((record) => ({
          日期: new Date(record.date).toLocaleString(),
          内容: record.content || "无内容",
          用时: record.duration,
          类型: record.isMakeup ? "补卡" : "正常打卡",
        }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "打卡记录");
      XLSX.writeFile(wb, "打卡记录.xlsx");
      modal.hideLoading();
      modal.alert("导出成功！");
    } catch (error) {
      console.error("导出失败:", error);
      modal.hideLoading();
      modal.alert("导出失败，请稍后重试");
    }
  }

  // 从Excel导入
  async importFromExcel(file) {
    if (!file.name.endsWith(".xlsx")) {
      throw new Error("请选择正确的Excel文件(.xlsx)");
    }

    modal.showLoading("正在导入数据...");
    try {
      const XLSX = await import(
        "https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs"
      );
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);

      // 验证工作表是否存在
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error("Excel文件中没有找到工作表");
      }

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // 验证工作表是否为空
      if (!worksheet || Object.keys(worksheet).length <= 1) {
        throw new Error("Excel文件内容为空");
      }

      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData || !jsonData.length) {
        throw new Error("没有找到可导入的有效数据");
      }

      // 验证数据格式
      const requiredFields = ["日期", "内容", "用时", "类型"];
      const firstRow = jsonData[0];
      const missingFields = requiredFields.filter(
        (field) => !(field in firstRow)
      );

      if (missingFields.length > 0) {
        throw new Error(
          `Excel文件格式错误：缺少必要的列 ${missingFields.join(", ")}`
        );
      }

      const importedRecords = jsonData.map((row) => {
        const date = new Date(row.日期);
        if (isNaN(date.getTime())) {
          throw new Error("日期格式无效");
        }

        return {
          id: Date.now() + Math.random(),
          date: date,
          content: row.内容 || "",
          duration: row.用时 || "",
          isMakeup: row.类型 === "补卡",
          endTime: date,
        };
      });

      modal.hideLoading();
      return importedRecords;
    } catch (error) {
      console.error("导入失败:", error);
      modal.hideLoading();
      throw new Error(error.message || "导入失败，请确保文件格式正确");
    }
  }

  // 初始化虚拟列表
  initVirtualList(container) {
    this.container = container;
    this.container.style.overflow = "auto";
    this.container.style.position = "relative";

    // 计算可视区域能显示的记录数
    this.visibleCount = Math.ceil(
      this.container.clientHeight / this.itemHeight
    );

    // 创建内容容器
    this.content = document.createElement("div");
    this.content.style.position = "relative";
    this.container.appendChild(this.content);

    // 添加滚动事件监听
    this.container.addEventListener("scroll", this.onScroll.bind(this));
  }

  // 滚动事件处理
  onScroll() {
    const scrollTop = this.container.scrollTop;
    const newStartIndex = Math.floor(scrollTop / this.itemHeight);

    if (newStartIndex !== this.startIndex) {
      this.startIndex = Math.max(0, newStartIndex - this.bufferSize);
      this.renderItems();
    }
  }

  // 渲染可视区域的记录项
  renderItems() {
    const fragment = document.createDocumentFragment();
    const endIndex = Math.min(
      this.startIndex + this.visibleCount + 2 * this.bufferSize,
      this.records.length
    );

    // 清空当前内容
    this.content.innerHTML = "";

    // 设置内容容器的总高度
    this.content.style.height = `${this.records.length * this.itemHeight}px`;

    // 只渲染可视区域的记录项
    for (let i = this.startIndex; i < endIndex; i++) {
      const record = this.records[i];
      const item = document.createElement("div");
      item.className = `record-item ${record.isMakeup ? "makeup" : ""}`;
      item.style.position = "absolute";
      item.style.top = `${i * this.itemHeight}px`;
      item.style.height = `${this.itemHeight - 10}px`;
      item.style.left = "0";
      item.style.right = "0";
      item.style.transform = "translate3d(0,0,0)";
      item.style.boxSizing = "border-box";
      item.style.padding = window.innerWidth > 768 ? "8px" : "10px";
      item.style.paddingBottom = window.innerWidth > 768 ? "16px" : "20px";
      item.style.backgroundColor = "#fff";
      item.style.borderRadius = "8px";
      item.style.boxShadow = "0 0 2px 1px rgba(0,0,0,0.1)";
      item.innerHTML = `
                <div class="record-date">打卡时间：${new Date(
                  record.date
                ).toLocaleString()}${record.isMakeup ? "（补卡）" : ""}</div>
                <div class="record-content">内容：${
                  record.content || "无内容"
                }</div>
                <div class="record-duration">用时：${record.duration}</div>
                <div class="record-actions">
                    <button onclick="app.editRecord('${
                      record.id
                    }')">编辑</button>
                    <button class="record-actions-del" onclick="app.deleteRecord('${
                      record.id
                    }')">删除</button>
                </div>
            `;

      fragment.appendChild(item);
    }

    this.content.appendChild(fragment);
  }

  // 渲染记录列表
  renderRecordList(records, container) {
    this.records = records;

    // 添加记录总数显示
    const recordsTitle = document.querySelector("#list-sum");
    if (recordsTitle) {
      recordsTitle.textContent = `共 ${records.length} 条记录`;
      recordsTitle.style.cssText = `
         font-size:12px;
         color:rgb(157 157 157)
      `;
    }

    // 如果是首次渲染，初始化虚拟列表
    if (!this.container) {
      this.initVirtualList(container);
    }

    // 重置起始索引并渲染
    this.startIndex = 0;
    this.renderItems();
  }

  // 生成测试数据
  generateTestData(count = 1000) {
    const records = [];
    const contents = [
      "开发任务",
      "需求评审",
      "代码审查",
      "项目会议",
      "技术分享",
      "日常工作",
    ];
    const now = new Date();
    let lastEndTime = now;

    for (let i = 0; i < count; i++) {
      // 确保每条记录的开始时间晚于上一条记录的结束时间
      const date = new Date(
        lastEndTime.getTime() - Math.random() * 24 * 60 * 60 * 1000
      );
      const hours = Math.floor(Math.random() * 8) + 1;
      const minutes = Math.floor(Math.random() * 60);
      const seconds = Math.floor(Math.random() * 60);
      const duration = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      const endTime = new Date(
        date.getTime() + (hours * 3600000 + minutes * 60000 + seconds * 1000)
      );

      records.push({
        id: Date.now() + Math.random(),
        date: date,
        content: contents[Math.floor(Math.random() * contents.length)],
        duration: duration,
        endTime: endTime,
        isMakeup: Math.random() > 0.8,
      });

      lastEndTime = date; // 更新上一条记录的结束时间
    }

    // 按时间倒序排列
    return records.sort((a, b) => b.date - a.date);
  }
}

export default new RecordManager();
