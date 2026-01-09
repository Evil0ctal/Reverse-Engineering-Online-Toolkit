/**
 * RIPEMD-160 哈希工具
 * @description RIPEMD-160 哈希计算（纯 JavaScript 实现）
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    let currentFileData = null;

    // ========== RIPEMD-160 实现 ==========

    function ripemd160(message) {
        // 初始化缓冲区
        let h0 = 0x67452301;
        let h1 = 0xEFCDAB89;
        let h2 = 0x98BADCFE;
        let h3 = 0x10325476;
        let h4 = 0xC3D2E1F0;

        // 消息填充
        const msgBytes = typeof message === 'string'
            ? new TextEncoder().encode(message)
            : message;

        const bitLen = msgBytes.length * 8;
        const paddingBytes = (msgBytes.length % 64 < 56)
            ? 56 - (msgBytes.length % 64)
            : 120 - (msgBytes.length % 64);

        const paddedMsg = new Uint8Array(msgBytes.length + paddingBytes + 8);
        paddedMsg.set(msgBytes);
        paddedMsg[msgBytes.length] = 0x80;

        // 添加长度（小端序）
        const view = new DataView(paddedMsg.buffer);
        view.setUint32(paddedMsg.length - 8, bitLen >>> 0, true);
        view.setUint32(paddedMsg.length - 4, Math.floor(bitLen / 0x100000000), true);

        // 常量
        const K_LEFT = [0x00000000, 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xA953FD4E];
        const K_RIGHT = [0x50A28BE6, 0x5C4DD124, 0x6D703EF3, 0x7A6D76E9, 0x00000000];

        const R_LEFT = [
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
            7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
            3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
            1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
            4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
        ];

        const R_RIGHT = [
            5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
            6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
            15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
            8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
            12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
        ];

        const S_LEFT = [
            11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
            7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
            11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
            11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
            9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
        ];

        const S_RIGHT = [
            8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
            9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
            9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
            15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
            8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
        ];

        function rotl(x, n) {
            return ((x << n) | (x >>> (32 - n))) >>> 0;
        }

        function f(j, x, y, z) {
            if (j < 16) return (x ^ y ^ z) >>> 0;
            if (j < 32) return ((x & y) | (~x & z)) >>> 0;
            if (j < 48) return ((x | ~y) ^ z) >>> 0;
            if (j < 64) return ((x & z) | (y & ~z)) >>> 0;
            return (x ^ (y | ~z)) >>> 0;
        }

        // 处理每个 512 位块
        for (let i = 0; i < paddedMsg.length; i += 64) {
            const X = new Uint32Array(16);
            for (let j = 0; j < 16; j++) {
                X[j] = (paddedMsg[i + j * 4]) |
                       (paddedMsg[i + j * 4 + 1] << 8) |
                       (paddedMsg[i + j * 4 + 2] << 16) |
                       (paddedMsg[i + j * 4 + 3] << 24);
            }

            let al = h0, bl = h1, cl = h2, dl = h3, el = h4;
            let ar = h0, br = h1, cr = h2, dr = h3, er = h4;

            // 80 轮
            for (let j = 0; j < 80; j++) {
                const round = Math.floor(j / 16);

                // 左路
                let t = (al + f(j, bl, cl, dl) + X[R_LEFT[j]] + K_LEFT[round]) >>> 0;
                t = (rotl(t, S_LEFT[j]) + el) >>> 0;
                al = el;
                el = dl;
                dl = rotl(cl, 10);
                cl = bl;
                bl = t;

                // 右路
                t = (ar + f(79 - j, br, cr, dr) + X[R_RIGHT[j]] + K_RIGHT[round]) >>> 0;
                t = (rotl(t, S_RIGHT[j]) + er) >>> 0;
                ar = er;
                er = dr;
                dr = rotl(cr, 10);
                cr = br;
                br = t;
            }

            const t = (h1 + cl + dr) >>> 0;
            h1 = (h2 + dl + er) >>> 0;
            h2 = (h3 + el + ar) >>> 0;
            h3 = (h4 + al + br) >>> 0;
            h4 = (h0 + bl + cr) >>> 0;
            h0 = t;
        }

        // 输出（小端序）
        const result = new Uint8Array(20);
        const resultView = new DataView(result.buffer);
        resultView.setUint32(0, h0, true);
        resultView.setUint32(4, h1, true);
        resultView.setUint32(8, h2, true);
        resultView.setUint32(12, h3, true);
        resultView.setUint32(16, h4, true);

        return result;
    }

    // ========== 工具函数 ==========

    function uint8ArrayToHex(arr) {
        return Array.from(arr)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 计算 RIPEMD-160 哈希
     */
    function calculateHash(data) {
        const hashBytes = ripemd160(data);
        return uint8ArrayToHex(hashBytes);
    }

    /**
     * 更新输出
     */
    function updateOutput() {
        try {
            let data;
            const input = document.getElementById('input');

            if (currentFileData) {
                data = currentFileData;
            } else {
                data = input?.value || '';
            }

            if (!data || (typeof data === 'string' && !data.trim())) {
                const outputLower = document.getElementById('output-lower');
                const outputUpper = document.getElementById('output-upper');
                if (outputLower) outputLower.value = '';
                if (outputUpper) outputUpper.value = '';
                return;
            }

            const result = calculateHash(data);
            const outputLower = document.getElementById('output-lower');
            const outputUpper = document.getElementById('output-upper');

            if (outputLower) outputLower.value = result;
            if (outputUpper) outputUpper.value = result.toUpperCase();

        } catch (error) {
            const outputLower = document.getElementById('output-lower');
            if (outputLower) outputLower.value = '错误: ' + error.message;
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    // 检查当前是否在 RIPEMD 工具页面
    function isRipemdToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/hashing/ripemd');
    }

    // 文件上传处理
    document.addEventListener('change', (e) => {
        if (!isRipemdToolActive()) return;

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

                updateOutput();
            };
            reader.readAsArrayBuffer(file);
        }
    });

    // 事件委托处理器
    document.addEventListener('click', async (e) => {
        if (!isRipemdToolActive()) return;

        const target = e.target;

        // 哈希按钮
        if (target.id === 'hash-btn' || target.closest('#hash-btn')) {
            updateOutput();
            REOT.utils?.showNotification('哈希计算完成', 'success');
        }

        // 清除按钮
        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            const input = document.getElementById('input');
            const outputLower = document.getElementById('output-lower');
            const outputUpper = document.getElementById('output-upper');
            const fileInfo = document.getElementById('file-info');
            const fileInput = document.getElementById('file-input');

            if (input) {
                input.value = '';
                input.disabled = false;
            }
            if (outputLower) outputLower.value = '';
            if (outputUpper) outputUpper.value = '';
            if (fileInfo) fileInfo.style.display = 'none';
            if (fileInput) fileInput.value = '';
            currentFileData = null;
        }

        // 复制按钮
        if (target.id === 'copy-btn' || target.closest('#copy-btn')) {
            const outputLower = document.getElementById('output-lower');
            if (outputLower && outputLower.value) {
                const success = await REOT.utils?.copyToClipboard(outputLower.value);
                if (success) {
                    REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
                }
            }
        }
    });

    // 实时计算
    document.addEventListener('input', (e) => {
        if (!isRipemdToolActive()) return;

        if (e.target.id === 'input') {
            updateOutput();
        }
    });

    // 导出工具函数
    window.RipemdTool = {
        ripemd160,
        calculateHash
    };

    // 设置默认示例数据并计算初始哈希
    const defaultInput = document.getElementById('input');
    if (defaultInput && !defaultInput.value) {
        defaultInput.value = 'Hello, World!';
        setTimeout(updateOutput, 100);
    }

})();
