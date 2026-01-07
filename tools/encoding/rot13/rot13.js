/**
 * ROT13/ROT47 编码工具
 * @description ROT13 和 ROT47 字符旋转编码
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // DOM 元素
    const inputEl = document.getElementById('input');
    const outputEl = document.getElementById('output');
    const rot13Btn = document.getElementById('rot13-btn');
    const rot47Btn = document.getElementById('rot47-btn');
    const rot5Btn = document.getElementById('rot5-btn');
    const rot18Btn = document.getElementById('rot18-btn');
    const swapBtn = document.getElementById('swap-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');

    /**
     * ROT13 编码/解码
     * 只对字母进行旋转，其他字符保持不变
     * @param {string} input
     * @returns {string}
     */
    function rot13(input) {
        return input.replace(/[a-zA-Z]/g, (char) => {
            const base = char <= 'Z' ? 65 : 97;
            return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
        });
    }

    /**
     * ROT47 编码/解码
     * 对 ASCII 33-126 范围的字符进行旋转
     * @param {string} input
     * @returns {string}
     */
    function rot47(input) {
        return input.replace(/[!-~]/g, (char) => {
            return String.fromCharCode(((char.charCodeAt(0) - 33 + 47) % 94) + 33);
        });
    }

    /**
     * ROT5 编码/解码
     * 只对数字进行旋转
     * @param {string} input
     * @returns {string}
     */
    function rot5(input) {
        return input.replace(/[0-9]/g, (char) => {
            return String.fromCharCode(((char.charCodeAt(0) - 48 + 5) % 10) + 48);
        });
    }

    /**
     * ROT18 编码/解码
     * ROT13 + ROT5 组合
     * @param {string} input
     * @returns {string}
     */
    function rot18(input) {
        return rot5(rot13(input));
    }

    // 事件监听
    if (rot13Btn) {
        rot13Btn.addEventListener('click', () => {
            outputEl.value = rot13(inputEl.value);
        });
    }

    if (rot47Btn) {
        rot47Btn.addEventListener('click', () => {
            outputEl.value = rot47(inputEl.value);
        });
    }

    if (rot5Btn) {
        rot5Btn.addEventListener('click', () => {
            outputEl.value = rot5(inputEl.value);
        });
    }

    if (rot18Btn) {
        rot18Btn.addEventListener('click', () => {
            outputEl.value = rot18(inputEl.value);
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
    window.ROT13Tool = { rot13, rot47, rot5, rot18 };

    // 设置默认示例数据
    if (inputEl && !inputEl.value) {
        inputEl.value = 'The Quick Brown Fox Jumps Over 12345 Lazy Dogs!';
    }
})();
