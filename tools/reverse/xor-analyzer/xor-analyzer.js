/**
 * XOR 分析工具
 * @description XOR 加密分析与解密
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    /**
     * 检查当前是否在 XOR 分析工具页面
     */
    function isXorAnalyzerActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/reverse/xor-analyzer');
    }

    /**
     * 解析十六进制字符串为字节数组
     */
    function hexToBytes(hex) {
        hex = hex.replace(/[\s\n\r,;]/g, '').replace(/^0x/i, '');
        if (!/^[0-9a-fA-F]*$/.test(hex)) {
            throw new Error('无效的十六进制字符串');
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
     * 字节数组转十六进制字符串
     */
    function bytesToHex(bytes) {
        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0').toUpperCase())
            .join(' ');
    }

    /**
     * 文本转字节数组
     */
    function textToBytes(text) {
        return new TextEncoder().encode(text);
    }

    /**
     * 字节数组转文本
     */
    function bytesToText(bytes) {
        return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    }

    /**
     * Base64 转字节数组
     */
    function base64ToBytes(base64) {
        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * 字节数组转 Base64
     */
    function bytesToBase64(bytes) {
        let binaryStr = '';
        for (let i = 0; i < bytes.length; i++) {
            binaryStr += String.fromCharCode(bytes[i]);
        }
        return btoa(binaryStr);
    }

    /**
     * XOR 操作
     */
    function xor(data, key) {
        const result = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
            result[i] = data[i] ^ key[i % key.length];
        }
        return result;
    }

    /**
     * 计算可读性得分（用于暴力破解结果排序）
     */
    function calculateReadabilityScore(bytes) {
        let score = 0;
        let printableCount = 0;
        let letterCount = 0;
        let spaceCount = 0;

        for (let i = 0; i < bytes.length; i++) {
            const b = bytes[i];

            // 可打印 ASCII 字符
            if (b >= 0x20 && b <= 0x7E) {
                printableCount++;
                score += 1;

                // 字母得分更高
                if ((b >= 0x41 && b <= 0x5A) || (b >= 0x61 && b <= 0x7A)) {
                    letterCount++;
                    score += 2;
                }

                // 空格
                if (b === 0x20) {
                    spaceCount++;
                    score += 1;
                }

                // 常见标点
                if ([0x2E, 0x2C, 0x21, 0x3F, 0x27, 0x22].includes(b)) {
                    score += 1;
                }
            }

            // 换行符
            if (b === 0x0A || b === 0x0D) {
                score += 0.5;
            }
        }

        // 计算百分比
        const printableRatio = printableCount / bytes.length;
        const letterRatio = letterCount / bytes.length;

        // 综合得分
        return score * printableRatio * (1 + letterRatio);
    }

    /**
     * 单字节 XOR 暴力破解
     */
    function bruteforceSingleByteXor(ciphertext, knownPlaintext = '') {
        const results = [];

        for (let key = 0; key < 256; key++) {
            const decrypted = xor(ciphertext, new Uint8Array([key]));
            const text = bytesToText(decrypted);

            // 如果有已知明文，检查是否匹配
            if (knownPlaintext && !text.includes(knownPlaintext)) {
                continue;
            }

            const score = calculateReadabilityScore(decrypted);

            results.push({
                key: key,
                keyHex: '0x' + key.toString(16).padStart(2, '0').toUpperCase(),
                keyChar: key >= 0x20 && key <= 0x7E ? String.fromCharCode(key) : '',
                decrypted: decrypted,
                text: text,
                score: score
            });
        }

        // 按得分降序排序
        results.sort((a, b) => b.score - a.score);

        return results;
    }

    /**
     * 计算汉明距离（用于密钥长度检测）
     */
    function hammingDistance(a, b) {
        if (a.length !== b.length) {
            throw new Error('数组长度不一致');
        }
        let distance = 0;
        for (let i = 0; i < a.length; i++) {
            let xored = a[i] ^ b[i];
            while (xored) {
                distance += xored & 1;
                xored >>= 1;
            }
        }
        return distance;
    }

    /**
     * 密钥长度检测（使用多种方法综合评分）
     */
    function detectKeyLength(ciphertext, maxKeyLength = 20) {
        const results = [];
        const dataLen = ciphertext.length;

        for (let keyLen = 1; keyLen <= Math.min(maxKeyLength, Math.floor(dataLen / 2)); keyLen++) {
            // 方法1: 汉明距离（比较所有可能的块对）
            let hammingScore = 0;
            let hammingComparisons = 0;
            const numBlocks = Math.floor(dataLen / keyLen);

            // 比较所有块对，而不仅仅是相邻块
            for (let i = 0; i < numBlocks; i++) {
                for (let j = i + 1; j < numBlocks; j++) {
                    const block1 = ciphertext.slice(i * keyLen, (i + 1) * keyLen);
                    const block2 = ciphertext.slice(j * keyLen, (j + 1) * keyLen);

                    if (block1.length === keyLen && block2.length === keyLen) {
                        hammingScore += hammingDistance(block1, block2);
                        hammingComparisons++;
                    }
                }
            }

            // 方法2: 重合指数 (Index of Coincidence) - 对每个密钥位置计算
            let iocScore = 0;
            for (let pos = 0; pos < keyLen; pos++) {
                // 提取该位置的所有字节
                const column = [];
                for (let i = pos; i < dataLen; i += keyLen) {
                    column.push(ciphertext[i]);
                }

                if (column.length > 1) {
                    // 计算该列的重合指数
                    const freq = new Array(256).fill(0);
                    column.forEach(b => freq[b]++);

                    let sum = 0;
                    for (let f of freq) {
                        sum += f * (f - 1);
                    }
                    const n = column.length;
                    const ioc = sum / (n * (n - 1) || 1);
                    iocScore += ioc;
                }
            }
            iocScore /= keyLen;

            // 方法3: 检查重复模式
            let repeatScore = 0;
            for (let i = 0; i < dataLen - keyLen; i++) {
                if (ciphertext[i] === ciphertext[i + keyLen]) {
                    repeatScore++;
                }
            }
            repeatScore /= (dataLen - keyLen) || 1;

            // 综合评分
            // 汉明距离归一化（越小越好）
            const normalizedHamming = hammingComparisons > 0
                ? hammingScore / hammingComparisons / keyLen
                : 10;

            // IoC 归一化（英文文本的 IoC 约为 0.067，随机数据约为 0.0385）
            // IoC 越高越好，所以我们用 1 - 归一化的 IoC
            const iocFactor = 1 - (iocScore * 10);

            // 重复分数（越高越好），转换为越低越好
            const repeatFactor = 1 - repeatScore;

            // 综合分数（越低越好）
            // 对短数据，更依赖 IoC 和重复模式
            const confidence = Math.min(1, numBlocks / 4); // 置信度基于块数
            const combinedScore = normalizedHamming * confidence +
                                  iocFactor * (1 - confidence * 0.5) +
                                  repeatFactor * 0.3;

            results.push({
                keyLength: keyLen,
                distance: combinedScore,
                hammingDist: normalizedHamming,
                ioc: iocScore,
                repeatRatio: repeatScore,
                blocks: numBlocks,
                confidence: confidence
            });
        }

        // 按综合分数升序排序
        results.sort((a, b) => a.distance - b.distance);

        return results;
    }

    /**
     * 多字节 XOR 暴力破解
     * 基于密钥长度，将密文分成多列，对每列进行单字节暴力破解
     * @param {Uint8Array} ciphertext - 密文
     * @param {number} keyLength - 密钥长度
     * @param {string} knownPlaintext - 已知明文（可选）
     * @returns {Object} - 破解结果
     */
    function bruteforceMultiByteXor(ciphertext, keyLength, knownPlaintext = '') {
        // 将密文按密钥长度分成多列
        const columns = [];
        for (let i = 0; i < keyLength; i++) {
            const column = [];
            for (let j = i; j < ciphertext.length; j += keyLength) {
                column.push(ciphertext[j]);
            }
            columns.push(new Uint8Array(column));
        }

        // 对每列进行单字节暴力破解
        const keyBytes = [];
        const columnResults = [];

        for (let i = 0; i < columns.length; i++) {
            const results = bruteforceSingleByteXor(columns[i], '');
            // 取得分最高的结果作为该位置的密钥字节
            if (results.length > 0) {
                keyBytes.push(results[0].key);
                // 保存前几个候选结果供用户参考
                columnResults.push(results.slice(0, 5));
            } else {
                keyBytes.push(0);
                columnResults.push([]);
            }
        }

        const recoveredKey = new Uint8Array(keyBytes);
        const decrypted = xor(ciphertext, recoveredKey);
        const text = bytesToText(decrypted);

        // 如果有已知明文，检查是否匹配
        const matchesKnown = !knownPlaintext || text.includes(knownPlaintext);

        // 计算整体可读性得分
        const score = calculateReadabilityScore(decrypted);

        return {
            key: recoveredKey,
            keyHex: bytesToHex(recoveredKey),
            keyText: bytesToText(recoveredKey),
            decrypted: decrypted,
            text: text,
            score: score,
            matchesKnown: matchesKnown,
            columnResults: columnResults
        };
    }

    /**
     * 尝试多个密钥长度进行多字节暴力破解
     * @param {Uint8Array} ciphertext - 密文
     * @param {Array<number>} keyLengths - 要尝试的密钥长度数组
     * @param {string} knownPlaintext - 已知明文（可选）
     * @returns {Array<Object>} - 按得分排序的破解结果
     */
    function bruteforceMultipleLengths(ciphertext, keyLengths, knownPlaintext = '') {
        const matchedResults = [];
        const allResults = [];

        for (const keyLen of keyLengths) {
            if (keyLen < 1 || keyLen > ciphertext.length) continue;

            const result = bruteforceMultiByteXor(ciphertext, keyLen, knownPlaintext);
            result.keyLength = keyLen;

            allResults.push(result);

            // 如果匹配已知明文，添加到匹配列表
            if (result.matchesKnown) {
                matchedResults.push(result);
            }
        }

        // 按得分降序排序
        allResults.sort((a, b) => b.score - a.score);
        matchedResults.sort((a, b) => b.score - a.score);

        // 如果有已知明文且有匹配结果，优先返回匹配的
        // 否则返回所有结果（让用户看到最佳猜测）
        if (knownPlaintext && matchedResults.length > 0) {
            return matchedResults;
        }

        return allResults;
    }

    /**
     * 执行 XOR 加密/解密
     */
    function doXor() {
        const inputFormat = document.getElementById('input-format')?.value || 'hex';
        const keyFormat = document.getElementById('key-format')?.value || 'hex';
        const outputFormat = document.getElementById('output-format')?.value || 'text';

        const dataInput = document.getElementById('data-input')?.value.trim();
        const keyInput = document.getElementById('key-input')?.value.trim();

        if (!dataInput) throw new Error('请输入数据');
        if (!keyInput) throw new Error('请输入密钥');

        // 解析数据
        let data;
        switch (inputFormat) {
            case 'text':
                data = textToBytes(dataInput);
                break;
            case 'base64':
                data = base64ToBytes(dataInput);
                break;
            default:
                data = hexToBytes(dataInput);
        }

        // 解析密钥
        let key;
        switch (keyFormat) {
            case 'text':
                key = textToBytes(keyInput);
                break;
            default:
                key = hexToBytes(keyInput);
        }

        // 执行 XOR
        const result = xor(data, key);

        // 格式化输出
        let output;
        switch (outputFormat) {
            case 'hex':
                output = bytesToHex(result);
                break;
            case 'base64':
                output = bytesToBase64(result);
                break;
            default:
                output = bytesToText(result);
        }

        document.getElementById('xor-output').value = output;
        document.getElementById('encrypt-output-section').style.display = 'block';
    }

    /**
     * 执行暴力破解
     */
    function doBruteforce() {
        const input = document.getElementById('bruteforce-input')?.value.trim();
        const knownPlaintext = document.getElementById('known-plaintext')?.value || '';

        if (!input) throw new Error('请输入密文');

        const ciphertext = hexToBytes(input);
        const results = bruteforceSingleByteXor(ciphertext, knownPlaintext);

        // 渲染结果
        const container = document.getElementById('bruteforce-list');
        const resultSection = document.getElementById('bruteforce-result');

        if (!container || !resultSection) return;

        // 显示前 20 个结果
        const topResults = results.slice(0, 20);

        container.innerHTML = topResults.map(r => `
            <div class="bruteforce-item">
                <span class="bruteforce-key">${r.keyHex}${r.keyChar ? ` '${r.keyChar}'` : ''}</span>
                <span class="bruteforce-result">${escapeHtml(truncate(r.text, 200))}</span>
                <span class="bruteforce-score">${r.score.toFixed(1)}</span>
                <button class="btn btn--sm btn--outline copy-btn" data-copy="${escapeHtml(r.text)}">复制</button>
            </div>
        `).join('');

        resultSection.style.display = 'block';
    }

    /**
     * 执行密钥长度检测
     */
    function doKeyDetect() {
        const input = document.getElementById('keydetect-input')?.value.trim();
        const maxKeyLength = parseInt(document.getElementById('max-key-length')?.value || '20', 10);

        if (!input) throw new Error('请输入密文');

        const ciphertext = hexToBytes(input);
        const results = detectKeyLength(ciphertext, maxKeyLength);

        // 渲染图表
        const container = document.getElementById('keydetect-chart');
        const resultSection = document.getElementById('keydetect-result');
        const hintEl = document.querySelector('#keydetect-result .hint');

        if (!container || !resultSection) return;

        // 短数据警告
        const dataLen = ciphertext.length;
        let warningHtml = '';
        if (dataLen < 50) {
            warningHtml = `
                <div class="keydetect-warning">
                    ⚠️ 数据较短（${dataLen} 字节），检测结果可能不准确。建议使用至少 50+ 字节的数据以获得更可靠的结果。
                </div>
            `;
        }

        // 获取最大和最小距离用于归一化
        const maxDistance = Math.max(...results.map(r => r.distance));
        const minDistance = Math.min(...results.map(r => r.distance));

        container.innerHTML = warningHtml + results.slice(0, 15).map((r, index) => {
            const barWidth = 100 - ((r.distance - minDistance) / (maxDistance - minDistance) * 80);
            const isLikely = index < 3;

            // 显示详细信息
            const detailTitle = `汉明距离: ${r.hammingDist.toFixed(4)}\n重合指数: ${r.ioc.toFixed(4)}\n重复率: ${(r.repeatRatio * 100).toFixed(1)}%\n完整块数: ${r.blocks}`;

            return `
                <div class="keydetect-bar" title="${detailTitle}">
                    <span class="keydetect-label">长度 ${r.keyLength}</span>
                    <div class="keydetect-bar-container">
                        <div class="keydetect-bar-fill ${isLikely ? 'likely' : ''}" style="width: ${barWidth}%"></div>
                    </div>
                    <span class="keydetect-value">${r.distance.toFixed(4)}</span>
                </div>
            `;
        }).join('');

        // 更新提示文本
        if (hintEl) {
            hintEl.innerHTML = '提示：综合得分越低越可能是正确的密钥长度。将鼠标悬停在条形图上查看详细指标。';
        }

        resultSection.style.display = 'block';
    }

    /**
     * 执行多字节暴力破解
     */
    function doMultiBruteforce() {
        const input = document.getElementById('multibruteforce-input')?.value.trim();
        const knownPlaintext = document.getElementById('multi-known-plaintext')?.value || '';
        const keyLengthInput = document.getElementById('multi-key-length')?.value.trim();
        const autoDetect = document.getElementById('auto-detect-length')?.checked;

        if (!input) throw new Error('请输入密文');

        const ciphertext = hexToBytes(input);

        // 确定要尝试的密钥长度
        let keyLengths = [];

        if (autoDetect) {
            // 自动检测前5个最可能的密钥长度
            const detected = detectKeyLength(ciphertext, 20);
            keyLengths = detected.slice(0, 5).map(r => r.keyLength);
        } else if (keyLengthInput) {
            // 解析用户输入的密钥长度（支持逗号分隔的多个值）
            keyLengths = keyLengthInput.split(/[,，\s]+/)
                .map(s => parseInt(s.trim(), 10))
                .filter(n => !isNaN(n) && n > 0);
        }

        if (keyLengths.length === 0) {
            throw new Error('请指定密钥长度或启用自动检测');
        }

        // 执行多字节暴力破解
        const results = bruteforceMultipleLengths(ciphertext, keyLengths, knownPlaintext);

        if (results.length === 0) {
            throw new Error('无法生成结果，请检查输入');
        }

        // 渲染结果
        const container = document.getElementById('multibruteforce-list');
        const resultSection = document.getElementById('multibruteforce-result');

        if (!container || !resultSection) return;

        // 检查是否有匹配已知明文的结果
        const hasMatch = knownPlaintext && results.some(r => r.matchesKnown);
        let warningHtml = '';

        if (knownPlaintext && !hasMatch) {
            warningHtml = `
                <div class="multibruteforce-warning">
                    ⚠️ 未找到包含已知明文 "${escapeHtml(knownPlaintext)}" 的结果。
                    以下是基于可读性评分的最佳猜测。数据较短时算法准确性有限，建议手动尝试不同的密钥长度。
                </div>
            `;
        }

        if (ciphertext.length < 30) {
            warningHtml += `
                <div class="multibruteforce-warning">
                    ⚠️ 数据较短（${ciphertext.length} 字节），暴力破解结果可能不准确。
                </div>
            `;
        }

        container.innerHTML = warningHtml + results.map((r, index) => `
            <div class="multibruteforce-item ${index === 0 ? 'best' : ''} ${r.matchesKnown ? 'matched' : ''}">
                <div class="multibruteforce-header">
                    <span class="multibruteforce-rank">#${index + 1}</span>
                    <span class="multibruteforce-info">
                        密钥长度: <strong>${r.keyLength}</strong>
                        | 得分: <strong>${r.score.toFixed(1)}</strong>
                        ${r.matchesKnown ? '<span class="match-badge">✓ 匹配已知明文</span>' : ''}
                    </span>
                </div>
                <div class="multibruteforce-key">
                    <label>密钥 (Hex):</label>
                    <code class="key-hex">${r.keyHex}</code>
                    <button class="btn btn--sm btn--outline copy-btn" data-copy="${r.keyHex}">复制</button>
                </div>
                <div class="multibruteforce-key">
                    <label>密钥 (Text):</label>
                    <code class="key-text">${escapeHtml(r.keyText)}</code>
                    <button class="btn btn--sm btn--outline copy-btn" data-copy="${escapeHtml(r.keyText)}">复制</button>
                </div>
                <div class="multibruteforce-decrypted">
                    <label>解密结果:</label>
                    <pre class="decrypted-text">${escapeHtml(truncate(r.text, 500))}</pre>
                    <button class="btn btn--sm btn--outline copy-btn" data-copy="${escapeHtml(r.text)}">复制全文</button>
                </div>
            </div>
        `).join('');

        resultSection.style.display = 'block';
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
     * 截断字符串
     */
    function truncate(str, maxLen) {
        if (str.length <= maxLen) return str;
        return str.substring(0, maxLen) + '...';
    }

    /**
     * 切换模式
     */
    function switchMode(mode) {
        // 更新标签状态
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        // 更新内容显示
        document.querySelectorAll('.mode-content').forEach(content => {
            content.style.display = content.id === `mode-${mode}` ? 'block' : 'none';
        });
    }

    // 事件处理
    document.addEventListener('click', async (e) => {
        if (!isXorAnalyzerActive()) return;

        const target = e.target;

        // 模式切换
        if (target.classList.contains('mode-tab')) {
            switchMode(target.dataset.mode);
        }

        // XOR 按钮
        if (target.id === 'xor-btn' || target.closest('#xor-btn')) {
            try {
                doXor();
                REOT.utils?.showNotification('XOR 操作完成', 'success');
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
            }
        }

        // 暴力破解按钮
        if (target.id === 'bruteforce-btn' || target.closest('#bruteforce-btn')) {
            try {
                doBruteforce();
                REOT.utils?.showNotification('暴力破解完成', 'success');
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
            }
        }

        // 密钥长度检测按钮
        if (target.id === 'keydetect-btn' || target.closest('#keydetect-btn')) {
            try {
                doKeyDetect();
                REOT.utils?.showNotification('检测完成', 'success');
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
            }
        }

        // 多字节暴力破解按钮
        if (target.id === 'multibruteforce-btn' || target.closest('#multibruteforce-btn')) {
            try {
                doMultiBruteforce();
                REOT.utils?.showNotification('多字节暴力破解完成', 'success');
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
            }
        }

        // 清除按钮
        if (target.id === 'clear-encrypt-btn' || target.closest('#clear-encrypt-btn')) {
            const dataInput = document.getElementById('data-input');
            const keyInput = document.getElementById('key-input');
            const outputSection = document.getElementById('encrypt-output-section');

            if (dataInput) dataInput.value = '';
            if (keyInput) keyInput.value = '';
            if (outputSection) outputSection.style.display = 'none';
        }

        // 复制按钮
        if (target.classList.contains('copy-btn')) {
            let text;
            if (target.dataset.target) {
                text = document.getElementById(target.dataset.target)?.value;
            } else if (target.dataset.copy) {
                text = target.dataset.copy;
            }

            if (text) {
                const success = await REOT.utils?.copyToClipboard(text);
                if (success) {
                    REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
                }
            }
        }
    });

    // 导出工具函数
    window.XorAnalyzer = {
        xor,
        bruteforceSingleByteXor,
        bruteforceMultiByteXor,
        bruteforceMultipleLengths,
        detectKeyLength,
        hexToBytes,
        bytesToHex
    };

})();
