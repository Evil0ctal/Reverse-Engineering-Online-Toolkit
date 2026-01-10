/**
 * Brotli 压缩工具
 * @description Brotli 压缩与解压（使用 Google brotli-wasm）
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    let currentFileData = null;
    let brotliWasm = null;
    let brotliLoadPromise = null;

    /**
     * 动态加载 brotli-wasm 库
     */
    async function loadBrotliWasm() {
        if (brotliWasm) {
            return brotliWasm;
        }

        if (brotliLoadPromise) {
            return brotliLoadPromise;
        }

        brotliLoadPromise = (async () => {
            try {
                // 使用动态 import 加载 ESM 模块
                const module = await import('https://cdn.jsdelivr.net/npm/brotli-wasm@3.0.1/index.web.js');
                brotliWasm = await module.default;
                return brotliWasm;
            } catch (e) {
                console.error('brotli-wasm ESM 加载失败，尝试备用方案:', e);

                // 备用方案：使用 script 标签加载
                return new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.type = 'module';
                    script.textContent = `
                        import brotliPromise from 'https://cdn.jsdelivr.net/npm/brotli-wasm@3.0.1/index.web.js';
                        window.__brotliWasmPromise = brotliPromise;
                    `;
                    script.onload = async () => {
                        try {
                            if (window.__brotliWasmPromise) {
                                brotliWasm = await window.__brotliWasmPromise;
                                resolve(brotliWasm);
                            } else {
                                reject(new Error('brotli-wasm 加载失败'));
                            }
                        } catch (err) {
                            reject(err);
                        }
                    };
                    script.onerror = () => reject(new Error('brotli-wasm 脚本加载失败'));
                    document.head.appendChild(script);
                });
            }
        })();

        return brotliLoadPromise;
    }

    /**
     * 压缩数据
     */
    async function compress(data) {
        let input;
        if (typeof data === 'string') {
            input = new TextEncoder().encode(data);
        } else {
            input = new Uint8Array(data);
        }

        const brotli = await loadBrotliWasm();
        return brotli.compress(input);
    }

    /**
     * 解压数据
     */
    async function decompress(data) {
        const brotli = await loadBrotliWasm();
        return brotli.decompress(data);
    }

    // ========== 工具函数 ==========

    function stringToUint8Array(str) {
        return new TextEncoder().encode(str);
    }

    function uint8ArrayToString(arr) {
        return new TextDecoder().decode(arr);
    }

    function uint8ArrayToBase64(arr) {
        let binary = '';
        for (let i = 0; i < arr.length; i++) {
            binary += String.fromCharCode(arr[i]);
        }
        return btoa(binary);
    }

    function base64ToUint8Array(base64) {
        const binary = atob(base64);
        const arr = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            arr[i] = binary.charCodeAt(i);
        }
        return arr;
    }

    function uint8ArrayToHex(arr) {
        return Array.from(arr)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    function hexToUint8Array(hex) {
        hex = hex.replace(/\s/g, '');
        const arr = new Uint8Array(hex.length / 2);
        for (let i = 0; i < arr.length; i++) {
            arr[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return arr;
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function getOutputFormat() {
        const formatSelect = document.getElementById('output-format');
        return formatSelect?.value || 'base64';
    }

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
                data = new Blob([binary], { type: 'application/x-brotli' });
                filename = 'compressed.br';
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

    // 检查当前是否在 Brotli 工具页面
    function isBrotliToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/compression/brotli');
    }

    // 文件上传处理
    document.addEventListener('change', (e) => {
        if (!isBrotliToolActive()) return;

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
        if (!isBrotliToolActive()) return;

        const target = e.target;

        // 压缩按钮
        if (target.id === 'compress-btn' || target.closest('#compress-btn')) {
            try {
                const input = document.getElementById('input');
                const output = document.getElementById('output');
                const format = getOutputFormat();

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

                REOT.utils?.showNotification('正在加载 Brotli 库并压缩...', 'info');

                const inputData = typeof data === 'string' ? stringToUint8Array(data) : data;
                const compressed = await compress(data);
                updateStats(inputData.length, compressed.length);

                if (output) {
                    output.value = format === 'base64'
                        ? uint8ArrayToBase64(compressed)
                        : uint8ArrayToHex(compressed);
                }

                REOT.utils?.showNotification('压缩成功', 'success');
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
            }
        }

        // 解压按钮
        if (target.id === 'decompress-btn' || target.closest('#decompress-btn')) {
            try {
                const input = document.getElementById('input');
                const output = document.getElementById('output');
                const format = getOutputFormat();

                let compressedData;
                if (currentFileData) {
                    compressedData = currentFileData;
                } else if (input.value.trim()) {
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

                REOT.utils?.showNotification('正在加载 Brotli 库并解压...', 'info');

                const decompressed = await decompress(compressedData);
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
            if (output && output.value) {
                const success = await REOT.utils?.copyToClipboard(output.value);
                if (success) {
                    REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
                }
            }
        }

        // 下载按钮
        if (target.id === 'download-btn' || target.closest('#download-btn')) {
            downloadResult();
        }
    });

    // 导出工具函数
    window.BrotliTool = {
        compress,
        decompress,
        formatFileSize,
        loadBrotliWasm
    };

    // 设置默认示例数据
    const defaultInput = document.getElementById('input');
    if (defaultInput && !defaultInput.value) {
        const sampleText = `这是一段示例文本，用于演示 Brotli 压缩功能。

Brotli 是 Google 开发的通用无损压缩算法，结合了 LZ77、霍夫曼编码和二阶上下文建模。

主要特点：
1. 高压缩率 - 比 GZIP 高约 20-26%
2. 广泛应用 - 现代浏览器都支持 Brotli
3. 适合 Web - 特别适合压缩 HTML、CSS、JavaScript

This is sample text for demonstrating Brotli compression.
Brotli typically achieves better compression than gzip for web content.`;
        defaultInput.value = sampleText;
    }

    // 预加载 brotli-wasm 库
    loadBrotliWasm().catch(err => console.warn('Brotli 预加载失败:', err.message));

})();
