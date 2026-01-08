/**
 * GZIP 压缩工具
 * @description GZIP 压缩与解压
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

        let input;
        if (typeof data === 'string') {
            input = stringToUint8Array(data);
        } else {
            input = data;
        }

        const compressed = window.pako.gzip(input, { level });

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
            const decompressed = window.pako.ungzip(input);

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
        let data, filename, type;

        if (format === 'base64') {
            // 尝试解码 Base64 并下载为二进制
            try {
                const binary = base64ToUint8Array(output.value);
                data = new Blob([binary], { type: 'application/gzip' });
                filename = 'compressed.gz';
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

    // 事件委托处理器
    document.addEventListener('click', async (e) => {
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

                if (!input.value.trim()) {
                    REOT.utils?.showNotification('请输入要解压的内容', 'warning');
                    return;
                }

                const result = decompress(input.value.trim());
                if (output) {
                    output.value = result;
                }

                REOT.utils?.showNotification('解压成功', 'success');
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
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
    window.GzipTool = {
        compress,
        decompress,
        formatFileSize
    };

    // 设置默认示例数据
    const defaultInput = document.getElementById('input');
    if (defaultInput && !defaultInput.value) {
        const sampleText = `这是一段示例文本，用于演示 GZIP 压缩功能。

GZIP 是一种广泛使用的数据压缩格式，特别是在 Web 传输中。它使用 DEFLATE 算法来压缩数据，可以显著减少文件大小。

主要特点：
1. 高压缩率 - 对于文本文件通常可以达到 70-90% 的压缩率
2. 广泛支持 - 几乎所有浏览器和服务器都支持 GZIP
3. 快速解压 - 解压速度非常快，适合实时传输

This is sample text for demonstrating GZIP compression.
GZIP uses the DEFLATE algorithm to compress data.`;
        defaultInput.value = sampleText;
    }

    // 预加载 pako 库
    loadPako().catch(err => console.warn('pako 预加载失败:', err.message));

})();
