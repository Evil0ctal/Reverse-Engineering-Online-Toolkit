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
     * 将 Cookie 数组转为 JSON 格式
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

        // 转为 JSON
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
                    outputLabel.textContent = REOT.i18n?.t('tools.cookie-parser.jsonOutput') || 'JSON 输出';
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

    // 导出工具函数
    window.CookieParserTool = {
        parse: parseCookieString,
        toString: cookiesToString,
        toJson: cookiesToJson,
        toNetscape: cookiesToNetscape,
        detectFormat: detectInputFormat
    };

    // 设置默认示例数据
    const defaultInput = document.getElementById('input');
    if (defaultInput && !defaultInput.value) {
        defaultInput.value = 'session_id=abc123xyz; user_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9; theme=dark; language=zh-CN; _ga=GA1.2.1234567890.1234567890; remember_me=true; last_visit=2024-01-01T12%3A00%3A00Z';
    }

})();
