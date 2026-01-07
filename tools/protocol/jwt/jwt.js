/**
 * JWT 解析工具
 * @description JWT Token 解析与验证
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // DOM 元素
    const inputEl = document.getElementById('input');
    const decodeBtnEl = document.getElementById('decode-btn');
    const clearBtnEl = document.getElementById('clear-btn');
    const resultEl = document.getElementById('jwt-result');
    const errorEl = document.getElementById('error-section');
    const errorMsgEl = document.getElementById('error-message');
    const headerJsonEl = document.getElementById('header-json');
    const payloadJsonEl = document.getElementById('payload-json');
    const signatureEl = document.getElementById('signature-value');
    const algEl = document.getElementById('jwt-alg');
    const timesEl = document.getElementById('jwt-times');

    /**
     * Base64URL 解码
     * @param {string} str - Base64URL 编码的字符串
     * @returns {string} - 解码后的字符串
     */
    function base64UrlDecode(str) {
        // 将 Base64URL 转换为标准 Base64
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

        // 添加填充
        const pad = base64.length % 4;
        if (pad) {
            base64 += '='.repeat(4 - pad);
        }

        // 解码
        try {
            return decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
        } catch (e) {
            return atob(base64);
        }
    }

    /**
     * 解析 JWT
     * @param {string} token - JWT Token
     * @returns {Object} - 解析结果
     */
    function decode(token) {
        if (!token) {
            throw new Error('请输入 JWT Token');
        }

        // 清理输入
        token = token.trim();

        // 移除 Bearer 前缀
        if (token.toLowerCase().startsWith('bearer ')) {
            token = token.slice(7);
        }

        // 分割 JWT 的三个部分
        const parts = token.split('.');

        if (parts.length !== 3) {
            throw new Error('无效的 JWT 格式：JWT 应包含三个由点号分隔的部分');
        }

        try {
            // 解码 Header
            const headerJson = base64UrlDecode(parts[0]);
            const header = JSON.parse(headerJson);

            // 解码 Payload
            const payloadJson = base64UrlDecode(parts[1]);
            const payload = JSON.parse(payloadJson);

            // Signature (保持 Base64URL 格式)
            const signature = parts[2];

            return {
                header,
                payload,
                signature,
                raw: {
                    header: parts[0],
                    payload: parts[1],
                    signature: parts[2]
                }
            };
        } catch (e) {
            throw new Error('JWT 解析失败：' + e.message);
        }
    }

    /**
     * 格式化 JSON 并添加语法高亮
     * @param {Object} obj - JSON 对象
     * @returns {string} - 格式化后的 HTML
     */
    function formatJson(obj) {
        const json = JSON.stringify(obj, null, 2);
        return json
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"([^"]+)":/g, '<span class="jwt-key">"$1"</span>:')
            .replace(/: "([^"]*)"/g, ': <span class="jwt-string">"$1"</span>')
            .replace(/: (\d+)/g, ': <span class="jwt-number">$1</span>')
            .replace(/: (true|false)/g, ': <span class="jwt-boolean">$1</span>')
            .replace(/: (null)/g, ': <span class="jwt-null">$1</span>');
    }

    /**
     * 格式化时间戳
     * @param {number} timestamp - Unix 时间戳（秒）
     * @returns {string} - 格式化后的时间
     */
    function formatTimestamp(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    }

    /**
     * 显示解析结果
     * @param {Object} result - 解析结果
     */
    function showResult(result) {
        // 显示 Header
        headerJsonEl.innerHTML = formatJson(result.header);
        algEl.textContent = result.header.alg || '';

        // 显示 Payload
        payloadJsonEl.innerHTML = formatJson(result.payload);

        // 显示时间信息
        const payload = result.payload;
        let hasTime = false;

        if (payload.iat) {
            document.getElementById('jwt-iat').style.display = 'flex';
            document.getElementById('jwt-iat-value').textContent = formatTimestamp(payload.iat);
            hasTime = true;
        } else {
            document.getElementById('jwt-iat').style.display = 'none';
        }

        if (payload.exp) {
            document.getElementById('jwt-exp').style.display = 'flex';
            document.getElementById('jwt-exp-value').textContent = formatTimestamp(payload.exp);

            const now = Math.floor(Date.now() / 1000);
            const statusEl = document.getElementById('jwt-exp-status');
            if (payload.exp < now) {
                statusEl.textContent = '(已过期)';
                statusEl.className = 'jwt-time-status expired';
            } else {
                const remaining = payload.exp - now;
                const hours = Math.floor(remaining / 3600);
                const minutes = Math.floor((remaining % 3600) / 60);
                statusEl.textContent = `(剩余 ${hours}h ${minutes}m)`;
                statusEl.className = 'jwt-time-status valid';
            }
            hasTime = true;
        } else {
            document.getElementById('jwt-exp').style.display = 'none';
        }

        if (payload.nbf) {
            document.getElementById('jwt-nbf').style.display = 'flex';
            document.getElementById('jwt-nbf-value').textContent = formatTimestamp(payload.nbf);
            hasTime = true;
        } else {
            document.getElementById('jwt-nbf').style.display = 'none';
        }

        timesEl.style.display = hasTime ? 'block' : 'none';

        // 显示 Signature
        signatureEl.textContent = result.signature;

        // 显示结果，隐藏错误
        resultEl.style.display = 'block';
        errorEl.style.display = 'none';
    }

    /**
     * 显示错误
     * @param {string} message - 错误信息
     */
    function showError(message) {
        errorMsgEl.textContent = message;
        errorEl.style.display = 'block';
        resultEl.style.display = 'none';
    }

    // 事件监听
    if (decodeBtnEl) {
        decodeBtnEl.addEventListener('click', () => {
            try {
                const result = decode(inputEl.value);
                showResult(result);
            } catch (error) {
                showError(error.message);
            }
        });
    }

    if (clearBtnEl) {
        clearBtnEl.addEventListener('click', () => {
            inputEl.value = '';
            resultEl.style.display = 'none';
            errorEl.style.display = 'none';
        });
    }

    // 实时解析
    if (inputEl) {
        inputEl.addEventListener('input', () => {
            if (inputEl.value.trim()) {
                try {
                    const result = decode(inputEl.value);
                    showResult(result);
                } catch (error) {
                    showError(error.message);
                }
            } else {
                resultEl.style.display = 'none';
                errorEl.style.display = 'none';
            }
        });
    }

    // 复制按钮
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                const success = await REOT.utils?.copyToClipboard(targetEl.textContent);
                if (success) {
                    REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
                }
            }
        });
    });

    // 导出到全局
    window.JWTTool = { decode, base64UrlDecode };
})();
