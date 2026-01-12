/**
 * URL 解析工具
 * @description URL 组成部分解析，支持导出为多种格式
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // DOM 元素
    const inputEl = document.getElementById('input');
    const sampleBtn = document.getElementById('sample-btn');
    const clearBtn = document.getElementById('clear-btn');
    const resultSection = document.getElementById('result-section');
    const queryParamsSection = document.getElementById('query-params-section');
    const queryParamsBody = document.getElementById('query-params-body');
    const paramsCount = document.getElementById('params-count');
    const noParamsHint = document.getElementById('no-params-hint');
    const exportFormat = document.getElementById('export-format');
    const exportOutput = document.getElementById('export-output');
    const exportFormatBadge = document.getElementById('export-format-badge');
    const copyExportBtn = document.getElementById('copy-export-btn');
    const saveExportBtn = document.getElementById('save-export-btn');

    // 当前解析结果
    let currentParams = [];

    // 代码编辑器实例
    let exportEditor = null;
    let editorInitialized = false;

    // 格式到语言的映射
    const FORMAT_TO_LANGUAGE = {
        'python-dict': 'python',
        'json': 'json',
        'js-object': 'javascript',
        'php-array': 'php',
        'query-string': 'text'
    };

    /**
     * 重新创建编辑器以应用新的语言高亮
     */
    async function recreateEditorWithLanguage(format, value = '') {
        const container = document.getElementById('export-editor');
        if (!container) return false;

        // 隐藏回退方案
        const preEl = document.getElementById('export-output');
        if (preEl) preEl.style.display = 'none';

        // 销毁旧编辑器
        if (exportEditor) {
            exportEditor.destroy();
            exportEditor = null;
        }

        // 清空容器
        container.innerHTML = '';

        // 检查 REOT.CodeEditor 是否可用
        if (!REOT.CodeEditor) {
            console.warn('CodeEditor not available, using fallback');
            if (preEl) {
                preEl.style.display = 'block';
                preEl.textContent = value;
            }
            return false;
        }

        try {
            const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            const language = FORMAT_TO_LANGUAGE[format] || 'text';

            exportEditor = await REOT.CodeEditor.create('#export-editor', {
                language: language,
                value: value,
                readOnly: true,
                theme: theme,
                lineWrapping: true
            });
            editorInitialized = true;
            return true;
        } catch (e) {
            console.warn('代码编辑器初始化失败，使用回退方案', e);
            if (preEl) {
                preEl.style.display = 'block';
                preEl.textContent = value;
            }
            return false;
        }
    }

    /**
     * 设置编辑器内容
     */
    function setEditorValue(content) {
        if (exportEditor && exportEditor.setValue) {
            exportEditor.setValue(content);
        } else {
            // 回退方案：使用 pre 元素
            const preEl = document.getElementById('export-output');
            if (preEl) {
                preEl.textContent = content;
                preEl.style.display = 'block';
            }
        }
    }

    /**
     * 获取编辑器内容
     */
    function getEditorValue() {
        if (exportEditor && exportEditor.getValue) {
            return exportEditor.getValue();
        }
        const preEl = document.getElementById('export-output');
        return preEl?.textContent || '';
    }

    // 示例 URL
    const SAMPLE_URLS = [
        'https://api.example.com:8080/v1/users?name=%E5%BC%A0%E4%B8%89&age=25&active=true&tags[]=web&tags[]=mobile#profile',
        'https://www.google.com/search?q=url+parser&hl=zh-CN&source=hp&ei=abc123',
        'https://github.com/search?q=javascript&type=repositories&sort=stars&order=desc',
        'https://example.com/api/data?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9&user_id=12345&timestamp=1704067200'
    ];

    /**
     * 解析 URL
     */
    function parseURL(urlString) {
        try {
            const url = new URL(urlString);
            return {
                protocol: url.protocol,
                host: url.host,
                hostname: url.hostname,
                port: url.port,
                pathname: url.pathname,
                search: url.search,
                hash: url.hash,
                origin: url.origin,
                searchParams: url.searchParams
            };
        } catch (error) {
            throw new Error('无效的 URL 格式');
        }
    }

    /**
     * 显示解析结果
     */
    function showResult(result) {
        // 更新 URL 组成部分
        updateUrlPart('protocol', result.protocol);
        updateUrlPart('hostname', result.hostname);
        updateUrlPart('port', result.port || '(默认)');
        updateUrlPart('pathname', result.pathname);
        updateUrlPart('search', result.search || '(无)');
        updateUrlPart('hash', result.hash || '(无)');
        updateUrlPart('origin', result.origin);

        resultSection.style.display = 'block';

        // 处理查询参数
        currentParams = [...result.searchParams.entries()].map(([key, value]) => ({
            key,
            value,
            decoded: decodeURIComponent(value)
        }));

        if (currentParams.length > 0) {
            renderQueryParams(currentParams);
            queryParamsSection.style.display = 'block';
            noParamsHint.style.display = 'none';

            // 更新导出
            updateExport();
        } else {
            queryParamsSection.style.display = 'none';
            noParamsHint.style.display = 'flex';
        }
    }

    /**
     * 更新 URL 组成部分显示
     */
    function updateUrlPart(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value || '-';
            el.title = value || '';
        }
    }

    /**
     * 检测参数值的类型
     */
    function detectValueType(value) {
        if (!value || value === '') return { type: 'string', label: 'String' };

        // 布尔值
        if (value === 'true' || value === 'false' || value === 'True' || value === 'False') {
            return { type: 'boolean', label: 'Boolean' };
        }

        // 整数
        if (/^-?\d+$/.test(value) && value.length < 16) {
            // 检查是否可能是时间戳
            const num = parseInt(value);
            if (num > 1000000000 && num < 9999999999) {
                return { type: 'timestamp', label: 'Timestamp' };
            }
            if (num > 1000000000000 && num < 9999999999999) {
                return { type: 'timestamp', label: 'Timestamp(ms)' };
            }
            return { type: 'number', label: 'Number' };
        }

        // 浮点数
        if (/^-?\d+\.\d+$/.test(value)) {
            return { type: 'number', label: 'Float' };
        }

        // UUID
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
            return { type: 'uuid', label: 'UUID' };
        }

        // Email
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return { type: 'email', label: 'Email' };
        }

        // URL
        if (/^https?:\/\//i.test(value)) {
            return { type: 'url', label: 'URL' };
        }

        // Base64 (简单检测)
        if (/^[A-Za-z0-9+/]+=*$/.test(value) && value.length > 20 && value.length % 4 === 0) {
            return { type: 'base64', label: 'Base64' };
        }

        // JWT Token
        if (/^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)) {
            return { type: 'base64', label: 'JWT' };
        }

        // JSON 对象或数组
        if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
            try {
                JSON.parse(value);
                return { type: 'json', label: 'JSON' };
            } catch (e) {}
        }

        // 数组参数 (如 a,b,c)
        if (value.includes(',') && !value.includes(' ')) {
            return { type: 'array', label: 'Array' };
        }

        return { type: 'string', label: 'String' };
    }

    /**
     * 渲染查询参数表格
     */
    function renderQueryParams(params) {
        paramsCount.textContent = `${params.length} 个参数`;

        queryParamsBody.innerHTML = params.map(({ key, value, decoded }) => {
            const typeInfo = detectValueType(decoded);
            return `
            <tr>
                <td class="clickable-cell" data-copy="${escapeHtml(key)}" title="点击复制"><code class="param-key">${escapeHtml(key)}</code></td>
                <td class="clickable-cell" data-copy="${escapeHtml(value)}" title="点击复制"><code class="param-value">${escapeHtml(value)}</code></td>
                <td class="clickable-cell" data-copy="${escapeHtml(decoded)}" title="点击复制"><code class="decoded-value">${escapeHtml(decoded)}</code></td>
                <td><span class="type-badge ${typeInfo.type}">${typeInfo.label}</span></td>
            </tr>
        `}).join('');

        // 绑定点击复制事件
        queryParamsBody.querySelectorAll('.clickable-cell').forEach(cell => {
            cell.addEventListener('click', async () => {
                const value = cell.dataset.copy;
                if (value) {
                    const success = await REOT.utils?.copyToClipboard(value);
                    if (success) {
                        cell.classList.add('copied');
                        setTimeout(() => cell.classList.remove('copied'), 800);
                    }
                }
            });
        });
    }

    /**
     * 更新导出内容
     */
    async function updateExport() {
        const format = exportFormat?.value || 'python-dict';
        const output = generateExport(currentParams, format);

        // 重新创建编辑器以应用新的语言高亮，并设置内容
        await recreateEditorWithLanguage(format, output);

        // 更新格式徽章
        if (exportFormatBadge) {
            const formatLabels = {
                'python-dict': 'Python',
                'json': 'JSON',
                'js-object': 'JavaScript',
                'php-array': 'PHP',
                'query-string': 'Query String'
            };
            exportFormatBadge.textContent = formatLabels[format] || format;
        }
    }

    /**
     * 生成导出内容
     */
    function generateExport(params, format) {
        if (params.length === 0) return '';

        const paramsObj = {};
        params.forEach(({ key, decoded }) => {
            // 处理数组参数（如 tags[]）
            const cleanKey = key.replace(/\[\]$/, '');
            if (key.endsWith('[]')) {
                if (!paramsObj[cleanKey]) {
                    paramsObj[cleanKey] = [];
                }
                paramsObj[cleanKey].push(decoded);
            } else {
                paramsObj[key] = decoded;
            }
        });

        switch (format) {
            case 'python-dict':
                return generatePythonDict(paramsObj);
            case 'json':
                return JSON.stringify(paramsObj, null, 4);
            case 'js-object':
                return generateJsObject(paramsObj);
            case 'php-array':
                return generatePhpArray(paramsObj);
            case 'query-string':
                return generateQueryString(params);
            default:
                return JSON.stringify(paramsObj, null, 4);
        }
    }

    /**
     * 生成 Python 字典
     */
    function generatePythonDict(obj) {
        const lines = ['params = {'];
        const entries = Object.entries(obj);

        entries.forEach(([key, value], index) => {
            const comma = index < entries.length - 1 ? ',' : '';

            if (Array.isArray(value)) {
                const items = value.map(v => `'${escapeString(v)}'`).join(', ');
                lines.push(`    '${escapeString(key)}': [${items}]${comma}`);
            } else {
                // 智能判断值类型
                let formattedValue;
                if (value === 'true' || value === 'True') {
                    formattedValue = 'True';
                } else if (value === 'false' || value === 'False') {
                    formattedValue = 'False';
                } else if (value === 'null' || value === 'None') {
                    formattedValue = 'None';
                } else if (/^-?\d+$/.test(value)) {
                    formattedValue = value;  // 整数
                } else if (/^-?\d+\.\d+$/.test(value)) {
                    formattedValue = value;  // 浮点数
                } else {
                    formattedValue = `'${escapeString(value)}'`;  // 字符串
                }
                lines.push(`    '${escapeString(key)}': ${formattedValue}${comma}`);
            }
        });

        lines.push('}');
        return lines.join('\n');
    }

    /**
     * 生成 JavaScript 对象
     */
    function generateJsObject(obj) {
        const lines = ['const params = {'];
        const entries = Object.entries(obj);

        entries.forEach(([key, value], index) => {
            const comma = index < entries.length - 1 ? ',' : '';
            const keyStr = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${escapeString(key)}'`;

            if (Array.isArray(value)) {
                const items = value.map(v => `'${escapeString(v)}'`).join(', ');
                lines.push(`    ${keyStr}: [${items}]${comma}`);
            } else {
                // 智能判断值类型
                let formattedValue;
                if (value === 'true') {
                    formattedValue = 'true';
                } else if (value === 'false') {
                    formattedValue = 'false';
                } else if (value === 'null') {
                    formattedValue = 'null';
                } else if (/^-?\d+$/.test(value)) {
                    formattedValue = value;
                } else if (/^-?\d+\.\d+$/.test(value)) {
                    formattedValue = value;
                } else {
                    formattedValue = `'${escapeString(value)}'`;
                }
                lines.push(`    ${keyStr}: ${formattedValue}${comma}`);
            }
        });

        lines.push('};');
        return lines.join('\n');
    }

    /**
     * 生成 PHP 数组
     */
    function generatePhpArray(obj) {
        const lines = ['$params = ['];
        const entries = Object.entries(obj);

        entries.forEach(([key, value], index) => {
            const comma = index < entries.length - 1 ? ',' : '';

            if (Array.isArray(value)) {
                const items = value.map(v => `'${escapeString(v)}'`).join(', ');
                lines.push(`    '${escapeString(key)}' => [${items}]${comma}`);
            } else {
                // 智能判断值类型
                let formattedValue;
                if (value === 'true') {
                    formattedValue = 'true';
                } else if (value === 'false') {
                    formattedValue = 'false';
                } else if (value === 'null') {
                    formattedValue = 'null';
                } else if (/^-?\d+$/.test(value)) {
                    formattedValue = value;
                } else if (/^-?\d+\.\d+$/.test(value)) {
                    formattedValue = value;
                } else {
                    formattedValue = `'${escapeString(value)}'`;
                }
                lines.push(`    '${escapeString(key)}' => ${formattedValue}${comma}`);
            }
        });

        lines.push('];');
        return lines.join('\n');
    }

    /**
     * 生成查询字符串
     */
    function generateQueryString(params) {
        return params.map(({ key, value }) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        ).join('&');
    }

    /**
     * 转义字符串中的特殊字符
     */
    function escapeString(str) {
        return str
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    }

    /**
     * 转义 HTML
     */
    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * 获取导出文件扩展名
     */
    function getExportExtension(format) {
        const extensions = {
            'python-dict': 'py',
            'json': 'json',
            'js-object': 'js',
            'php-array': 'php',
            'query-string': 'txt'
        };
        return extensions[format] || 'txt';
    }

    /**
     * 保存文件
     */
    function saveFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ==================== 事件监听 ====================

    // 示例按钮
    if (sampleBtn) {
        sampleBtn.addEventListener('click', () => {
            const randomUrl = SAMPLE_URLS[Math.floor(Math.random() * SAMPLE_URLS.length)];
            inputEl.value = randomUrl;
            try {
                const result = parseURL(randomUrl);
                showResult(result);
            } catch (e) {
                REOT.utils?.showNotification(e.message, 'error');
            }
        });
    }

    // 清除按钮
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            inputEl.value = '';
            resultSection.style.display = 'none';
            currentParams = [];
        });
    }

    // 实时解析
    if (inputEl) {
        inputEl.addEventListener('input', () => {
            if (inputEl.value.trim()) {
                try {
                    const result = parseURL(inputEl.value);
                    showResult(result);
                } catch (e) {
                    // 输入过程中忽略错误
                }
            } else {
                resultSection.style.display = 'none';
            }
        });

        // 回车解析
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                try {
                    const result = parseURL(inputEl.value);
                    showResult(result);
                } catch (error) {
                    REOT.utils?.showNotification(error.message, 'error');
                }
            }
        });
    }

    // 导出格式变化
    if (exportFormat) {
        exportFormat.addEventListener('change', updateExport);
    }

    // 复制导出
    if (copyExportBtn) {
        copyExportBtn.addEventListener('click', async () => {
            const content = getEditorValue();
            if (content) {
                const success = await REOT.utils?.copyToClipboard(content);
                if (success) {
                    REOT.utils?.showNotification('已复制', 'success');
                }
            }
        });
    }

    // 保存导出
    if (saveExportBtn) {
        saveExportBtn.addEventListener('click', () => {
            const content = getEditorValue();
            if (content) {
                const format = exportFormat?.value || 'json';
                const ext = getExportExtension(format);
                const filename = `url_params.${ext}`;
                saveFile(content, filename);
                REOT.utils?.showNotification(`已保存: ${filename}`, 'success');
            }
        });
    }

    // 复制按钮（URL 组成部分）
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetId = btn.dataset.target;
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                const value = targetEl.textContent;
                if (value && value !== '-' && value !== '(默认)' && value !== '(无)') {
                    const success = await REOT.utils?.copyToClipboard(value);
                    if (success) {
                        REOT.utils?.showNotification('已复制', 'success');
                    }
                }
            }
        });
    });

    // 设置默认示例
    if (inputEl && !inputEl.value) {
        inputEl.value = 'https://api.example.com/v1/users?name=%E5%BC%A0%E4%B8%89&age=25&active=true#profile';
        try {
            const result = parseURL(inputEl.value);
            showResult(result);
        } catch (e) {}
    }

    // 导出到全局
    window.URLParserTool = {
        parseURL,
        generateExport
    };
})();
