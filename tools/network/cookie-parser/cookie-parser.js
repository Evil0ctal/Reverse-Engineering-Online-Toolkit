/**
 * Cookie 解析器工具
 * @description 解析和格式化 Cookie 字符串，支持字符串和 JSON 列表格式
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    let cookies = [];
    let inputFormat = 'string'; // 'string' | 'json' | 'netscape' - 记录输入格式

    // 对比功能相关变量
    let compareInputs = [];
    let compareInputCount = 0;

    /**
     * 检测输入格式
     */
    function detectInputFormat(input) {
        const trimmed = input.trim();

        // 检查是否以 [ 开头（JSON 数组）
        if (trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    return 'json';
                }
            } catch (e) {
                // 解析失败，继续检测其他格式
            }
        }

        // 检查是否是 Netscape 格式
        // Netscape 格式特征：以 # 开头的注释行，或以域名开头的 tab 分隔行
        const lines = trimmed.split('\n');
        let hasNetscapeHeader = false;
        let hasValidNetscapeLine = false;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            // 检查 Netscape 文件头注释
            if (trimmedLine.startsWith('# Netscape') || trimmedLine.startsWith('# HTTP Cookie File')) {
                hasNetscapeHeader = true;
            }

            // 检查是否是有效的 Netscape cookie 行（7个 tab 分隔的字段）
            if (!trimmedLine.startsWith('#')) {
                const parts = trimmedLine.split('\t');
                if (parts.length >= 6) {
                    hasValidNetscapeLine = true;
                }
            }
        }

        if (hasNetscapeHeader || hasValidNetscapeLine) {
            return 'netscape';
        }

        return 'string';
    }

    /**
     * 解析 JSON 格式的 Cookie 列表
     */
    function parseCookieJson(jsonString) {
        const result = [];
        try {
            const parsed = JSON.parse(jsonString);
            if (!Array.isArray(parsed)) {
                return result;
            }

            for (const item of parsed) {
                if (typeof item !== 'object' || item === null) continue;

                // 支持多种字段名格式
                const name = item.name || item.Name || item.key || item.Key || '';
                const value = item.value || item.Value || '';
                const domain = item.domain || item.Domain || '';
                const path = item.path || item.Path || '/';
                const expires = item.expires || item.Expires || item.expirationDate || '';
                const httpOnly = item.httpOnly || item.HttpOnly || false;
                const secure = item.secure || item.Secure || false;
                const sameSite = item.sameSite || item.SameSite || '';

                if (!name) continue;

                let decoded = value;
                try {
                    decoded = decodeURIComponent(value);
                } catch (e) {
                    // 解码失败，使用原值
                }

                result.push({
                    name,
                    value,
                    decoded,
                    domain,
                    path,
                    expires,
                    httpOnly,
                    secure,
                    sameSite
                });
            }
        } catch (e) {
            console.error('Failed to parse cookie JSON:', e);
        }
        return result;
    }

    // 解析 Netscape 格式的 Cookie
    // 格式：domain  flag  path  secure  expiration  name  value
    // 示例：.example.com	TRUE	/	FALSE	1234567890	session_id	abc123
    function parseCookieNetscape(input) {
        const result = [];
        const lines = input.trim().split('\n');

        for (const line of lines) {
            const trimmedLine = line.trim();

            // 跳过空行和注释行
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                continue;
            }

            const parts = trimmedLine.split('\t');

            // Netscape 格式需要至少 7 个字段，但有时 value 可能为空
            if (parts.length >= 6) {
                const domain = parts[0] || '';
                const flag = parts[1] === 'TRUE';
                const path = parts[2] || '/';
                const secure = parts[3] === 'TRUE';
                const expiration = parts[4] || '0';
                const name = parts[5] || '';
                const value = parts[6] || '';

                if (!name) continue;

                let decoded = value;
                try {
                    decoded = decodeURIComponent(value);
                } catch (e) {
                    // 解码失败，使用原值
                }

                // 计算过期时间
                let expires = '';
                if (expiration && expiration !== '0') {
                    try {
                        const timestamp = parseInt(expiration, 10);
                        if (timestamp > 0) {
                            expires = new Date(timestamp * 1000).toISOString();
                        }
                    } catch (e) {
                        // 解析失败
                    }
                }

                result.push({
                    name,
                    value,
                    decoded,
                    domain,
                    path,
                    expires,
                    httpOnly: false,
                    secure,
                    includeSubdomains: flag
                });
            }
        }

        return result;
    }

    /**
     * 解析 Cookie 字符串格式
     */
    function parseCookieStringFormat(cookieString) {
        if (!cookieString.trim()) {
            return [];
        }

        const result = [];
        const pairs = cookieString.split(';');

        for (const pair of pairs) {
            const trimmed = pair.trim();
            if (!trimmed) continue;

            const equalsIndex = trimmed.indexOf('=');
            if (equalsIndex === -1) {
                // 没有等号的情况
                result.push({
                    name: trimmed,
                    value: '',
                    decoded: ''
                });
            } else {
                const name = trimmed.substring(0, equalsIndex).trim();
                const value = trimmed.substring(equalsIndex + 1).trim();

                let decoded = value;
                try {
                    decoded = decodeURIComponent(value);
                } catch (e) {
                    // 解码失败，使用原值
                }

                result.push({
                    name,
                    value,
                    decoded
                });
            }
        }

        return result;
    }

    /**
     * 解析 Cookie（自动检测格式）
     */
    function parseCookieString(input) {
        if (!input.trim()) {
            return [];
        }

        inputFormat = detectInputFormat(input);

        if (inputFormat === 'json') {
            return parseCookieJson(input);
        } else if (inputFormat === 'netscape') {
            return parseCookieNetscape(input);
        } else {
            return parseCookieStringFormat(input);
        }
    }

    /**
     * 将 Cookie 数组转为字符串
     */
    function cookiesToString(cookies) {
        return cookies
            .map(c => `${c.name}=${c.value}`)
            .join('; ');
    }

    /**
     * 将 Cookie 数组转为 JSON 列表格式
     * 输出格式: [{name, value, ...}, ...]
     */
    function cookiesToJson(cookies, pretty = true) {
        const output = cookies.map(c => {
            const obj = {
                name: c.name,
                value: c.value
            };
            // 包含额外字段（如果存在）
            if (c.domain) obj.domain = c.domain;
            if (c.path) obj.path = c.path;
            if (c.expires) obj.expires = c.expires;
            if (c.httpOnly) obj.httpOnly = c.httpOnly;
            if (c.secure) obj.secure = c.secure;
            if (c.sameSite) obj.sameSite = c.sameSite;
            return obj;
        });
        return pretty ? JSON.stringify(output, null, 2) : JSON.stringify(output);
    }

    /**
     * 将 Cookie 数组转为纯 JSON 对象格式
     * 输出格式: {key1: value1, key2: value2, ...}
     */
    function cookiesToJsonObject(cookies, pretty = true) {
        const output = {};
        for (const c of cookies) {
            output[c.name] = c.value;
        }
        return pretty ? JSON.stringify(output, null, 2) : JSON.stringify(output);
    }

    // 将 Cookie 数组转为 Netscape 格式
    // 格式：domain  flag  path  secure  expiration  name  value
    function cookiesToNetscape(cookies, defaultDomain = 'localhost') {
        let output = '# Netscape HTTP Cookie File\n';
        output += '# https://curl.se/docs/http-cookies.html\n';
        output += '# Generated by REOT Cookie Parser\n\n';

        for (const c of cookies) {
            const domain = c.domain || defaultDomain;
            const flag = c.includeSubdomains ? 'TRUE' : (domain.startsWith('.') ? 'TRUE' : 'FALSE');
            const path = c.path || '/';
            const secure = c.secure ? 'TRUE' : 'FALSE';

            // 计算过期时间戳
            let expiration = '0';
            if (c.expires) {
                try {
                    const date = new Date(c.expires);
                    if (!isNaN(date.getTime())) {
                        expiration = Math.floor(date.getTime() / 1000).toString();
                    }
                } catch (e) {
                    // 解析失败，使用 0
                }
            }

            const name = c.name || '';
            const value = c.value || '';

            output += `${domain}\t${flag}\t${path}\t${secure}\t${expiration}\t${name}\t${value}\n`;
        }

        return output;
    }

    /**
     * 格式化文件大小
     */
    function formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 渲染 Cookie 表格
     */
    function renderCookieTable() {
        const tbody = document.getElementById('cookie-tbody');
        const tableSection = document.getElementById('table-section');
        const statsSection = document.getElementById('stats-section');
        const cookieCount = document.getElementById('cookie-count');
        const totalSize = document.getElementById('total-size');

        if (!tbody) return;

        if (cookies.length === 0) {
            tableSection.style.display = 'none';
            statsSection.style.display = 'none';
            return;
        }

        tableSection.style.display = 'block';
        statsSection.style.display = 'block';

        // 渲染表格行
        tbody.innerHTML = cookies.map((cookie, index) => `
            <tr data-index="${index}">
                <td>
                    <input type="text" class="cookie-name" value="${escapeHtml(cookie.name)}" data-field="name">
                </td>
                <td>
                    <input type="text" class="cookie-value" value="${escapeHtml(cookie.value)}" data-field="value">
                </td>
                <td class="decoded-value" title="${escapeHtml(cookie.decoded)}">
                    ${escapeHtml(truncate(cookie.decoded, 50))}
                </td>
                <td>
                    <button class="btn btn--sm btn--outline copy-cookie-btn" data-index="${index}">
                        <span data-i18n="common.copy">复制</span>
                    </button>
                    <button class="btn btn--sm btn--outline delete-cookie-btn" data-index="${index}">
                        <span data-i18n="tools.cookie-parser.delete">删除</span>
                    </button>
                </td>
            </tr>
        `).join('');

        // 更新统计信息
        const totalBytes = cookies.reduce((sum, c) => sum + c.name.length + c.value.length + 1, 0);
        cookieCount.textContent = cookies.length;
        totalSize.textContent = formatSize(totalBytes);
    }

    /**
     * 转义 HTML
     */
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * 截断字符串
     */
    function truncate(str, length) {
        if (str.length <= length) return str;
        return str.substring(0, length) + '...';
    }

    /**
     * 复制到剪贴板
     */
    async function copyToClipboard(text) {
        const success = await REOT.utils?.copyToClipboard(text);
        if (success) {
            REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
        }
    }

    /**
     * 获取浏览器 Cookie
     */
    function getBrowserCookies() {
        const input = document.getElementById('input');
        if (document.cookie) {
            if (input) {
                input.value = document.cookie;
            }
            REOT.utils?.showNotification('已获取当前页面的 Cookie', 'success');
        } else {
            REOT.utils?.showNotification('当前页面没有 Cookie', 'warning');
        }
    }

    // 检查当前是否在 Cookie Parser 工具页面
    function isCookieParserToolActive() {
        // 优先检查页面元素是否存在
        const cookieTable = document.getElementById('cookie-table');
        if (cookieTable) return true;

        // 备用：检查路由
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/network/cookie-parser');
    }

    // 事件委托处理器
    document.addEventListener('click', (e) => {
        // 只在 Cookie Parser 工具页面处理事件
        if (!isCookieParserToolActive()) return;

        const target = e.target;

        // 解析按钮
        if (target.id === 'parse-btn' || target.closest('#parse-btn')) {
            const input = document.getElementById('input');
            if (!input.value.trim()) {
                REOT.utils?.showNotification('请输入 Cookie', 'warning');
                return;
            }

            cookies = parseCookieString(input.value);
            renderCookieTable();

            if (cookies.length > 0) {
                const formatMap = {
                    'json': 'JSON 格式',
                    'netscape': 'Netscape 格式',
                    'string': '字符串格式'
                };
                const formatMsg = `(${formatMap[inputFormat] || '未知格式'})`;
                REOT.utils?.showNotification(`成功解析 ${cookies.length} 个 Cookie ${formatMsg}`, 'success');
            } else {
                REOT.utils?.showNotification('未找到有效的 Cookie', 'warning');
            }
        }

        // 获取浏览器 Cookie
        if (target.id === 'get-browser-btn' || target.closest('#get-browser-btn')) {
            getBrowserCookies();
        }

        // 转为字符串
        if (target.id === 'to-string-btn' || target.closest('#to-string-btn')) {
            if (cookies.length === 0) {
                REOT.utils?.showNotification('请先解析 Cookie', 'warning');
                return;
            }

            const stringOutput = document.getElementById('string-output');
            const stringSection = document.getElementById('string-output-section');
            const outputLabel = document.getElementById('output-label');

            if (stringOutput && stringSection) {
                stringOutput.value = cookiesToString(cookies);
                stringSection.style.display = 'block';
                if (outputLabel) {
                    outputLabel.textContent = REOT.i18n?.t('tools.cookie-parser.cookieString') || 'Cookie 字符串';
                }
            }
        }

        // 清除按钮
        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            const input = document.getElementById('input');
            const stringOutput = document.getElementById('string-output');
            const tableSection = document.getElementById('table-section');
            const statsSection = document.getElementById('stats-section');
            const stringSection = document.getElementById('string-output-section');

            if (input) input.value = '';
            if (stringOutput) stringOutput.value = '';
            if (tableSection) tableSection.style.display = 'none';
            if (statsSection) statsSection.style.display = 'none';
            if (stringSection) stringSection.style.display = 'none';
            cookies = [];
        }

        // 复制按钮
        if (target.id === 'copy-btn' || target.closest('#copy-btn')) {
            const stringOutput = document.getElementById('string-output');
            const input = document.getElementById('input');

            if (stringOutput && stringOutput.value) {
                copyToClipboard(stringOutput.value);
            } else if (cookies.length > 0) {
                copyToClipboard(cookiesToString(cookies));
            } else if (input && input.value) {
                copyToClipboard(input.value);
            }
        }

        // 添加 Cookie
        if (target.id === 'add-cookie-btn' || target.closest('#add-cookie-btn')) {
            cookies.push({
                name: 'new_cookie',
                value: 'value',
                decoded: 'value'
            });
            renderCookieTable();
        }

        // 转为 JSON 列表
        if (target.id === 'to-json-btn' || target.closest('#to-json-btn')) {
            if (cookies.length === 0) {
                REOT.utils?.showNotification('请先解析 Cookie', 'warning');
                return;
            }

            const stringOutput = document.getElementById('string-output');
            const stringSection = document.getElementById('string-output-section');
            const outputLabel = document.getElementById('output-label');

            if (stringOutput && stringSection) {
                stringOutput.value = cookiesToJson(cookies);
                stringSection.style.display = 'block';
                if (outputLabel) {
                    outputLabel.textContent = REOT.i18n?.t('tools.cookie-parser.jsonListOutput') || 'JSON 列表输出';
                }
            }
        }

        // 转为 JSON 对象
        if (target.id === 'to-json-object-btn' || target.closest('#to-json-object-btn')) {
            if (cookies.length === 0) {
                REOT.utils?.showNotification('请先解析 Cookie', 'warning');
                return;
            }

            const stringOutput = document.getElementById('string-output');
            const stringSection = document.getElementById('string-output-section');
            const outputLabel = document.getElementById('output-label');

            if (stringOutput && stringSection) {
                stringOutput.value = cookiesToJsonObject(cookies);
                stringSection.style.display = 'block';
                if (outputLabel) {
                    outputLabel.textContent = REOT.i18n?.t('tools.cookie-parser.jsonObjectOutput') || 'JSON 对象输出';
                }
            }
        }

        // 转为 Netscape 格式
        if (target.id === 'to-netscape-btn' || target.closest('#to-netscape-btn')) {
            if (cookies.length === 0) {
                REOT.utils?.showNotification('请先解析 Cookie', 'warning');
                return;
            }

            const stringOutput = document.getElementById('string-output');
            const stringSection = document.getElementById('string-output-section');
            const outputLabel = document.getElementById('output-label');

            if (stringOutput && stringSection) {
                stringOutput.value = cookiesToNetscape(cookies);
                stringSection.style.display = 'block';
                if (outputLabel) {
                    outputLabel.textContent = REOT.i18n?.t('tools.cookie-parser.netscapeOutput') || 'Netscape 输出';
                }
            }
        }

        // 导出 JSON（复制到剪贴板）
        if (target.id === 'export-json-btn' || target.closest('#export-json-btn')) {
            if (cookies.length === 0) {
                REOT.utils?.showNotification('没有可导出的 Cookie', 'warning');
                return;
            }

            const json = cookiesToJson(cookies);
            copyToClipboard(json);
            REOT.utils?.showNotification('JSON 已复制到剪贴板', 'success');
        }

        // 复制单个 Cookie
        const copyCookieBtn = target.closest('.copy-cookie-btn');
        if (copyCookieBtn) {
            const index = parseInt(copyCookieBtn.dataset.index, 10);
            const cookie = cookies[index];
            if (cookie) {
                copyToClipboard(`${cookie.name}=${cookie.value}`);
            }
        }

        // 删除 Cookie
        const deleteCookieBtn = target.closest('.delete-cookie-btn');
        if (deleteCookieBtn) {
            const index = parseInt(deleteCookieBtn.dataset.index, 10);
            cookies.splice(index, 1);
            renderCookieTable();
        }
    });

    // 监听输入框变化（编辑 Cookie）
    document.addEventListener('input', (e) => {
        const target = e.target;

        if (target.classList.contains('cookie-name') || target.classList.contains('cookie-value')) {
            const row = target.closest('tr');
            if (!row) return;

            const index = parseInt(row.dataset.index, 10);
            const field = target.dataset.field;

            if (cookies[index] && field) {
                cookies[index][field] = target.value;

                // 更新解码值
                if (field === 'value') {
                    try {
                        cookies[index].decoded = decodeURIComponent(target.value);
                    } catch (e) {
                        cookies[index].decoded = target.value;
                    }
                    const decodedCell = row.querySelector('.decoded-value');
                    if (decodedCell) {
                        decodedCell.textContent = truncate(cookies[index].decoded, 50);
                        decodedCell.title = cookies[index].decoded;
                    }
                }
            }
        }
    });

    // ==================== 对比功能 ====================

    /**
     * 创建对比输入框（使用 CodeMirror 编辑器）
     */
    async function createCompareInput(index) {
        const id = ++compareInputCount;
        const container = document.getElementById('cookie-compare-inputs-container');
        if (!container) return null;

        const card = document.createElement('div');
        card.className = 'compare-input-card';
        card.dataset.id = id;

        // 构建 DOM 元素
        const header = document.createElement('div');
        header.className = 'compare-input-header';

        // 左侧：折叠按钮 + 标签
        const leftGroup = document.createElement('div');
        leftGroup.className = 'compare-input-header-left';

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'compare-input-toggle';
        toggleBtn.title = '折叠';
        toggleBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>';

        const label = document.createElement('span');
        label.className = 'compare-input-label';
        const numSpan = document.createElement('span');
        numSpan.className = 'compare-input-number';
        numSpan.textContent = index;
        label.appendChild(numSpan);
        label.appendChild(document.createTextNode(' Cookie ' + index));

        leftGroup.appendChild(toggleBtn);
        leftGroup.appendChild(label);

        // 右侧：删除按钮
        const removeBtn = document.createElement('button');
        removeBtn.className = 'compare-input-remove';
        removeBtn.dataset.removeId = id;
        removeBtn.title = '移除';
        removeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

        header.appendChild(leftGroup);
        header.appendChild(removeBtn);

        const body = document.createElement('div');
        body.className = 'compare-input-body';

        const editorDiv = document.createElement('div');
        editorDiv.id = 'cookie-compare-editor-' + id;
        editorDiv.className = 'code-editor-container';

        body.appendChild(editorDiv);
        card.appendChild(header);
        card.appendChild(body);
        container.appendChild(card);

        // 创建 CodeMirror 编辑器
        let editor = null;
        try {
            const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            if (REOT.CodeEditor) {
                editor = await REOT.CodeEditor.create('#cookie-compare-editor-' + id, {
                    language: 'javascript',
                    value: '',
                    readOnly: false,
                    theme: theme,
                    lineWrapping: true,
                    placeholder: '粘贴第 ' + index + ' 个 Cookie...'
                });
            }
        } catch (e) {
            console.error('Failed to create cookie compare editor:', e);
            // 降级为 textarea
            editorDiv.remove();
            const textarea = document.createElement('textarea');
            textarea.className = 'form-input form-textarea form-textarea--code compare-textarea';
            textarea.placeholder = '粘贴第 ' + index + ' 个 Cookie...';
            textarea.dataset.id = id;
            body.appendChild(textarea);
        }

        const editorInfo = {
            id: id,
            index: index,
            editor: editor,
            element: card
        };
        compareInputs.push(editorInfo);

        updateCompareInputsUI();
        return editorInfo;
    }

    /**
     * 移除对比输入框
     */
    function removeCompareInput(id) {
        const index = compareInputs.findIndex(input => input.id === id);
        if (index === -1) return;

        // 至少保留2个
        if (compareInputs.length <= 2) {
            REOT.utils?.showNotification('至少需要保留 2 个对比输入框', 'warning');
            return;
        }

        const input = compareInputs[index];

        // 销毁编辑器
        if (input.editor && REOT.CodeEditor) {
            REOT.CodeEditor.destroy(input.editor);
        }

        input.element.remove();
        compareInputs.splice(index, 1);

        reindexCompareInputs();
        updateCompareInputsUI();
    }

    /**
     * 重新编号输入框
     */
    function reindexCompareInputs() {
        compareInputs.forEach((input, index) => {
            input.index = index + 1;
            const label = input.element.querySelector('.compare-input-label');
            if (label) {
                const numSpan = label.querySelector('.compare-input-number');
                if (numSpan) {
                    numSpan.textContent = index + 1;
                }
                // 更新文本节点
                const textNode = label.childNodes[1];
                if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                    textNode.textContent = ' Cookie ' + (index + 1);
                }
            }
        });
    }

    /**
     * 获取编辑器值
     */
    function getCompareEditorValue(editorInfo) {
        if (editorInfo.editor) {
            return editorInfo.editor.getValue();
        }
        // 降级到 textarea
        const textarea = editorInfo.element.querySelector('.compare-textarea');
        return textarea ? textarea.value : '';
    }

    /**
     * 设置编辑器值
     */
    function setCompareEditorValue(editorInfo, value) {
        if (editorInfo.editor) {
            editorInfo.editor.setValue(value);
        } else {
            const textarea = editorInfo.element.querySelector('.compare-textarea');
            if (textarea) {
                textarea.value = value;
            }
        }
    }

    /**
     * 更新对比输入框 UI
     */
    function updateCompareInputsUI() {
        const badge = document.getElementById('cookie-compare-count-badge');
        if (badge) {
            badge.textContent = compareInputs.length + ' 个 Cookie';
        }

        // 更新删除按钮显示状态
        compareInputs.forEach(input => {
            const removeBtn = input.element.querySelector('.compare-input-remove');
            if (removeBtn) {
                removeBtn.style.display = compareInputs.length <= 2 ? 'none' : '';
            }
        });
    }

    /**
     * 初始化对比输入框
     */
    async function initCompareInputs() {
        const container = document.getElementById('cookie-compare-inputs-container');
        if (!container || compareInputs.length > 0) return;

        await createCompareInput(1);
        await createCompareInput(2);
    }

    /**
     * 清除所有对比输入
     */
    function clearAllCompareInputs() {
        compareInputs.forEach(input => {
            setCompareEditorValue(input, '');
        });

        // 隐藏结果
        const result = document.getElementById('cookie-compare-result');
        if (result) {
            result.style.display = 'none';
        }
    }

    /**
     * 折叠所有对比输入
     */
    function collapseAllCompareInputs() {
        compareInputs.forEach(input => {
            input.element.classList.add('collapsed');
        });
    }

    /**
     * 对比多个 Cookie
     */
    function compareMultipleCookies(cookieStrings) {
        const parsedCookies = cookieStrings.map((str, index) => {
            const parsed = parseCookieString(str);
            const cookieMap = {};
            parsed.forEach(c => {
                cookieMap[c.name] = c.value;
            });
            return {
                index: index + 1,
                cookies: cookieMap,
                count: parsed.length
            };
        });

        return compareMultipleCookieObjects(parsedCookies);
    }

    /**
     * 对比多个 Cookie 对象
     */
    function compareMultipleCookieObjects(cookieObjects) {
        const count = cookieObjects.length;
        const allKeys = new Set();

        // 收集所有 cookie 名称
        cookieObjects.forEach(obj => {
            Object.keys(obj.cookies).forEach(key => allKeys.add(key));
        });

        const result = {
            count: count,
            totalKeys: allKeys.size,
            cookies: [],
            stats: {
                identical: 0,
                different: 0,
                partial: 0
            }
        };

        // 对每个 key 进行对比
        allKeys.forEach(key => {
            const values = cookieObjects.map(obj => obj.cookies[key] || null);
            const nonNullValues = values.filter(v => v !== null);
            const uniqueValues = [...new Set(nonNullValues)];

            let status;
            if (nonNullValues.length === count && uniqueValues.length === 1) {
                status = 'identical';
                result.stats.identical++;
            } else if (nonNullValues.length < count) {
                status = 'partial';
                result.stats.partial++;
            } else {
                status = 'different';
                result.stats.different++;
            }

            result.cookies.push({
                name: key,
                values: values,
                status: status
            });
        });

        // 按状态排序：different -> partial -> identical
        result.cookies.sort((a, b) => {
            const order = { different: 0, partial: 1, identical: 2 };
            return order[a.status] - order[b.status];
        });

        return result;
    }

    /**
     * 渲染对比结果
     */
    function renderCompareResult(diff) {
        const resultDiv = document.getElementById('cookie-compare-result');
        if (!resultDiv) return;

        // 渲染统计信息
        const statsDiv = document.getElementById('cookie-diff-stats');
        if (statsDiv) {
            statsDiv.textContent = '';

            const stats = [
                { className: 'diff-stat--identical', value: diff.stats.identical, label: '相同' },
                { className: 'diff-stat--different', value: diff.stats.different, label: '不同' },
                { className: 'diff-stat--partial', value: diff.stats.partial, label: '部分存在' }
            ];

            stats.forEach(stat => {
                const div = document.createElement('div');
                div.className = 'diff-stat ' + stat.className;

                const valueSpan = document.createElement('span');
                valueSpan.className = 'diff-stat-value';
                valueSpan.textContent = stat.value;

                const labelSpan = document.createElement('span');
                labelSpan.className = 'diff-stat-label';
                labelSpan.textContent = stat.label;

                div.appendChild(valueSpan);
                div.appendChild(labelSpan);
                statsDiv.appendChild(div);
            });
        }

        // 渲染 Cookie 差异表格
        renderDiffTable('#diff-cookies-table', diff.cookies, diff.count);

        resultDiv.style.display = 'block';
    }

    /**
     * 渲染差异表格
     */
    function renderDiffTable(tableSelector, items, count) {
        const table = document.querySelector(tableSelector);
        if (!table) return;

        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        // 清空表格
        thead.textContent = '';
        tbody.textContent = '';

        // 生成表头
        const headerRow = document.createElement('tr');
        const nameHeader = document.createElement('th');
        nameHeader.textContent = '名称';
        headerRow.appendChild(nameHeader);

        for (let i = 1; i <= count; i++) {
            const th = document.createElement('th');
            th.textContent = 'Cookie ' + i;
            headerRow.appendChild(th);
        }

        const statusHeader = document.createElement('th');
        statusHeader.textContent = '状态';
        headerRow.appendChild(statusHeader);
        thead.appendChild(headerRow);

        // 生成表体
        if (items.length === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.setAttribute('colspan', count + 2);
            emptyCell.className = 'empty-cell';
            emptyCell.textContent = '无差异';
            emptyRow.appendChild(emptyCell);
            tbody.appendChild(emptyRow);
            return;
        }

        items.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'diff-row diff-row--' + item.status;

            const keyCell = document.createElement('td');
            keyCell.className = 'diff-key';
            keyCell.textContent = item.name;
            row.appendChild(keyCell);

            item.values.forEach(value => {
                const valueCell = document.createElement('td');
                valueCell.className = 'diff-value';
                if (value === null) {
                    valueCell.classList.add('diff-value--missing');
                    valueCell.textContent = '-';
                } else {
                    valueCell.textContent = truncate(value, 30);
                    valueCell.title = value;
                }
                row.appendChild(valueCell);
            });

            const statusLabels = {
                identical: '相同',
                different: '不同',
                partial: '部分'
            };
            const statusCell = document.createElement('td');
            statusCell.className = 'diff-status diff-status--' + item.status;
            statusCell.textContent = statusLabels[item.status];
            row.appendChild(statusCell);

            tbody.appendChild(row);
        });
    }

    /**
     * 复制差异为 JSON
     */
    function copyCookieDiffAsJson(mode) {
        const cookieStrings = compareInputs.map(input => getCompareEditorValue(input)).filter(v => v.trim());
        if (cookieStrings.length < 2) return;

        const diff = compareMultipleCookies(cookieStrings);
        let data;

        if (mode === 'diff') {
            // 只复制有差异的项
            data = diff.cookies
                .filter(item => item.status !== 'identical')
                .map(item => {
                    const obj = { name: item.name };
                    item.values.forEach((v, i) => {
                        obj['cookie' + (i + 1)] = v;
                    });
                    return obj;
                });
        } else {
            // 复制所有项
            data = diff.cookies.map(item => {
                const obj = { name: item.name, status: item.status };
                item.values.forEach((v, i) => {
                    obj['cookie' + (i + 1)] = v;
                });
                return obj;
            });
        }

        copyToClipboard(JSON.stringify(data, null, 2));
    }

    /**
     * 加载示例数据
     */
    async function loadCompareSampleData() {
        const samples = [
            'session_id=abc123; user_id=1001; theme=dark; language=zh-CN; _ga=GA1.2.123456',
            'session_id=xyz789; user_id=1001; theme=light; language=en-US; _ga=GA1.2.123456; new_feature=enabled'
        ];

        // 确保有足够的输入框
        while (compareInputs.length < samples.length) {
            await createCompareInput(compareInputs.length + 1);
        }

        samples.forEach((sample, index) => {
            if (compareInputs[index]) {
                setCompareEditorValue(compareInputs[index], sample);
            }
        });
    }

    // 功能选项卡切换
    document.addEventListener('click', (e) => {
        const tab = e.target.closest('.feature-tab');
        if (tab && isCookieParserToolActive()) {
            const feature = tab.dataset.feature;

            // 更新选项卡状态
            document.querySelectorAll('.feature-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // 切换功能区
            document.querySelectorAll('.feature-section').forEach(s => s.classList.remove('active'));
            const section = document.getElementById(feature + '-section');
            if (section) {
                section.classList.add('active');
            }

            // 初始化对比输入框
            if (feature === 'compare') {
                initCompareInputs();
            }
        }
    });

    // 对比功能事件处理
    document.addEventListener('click', async (e) => {
        if (!isCookieParserToolActive()) return;

        const target = e.target;

        // 添加对比输入框
        if (target.id === 'add-cookie-compare-btn' || target.closest('#add-cookie-compare-btn')) {
            await createCompareInput(compareInputs.length + 1);
        }

        // 移除对比输入框
        const removeBtn = target.closest('.compare-input-remove');
        if (removeBtn) {
            const card = removeBtn.closest('.compare-input-card');
            if (card) {
                const id = parseInt(card.dataset.id, 10);
                removeCompareInput(id);
            }
        }

        // 折叠/展开输入框
        const toggleBtn = target.closest('.compare-input-toggle');
        if (toggleBtn) {
            const card = toggleBtn.closest('.compare-input-card');
            if (card) {
                card.classList.toggle('collapsed');
            }
        }

        // 对比按钮
        if (target.id === 'cookie-compare-btn' || target.closest('#cookie-compare-btn')) {
            const cookieStrings = compareInputs.map(input => getCompareEditorValue(input)).filter(v => v.trim());

            if (cookieStrings.length < 2) {
                REOT.utils?.showNotification('请至少输入 2 个 Cookie 进行对比', 'warning');
                return;
            }

            const diff = compareMultipleCookies(cookieStrings);
            renderCompareResult(diff);
            collapseAllCompareInputs();

            REOT.utils?.showNotification('对比完成：' + diff.stats.different + ' 个不同，' + diff.stats.partial + ' 个部分存在', 'success');
        }

        // 示例按钮
        if (target.id === 'cookie-compare-sample-btn' || target.closest('#cookie-compare-sample-btn')) {
            await loadCompareSampleData();
        }

        // 清除按钮
        if (target.id === 'cookie-compare-clear-btn' || target.closest('#cookie-compare-clear-btn')) {
            clearAllCompareInputs();
        }

        // 复制差异 JSON
        const copyDiffBtn = target.closest('.copy-diff-btn');
        if (copyDiffBtn) {
            const mode = copyDiffBtn.dataset.mode;
            copyCookieDiffAsJson(mode);
        }

        // 点击复制 diff 表格单元格
        const diffKey = target.closest('.diff-key');
        if (diffKey) {
            copyToClipboard(diffKey.textContent);
        }

        const diffValue = target.closest('.diff-value:not(.diff-value--missing)');
        if (diffValue) {
            const fullValue = diffValue.title || diffValue.textContent;
            copyToClipboard(fullValue);
        }
    });

    // 导出工具函数
    window.CookieParserTool = {
        parse: parseCookieString,
        toString: cookiesToString,
        toJson: cookiesToJson,
        toJsonObject: cookiesToJsonObject,
        toNetscape: cookiesToNetscape,
        detectFormat: detectInputFormat
    };

    // 设置默认示例数据
    const defaultInput = document.getElementById('input');
    if (defaultInput && !defaultInput.value) {
        defaultInput.value = 'session_id=abc123xyz; user_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9; theme=dark; language=zh-CN; _ga=GA1.2.1234567890.1234567890; remember_me=true; last_visit=2024-01-01T12%3A00%3A00Z';
    }

})();
