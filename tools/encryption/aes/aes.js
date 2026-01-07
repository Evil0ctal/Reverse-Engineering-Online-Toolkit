/**
 * AES 加解密工具
 * @description AES 对称加密与解密，支持多种模式
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // DOM 元素
    const modeSelect = document.getElementById('mode-select');
    const keySizeSelect = document.getElementById('key-size-select');
    const outputFormatSelect = document.getElementById('output-format');
    const keyInput = document.getElementById('key-input');
    const ivInput = document.getElementById('iv-input');
    const generateKeyBtn = document.getElementById('generate-key-btn');
    const generateIvBtn = document.getElementById('generate-iv-btn');
    const inputEl = document.getElementById('input');
    const outputEl = document.getElementById('output');
    const encryptBtn = document.getElementById('encrypt-btn');
    const decryptBtn = document.getElementById('decrypt-btn');
    const swapBtn = document.getElementById('swap-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');
    const keyHint = document.getElementById('key-hint');

    /**
     * 更新密钥长度提示
     */
    function updateKeyHint() {
        const keySize = parseInt(keySizeSelect.value);
        const bytes = keySize / 8;
        const i18nKey = `tools.aes.keyHint${keySize}`;
        keyHint.setAttribute('data-i18n', i18nKey);
        keyHint.textContent = `需要 ${bytes} 字节 (${keySize} bit)`;

        // 触发 i18n 更新
        if (window.REOT?.i18n?.updateElement) {
            window.REOT.i18n.updateElement(keyHint);
        }
    }

    /**
     * 生成随机字节
     * @param {number} length - 字节长度
     * @returns {Uint8Array}
     */
    function generateRandomBytes(length) {
        return crypto.getRandomValues(new Uint8Array(length));
    }

    /**
     * 字节数组转 Hex 字符串
     * @param {Uint8Array} bytes
     * @returns {string}
     */
    function bytesToHex(bytes) {
        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Hex 字符串转字节数组
     * @param {string} hex
     * @returns {Uint8Array}
     */
    function hexToBytes(hex) {
        hex = hex.replace(/\s/g, '');
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return bytes;
    }

    /**
     * 字符串转字节数组 (UTF-8)
     * @param {string} str
     * @returns {Uint8Array}
     */
    function stringToBytes(str) {
        return new TextEncoder().encode(str);
    }

    /**
     * 字节数组转字符串 (UTF-8)
     * @param {Uint8Array} bytes
     * @returns {string}
     */
    function bytesToString(bytes) {
        return new TextDecoder().decode(bytes);
    }

    /**
     * Base64 编码
     * @param {Uint8Array} bytes
     * @returns {string}
     */
    function bytesToBase64(bytes) {
        let binary = '';
        bytes.forEach(b => binary += String.fromCharCode(b));
        return btoa(binary);
    }

    /**
     * Base64 解码
     * @param {string} base64
     * @returns {Uint8Array}
     */
    function base64ToBytes(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * 获取密钥字节
     * @returns {Uint8Array}
     */
    function getKeyBytes() {
        const keyStr = keyInput.value.trim();
        const keySize = parseInt(keySizeSelect.value) / 8;

        // 尝试解析为 Hex
        if (/^[0-9a-fA-F]+$/.test(keyStr) && keyStr.length === keySize * 2) {
            return hexToBytes(keyStr);
        }

        // 作为 UTF-8 字符串，填充或截断到目标长度
        const keyBytes = stringToBytes(keyStr);
        const result = new Uint8Array(keySize);

        for (let i = 0; i < keySize; i++) {
            result[i] = keyBytes[i % keyBytes.length] || 0;
        }

        return result;
    }

    /**
     * 获取 IV 字节
     * @returns {Uint8Array}
     */
    function getIvBytes() {
        const ivStr = ivInput.value.trim();
        const ivSize = 16; // AES block size is always 16 bytes

        // 尝试解析为 Hex
        if (/^[0-9a-fA-F]+$/.test(ivStr) && ivStr.length === ivSize * 2) {
            return hexToBytes(ivStr);
        }

        // 作为 UTF-8 字符串，填充或截断到目标长度
        const ivBytes = stringToBytes(ivStr);
        const result = new Uint8Array(ivSize);

        for (let i = 0; i < ivSize; i++) {
            result[i] = ivBytes[i % ivBytes.length] || 0;
        }

        return result;
    }

    /**
     * 导入密钥
     * @param {Uint8Array} keyBytes
     * @param {string} mode
     * @returns {Promise<CryptoKey>}
     */
    async function importKey(keyBytes, mode) {
        const algorithm = mode === 'GCM' ? 'AES-GCM' : mode === 'CTR' ? 'AES-CTR' : 'AES-CBC';
        return await crypto.subtle.importKey(
            'raw',
            keyBytes,
            { name: algorithm },
            false,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * AES 加密
     * @param {string} plaintext
     * @returns {Promise<string>}
     */
    async function encrypt(plaintext) {
        const mode = modeSelect.value;
        const outputFormat = outputFormatSelect.value;

        const keyBytes = getKeyBytes();
        const ivBytes = getIvBytes();
        const plaintextBytes = stringToBytes(plaintext);

        const key = await importKey(keyBytes, mode);

        let algorithm;
        if (mode === 'GCM') {
            algorithm = { name: 'AES-GCM', iv: ivBytes };
        } else if (mode === 'CTR') {
            algorithm = { name: 'AES-CTR', counter: ivBytes, length: 64 };
        } else {
            algorithm = { name: 'AES-CBC', iv: ivBytes };
        }

        const ciphertext = await crypto.subtle.encrypt(algorithm, key, plaintextBytes);
        const ciphertextBytes = new Uint8Array(ciphertext);

        if (outputFormat === 'hex') {
            return bytesToHex(ciphertextBytes);
        } else {
            return bytesToBase64(ciphertextBytes);
        }
    }

    /**
     * AES 解密
     * @param {string} ciphertext
     * @returns {Promise<string>}
     */
    async function decrypt(ciphertext) {
        const mode = modeSelect.value;
        const outputFormat = outputFormatSelect.value;

        const keyBytes = getKeyBytes();
        const ivBytes = getIvBytes();

        let ciphertextBytes;
        if (outputFormat === 'hex') {
            ciphertextBytes = hexToBytes(ciphertext);
        } else {
            ciphertextBytes = base64ToBytes(ciphertext);
        }

        const key = await importKey(keyBytes, mode);

        let algorithm;
        if (mode === 'GCM') {
            algorithm = { name: 'AES-GCM', iv: ivBytes };
        } else if (mode === 'CTR') {
            algorithm = { name: 'AES-CTR', counter: ivBytes, length: 64 };
        } else {
            algorithm = { name: 'AES-CBC', iv: ivBytes };
        }

        const plaintext = await crypto.subtle.decrypt(algorithm, key, ciphertextBytes);
        return bytesToString(new Uint8Array(plaintext));
    }

    /**
     * 显示错误
     * @param {string} message
     */
    function showError(message) {
        outputEl.value = `错误: ${message}`;
        if (window.REOT?.utils?.showNotification) {
            window.REOT.utils.showNotification(message, 'error');
        }
    }

    // 事件监听
    if (keySizeSelect) {
        keySizeSelect.addEventListener('change', updateKeyHint);
    }

    if (generateKeyBtn) {
        generateKeyBtn.addEventListener('click', () => {
            const keySize = parseInt(keySizeSelect.value) / 8;
            const keyBytes = generateRandomBytes(keySize);
            keyInput.value = bytesToHex(keyBytes);
        });
    }

    if (generateIvBtn) {
        generateIvBtn.addEventListener('click', () => {
            const ivBytes = generateRandomBytes(16);
            ivInput.value = bytesToHex(ivBytes);
        });
    }

    if (encryptBtn) {
        encryptBtn.addEventListener('click', async () => {
            try {
                const input = inputEl.value;
                if (!input) {
                    showError('请输入要加密的内容');
                    return;
                }
                if (!keyInput.value.trim()) {
                    showError('请输入密钥');
                    return;
                }
                if (!ivInput.value.trim()) {
                    showError('请输入 IV 向量');
                    return;
                }

                const result = await encrypt(input);
                outputEl.value = result;
            } catch (error) {
                showError(error.message);
            }
        });
    }

    if (decryptBtn) {
        decryptBtn.addEventListener('click', async () => {
            try {
                const input = inputEl.value;
                if (!input) {
                    showError('请输入要解密的内容');
                    return;
                }
                if (!keyInput.value.trim()) {
                    showError('请输入密钥');
                    return;
                }
                if (!ivInput.value.trim()) {
                    showError('请输入 IV 向量');
                    return;
                }

                const result = await decrypt(input);
                outputEl.value = result;
            } catch (error) {
                showError('解密失败: ' + error.message);
            }
        });
    }

    if (swapBtn) {
        swapBtn.addEventListener('click', () => {
            const temp = inputEl.value;
            inputEl.value = outputEl.value;
            outputEl.value = temp;
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            inputEl.value = '';
            outputEl.value = '';
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            if (outputEl.value) {
                const success = await REOT.utils?.copyToClipboard(outputEl.value);
                if (success) {
                    REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
                }
            }
        });
    }

    // 初始化
    updateKeyHint();

    // 导出到全局
    window.AESTool = { encrypt, decrypt };

    // 设置默认示例数据
    if (inputEl && !inputEl.value) {
        inputEl.value = 'Hello, AES Encryption! 你好，AES 加密！';
    }
    if (keyInput && !keyInput.value) {
        keyInput.value = 'my-secret-key-16';  // 16 bytes for AES-128
    }
    if (ivInput && !ivInput.value) {
        ivInput.value = '1234567890123456';  // 16 bytes IV
    }
})();
