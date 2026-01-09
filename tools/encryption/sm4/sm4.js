/**
 * SM4 加解密工具
 * @description 国密 SM4 对称加密算法（纯 JavaScript 实现）
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // ========== SM4 核心实现 ==========

    // S盒
    const SBOX = [
        0xd6, 0x90, 0xe9, 0xfe, 0xcc, 0xe1, 0x3d, 0xb7, 0x16, 0xb6, 0x14, 0xc2, 0x28, 0xfb, 0x2c, 0x05,
        0x2b, 0x67, 0x9a, 0x76, 0x2a, 0xbe, 0x04, 0xc3, 0xaa, 0x44, 0x13, 0x26, 0x49, 0x86, 0x06, 0x99,
        0x9c, 0x42, 0x50, 0xf4, 0x91, 0xef, 0x98, 0x7a, 0x33, 0x54, 0x0b, 0x43, 0xed, 0xcf, 0xac, 0x62,
        0xe4, 0xb3, 0x1c, 0xa9, 0xc9, 0x08, 0xe8, 0x95, 0x80, 0xdf, 0x94, 0xfa, 0x75, 0x8f, 0x3f, 0xa6,
        0x47, 0x07, 0xa7, 0xfc, 0xf3, 0x73, 0x17, 0xba, 0x83, 0x59, 0x3c, 0x19, 0xe6, 0x85, 0x4f, 0xa8,
        0x68, 0x6b, 0x81, 0xb2, 0x71, 0x64, 0xda, 0x8b, 0xf8, 0xeb, 0x0f, 0x4b, 0x70, 0x56, 0x9d, 0x35,
        0x1e, 0x24, 0x0e, 0x5e, 0x63, 0x58, 0xd1, 0xa2, 0x25, 0x22, 0x7c, 0x3b, 0x01, 0x21, 0x78, 0x87,
        0xd4, 0x00, 0x46, 0x57, 0x9f, 0xd3, 0x27, 0x52, 0x4c, 0x36, 0x02, 0xe7, 0xa0, 0xc4, 0xc8, 0x9e,
        0xea, 0xbf, 0x8a, 0xd2, 0x40, 0xc7, 0x38, 0xb5, 0xa3, 0xf7, 0xf2, 0xce, 0xf9, 0x61, 0x15, 0xa1,
        0xe0, 0xae, 0x5d, 0xa4, 0x9b, 0x34, 0x1a, 0x55, 0xad, 0x93, 0x32, 0x30, 0xf5, 0x8c, 0xb1, 0xe3,
        0x1d, 0xf6, 0xe2, 0x2e, 0x82, 0x66, 0xca, 0x60, 0xc0, 0x29, 0x23, 0xab, 0x0d, 0x53, 0x4e, 0x6f,
        0xd5, 0xdb, 0x37, 0x45, 0xde, 0xfd, 0x8e, 0x2f, 0x03, 0xff, 0x6a, 0x72, 0x6d, 0x6c, 0x5b, 0x51,
        0x8d, 0x1b, 0xaf, 0x92, 0xbb, 0xdd, 0xbc, 0x7f, 0x11, 0xd9, 0x5c, 0x41, 0x1f, 0x10, 0x5a, 0xd8,
        0x0a, 0xc1, 0x31, 0x88, 0xa5, 0xcd, 0x7b, 0xbd, 0x2d, 0x74, 0xd0, 0x12, 0xb8, 0xe5, 0xb4, 0xb0,
        0x89, 0x69, 0x97, 0x4a, 0x0c, 0x96, 0x77, 0x7e, 0x65, 0xb9, 0xf1, 0x09, 0xc5, 0x6e, 0xc6, 0x84,
        0x18, 0xf0, 0x7d, 0xec, 0x3a, 0xdc, 0x4d, 0x20, 0x79, 0xee, 0x5f, 0x3e, 0xd7, 0xcb, 0x39, 0x48
    ];

    // 系统参数FK
    const FK = [0xa3b1bac6, 0x56aa3350, 0x677d9197, 0xb27022dc];

    // 固定参数CK（根据 SM4 规范计算得出）
    // CK[i] = (ck(i,0), ck(i,1), ck(i,2), ck(i,3))
    // 其中 ck(i,j) = (4i + j) × 7 mod 256
    const CK_CORRECT = [];
    for (let i = 0; i < 32; i++) {
        CK_CORRECT[i] = ((i * 4 * 7) & 0xff) << 24 |
                        (((i * 4 + 1) * 7) & 0xff) << 16 |
                        (((i * 4 + 2) * 7) & 0xff) << 8 |
                        (((i * 4 + 3) * 7) & 0xff);
    }

    function rotl(x, n) {
        return ((x << n) | (x >>> (32 - n))) >>> 0;
    }

    function tau(a) {
        return (SBOX[(a >>> 24) & 0xff] << 24 |
                SBOX[(a >>> 16) & 0xff] << 16 |
                SBOX[(a >>> 8) & 0xff] << 8 |
                SBOX[a & 0xff]) >>> 0;
    }

    function L(b) {
        return (b ^ rotl(b, 2) ^ rotl(b, 10) ^ rotl(b, 18) ^ rotl(b, 24)) >>> 0;
    }

    function L_prime(b) {
        return (b ^ rotl(b, 13) ^ rotl(b, 23)) >>> 0;
    }

    function T(x) {
        return L(tau(x));
    }

    function T_prime(x) {
        return L_prime(tau(x));
    }

    // 密钥扩展
    function keyExpansion(key) {
        const K = new Uint32Array(36);
        const rk = new Uint32Array(32);

        // 将密钥转换为4个32位字
        K[0] = (key[0] << 24 | key[1] << 16 | key[2] << 8 | key[3]) ^ FK[0];
        K[1] = (key[4] << 24 | key[5] << 16 | key[6] << 8 | key[7]) ^ FK[1];
        K[2] = (key[8] << 24 | key[9] << 16 | key[10] << 8 | key[11]) ^ FK[2];
        K[3] = (key[12] << 24 | key[13] << 16 | key[14] << 8 | key[15]) ^ FK[3];

        for (let i = 0; i < 32; i++) {
            K[i + 4] = (K[i] ^ T_prime(K[i + 1] ^ K[i + 2] ^ K[i + 3] ^ CK_CORRECT[i])) >>> 0;
            rk[i] = K[i + 4];
        }

        return rk;
    }

    // 单块加密
    function encryptBlock(block, rk) {
        const X = new Uint32Array(36);

        X[0] = (block[0] << 24 | block[1] << 16 | block[2] << 8 | block[3]) >>> 0;
        X[1] = (block[4] << 24 | block[5] << 16 | block[6] << 8 | block[7]) >>> 0;
        X[2] = (block[8] << 24 | block[9] << 16 | block[10] << 8 | block[11]) >>> 0;
        X[3] = (block[12] << 24 | block[13] << 16 | block[14] << 8 | block[15]) >>> 0;

        for (let i = 0; i < 32; i++) {
            X[i + 4] = (X[i] ^ T(X[i + 1] ^ X[i + 2] ^ X[i + 3] ^ rk[i])) >>> 0;
        }

        const result = new Uint8Array(16);
        result[0] = (X[35] >>> 24) & 0xff;
        result[1] = (X[35] >>> 16) & 0xff;
        result[2] = (X[35] >>> 8) & 0xff;
        result[3] = X[35] & 0xff;
        result[4] = (X[34] >>> 24) & 0xff;
        result[5] = (X[34] >>> 16) & 0xff;
        result[6] = (X[34] >>> 8) & 0xff;
        result[7] = X[34] & 0xff;
        result[8] = (X[33] >>> 24) & 0xff;
        result[9] = (X[33] >>> 16) & 0xff;
        result[10] = (X[33] >>> 8) & 0xff;
        result[11] = X[33] & 0xff;
        result[12] = (X[32] >>> 24) & 0xff;
        result[13] = (X[32] >>> 16) & 0xff;
        result[14] = (X[32] >>> 8) & 0xff;
        result[15] = X[32] & 0xff;

        return result;
    }

    // 单块解密（使用反序轮密钥）
    function decryptBlock(block, rk) {
        const reversedRk = new Uint32Array(32);
        for (let i = 0; i < 32; i++) {
            reversedRk[i] = rk[31 - i];
        }
        return encryptBlock(block, reversedRk);
    }

    // PKCS7 填充
    function pkcs7Pad(data) {
        const padLen = 16 - (data.length % 16);
        const padded = new Uint8Array(data.length + padLen);
        padded.set(data);
        for (let i = data.length; i < padded.length; i++) {
            padded[i] = padLen;
        }
        return padded;
    }

    function pkcs7Unpad(data) {
        const padLen = data[data.length - 1];
        if (padLen > 16 || padLen === 0) {
            throw new Error('无效的PKCS7填充');
        }
        for (let i = data.length - padLen; i < data.length; i++) {
            if (data[i] !== padLen) {
                throw new Error('无效的PKCS7填充');
            }
        }
        return data.slice(0, data.length - padLen);
    }

    // Zero 填充
    function zeroPad(data) {
        if (data.length % 16 === 0) return data;
        const padLen = 16 - (data.length % 16);
        const padded = new Uint8Array(data.length + padLen);
        padded.set(data);
        return padded;
    }

    function zeroUnpad(data) {
        let end = data.length;
        while (end > 0 && data[end - 1] === 0) {
            end--;
        }
        return data.slice(0, end);
    }

    // XOR 两个数组
    function xorBlocks(a, b) {
        const result = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            result[i] = a[i] ^ b[i];
        }
        return result;
    }

    // ECB 加密
    function encryptECB(plaintext, key, padding) {
        const rk = keyExpansion(key);
        let data;

        if (padding === 'pkcs7') {
            data = pkcs7Pad(plaintext);
        } else if (padding === 'zero') {
            data = zeroPad(plaintext);
        } else {
            if (plaintext.length % 16 !== 0) {
                throw new Error('无填充模式要求输入长度为16的倍数');
            }
            data = plaintext;
        }

        const result = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i += 16) {
            const block = data.slice(i, i + 16);
            const encrypted = encryptBlock(block, rk);
            result.set(encrypted, i);
        }

        return result;
    }

    // ECB 解密
    function decryptECB(ciphertext, key, padding) {
        if (ciphertext.length % 16 !== 0) {
            throw new Error('密文长度必须是16的倍数');
        }

        const rk = keyExpansion(key);
        const result = new Uint8Array(ciphertext.length);

        for (let i = 0; i < ciphertext.length; i += 16) {
            const block = ciphertext.slice(i, i + 16);
            const decrypted = decryptBlock(block, rk);
            result.set(decrypted, i);
        }

        if (padding === 'pkcs7') {
            return pkcs7Unpad(result);
        } else if (padding === 'zero') {
            return zeroUnpad(result);
        }
        return result;
    }

    // CBC 加密
    function encryptCBC(plaintext, key, iv, padding) {
        const rk = keyExpansion(key);
        let data;

        if (padding === 'pkcs7') {
            data = pkcs7Pad(plaintext);
        } else if (padding === 'zero') {
            data = zeroPad(plaintext);
        } else {
            if (plaintext.length % 16 !== 0) {
                throw new Error('无填充模式要求输入长度为16的倍数');
            }
            data = plaintext;
        }

        const result = new Uint8Array(data.length);
        let prevBlock = iv;

        for (let i = 0; i < data.length; i += 16) {
            const block = data.slice(i, i + 16);
            const xored = xorBlocks(block, prevBlock);
            const encrypted = encryptBlock(xored, rk);
            result.set(encrypted, i);
            prevBlock = encrypted;
        }

        return result;
    }

    // CBC 解密
    function decryptCBC(ciphertext, key, iv, padding) {
        if (ciphertext.length % 16 !== 0) {
            throw new Error('密文长度必须是16的倍数');
        }

        const rk = keyExpansion(key);
        const result = new Uint8Array(ciphertext.length);
        let prevBlock = iv;

        for (let i = 0; i < ciphertext.length; i += 16) {
            const block = ciphertext.slice(i, i + 16);
            const decrypted = decryptBlock(block, rk);
            const xored = xorBlocks(decrypted, prevBlock);
            result.set(xored, i);
            prevBlock = block;
        }

        if (padding === 'pkcs7') {
            return pkcs7Unpad(result);
        } else if (padding === 'zero') {
            return zeroUnpad(result);
        }
        return result;
    }

    // ========== 工具函数 ==========

    function hexToBytes(hex) {
        hex = hex.replace(/\s/g, '');
        if (hex.length % 2 !== 0) {
            throw new Error('十六进制字符串长度必须为偶数');
        }
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return bytes;
    }

    function bytesToHex(bytes) {
        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    function stringToBytes(str) {
        return new TextEncoder().encode(str);
    }

    function bytesToString(bytes) {
        return new TextDecoder().decode(bytes);
    }

    function bytesToBase64(bytes) {
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function base64ToBytes(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    function generateRandomBytes(length) {
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        return bytes;
    }

    // ========== UI 函数 ==========

    function getKey() {
        const keyInput = document.getElementById('key-input');
        const keyFormat = document.querySelector('input[name="key-format"]:checked')?.value || 'text';
        const keyValue = keyInput?.value || '';

        if (!keyValue) {
            throw new Error('请输入密钥');
        }

        let key;
        if (keyFormat === 'hex') {
            key = hexToBytes(keyValue);
        } else {
            key = stringToBytes(keyValue);
        }

        if (key.length !== 16) {
            throw new Error('密钥长度必须为16字节');
        }

        return key;
    }

    function getIV() {
        const mode = document.getElementById('mode-select')?.value || 'cbc';
        if (mode === 'ecb') return null;

        const ivInput = document.getElementById('iv-input');
        const ivFormat = document.querySelector('input[name="iv-format"]:checked')?.value || 'text';
        const ivValue = ivInput?.value || '';

        if (!ivValue) {
            throw new Error('请输入IV初始向量');
        }

        let iv;
        if (ivFormat === 'hex') {
            iv = hexToBytes(ivValue);
        } else {
            iv = stringToBytes(ivValue);
        }

        if (iv.length !== 16) {
            throw new Error('IV长度必须为16字节');
        }

        return iv;
    }

    function encrypt() {
        try {
            const input = document.getElementById('input')?.value || '';
            if (!input.trim()) {
                throw new Error('请输入要加密的内容');
            }

            const key = getKey();
            const mode = document.getElementById('mode-select')?.value || 'cbc';
            const padding = document.getElementById('padding-select')?.value || 'pkcs7';
            const outputFormat = document.getElementById('output-format')?.value || 'hex';

            const plaintext = stringToBytes(input);
            let ciphertext;

            if (mode === 'ecb') {
                ciphertext = encryptECB(plaintext, key, padding);
            } else {
                const iv = getIV();
                ciphertext = encryptCBC(plaintext, key, iv, padding);
            }

            const output = document.getElementById('output');
            if (output) {
                if (outputFormat === 'hex') {
                    output.value = bytesToHex(ciphertext);
                } else {
                    output.value = bytesToBase64(ciphertext);
                }
            }

            REOT.utils?.showNotification('加密成功', 'success');

        } catch (error) {
            const output = document.getElementById('output');
            if (output) output.value = '错误: ' + error.message;
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    function decrypt() {
        try {
            const input = document.getElementById('input')?.value || '';
            if (!input.trim()) {
                throw new Error('请输入要解密的内容');
            }

            const key = getKey();
            const mode = document.getElementById('mode-select')?.value || 'cbc';
            const padding = document.getElementById('padding-select')?.value || 'pkcs7';
            const outputFormat = document.getElementById('output-format')?.value || 'hex';

            let ciphertext;
            if (outputFormat === 'hex') {
                ciphertext = hexToBytes(input.trim());
            } else {
                ciphertext = base64ToBytes(input.trim());
            }

            let plaintext;

            if (mode === 'ecb') {
                plaintext = decryptECB(ciphertext, key, padding);
            } else {
                const iv = getIV();
                plaintext = decryptCBC(ciphertext, key, iv, padding);
            }

            const output = document.getElementById('output');
            if (output) {
                output.value = bytesToString(plaintext);
            }

            REOT.utils?.showNotification('解密成功', 'success');

        } catch (error) {
            const output = document.getElementById('output');
            if (output) output.value = '错误: ' + error.message;
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    // 检查当前是否在 SM4 工具页面
    function isSm4ToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/encryption/sm4');
    }

    // 更新IV显示
    function updateIVVisibility() {
        const mode = document.getElementById('mode-select')?.value || 'cbc';
        const ivGroup = document.getElementById('iv-group');
        if (ivGroup) {
            ivGroup.style.display = mode === 'ecb' ? 'none' : 'block';
        }
    }

    // 事件委托处理器
    document.addEventListener('click', async (e) => {
        if (!isSm4ToolActive()) return;

        const target = e.target;

        // 加密按钮
        if (target.id === 'encrypt-btn' || target.closest('#encrypt-btn')) {
            encrypt();
        }

        // 解密按钮
        if (target.id === 'decrypt-btn' || target.closest('#decrypt-btn')) {
            decrypt();
        }

        // 生成密钥按钮
        if (target.id === 'generate-key-btn' || target.closest('#generate-key-btn')) {
            const keyInput = document.getElementById('key-input');
            const keyFormat = document.querySelector('input[name="key-format"]:checked')?.value || 'text';
            const randomBytes = generateRandomBytes(16);

            if (keyInput) {
                if (keyFormat === 'hex') {
                    keyInput.value = bytesToHex(randomBytes);
                } else {
                    // 生成可打印字符
                    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                    let result = '';
                    for (let i = 0; i < 16; i++) {
                        result += chars[randomBytes[i] % chars.length];
                    }
                    keyInput.value = result;
                }
            }
            REOT.utils?.showNotification('密钥已生成', 'success');
        }

        // 生成IV按钮
        if (target.id === 'generate-iv-btn' || target.closest('#generate-iv-btn')) {
            const ivInput = document.getElementById('iv-input');
            const ivFormat = document.querySelector('input[name="iv-format"]:checked')?.value || 'text';
            const randomBytes = generateRandomBytes(16);

            if (ivInput) {
                if (ivFormat === 'hex') {
                    ivInput.value = bytesToHex(randomBytes);
                } else {
                    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                    let result = '';
                    for (let i = 0; i < 16; i++) {
                        result += chars[randomBytes[i] % chars.length];
                    }
                    ivInput.value = result;
                }
            }
            REOT.utils?.showNotification('IV已生成', 'success');
        }

        // 清除按钮
        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            const input = document.getElementById('input');
            const output = document.getElementById('output');
            if (input) input.value = '';
            if (output) output.value = '';
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
    });

    // 模式变化时更新IV显示
    document.addEventListener('change', (e) => {
        if (!isSm4ToolActive()) return;

        if (e.target.id === 'mode-select') {
            updateIVVisibility();
        }
    });

    // 初始化
    setTimeout(() => {
        updateIVVisibility();
    }, 100);

    // 导出工具函数
    window.SM4Tool = {
        encryptECB,
        decryptECB,
        encryptCBC,
        decryptCBC,
        encrypt,
        decrypt
    };

})();
