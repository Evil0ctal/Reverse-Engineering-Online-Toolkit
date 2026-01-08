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
     * 密钥长度检测（使用汉明距离）
     */
    function detectKeyLength(ciphertext, maxKeyLength = 20) {
        const results = [];

        for (let keyLen = 1; keyLen <= Math.min(maxKeyLength, Math.floor(ciphertext.length / 2)); keyLen++) {
            let totalDistance = 0;
            let comparisons = 0;

            // 比较多个块
            const numBlocks = Math.floor(ciphertext.length / keyLen);
            for (let i = 0; i < Math.min(numBlocks - 1, 4); i++) {
                const block1 = ciphertext.slice(i * keyLen, (i + 1) * keyLen);
                const block2 = ciphertext.slice((i + 1) * keyLen, (i + 2) * keyLen);

                if (block1.length === block2.length && block1.length === keyLen) {
                    totalDistance += hammingDistance(block1, block2);
                    comparisons++;
                }
            }

            if (comparisons > 0) {
                // 归一化汉明距离
                const normalizedDistance = totalDistance / comparisons / keyLen;
                results.push({
                    keyLength: keyLen,
                    distance: normalizedDistance
                });
            }
        }

        // 按距离升序排序（距离越小越可能是正确的密钥长度）
        results.sort((a, b) => a.distance - b.distance);

        return results;
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

        if (!container || !resultSection) return;

        // 获取最大和最小距离用于归一化
        const maxDistance = Math.max(...results.map(r => r.distance));
        const minDistance = Math.min(...results.map(r => r.distance));

        container.innerHTML = results.slice(0, 15).map((r, index) => {
            const barWidth = 100 - ((r.distance - minDistance) / (maxDistance - minDistance) * 80);
            const isLikely = index < 3;

            return `
                <div class="keydetect-bar">
                    <span class="keydetect-label">长度 ${r.keyLength}</span>
                    <div class="keydetect-bar-container">
                        <div class="keydetect-bar-fill ${isLikely ? 'likely' : ''}" style="width: ${barWidth}%"></div>
                    </div>
                    <span class="keydetect-value">${r.distance.toFixed(4)}</span>
                </div>
            `;
        }).join('');

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
    window.XorAnalyzer = { xor, bruteforceSingleByteXor, detectKeyLength, hexToBytes, bytesToHex };

})();
