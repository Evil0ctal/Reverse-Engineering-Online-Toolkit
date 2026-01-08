/**
 * CRC计算器
 * @description 计算CRC校验值
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // CRC 算法参数
    const CRC_PARAMS = {
        'crc8': {
            name: 'CRC-8',
            width: 8,
            poly: 0x07,
            init: 0x00,
            refIn: false,
            refOut: false,
            xorOut: 0x00
        },
        'crc16': {
            name: 'CRC-16 (IBM)',
            width: 16,
            poly: 0x8005,
            init: 0x0000,
            refIn: true,
            refOut: true,
            xorOut: 0x0000
        },
        'crc16-ccitt': {
            name: 'CRC-16 CCITT',
            width: 16,
            poly: 0x1021,
            init: 0xFFFF,
            refIn: false,
            refOut: false,
            xorOut: 0x0000
        },
        'crc16-modbus': {
            name: 'CRC-16 Modbus',
            width: 16,
            poly: 0x8005,
            init: 0xFFFF,
            refIn: true,
            refOut: true,
            xorOut: 0x0000
        },
        'crc32': {
            name: 'CRC-32',
            width: 32,
            poly: 0x04C11DB7,
            init: 0xFFFFFFFF,
            refIn: true,
            refOut: true,
            xorOut: 0xFFFFFFFF
        },
        'crc32c': {
            name: 'CRC-32C',
            width: 32,
            poly: 0x1EDC6F41,
            init: 0xFFFFFFFF,
            refIn: true,
            refOut: true,
            xorOut: 0xFFFFFFFF
        }
    };

    // CRC 表缓存
    const tableCache = {};

    /**
     * 反转位序
     */
    function reflect(value, width) {
        let result = 0;
        for (let i = 0; i < width; i++) {
            if (value & (1 << i)) {
                result |= 1 << (width - 1 - i);
            }
        }
        return result >>> 0;
    }

    /**
     * 生成 CRC 查找表
     */
    function generateTable(params) {
        const key = params.name;
        if (tableCache[key]) {
            return tableCache[key];
        }

        const table = new Uint32Array(256);
        const { width, poly, refIn } = params;
        const topBit = 1 << (width - 1);
        const mask = (1 << width) - 1;

        for (let i = 0; i < 256; i++) {
            let crc = refIn ? reflect(i, 8) << (width - 8) : i << (width - 8);

            for (let j = 0; j < 8; j++) {
                if (crc & topBit) {
                    crc = ((crc << 1) ^ poly) & mask;
                } else {
                    crc = (crc << 1) & mask;
                }
            }

            table[i] = refIn ? reflect(crc, width) : crc;
        }

        tableCache[key] = table;
        return table;
    }

    /**
     * 计算 CRC
     */
    function calculateCRC(data, algorithm) {
        const params = CRC_PARAMS[algorithm];
        if (!params) {
            throw new Error('Unknown algorithm: ' + algorithm);
        }

        const table = generateTable(params);
        const { width, init, refIn, refOut, xorOut } = params;
        const mask = width === 32 ? 0xFFFFFFFF : (1 << width) - 1;

        let crc = init;

        if (refIn) {
            for (let i = 0; i < data.length; i++) {
                const byte = data[i];
                crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xFF];
            }
        } else {
            for (let i = 0; i < data.length; i++) {
                const byte = data[i];
                const index = ((crc >>> (width - 8)) ^ byte) & 0xFF;
                crc = ((crc << 8) ^ table[index]) & mask;
            }
        }

        if (refIn !== refOut) {
            crc = reflect(crc, width);
        }

        return (crc ^ xorOut) >>> 0;
    }

    /**
     * 解析十六进制字符串
     */
    function parseHex(hex) {
        hex = hex.replace(/\s/g, '');
        if (!/^[0-9a-fA-F]*$/.test(hex)) {
            throw new Error('Invalid hex string');
        }
        if (hex.length % 2 !== 0) {
            hex = '0' + hex;
        }

        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return bytes;
    }

    /**
     * 格式化 CRC 值
     */
    function formatCRC(value, width) {
        const hexLen = Math.ceil(width / 4);
        return {
            decimal: value.toString(),
            hex: value.toString(16).toUpperCase().padStart(hexLen, '0'),
            hexLower: value.toString(16).padStart(hexLen, '0'),
            binary: value.toString(2).padStart(width, '0')
        };
    }

    /**
     * 执行计算
     */
    function calculate() {
        const inputText = document.getElementById('input-text');
        const inputType = document.getElementById('input-type');
        const crcType = document.getElementById('crc-type');
        const resultSection = document.getElementById('result-section');
        const resultGrid = document.getElementById('result-grid');

        if (!inputText || !resultSection || !resultGrid) {
            return;
        }

        const text = inputText.value;
        if (!text) {
            resultSection.style.display = 'none';
            REOT.utils?.showNotification('请输入要计算的数据', 'warning');
            return;
        }

        try {
            let data;
            if (inputType.value === 'hex') {
                data = parseHex(text);
            } else {
                data = new TextEncoder().encode(text);
            }

            const algorithm = crcType.value;
            const params = CRC_PARAMS[algorithm];
            const crc = calculateCRC(data, algorithm);
            const formatted = formatCRC(crc, params.width);

            // 安全的翻译函数
            const t = (key) => {
                try {
                    return window.REOT?.i18n?.t(key) || key.split('.').pop();
                } catch (e) {
                    return key.split('.').pop();
                }
            };
            const yes = t('tools.crc.yes') || '是';
            const no = t('tools.crc.no') || '否';
            const copyText = t('common.copy') || '复制';

            resultGrid.innerHTML = `
                <div class="result-item">
                    <div class="result-label">${t('tools.crc.decimal') || '十进制'}</div>
                    <div class="result-value">
                        <code>${formatted.decimal}</code>
                        <button class="copy-btn" data-copy="${formatted.decimal}">${copyText}</button>
                    </div>
                </div>
                <div class="result-item">
                    <div class="result-label">${t('tools.crc.hexUpper') || '十六进制 (大写)'}</div>
                    <div class="result-value">
                        <code>0x${formatted.hex}</code>
                        <button class="copy-btn" data-copy="0x${formatted.hex}">${copyText}</button>
                    </div>
                </div>
                <div class="result-item">
                    <div class="result-label">${t('tools.crc.hexLower') || '十六进制 (小写)'}</div>
                    <div class="result-value">
                        <code>0x${formatted.hexLower}</code>
                        <button class="copy-btn" data-copy="0x${formatted.hexLower}">${copyText}</button>
                    </div>
                </div>
                <div class="result-item">
                    <div class="result-label">${t('tools.crc.binary') || '二进制'}</div>
                    <div class="result-value">
                        <code>${formatted.binary}</code>
                        <button class="copy-btn" data-copy="${formatted.binary}">${copyText}</button>
                    </div>
                </div>
                <div class="crc-info">
                    <h4>${t('tools.crc.algorithmParams') || '算法参数'} (${params.name})</h4>
                    <table>
                        <tr><td>${t('tools.crc.width') || '位宽'}</td><td>${params.width} bits</td></tr>
                        <tr><td>${t('tools.crc.polynomial') || '多项式'}</td><td>0x${params.poly.toString(16).toUpperCase()}</td></tr>
                        <tr><td>${t('tools.crc.initValue') || '初始值'}</td><td>0x${params.init.toString(16).toUpperCase()}</td></tr>
                        <tr><td>${t('tools.crc.inputReflect') || '输入反转'}</td><td>${params.refIn ? yes : no}</td></tr>
                        <tr><td>${t('tools.crc.outputReflect') || '输出反转'}</td><td>${params.refOut ? yes : no}</td></tr>
                        <tr><td>${t('tools.crc.outputXor') || '输出异或'}</td><td>0x${params.xorOut.toString(16).toUpperCase()}</td></tr>
                    </table>
                </div>
            `;

            resultSection.style.display = 'block';
            REOT.utils?.showNotification('计算完成', 'success');
        } catch (e) {
            REOT.utils?.showNotification('计算失败: ' + e.message, 'error');
        }
    }

    /**
     * 复制到剪贴板
     */
    async function copyToClipboard(text) {
        const success = await REOT.utils?.copyToClipboard(text);
        if (success) {
            REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
        }
    }

    // 检查当前是否在 CRC 工具页面
    function isCrcToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/hashing/crc');
    }

    // 使用事件委托处理点击事件
    document.addEventListener('click', (e) => {
        // 只在 CRC 工具页面处理事件
        if (!isCrcToolActive()) return;

        const target = e.target;

        // 计算按钮
        if (target.id === 'calc-btn' || target.closest('#calc-btn')) {
            calculate();
        }

        // 清除按钮
        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            const inputText = document.getElementById('input-text');
            const resultSection = document.getElementById('result-section');
            if (inputText) inputText.value = '';
            if (resultSection) resultSection.style.display = 'none';
        }

        // 复制按钮
        const copyBtn = target.closest('.copy-btn');
        if (copyBtn && copyBtn.dataset.copy) {
            copyToClipboard(copyBtn.dataset.copy);
        }
    });

    // 设置默认示例数据
    const defaultInput = document.getElementById('input-text');
    if (defaultInput && !defaultInput.value) {
        defaultInput.value = 'Hello, World!';
    }

    // 导出到全局
    window.CRCTool = { calculateCRC, CRC_PARAMS };
})();
