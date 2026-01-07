/**
 * SHA 哈希工具
 * @description 使用 Web Crypto API 计算 SHA 哈希值
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // DOM 元素
    const inputEl = document.getElementById('input');
    const algorithmEl = document.getElementById('algorithm-select');
    const outputLowerEl = document.getElementById('output-lower');
    const outputUpperEl = document.getElementById('output-upper');
    const hashBtnEl = document.getElementById('hash-btn');
    const clearBtnEl = document.getElementById('clear-btn');
    const copyBtnEl = document.getElementById('copy-btn');

    /**
     * 计算 SHA 哈希值
     * @param {string} input - 输入字符串
     * @param {string} algorithm - 算法名称 (SHA-1, SHA-256, SHA-384, SHA-512)
     * @returns {Promise<string>} - 哈希值（小写十六进制）
     */
    async function hash(input, algorithm = 'SHA-256') {
        if (!input) {
            return '';
        }

        try {
            // 将字符串转换为 ArrayBuffer
            const encoder = new TextEncoder();
            const data = encoder.encode(input);

            // 使用 Web Crypto API 计算哈希
            const hashBuffer = await crypto.subtle.digest(algorithm, data);

            // 将 ArrayBuffer 转换为十六进制字符串
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            return hashHex;
        } catch (error) {
            console.error('Hash calculation failed:', error);
            throw new Error(`哈希计算失败: ${error.message}`);
        }
    }

    /**
     * 更新输出
     */
    async function updateOutput() {
        try {
            const algorithm = algorithmEl.value;
            const result = await hash(inputEl.value, algorithm);
            outputLowerEl.value = result;
            outputUpperEl.value = result.toUpperCase();
        } catch (error) {
            outputLowerEl.value = error.message;
            outputUpperEl.value = '';
        }
    }

    // 事件监听
    if (hashBtnEl) {
        hashBtnEl.addEventListener('click', updateOutput);
    }

    if (clearBtnEl) {
        clearBtnEl.addEventListener('click', () => {
            inputEl.value = '';
            outputLowerEl.value = '';
            outputUpperEl.value = '';
        });
    }

    if (copyBtnEl) {
        copyBtnEl.addEventListener('click', async () => {
            const success = await REOT.utils?.copyToClipboard(outputLowerEl.value);
            if (success) {
                REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
            }
        });
    }

    // 算法切换时重新计算
    if (algorithmEl) {
        algorithmEl.addEventListener('change', () => {
            if (inputEl.value) {
                updateOutput();
            }
        });
    }

    // 实时计算
    if (inputEl) {
        inputEl.addEventListener('input', updateOutput);
    }

    // 导出到全局
    window.SHATool = { hash };

    // 设置默认示例数据
    if (inputEl && !inputEl.value) {
        inputEl.value = 'Hello, World!';
        // 触发计算
        updateOutput();
    }
})();
