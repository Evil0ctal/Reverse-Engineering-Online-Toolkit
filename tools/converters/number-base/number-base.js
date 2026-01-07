/**
 * 进制转换工具
 * @description 二进制、八进制、十进制、十六进制互转
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // DOM 元素
    const decimalEl = document.getElementById('decimal');
    const binaryEl = document.getElementById('binary');
    const octalEl = document.getElementById('octal');
    const hexadecimalEl = document.getElementById('hexadecimal');
    const clearBtn = document.getElementById('clear-btn');

    // 自定义进制
    const customInputEl = document.getElementById('custom-input');
    const fromBaseEl = document.getElementById('from-base');
    const toBaseEl = document.getElementById('to-base');
    const customOutputEl = document.getElementById('custom-output');
    const convertBtn = document.getElementById('convert-btn');

    /**
     * 从十进制转换到其他进制
     * @param {number} decimal
     */
    function fromDecimal(decimal) {
        if (isNaN(decimal)) {
            binaryEl.value = '';
            octalEl.value = '';
            hexadecimalEl.value = '';
            return;
        }

        const num = BigInt(decimal);
        binaryEl.value = num.toString(2);
        octalEl.value = num.toString(8);
        hexadecimalEl.value = num.toString(16).toUpperCase();
    }

    /**
     * 解析输入并更新所有字段
     * @param {string} value
     * @param {number} base
     * @param {HTMLInputElement} sourceEl
     */
    function updateAll(value, base, sourceEl) {
        if (!value.trim()) {
            decimalEl.value = '';
            binaryEl.value = '';
            octalEl.value = '';
            hexadecimalEl.value = '';
            return;
        }

        try {
            const decimal = parseInt(value, base);
            if (isNaN(decimal)) {
                throw new Error('Invalid number');
            }

            if (sourceEl !== decimalEl) decimalEl.value = decimal.toString();
            if (sourceEl !== binaryEl) binaryEl.value = decimal.toString(2);
            if (sourceEl !== octalEl) octalEl.value = decimal.toString(8);
            if (sourceEl !== hexadecimalEl) hexadecimalEl.value = decimal.toString(16).toUpperCase();
        } catch (e) {
            // 保持当前值，清除其他
        }
    }

    /**
     * 自定义进制转换
     * @param {string} value
     * @param {number} fromBase
     * @param {number} toBase
     * @returns {string}
     */
    function convertBase(value, fromBase, toBase) {
        if (!value.trim()) return '';

        try {
            // 使用 BigInt 支持大数
            const decimal = BigInt(parseInt(value, fromBase));
            return decimal.toString(toBase).toUpperCase();
        } catch (e) {
            throw new Error('转换失败: ' + e.message);
        }
    }

    // 事件监听 - 十进制
    if (decimalEl) {
        decimalEl.addEventListener('input', (e) => {
            updateAll(e.target.value, 10, decimalEl);
        });
    }

    // 事件监听 - 二进制
    if (binaryEl) {
        binaryEl.addEventListener('input', (e) => {
            updateAll(e.target.value, 2, binaryEl);
        });
    }

    // 事件监听 - 八进制
    if (octalEl) {
        octalEl.addEventListener('input', (e) => {
            updateAll(e.target.value, 8, octalEl);
        });
    }

    // 事件监听 - 十六进制
    if (hexadecimalEl) {
        hexadecimalEl.addEventListener('input', (e) => {
            updateAll(e.target.value, 16, hexadecimalEl);
        });
    }

    // 清除按钮
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            decimalEl.value = '';
            binaryEl.value = '';
            octalEl.value = '';
            hexadecimalEl.value = '';
            customInputEl.value = '';
            customOutputEl.value = '';
        });
    }

    // 自定义进制转换
    if (convertBtn) {
        convertBtn.addEventListener('click', () => {
            try {
                const value = customInputEl.value;
                const fromBase = parseInt(fromBaseEl.value);
                const toBase = parseInt(toBaseEl.value);

                if (fromBase < 2 || fromBase > 36 || toBase < 2 || toBase > 36) {
                    throw new Error('进制必须在 2-36 之间');
                }

                customOutputEl.value = convertBase(value, fromBase, toBase);
            } catch (error) {
                customOutputEl.value = '错误: ' + error.message;
            }
        });
    }

    // 导出到全局
    window.NumberBaseTool = { convertBase };

    // 设置默认示例数据
    if (decimalEl && !decimalEl.value) {
        decimalEl.value = '255';
        updateAll('255', 10, decimalEl);
    }
})();
