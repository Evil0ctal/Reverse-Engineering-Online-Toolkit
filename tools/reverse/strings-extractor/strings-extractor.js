/**
 * 字符串提取工具
 * @description 从二进制数据中提取可读字符串
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // 存储提取的字符串
    let extractedStrings = [];
    let binaryData = null;

    /**
     * 检查当前是否在字符串提取工具页面
     */
    function isStringsExtractorActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/reverse/strings-extractor');
    }

    /**
     * 获取字符集正则表达式
     */
    function getCharSetRegex(charSet, customChars) {
        switch (charSet) {
            case 'alphanumeric':
                return /^[A-Za-z0-9]$/;
            case 'custom':
                const escaped = customChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return new RegExp(`^[${escaped}]$`);
            default: // printable
                return /^[\x20-\x7E]$/;
        }
    }

    /**
     * 从字节数组提取 ASCII 字符串
     */
    function extractASCII(data, minLength, charSetRegex) {
        const strings = [];
        let currentString = '';
        let startOffset = 0;

        for (let i = 0; i < data.length; i++) {
            const char = String.fromCharCode(data[i]);
            if (charSetRegex.test(char)) {
                if (currentString === '') {
                    startOffset = i;
                }
                currentString += char;
            } else {
                if (currentString.length >= minLength) {
                    strings.push({
                        offset: startOffset,
                        string: currentString,
                        encoding: 'ASCII',
                        bytes: Array.from(data.slice(startOffset, startOffset + currentString.length))
                    });
                }
                currentString = '';
            }
        }

        // 处理最后一个字符串
        if (currentString.length >= minLength) {
            strings.push({
                offset: startOffset,
                string: currentString,
                encoding: 'ASCII',
                bytes: Array.from(data.slice(startOffset, startOffset + currentString.length))
            });
        }

        return strings;
    }

    /**
     * 从字节数组提取 UTF-8 字符串
     */
    function extractUTF8(data, minLength, charSetRegex) {
        const strings = [];
        let currentBytes = [];
        let startOffset = 0;

        for (let i = 0; i < data.length; i++) {
            const byte = data[i];

            // UTF-8 可打印字符检测（简化版，主要检测 ASCII 范围）
            if (byte >= 0x20 && byte <= 0x7E) {
                if (currentBytes.length === 0) {
                    startOffset = i;
                }
                currentBytes.push(byte);
            } else if (byte >= 0xC0 && byte <= 0xF7 && i + 1 < data.length) {
                // 多字节 UTF-8 字符开始
                let charBytes = [byte];
                let j = i + 1;
                let expectedBytes = byte < 0xE0 ? 2 : byte < 0xF0 ? 3 : 4;

                while (j < data.length && charBytes.length < expectedBytes) {
                    if (data[j] >= 0x80 && data[j] <= 0xBF) {
                        charBytes.push(data[j]);
                        j++;
                    } else {
                        break;
                    }
                }

                if (charBytes.length === expectedBytes) {
                    if (currentBytes.length === 0) {
                        startOffset = i;
                    }
                    currentBytes.push(...charBytes);
                    i = j - 1; // 跳过已处理的字节
                } else {
                    // 无效的 UTF-8 序列
                    if (currentBytes.length >= minLength) {
                        try {
                            const str = new TextDecoder('utf-8').decode(new Uint8Array(currentBytes));
                            strings.push({
                                offset: startOffset,
                                string: str,
                                encoding: 'UTF-8',
                                bytes: [...currentBytes]
                            });
                        } catch (e) {}
                    }
                    currentBytes = [];
                }
            } else {
                if (currentBytes.length >= minLength) {
                    try {
                        const str = new TextDecoder('utf-8').decode(new Uint8Array(currentBytes));
                        if (str.length >= minLength) {
                            strings.push({
                                offset: startOffset,
                                string: str,
                                encoding: 'UTF-8',
                                bytes: [...currentBytes]
                            });
                        }
                    } catch (e) {}
                }
                currentBytes = [];
            }
        }

        // 处理最后的字符串
        if (currentBytes.length >= minLength) {
            try {
                const str = new TextDecoder('utf-8').decode(new Uint8Array(currentBytes));
                if (str.length >= minLength) {
                    strings.push({
                        offset: startOffset,
                        string: str,
                        encoding: 'UTF-8',
                        bytes: [...currentBytes]
                    });
                }
            } catch (e) {}
        }

        return strings;
    }

    /**
     * 从字节数组提取 UTF-16 字符串
     */
    function extractUTF16(data, minLength, littleEndian) {
        const strings = [];
        let currentChars = [];
        let startOffset = 0;

        for (let i = 0; i < data.length - 1; i += 2) {
            let codeUnit;
            if (littleEndian) {
                codeUnit = data[i] | (data[i + 1] << 8);
            } else {
                codeUnit = (data[i] << 8) | data[i + 1];
            }

            // 检查是否为可打印字符
            if (codeUnit >= 0x20 && codeUnit <= 0x7E) {
                if (currentChars.length === 0) {
                    startOffset = i;
                }
                currentChars.push(String.fromCharCode(codeUnit));
            } else if (codeUnit >= 0x4E00 && codeUnit <= 0x9FFF) {
                // CJK 字符
                if (currentChars.length === 0) {
                    startOffset = i;
                }
                currentChars.push(String.fromCharCode(codeUnit));
            } else {
                if (currentChars.length >= minLength) {
                    const str = currentChars.join('');
                    const byteLen = str.length * 2;
                    strings.push({
                        offset: startOffset,
                        string: str,
                        encoding: littleEndian ? 'UTF-16 LE' : 'UTF-16 BE',
                        bytes: Array.from(data.slice(startOffset, startOffset + byteLen))
                    });
                }
                currentChars = [];
            }
        }

        // 处理最后的字符串
        if (currentChars.length >= minLength) {
            const str = currentChars.join('');
            const byteLen = str.length * 2;
            strings.push({
                offset: startOffset,
                string: str,
                encoding: littleEndian ? 'UTF-16 LE' : 'UTF-16 BE',
                bytes: Array.from(data.slice(startOffset, startOffset + byteLen))
            });
        }

        return strings;
    }

    /**
     * 提取字符串
     */
    function extractStrings(data) {
        const minLength = parseInt(document.getElementById('min-length')?.value || '4', 10);
        const encoding = document.getElementById('encoding')?.value || 'ascii';
        const charSet = document.getElementById('char-set')?.value || 'printable';
        const customChars = document.getElementById('custom-chars')?.value || '';

        const charSetRegex = getCharSetRegex(charSet, customChars);

        let strings = [];

        switch (encoding) {
            case 'utf8':
                strings = extractUTF8(data, minLength, charSetRegex);
                break;
            case 'utf16le':
                strings = extractUTF16(data, minLength, true);
                break;
            case 'utf16be':
                strings = extractUTF16(data, minLength, false);
                break;
            default: // ascii
                strings = extractASCII(data, minLength, charSetRegex);
        }

        return strings;
    }

    /**
     * 解析十六进制输入
     */
    function parseHexInput(hexStr) {
        hexStr = hexStr.replace(/[\s\n\r,;]/g, '').replace(/^0x/i, '');
        if (!/^[0-9a-fA-F]*$/.test(hexStr)) {
            throw new Error('无效的十六进制字符串');
        }
        if (hexStr.length % 2 !== 0) {
            hexStr = '0' + hexStr;
        }

        const bytes = new Uint8Array(hexStr.length / 2);
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(hexStr.substr(i * 2, 2), 16);
        }
        return bytes;
    }

    /**
     * 字节数组转十六进制字符串
     */
    function bytesToHex(bytes, limit = 20) {
        const arr = Array.from(bytes.slice(0, limit));
        let hex = arr.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
        if (bytes.length > limit) {
            hex += '...';
        }
        return hex;
    }

    /**
     * 渲染字符串列表
     */
    function renderStringsList(strings, filter = '') {
        const container = document.getElementById('strings-list');
        const showOffset = document.getElementById('show-offset')?.checked;
        const showHex = document.getElementById('show-hex')?.checked;
        const countEl = document.getElementById('string-count');

        if (!container) return;

        // 过滤
        let filtered = strings;
        if (filter) {
            const lowerFilter = filter.toLowerCase();
            filtered = strings.filter(s => s.string.toLowerCase().includes(lowerFilter));
        }

        if (countEl) countEl.textContent = filtered.length;

        if (filtered.length === 0) {
            container.innerHTML = `<div class="empty-state">未找到匹配的字符串</div>`;
            return;
        }

        // 限制显示数量以提高性能
        const displayLimit = 1000;
        const displayStrings = filtered.slice(0, displayLimit);

        let html = displayStrings.map((item, index) => `
            <div class="string-item" data-index="${index}">
                ${showOffset ? `<span class="string-offset">0x${item.offset.toString(16).toUpperCase().padStart(8, '0')}</span>` : ''}
                <span class="string-content">${escapeHtml(item.string)}</span>
                ${showHex ? `<span class="string-hex">${bytesToHex(item.bytes)}</span>` : ''}
                <button class="btn btn--sm btn--outline copy-btn" data-string="${escapeHtml(item.string)}">复制</button>
            </div>
        `).join('');

        if (filtered.length > displayLimit) {
            html += `<div class="empty-state">显示前 ${displayLimit} 条，共 ${filtered.length} 条</div>`;
        }

        container.innerHTML = html;
    }

    /**
     * HTML 转义
     */
    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    }

    /**
     * 格式化文件大小
     */
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    }

    /**
     * 执行提取
     */
    function doExtract() {
        let data;

        if (binaryData) {
            data = binaryData;
        } else {
            const hexInput = document.getElementById('hex-input')?.value.trim();
            if (!hexInput) {
                throw new Error('请上传文件或输入十六进制数据');
            }
            data = parseHexInput(hexInput);
        }

        extractedStrings = extractStrings(data);

        // 显示结果
        const resultSection = document.getElementById('result-section');
        const downloadBtn = document.getElementById('download-btn');

        if (resultSection) resultSection.style.display = 'block';
        if (downloadBtn) downloadBtn.disabled = extractedStrings.length === 0;

        renderStringsList(extractedStrings);
    }

    /**
     * 下载结果
     */
    function downloadResults() {
        if (extractedStrings.length === 0) return;

        const showOffset = document.getElementById('show-offset')?.checked;
        let content = extractedStrings.map(item => {
            if (showOffset) {
                return `0x${item.offset.toString(16).toUpperCase().padStart(8, '0')}\t${item.string}`;
            }
            return item.string;
        }).join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'extracted_strings.txt';
        a.click();
        URL.revokeObjectURL(url);
    }

    // 事件处理
    document.addEventListener('click', async (e) => {
        if (!isStringsExtractorActive()) return;

        const target = e.target;

        // 上传区域点击
        if (target.closest('#upload-area')) {
            document.getElementById('file-input')?.click();
        }

        // 提取按钮
        if (target.id === 'extract-btn' || target.closest('#extract-btn')) {
            try {
                doExtract();
                REOT.utils?.showNotification('提取完成', 'success');
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
            }
        }

        // 清除按钮
        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            binaryData = null;
            extractedStrings = [];
            const hexInput = document.getElementById('hex-input');
            const fileInfo = document.getElementById('file-info');
            const uploadArea = document.getElementById('upload-area');
            const resultSection = document.getElementById('result-section');
            const downloadBtn = document.getElementById('download-btn');

            if (hexInput) hexInput.value = '';
            if (fileInfo) fileInfo.style.display = 'none';
            if (uploadArea) uploadArea.style.display = 'flex';
            if (resultSection) resultSection.style.display = 'none';
            if (downloadBtn) downloadBtn.disabled = true;
        }

        // 清除文件按钮
        if (target.id === 'clear-file-btn' || target.closest('#clear-file-btn')) {
            binaryData = null;
            const fileInfo = document.getElementById('file-info');
            const uploadArea = document.getElementById('upload-area');
            const fileInput = document.getElementById('file-input');

            if (fileInfo) fileInfo.style.display = 'none';
            if (uploadArea) uploadArea.style.display = 'flex';
            if (fileInput) fileInput.value = '';
        }

        // 下载按钮
        if (target.id === 'download-btn' || target.closest('#download-btn')) {
            downloadResults();
        }

        // 复制按钮
        if (target.classList.contains('copy-btn') && target.dataset.string !== undefined) {
            const success = await REOT.utils?.copyToClipboard(target.dataset.string);
            if (success) {
                REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
            }
        }
    });

    // 文件上传处理
    document.addEventListener('change', (e) => {
        if (!isStringsExtractorActive()) return;

        if (e.target.id === 'file-input') {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    binaryData = new Uint8Array(event.target.result);

                    const fileInfo = document.getElementById('file-info');
                    const uploadArea = document.getElementById('upload-area');
                    const fileName = document.getElementById('file-name');
                    const fileSize = document.getElementById('file-size');

                    if (fileName) fileName.textContent = file.name;
                    if (fileSize) fileSize.textContent = formatFileSize(file.size);
                    if (fileInfo) fileInfo.style.display = 'flex';
                    if (uploadArea) uploadArea.style.display = 'none';
                };
                reader.readAsArrayBuffer(file);
            }
        }

        // 字符集选择变化
        if (e.target.id === 'char-set') {
            const customRow = document.getElementById('custom-charset-row');
            if (customRow) {
                customRow.style.display = e.target.value === 'custom' ? 'flex' : 'none';
            }
        }
    });

    // 拖放处理
    document.addEventListener('dragover', (e) => {
        if (!isStringsExtractorActive()) return;
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea && uploadArea.contains(e.target)) {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        }
    });

    document.addEventListener('dragleave', (e) => {
        if (!isStringsExtractorActive()) return;
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            uploadArea.classList.remove('dragover');
        }
    });

    document.addEventListener('drop', (e) => {
        if (!isStringsExtractorActive()) return;
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea && uploadArea.contains(e.target)) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');

            const file = e.dataTransfer?.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    binaryData = new Uint8Array(event.target.result);

                    const fileInfo = document.getElementById('file-info');
                    const fileName = document.getElementById('file-name');
                    const fileSize = document.getElementById('file-size');

                    if (fileName) fileName.textContent = file.name;
                    if (fileSize) fileSize.textContent = formatFileSize(file.size);
                    if (fileInfo) fileInfo.style.display = 'flex';
                    if (uploadArea) uploadArea.style.display = 'none';
                };
                reader.readAsArrayBuffer(file);
            }
        }
    });

    // 过滤输入
    document.addEventListener('input', (e) => {
        if (!isStringsExtractorActive()) return;

        if (e.target.id === 'filter-input') {
            renderStringsList(extractedStrings, e.target.value);
        }
    });

    // 选项变化时重新渲染
    document.addEventListener('change', (e) => {
        if (!isStringsExtractorActive()) return;

        if (e.target.id === 'show-offset' || e.target.id === 'show-hex') {
            const filter = document.getElementById('filter-input')?.value || '';
            renderStringsList(extractedStrings, filter);
        }
    });

    // 导出工具函数
    window.StringsExtractor = { extractStrings, extractASCII, extractUTF8, extractUTF16 };

})();
