/**
 * HTML 实体编解码工具
 * @description HTML 实体编码与解码
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // 常用 HTML 实体映射表
    const NAMED_ENTITIES = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        ' ': '&nbsp;',
        '©': '&copy;',
        '®': '&reg;',
        '™': '&trade;',
        '€': '&euro;',
        '£': '&pound;',
        '¥': '&yen;',
        '¢': '&cent;',
        '§': '&sect;',
        '°': '&deg;',
        '±': '&plusmn;',
        '×': '&times;',
        '÷': '&divide;',
        '←': '&larr;',
        '→': '&rarr;',
        '↑': '&uarr;',
        '↓': '&darr;',
        '♠': '&spades;',
        '♣': '&clubs;',
        '♥': '&hearts;',
        '♦': '&diams;'
    };

    // 反向映射表
    const REVERSE_ENTITIES = Object.fromEntries(
        Object.entries(NAMED_ENTITIES).map(([k, v]) => [v, k])
    );

    // DOM 元素
    const inputEl = document.getElementById('input');
    const outputEl = document.getElementById('output');
    const modeEl = document.getElementById('mode-select');
    const encodeAllEl = document.getElementById('encode-all');
    const encodeBtnEl = document.getElementById('encode-btn');
    const decodeBtnEl = document.getElementById('decode-btn');
    const swapBtnEl = document.getElementById('swap-btn');
    const clearBtnEl = document.getElementById('clear-btn');
    const copyBtnEl = document.getElementById('copy-btn');

    /**
     * HTML 实体编码
     * @param {string} text - 输入文本
     * @param {Object} options - 选项
     * @returns {string} - 编码后的字符串
     */
    function encode(text, options = {}) {
        const { mode = 'named', encodeAll = false } = options;

        if (!text) {
            return '';
        }

        let result = '';

        for (const char of text) {
            const code = char.codePointAt(0);

            // 判断是否需要编码
            let needsEncode = false;

            if (encodeAll) {
                needsEncode = true;
            } else {
                // 只编码特殊字符和非 ASCII 字符
                needsEncode = code > 127 || ['&', '<', '>', '"', "'"].includes(char);
            }

            if (needsEncode) {
                switch (mode) {
                    case 'named':
                        // 尝试使用命名实体
                        if (NAMED_ENTITIES[char]) {
                            result += NAMED_ENTITIES[char];
                        } else {
                            // 没有命名实体时使用十进制
                            result += `&#${code};`;
                        }
                        break;

                    case 'decimal':
                        result += `&#${code};`;
                        break;

                    case 'hex':
                        result += `&#x${code.toString(16)};`;
                        break;

                    default:
                        result += char;
                }
            } else {
                result += char;
            }
        }

        return result;
    }

    /**
     * HTML 实体解码
     * @param {string} text - 编码后的文本
     * @returns {string} - 解码后的字符串
     */
    function decode(text) {
        if (!text) {
            return '';
        }

        // 创建一个临时元素来解码
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }

    /**
     * 获取当前选项
     */
    function getOptions() {
        return {
            mode: modeEl?.value || 'named',
            encodeAll: encodeAllEl?.checked || false
        };
    }

    // 事件监听
    if (encodeBtnEl) {
        encodeBtnEl.addEventListener('click', () => {
            try {
                const result = encode(inputEl.value, getOptions());
                outputEl.value = result;
            } catch (error) {
                outputEl.value = `错误: ${error.message}`;
            }
        });
    }

    if (decodeBtnEl) {
        decodeBtnEl.addEventListener('click', () => {
            try {
                const result = decode(inputEl.value);
                outputEl.value = result;
            } catch (error) {
                outputEl.value = `错误: ${error.message}`;
            }
        });
    }

    if (swapBtnEl) {
        swapBtnEl.addEventListener('click', () => {
            const temp = inputEl.value;
            inputEl.value = outputEl.value;
            outputEl.value = temp;
        });
    }

    if (clearBtnEl) {
        clearBtnEl.addEventListener('click', () => {
            inputEl.value = '';
            outputEl.value = '';
        });
    }

    if (copyBtnEl) {
        copyBtnEl.addEventListener('click', async () => {
            const success = await REOT.utils?.copyToClipboard(outputEl.value);
            if (success) {
                REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
            }
        });
    }

    // 导出到全局
    window.HTMLEntityTool = { encode, decode };
})();
