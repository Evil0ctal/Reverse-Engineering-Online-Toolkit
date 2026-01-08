/**
 * Unicode 编解码工具
 * @description Unicode 编码与解码
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    /**
     * 检查当前是否在 Unicode 工具页面
     */
    function isUnicodeToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/encoding/unicode');
    }

    /**
     * 获取 DOM 元素
     */
    function getElements() {
        return {
            input: document.getElementById('input'),
            output: document.getElementById('output'),
            format: document.getElementById('format-select'),
            uppercase: document.getElementById('uppercase'),
            encodeAll: document.getElementById('encode-all')
        };
    }

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

                // format 值从 HTML select 获取，如 "\u", "\x", "&#", "&#x", "U+"
                switch (format) {
                    case '\\u':  // JS 字符串 \u
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

                    case '\\x':  // JS 字符串 \x
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
        const els = getElements();
        return {
            format: els.format?.value || '\\u',
            uppercase: els.uppercase?.checked || false,
            encodeAll: els.encodeAll?.checked || false
        };
    }

    /**
     * 执行编码
     */
    function doEncode() {
        const els = getElements();
        if (!els.input || !els.output) return;

        try {
            const result = encode(els.input.value, getOptions());
            els.output.value = result;
            REOT.utils?.showNotification('编码完成', 'success');
        } catch (error) {
            els.output.value = `错误: ${error.message}`;
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    /**
     * 执行解码
     */
    function doDecode() {
        const els = getElements();
        if (!els.input || !els.output) return;

        try {
            const result = decode(els.input.value);
            els.output.value = result;
            REOT.utils?.showNotification('解码完成', 'success');
        } catch (error) {
            els.output.value = `错误: ${error.message}`;
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    // 事件委托
    document.addEventListener('click', async (e) => {
        if (!isUnicodeToolActive()) return;

        const target = e.target;
        const els = getElements();

        // 编码按钮
        if (target.id === 'encode-btn' || target.closest('#encode-btn')) {
            doEncode();
        }

        // 解码按钮
        if (target.id === 'decode-btn' || target.closest('#decode-btn')) {
            doDecode();
        }

        // 交换按钮
        if (target.id === 'swap-btn' || target.closest('#swap-btn')) {
            if (els.input && els.output) {
                const temp = els.input.value;
                els.input.value = els.output.value;
                els.output.value = temp;
            }
        }

        // 清除按钮
        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            if (els.input) els.input.value = '';
            if (els.output) els.output.value = '';
        }

        // 复制按钮
        if (target.id === 'copy-btn' || target.closest('#copy-btn')) {
            if (els.output?.value) {
                const success = await REOT.utils?.copyToClipboard(els.output.value);
                if (success) {
                    REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
                }
            }
        }
    });

    // 导出到全局
    window.UnicodeTool = { encode, decode };
})();
