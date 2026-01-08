/**
 * TOML 格式化工具
 * @description TOML 格式化、验证，支持 TOML 与 JSON 互转
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    /**
     * 检查当前是否在 TOML 工具页面
     */
    function isTomlToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/formatting/toml');
    }

    /**
     * 简易 TOML 解析器
     */
    const TomlParser = {
        parse(toml) {
            const result = {};
            let currentSection = result;
            let currentPath = [];

            const lines = toml.split('\n');

            for (let lineNum = 0; lineNum < lines.length; lineNum++) {
                let line = lines[lineNum].trim();

                // 跳过空行和注释
                if (!line || line.startsWith('#')) {
                    continue;
                }

                // 处理表头 [section] 或 [[array]]
                if (line.startsWith('[')) {
                    const isArray = line.startsWith('[[');
                    const end = isArray ? line.indexOf(']]') : line.indexOf(']');

                    if (end === -1) {
                        throw new Error(`行 ${lineNum + 1}: 无效的表头语法`);
                    }

                    const path = line.substring(isArray ? 2 : 1, end).trim();
                    const keys = path.split('.').map(k => k.trim());

                    if (isArray) {
                        // 数组表
                        let target = result;
                        for (let i = 0; i < keys.length - 1; i++) {
                            if (!target[keys[i]]) {
                                target[keys[i]] = {};
                            }
                            target = target[keys[i]];
                        }
                        const lastKey = keys[keys.length - 1];
                        if (!target[lastKey]) {
                            target[lastKey] = [];
                        }
                        const newObj = {};
                        target[lastKey].push(newObj);
                        currentSection = newObj;
                    } else {
                        // 普通表
                        let target = result;
                        for (const key of keys) {
                            if (!target[key]) {
                                target[key] = {};
                            }
                            target = target[key];
                        }
                        currentSection = target;
                    }

                    currentPath = keys;
                    continue;
                }

                // 处理键值对
                const eqIndex = line.indexOf('=');
                if (eqIndex === -1) {
                    throw new Error(`行 ${lineNum + 1}: 无效的语法，缺少 '='`);
                }

                const key = line.substring(0, eqIndex).trim();
                let valueStr = line.substring(eqIndex + 1).trim();

                // 移除行尾注释
                const commentIndex = this.findComment(valueStr);
                if (commentIndex !== -1) {
                    valueStr = valueStr.substring(0, commentIndex).trim();
                }

                const value = this.parseValue(valueStr, lineNum + 1);
                currentSection[key] = value;
            }

            return result;
        },

        findComment(str) {
            let inString = false;
            let stringChar = null;

            for (let i = 0; i < str.length; i++) {
                const char = str[i];

                if (!inString && (char === '"' || char === "'")) {
                    inString = true;
                    stringChar = char;
                } else if (inString && char === stringChar && str[i - 1] !== '\\') {
                    inString = false;
                } else if (!inString && char === '#') {
                    return i;
                }
            }

            return -1;
        },

        parseValue(str, lineNum) {
            str = str.trim();

            // 字符串（单引号或双引号）
            if (str.startsWith('"')) {
                const end = str.lastIndexOf('"');
                if (end <= 0) {
                    throw new Error(`行 ${lineNum}: 未闭合的字符串`);
                }
                return this.unescapeString(str.substring(1, end));
            }

            if (str.startsWith("'")) {
                const end = str.lastIndexOf("'");
                if (end <= 0) {
                    throw new Error(`行 ${lineNum}: 未闭合的字符串`);
                }
                return str.substring(1, end); // 单引号不转义
            }

            // 布尔值
            if (str === 'true') return true;
            if (str === 'false') return false;

            // 数组
            if (str.startsWith('[')) {
                return this.parseArray(str, lineNum);
            }

            // 内联表
            if (str.startsWith('{')) {
                return this.parseInlineTable(str, lineNum);
            }

            // 日期时间
            if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
                return new Date(str);
            }

            // 数字
            if (/^[+-]?\d/.test(str) || str === 'inf' || str === '+inf' || str === '-inf' || str === 'nan') {
                if (str.includes('.') || str.includes('e') || str.includes('E')) {
                    return parseFloat(str);
                }
                // 处理下划线分隔的数字
                const num = str.replace(/_/g, '');
                if (num.startsWith('0x')) {
                    return parseInt(num, 16);
                }
                if (num.startsWith('0o')) {
                    return parseInt(num.substring(2), 8);
                }
                if (num.startsWith('0b')) {
                    return parseInt(num.substring(2), 2);
                }
                return parseInt(num, 10);
            }

            // 裸字符串（作为字符串处理）
            return str;
        },

        parseArray(str, lineNum) {
            const result = [];
            str = str.substring(1, str.lastIndexOf(']')).trim();

            if (!str) return result;

            let current = '';
            let depth = 0;
            let inString = false;
            let stringChar = null;

            for (let i = 0; i < str.length; i++) {
                const char = str[i];

                if (!inString && (char === '"' || char === "'")) {
                    inString = true;
                    stringChar = char;
                    current += char;
                } else if (inString && char === stringChar && str[i - 1] !== '\\') {
                    inString = false;
                    current += char;
                } else if (!inString && (char === '[' || char === '{')) {
                    depth++;
                    current += char;
                } else if (!inString && (char === ']' || char === '}')) {
                    depth--;
                    current += char;
                } else if (!inString && depth === 0 && char === ',') {
                    if (current.trim()) {
                        result.push(this.parseValue(current.trim(), lineNum));
                    }
                    current = '';
                } else {
                    current += char;
                }
            }

            if (current.trim()) {
                result.push(this.parseValue(current.trim(), lineNum));
            }

            return result;
        },

        parseInlineTable(str, lineNum) {
            const result = {};
            str = str.substring(1, str.lastIndexOf('}')).trim();

            if (!str) return result;

            const pairs = str.split(',');
            for (const pair of pairs) {
                const eqIndex = pair.indexOf('=');
                if (eqIndex === -1) continue;

                const key = pair.substring(0, eqIndex).trim();
                const value = pair.substring(eqIndex + 1).trim();
                result[key] = this.parseValue(value, lineNum);
            }

            return result;
        },

        unescapeString(str) {
            return str
                .replace(/\\n/g, '\n')
                .replace(/\\t/g, '\t')
                .replace(/\\r/g, '\r')
                .replace(/\\\\/g, '\\')
                .replace(/\\"/g, '"');
        }
    };

    /**
     * TOML 序列化器
     */
    const TomlSerializer = {
        stringify(obj, options = {}) {
            const { sortKeys = false, inlineTables = false } = options;
            return this.serializeObject(obj, '', sortKeys, inlineTables);
        },

        serializeObject(obj, prefix, sortKeys, inlineTables) {
            let result = '';
            const tables = [];
            const arrays = [];
            const values = [];

            // 分类键
            let keys = Object.keys(obj);
            if (sortKeys) {
                keys = keys.sort();
            }

            for (const key of keys) {
                const value = obj[key];

                if (value === null || value === undefined) {
                    continue;
                }

                if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && !Array.isArray(value[0])) {
                    arrays.push({ key, value });
                } else if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                    tables.push({ key, value });
                } else {
                    values.push({ key, value });
                }
            }

            // 先输出简单值
            for (const { key, value } of values) {
                result += `${key} = ${this.serializeValue(value, inlineTables)}\n`;
            }

            // 输出嵌套表
            for (const { key, value } of tables) {
                const path = prefix ? `${prefix}.${key}` : key;

                // 检查是否是简单表（可以内联）
                if (inlineTables && this.isSimpleTable(value)) {
                    result += `${key} = ${this.serializeInlineTable(value)}\n`;
                } else {
                    if (result) result += '\n';
                    result += `[${path}]\n`;
                    result += this.serializeObject(value, path, sortKeys, inlineTables);
                }
            }

            // 输出数组表
            for (const { key, value } of arrays) {
                const path = prefix ? `${prefix}.${key}` : key;

                for (const item of value) {
                    if (result) result += '\n';
                    result += `[[${path}]]\n`;
                    result += this.serializeObject(item, path, sortKeys, inlineTables);
                }
            }

            return result;
        },

        isSimpleTable(obj) {
            const values = Object.values(obj);
            return values.every(v =>
                typeof v !== 'object' ||
                Array.isArray(v) ||
                v instanceof Date
            );
        },

        serializeInlineTable(obj) {
            const pairs = Object.entries(obj)
                .map(([k, v]) => `${k} = ${this.serializeValue(v, false)}`)
                .join(', ');
            return `{ ${pairs} }`;
        },

        serializeValue(value, inlineTables) {
            if (value === null || value === undefined) {
                return '""';
            }

            if (typeof value === 'string') {
                return `"${this.escapeString(value)}"`;
            }

            if (typeof value === 'number') {
                if (Number.isInteger(value)) {
                    return value.toString();
                }
                return value.toString();
            }

            if (typeof value === 'boolean') {
                return value ? 'true' : 'false';
            }

            if (value instanceof Date) {
                return value.toISOString();
            }

            if (Array.isArray(value)) {
                const items = value.map(v => this.serializeValue(v, inlineTables));
                return `[${items.join(', ')}]`;
            }

            if (typeof value === 'object') {
                return this.serializeInlineTable(value);
            }

            return String(value);
        },

        escapeString(str) {
            return str
                .replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"')
                .replace(/\n/g, '\\n')
                .replace(/\t/g, '\\t')
                .replace(/\r/g, '\\r');
        }
    };

    /**
     * 格式化 TOML
     */
    function formatToml(input) {
        const sortKeys = document.getElementById('sort-keys')?.checked;
        const inlineTables = document.getElementById('inline-tables')?.checked;

        // 先解析
        const obj = TomlParser.parse(input);

        // 重新序列化
        return TomlSerializer.stringify(obj, { sortKeys, inlineTables });
    }

    /**
     * 验证 TOML
     */
    function validateToml(input) {
        try {
            TomlParser.parse(input);
            return { valid: true, message: 'TOML 格式有效' };
        } catch (error) {
            return { valid: false, message: error.message };
        }
    }

    /**
     * TOML 转 JSON
     */
    function tomlToJson(input) {
        const obj = TomlParser.parse(input);
        return JSON.stringify(obj, null, 2);
    }

    /**
     * JSON 转 TOML
     */
    function jsonToToml(input) {
        const sortKeys = document.getElementById('sort-keys')?.checked;
        const inlineTables = document.getElementById('inline-tables')?.checked;

        const obj = JSON.parse(input);
        return TomlSerializer.stringify(obj, { sortKeys, inlineTables });
    }

    /**
     * 加载示例
     */
    function loadExample() {
        return `# 这是一个 TOML 文档示例

title = "TOML 示例"
version = "0.5.0"

[owner]
name = "Tom Preston-Werner"
dob = 1979-05-27T07:32:00-08:00

[database]
enabled = true
ports = [8000, 8001, 8002]
data = [["delta", "phi"], [3.14]]
temp_targets = { cpu = 79.5, case = 72.0 }

[servers]

[servers.alpha]
ip = "10.0.0.1"
role = "frontend"

[servers.beta]
ip = "10.0.0.2"
role = "backend"

[[products]]
name = "Hammer"
sku = 738594937

[[products]]
name = "Nail"
sku = 284758393
color = "gray"`;
    }

    // 编辑器实例
    let inputEditor = null;
    let outputEditor = null;
    let currentOutputLang = 'toml'; // 跟踪输出语言类型

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

            // TOML 没有官方 CodeMirror 支持，使用 json 作为回退
            inputEditor = await REOT.CodeEditor.create('#input-editor', {
                language: 'json',
                value: '',
                readOnly: false,
                theme: theme,
                placeholder: '请输入 TOML 或 JSON...'
            });

            outputEditor = await REOT.CodeEditor.create('#output-editor', {
                language: 'json',
                value: '',
                readOnly: true,
                theme: theme
            });

            console.log('TOML editors initialized');
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
        if (!isTomlToolActive()) return;

        const target = e.target;
        const validationSection = document.getElementById('validation-section');
        const validationResult = document.getElementById('validation-result');

        if (target.id === 'format-btn' || target.closest('#format-btn')) {
            try {
                const result = formatToml(getInputValue());
                setOutputValue(result);
                if (validationSection) validationSection.style.display = 'none';
                REOT.utils?.showNotification('格式化成功', 'success');
            } catch (error) {
                REOT.utils?.showNotification('格式化失败: ' + error.message, 'error');
            }
        }

        if (target.id === 'validate-btn' || target.closest('#validate-btn')) {
            const result = validateToml(getInputValue());
            if (validationSection && validationResult) {
                validationSection.style.display = 'block';
                validationResult.className = `validation-result ${result.valid ? 'success' : 'error'}`;
                validationResult.innerHTML = result.valid
                    ? `✓ ${result.message}`
                    : `✗ ${result.message}`;
            }
        }

        if (target.id === 'to-json-btn' || target.closest('#to-json-btn')) {
            try {
                const result = tomlToJson(getInputValue());
                setOutputValue(result);
                if (validationSection) validationSection.style.display = 'none';
                REOT.utils?.showNotification('转换成功', 'success');
            } catch (error) {
                REOT.utils?.showNotification('转换失败: ' + error.message, 'error');
            }
        }

        if (target.id === 'from-json-btn' || target.closest('#from-json-btn')) {
            try {
                const result = jsonToToml(getInputValue());
                setOutputValue(result);
                if (validationSection) validationSection.style.display = 'none';
                REOT.utils?.showNotification('转换成功', 'success');
            } catch (error) {
                REOT.utils?.showNotification('转换失败: ' + error.message, 'error');
            }
        }

        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            setInputValue('');
            setOutputValue('');
            if (validationSection) validationSection.style.display = 'none';
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
            if (isTomlToolActive()) initEditors();
        });
    } else {
        if (isTomlToolActive()) initEditors();
    }

    // 监听路由变化重新初始化
    window.addEventListener('routeChange', () => {
        if (isTomlToolActive() && !inputEditor) initEditors();
    });

    // 导出工具函数
    window.TomlTool = {
        parse: (str) => TomlParser.parse(str),
        stringify: (obj, options) => TomlSerializer.stringify(obj, options),
        formatToml,
        validateToml,
        tomlToJson,
        jsonToToml
    };

})();
