/**
 * Unix 权限计算器
 * @description chmod 权限数字与符号表示法互转
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // DOM 元素
    const numericInputEl = document.getElementById('numeric-input');
    const symbolicOutputEl = document.getElementById('symbolic-output');
    const chmodCommandEl = document.getElementById('chmod-command');
    const ownerValueEl = document.getElementById('owner-value');
    const groupValueEl = document.getElementById('group-value');
    const othersValueEl = document.getElementById('others-value');

    // 权限复选框
    const checkboxes = {
        owner: {
            r: document.getElementById('owner-r'),
            w: document.getElementById('owner-w'),
            x: document.getElementById('owner-x')
        },
        group: {
            r: document.getElementById('group-r'),
            w: document.getElementById('group-w'),
            x: document.getElementById('group-x')
        },
        others: {
            r: document.getElementById('others-r'),
            w: document.getElementById('others-w'),
            x: document.getElementById('others-x')
        }
    };

    // 特殊权限复选框
    const specialCheckboxes = {
        setuid: document.getElementById('setuid'),
        setgid: document.getElementById('setgid'),
        sticky: document.getElementById('sticky')
    };

    // 权限值映射
    const PERM_VALUES = { r: 4, w: 2, x: 1 };

    /**
     * 从数字计算权限位
     * @param {number} value - 0-7 的数字
     * @returns {Object} - 权限对象 {r, w, x}
     */
    function valueToPerms(value) {
        return {
            r: (value & 4) !== 0,
            w: (value & 2) !== 0,
            x: (value & 1) !== 0
        };
    }

    /**
     * 从权限位计算数字
     * @param {Object} perms - 权限对象 {r, w, x}
     * @returns {number} - 0-7 的数字
     */
    function permsToValue(perms) {
        let value = 0;
        if (perms.r) value += 4;
        if (perms.w) value += 2;
        if (perms.x) value += 1;
        return value;
    }

    /**
     * 获取当前文件类型
     * @returns {string} - 文件类型字符
     */
    function getFileType() {
        const selected = document.querySelector('input[name="filetype"]:checked');
        return selected ? selected.value : '-';
    }

    /**
     * 生成符号表示
     * @returns {string} - 符号表示字符串
     */
    function generateSymbolic() {
        const fileType = getFileType();
        let symbolic = fileType;

        // 获取特殊权限
        const setuid = specialCheckboxes.setuid?.checked || false;
        const setgid = specialCheckboxes.setgid?.checked || false;
        const sticky = specialCheckboxes.sticky?.checked || false;

        // 所有者权限
        const ownerPerms = {
            r: checkboxes.owner.r?.checked || false,
            w: checkboxes.owner.w?.checked || false,
            x: checkboxes.owner.x?.checked || false
        };
        symbolic += ownerPerms.r ? 'r' : '-';
        symbolic += ownerPerms.w ? 'w' : '-';
        if (setuid) {
            symbolic += ownerPerms.x ? 's' : 'S';
        } else {
            symbolic += ownerPerms.x ? 'x' : '-';
        }

        // 组权限
        const groupPerms = {
            r: checkboxes.group.r?.checked || false,
            w: checkboxes.group.w?.checked || false,
            x: checkboxes.group.x?.checked || false
        };
        symbolic += groupPerms.r ? 'r' : '-';
        symbolic += groupPerms.w ? 'w' : '-';
        if (setgid) {
            symbolic += groupPerms.x ? 's' : 'S';
        } else {
            symbolic += groupPerms.x ? 'x' : '-';
        }

        // 其他权限
        const othersPerms = {
            r: checkboxes.others.r?.checked || false,
            w: checkboxes.others.w?.checked || false,
            x: checkboxes.others.x?.checked || false
        };
        symbolic += othersPerms.r ? 'r' : '-';
        symbolic += othersPerms.w ? 'w' : '-';
        if (sticky) {
            symbolic += othersPerms.x ? 't' : 'T';
        } else {
            symbolic += othersPerms.x ? 'x' : '-';
        }

        return symbolic;
    }

    /**
     * 获取完整的数字权限
     * @returns {string} - 数字权限字符串
     */
    function getNumericMode() {
        const owner = permsToValue({
            r: checkboxes.owner.r?.checked || false,
            w: checkboxes.owner.w?.checked || false,
            x: checkboxes.owner.x?.checked || false
        });
        const group = permsToValue({
            r: checkboxes.group.r?.checked || false,
            w: checkboxes.group.w?.checked || false,
            x: checkboxes.group.x?.checked || false
        });
        const others = permsToValue({
            r: checkboxes.others.r?.checked || false,
            w: checkboxes.others.w?.checked || false,
            x: checkboxes.others.x?.checked || false
        });

        // 特殊权限位
        let special = 0;
        if (specialCheckboxes.setuid?.checked) special += 4;
        if (specialCheckboxes.setgid?.checked) special += 2;
        if (specialCheckboxes.sticky?.checked) special += 1;

        if (special > 0) {
            return `${special}${owner}${group}${others}`;
        }
        return `${owner}${group}${others}`;
    }

    /**
     * 更新显示
     */
    function updateDisplay() {
        // 更新各角色的值显示
        ownerValueEl.textContent = permsToValue({
            r: checkboxes.owner.r?.checked || false,
            w: checkboxes.owner.w?.checked || false,
            x: checkboxes.owner.x?.checked || false
        });
        groupValueEl.textContent = permsToValue({
            r: checkboxes.group.r?.checked || false,
            w: checkboxes.group.w?.checked || false,
            x: checkboxes.group.x?.checked || false
        });
        othersValueEl.textContent = permsToValue({
            r: checkboxes.others.r?.checked || false,
            w: checkboxes.others.w?.checked || false,
            x: checkboxes.others.x?.checked || false
        });

        // 更新符号显示
        symbolicOutputEl.textContent = generateSymbolic();

        // 更新数字输入框（不触发循环）
        const numericMode = getNumericMode();
        if (numericInputEl.value !== numericMode) {
            numericInputEl.value = numericMode;
        }

        // 更新 chmod 命令
        chmodCommandEl.textContent = `chmod ${numericMode} filename`;
    }

    /**
     * 从数字模式更新复选框
     * @param {string} mode - 数字模式字符串
     */
    function setFromNumeric(mode) {
        // 清理输入
        mode = mode.replace(/[^0-7]/g, '');

        if (mode.length === 0) {
            return;
        }

        let special = 0;
        let owner, group, others;

        if (mode.length === 4) {
            special = parseInt(mode[0], 10);
            owner = parseInt(mode[1], 10);
            group = parseInt(mode[2], 10);
            others = parseInt(mode[3], 10);
        } else if (mode.length === 3) {
            owner = parseInt(mode[0], 10);
            group = parseInt(mode[1], 10);
            others = parseInt(mode[2], 10);
        } else {
            return;
        }

        // 验证值范围
        if (owner > 7 || group > 7 || others > 7 || special > 7) {
            return;
        }

        // 设置基本权限
        const ownerPerms = valueToPerms(owner);
        const groupPerms = valueToPerms(group);
        const othersPerms = valueToPerms(others);

        checkboxes.owner.r.checked = ownerPerms.r;
        checkboxes.owner.w.checked = ownerPerms.w;
        checkboxes.owner.x.checked = ownerPerms.x;

        checkboxes.group.r.checked = groupPerms.r;
        checkboxes.group.w.checked = groupPerms.w;
        checkboxes.group.x.checked = groupPerms.x;

        checkboxes.others.r.checked = othersPerms.r;
        checkboxes.others.w.checked = othersPerms.w;
        checkboxes.others.x.checked = othersPerms.x;

        // 设置特殊权限
        specialCheckboxes.setuid.checked = (special & 4) !== 0;
        specialCheckboxes.setgid.checked = (special & 2) !== 0;
        specialCheckboxes.sticky.checked = (special & 1) !== 0;

        updateDisplay();
    }

    // 事件监听 - 数字输入
    if (numericInputEl) {
        numericInputEl.addEventListener('input', () => {
            setFromNumeric(numericInputEl.value);
        });
    }

    // 事件监听 - 权限复选框
    document.querySelectorAll('.perm-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateDisplay);
    });

    // 事件监听 - 文件类型
    document.querySelectorAll('input[name="filetype"]').forEach(radio => {
        radio.addEventListener('change', updateDisplay);
    });

    // 事件监听 - 预设按钮
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.getAttribute('data-mode');
            if (mode) {
                numericInputEl.value = mode;
                setFromNumeric(mode);
            }
        });
    });

    // 事件监听 - 参考项点击
    document.querySelectorAll('.reference-item').forEach(item => {
        item.addEventListener('click', () => {
            const mode = item.getAttribute('data-mode');
            if (mode) {
                numericInputEl.value = mode;
                setFromNumeric(mode);
            }
        });
    });

    // 事件监听 - 复制按钮
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                const text = targetEl.textContent;
                const success = await REOT.utils?.copyToClipboard(text);
                if (success) {
                    REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
                }
            }
        });
    });

    // 初始化 - 设置默认值 755
    setFromNumeric('755');

    // 导出到全局
    window.ChmodTool = { setFromNumeric, generateSymbolic, getNumericMode };
})();
