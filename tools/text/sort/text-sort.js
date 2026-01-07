/**
 * 文本排序工具
 * @description 文本行排序
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // DOM 元素
    const inputEl = document.getElementById('input');
    const outputEl = document.getElementById('output');
    const sortTypeSelect = document.getElementById('sort-type');
    const reverseCheck = document.getElementById('reverse');
    const caseInsensitiveCheck = document.getElementById('case-insensitive');
    const removeEmptyCheck = document.getElementById('remove-empty');
    const sortBtn = document.getElementById('sort-btn');
    const swapBtn = document.getElementById('swap-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');

    /**
     * 排序文本行
     * @param {string} text
     * @param {Object} options
     * @returns {string}
     */
    function sortLines(text, options = {}) {
        const {
            type = 'alpha',
            reverse = false,
            caseInsensitive = false,
            removeEmpty = false
        } = options;

        let lines = text.split('\n');

        // 移除空行
        if (removeEmpty) {
            lines = lines.filter(line => line.trim().length > 0);
        }

        // 排序
        let comparator;
        switch (type) {
            case 'numeric':
                comparator = (a, b) => {
                    const numA = parseFloat(a) || 0;
                    const numB = parseFloat(b) || 0;
                    return numA - numB;
                };
                break;
            case 'length':
                comparator = (a, b) => a.length - b.length;
                break;
            case 'random':
                // Fisher-Yates shuffle
                for (let i = lines.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [lines[i], lines[j]] = [lines[j], lines[i]];
                }
                return lines.join('\n');
            default: // alpha
                comparator = (a, b) => {
                    if (caseInsensitive) {
                        a = a.toLowerCase();
                        b = b.toLowerCase();
                    }
                    return a.localeCompare(b);
                };
        }

        lines.sort(comparator);

        // 倒序
        if (reverse) {
            lines.reverse();
        }

        return lines.join('\n');
    }

    /**
     * 执行排序
     */
    function performSort() {
        const result = sortLines(inputEl.value, {
            type: sortTypeSelect.value,
            reverse: reverseCheck.checked,
            caseInsensitive: caseInsensitiveCheck.checked,
            removeEmpty: removeEmptyCheck.checked
        });

        outputEl.value = result;
    }

    // 事件监听
    if (sortBtn) {
        sortBtn.addEventListener('click', performSort);
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

    // 导出到全局
    window.TextSortTool = { sortLines };

    // 设置默认示例数据
    if (inputEl && !inputEl.value) {
        inputEl.value = `zebra
apple
mango
banana
cherry
date
elderberry`;
    }
})();
