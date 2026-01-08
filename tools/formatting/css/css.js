/**
 * CSS 格式化工具
 * @description CSS 代码格式化、美化与压缩
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    /**
     * 检查当前是否在 CSS 工具页面
     */
    function isCssToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/formatting/css');
    }

    /**
     * CSS 词法分析器
     */
    function tokenize(css) {
        const tokens = [];
        let i = 0;

        while (i < css.length) {
            const char = css[i];

            // 跳过空白
            if (/\s/.test(char)) {
                i++;
                continue;
            }

            // 多行注释
            if (css.substr(i, 2) === '/*') {
                const end = css.indexOf('*/', i + 2);
                const comment = css.substring(i, end === -1 ? css.length : end + 2);
                tokens.push({ type: 'comment', value: comment });
                i += comment.length;
                continue;
            }

            // 字符串（单引号或双引号）
            if (char === '"' || char === "'") {
                let str = char;
                const quote = char;
                i++;
                while (i < css.length) {
                    if (css[i] === '\\' && i + 1 < css.length) {
                        str += css[i] + css[i + 1];
                        i += 2;
                    } else if (css[i] === quote) {
                        str += css[i];
                        i++;
                        break;
                    } else {
                        str += css[i];
                        i++;
                    }
                }
                tokens.push({ type: 'string', value: str });
                continue;
            }

            // @规则
            if (char === '@') {
                let atRule = '@';
                i++;
                while (i < css.length && /[a-zA-Z-]/.test(css[i])) {
                    atRule += css[i];
                    i++;
                }
                tokens.push({ type: 'at-rule', value: atRule });
                continue;
            }

            // 符号 - 优先检查，避免被 ident 吞掉
            if (char === '{') {
                tokens.push({ type: 'lbrace', value: '{' });
                i++;
                continue;
            }

            if (char === '}') {
                tokens.push({ type: 'rbrace', value: '}' });
                i++;
                continue;
            }

            if (char === ':') {
                tokens.push({ type: 'colon', value: ':' });
                i++;
                continue;
            }

            if (char === ';') {
                tokens.push({ type: 'semicolon', value: ';' });
                i++;
                continue;
            }

            if (char === ',') {
                tokens.push({ type: 'comma', value: ',' });
                i++;
                continue;
            }

            // 标识符（选择器、属性名、属性值等）
            // 不包含 : ; { } , 这些分隔符
            if (/[a-zA-Z0-9_\-#.*\[\]()>+~=^$|%!]/.test(char)) {
                let ident = '';
                while (i < css.length) {
                    const c = css[i];
                    // 遇到分隔符停止
                    if (/[{};:,]/.test(c)) break;
                    // 空白也停止（但不包括在函数括号内）
                    if (/\s/.test(c)) {
                        // 检查是否在括号内
                        let parenCount = 0;
                        for (let j = 0; j < ident.length; j++) {
                            if (ident[j] === '(') parenCount++;
                            else if (ident[j] === ')') parenCount--;
                        }
                        if (parenCount <= 0) break;
                    }
                    ident += c;
                    i++;
                }
                ident = ident.trim();
                if (ident) {
                    tokens.push({ type: 'ident', value: ident });
                }
                continue;
            }

            // 其他字符
            tokens.push({ type: 'other', value: char });
            i++;
        }

        return tokens;
    }

    /**
     * 格式化 CSS
     */
    function formatCss(css, options = {}) {
        const {
            indent = '    ',
            braceStyle = 'expand',
            sortProperties = false
        } = options;

        const tokens = tokenize(css);
        let result = '';
        let currentIndent = 0;
        let blockStack = []; // 跟踪块类型: 'rule' | 'at-media' | 'at-keyframes'
        let properties = [];
        let currentProperty = '';
        let currentValues = [];
        let expectValue = false;
        let selectorBuffer = '';
        let lastSelectorToken = null; // 跟踪上一个选择器 token 类型

        function addIndent() {
            return indent.repeat(currentIndent);
        }

        function flushProperties() {
            if (properties.length === 0) return;

            if (sortProperties) {
                properties.sort((a, b) => a.name.localeCompare(b.name));
            }

            for (const prop of properties) {
                result += addIndent() + prop.name + ': ' + prop.value + ';\n';
            }
            properties = [];
        }

        function saveCurrentProperty() {
            if (currentProperty && currentValues.length > 0) {
                const value = currentValues.join(' ').trim();
                if (value) {
                    properties.push({ name: currentProperty, value: value });
                }
            }
            currentProperty = '';
            currentValues = [];
            expectValue = false;
        }

        function flushSelector() {
            if (selectorBuffer.trim()) {
                // 在 @media/@keyframes 块内需要添加缩进
                if (blockStack.length > 0 && !result.endsWith('\n' + addIndent())) {
                    if (!result.endsWith('\n')) {
                        result += '\n';
                    }
                    result += addIndent();
                }
                result += selectorBuffer.trim();
                selectorBuffer = '';
                lastSelectorToken = null;
            }
        }

        function getCurrentBlockType() {
            return blockStack.length > 0 ? blockStack[blockStack.length - 1] : null;
        }

        function isInDeclarationBlock() {
            const blockType = getCurrentBlockType();
            return blockType === 'rule';
        }

        function isInAtBlock() {
            const blockType = getCurrentBlockType();
            return blockType === 'at-media' || blockType === 'at-keyframes';
        }

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const nextToken = tokens[i + 1];
            const prevToken = tokens[i - 1];

            switch (token.type) {
                case 'comment':
                    flushSelector();
                    if (isInDeclarationBlock()) {
                        flushProperties();
                        result += addIndent() + token.value + '\n';
                    } else {
                        if (result && !result.endsWith('\n')) {
                            result += '\n';
                        }
                        result += addIndent() + token.value + '\n';
                    }
                    break;

                case 'at-rule':
                    flushSelector();
                    // @media, @keyframes 等块级规则
                    if (['@media', '@keyframes', '@supports', '@-webkit-keyframes', '@-moz-keyframes'].some(r => token.value.startsWith(r))) {
                        if (result && !result.endsWith('\n')) {
                            result += '\n';
                        }
                        result += addIndent() + token.value;
                        // 读取条件直到 {
                        while (tokens[i + 1] && tokens[i + 1].type !== 'lbrace') {
                            i++;
                            if (tokens[i].type === 'ident' || tokens[i].type === 'string') {
                                result += ' ' + tokens[i].value;
                            } else if (tokens[i].type === 'colon') {
                                result += ':';
                            } else if (tokens[i].type === 'comma') {
                                result += ', ';
                            }
                        }
                        // 下一个 { 会被处理并推入 at-media 或 at-keyframes
                        if (tokens[i + 1] && tokens[i + 1].type === 'lbrace') {
                            i++;
                            result += ' {\n';
                            currentIndent++;
                            if (token.value.includes('keyframes')) {
                                blockStack.push('at-keyframes');
                            } else {
                                blockStack.push('at-media');
                            }
                        }
                    } else if (token.value === '@font-face' || token.value === '@page') {
                        // @font-face 和 @page 是声明块
                        if (result && !result.endsWith('\n')) {
                            result += '\n';
                        }
                        result += addIndent() + token.value;
                    } else {
                        // @import, @charset 等单行规则
                        result += addIndent() + token.value;
                        while (tokens[i + 1] && tokens[i + 1].type !== 'semicolon') {
                            i++;
                            result += ' ' + tokens[i].value;
                        }
                        if (tokens[i + 1] && tokens[i + 1].type === 'semicolon') {
                            i++;
                            result += ';\n';
                        }
                    }
                    break;

                case 'ident':
                    if (!isInDeclarationBlock()) {
                        // 选择器或 keyframe 关键帧
                        // 只有当上一个 token 不是冒号时才添加空格
                        if (selectorBuffer && lastSelectorToken !== 'colon') {
                            selectorBuffer += ' ';
                        }
                        selectorBuffer += token.value;
                        lastSelectorToken = 'ident';
                    } else if (!expectValue) {
                        // 属性名
                        currentProperty = token.value;
                    } else {
                        // 属性值
                        currentValues.push(token.value);
                    }
                    break;

                case 'string':
                    if (!isInDeclarationBlock()) {
                        if (selectorBuffer && lastSelectorToken !== 'colon') {
                            selectorBuffer += ' ';
                        }
                        selectorBuffer += token.value;
                        lastSelectorToken = 'string';
                    } else if (expectValue) {
                        currentValues.push(token.value);
                    }
                    break;

                case 'lbrace':
                    flushSelector();
                    result = result.trimEnd() + ' {\n';
                    currentIndent++;
                    blockStack.push('rule');
                    break;

                case 'rbrace':
                    // 保存最后一个属性（可能没有分号）
                    saveCurrentProperty();
                    flushProperties();

                    currentIndent = Math.max(0, currentIndent - 1);
                    result += addIndent() + '}';

                    const poppedBlock = blockStack.pop();

                    // 检查是否还在 @media 等块内
                    if (blockStack.length > 0) {
                        result += '\n';
                        // 只有当下一个 token 不是 } 时才添加空行（为了规则之间的间距）
                        if (isInAtBlock() && nextToken && nextToken.type !== 'rbrace') {
                            result += '\n';
                        }
                    } else {
                        result += '\n\n';
                    }
                    break;

                case 'colon':
                    if (isInDeclarationBlock() && currentProperty) {
                        // 属性后的冒号
                        expectValue = true;
                    } else if (!isInDeclarationBlock()) {
                        // 伪类/伪元素选择器
                        selectorBuffer += ':';
                        lastSelectorToken = 'colon';
                    }
                    break;

                case 'semicolon':
                    saveCurrentProperty();
                    break;

                case 'comma':
                    if (!isInDeclarationBlock()) {
                        // 选择器列表
                        selectorBuffer += ',\n' + addIndent();
                        lastSelectorToken = 'comma';
                    } else if (expectValue) {
                        // 属性值中的逗号 - 追加到最后一个值后面，避免多余空格
                        if (currentValues.length > 0) {
                            currentValues[currentValues.length - 1] += ',';
                        } else {
                            currentValues.push(',');
                        }
                    }
                    break;

                case 'other':
                    if (isInDeclarationBlock() && expectValue) {
                        currentValues.push(token.value);
                    } else if (!isInDeclarationBlock()) {
                        selectorBuffer += token.value;
                        lastSelectorToken = 'other';
                    }
                    break;
            }
        }

        return result.trim();
    }

    /**
     * 压缩 CSS
     */
    function minifyCss(css) {
        // 移除注释
        let result = css.replace(/\/\*[\s\S]*?\*\//g, '');

        // 移除多余空白
        result = result.replace(/\s+/g, ' ');

        // 移除选择器周围的空白
        result = result.replace(/\s*{\s*/g, '{');
        result = result.replace(/\s*}\s*/g, '}');
        result = result.replace(/\s*:\s*/g, ':');
        result = result.replace(/\s*;\s*/g, ';');
        result = result.replace(/\s*,\s*/g, ',');

        // 移除最后一个分号
        result = result.replace(/;}/g, '}');

        // 移除开头和结尾的空白
        result = result.trim();

        // 压缩颜色值
        result = result.replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3/gi, '#$1$2$3');

        // 移除 0 的单位
        result = result.replace(/(\s|:)0(px|em|rem|%|pt|pc|in|cm|mm|ex|ch|vw|vh|vmin|vmax)/gi, '$10');

        // 压缩 0.x 为 .x
        result = result.replace(/(\s|:)0\.(\d+)/g, '$1.$2');

        return result;
    }

    /**
     * 获取选项
     */
    function getOptions() {
        const indentValue = document.getElementById('indent-select')?.value || '4';
        const indent = indentValue === 'tab' ? '\t' : ' '.repeat(parseInt(indentValue));
        const braceStyle = document.getElementById('brace-style')?.value || 'expand';
        const sortProperties = document.getElementById('sort-properties')?.checked ?? false;

        return { indent, braceStyle, sortProperties };
    }

    /**
     * 加载示例
     */
    function loadExample() {
        return `/* 全局样式 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333333;
    background-color: #ffffff;
}

/* 头部样式 */
.header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
}

.header .logo {
    font-size: 24px;
    font-weight: bold;
    color: #fff;
    text-decoration: none;
}

/* 导航菜单 */
.nav-menu {
    display: flex;
    gap: 20px;
    list-style: none;
}

.nav-menu a {
    color: rgba(255, 255, 255, 0.9);
    text-decoration: none;
    transition: color 0.3s ease;
}

.nav-menu a:hover {
    color: #ffffff;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .header {
        height: auto;
        padding: 10px;
    }

    .nav-menu {
        flex-direction: column;
        gap: 10px;
    }
}

/* 动画 */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}`;
    }

    // 编辑器实例
    let inputEditor = null;
    let outputEditor = null;

    /**
     * 获取输入内容
     */
    function getInputValue() {
        if (inputEditor) {
            return inputEditor.getValue();
        }
        return document.getElementById('input')?.value || '';
    }

    /**
     * 设置输入内容
     */
    function setInputValue(value) {
        if (inputEditor) {
            inputEditor.setValue(value);
        } else {
            const el = document.getElementById('input');
            if (el) el.value = value;
        }
    }

    /**
     * 设置输出内容
     */
    function setOutputValue(value) {
        if (outputEditor) {
            outputEditor.setValue(value);
        } else {
            const el = document.getElementById('output');
            if (el) el.value = value;
        }
    }

    /**
     * 获取输出内容
     */
    function getOutputValue() {
        if (outputEditor) {
            return outputEditor.getValue();
        }
        return document.getElementById('output')?.value || '';
    }

    /**
     * 初始化代码编辑器
     */
    async function initEditors() {
        if (!REOT.CodeEditor) {
            console.warn('CodeEditor not available, using textarea fallback');
            const inputEl = document.getElementById('input');
            const outputEl = document.getElementById('output');
            if (inputEl) inputEl.style.display = '';
            if (outputEl) outputEl.style.display = '';
            const inputContainer = document.getElementById('input-editor');
            const outputContainer = document.getElementById('output-editor');
            if (inputContainer) inputContainer.style.display = 'none';
            if (outputContainer) outputContainer.style.display = 'none';
            return;
        }

        try {
            const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

            inputEditor = await REOT.CodeEditor.create('#input-editor', {
                language: 'css',
                value: '',
                readOnly: false,
                theme: theme,
                placeholder: '请输入 CSS 代码...'
            });

            outputEditor = await REOT.CodeEditor.create('#output-editor', {
                language: 'css',
                value: '',
                readOnly: true,
                theme: theme
            });

            console.log('CSS editors initialized');
        } catch (error) {
            console.error('Failed to initialize editors:', error);
            const inputEl = document.getElementById('input');
            const outputEl = document.getElementById('output');
            if (inputEl) inputEl.style.display = '';
            if (outputEl) outputEl.style.display = '';
            const inputContainer = document.getElementById('input-editor');
            const outputContainer = document.getElementById('output-editor');
            if (inputContainer) inputContainer.style.display = 'none';
            if (outputContainer) outputContainer.style.display = 'none';
        }
    }

    // 事件处理
    document.addEventListener('click', async (e) => {
        if (!isCssToolActive()) return;

        const target = e.target;

        // 格式化按钮
        if (target.id === 'format-btn' || target.closest('#format-btn')) {
            try {
                const options = getOptions();
                const result = formatCss(getInputValue(), options);
                setOutputValue(result);
                REOT.utils?.showNotification('格式化成功', 'success');
            } catch (error) {
                REOT.utils?.showNotification('格式化失败: ' + error.message, 'error');
            }
        }

        // 压缩按钮
        if (target.id === 'minify-btn' || target.closest('#minify-btn')) {
            try {
                const result = minifyCss(getInputValue());
                setOutputValue(result);
                REOT.utils?.showNotification('压缩成功', 'success');
            } catch (error) {
                REOT.utils?.showNotification('压缩失败: ' + error.message, 'error');
            }
        }

        // 清除按钮
        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            setInputValue('');
            setOutputValue('');
        }

        // 复制按钮
        if (target.id === 'copy-btn' || target.closest('#copy-btn')) {
            const value = getOutputValue();
            if (value) {
                const success = await REOT.utils?.copyToClipboard(value);
                if (success) {
                    REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
                }
            }
        }

        // 加载示例
        if (target.id === 'example-btn' || target.closest('#example-btn')) {
            setInputValue(loadExample());
        }
    });

    // 页面加载时初始化编辑器
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (isCssToolActive()) {
                initEditors();
            }
        });
    } else {
        if (isCssToolActive()) {
            initEditors();
        }
    }

    // 监听路由变化重新初始化
    window.addEventListener('routeChange', () => {
        if (isCssToolActive() && !inputEditor) {
            initEditors();
        }
    });

    // 导出工具函数
    window.CssTool = { formatCss, minifyCss, tokenize };

})();
