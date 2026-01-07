/**
 * Base58 编解码工具
 * @description Base58 编码与解码（支持 Bitcoin/Ripple/Flickr 风格）
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // 不同的 Base58 字母表
    const ALPHABETS = {
        bitcoin: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
        ripple: 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz',
        flickr: '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
    };

    // DOM 元素
    const alphabetSelect = document.getElementById('alphabet-select');
    const inputEl = document.getElementById('input');
    const outputEl = document.getElementById('output');
    const encodeBtn = document.getElementById('encode-btn');
    const decodeBtn = document.getElementById('decode-btn');
    const swapBtn = document.getElementById('swap-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');

    /**
     * 获取当前字母表
     * @returns {string}
     */
    function getAlphabet() {
        return ALPHABETS[alphabetSelect?.value || 'bitcoin'];
    }

    /**
     * Base58 编码
     * @param {string} input - 输入字符串
     * @returns {string} - Base58 编码结果
     */
    function encode(input) {
        if (!input) return '';

        const alphabet = getAlphabet();
        const bytes = new TextEncoder().encode(input);

        // 计算前导零
        let zeros = 0;
        for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
            zeros++;
        }

        // 转换为 Base58
        const digits = [0];
        for (let i = 0; i < bytes.length; i++) {
            let carry = bytes[i];
            for (let j = 0; j < digits.length; j++) {
                carry += digits[j] << 8;
                digits[j] = carry % 58;
                carry = (carry / 58) | 0;
            }
            while (carry > 0) {
                digits.push(carry % 58);
                carry = (carry / 58) | 0;
            }
        }

        // 构建结果
        let result = '';
        for (let i = 0; i < zeros; i++) {
            result += alphabet[0];
        }
        for (let i = digits.length - 1; i >= 0; i--) {
            result += alphabet[digits[i]];
        }

        return result;
    }

    /**
     * Base58 解码
     * @param {string} input - Base58 编码字符串
     * @returns {string} - 解码结果
     */
    function decode(input) {
        if (!input) return '';

        const alphabet = getAlphabet();
        input = input.replace(/\s/g, '');

        // 创建字母表索引映射
        const alphabetMap = {};
        for (let i = 0; i < alphabet.length; i++) {
            alphabetMap[alphabet[i]] = i;
        }

        // 计算前导零
        let zeros = 0;
        for (let i = 0; i < input.length && input[i] === alphabet[0]; i++) {
            zeros++;
        }

        // 转换为字节
        const bytes = [0];
        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            if (!(char in alphabetMap)) {
                throw new Error(`无效的 Base58 字符: ${char}`);
            }

            let carry = alphabetMap[char];
            for (let j = 0; j < bytes.length; j++) {
                carry += bytes[j] * 58;
                bytes[j] = carry & 0xff;
                carry >>= 8;
            }
            while (carry > 0) {
                bytes.push(carry & 0xff);
                carry >>= 8;
            }
        }

        // 添加前导零
        for (let i = 0; i < zeros; i++) {
            bytes.push(0);
        }

        bytes.reverse();
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
    window.Base58Tool = { encode, decode };

    // 设置默认示例数据
    if (inputEl && !inputEl.value) {
        inputEl.value = 'Bitcoin Address Example';
    }
})();
