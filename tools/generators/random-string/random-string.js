/**
 * 随机字符串生成器
 * @description 生成随机字符串
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    const CHARSETS = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    // DOM 元素
    const lengthInput = document.getElementById('length');
    const countInput = document.getElementById('count');
    const uppercaseCheck = document.getElementById('uppercase');
    const lowercaseCheck = document.getElementById('lowercase');
    const numbersCheck = document.getElementById('numbers');
    const symbolsCheck = document.getElementById('symbols');
    const customCharsInput = document.getElementById('custom-chars');
    const outputEl = document.getElementById('output');
    const generateBtn = document.getElementById('generate-btn');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');

    /**
     * 获取字符集
     * @returns {string}
     */
    function getCharset() {
        const custom = customCharsInput.value.trim();
        if (custom) return custom;

        let charset = '';
        if (uppercaseCheck.checked) charset += CHARSETS.uppercase;
        if (lowercaseCheck.checked) charset += CHARSETS.lowercase;
        if (numbersCheck.checked) charset += CHARSETS.numbers;
        if (symbolsCheck.checked) charset += CHARSETS.symbols;

        return charset || CHARSETS.lowercase + CHARSETS.numbers;
    }

    /**
     * 生成随机字符串
     * @param {number} length
     * @param {string} charset
     * @returns {string}
     */
    function generate(length, charset) {
        const array = new Uint32Array(length);
        crypto.getRandomValues(array);

        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset[array[i] % charset.length];
        }
        return result;
    }

    /**
     * 生成多个随机字符串
     */
    function generateMultiple() {
        const length = parseInt(lengthInput.value) || 32;
        const count = parseInt(countInput.value) || 1;
        const charset = getCharset();

        if (!charset) {
            outputEl.value = '请选择至少一种字符类型';
            return;
        }

        const results = [];
        for (let i = 0; i < count; i++) {
            results.push(generate(length, charset));
        }

        outputEl.value = results.join('\n');
    }

    // 事件监听
    if (generateBtn) {
        generateBtn.addEventListener('click', generateMultiple);
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

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            outputEl.value = '';
        });
    }

    // 初始生成一个
    generateMultiple();

    // 导出到全局
    window.RandomStringTool = { generate };
})();
