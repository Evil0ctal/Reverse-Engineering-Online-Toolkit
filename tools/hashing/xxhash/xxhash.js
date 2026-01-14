/**
 * xxHash 哈希工具
 * @description 高性能非加密哈希算法，支持 xxHash32/xxHash64
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // ==================== xxHash 库动态加载 ====================

    let xxhashLoaded = false;
    let xxhashLoadingPromise = null;

    /**
     * 动态加载 xxHash 库
     */
    function loadXXHashLibrary() {
        if (xxhashLoaded && typeof XXH !== 'undefined') {
            return Promise.resolve();
        }

        if (xxhashLoadingPromise) {
            return xxhashLoadingPromise;
        }

        xxhashLoadingPromise = new Promise((resolve, reject) => {
            if (typeof XXH !== 'undefined') {
                xxhashLoaded = true;
                resolve();
                return;
            }

            const script = document.createElement('script');
            const basePath = window.REOT?.router?.pathPrefix || '';
            script.src = `${basePath}/libs/xxhash/xxhash.min.js`;
            script.onload = () => {
                xxhashLoaded = true;
                resolve();
            };
            script.onerror = () => {
                xxhashLoadingPromise = null;
                reject(new Error('无法加载 xxHash 库'));
            };
            document.head.appendChild(script);
        });

        return xxhashLoadingPromise;
    }

    // ==================== DOM 元素 ====================

    const variantSelect = document.getElementById('xxhash-variant');
    const seedInput = document.getElementById('xxhash-seed');
    const outputFormatSelect = document.getElementById('xxhash-output-format');
    const inputEl = document.getElementById('xxhash-input');
    const inputIsHexCheckbox = document.getElementById('input-is-hex');
    const hashBtn = document.getElementById('hash-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');
    const outputEl = document.getElementById('xxhash-output');
    const compareInput = document.getElementById('xxhash-compare');
    const compareBtn = document.getElementById('compare-btn');
    const compareResult = document.getElementById('compare-result');
    const batchInput = document.getElementById('xxhash-batch');
    const batchHashBtn = document.getElementById('batch-hash-btn');
    const batchOutput = document.getElementById('xxhash-batch-output');

    // ==================== 工具函数 ====================

    /**
     * Hex 字符串转 Uint8Array
     */
    function hexToBytes(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    }

    /**
     * 字符串转 Uint8Array
     */
    function stringToBytes(str) {
        return new TextEncoder().encode(str);
    }

    /**
     * 解析输入（支持文本或 Hex）
     */
    function parseInput(value, isHex) {
        if (!value) {
            return new Uint8Array(0);
        }
        if (isHex) {
            const cleaned = value.replace(/\s/g, '');
            if (!/^[0-9a-fA-F]*$/.test(cleaned) || cleaned.length % 2 !== 0) {
                throw new Error('无效的 Hex 字符串');
            }
            return hexToBytes(cleaned);
        }
        return stringToBytes(value);
    }

    /**
     * 解析种子值
     */
    function parseSeed(seedStr) {
        if (!seedStr || seedStr.trim() === '') {
            return 0;
        }
        const trimmed = seedStr.trim();

        // 支持十六进制格式
        if (trimmed.toLowerCase().startsWith('0x')) {
            return parseInt(trimmed, 16);
        }

        const num = parseInt(trimmed, 10);
        if (isNaN(num)) {
            throw new Error('无效的种子值');
        }
        return num;
    }

    /**
     * 格式化输出
     */
    function formatOutput(hash, format) {
        switch (format) {
            case 'hex':
                return hash.toString(16);
            case 'decimal':
                return hash.toString(10);
            case 'binary':
                // 将十六进制转换为二进制
                const hexStr = hash.toString(16);
                return hexStr.split('').map(c =>
                    parseInt(c, 16).toString(2).padStart(4, '0')
                ).join('');
            default:
                return hash.toString(16);
        }
    }

    // ==================== xxHash 计算 ====================

    /**
     * 将 Uint8Array 转换为库可接受的格式
     * xxhash-js 期望 String 或 Buffer，我们传递 ArrayBuffer
     */
    function toHashInput(data) {
        // 如果是字符串直接返回
        if (typeof data === 'string') {
            return data;
        }
        // 如果是 Uint8Array，转换为 ArrayBuffer
        if (data instanceof Uint8Array) {
            return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        }
        return data;
    }

    /**
     * 计算 xxHash
     */
    function calculateHash(data, variant, seed) {
        // 检查 XXH 是否已加载
        if (typeof XXH === 'undefined') {
            throw new Error('xxHash 库未加载');
        }

        const input = toHashInput(data);

        if (variant === 'xxh32') {
            return XXH.h32(input, seed);
        } else {
            return XXH.h64(input, seed);
        }
    }

    // ==================== 主要操作 ====================

    /**
     * 执行哈希计算
     */
    async function doHash() {
        try {
            // 先加载库
            await loadXXHashLibrary();

            // 获取参数
            const variant = variantSelect.value;
            const seed = parseSeed(seedInput.value);
            const outputFormat = outputFormatSelect.value;
            const isHex = inputIsHexCheckbox.checked;
            const inputValue = inputEl.value;

            if (!inputValue) {
                outputEl.value = REOT.i18n?.t('tools.xxhash.errorNoInput') || '请输入数据';
                return;
            }

            // 根据输入类型准备数据
            let data;
            if (isHex) {
                // Hex 输入：转换为 Uint8Array
                data = parseInput(inputValue, true);
            } else {
                // 文本输入：直接使用字符串
                data = inputValue;
            }

            // 计算哈希
            const hash = calculateHash(data, variant, seed);
            const result = formatOutput(hash, outputFormat);

            // 显示结果
            outputEl.value = result;

            // 重置比对结果
            compareResult.style.display = 'none';

            REOT.utils?.showNotification(REOT.i18n?.t('tools.xxhash.success') || '计算成功', 'success');

        } catch (error) {
            outputEl.value = (REOT.i18n?.t('tools.xxhash.error') || '计算失败: ') + error.message;
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    /**
     * 清除所有输入
     */
    function clearAll() {
        inputEl.value = '';
        outputEl.value = '';
        compareInput.value = '';
        compareResult.style.display = 'none';
        batchInput.value = '';
        batchOutput.value = '';
        batchOutput.style.display = 'none';
    }

    /**
     * 复制结果
     */
    async function copyResult() {
        const output = outputEl.value;
        if (output && !output.startsWith('请') && !output.startsWith('计算失败')) {
            const success = await REOT.utils?.copyToClipboard(output);
            if (success) {
                REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
            }
        }
    }

    /**
     * 比对哈希
     */
    function compareHash() {
        const currentHash = outputEl.value.toLowerCase().trim();
        const expectedHash = compareInput.value.toLowerCase().trim();

        if (!currentHash || !expectedHash) {
            compareResult.style.display = 'none';
            return;
        }

        const isMatch = currentHash === expectedHash;
        compareResult.style.display = 'block';

        if (isMatch) {
            compareResult.className = 'compare-result match';
            compareResult.textContent = '✓ ' + (REOT.i18n?.t('tools.xxhash.matchSuccess') || '哈希值匹配');
        } else {
            compareResult.className = 'compare-result mismatch';
            compareResult.textContent = '✗ ' + (REOT.i18n?.t('tools.xxhash.matchFail') || '哈希值不匹配');
        }
    }

    /**
     * 批量计算哈希
     */
    async function batchHash() {
        try {
            // 先加载库
            await loadXXHashLibrary();

            const lines = batchInput.value.split('\n').filter(line => line.trim());

            if (lines.length === 0) {
                REOT.utils?.showNotification(REOT.i18n?.t('tools.xxhash.errorNoInput') || '请输入数据', 'warning');
                return;
            }

            const variant = variantSelect.value;
            const seed = parseSeed(seedInput.value);
            const outputFormat = outputFormatSelect.value;

            const results = [];
            for (const line of lines) {
                // 直接使用字符串，xxhash-js 原生支持
                const hash = calculateHash(line.trim(), variant, seed);
                const result = formatOutput(hash, outputFormat);
                results.push(`${line.trim()} → ${result}`);
            }

            batchOutput.value = results.join('\n');
            batchOutput.style.display = 'block';

            REOT.utils?.showNotification(
                (REOT.i18n?.t('tools.xxhash.batchSuccess') || '批量计算完成') + `: ${lines.length}`,
                'success'
            );

        } catch (error) {
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    // ==================== 事件绑定 ====================

    if (hashBtn) {
        hashBtn.addEventListener('click', doHash);
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', clearAll);
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', copyResult);
    }

    if (compareBtn) {
        compareBtn.addEventListener('click', compareHash);
    }

    if (batchHashBtn) {
        batchHashBtn.addEventListener('click', batchHash);
    }

    // 支持回车键触发计算
    if (inputEl) {
        inputEl.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                doHash();
            }
        });
    }

    // ==================== 初始化 ====================

    // 设置默认示例
    if (inputEl && !inputEl.value) {
        inputEl.value = 'Hello, xxHash!';
    }

    // 导出到全局
    window.XXHashTool = {
        calculateHash,
        formatOutput,
        hexToBytes,
        stringToBytes
    };

})();
