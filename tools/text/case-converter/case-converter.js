/**
 * 大小写转换工具
 * @description 大小写、驼峰、下划线等格式转换
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // DOM 元素
    const inputEl = document.getElementById('input');
    const outputEl = document.getElementById('output');
    const swapBtn = document.getElementById('swap-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');

    /**
     * 分割文本为单词
     * @param {string} text
     * @returns {string[]}
     */
    function splitWords(text) {
        return text
            .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase -> camel Case
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // XMLParser -> XML Parser
            .replace(/[_\-./\s]+/g, ' ') // separators to space
            .trim()
            .split(/\s+/)
            .filter(w => w.length > 0);
    }

    // 转换函数
    const converters = {
        uppercase: (text) => text.toUpperCase(),
        lowercase: (text) => text.toLowerCase(),
        capitalize: (text) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(),
        titleCase: (text) => text.replace(/\b\w/g, c => c.toUpperCase()),
        sentenceCase: (text) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(),
        toggleCase: (text) => text.split('').map(c =>
            c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()
        ).join(''),
        camelCase: (text) => {
            const words = splitWords(text);
            return words.map((w, i) =>
                i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            ).join('');
        },
        pascalCase: (text) => {
            const words = splitWords(text);
            return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
        },
        snakeCase: (text) => splitWords(text).map(w => w.toLowerCase()).join('_'),
        kebabCase: (text) => splitWords(text).map(w => w.toLowerCase()).join('-'),
        constantCase: (text) => splitWords(text).map(w => w.toUpperCase()).join('_'),
        dotCase: (text) => splitWords(text).map(w => w.toLowerCase()).join('.')
    };

    // 绑定按钮事件
    Object.keys(converters).forEach(name => {
        const btn = document.getElementById(`${name.replace(/([A-Z])/g, '-$1').toLowerCase()}-btn`);
        if (btn) {
            btn.addEventListener('click', () => {
                outputEl.value = converters[name](inputEl.value);
            });
        }
    });

    // 其他按钮
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
    window.CaseConverterTool = converters;

    // 设置默认示例数据
    if (inputEl && !inputEl.value) {
        inputEl.value = 'hello world example text';
    }
})();
