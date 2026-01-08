/**
 * JavaScript 格式化工具
 * @description JavaScript 代码格式化、美化与压缩
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    /**
     * 检查当前是否在 JavaScript 工具页面
     */
    function isJsToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/formatting/javascript');
    }

    // JavaScript 关键字
    const KEYWORDS = [
        'break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete',
        'do', 'else', 'finally', 'for', 'function', 'if', 'in', 'instanceof',
        'new', 'return', 'switch', 'this', 'throw', 'try', 'typeof', 'var',
        'void', 'while', 'with', 'class', 'const', 'enum', 'export', 'extends',
        'import', 'super', 'implements', 'interface', 'let', 'package', 'private',
        'protected', 'public', 'static', 'yield', 'async', 'await', 'of'
    ];

    // 需要后面添加空格的关键字
    const SPACE_AFTER_KEYWORDS = [
        'if', 'else', 'for', 'while', 'do', 'switch', 'try', 'catch', 'finally',
        'return', 'throw', 'new', 'delete', 'typeof', 'void', 'in', 'instanceof',
        'case', 'var', 'let', 'const', 'function', 'class', 'extends', 'import',
        'export', 'from', 'async', 'await', 'yield', 'of'
    ];

    /**
     * JavaScript 词法分析器
     */
    function tokenize(js) {
        const tokens = [];
        let i = 0;

        while (i < js.length) {
            const char = js[i];

            // 跳过空白
            if (/\s/.test(char)) {
                i++;
                continue;
            }

            // 单行注释
            if (js.substr(i, 2) === '//') {
                const end = js.indexOf('\n', i);
                const comment = js.substring(i, end === -1 ? js.length : end);
                tokens.push({ type: 'comment', value: comment, multiline: false });
                i += comment.length;
                continue;
            }

            // 多行注释
            if (js.substr(i, 2) === '/*') {
                const end = js.indexOf('*/', i + 2);
                const comment = js.substring(i, end === -1 ? js.length : end + 2);
                tokens.push({ type: 'comment', value: comment, multiline: true });
                i += comment.length;
                continue;
            }

            // 正则表达式
            if (char === '/' && tokens.length > 0) {
                const prevToken = tokens[tokens.length - 1];
                const canBeRegex = ['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '\n']
                    .includes(prevToken.value) ||
                    KEYWORDS.includes(prevToken.value);

                if (canBeRegex) {
                    let regex = '/';
                    i++;
                    let inClass = false;
                    while (i < js.length) {
                        if (js[i] === '\\' && i + 1 < js.length) {
                            regex += js[i] + js[i + 1];
                            i += 2;
                        } else if (js[i] === '[') {
                            inClass = true;
                            regex += js[i];
                            i++;
                        } else if (js[i] === ']') {
                            inClass = false;
                            regex += js[i];
                            i++;
                        } else if (js[i] === '/' && !inClass) {
                            regex += '/';
                            i++;
                            // 获取标志
                            while (i < js.length && /[gimsuy]/.test(js[i])) {
                                regex += js[i];
                                i++;
                            }
                            break;
                        } else if (js[i] === '\n') {
                            break;
                        } else {
                            regex += js[i];
                            i++;
                        }
                    }
                    tokens.push({ type: 'regex', value: regex });
                    continue;
                }
            }

            // 字符串（单引号、双引号、模板字符串）
            if (char === '"' || char === "'" || char === '`') {
                let str = char;
                const quote = char;
                i++;
                while (i < js.length) {
                    if (js[i] === '\\' && i + 1 < js.length) {
                        str += js[i] + js[i + 1];
                        i += 2;
                    } else if (js[i] === quote) {
                        str += js[i];
                        i++;
                        break;
                    } else if (quote !== '`' && js[i] === '\n') {
                        break;
                    } else {
                        str += js[i];
                        i++;
                    }
                }
                tokens.push({ type: 'string', value: str });
                continue;
            }

            // 数字
            if (/\d/.test(char) || (char === '.' && /\d/.test(js[i + 1]))) {
                let num = '';
                // 十六进制
                if (char === '0' && (js[i + 1] === 'x' || js[i + 1] === 'X')) {
                    num = '0x';
                    i += 2;
                    while (i < js.length && /[0-9a-fA-F]/.test(js[i])) {
                        num += js[i];
                        i++;
                    }
                }
                // 二进制
                else if (char === '0' && (js[i + 1] === 'b' || js[i + 1] === 'B')) {
                    num = '0b';
                    i += 2;
                    while (i < js.length && /[01]/.test(js[i])) {
                        num += js[i];
                        i++;
                    }
                }
                // 八进制
                else if (char === '0' && (js[i + 1] === 'o' || js[i + 1] === 'O')) {
                    num = '0o';
                    i += 2;
                    while (i < js.length && /[0-7]/.test(js[i])) {
                        num += js[i];
                        i++;
                    }
                }
                // 十进制
                else {
                    while (i < js.length && /[\d.eE+-]/.test(js[i])) {
                        num += js[i];
                        i++;
                    }
                }
                // BigInt
                if (js[i] === 'n') {
                    num += 'n';
                    i++;
                }
                tokens.push({ type: 'number', value: num });
                continue;
            }

            // 标识符/关键字
            if (/[a-zA-Z_$]/.test(char)) {
                let ident = '';
                while (i < js.length && /[a-zA-Z0-9_$]/.test(js[i])) {
                    ident += js[i];
                    i++;
                }
                if (KEYWORDS.includes(ident)) {
                    tokens.push({ type: 'keyword', value: ident });
                } else {
                    tokens.push({ type: 'identifier', value: ident });
                }
                continue;
            }

            // 多字符操作符
            const threeChar = js.substr(i, 3);
            if (['===', '!==', '>>>', '...', '**=', '>>=', '<<='].includes(threeChar)) {
                tokens.push({ type: 'operator', value: threeChar });
                i += 3;
                continue;
            }

            const twoChar = js.substr(i, 2);
            if (['==', '!=', '<=', '>=', '++', '--', '&&', '||', '??', '+=', '-=',
                '*=', '/=', '%=', '&=', '|=', '^=', '=>', '<<', '>>', '**', '?.'].includes(twoChar)) {
                tokens.push({ type: 'operator', value: twoChar });
                i += 2;
                continue;
            }

            // 单字符操作符和符号
            tokens.push({ type: 'symbol', value: char });
            i++;
        }

        return tokens;
    }

    /**
     * 格式化 JavaScript
     */
    function formatJs(js, options = {}) {
        const {
            indent = '    ',
            braceStyle = 'same-line',
            semicolons = true
        } = options;

        const tokens = tokenize(js);
        let result = '';
        let currentIndent = 0;
        let newLine = true;
        let prevToken = null;

        function addIndent() {
            result += indent.repeat(currentIndent);
        }

        function needsSpaceBefore(token, prev) {
            if (!prev) return false;

            // 关键字后需要空格
            if (prev.type === 'keyword' && SPACE_AFTER_KEYWORDS.includes(prev.value)) {
                return true;
            }

            // 标识符、数字、关键字之间需要空格
            if (['identifier', 'number', 'keyword'].includes(prev.type) &&
                ['identifier', 'number', 'keyword'].includes(token.type)) {
                return true;
            }

            // 操作符周围的空格
            if (token.type === 'operator' && !['++', '--', '!', '~'].includes(token.value)) {
                return prev.type !== 'symbol' || !['(', '[', '{'].includes(prev.value);
            }
            if (prev.type === 'operator' && !['++', '--'].includes(prev.value)) {
                return true;
            }

            // 括号前的空格
            if (token.value === '{' && prev.value !== '(') {
                return true;
            }

            return false;
        }

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const nextToken = tokens[i + 1];

            // 注释
            if (token.type === 'comment') {
                if (!newLine && prevToken) {
                    result += ' ';
                } else if (newLine) {
                    addIndent();
                }
                result += token.value;
                if (!token.multiline) {
                    result += '\n';
                    newLine = true;
                }
                prevToken = token;
                continue;
            }

            // 处理左括号
            if (token.value === '{') {
                if (braceStyle === 'same-line') {
                    if (!newLine) {
                        result += ' ';
                    } else {
                        addIndent();
                    }
                    result += '{\n';
                } else {
                    if (!newLine) {
                        result += '\n';
                    }
                    addIndent();
                    result += '{\n';
                }
                currentIndent++;
                newLine = true;
                prevToken = token;
                continue;
            }

            // 处理右括号
            if (token.value === '}') {
                currentIndent = Math.max(0, currentIndent - 1);
                if (!newLine) {
                    result += '\n';
                }
                addIndent();
                result += '}';

                // 检查是否需要换行
                if (nextToken && !['else', 'catch', 'finally', 'while'].includes(nextToken.value) &&
                    nextToken.value !== ')' && nextToken.value !== ',' && nextToken.value !== ';') {
                    result += '\n';
                    newLine = true;
                } else {
                    newLine = false;
                }
                prevToken = token;
                continue;
            }

            // 处理分号
            if (token.value === ';') {
                result += semicolons ? ';' : '';
                result += '\n';
                newLine = true;
                prevToken = token;
                continue;
            }

            // 处理逗号
            if (token.value === ',') {
                result += ',';
                // 如果在对象或数组中，换行
                if (prevToken && prevToken.value !== '{' && prevToken.value !== '[') {
                    // 简单检查是否在对象字面量中
                    let inObject = false;
                    let depth = 0;
                    for (let j = i - 1; j >= 0; j--) {
                        if (tokens[j].value === '{' || tokens[j].value === '[') {
                            depth++;
                            if (depth === 1 && tokens[j].value === '{') {
                                inObject = true;
                            }
                            break;
                        }
                        if (tokens[j].value === '}' || tokens[j].value === ']') {
                            depth--;
                        }
                    }
                    if (inObject) {
                        result += '\n';
                        newLine = true;
                    } else {
                        result += ' ';
                        newLine = false;
                    }
                } else {
                    result += ' ';
                    newLine = false;
                }
                prevToken = token;
                continue;
            }

            // 处理冒号
            if (token.value === ':') {
                result += ': ';
                newLine = false;
                prevToken = token;
                continue;
            }

            // 普通 token
            if (newLine) {
                addIndent();
                newLine = false;
            } else if (needsSpaceBefore(token, prevToken)) {
                result += ' ';
            }

            result += token.value;
            prevToken = token;
        }

        return result.trim();
    }

    /**
     * 压缩 JavaScript
     */
    function minifyJs(js) {
        const tokens = tokenize(js);
        let result = '';
        let prevToken = null;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            // 跳过注释
            if (token.type === 'comment') {
                continue;
            }

            // 判断是否需要空格
            if (prevToken) {
                const needSpace = (
                    (prevToken.type === 'keyword' || prevToken.type === 'identifier' || prevToken.type === 'number') &&
                    (token.type === 'keyword' || token.type === 'identifier' || token.type === 'number')
                ) || (
                    prevToken.type === 'keyword' && SPACE_AFTER_KEYWORDS.includes(prevToken.value) &&
                    token.value !== '(' && token.value !== ';'
                );

                if (needSpace) {
                    result += ' ';
                }
            }

            result += token.value;
            prevToken = token;
        }

        return result;
    }

    /**
     * 获取选项
     */
    function getOptions() {
        const indentValue = document.getElementById('indent-select')?.value || '4';
        const indent = indentValue === 'tab' ? '\t' : ' '.repeat(parseInt(indentValue));
        const braceStyle = document.getElementById('brace-style')?.value || 'same-line';
        const semicolons = document.getElementById('semicolons')?.checked ?? true;

        return { indent, braceStyle, semicolons };
    }

    /**
     * 加载示例
     */
    function loadExample() {
        return `// 用户管理模块
const UserManager = {
    users: [],

    // 添加用户
    addUser: function(name, email) {
        const user = {
            id: Date.now(),
            name: name,
            email: email,
            createdAt: new Date()
        };
        this.users.push(user);
        return user;
    },

    // 查找用户
    findUser: function(id) {
        return this.users.find(user => user.id === id);
    },

    // 删除用户
    removeUser: function(id) {
        const index = this.users.findIndex(user => user.id === id);
        if (index !== -1) {
            return this.users.splice(index, 1)[0];
        }
        return null;
    }
};

// 异步获取数据
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(\`HTTP error! status: \${response.status}\`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// 使用示例
const user = UserManager.addUser('张三', 'zhangsan@example.com');
console.log('Created user:', user);

fetchData('https://api.example.com/data')
    .then(data => console.log(data))
    .catch(err => console.error(err));`;
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
            // 显示 textarea
            const inputEl = document.getElementById('input');
            const outputEl = document.getElementById('output');
            if (inputEl) inputEl.style.display = '';
            if (outputEl) outputEl.style.display = '';
            // 隐藏编辑器容器
            const inputContainer = document.getElementById('input-editor');
            const outputContainer = document.getElementById('output-editor');
            if (inputContainer) inputContainer.style.display = 'none';
            if (outputContainer) outputContainer.style.display = 'none';
            return;
        }

        try {
            // 检测主题
            const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

            // 创建输入编辑器
            inputEditor = await REOT.CodeEditor.create('#input-editor', {
                language: 'javascript',
                value: '',
                readOnly: false,
                theme: theme,
                placeholder: '请输入 JavaScript 代码...'
            });

            // 创建输出编辑器（只读）
            outputEditor = await REOT.CodeEditor.create('#output-editor', {
                language: 'javascript',
                value: '',
                readOnly: true,
                theme: theme
            });

            console.log('JavaScript editors initialized');
        } catch (error) {
            console.error('Failed to initialize editors:', error);
            // 回退到 textarea
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
        if (!isJsToolActive()) return;

        const target = e.target;

        // 格式化按钮
        if (target.id === 'format-btn' || target.closest('#format-btn')) {
            try {
                const options = getOptions();
                const result = formatJs(getInputValue(), options);
                setOutputValue(result);
                REOT.utils?.showNotification('格式化成功', 'success');
            } catch (error) {
                REOT.utils?.showNotification('格式化失败: ' + error.message, 'error');
            }
        }

        // 压缩按钮
        if (target.id === 'minify-btn' || target.closest('#minify-btn')) {
            try {
                const result = minifyJs(getInputValue());
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
            if (isJsToolActive()) {
                initEditors();
            }
        });
    } else {
        if (isJsToolActive()) {
            initEditors();
        }
    }

    // 监听路由变化重新初始化
    window.addEventListener('routeChange', () => {
        if (isJsToolActive() && !inputEditor) {
            initEditors();
        }
    });

    // 导出工具函数
    window.JsTool = { formatJs, minifyJs, tokenize };

})();
