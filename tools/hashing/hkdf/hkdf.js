/**
 * HKDF 密钥派生工具
 * @description HMAC-based Key Derivation Function (RFC 5869)
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // ==================== DOM 元素 ====================

    const hashSelect = document.getElementById('hkdf-hash');
    const keyLengthInput = document.getElementById('hkdf-keylength');
    const outputFormatSelect = document.getElementById('hkdf-output-format');
    const ikmInput = document.getElementById('hkdf-ikm');
    const ikmIsHexCheckbox = document.getElementById('ikm-is-hex');
    const saltInput = document.getElementById('hkdf-salt');
    const genSaltBtn = document.getElementById('hkdf-gen-salt');
    const infoInput = document.getElementById('hkdf-info');
    const infoIsHexCheckbox = document.getElementById('info-is-hex');
    const deriveBtn = document.getElementById('derive-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');
    const outputEl = document.getElementById('hkdf-output');
    const detailsSection = document.getElementById('hkdf-details');
    const detailPrk = document.getElementById('detail-prk');
    const detailHash = document.getElementById('detail-hash');
    const detailLength = document.getElementById('detail-length');

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
     * Uint8Array 转 Hex
     */
    function bytesToHex(bytes) {
        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Uint8Array 转 Base64
     */
    function bytesToBase64(bytes) {
        let binary = '';
        bytes.forEach(b => binary += String.fromCharCode(b));
        return btoa(binary);
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
     * 生成随机盐值
     */
    function generateSalt(length = 32) {
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        return bytesToHex(bytes);
    }

    /**
     * 验证 Hex 字符串
     */
    function isValidHex(str) {
        if (!str) return true;
        const cleaned = str.replace(/\s/g, '');
        return /^[0-9a-fA-F]*$/.test(cleaned) && cleaned.length % 2 === 0;
    }

    // ==================== HKDF 实现 ====================

    /**
     * HKDF-Extract: 从 IKM 和 salt 提取 PRK
     */
    async function hkdfExtract(hash, salt, ikm) {
        // 如果没有提供 salt，使用与哈希输出长度相同的全零字节
        if (salt.length === 0) {
            const hashLength = {
                'SHA-1': 20,
                'SHA-256': 32,
                'SHA-384': 48,
                'SHA-512': 64
            }[hash] || 32;
            salt = new Uint8Array(hashLength);
        }

        // 导入 salt 作为 HMAC 密钥
        const key = await crypto.subtle.importKey(
            'raw',
            salt,
            { name: 'HMAC', hash: hash },
            false,
            ['sign']
        );

        // HMAC(salt, ikm) = PRK
        const prk = await crypto.subtle.sign('HMAC', key, ikm);
        return new Uint8Array(prk);
    }

    /**
     * HKDF-Expand: 从 PRK 扩展出所需长度的密钥
     */
    async function hkdfExpand(hash, prk, info, length) {
        const hashLength = {
            'SHA-1': 20,
            'SHA-256': 32,
            'SHA-384': 48,
            'SHA-512': 64
        }[hash] || 32;

        // 检查请求的长度是否有效
        if (length > 255 * hashLength) {
            throw new Error(`请求的密钥长度过长，最大为 ${255 * hashLength} 字节`);
        }

        // 导入 PRK 作为 HMAC 密钥
        const key = await crypto.subtle.importKey(
            'raw',
            prk,
            { name: 'HMAC', hash: hash },
            false,
            ['sign']
        );

        // 迭代扩展
        const n = Math.ceil(length / hashLength);
        const okm = new Uint8Array(n * hashLength);
        let t = new Uint8Array(0);

        for (let i = 1; i <= n; i++) {
            // T(i) = HMAC(PRK, T(i-1) | info | i)
            const input = new Uint8Array(t.length + info.length + 1);
            input.set(t, 0);
            input.set(info, t.length);
            input[t.length + info.length] = i;

            const block = await crypto.subtle.sign('HMAC', key, input);
            t = new Uint8Array(block);
            okm.set(t, (i - 1) * hashLength);
        }

        // 返回所需长度
        return okm.slice(0, length);
    }

    /**
     * 完整的 HKDF 操作
     */
    async function hkdf(hash, ikm, salt, info, length) {
        const prk = await hkdfExtract(hash, salt, ikm);
        const okm = await hkdfExpand(hash, prk, info, length);
        return { prk, okm };
    }

    // ==================== 主要操作 ====================

    /**
     * 执行密钥派生
     */
    async function deriveKey() {
        try {
            // 获取参数
            const hash = hashSelect.value;
            const keyLength = parseInt(keyLengthInput.value, 10);
            const outputFormat = outputFormatSelect.value;

            // 解析输入
            const ikm = parseInput(ikmInput.value, ikmIsHexCheckbox.checked);
            const salt = parseInput(saltInput.value.trim(), true); // salt 总是 hex
            const info = parseInput(infoInput.value, infoIsHexCheckbox.checked);

            // 验证
            if (ikm.length === 0) {
                outputEl.value = REOT.i18n?.t('tools.hkdf.errorNoIkm') || '请输入密钥材料 (IKM)';
                return;
            }

            if (keyLength < 1 || keyLength > 255 * 64) {
                outputEl.value = REOT.i18n?.t('tools.hkdf.errorInvalidLength') || '密钥长度无效';
                return;
            }

            // 执行 HKDF
            outputEl.value = REOT.i18n?.t('tools.hkdf.deriving') || '正在派生密钥...';
            const { prk, okm } = await hkdf(hash, ikm, salt, info, keyLength);

            // 格式化输出
            if (outputFormat === 'base64') {
                outputEl.value = bytesToBase64(okm);
            } else {
                outputEl.value = bytesToHex(okm);
            }

            // 显示详情
            detailsSection.style.display = 'block';
            detailPrk.textContent = bytesToHex(prk);
            detailHash.textContent = hash;
            detailLength.textContent = `${keyLength} 字节 (${keyLength * 8} bits)`;

            REOT.utils?.showNotification(REOT.i18n?.t('tools.hkdf.success') || '密钥派生成功', 'success');

        } catch (error) {
            outputEl.value = (REOT.i18n?.t('tools.hkdf.error') || '派生失败: ') + error.message;
            detailsSection.style.display = 'none';
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    /**
     * 清除所有输入
     */
    function clearAll() {
        ikmInput.value = '';
        saltInput.value = '';
        infoInput.value = '';
        outputEl.value = '';
        detailsSection.style.display = 'none';
    }

    /**
     * 复制结果
     */
    async function copyResult() {
        const output = outputEl.value;
        if (output && !output.startsWith('请') && !output.startsWith('正在') && !output.startsWith('派生失败')) {
            const success = await REOT.utils?.copyToClipboard(output);
            if (success) {
                REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
            }
        }
    }

    // ==================== 事件绑定 ====================

    if (deriveBtn) {
        deriveBtn.addEventListener('click', deriveKey);
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', clearAll);
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', copyResult);
    }

    if (genSaltBtn) {
        genSaltBtn.addEventListener('click', () => {
            // 根据哈希算法生成合适长度的盐值
            const hash = hashSelect.value;
            const length = {
                'SHA-1': 20,
                'SHA-256': 32,
                'SHA-384': 48,
                'SHA-512': 64
            }[hash] || 32;
            saltInput.value = generateSalt(length);
        });
    }

    // 盐值输入验证
    if (saltInput) {
        saltInput.addEventListener('input', () => {
            if (saltInput.value && !isValidHex(saltInput.value)) {
                saltInput.classList.add('invalid');
            } else {
                saltInput.classList.remove('invalid');
            }
        });
    }

    // ==================== 初始化 ====================

    // 设置默认示例
    if (ikmInput && !ikmInput.value) {
        ikmInput.value = 'my-secret-key';
    }

    // 导出到全局
    window.HKDFTool = {
        hkdf,
        hkdfExtract,
        hkdfExpand,
        hexToBytes,
        bytesToHex,
        bytesToBase64
    };

})();
