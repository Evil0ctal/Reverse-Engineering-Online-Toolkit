/**
 * 十六进制转换工具
 * @description 文本与十六进制字符串互转
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // DOM 元素
    const inputEl = document.getElementById('input');
    const outputEl = document.getElementById('output');
    const uppercaseEl = document.getElementById('uppercase');
    const withSpacesEl = document.getElementById('with-spaces');
    const withPrefixEl = document.getElementById('with-prefix');
    const encodeBtnEl = document.getElementById('encode-btn');
    const decodeBtnEl = document.getElementById('decode-btn');
    const swapBtnEl = document.getElementById('swap-btn');
    const clearBtnEl = document.getElementById('clear-btn');
    const copyBtnEl = document.getElementById('copy-btn');

    /**
     * 文本转十六进制
     * @param {string} text - 输入文本
     * @param {Object} options - 选项
     * @returns {string} - 十六进制字符串
     */
    function textToHex(text, options = {}) {
        const { uppercase = false, withSpaces = true, withPrefix = false } = options;

        if (!text) {
            return '';
        }

        const encoder = new TextEncoder();
        const bytes = encoder.encode(text);

        let hex = Array.from(bytes)
            .map(b => {
                let h = b.toString(16).padStart(2, '0');
                if (uppercase) {
                    h = h.toUpperCase();
                }
                if (withPrefix) {
                    h = '0x' + h;
                }
                return h;
            })
            .join(withSpaces ? ' ' : '');

        return hex;
    }

    /**
     * 十六进制转文本
     * @param {string} hex - 十六进制字符串
     * @returns {string} - 解码后的文本
     */
    function hexToText(hex) {
        if (!hex) {
            return '';
        }

        // 清理输入：移除空格、换行、0x前缀等
        hex = hex.replace(/0x/gi, '').replace(/[\s\n\r]/g, '');

        // 验证十六进制格式
        if (!/^[0-9a-fA-F]*$/.test(hex)) {
            throw new Error('无效的十六进制字符串');
        }

        // 确保长度为偶数
        if (hex.length % 2 !== 0) {
            hex = '0' + hex;
        }

        // 转换为字节数组
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }

        // 解码为文本
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(bytes);
    }

    /**
     * 获取当前选项
     */
    function getOptions() {
        return {
            uppercase: uppercaseEl?.checked || false,
            withSpaces: withSpacesEl?.checked ?? true,
            withPrefix: withPrefixEl?.checked || false
        };
    }

    // 事件监听
    if (encodeBtnEl) {
        encodeBtnEl.addEventListener('click', () => {
            try {
                const result = textToHex(inputEl.value, getOptions());
                outputEl.value = result;
            } catch (error) {
                outputEl.value = `错误: ${error.message}`;
            }
        });
    }

    if (decodeBtnEl) {
        decodeBtnEl.addEventListener('click', () => {
            try {
                const result = hexToText(inputEl.value);
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
    window.HexTool = { textToHex, hexToText };

    // 设置默认示例数据
    if (inputEl && !inputEl.value) {
        inputEl.value = 'Hello, REOT! 逆向工程工具箱';
    }
})();
