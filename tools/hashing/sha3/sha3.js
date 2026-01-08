/**
 * SHA-3 哈希工具
 * @description SHA3-224, SHA3-256, SHA3-384, SHA3-512, Keccak 哈希计算
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    let currentFileData = null;
    let sha3LoadPromise = null;

    /**
     * 动态加载 js-sha3 库
     */
    function loadSha3() {
        if (sha3LoadPromise) {
            return sha3LoadPromise;
        }

        if (window.sha3_256) {
            return Promise.resolve();
        }

        sha3LoadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/js-sha3@0.9.3/build/sha3.min.js';

            script.onload = () => {
                const checkGlobal = () => {
                    if (window.sha3_256) {
                        resolve();
                    } else {
                        setTimeout(checkGlobal, 10);
                    }
                };
                checkGlobal();
            };

            script.onerror = () => {
                sha3LoadPromise = null;
                reject(new Error('无法加载 js-sha3 库，请检查网络连接'));
            };

            document.head.appendChild(script);
        });

        return sha3LoadPromise;
    }

    /**
     * 确保库已加载
     */
    async function ensureLibraryLoaded() {
        if (!window.sha3_256) {
            await loadSha3();
        }
        if (!window.sha3_256) {
            throw new Error('js-sha3 库加载失败');
        }
    }

    /**
     * 获取算法函数（延迟获取，确保库已加载）
     */
    function getAlgorithmFunc(name) {
        const algorithms = {
            'sha3-224': window.sha3_224,
            'sha3-256': window.sha3_256,
            'sha3-384': window.sha3_384,
            'sha3-512': window.sha3_512,
            'keccak-256': window.keccak256,
            'keccak-512': window.keccak512
        };
        return algorithms[name];
    }

    // 算法名称
    const algorithmNames = {
        'sha3-224': 'SHA3-224',
        'sha3-256': 'SHA3-256',
        'sha3-384': 'SHA3-384',
        'sha3-512': 'SHA3-512',
        'keccak-256': 'Keccak-256',
        'keccak-512': 'Keccak-512'
    };

    /**
     * 获取当前选择的算法
     */
    function getAlgorithm() {
        const select = document.getElementById('algorithm');
        return select?.value || 'sha3-256';
    }

    /**
     * 获取输出格式
     */
    function getOutputFormat() {
        const select = document.getElementById('output-format');
        return select?.value || 'hex';
    }

    /**
     * 格式化哈希输出
     */
    function formatHash(hash, format) {
        switch (format) {
            case 'hex-upper':
                return hash.toUpperCase();
            case 'base64':
                // 将 hex 转换为 Base64
                const bytes = new Uint8Array(hash.match(/.{2}/g).map(byte => parseInt(byte, 16)));
                let binary = '';
                for (let i = 0; i < bytes.length; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                return btoa(binary);
            default:
                return hash;
        }
    }

    /**
     * 计算哈希
     */
    function calculateHash(data, algorithm) {
        const hashFunc = getAlgorithmFunc(algorithm);
        if (!hashFunc) {
            throw new Error(`不支持的算法: ${algorithm}`);
        }

        if (data instanceof Uint8Array) {
            return hashFunc(data);
        }
        return hashFunc(data);
    }

    /**
     * 计算单个哈希
     */
    function hashSingle() {
        const input = document.getElementById('input');
        const output = document.getElementById('output');
        const algorithm = getAlgorithm();
        const format = getOutputFormat();

        let data;
        if (currentFileData) {
            data = currentFileData;
        } else {
            data = input?.value || '';
        }

        if (!data || (typeof data === 'string' && !data)) {
            REOT.utils?.showNotification('请输入要计算哈希的内容', 'warning');
            return;
        }

        try {
            const hash = calculateHash(data, algorithm);
            const formattedHash = formatHash(hash, format);

            if (output) {
                output.value = formattedHash;
            }

            // 显示单一输出区域
            document.getElementById('single-output-section').style.display = 'block';
            document.getElementById('all-output-section').style.display = 'none';

            REOT.utils?.showNotification('哈希计算完成', 'success');
        } catch (error) {
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    /**
     * 计算所有算法的哈希
     */
    function hashAll() {
        const input = document.getElementById('input');
        const hashList = document.getElementById('hash-list');
        const format = getOutputFormat();

        let data;
        if (currentFileData) {
            data = currentFileData;
        } else {
            data = input?.value || '';
        }

        if (!data || (typeof data === 'string' && !data)) {
            REOT.utils?.showNotification('请输入要计算哈希的内容', 'warning');
            return;
        }

        try {
            const results = [];

            for (const [alg, name] of Object.entries(algorithmNames)) {
                const hash = calculateHash(data, alg);
                const formattedHash = formatHash(hash, format);
                results.push({ algorithm: name, hash: formattedHash });
            }

            // 渲染结果
            if (hashList) {
                hashList.innerHTML = results.map(({ algorithm, hash }) => `
                    <div class="hash-item">
                        <div class="hash-item-header">
                            <span class="hash-algorithm">${algorithm}</span>
                            <button class="btn btn--sm btn--outline copy-hash-btn" data-hash="${hash}">
                                <span data-i18n="common.copy">复制</span>
                            </button>
                        </div>
                        <div class="hash-value">${hash}</div>
                    </div>
                `).join('');
            }

            // 显示所有输出区域
            document.getElementById('single-output-section').style.display = 'none';
            document.getElementById('all-output-section').style.display = 'block';

            REOT.utils?.showNotification('所有哈希计算完成', 'success');
        } catch (error) {
            REOT.utils?.showNotification(error.message, 'error');
        }
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
     * 复制到剪贴板
     */
    async function copyToClipboard(text) {
        const success = await REOT.utils?.copyToClipboard(text);
        if (success) {
            REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
        }
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

    // 检查当前是否在 SHA3 工具页面
    function isSha3ToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/hashing/sha3');
    }

    // 事件委托处理器
    document.addEventListener('click', async (e) => {
        // 只在 SHA3 工具页面处理事件
        if (!isSha3ToolActive()) return;

        const target = e.target;

        // 计算哈希按钮
        if (target.id === 'hash-btn' || target.closest('#hash-btn')) {
            try {
                await ensureLibraryLoaded();
                hashSingle();
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
            }
        }

        // 计算所有哈希按钮
        if (target.id === 'hash-all-btn' || target.closest('#hash-all-btn')) {
            try {
                await ensureLibraryLoaded();
                hashAll();
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
            const hashList = document.getElementById('hash-list');

            if (input) {
                input.value = '';
                input.disabled = false;
            }
            if (output) output.value = '';
            if (fileInfo) fileInfo.style.display = 'none';
            if (fileInput) fileInput.value = '';
            if (hashList) hashList.innerHTML = '';
            currentFileData = null;

            document.getElementById('single-output-section').style.display = 'block';
            document.getElementById('all-output-section').style.display = 'none';
        }

        // 复制按钮
        if (target.id === 'copy-btn' || target.closest('#copy-btn')) {
            const output = document.getElementById('output');
            if (output) copyToClipboard(output.value);
        }

        // 复制单个哈希按钮
        const copyHashBtn = target.closest('.copy-hash-btn');
        if (copyHashBtn) {
            const hash = copyHashBtn.dataset.hash;
            copyToClipboard(hash);
        }
    });

    // 导出工具函数
    window.Sha3Tool = {
        hash: calculateHash,
        algorithms: algorithmNames
    };

    // 设置默认示例数据
    const defaultInput = document.getElementById('input');
    if (defaultInput && !defaultInput.value) {
        defaultInput.value = 'Hello, REOT!';
    }

    // 预加载 js-sha3 库
    loadSha3().catch(err => console.warn('js-sha3 预加载失败:', err.message));

})();
