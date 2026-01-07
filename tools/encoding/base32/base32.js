/**
 * Base32 编解码工具
 * @description Base32 编码与解码转换
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const PADDING = '=';

    // DOM 元素
    const inputEl = document.getElementById('input');
    const outputEl = document.getElementById('output');
    const encodeBtn = document.getElementById('encode-btn');
    const decodeBtn = document.getElementById('decode-btn');
    const swapBtn = document.getElementById('swap-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');

    /**
     * Base32 编码
     * @param {string} input - 输入字符串
     * @returns {string} - Base32 编码结果
     */
    function encode(input) {
        if (!input) return '';

        const bytes = new TextEncoder().encode(input);
        let result = '';
        let bits = 0;
        let value = 0;

        for (let i = 0; i < bytes.length; i++) {
            value = (value << 8) | bytes[i];
            bits += 8;

            while (bits >= 5) {
                bits -= 5;
                result += ALPHABET[(value >> bits) & 0x1f];
            }
        }

        if (bits > 0) {
            result += ALPHABET[(value << (5 - bits)) & 0x1f];
        }

        // 添加填充
        const padding = (8 - (result.length % 8)) % 8;
        result += PADDING.repeat(padding);

        return result;
    }

    /**
     * Base32 解码
     * @param {string} input - Base32 编码字符串
     * @returns {string} - 解码结果
     */
    function decode(input) {
        if (!input) return '';

        // 移除填充和空白
        input = input.replace(/=+$/, '').replace(/\s/g, '').toUpperCase();

        const bytes = [];
        let bits = 0;
        let value = 0;

        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            const index = ALPHABET.indexOf(char);

            if (index === -1) {
                throw new Error(`无效的 Base32 字符: ${char}`);
            }

            value = (value << 5) | index;
            bits += 5;

            if (bits >= 8) {
                bits -= 8;
                bytes.push((value >> bits) & 0xff);
            }
        }

        return new TextDecoder().decode(new Uint8Array(bytes));
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
    if (encodeBtn) {
        encodeBtn.addEventListener('click', () => {
            try {
                outputEl.value = encode(inputEl.value);
            } catch (error) {
                showError(error.message);
            }
        });
    }

    if (decodeBtn) {
        decodeBtn.addEventListener('click', () => {
            try {
                outputEl.value = decode(inputEl.value);
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
    window.Base32Tool = { encode, decode };

    // 设置默认示例数据
    if (inputEl && !inputEl.value) {
        inputEl.value = 'Hello, Base32 Encoding!';
    }
})();
