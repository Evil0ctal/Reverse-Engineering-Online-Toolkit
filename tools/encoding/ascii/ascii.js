/**
 * ASCII 转换工具
 * @description ASCII 码与字符互转
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // DOM 元素
    const formatSelect = document.getElementById('format-select');
    const separatorSelect = document.getElementById('separator-select');
    const inputEl = document.getElementById('input');
    const outputEl = document.getElementById('output');
    const toAsciiBtn = document.getElementById('to-ascii-btn');
    const toTextBtn = document.getElementById('to-text-btn');
    const swapBtn = document.getElementById('swap-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');

    /**
     * 文本转 ASCII 码
     * @param {string} input - 输入文本
     * @returns {string} - ASCII 码
     */
    function textToAscii(input) {
        if (!input) return '';

        const format = formatSelect?.value || 'decimal';
        const separator = separatorSelect?.value ?? ' ';

        const codes = [];
        for (let i = 0; i < input.length; i++) {
            const code = input.charCodeAt(i);
            let formatted;

            switch (format) {
                case 'hex':
                    formatted = '0x' + code.toString(16).toUpperCase().padStart(2, '0');
                    break;
                case 'binary':
                    formatted = code.toString(2).padStart(8, '0');
                    break;
                case 'octal':
                    formatted = '0o' + code.toString(8).padStart(3, '0');
                    break;
                default: // decimal
                    formatted = code.toString();
            }
            codes.push(formatted);
        }

        return codes.join(separator);
    }

    /**
     * ASCII 码转文本
     * @param {string} input - ASCII 码
     * @returns {string} - 文本
     */
    function asciiToText(input) {
        if (!input) return '';

        // 尝试各种格式的解析
        let codes = [];

        // 检测格式并解析
        const trimmed = input.trim();

        // 十六进制格式 (0x41, 0x42 或 41 42)
        if (/^(0x[0-9a-fA-F]+[\s,\-]*)+$/.test(trimmed) || /^([0-9a-fA-F]{2}[\s,\-]*)+$/.test(trimmed)) {
            const hexMatches = trimmed.match(/0x([0-9a-fA-F]+)|([0-9a-fA-F]{2})/gi);
            if (hexMatches) {
                codes = hexMatches.map(h => parseInt(h.replace('0x', ''), 16));
            }
        }
        // 二进制格式 (01000001)
        else if (/^([01]{7,8}[\s,\-]*)+$/.test(trimmed)) {
            const binMatches = trimmed.match(/[01]{7,8}/g);
            if (binMatches) {
                codes = binMatches.map(b => parseInt(b, 2));
            }
        }
        // 八进制格式 (0o101)
        else if (/^(0o[0-7]+[\s,\-]*)+$/.test(trimmed)) {
            const octMatches = trimmed.match(/0o([0-7]+)/gi);
            if (octMatches) {
                codes = octMatches.map(o => parseInt(o.replace('0o', ''), 8));
            }
        }
        // 十进制格式 (65, 66)
        else {
            const decMatches = trimmed.match(/\d+/g);
            if (decMatches) {
                codes = decMatches.map(d => parseInt(d, 10));
            }
        }

        if (codes.length === 0) {
            throw new Error('无法解析输入的 ASCII 码');
        }

        return String.fromCharCode(...codes);
    }

    /**
     * 显示错误
     * @param {string} message
     */
    function showError(message) {
        outputEl.value = `错误: ${message}`;
        if (window.REOT?.utils?.showNotification) {
            window.REOT.utils.showNotification(message, 'error');
        }
    }

    // 事件监听
    if (toAsciiBtn) {
        toAsciiBtn.addEventListener('click', () => {
            try {
                outputEl.value = textToAscii(inputEl.value);
            } catch (error) {
                showError(error.message);
            }
        });
    }

    if (toTextBtn) {
        toTextBtn.addEventListener('click', () => {
            try {
                outputEl.value = asciiToText(inputEl.value);
            } catch (error) {
                showError(error.message);
            }
        });
    }

    if (swapBtn) {
        swapBtn.addEventListener('click', () => {
            const temp = inputEl.value;
            inputEl.value = outputEl.value;
            outputEl.value = temp;
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            inputEl.value = '';
            outputEl.value = '';
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            if (outputEl.value) {
                const success = await REOT.utils?.copyToClipboard(outputEl.value);
                if (success) {
                    REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
                }
            }
        });
    }

    // 导出到全局
    window.ASCIITool = { textToAscii, asciiToText };

    // 设置默认示例数据
    if (inputEl && !inputEl.value) {
        inputEl.value = 'Hello ASCII!';
    }
})();
