/**
 * 密码生成器
 * @description 生成安全的随机密码
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    const CHARSETS = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
        similar: '0O1lI',
        ambiguous: '{}[]()/\\\'"`~,;:.<>'
    };

    // DOM 元素
    const passwordInput = document.getElementById('password');
    const lengthSlider = document.getElementById('length-slider');
    const lengthValue = document.getElementById('length-value');
    const uppercaseCheck = document.getElementById('uppercase');
    const lowercaseCheck = document.getElementById('lowercase');
    const numbersCheck = document.getElementById('numbers');
    const symbolsCheck = document.getElementById('symbols');
    const noSimilarCheck = document.getElementById('no-similar');
    const noAmbiguousCheck = document.getElementById('no-ambiguous');
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');
    const refreshBtn = document.getElementById('refresh-btn');
    const copyBtn = document.getElementById('copy-btn');
    const generateBtn = document.getElementById('generate-btn');
    const historyList = document.getElementById('history-list');

    let history = [];

    /**
     * 获取字符集
     * @returns {string}
     */
    function getCharset() {
        let charset = '';
        if (uppercaseCheck.checked) charset += CHARSETS.uppercase;
        if (lowercaseCheck.checked) charset += CHARSETS.lowercase;
        if (numbersCheck.checked) charset += CHARSETS.numbers;
        if (symbolsCheck.checked) charset += CHARSETS.symbols;

        // 移除相似字符
        if (noSimilarCheck.checked) {
            for (const char of CHARSETS.similar) {
                charset = charset.replace(new RegExp(char, 'g'), '');
            }
        }

        // 移除歧义字符
        if (noAmbiguousCheck.checked) {
            for (const char of CHARSETS.ambiguous) {
                charset = charset.replace(new RegExp('\\' + char, 'g'), '');
            }
        }

        return charset;
    }

    /**
     * 生成密码
     * @param {number} length
     * @param {string} charset
     * @returns {string}
     */
    function generate(length, charset) {
        const array = new Uint32Array(length);
        crypto.getRandomValues(array);

        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset[array[i] % charset.length];
        }
        return result;
    }

    /**
     * 计算密码强度
     * @param {string} password
     * @returns {Object}
     */
    function calculateStrength(password) {
        let score = 0;
        const length = password.length;

        // 长度分数
        if (length >= 8) score += 1;
        if (length >= 12) score += 1;
        if (length >= 16) score += 1;
        if (length >= 24) score += 1;

        // 字符类型分数
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^a-zA-Z0-9]/.test(password)) score += 1;

        let level, color, text;
        if (score <= 2) {
            level = 25; color = '#ef4444'; text = '弱';
        } else if (score <= 4) {
            level = 50; color = '#f59e0b'; text = '中';
        } else if (score <= 6) {
            level = 75; color = '#10b981'; text = '强';
        } else {
            level = 100; color = '#22c55e'; text = '非常强';
        }

        return { level, color, text };
    }

    /**
     * 更新强度显示
     * @param {string} password
     */
    function updateStrength(password) {
        const strength = calculateStrength(password);
        strengthFill.style.width = strength.level + '%';
        strengthFill.style.backgroundColor = strength.color;
        strengthText.textContent = strength.text;
    }

    /**
     * 生成新密码
     */
    function generatePassword() {
        const length = parseInt(lengthSlider.value);
        const charset = getCharset();

        if (!charset) {
            passwordInput.value = '请选择至少一种字符类型';
            return;
        }

        const password = generate(length, charset);
        passwordInput.value = password;
        updateStrength(password);

        // 添加到历史
        addToHistory(password);
    }

    /**
     * 添加到历史记录
     * @param {string} password
     */
    function addToHistory(password) {
        history.unshift(password);
        if (history.length > 10) history.pop();
        renderHistory();
    }

    /**
     * 渲染历史记录
     */
    function renderHistory() {
        historyList.innerHTML = history.map((pwd, i) => `
            <div class="history-item">
                <code>${pwd}</code>
                <button class="btn btn--sm btn--outline" onclick="navigator.clipboard.writeText('${pwd}')">复制</button>
            </div>
        `).join('');
    }

    // 事件监听
    lengthSlider.addEventListener('input', (e) => {
        lengthValue.textContent = e.target.value;
    });

    lengthSlider.addEventListener('change', generatePassword);

    [uppercaseCheck, lowercaseCheck, numbersCheck, symbolsCheck, noSimilarCheck, noAmbiguousCheck].forEach(el => {
        el.addEventListener('change', generatePassword);
    });

    refreshBtn.addEventListener('click', generatePassword);
    generateBtn.addEventListener('click', generatePassword);

    copyBtn.addEventListener('click', async () => {
        if (passwordInput.value) {
            const success = await REOT.utils?.copyToClipboard(passwordInput.value);
            if (success) {
                REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
            }
        }
    });

    // 初始生成
    generatePassword();

    // 导出到全局
    window.PasswordTool = { generate, calculateStrength };
})();
