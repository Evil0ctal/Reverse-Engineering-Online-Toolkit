/**
 * Unicode 编解码工具
 * @description Unicode 编码与解码
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // DOM 元素
    const inputEl = document.getElementById('input');
    const outputEl = document.getElementById('output');
    const formatEl = document.getElementById('format-select');
    const uppercaseEl = document.getElementById('uppercase');
    const encodeAllEl = document.getElementById('encode-all');
    const encodeBtnEl = document.getElementById('encode-btn');
    const decodeBtnEl = document.getElementById('decode-btn');
    const swapBtnEl = document.getElementById('swap-btn');
    const clearBtnEl = document.getElementById('clear-btn');
    const copyBtnEl = document.getElementById('copy-btn');

    /**
     * Unicode 编码
     * @param {string} text - 输入文本
     * @param {Object} options - 选项
     * @returns {string} - 编码后的字符串
     */
    function encode(text, options = {}) {
        const { format = '\\u', uppercase = false, encodeAll = false } = options;

        if (!text) {
            return '';
        }

        let result = '';

        for (const char of text) {
            const code = char.codePointAt(0);

            // 判断是否需要编码
            const needsEncode = encodeAll || code > 127;

            if (needsEncode) {
                let encoded;

                switch (format) {
                    case '\\u':
                        // \uXXXX 格式（处理代理对）
                        if (code > 0xFFFF) {
                            // 需要两个代理对
                            const high = Math.floor((code - 0x10000) / 0x400) + 0xD800;
                            const low = ((code - 0x10000) % 0x400) + 0xDC00;
                            encoded = `\\u${high.toString(16).padStart(4, '0')}\\u${low.toString(16).padStart(4, '0')}`;
                        } else {
                            encoded = `\\u${code.toString(16).padStart(4, '0')}`;
                        }
                        break;

                    case '\\x':
                        // \xXX 格式（仅适用于 0-255）
                        if (code <= 255) {
                            encoded = `\\x${code.toString(16).padStart(2, '0')}`;
                        } else {
                            // 对于超出范围的字符，使用 \u 格式
                            encoded = `\\u${code.toString(16).padStart(4, '0')}`;
                        }
                        break;

                    case '&#':
                        // &#XXXX; HTML 十进制格式
                        encoded = `&#${code};`;
                        break;

                    case '&#x':
                        // &#xXXXX; HTML 十六进制格式
                        encoded = `&#x${code.toString(16)};`;
                        break;

                    case 'U+':
                        // U+XXXX 格式
                        encoded = `U+${code.toString(16).toUpperCase().padStart(4, '0')}`;
                        break;

                    default:
                        encoded = char;
                }

                if (uppercase && format !== 'U+' && format !== '&#') {
                    encoded = encoded.toUpperCase();
                }

                result += encoded;
            } else {
                result += char;
            }
        }

        return result;
    }

    /**
     * Unicode 解码
     * @param {string} text - 编码后的文本
     * @returns {string} - 解码后的字符串
     */
    function decode(text) {
        if (!text) {
            return '';
        }

        let result = text;

        // 解码 \uXXXX 格式
        result = result.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
            return String.fromCharCode(parseInt(code, 16));
        });

        // 解码 \xXX 格式
        result = result.replace(/\\x([0-9a-fA-F]{2})/g, (match, code) => {
            return String.fromCharCode(parseInt(code, 16));
        });

        // 解码 &#xXXXX; HTML 十六进制格式
        result = result.replace(/&#x([0-9a-fA-F]+);/gi, (match, code) => {
            return String.fromCodePoint(parseInt(code, 16));
        });

        // 解码 &#XXXX; HTML 十进制格式
        result = result.replace(/&#(\d+);/g, (match, code) => {
            return String.fromCodePoint(parseInt(code, 10));
        });

        // 解码 U+XXXX 格式
        result = result.replace(/U\+([0-9a-fA-F]{4,6})/gi, (match, code) => {
            return String.fromCodePoint(parseInt(code, 16));
        });

        return result;
    }

    /**
     * 获取当前选项
     */
    function getOptions() {
        return {
            format: formatEl?.value || '\\u',
            uppercase: uppercaseEl?.checked || false,
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
    window.UnicodeTool = { encode, decode };

    // 设置默认示例数据
    if (inputEl && !inputEl.value) {
        inputEl.value = 'Hello 你好 こんにちは 🎉🚀';
    }
})();
