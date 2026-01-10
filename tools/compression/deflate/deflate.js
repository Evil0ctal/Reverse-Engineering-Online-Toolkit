/**
 * Deflate 压缩工具
 * @description Deflate 压缩与解压
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    let currentFileData = null;
    let pakoLoadPromise = null;

    /**
     * 动态加载 pako 库
     */
    function loadPako() {
        if (pakoLoadPromise) {
            return pakoLoadPromise;
        }

        if (window.pako) {
            return Promise.resolve();
        }

        pakoLoadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js';

            script.onload = () => {
                const checkGlobal = () => {
                    if (window.pako) {
                        resolve();
                    } else {
                        setTimeout(checkGlobal, 10);
                    }
                };
                checkGlobal();
            };

            script.onerror = () => {
                pakoLoadPromise = null;
                reject(new Error('无法加载 pako 库，请检查网络连接'));
            };

            document.head.appendChild(script);
        });

        return pakoLoadPromise;
    }

    /**
     * 确保库已加载
     */
    async function ensureLibraryLoaded() {
        if (!window.pako) {
            await loadPako();
        }
        if (!window.pako) {
            throw new Error('pako 库加载失败');
        }
    }

    /**
     * 获取压缩级别
     */
    function getCompressionLevel() {
        const levelSelect = document.getElementById('compression-level');
        return parseInt(levelSelect?.value || '9', 10);
    }

    /**
     * 获取输出格式
     */
    function getOutputFormat() {
        const formatSelect = document.getElementById('output-format');
        return formatSelect?.value || 'base64';
    }

    /**
     * 是否使用原始 Deflate（无 zlib 头）
     */
    function isRawDeflate() {
        const rawCheckbox = document.getElementById('raw-deflate');
        return rawCheckbox?.checked ?? true;
    }

    /**
     * 字符串转 Uint8Array
     */
    function stringToUint8Array(str) {
        const encoder = new TextEncoder();
        return encoder.encode(str);
    }

    /**
     * Uint8Array 转字符串
     */
    function uint8ArrayToString(arr) {
        const decoder = new TextDecoder();
        return decoder.decode(arr);
    }

    /**
     * Uint8Array 转 Base64
     */
    function uint8ArrayToBase64(arr) {
        let binary = '';
        for (let i = 0; i < arr.length; i++) {
            binary += String.fromCharCode(arr[i]);
        }
        return btoa(binary);
    }

    /**
     * Base64 转 Uint8Array
     */
    function base64ToUint8Array(base64) {
        const binary = atob(base64);
        const arr = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            arr[i] = binary.charCodeAt(i);
        }
        return arr;
    }

    /**
     * Uint8Array 转 Hex
     */
    function uint8ArrayToHex(arr) {
        return Array.from(arr)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Hex 转 Uint8Array
     */
    function hexToUint8Array(hex) {
        hex = hex.replace(/\s/g, '');
        const arr = new Uint8Array(hex.length / 2);
        for (let i = 0; i < arr.length; i++) {
            arr[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return arr;
    }

    /**
     * 格式化文件大小
     */
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 压缩数据
     */
    function compress(data) {
        const level = getCompressionLevel();
        const format = getOutputFormat();
        const raw = isRawDeflate();

        let input;
        if (typeof data === 'string') {
            input = stringToUint8Array(data);
        } else {
            input = data;
        }

        // 使用 deflateRaw（无 zlib 头）或 deflate（有 zlib 头）
        const compressed = raw
            ? window.pako.deflateRaw(input, { level })
            : window.pako.deflate(input, { level });

        // 更新统计信息
        updateStats(input.length, compressed.length);

        if (format === 'base64') {
            return uint8ArrayToBase64(compressed);
        } else {
            return uint8ArrayToHex(compressed);
        }
    }

    /**
     * 解压数据
     */
    function decompress(data) {
        const format = getOutputFormat();
        const raw = isRawDeflate();

        let input;
        try {
            if (format === 'base64') {
                input = base64ToUint8Array(data);
            } else {
                input = hexToUint8Array(data);
            }
        } catch (e) {
            throw new Error('输入格式无效');
        }

        try {
            // 使用 inflateRaw（无 zlib 头）或 inflate（有 zlib 头）
            const decompressed = raw
                ? window.pako.inflateRaw(input)
                : window.pako.inflate(input);

            // 更新统计信息
            updateStats(decompressed.length, input.length);

            // 尝试转换为字符串
            try {
                return uint8ArrayToString(decompressed);
            } catch (e) {
                // 如果无法转换为字符串，返回 Base64
                return uint8ArrayToBase64(decompressed);
            }
        } catch (e) {
            throw new Error('解压失败: 数据格式无效或已损坏');
        }
    }

    /**
     * 更新统计信息
     */
    function updateStats(originalSize, compressedSize) {
        const statsSection = document.getElementById('stats-section');
        const originalSizeEl = document.getElementById('original-size');
        const compressedSizeEl = document.getElementById('compressed-size');
        const ratioEl = document.getElementById('compression-ratio');

        if (statsSection && originalSizeEl && compressedSizeEl && ratioEl) {
            statsSection.style.display = 'block';
            originalSizeEl.textContent = formatFileSize(originalSize);
            compressedSizeEl.textContent = formatFileSize(compressedSize);

            const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
            ratioEl.textContent = `${ratio}%`;
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

    /**
     * 下载结果
     */
    function downloadResult() {
        const output = document.getElementById('output');
        if (!output || !output.value) {
            REOT.utils?.showNotification('没有可下载的内容', 'warning');
            return;
        }

        const format = getOutputFormat();
        let data, filename;

        if (format === 'base64') {
            try {
                const binary = base64ToUint8Array(output.value);
                data = new Blob([binary], { type: 'application/octet-stream' });
                filename = 'compressed.deflate';
            } catch (e) {
                data = new Blob([output.value], { type: 'text/plain' });
                filename = 'result.txt';
            }
        } else {
            data = new Blob([output.value], { type: 'text/plain' });
            filename = 'result.txt';
        }

        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // 文件上传处理
    document.addEventListener('change', (e) => {
        if (e.target.id === 'file-input') {
            const file = e.target.files[0];
            if (!file) return;

            const fileInfo = document.getElementById('file-info');
            const input = document.getElementById('input');

            const reader = new FileReader();
            reader.onload = (event) => {
                currentFileData = new Uint8Array(event.target.result);

                if (fileInfo) {
                    fileInfo.style.display = 'block';
                    fileInfo.innerHTML = `
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${formatFileSize(file.size)}</span>
                    `;
                }

                if (input) {
                    input.value = `[文件已加载: ${file.name}]`;
                    input.disabled = true;
                }
            };
            reader.readAsArrayBuffer(file);
        }
    });

    // 检查当前是否在 Deflate 工具页面
    function isDeflateToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/compression/deflate');
    }

    // 事件委托处理器
    document.addEventListener('click', async (e) => {
        // 只在 Deflate 工具页面处理事件
        if (!isDeflateToolActive()) return;

        const target = e.target;

        // 压缩按钮
        if (target.id === 'compress-btn' || target.closest('#compress-btn')) {
            try {
                await ensureLibraryLoaded();
                const input = document.getElementById('input');
                const output = document.getElementById('output');

                let data;
                if (currentFileData) {
                    data = currentFileData;
                } else {
                    data = input.value;
                }

                if (!data || (typeof data === 'string' && !data.trim())) {
                    REOT.utils?.showNotification('请输入要压缩的内容', 'warning');
                    return;
                }

                const result = compress(data);
                if (output) {
                    output.value = result;
                }

                REOT.utils?.showNotification('压缩成功', 'success');
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
            }
        }

        // 解压按钮
        if (target.id === 'decompress-btn' || target.closest('#decompress-btn')) {
            try {
                await ensureLibraryLoaded();
                const input = document.getElementById('input');
                const output = document.getElementById('output');

                let compressedData;
                if (currentFileData) {
                    // 直接使用上传的文件数据
                    compressedData = currentFileData;
                } else if (input.value.trim()) {
                    // 从文本输入解析
                    const format = getOutputFormat();
                    try {
                        if (format === 'base64') {
                            compressedData = base64ToUint8Array(input.value.trim());
                        } else {
                            compressedData = hexToUint8Array(input.value.trim());
                        }
                    } catch (e) {
                        throw new Error('输入格式无效');
                    }
                } else {
                    REOT.utils?.showNotification('请输入要解压的内容或上传文件', 'warning');
                    return;
                }

                // 自动检测是否为 zlib 格式（magic: 78 xx）
                const isZlib = compressedData[0] === 0x78;

                // 使用对应的解压方法
                let decompressed;
                try {
                    if (isZlib) {
                        decompressed = window.pako.inflate(compressedData);
                    } else {
                        decompressed = window.pako.inflateRaw(compressedData);
                    }
                } catch (e) {
                    // 如果一种方式失败，尝试另一种
                    try {
                        decompressed = isZlib
                            ? window.pako.inflateRaw(compressedData)
                            : window.pako.inflate(compressedData);
                    } catch (e2) {
                        throw new Error('解压失败: 数据格式无效或已损坏');
                    }
                }

                updateStats(decompressed.length, compressedData.length);

                if (output) {
                    try {
                        output.value = uint8ArrayToString(decompressed);
                    } catch (e) {
                        output.value = uint8ArrayToBase64(decompressed);
                    }
                }

                REOT.utils?.showNotification('解压成功', 'success');
            } catch (error) {
                REOT.utils?.showNotification(error.message || '解压失败', 'error');
            }
        }

        // 清除按钮
        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            const input = document.getElementById('input');
            const output = document.getElementById('output');
            const fileInfo = document.getElementById('file-info');
            const fileInput = document.getElementById('file-input');
            const statsSection = document.getElementById('stats-section');

            if (input) {
                input.value = '';
                input.disabled = false;
            }
            if (output) output.value = '';
            if (fileInfo) fileInfo.style.display = 'none';
            if (fileInput) fileInput.value = '';
            if (statsSection) statsSection.style.display = 'none';
            currentFileData = null;
        }

        // 复制按钮
        if (target.id === 'copy-btn' || target.closest('#copy-btn')) {
            const output = document.getElementById('output');
            if (output) copyToClipboard(output.value);
        }

        // 下载按钮
        if (target.id === 'download-btn' || target.closest('#download-btn')) {
            downloadResult();
        }
    });

    // 导出工具函数
    window.DeflateTool = {
        compress,
        decompress,
        formatFileSize
    };

    // 设置默认示例数据
    const defaultInput = document.getElementById('input');
    if (defaultInput && !defaultInput.value) {
        const sampleText = `这是一段示例文本，用于演示 Deflate 压缩功能。

Deflate 是一种无损数据压缩算法，结合了 LZ77 算法和霍夫曼编码。它是 GZIP、ZLIB 和 PNG 格式的基础算法。

主要特点：
1. 高效压缩 - 对于文本文件通常可以达到 60-80% 的压缩率
2. 广泛应用 - ZIP 文件、HTTP 压缩传输等都使用 Deflate
3. 原始格式 - 可选择是否包含 zlib 头部信息

This is sample text for demonstrating Deflate compression.
Deflate combines LZ77 and Huffman coding algorithms.`;
        defaultInput.value = sampleText;
    }

    // 预加载 pako 库
    loadPako().catch(err => console.warn('pako 预加载失败:', err.message));

})();
