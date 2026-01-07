/**
 * RSA 加解密工具
 * @description RSA 非对称加密与解密
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // DOM 元素
    const keySizeSelect = document.getElementById('key-size-select');
    const outputFormatSelect = document.getElementById('output-format');
    const generateKeysBtn = document.getElementById('generate-keys-btn');
    const publicKeyEl = document.getElementById('public-key');
    const privateKeyEl = document.getElementById('private-key');
    const inputEl = document.getElementById('input');
    const outputEl = document.getElementById('output');
    const encryptBtn = document.getElementById('encrypt-btn');
    const decryptBtn = document.getElementById('decrypt-btn');
    const swapBtn = document.getElementById('swap-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');

    // 存储生成的密钥对
    let currentKeyPair = null;

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
     * ArrayBuffer 转 Base64
     * @param {ArrayBuffer} buffer
     * @returns {string}
     */
    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        bytes.forEach(b => binary += String.fromCharCode(b));
        return btoa(binary);
    }

    /**
     * Base64 转 ArrayBuffer
     * @param {string} base64
     * @returns {ArrayBuffer}
     */
    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * 导出公钥为 PEM 格式
     * @param {CryptoKey} key
     * @returns {Promise<string>}
     */
    async function exportPublicKey(key) {
        const exported = await crypto.subtle.exportKey('spki', key);
        const base64 = arrayBufferToBase64(exported);
        const lines = base64.match(/.{1,64}/g) || [];
        return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`;
    }

    /**
     * 导出私钥为 PEM 格式
     * @param {CryptoKey} key
     * @returns {Promise<string>}
     */
    async function exportPrivateKey(key) {
        const exported = await crypto.subtle.exportKey('pkcs8', key);
        const base64 = arrayBufferToBase64(exported);
        const lines = base64.match(/.{1,64}/g) || [];
        return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`;
    }

    /**
     * 从 PEM 格式导入公钥
     * @param {string} pem
     * @returns {Promise<CryptoKey>}
     */
    async function importPublicKey(pem) {
        const pemContents = pem
            .replace(/-----BEGIN PUBLIC KEY-----/, '')
            .replace(/-----END PUBLIC KEY-----/, '')
            .replace(/\s/g, '');
        const binaryDer = base64ToArrayBuffer(pemContents);
        return await crypto.subtle.importKey(
            'spki',
            binaryDer,
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256'
            },
            true,
            ['encrypt']
        );
    }

    /**
     * 从 PEM 格式导入私钥
     * @param {string} pem
     * @returns {Promise<CryptoKey>}
     */
    async function importPrivateKey(pem) {
        const pemContents = pem
            .replace(/-----BEGIN PRIVATE KEY-----/, '')
            .replace(/-----END PRIVATE KEY-----/, '')
            .replace(/\s/g, '');
        const binaryDer = base64ToArrayBuffer(pemContents);
        return await crypto.subtle.importKey(
            'pkcs8',
            binaryDer,
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256'
            },
            true,
            ['decrypt']
        );
    }

    /**
     * 生成 RSA 密钥对
     * @returns {Promise<CryptoKeyPair>}
     */
    async function generateKeyPair() {
        const keySize = parseInt(keySizeSelect.value);
        return await crypto.subtle.generateKey(
            {
                name: 'RSA-OAEP',
                modulusLength: keySize,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256'
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * RSA 加密
     * @param {string} plaintext
     * @param {CryptoKey} publicKey
     * @returns {Promise<string>}
     */
    async function encrypt(plaintext, publicKey) {
        const encoder = new TextEncoder();
        const data = encoder.encode(plaintext);
        const encrypted = await crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            publicKey,
            data
        );
        const bytes = new Uint8Array(encrypted);
        const outputFormat = outputFormatSelect.value;
        if (outputFormat === 'hex') {
            return bytesToHex(bytes);
        } else {
            return arrayBufferToBase64(encrypted);
        }
    }

    /**
     * RSA 解密
     * @param {string} ciphertext
     * @param {CryptoKey} privateKey
     * @returns {Promise<string>}
     */
    async function decrypt(ciphertext, privateKey) {
        const outputFormat = outputFormatSelect.value;
        let buffer;
        if (outputFormat === 'hex') {
            buffer = hexToBytes(ciphertext).buffer;
        } else {
            buffer = base64ToArrayBuffer(ciphertext);
        }
        const decrypted = await crypto.subtle.decrypt(
            { name: 'RSA-OAEP' },
            privateKey,
            buffer
        );
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
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

    /**
     * 显示成功
     * @param {string} message
     */
    function showSuccess(message) {
        if (window.REOT?.utils?.showNotification) {
            window.REOT.utils.showNotification(message, 'success');
        }
    }

    // 事件监听
    if (generateKeysBtn) {
        generateKeysBtn.addEventListener('click', async () => {
            try {
                generateKeysBtn.disabled = true;
                generateKeysBtn.textContent = '生成中...';

                currentKeyPair = await generateKeyPair();
                publicKeyEl.value = await exportPublicKey(currentKeyPair.publicKey);
                privateKeyEl.value = await exportPrivateKey(currentKeyPair.privateKey);

                showSuccess(REOT.i18n?.t('tools.rsa.keysGenerated') || '密钥对已生成');
            } catch (error) {
                showError(error.message);
            } finally {
                generateKeysBtn.disabled = false;
                generateKeysBtn.textContent = REOT.i18n?.t('tools.rsa.generateKeys') || '生成密钥对';
            }
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

                const publicKeyPem = publicKeyEl.value.trim();
                if (!publicKeyPem) {
                    showError('请输入或生成公钥');
                    return;
                }

                let publicKey;
                if (currentKeyPair && publicKeyPem === await exportPublicKey(currentKeyPair.publicKey)) {
                    publicKey = currentKeyPair.publicKey;
                } else {
                    publicKey = await importPublicKey(publicKeyPem);
                }

                const result = await encrypt(input, publicKey);
                outputEl.value = result;
            } catch (error) {
                showError('加密失败: ' + error.message);
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

                const privateKeyPem = privateKeyEl.value.trim();
                if (!privateKeyPem) {
                    showError('请输入私钥');
                    return;
                }

                let privateKey;
                if (currentKeyPair && privateKeyPem === await exportPrivateKey(currentKeyPair.privateKey)) {
                    privateKey = currentKeyPair.privateKey;
                } else {
                    privateKey = await importPrivateKey(privateKeyPem);
                }

                const result = await decrypt(input, privateKey);
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

    // 复制按钮
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl && targetEl.value) {
                const success = await REOT.utils?.copyToClipboard(targetEl.value);
                if (success) {
                    REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
                }
            }
        });
    });

    // 导出到全局
    window.RSATool = { generateKeyPair, encrypt, decrypt, exportPublicKey, exportPrivateKey };
})();
