/**
 * 偏移计算器工具
 * @description 内存地址偏移计算与转换
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    /**
     * 检查当前是否在偏移计算器工具页面
     */
    function isOffsetCalculatorActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/reverse/offset-calculator');
    }

    /**
     * 解析地址字符串（支持多种格式）
     */
    function parseAddress(str) {
        str = str.trim();
        if (!str) return null;

        // 十六进制格式
        if (/^0x/i.test(str)) {
            return BigInt(str);
        }

        // 纯十六进制（没有 0x 前缀但包含 a-f）
        if (/^[0-9a-fA-F]+$/.test(str) && /[a-fA-F]/.test(str)) {
            return BigInt('0x' + str);
        }

        // 十进制
        if (/^[0-9]+$/.test(str)) {
            return BigInt(str);
        }

        // 带空格的十六进制字节序列
        if (/^([0-9a-fA-F]{2}\s?)+$/.test(str)) {
            const hex = str.replace(/\s/g, '');
            return BigInt('0x' + hex);
        }

        throw new Error('无效的地址格式');
    }

    /**
     * 格式化地址为十六进制
     */
    function formatHex(value, bits = 64) {
        if (value < 0n) {
            // 处理负数（补码）
            value = (1n << BigInt(bits)) + value;
        }
        const hexLen = bits / 4;
        return '0x' + value.toString(16).toUpperCase().padStart(hexLen, '0');
    }

    /**
     * 基本偏移计算
     */
    function calculateOffset() {
        const baseStr = document.getElementById('base-address')?.value;
        const offsetStr = document.getElementById('offset-value')?.value;
        const operator = document.getElementById('calc-operator')?.value;
        const resultEl = document.getElementById('calc-result');

        if (!baseStr || !offsetStr) {
            throw new Error('请输入基址和偏移值');
        }

        const base = parseAddress(baseStr);
        const offset = parseAddress(offsetStr);

        let result;
        if (operator === 'sub') {
            result = base - offset;
        } else {
            result = base + offset;
        }

        if (resultEl) {
            resultEl.value = formatHex(result);
        }
    }

    /**
     * RVA / 文件偏移转换
     */
    function convertRva() {
        const imageBaseStr = document.getElementById('image-base')?.value;
        const sectionRvaStr = document.getElementById('section-rva')?.value;
        const sectionRawStr = document.getElementById('section-raw')?.value;
        const inputStr = document.getElementById('rva-input')?.value;
        const inputType = document.getElementById('rva-input-type')?.value;

        if (!inputStr) {
            throw new Error('请输入要转换的值');
        }

        const imageBase = parseAddress(imageBaseStr || '0x400000');
        const sectionRva = parseAddress(sectionRvaStr || '0x1000');
        const sectionRaw = parseAddress(sectionRawStr || '0x400');
        const inputValue = parseAddress(inputStr);

        let va, rva, raw;

        switch (inputType) {
            case 'va':
                va = inputValue;
                rva = va - imageBase;
                raw = rva - sectionRva + sectionRaw;
                break;
            case 'rva':
                rva = inputValue;
                va = rva + imageBase;
                raw = rva - sectionRva + sectionRaw;
                break;
            case 'raw':
                raw = inputValue;
                rva = raw - sectionRaw + sectionRva;
                va = rva + imageBase;
                break;
        }

        // 显示结果
        document.getElementById('result-va').textContent = formatHex(va);
        document.getElementById('result-rva').textContent = formatHex(rva);
        document.getElementById('result-raw').textContent = formatHex(raw);
        document.getElementById('rva-results').style.display = 'block';
    }

    /**
     * 地址格式转换
     */
    function convertFormat() {
        const inputStr = document.getElementById('format-input')?.value;
        const bitWidth = parseInt(document.getElementById('bit-width')?.value || '64', 10);

        if (!inputStr) {
            throw new Error('请输入地址');
        }

        let value = parseAddress(inputStr);

        // 确保在位宽范围内
        const mask = (1n << BigInt(bitWidth)) - 1n;
        value = value & mask;

        // 十六进制
        const hexLen = bitWidth / 4;
        document.getElementById('format-hex').textContent = '0x' + value.toString(16).toUpperCase().padStart(hexLen, '0');

        // 十进制
        document.getElementById('format-dec').textContent = value.toString(10);

        // 八进制
        document.getElementById('format-oct').textContent = '0o' + value.toString(8);

        // 二进制
        document.getElementById('format-bin').textContent = '0b' + value.toString(2).padStart(bitWidth, '0');

        // 字节序转换
        const bytes = [];
        let temp = value;
        const byteCount = bitWidth / 8;
        for (let i = 0; i < byteCount; i++) {
            bytes.push((temp & 0xFFn).toString(16).padStart(2, '0').toUpperCase());
            temp >>= 8n;
        }

        // 小端序
        document.getElementById('format-le').textContent = bytes.join(' ');

        // 大端序
        document.getElementById('format-be').textContent = bytes.reverse().join(' ');

        document.getElementById('format-results').style.display = 'block';
    }

    // 事件处理
    document.addEventListener('click', async (e) => {
        if (!isOffsetCalculatorActive()) return;

        const target = e.target;

        // 基本计算按钮
        if (target.id === 'calc-btn' || target.closest('#calc-btn')) {
            try {
                calculateOffset();
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
            }
        }

        // RVA 转换按钮
        if (target.id === 'rva-convert-btn' || target.closest('#rva-convert-btn')) {
            try {
                convertRva();
                REOT.utils?.showNotification('转换完成', 'success');
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
            }
        }

        // 格式转换按钮
        if (target.id === 'format-convert-btn' || target.closest('#format-convert-btn')) {
            try {
                convertFormat();
                REOT.utils?.showNotification('转换完成', 'success');
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
            }
        }

        // 复制按钮
        if (target.classList.contains('copy-btn') && target.dataset.target) {
            const targetEl = document.getElementById(target.dataset.target);
            if (targetEl) {
                const text = targetEl.textContent || targetEl.value;
                const success = await REOT.utils?.copyToClipboard(text);
                if (success) {
                    REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
                }
            }
        }
    });

    // 实时计算（输入变化时）
    document.addEventListener('input', (e) => {
        if (!isOffsetCalculatorActive()) return;

        // 基本计算实时更新
        if (['base-address', 'offset-value'].includes(e.target.id)) {
            try {
                const baseStr = document.getElementById('base-address')?.value;
                const offsetStr = document.getElementById('offset-value')?.value;
                if (baseStr && offsetStr) {
                    calculateOffset();
                }
            } catch (error) {
                // 忽略输入过程中的错误
            }
        }
    });

    // 运算符变化时重新计算
    document.addEventListener('change', (e) => {
        if (!isOffsetCalculatorActive()) return;

        if (e.target.id === 'calc-operator') {
            try {
                const baseStr = document.getElementById('base-address')?.value;
                const offsetStr = document.getElementById('offset-value')?.value;
                if (baseStr && offsetStr) {
                    calculateOffset();
                }
            } catch (error) {
                // 忽略
            }
        }
    });

    // 导出工具函数
    window.OffsetCalculator = { parseAddress, formatHex, calculateOffset, convertRva, convertFormat };

})();
