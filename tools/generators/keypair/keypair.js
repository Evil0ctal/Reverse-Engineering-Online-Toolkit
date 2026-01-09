/**
 * 密钥对生成工具
 * @description 生成 RSA、ECDSA、Ed25519 等密钥对
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // 算法配置
    const ALGORITHMS = {
        'RSA-2048': {
            name: 'RSASSA-PKCS1-v1_5',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256'
        },
        'RSA-3072': {
            name: 'RSASSA-PKCS1-v1_5',
            modulusLength: 3072,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256'
        },
        'RSA-4096': {
            name: 'RSASSA-PKCS1-v1_5',
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256'
        },
        'ECDSA-P256': {
            name: 'ECDSA',
            namedCurve: 'P-256'
        },
        'ECDSA-P384': {
            name: 'ECDSA',
            namedCurve: 'P-384'
        },
        'ECDSA-P521': {
            name: 'ECDSA',
            namedCurve: 'P-521'
        },
        'Ed25519': {
            name: 'Ed25519'
        }
    };

    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function formatPEM(base64, type) {
        const lines = [];
        for (let i = 0; i < base64.length; i += 64) {
            lines.push(base64.slice(i, i + 64));
        }
        return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`;
    }

    async function generateKeyPair() {
        const algorithmId = document.getElementById('algorithm-select')?.value || 'ECDSA-P256';
        const format = document.getElementById('format-select')?.value || 'pem';
        const publicKeyEl = document.getElementById('public-key');
        const privateKeyEl = document.getElementById('private-key');

        try {
            REOT.utils?.showNotification('正在生成密钥对...', 'info');

            const algorithm = ALGORITHMS[algorithmId];
            let keyPair;

            // Ed25519 需要特殊处理
            if (algorithmId === 'Ed25519') {
                // 检查浏览器是否支持 Ed25519
                try {
                    keyPair = await crypto.subtle.generateKey(
                        { name: 'Ed25519' },
                        true,
                        ['sign', 'verify']
                    );
                } catch (e) {
                    throw new Error('您的浏览器不支持 Ed25519，请使用最新版本的 Chrome 或 Edge');
                }
            } else if (algorithm.name === 'RSASSA-PKCS1-v1_5') {
                keyPair = await crypto.subtle.generateKey(
                    algorithm,
                    true,
                    ['sign', 'verify']
                );
            } else {
                keyPair = await crypto.subtle.generateKey(
                    algorithm,
                    true,
                    ['sign', 'verify']
                );
            }

            // 导出密钥
            if (format === 'jwk') {
                const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
                const privateJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

                if (publicKeyEl) {
                    publicKeyEl.value = JSON.stringify(publicJwk, null, 2);
                }
                if (privateKeyEl) {
                    privateKeyEl.value = JSON.stringify(privateJwk, null, 2);
                }
            } else {
                // PEM 格式
                const publicSpki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
                const privatePkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

                const publicBase64 = arrayBufferToBase64(publicSpki);
                const privateBase64 = arrayBufferToBase64(privatePkcs8);

                if (publicKeyEl) {
                    publicKeyEl.value = formatPEM(publicBase64, 'PUBLIC KEY');
                }
                if (privateKeyEl) {
                    privateKeyEl.value = formatPEM(privateBase64, 'PRIVATE KEY');
                }
            }

            REOT.utils?.showNotification('密钥对生成成功', 'success');

        } catch (error) {
            console.error('密钥生成错误:', error);
            if (publicKeyEl) publicKeyEl.value = '';
            if (privateKeyEl) privateKeyEl.value = '错误: ' + error.message;
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    function isKeypairToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/generators/keypair');
    }

    document.addEventListener('click', async (e) => {
        if (!isKeypairToolActive()) return;

        const target = e.target;

        if (target.id === 'generate-btn' || target.closest('#generate-btn')) {
            await generateKeyPair();
        }

        if (target.id === 'copy-public-btn' || target.closest('#copy-public-btn')) {
            const publicKey = document.getElementById('public-key');
            if (publicKey && publicKey.value) {
                const success = await REOT.utils?.copyToClipboard(publicKey.value);
                if (success) {
                    REOT.utils?.showNotification('公钥已复制', 'success');
                }
            }
        }

        if (target.id === 'copy-private-btn' || target.closest('#copy-private-btn')) {
            const privateKey = document.getElementById('private-key');
            if (privateKey && privateKey.value) {
                const success = await REOT.utils?.copyToClipboard(privateKey.value);
                if (success) {
                    REOT.utils?.showNotification('私钥已复制', 'success');
                }
            }
        }
    });

    window.KeypairTool = { generateKeyPair };

})();
