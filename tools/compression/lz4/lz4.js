/**
 * LZ4 压缩工具
 * @description LZ4 高速压缩与解压（纯 JavaScript 实现）
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    let currentFileData = null;

    // ========== LZ4 常量 ==========

    // LZ4 Frame Magic Number: 0x184D2204 (little-endian)
    const LZ4_MAGIC = new Uint8Array([0x04, 0x22, 0x4D, 0x18]);

    // LZ4 Block constants
    const MINMATCH = 4;
    const COPYLENGTH = 8;
    const MFLIMIT = 12;
    const LASTLITERALS = 5;

    // Hash table size
    const HASH_LOG = 12;
    const HASH_SIZE = 1 << HASH_LOG;

    /**
     * 计算哈希值（用于快速匹配查找）
     */
    function hashPosition(data, pos) {
        // 读取 4 字节并计算哈希
        const v = data[pos] | (data[pos + 1] << 8) | (data[pos + 2] << 16) | (data[pos + 3] << 24);
        return ((v * 2654435761) >>> 0) >> (32 - HASH_LOG);
    }

    /**
     * LZ4 快速压缩
     */
    function lz4CompressFast(input) {
        const inputLength = input.length;
        if (inputLength < MFLIMIT) {
            // 太短，不压缩
            return encodeLiterals(input, 0, inputLength);
        }

        const output = [];
        const hashTable = new Int32Array(HASH_SIZE);
        hashTable.fill(-1);

        let anchor = 0;
        let ip = 0;
        const inputEnd = inputLength;
        const mflimit = inputEnd - MFLIMIT;
        const matchlimit = inputEnd - LASTLITERALS;

        ip++;

        while (ip < mflimit) {
            // 查找匹配
            const h = hashPosition(input, ip);
            const ref = hashTable[h];
            hashTable[h] = ip;

            // 检查是否有效匹配
            if (ref >= anchor &&
                ref < ip &&
                input[ref] === input[ip] &&
                input[ref + 1] === input[ip + 1] &&
                input[ref + 2] === input[ip + 2] &&
                input[ref + 3] === input[ip + 3]) {

                // 找到匹配，输出之前的字面量
                const literalLen = ip - anchor;

                // 计算匹配长度
                let matchLen = MINMATCH;
                while (ip + matchLen < matchlimit && input[ref + matchLen] === input[ip + matchLen]) {
                    matchLen++;
                }

                // 计算偏移量
                const offset = ip - ref;

                // 编码 token
                const token = Math.min(literalLen, 15) | (Math.min(matchLen - MINMATCH, 15) << 4);
                output.push(token);

                // 编码额外字面量长度
                if (literalLen >= 15) {
                    let len = literalLen - 15;
                    while (len >= 255) {
                        output.push(255);
                        len -= 255;
                    }
                    output.push(len);
                }

                // 复制字面量
                for (let i = 0; i < literalLen; i++) {
                    output.push(input[anchor + i]);
                }

                // 编码偏移量（小端序）
                output.push(offset & 0xFF);
                output.push((offset >> 8) & 0xFF);

                // 编码额外匹配长度
                if (matchLen - MINMATCH >= 15) {
                    let len = matchLen - MINMATCH - 15;
                    while (len >= 255) {
                        output.push(255);
                        len -= 255;
                    }
                    output.push(len);
                }

                // 更新位置
                ip += matchLen;
                anchor = ip;

                // 更新哈希表
                if (ip < mflimit) {
                    hashTable[hashPosition(input, ip - 2)] = ip - 2;
                }
            } else {
                ip++;
            }
        }

        // 处理剩余的字面量
        const lastLiterals = inputLength - anchor;
        const token = Math.min(lastLiterals, 15);
        output.push(token);

        if (lastLiterals >= 15) {
            let len = lastLiterals - 15;
            while (len >= 255) {
                output.push(255);
                len -= 255;
            }
            output.push(len);
        }

        for (let i = anchor; i < inputLength; i++) {
            output.push(input[i]);
        }

        return new Uint8Array(output);
    }

    /**
     * LZ4 高压缩模式
     */
    function lz4CompressHC(input) {
        const inputLength = input.length;
        if (inputLength < MFLIMIT) {
            return encodeLiterals(input, 0, inputLength);
        }

        const output = [];
        let anchor = 0;
        let ip = 0;
        const inputEnd = inputLength;
        const mflimit = inputEnd - MFLIMIT;
        const matchlimit = inputEnd - LASTLITERALS;

        while (ip < mflimit) {
            // HC 模式：更深的搜索
            let bestLen = MINMATCH - 1;
            let bestRef = -1;

            // 搜索窗口
            const searchStart = Math.max(0, ip - 65535);
            for (let ref = ip - 1; ref >= searchStart; ref--) {
                if (input[ref] === input[ip] &&
                    input[ref + 1] === input[ip + 1] &&
                    input[ref + 2] === input[ip + 2] &&
                    input[ref + 3] === input[ip + 3]) {

                    let matchLen = MINMATCH;
                    while (ip + matchLen < matchlimit && input[ref + matchLen] === input[ip + matchLen]) {
                        matchLen++;
                    }

                    if (matchLen > bestLen) {
                        bestLen = matchLen;
                        bestRef = ref;
                    }
                }
            }

            if (bestLen >= MINMATCH && bestRef >= 0) {
                const literalLen = ip - anchor;
                const offset = ip - bestRef;

                const token = Math.min(literalLen, 15) | (Math.min(bestLen - MINMATCH, 15) << 4);
                output.push(token);

                if (literalLen >= 15) {
                    let len = literalLen - 15;
                    while (len >= 255) {
                        output.push(255);
                        len -= 255;
                    }
                    output.push(len);
                }

                for (let i = 0; i < literalLen; i++) {
                    output.push(input[anchor + i]);
                }

                output.push(offset & 0xFF);
                output.push((offset >> 8) & 0xFF);

                if (bestLen - MINMATCH >= 15) {
                    let len = bestLen - MINMATCH - 15;
                    while (len >= 255) {
                        output.push(255);
                        len -= 255;
                    }
                    output.push(len);
                }

                ip += bestLen;
                anchor = ip;
            } else {
                ip++;
            }
        }

        // 剩余字面量
        const lastLiterals = inputLength - anchor;
        const token = Math.min(lastLiterals, 15);
        output.push(token);

        if (lastLiterals >= 15) {
            let len = lastLiterals - 15;
            while (len >= 255) {
                output.push(255);
                len -= 255;
            }
            output.push(len);
        }

        for (let i = anchor; i < inputLength; i++) {
            output.push(input[i]);
        }

        return new Uint8Array(output);
    }

    /**
     * 编码纯字面量块
     */
    function encodeLiterals(input, start, length) {
        const output = [];
        const token = Math.min(length, 15);
        output.push(token);

        if (length >= 15) {
            let len = length - 15;
            while (len >= 255) {
                output.push(255);
                len -= 255;
            }
            output.push(len);
        }

        for (let i = 0; i < length; i++) {
            output.push(input[start + i]);
        }

        return new Uint8Array(output);
    }

    /**
     * 创建 LZ4 帧
     */
    function createLZ4Frame(compressedData, originalSize) {
        // 帧头: Magic(4) + FLG(1) + BD(1) + ContentSize(8) + HC(1)
        const headerSize = 15;
        const frame = new Uint8Array(LZ4_MAGIC.length + headerSize + 4 + compressedData.length + 4);
        let pos = 0;

        // Magic Number
        frame.set(LZ4_MAGIC, pos);
        pos += LZ4_MAGIC.length;

        // FLG byte
        // Bit 7-6: Version (01)
        // Bit 5: Block Independence (1)
        // Bit 4: Block Checksum (0)
        // Bit 3: Content Size (1)
        // Bit 2: Content Checksum (0)
        // Bit 1: Reserved
        // Bit 0: Dictionary ID (0)
        frame[pos++] = 0b01101000;

        // BD byte (Block Descriptor)
        // Bit 7: Reserved
        // Bit 6-4: Block Max Size (4 = 64KB)
        // Bit 3-0: Reserved
        frame[pos++] = 0b01000000;

        // Content Size (8 bytes, little-endian)
        frame[pos++] = originalSize & 0xFF;
        frame[pos++] = (originalSize >> 8) & 0xFF;
        frame[pos++] = (originalSize >> 16) & 0xFF;
        frame[pos++] = (originalSize >> 24) & 0xFF;
        frame[pos++] = 0;
        frame[pos++] = 0;
        frame[pos++] = 0;
        frame[pos++] = 0;

        // Header Checksum (xxHash32 of descriptor, simplified)
        frame[pos++] = ((0b01101000 + 0b01000000) >> 8) & 0xFF;

        // Block Size (4 bytes, little-endian)
        const blockSize = compressedData.length;
        frame[pos++] = blockSize & 0xFF;
        frame[pos++] = (blockSize >> 8) & 0xFF;
        frame[pos++] = (blockSize >> 16) & 0xFF;
        frame[pos++] = (blockSize >> 24) & 0x7F; // MSB = 0 means compressed

        // Block Data
        frame.set(compressedData, pos);
        pos += compressedData.length;

        // End Mark (0x00000000)
        frame[pos++] = 0;
        frame[pos++] = 0;
        frame[pos++] = 0;
        frame[pos++] = 0;

        return frame.slice(0, pos);
    }

    /**
     * 解析 LZ4 帧
     */
    function parseLZ4Frame(data) {
        // 验证 Magic Number
        for (let i = 0; i < LZ4_MAGIC.length; i++) {
            if (data[i] !== LZ4_MAGIC[i]) {
                throw new Error('无效的 LZ4 格式：Magic Number 不匹配');
            }
        }

        let pos = LZ4_MAGIC.length;

        // 读取 FLG
        const flg = data[pos++];
        const blockIndependence = (flg >> 5) & 1;
        const blockChecksum = (flg >> 4) & 1;
        const hasContentSize = (flg >> 3) & 1;
        const contentChecksum = (flg >> 2) & 1;
        const hasDictId = flg & 1;

        // 读取 BD
        const bd = data[pos++];

        // 读取 Content Size (如果有)
        let contentSize = 0;
        if (hasContentSize) {
            contentSize = data[pos] |
                         (data[pos + 1] << 8) |
                         (data[pos + 2] << 16) |
                         (data[pos + 3] << 24);
            pos += 8; // Content size 是 8 字节
        }

        // 读取 Dict ID (如果有)
        if (hasDictId) {
            pos += 4;
        }

        // 跳过 Header Checksum (1 byte)
        pos++;

        // 解压所有块
        const output = [];

        while (pos < data.length) {
            // 读取块大小 (4 bytes, little-endian)
            if (pos + 4 > data.length) break;

            const blockSizeRaw = data[pos] |
                                (data[pos + 1] << 8) |
                                (data[pos + 2] << 16) |
                                (data[pos + 3] << 24);
            pos += 4;

            // 检查是否为结束标记
            if (blockSizeRaw === 0) {
                break;
            }

            const isUncompressed = (blockSizeRaw >> 31) & 1;
            const blockSize = blockSizeRaw & 0x7FFFFFFF;

            if (blockSize === 0 || pos + blockSize > data.length) {
                break;
            }

            const blockData = data.slice(pos, pos + blockSize);
            pos += blockSize;

            // 跳过块校验和 (如果有)
            if (blockChecksum) {
                pos += 4;
            }

            if (isUncompressed) {
                // 未压缩块，直接复制
                for (let i = 0; i < blockData.length; i++) {
                    output.push(blockData[i]);
                }
            } else {
                // 压缩块，解压
                const decompressedBlock = lz4DecompressBlock(blockData);
                for (let i = 0; i < decompressedBlock.length; i++) {
                    output.push(decompressedBlock[i]);
                }
            }
        }

        return new Uint8Array(output);
    }

    /**
     * LZ4 块解压
     */
    function lz4DecompressBlock(input) {
        const output = [];
        let ip = 0;

        while (ip < input.length) {
            // 读取 token
            const token = input[ip++];
            let literalLen = (token >> 4) & 0x0F;
            let matchLen = token & 0x0F;

            // 读取额外字面量长度
            if (literalLen === 15) {
                let s;
                do {
                    if (ip >= input.length) break;
                    s = input[ip++];
                    literalLen += s;
                } while (s === 255);
            }

            // 复制字面量
            for (let i = 0; i < literalLen; i++) {
                if (ip >= input.length) break;
                output.push(input[ip++]);
            }

            // 检查是否到达末尾
            if (ip >= input.length) break;

            // 读取偏移量 (2 bytes, little-endian)
            if (ip + 1 >= input.length) break;
            const offset = input[ip] | (input[ip + 1] << 8);
            ip += 2;

            if (offset === 0) {
                throw new Error('无效的 LZ4 数据：偏移量为 0');
            }

            // 读取额外匹配长度
            matchLen += 4; // MINMATCH = 4
            if ((token & 0x0F) === 15) {
                let s;
                do {
                    if (ip >= input.length) break;
                    s = input[ip++];
                    matchLen += s;
                } while (s === 255);
            }

            // 复制匹配
            const matchStart = output.length - offset;
            for (let i = 0; i < matchLen; i++) {
                if (matchStart + i < 0) break;
                output.push(output[matchStart + i]);
            }
        }

        return output;
    }

    /**
     * 压缩数据
     */
    function compress(data, mode = 'fast') {
        let input;
        if (typeof data === 'string') {
            input = new TextEncoder().encode(data);
        } else {
            input = new Uint8Array(data);
        }

        const compressedData = mode === 'hc'
            ? lz4CompressHC(input)
            : lz4CompressFast(input);

        return createLZ4Frame(compressedData, input.length);
    }

    /**
     * 解压数据
     */
    function decompress(data) {
        if (!(data instanceof Uint8Array)) {
            data = new Uint8Array(data);
        }

        return parseLZ4Frame(data);
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

    function getCompressionMode() {
        const modeSelect = document.getElementById('compression-mode');
        return modeSelect?.value || 'fast';
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
                data = new Blob([binary], { type: 'application/x-lz4' });
                filename = 'compressed.lz4';
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

    // 检查当前是否在 LZ4 工具页面
    function isLz4ToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/compression/lz4');
    }

    // 文件上传处理
    document.addEventListener('change', (e) => {
        if (!isLz4ToolActive()) return;

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
        if (!isLz4ToolActive()) return;

        const target = e.target;

        // 压缩按钮
        if (target.id === 'compress-btn' || target.closest('#compress-btn')) {
            try {
                const input = document.getElementById('input');
                const output = document.getElementById('output');
                const format = getOutputFormat();
                const mode = getCompressionMode();

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

                const compressed = compress(data, mode);
                updateStats(
                    typeof data === 'string' ? stringToUint8Array(data).length : data.length,
                    compressed.length
                );

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
                    // 直接使用上传的文件数据
                    compressedData = currentFileData;
                } else if (input.value.trim()) {
                    // 从文本输入解析
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

                const decompressed = decompress(compressedData);
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
    window.Lz4Tool = {
        compress,
        decompress,
        formatFileSize
    };

    // 设置默认示例数据
    const defaultInput = document.getElementById('input');
    if (defaultInput && !defaultInput.value) {
        const sampleText = `这是一段示例文本，用于演示 LZ4 压缩功能。

LZ4 是一种极速压缩算法，专注于压缩和解压速度。

主要特点：
1. 解压速度极快（~5 GB/s）
2. 压缩速度高（~780 MB/s）
3. 两种模式：快速模式和高压缩模式
4. 广泛应用于实时数据处理

This is sample text for demonstrating LZ4 compression.
LZ4 provides extremely fast compression and decompression speeds.`;
        defaultInput.value = sampleText;
    }

})();
