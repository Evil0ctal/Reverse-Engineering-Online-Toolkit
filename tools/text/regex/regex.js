/**
 * 正则表达式测试工具
 * @description 正则表达式在线测试与调试
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // DOM 元素
    const regexInput = document.getElementById('regex-input');
    const flagsInput = document.getElementById('flags-input');
    const inputEl = document.getElementById('input');
    const matchesResult = document.getElementById('matches-result');
    const highlightedText = document.getElementById('highlighted-text');
    const replaceInput = document.getElementById('replace-input');
    const replaceResult = document.getElementById('replace-result');
    const replaceBtn = document.getElementById('replace-btn');
    const copyBtn = document.getElementById('copy-btn');

    // Flag checkboxes
    const flagG = document.getElementById('flag-g');
    const flagI = document.getElementById('flag-i');
    const flagM = document.getElementById('flag-m');
    const flagS = document.getElementById('flag-s');

    /**
     * 更新 flags 输入框
     */
    function updateFlags() {
        let flags = '';
        if (flagG.checked) flags += 'g';
        if (flagI.checked) flags += 'i';
        if (flagM.checked) flags += 'm';
        if (flagS.checked) flags += 's';
        flagsInput.value = flags;
        testRegex();
    }

    /**
     * 从输入框更新 checkboxes
     */
    function syncFlagsFromInput() {
        const flags = flagsInput.value;
        flagG.checked = flags.includes('g');
        flagI.checked = flags.includes('i');
        flagM.checked = flags.includes('m');
        flagS.checked = flags.includes('s');
    }

    /**
     * 转义 HTML
     * @param {string} text
     * @returns {string}
     */
    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * 测试正则表达式
     */
    function testRegex() {
        const pattern = regexInput.value;
        const flags = flagsInput.value;
        const text = inputEl.value;

        if (!pattern) {
            matchesResult.innerHTML = '<span class="no-matches">请输入正则表达式</span>';
            highlightedText.innerHTML = escapeHtml(text);
            return;
        }

        try {
            const regex = new RegExp(pattern, flags);
            const globalRegex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');

            // 获取所有匹配
            const matches = [...text.matchAll(globalRegex)];

            // 显示匹配结果
            if (matches.length === 0) {
                matchesResult.innerHTML = '<span class="no-matches">没有匹配</span>';
            } else {
                matchesResult.innerHTML = matches.map((match, i) => `
                    <div class="match-item">
                        <span class="match-index">#${i + 1}</span>
                        <span class="match-text">"${escapeHtml(match[0])}"</span>
                        <span class="match-position">位置: ${match.index}</span>
                        ${match.length > 1 ? `<div class="match-groups">
                            ${match.slice(1).map((g, j) =>
                                `<span class="match-group">$${j + 1}: "${escapeHtml(g || '')}"</span>`
                            ).join('')}
                        </div>` : ''}
                    </div>
                `).join('');
            }

            // 高亮显示
            let highlighted = escapeHtml(text);
            let offset = 0;

            // 获取新的匹配（因为 escapeHtml 改变了长度）
            const textMatches = [...text.matchAll(globalRegex)];

            for (const match of textMatches) {
                const start = match.index;
                const end = start + match[0].length;
                const escapedMatch = escapeHtml(match[0]);

                // 计算偏移后的位置
                const before = escapeHtml(text.substring(0, start));
                const after = escapeHtml(text.substring(end));

                highlighted = before +
                    '<mark class="regex-highlight">' + escapedMatch + '</mark>' +
                    after;

                // 重新构建 highlighted，处理多个匹配
                break; // 简化处理，只高亮所有匹配
            }

            // 使用替换来处理所有匹配
            highlighted = text.replace(globalRegex, (match) =>
                `<mark class="regex-highlight">${escapeHtml(match)}</mark>`
            );
            // 转义未匹配的部分
            highlightedText.innerHTML = highlighted;

        } catch (error) {
            matchesResult.innerHTML = `<span class="regex-error">错误: ${escapeHtml(error.message)}</span>`;
            highlightedText.innerHTML = escapeHtml(text);
        }
    }

    /**
     * 执行替换
     */
    function performReplace() {
        const pattern = regexInput.value;
        const flags = flagsInput.value;
        const text = inputEl.value;
        const replacement = replaceInput.value;

        if (!pattern) {
            replaceResult.value = text;
            return;
        }

        try {
            const regex = new RegExp(pattern, flags);
            replaceResult.value = text.replace(regex, replacement);
        } catch (error) {
            replaceResult.value = `错误: ${error.message}`;
        }
    }

    // 事件监听
    [regexInput, inputEl].forEach(el => {
        el.addEventListener('input', testRegex);
    });

    flagsInput.addEventListener('input', () => {
        syncFlagsFromInput();
        testRegex();
    });

    [flagG, flagI, flagM, flagS].forEach(el => {
        el.addEventListener('change', updateFlags);
    });

    if (replaceBtn) {
        replaceBtn.addEventListener('click', performReplace);
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            if (replaceResult.value) {
                const success = await REOT.utils?.copyToClipboard(replaceResult.value);
                if (success) {
                    REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
                }
            }
        });
    }

    // 导出到全局
    window.RegexTool = { testRegex, performReplace };

    // 设置默认示例数据
    if (regexInput && !regexInput.value) {
        regexInput.value = '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b';
    }
    if (inputEl && !inputEl.value) {
        inputEl.value = `Contact us at:
- support@example.com
- admin@reot.io
- john.doe@company.org
- invalid-email@
- test@test.co.uk

Please send your feedback to feedback@example.com`;
        testRegex();
    }
})();
