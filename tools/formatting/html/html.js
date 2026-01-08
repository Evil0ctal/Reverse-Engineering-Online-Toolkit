/**
 * HTML 格式化工具
 * @description HTML 代码格式化、美化与压缩
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    /**
     * 检查当前是否在 HTML 工具页面
     */
    function isHtmlToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/formatting/html');
    }

    // 自闭合标签
    const VOID_ELEMENTS = [
        'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
        'link', 'meta', 'param', 'source', 'track', 'wbr'
    ];

    // 内联元素
    const INLINE_ELEMENTS = [
        'a', 'abbr', 'acronym', 'b', 'bdo', 'big', 'br', 'button', 'cite',
        'code', 'dfn', 'em', 'i', 'img', 'input', 'kbd', 'label', 'map',
        'object', 'output', 'q', 'samp', 'script', 'select', 'small',
        'span', 'strong', 'sub', 'sup', 'textarea', 'time', 'tt', 'var'
    ];

    // 预格式化元素（内容不应被修改）
    const PREFORMATTED_ELEMENTS = ['pre', 'code', 'script', 'style', 'textarea'];

    /**
     * HTML 词法分析器
     */
    function tokenize(html) {
        const tokens = [];
        let i = 0;

        while (i < html.length) {
            // 注释
            if (html.substr(i, 4) === '<!--') {
                const end = html.indexOf('-->', i);
                const content = html.substring(i, end === -1 ? html.length : end + 3);
                tokens.push({ type: 'comment', value: content });
                i += content.length;
                continue;
            }

            // DOCTYPE
            if (html.substr(i, 9).toUpperCase() === '<!DOCTYPE') {
                const end = html.indexOf('>', i);
                const content = html.substring(i, end === -1 ? html.length : end + 1);
                tokens.push({ type: 'doctype', value: content });
                i += content.length;
                continue;
            }

            // CDATA
            if (html.substr(i, 9) === '<![CDATA[') {
                const end = html.indexOf(']]>', i);
                const content = html.substring(i, end === -1 ? html.length : end + 3);
                tokens.push({ type: 'cdata', value: content });
                i += content.length;
                continue;
            }

            // 结束标签
            if (html.substr(i, 2) === '</') {
                const end = html.indexOf('>', i);
                const content = html.substring(i, end === -1 ? html.length : end + 1);
                const match = content.match(/<\/([a-zA-Z][a-zA-Z0-9-]*)\s*>/);
                if (match) {
                    tokens.push({ type: 'closeTag', value: content, tagName: match[1].toLowerCase() });
                } else {
                    tokens.push({ type: 'text', value: content });
                }
                i += content.length;
                continue;
            }

            // 开始标签
            if (html[i] === '<' && /[a-zA-Z]/.test(html[i + 1])) {
                let j = i + 1;
                let inQuote = false;
                let quoteChar = '';

                while (j < html.length) {
                    const char = html[j];
                    if (!inQuote) {
                        if (char === '"' || char === "'") {
                            inQuote = true;
                            quoteChar = char;
                        } else if (char === '>') {
                            break;
                        }
                    } else {
                        if (char === quoteChar) {
                            inQuote = false;
                        }
                    }
                    j++;
                }

                const content = html.substring(i, j + 1);
                const tagMatch = content.match(/<([a-zA-Z][a-zA-Z0-9-]*)/);
                if (tagMatch) {
                    const tagName = tagMatch[1].toLowerCase();
                    const selfClosing = content.endsWith('/>') || VOID_ELEMENTS.includes(tagName);
                    tokens.push({
                        type: 'openTag',
                        value: content,
                        tagName: tagName,
                        selfClosing: selfClosing
                    });
                }
                i = j + 1;
                continue;
            }

            // 文本内容
            let textEnd = html.indexOf('<', i);
            if (textEnd === -1) textEnd = html.length;
            if (textEnd > i) {
                const text = html.substring(i, textEnd);
                tokens.push({ type: 'text', value: text });
                i = textEnd;
            } else {
                // 无效的 < 字符
                tokens.push({ type: 'text', value: html[i] });
                i++;
            }
        }

        return tokens;
    }

    /**
     * 格式化 HTML
     */
    function formatHtml(html, options = {}) {
        const {
            indent = '    ',
            preserveNewlines = true,
            wrapAttributes = false
        } = options;

        const tokens = tokenize(html);
        let result = '';
        let currentIndent = 0;
        let inPreformatted = 0;
        const preStack = [];

        function addIndent() {
            return indent.repeat(currentIndent);
        }

        function shouldPreserveWhitespace() {
            return inPreformatted > 0;
        }

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const nextToken = tokens[i + 1];
            const prevToken = tokens[i - 1];

            switch (token.type) {
                case 'doctype':
                    result += token.value + '\n';
                    break;

                case 'comment':
                    if (!shouldPreserveWhitespace()) {
                        result += addIndent();
                    }
                    result += token.value;
                    if (!shouldPreserveWhitespace()) {
                        result += '\n';
                    }
                    break;

                case 'cdata':
                    result += token.value;
                    break;

                case 'openTag':
                    if (PREFORMATTED_ELEMENTS.includes(token.tagName)) {
                        inPreformatted++;
                        preStack.push(token.tagName);
                    }

                    if (!shouldPreserveWhitespace() || inPreformatted === 1) {
                        // 如果前一个 token 不是换行结尾，先添加换行
                        if (result.length > 0 && !result.endsWith('\n')) {
                            result += '\n';
                        }
                        result += addIndent();
                    }

                    // 处理属性换行
                    if (wrapAttributes && !shouldPreserveWhitespace()) {
                        result += formatTagWithWrappedAttributes(token.value, indent, currentIndent);
                    } else {
                        result += token.value;
                    }

                    if (!token.selfClosing) {
                        // 检查是否是内联元素且下一个是文本
                        const isInlineWithText = INLINE_ELEMENTS.includes(token.tagName) &&
                            nextToken && nextToken.type === 'text' &&
                            nextToken.value.trim().length > 0;

                        if (!isInlineWithText && !shouldPreserveWhitespace()) {
                            result += '\n';
                            currentIndent++;
                        }
                    } else {
                        if (!shouldPreserveWhitespace()) {
                            result += '\n';
                        }
                    }
                    break;

                case 'closeTag':
                    if (preStack.length > 0 && preStack[preStack.length - 1] === token.tagName) {
                        preStack.pop();
                        inPreformatted--;
                    }

                    if (!shouldPreserveWhitespace()) {
                        currentIndent = Math.max(0, currentIndent - 1);

                        // 检查前一个 token 是否是相同标签的开始标签
                        const prevIsOpenTag = prevToken &&
                            prevToken.type === 'openTag' &&
                            prevToken.tagName === token.tagName;

                        // 检查前一个 token 是否是内联文本
                        const prevIsInlineText = prevToken &&
                            prevToken.type === 'text' &&
                            INLINE_ELEMENTS.includes(token.tagName);

                        if (!prevIsOpenTag && !prevIsInlineText) {
                            if (!result.endsWith('\n')) {
                                result += '\n';
                            }
                            result += addIndent();
                        }
                    }

                    result += token.value;

                    if (!shouldPreserveWhitespace()) {
                        result += '\n';
                    }
                    break;

                case 'text':
                    if (shouldPreserveWhitespace()) {
                        result += token.value;
                    } else {
                        const trimmed = token.value.trim();
                        if (trimmed.length > 0) {
                            // 检查是否在内联元素中
                            const inInlineElement = prevToken &&
                                prevToken.type === 'openTag' &&
                                INLINE_ELEMENTS.includes(prevToken.tagName);

                            if (!inInlineElement) {
                                if (!result.endsWith('\n')) {
                                    result += '\n';
                                }
                                result += addIndent();
                            }

                            // 处理多行文本
                            if (preserveNewlines && trimmed.includes('\n')) {
                                const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l);
                                result += lines.join('\n' + addIndent());
                            } else {
                                result += trimmed;
                            }

                            if (!inInlineElement) {
                                result += '\n';
                            }
                        }
                    }
                    break;
            }
        }

        return result.trim();
    }

    /**
     * 格式化标签，属性换行
     */
    function formatTagWithWrappedAttributes(tagStr, indent, currentIndent) {
        // 解析标签
        const match = tagStr.match(/^<([a-zA-Z][a-zA-Z0-9-]*)([\s\S]*?)(\/?)>$/);
        if (!match) return tagStr;

        const tagName = match[1];
        const attrStr = match[2];
        const selfClose = match[3];

        // 解析属性
        const attrs = [];
        const attrRegex = /([a-zA-Z][a-zA-Z0-9-:]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
        let attrMatch;

        while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
            const name = attrMatch[1];
            const value = attrMatch[2] || attrMatch[3] || attrMatch[4];
            if (value !== undefined) {
                attrs.push(`${name}="${value}"`);
            } else {
                attrs.push(name);
            }
        }

        if (attrs.length <= 1) {
            return tagStr;
        }

        // 格式化输出
        const attrIndent = indent.repeat(currentIndent + 1);
        let result = `<${tagName}\n`;
        result += attrs.map(attr => attrIndent + attr).join('\n');
        result += selfClose ? '/>' : '>';

        return result;
    }

    /**
     * 压缩 HTML
     */
    function minifyHtml(html) {
        const tokens = tokenize(html);
        let result = '';
        let inPreformatted = 0;
        const preStack = [];

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            switch (token.type) {
                case 'doctype':
                    result += token.value;
                    break;

                case 'comment':
                    // 移除注释（除了条件注释）
                    if (token.value.startsWith('<!--[if') || token.value.startsWith('<!--<![')) {
                        result += token.value;
                    }
                    break;

                case 'cdata':
                    result += token.value;
                    break;

                case 'openTag':
                    if (PREFORMATTED_ELEMENTS.includes(token.tagName)) {
                        inPreformatted++;
                        preStack.push(token.tagName);
                    }
                    // 压缩标签内的空白
                    result += token.value.replace(/\s+/g, ' ').replace(/\s*\/?>$/, m => m.trim());
                    break;

                case 'closeTag':
                    if (preStack.length > 0 && preStack[preStack.length - 1] === token.tagName) {
                        preStack.pop();
                        inPreformatted--;
                    }
                    result += token.value.replace(/\s+/g, '');
                    break;

                case 'text':
                    if (inPreformatted > 0) {
                        result += token.value;
                    } else {
                        const trimmed = token.value.replace(/\s+/g, ' ').trim();
                        if (trimmed.length > 0) {
                            result += trimmed;
                        }
                    }
                    break;
            }
        }

        return result;
    }

    /**
     * 获取选项
     */
    function getOptions() {
        const indentValue = document.getElementById('indent-select')?.value || '4';
        const indent = indentValue === 'tab' ? '\t' : ' '.repeat(parseInt(indentValue));
        const preserveNewlines = document.getElementById('preserve-newlines')?.checked ?? true;
        const wrapAttributes = document.getElementById('wrap-attributes')?.checked ?? false;

        return { indent, preserveNewlines, wrapAttributes };
    }

    /**
     * 加载示例
     */
    function loadExample() {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>示例页面</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header class="site-header">
        <nav class="nav-main">
            <a href="/" class="logo">Logo</a>
            <ul class="nav-links">
                <li><a href="/about">关于</a></li>
                <li><a href="/contact">联系</a></li>
            </ul>
        </nav>
    </header>

    <main class="content">
        <article class="post">
            <h1>文章标题</h1>
            <p>这是一段<strong>重要的</strong>文本内容。</p>
            <img src="image.jpg" alt="示例图片">
            <pre><code>function hello() {
    console.log("Hello, World!");
}</code></pre>
        </article>
    </main>

    <footer class="site-footer">
        <p>&copy; 2024 示例网站</p>
    </footer>

    <script src="main.js"></script>
</body>
</html>`;
    }

    // 编辑器实例
    let inputEditor = null;
    let outputEditor = null;

    function getInputValue() {
        if (inputEditor) return inputEditor.getValue();
        return document.getElementById('input')?.value || '';
    }

    function setInputValue(value) {
        if (inputEditor) {
            inputEditor.setValue(value);
        } else {
            const el = document.getElementById('input');
            if (el) el.value = value;
        }
    }

    function setOutputValue(value) {
        if (outputEditor) {
            outputEditor.setValue(value);
        } else {
            const el = document.getElementById('output');
            if (el) el.value = value;
        }
    }

    function getOutputValue() {
        if (outputEditor) return outputEditor.getValue();
        return document.getElementById('output')?.value || '';
    }

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
                language: 'html',
                value: '',
                readOnly: false,
                theme: theme,
                placeholder: '请输入 HTML 代码...'
            });

            outputEditor = await REOT.CodeEditor.create('#output-editor', {
                language: 'html',
                value: '',
                readOnly: true,
                theme: theme
            });

            console.log('HTML editors initialized');
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
        if (!isHtmlToolActive()) return;

        const target = e.target;

        if (target.id === 'format-btn' || target.closest('#format-btn')) {
            try {
                const options = getOptions();
                const result = formatHtml(getInputValue(), options);
                setOutputValue(result);
                REOT.utils?.showNotification('格式化成功', 'success');
            } catch (error) {
                REOT.utils?.showNotification('格式化失败: ' + error.message, 'error');
            }
        }

        if (target.id === 'minify-btn' || target.closest('#minify-btn')) {
            try {
                const result = minifyHtml(getInputValue());
                setOutputValue(result);
                REOT.utils?.showNotification('压缩成功', 'success');
            } catch (error) {
                REOT.utils?.showNotification('压缩失败: ' + error.message, 'error');
            }
        }

        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            setInputValue('');
            setOutputValue('');
        }

        if (target.id === 'copy-btn' || target.closest('#copy-btn')) {
            const value = getOutputValue();
            if (value) {
                const success = await REOT.utils?.copyToClipboard(value);
                if (success) {
                    REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
                }
            }
        }

        if (target.id === 'example-btn' || target.closest('#example-btn')) {
            setInputValue(loadExample());
        }
    });

    // 页面加载时初始化编辑器
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (isHtmlToolActive()) initEditors();
        });
    } else {
        if (isHtmlToolActive()) initEditors();
    }

    // 监听路由变化重新初始化
    window.addEventListener('routeChange', () => {
        if (isHtmlToolActive() && !inputEditor) initEditors();
    });

    // 导出工具函数
    window.HtmlTool = { formatHtml, minifyHtml, tokenize };

})();
