// 模态窗口管理器
class ModalManager {
    constructor() {
        this.modalContainer = null;
    }

    // 创建基础模态窗口结构
    createModal(options) {
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div class="modal-container" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                        background: rgba(0,0,0,0.5); z-index: 1000; display: flex; 
                        justify-content: center; align-items: center; opacity: 0; 
                        transition: opacity 0.3s ease-in-out;">
                <div class="modal-content" style="background: white; padding: 30px; border-radius: 8px; 
                            box-shadow: 0 4px 20px rgba(0,0,0,0.15); min-width: 300px; max-width: 90%;
                            transform: translateY(-20px); transition: transform 0.3s ease-in-out;">
                    <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 1.5em; color: #333;">${options.title || ''}</h3>
                    <div class="modal-body" style="color: #666; line-height: 1.5;">${options.content || ''}</div>
                    <div class="modal-footer" style="text-align: right; margin-top: 25px;"></div>
                </div>
            </div>
        `;

        this.modalContainer = modal;
        document.body.appendChild(modal);
        // 触发动画
        requestAnimationFrame(() => {
            modal.firstElementChild.style.opacity = '1';
            modal.querySelector('.modal-content').style.transform = 'translateY(0)';
        });
        return modal;
    }

    // 显示确认对话框
    confirm(message, onConfirm, onCancel) {
        const modal = this.createModal({
            title: '确认',
            content: message
        });

        const footer = modal.querySelector('.modal-footer');
        const confirmBtn = document.createElement('button');
        const cancelBtn = document.createElement('button');

        cancelBtn.textContent = '取消';
        cancelBtn.style.cssText = 'padding: 8px 20px; border-radius: 4px; border: none; cursor: pointer; font-size: 14px; transition: all 0.2s ease; background:rgb(206, 206, 206); color: white;';
        cancelBtn.onmouseover = () => cancelBtn.style.background = '#43A047';
        cancelBtn.onmouseout = () => cancelBtn.style.background = '#4CAF50';
        cancelBtn.style.marginRight = '10px';
        cancelBtn.onclick = () => {
            this.closeModal();
            if (onCancel) onCancel();
        };

        confirmBtn.textContent = '确定';
        confirmBtn.style.cssText = 'padding: 8px 20px; border-radius: 4px; border: none; cursor: pointer; font-size: 14px; transition: all 0.2s ease; background: #4CAF50; color: white;';
        confirmBtn.onmouseover = () => confirmBtn.style.background = '#43A047';
        confirmBtn.onmouseout = () => confirmBtn.style.background = '#4CAF50';
        confirmBtn.onclick = () => {
            this.closeModal();
            if (onConfirm) onConfirm();
        };

        footer.appendChild(cancelBtn);
        footer.appendChild(confirmBtn);
    }

    // 显示提示对话框
    alert(message, onClose) {
        const modal = this.createModal({
            title: '提示',
            content: message
        });

        const footer = modal.querySelector('.modal-footer');
        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = '确定';
        confirmBtn.style.cssText = 'padding: 8px 20px; border-radius: 4px; border: none; cursor: pointer; font-size: 14px; transition: all 0.2s ease; background: #4CAF50; color: white;';
        confirmBtn.onmouseover = () => confirmBtn.style.background = '#43A047';
        confirmBtn.onmouseout = () => confirmBtn.style.background = '#4CAF50';
        confirmBtn.onclick = () => {
            this.closeModal();
            if (onClose) onClose();
        };

        footer.appendChild(confirmBtn);
    }

    // 显示输入对话框
    prompt(message, defaultValue = '', onConfirm, onCancel) {
        const modal = this.createModal({
            title: '输入',
            content: `
                <div>${message}</div>
                <input type="text" id="modalInput" value="${defaultValue}" 
                    style="width: 100%; margin-top: 10px; padding: 5px; box-sizing: border-box;">
            `
        });

        const footer = modal.querySelector('.modal-footer');
        const confirmBtn = document.createElement('button');
        const cancelBtn = document.createElement('button');

        const buttonStyle = 'padding: 8px 20px; border-radius: 4px; border: none; cursor: pointer; font-size: 14px; transition: all 0.2s ease;';
        cancelBtn.style.cssText = buttonStyle + 'background: rgb(206, 206, 206); color: white; margin-right: 10px;';
        confirmBtn.style.cssText = buttonStyle + 'background: #4CAF50; color: white;';

        cancelBtn.onmouseover = () => cancelBtn.style.background = '#e8e8e8';
        cancelBtn.onmouseout = () => cancelBtn.style.background = '#f5f5f5';
        confirmBtn.onmouseover = () => confirmBtn.style.background = '#43A047';
        confirmBtn.onmouseout = () => confirmBtn.style.background = '#4CAF50';
        cancelBtn.textContent = '取消';
        cancelBtn.style.marginRight = '10px';
        cancelBtn.onclick = () => {
            this.closeModal();
            if (onCancel) onCancel();
        };

        confirmBtn.textContent = '确定';
        confirmBtn.onclick = () => {
            const input = modal.querySelector('#modalInput');
            this.closeModal();
            if (onConfirm) onConfirm(input.value);
        };

        footer.appendChild(cancelBtn);
        footer.appendChild(confirmBtn);

        // 聚焦输入框
        setTimeout(() => {
            modal.querySelector('#modalInput').focus();
        }, 100);
    }

    // 关闭模态窗口
    closeModal() {
        if (this.modalContainer) {
            const modalElement = this.modalContainer.firstElementChild;
            const contentElement = modalElement.querySelector('.modal-content');
            
            modalElement.style.opacity = '0';
            contentElement.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                document.body.removeChild(this.modalContainer);
                this.modalContainer = null;
            }, 300);
        }
    }
}

export default new ModalManager();