/**
 * HTTP 头解析工具
 * @description 解析和格式化 HTTP 请求/响应头，支持多行格式和 JSON 格式互转
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    let inputFormat = 'text'; // 'text' | 'json' - 记录输入格式
    let parsedHeaders = null; // 缓存解析结果

    // 常见 HTTP 头部说明
    const HEADER_DESCRIPTIONS = {
        // 通用头
        'cache-control': '控制缓存行为',
        'connection': '连接管理',
        'date': '消息创建时间',
        'pragma': 'HTTP/1.0 缓存控制',
        'trailer': '报文尾部的头字段',
        'transfer-encoding': '传输编码方式',
        'upgrade': '协议升级',
        'via': '代理服务器信息',
        'warning': '警告信息',

        // 请求头
        'accept': '可接受的内容类型',
        'accept-charset': '可接受的字符集',
        'accept-encoding': '可接受的编码方式',
        'accept-language': '可接受的语言',
        'authorization': '认证信息',
        'cookie': 'Cookie 数据',
        'expect': '期望服务器行为',
        'from': '请求发起者邮箱',
        'host': '请求的主机名',
        'if-match': '条件请求（ETag 匹配）',
        'if-modified-since': '条件请求（修改时间）',
        'if-none-match': '条件请求（ETag 不匹配）',
        'if-range': '条件范围请求',
        'if-unmodified-since': '条件请求（未修改）',
        'max-forwards': '最大转发次数',
        'proxy-authorization': '代理认证信息',
        'range': '请求资源范围',
        'referer': '来源页面 URL',
        'te': '可接受的传输编码',
        'user-agent': '客户端标识',

        // 响应头
        'accept-ranges': '支持的范围请求类型',
        'age': '资源在代理缓存中的时间',
        'etag': '资源标识符',
        'location': '重定向目标 URL',
        'proxy-authenticate': '代理认证方式',
        'retry-after': '重试等待时间',
        'server': '服务器软件信息',
        'vary': '缓存变体依据',
        'www-authenticate': '认证方式',

        // 实体头
        'allow': '允许的 HTTP 方法',
        'content-encoding': '内容编码方式',
        'content-language': '内容语言',
        'content-length': '内容长度（字节）',
        'content-location': '内容的备用地址',
        'content-md5': '内容的 MD5 校验',
        'content-range': '部分内容的范围',
        'content-type': '内容的 MIME 类型',
        'expires': '资源过期时间',
        'last-modified': '资源最后修改时间',

        // 安全相关
        'strict-transport-security': 'HSTS 策略',
        'content-security-policy': '内容安全策略',
        'x-content-type-options': '禁止 MIME 嗅探',
        'x-frame-options': '点击劫持防护',
        'x-xss-protection': 'XSS 防护',
        'access-control-allow-origin': 'CORS 允许的源',
        'access-control-allow-methods': 'CORS 允许的方法',
        'access-control-allow-headers': 'CORS 允许的头',
        'access-control-expose-headers': 'CORS 暴露的头',
        'access-control-max-age': 'CORS 预检缓存时间',
        'access-control-allow-credentials': 'CORS 允许凭证',

        // 其他常见头
        'x-powered-by': '服务器技术栈',
        'x-request-id': '请求追踪 ID',
        'x-forwarded-for': '客户端原始 IP',
        'x-forwarded-proto': '原始协议',
        'x-forwarded-host': '原始主机',
        'x-real-ip': '真实客户端 IP',
        'set-cookie': '设置 Cookie'
    };

    // HTTP 方法列表
    const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT'];

    /**
     * 检测头部类型（请求或响应）
     */
    function detectHeaderType(input) {
        const firstLine = input.trim().split('\n')[0].trim();

        // 检查是否是请求（以 HTTP 方法开头）
        for (const method of HTTP_METHODS) {
            if (firstLine.startsWith(method + ' ')) {
                return 'request';
            }
        }

        // 检查是否是响应（以 HTTP/ 开头）
        if (firstLine.startsWith('HTTP/')) {
            return 'response';
        }

        // 无法确定，可能只是头部字段
        return 'headers-only';
    }

    /**
     * 检测输入格式（多行文本或 JSON）
     */
    function detectInputFormat(input) {
        const trimmed = input.trim();
        // 检查是否以 { 或 [ 开头（JSON 对象或数组）
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                JSON.parse(trimmed);
                return 'json';
            } catch (e) {
                // 解析失败，当作文本处理
            }
        }
        return 'text';
    }

    // 解析 JSON 格式的 Headers
    // 支持多种格式：
    // 1. 简单对象: {"Content-Type": "application/json", "Accept": "..."}
    // 2. 数组格式: [{"name": "Content-Type", "value": "application/json"}]
    // 3. Postman 导出格式: {"key": "Content-Type", "value": "application/json"}
    function parseJsonHeaders(jsonString) {
        const result = {
            type: 'headers-only',
            statusLine: null,
            headers: [],
            raw: jsonString
        };

        try {
            const parsed = JSON.parse(jsonString);

            if (Array.isArray(parsed)) {
                // 数组格式
                for (const item of parsed) {
                    if (typeof item !== 'object' || item === null) continue;

                    // 支持多种字段名
                    const name = item.name || item.Name || item.key || item.Key || item.header || '';
                    const value = item.value || item.Value || '';

                    if (!name) continue;

                    const nameLower = name.toLowerCase();
                    result.headers.push({
                        name: name,
                        value: String(value),
                        description: HEADER_DESCRIPTIONS[nameLower] || ''
                    });
                }
            } else if (typeof parsed === 'object') {
                // 简单对象格式 {"Header-Name": "value"}
                for (const [name, value] of Object.entries(parsed)) {
                    const nameLower = name.toLowerCase();
                    result.headers.push({
                        name: name,
                        value: String(value),
                        description: HEADER_DESCRIPTIONS[nameLower] || ''
                    });
                }
            }
        } catch (e) {
            console.error('Failed to parse JSON headers:', e);
        }

        return result;
    }

    /**
     * 将 Headers 转为 JSON 对象格式
     */
    function headersToJsonObject(parsed, pretty = true) {
        const obj = {};
        for (const header of parsed.headers) {
            obj[header.name] = header.value;
        }
        return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
    }

    /**
     * 将 Headers 转为 JSON 数组格式
     */
    function headersToJsonArray(parsed, pretty = true) {
        const arr = parsed.headers.map(h => ({
            name: h.name,
            value: h.value
        }));
        return pretty ? JSON.stringify(arr, null, 2) : JSON.stringify(arr);
    }

    /**
     * 将 Headers 转为多行文本格式
     */
    function headersToText(parsed, sorted = false) {
        let output = '';

        // 添加状态行
        if (parsed.statusLine) {
            if (parsed.type === 'request') {
                output += `${parsed.statusLine.method} ${parsed.statusLine.path} ${parsed.statusLine.version}\n`;
            } else if (parsed.type === 'response') {
                output += `${parsed.statusLine.version} ${parsed.statusLine.statusCode} ${parsed.statusLine.statusText}\n`;
            }
        }

        // 添加头部字段
        let headers = parsed.headers;
        if (sorted) {
            headers = [...parsed.headers].sort((a, b) =>
                a.name.toLowerCase().localeCompare(b.name.toLowerCase())
            );
        }

        for (const header of headers) {
            output += `${header.name}: ${header.value}\n`;
        }

        return output.trim();
    }

    /**
     * 解析 HTTP 头部（自动检测格式）
     */
    function parseHeaders(input) {
        if (!input.trim()) {
            throw new Error('输入为空');
        }

        // 检测输入格式
        inputFormat = detectInputFormat(input);

        if (inputFormat === 'json') {
            return parseJsonHeaders(input);
        }

        return parseTextHeaders(input);
    }

    /**
     * 解析多行文本格式的 HTTP 头部
     */
    function parseTextHeaders(input) {
        const lines = input.trim().split('\n');
        const result = {
            type: null,
            statusLine: null,
            headers: [],
            raw: input
        };

        if (lines.length === 0) {
            throw new Error('输入为空');
        }

        const headerType = document.getElementById('header-type')?.value || 'auto';
        let detectedType = headerType === 'auto' ? detectHeaderType(input) : headerType;
        result.type = detectedType;

        let startIndex = 0;
        const firstLine = lines[0].trim();

        // 解析状态行
        if (detectedType === 'request') {
            const match = firstLine.match(/^(\w+)\s+(\S+)\s+(HTTP\/[\d.]+)$/);
            if (match) {
                result.statusLine = {
                    method: match[1],
                    path: match[2],
                    version: match[3]
                };
                startIndex = 1;
            }
        } else if (detectedType === 'response') {
            const match = firstLine.match(/^(HTTP\/[\d.]+)\s+(\d+)\s*(.*)$/);
            if (match) {
                result.statusLine = {
                    version: match[1],
                    statusCode: parseInt(match[2]),
                    statusText: match[3] || ''
                };
                startIndex = 1;
            }
        }

        // 解析头部字段
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // 跳过空行

            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) continue;

            const name = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            const nameLower = name.toLowerCase();

            result.headers.push({
                name: name,
                value: value,
                description: HEADER_DESCRIPTIONS[nameLower] || ''
            });
        }

        return result;
    }

    /**
     * 格式化头部输出
     */
    function formatHeaders(parsed) {
        let output = '';

        // 添加状态行
        if (parsed.statusLine) {
            if (parsed.type === 'request') {
                output += `${parsed.statusLine.method} ${parsed.statusLine.path} ${parsed.statusLine.version}\n`;
            } else if (parsed.type === 'response') {
                output += `${parsed.statusLine.version} ${parsed.statusLine.statusCode} ${parsed.statusLine.statusText}\n`;
            }
        }

        // 添加头部字段（按字母排序）
        const sortedHeaders = [...parsed.headers].sort((a, b) =>
            a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );

        for (const header of sortedHeaders) {
            output += `${header.name}: ${header.value}\n`;
        }

        return output.trim();
    }

    /**
     * 渲染解析结果
     */
    function renderResult(parsed) {
        const resultSection = document.getElementById('result-section');
        const statusLineSection = document.getElementById('status-line-section');
        const statusLineInfo = document.getElementById('status-line-info');
        const headersTbody = document.getElementById('headers-tbody');
        const statsGrid = document.getElementById('stats-grid');
        const output = document.getElementById('output');

        if (!resultSection) return;

        // 显示结果区域
        resultSection.style.display = 'block';

        // 渲染状态行
        if (parsed.statusLine) {
            statusLineSection.style.display = 'block';
            if (parsed.type === 'request') {
                statusLineInfo.innerHTML = `
                    <div class="status-item">
                        <span class="label">方法</span>
                        <span class="value method-${parsed.statusLine.method.toLowerCase()}">${parsed.statusLine.method}</span>
                    </div>
                    <div class="status-item">
                        <span class="label">路径</span>
                        <span class="value">${escapeHtml(parsed.statusLine.path)}</span>
                    </div>
                    <div class="status-item">
                        <span class="label">版本</span>
                        <span class="value">${parsed.statusLine.version}</span>
                    </div>
                `;
            } else {
                const statusClass = getStatusClass(parsed.statusLine.statusCode);
                statusLineInfo.innerHTML = `
                    <div class="status-item">
                        <span class="label">版本</span>
                        <span class="value">${parsed.statusLine.version}</span>
                    </div>
                    <div class="status-item">
                        <span class="label">状态码</span>
                        <span class="value status-code ${statusClass}">${parsed.statusLine.statusCode}</span>
                    </div>
                    <div class="status-item">
                        <span class="label">状态文本</span>
                        <span class="value">${escapeHtml(parsed.statusLine.statusText)}</span>
                    </div>
                `;
            }
        } else {
            statusLineSection.style.display = 'none';
        }

        // 渲染头部表格
        headersTbody.innerHTML = parsed.headers.map(header => `
            <tr>
                <td class="header-name">${escapeHtml(header.name)}</td>
                <td class="header-value">${escapeHtml(header.value)}</td>
                <td class="header-desc">${escapeHtml(header.description)}</td>
            </tr>
        `).join('');

        // 渲染统计信息
        const stats = calculateStats(parsed);
        statsGrid.innerHTML = `
            <div class="stat-item">
                <span class="stat-value">${stats.headerCount}</span>
                <span class="stat-label">头部字段数</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${stats.totalSize}</span>
                <span class="stat-label">总大小</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${stats.type}</span>
                <span class="stat-label">类型</span>
            </div>
        `;

        // 更新输出
        if (output) {
            output.value = formatHeaders(parsed);
        }
    }

    /**
     * 计算统计信息
     */
    function calculateStats(parsed) {
        const totalBytes = parsed.raw.length;
        const typeMap = {
            'request': '请求',
            'response': '响应',
            'headers-only': '头部'
        };

        return {
            headerCount: parsed.headers.length,
            totalSize: formatSize(totalBytes),
            type: typeMap[parsed.type] || '未知'
        };
    }

    /**
     * 获取状态码样式类
     */
    function getStatusClass(code) {
        if (code >= 200 && code < 300) return 'status-2xx';
        if (code >= 300 && code < 400) return 'status-3xx';
        if (code >= 400 && code < 500) return 'status-4xx';
        if (code >= 500) return 'status-5xx';
        return 'status-1xx';
    }

    /**
     * 格式化大小
     */
    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        return (bytes / 1024).toFixed(2) + ' KB';
    }

    /**
     * HTML 转义
     */
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
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
     * 示例请求头
     */
    const SAMPLE_REQUEST = `GET /api/users?page=1&limit=10 HTTP/1.1
Host: api.example.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Accept: application/json, text/plain, */*
Accept-Language: zh-CN,zh;q=0.9,en;q=0.8
Accept-Encoding: gzip, deflate, br
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Cookie: session_id=abc123; user_pref=dark_mode
Cache-Control: no-cache
Connection: keep-alive
Referer: https://example.com/dashboard
X-Request-ID: req-12345-67890`;

    /**
     * 示例响应头
     */
    const SAMPLE_RESPONSE = `HTTP/1.1 200 OK
Date: Mon, 06 Jan 2025 12:00:00 GMT
Server: nginx/1.24.0
Content-Type: application/json; charset=utf-8
Content-Length: 1234
Content-Encoding: gzip
Cache-Control: max-age=3600, public
ETag: "abc123def456"
X-Request-ID: req-12345-67890
X-Response-Time: 45ms
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Set-Cookie: session_id=xyz789; Path=/; HttpOnly; Secure; SameSite=Strict`;

    // 检查当前是否在 HTTP 头解析工具页面
    function isHttpHeadersToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/network/http-headers');
    }

    // 事件委托处理器
    document.addEventListener('click', (e) => {
        // 只在 HTTP 头解析工具页面处理事件
        if (!isHttpHeadersToolActive()) return;

        const target = e.target;

        // 解析按钮
        if (target.id === 'parse-btn' || target.closest('#parse-btn')) {
            const input = document.getElementById('input');
            if (!input.value.trim()) {
                REOT.utils?.showNotification('请输入 HTTP 头部内容', 'warning');
                return;
            }

            try {
                parsedHeaders = parseHeaders(input.value);
                renderResult(parsedHeaders);
                const formatMsg = inputFormat === 'json' ? '(JSON 格式)' : '(多行格式)';
                REOT.utils?.showNotification(`解析成功 ${formatMsg}`, 'success');
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
            }
        }

        // 转为 JSON（对象格式）
        if (target.id === 'to-json-btn' || target.closest('#to-json-btn')) {
            const input = document.getElementById('input');
            const output = document.getElementById('output');

            if (!input.value.trim()) {
                REOT.utils?.showNotification('请输入 HTTP 头部内容', 'warning');
                return;
            }

            try {
                if (!parsedHeaders) {
                    parsedHeaders = parseHeaders(input.value);
                }
                const json = headersToJsonObject(parsedHeaders);
                if (output) {
                    output.value = json;
                }
                REOT.utils?.showNotification('已转换为 JSON 对象格式', 'success');
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
            }
        }

        // 转为 JSON（数组格式）
        if (target.id === 'to-json-array-btn' || target.closest('#to-json-array-btn')) {
            const input = document.getElementById('input');
            const output = document.getElementById('output');

            if (!input.value.trim()) {
                REOT.utils?.showNotification('请输入 HTTP 头部内容', 'warning');
                return;
            }

            try {
                if (!parsedHeaders) {
                    parsedHeaders = parseHeaders(input.value);
                }
                const json = headersToJsonArray(parsedHeaders);
                if (output) {
                    output.value = json;
                }
                REOT.utils?.showNotification('已转换为 JSON 数组格式', 'success');
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
            }
        }

        // 转为多行文本
        if (target.id === 'to-text-btn' || target.closest('#to-text-btn')) {
            const input = document.getElementById('input');
            const output = document.getElementById('output');

            if (!input.value.trim()) {
                REOT.utils?.showNotification('请输入 HTTP 头部内容', 'warning');
                return;
            }

            try {
                if (!parsedHeaders) {
                    parsedHeaders = parseHeaders(input.value);
                }
                const text = headersToText(parsedHeaders, false);
                if (output) {
                    output.value = text;
                }
                REOT.utils?.showNotification('已转换为多行文本格式', 'success');
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
            }
        }

        // 格式化按钮
        if (target.id === 'format-btn' || target.closest('#format-btn')) {
            const input = document.getElementById('input');
            const output = document.getElementById('output');
            if (!input.value.trim()) {
                REOT.utils?.showNotification('请输入 HTTP 头部内容', 'warning');
                return;
            }

            try {
                const parsed = parseHeaders(input.value);
                const formatted = formatHeaders(parsed);
                if (output) {
                    output.value = formatted;
                }
                REOT.utils?.showNotification('格式化成功', 'success');
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
            }
        }

        // 清除按钮
        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            const input = document.getElementById('input');
            const output = document.getElementById('output');
            const resultSection = document.getElementById('result-section');

            if (input) input.value = '';
            if (output) output.value = '';
            if (resultSection) resultSection.style.display = 'none';
            parsedHeaders = null;
        }

        // 复制按钮
        if (target.id === 'copy-btn' || target.closest('#copy-btn')) {
            const output = document.getElementById('output');
            if (output && output.value) {
                copyToClipboard(output.value);
            }
        }

        // 示例请求按钮
        if (target.id === 'sample-request-btn' || target.closest('#sample-request-btn')) {
            const input = document.getElementById('input');
            if (input) {
                input.value = SAMPLE_REQUEST;
                parsedHeaders = null;
                REOT.utils?.showNotification('已加载示例请求', 'success');
            }
        }

        // 示例响应按钮
        if (target.id === 'sample-response-btn' || target.closest('#sample-response-btn')) {
            const input = document.getElementById('input');
            if (input) {
                input.value = SAMPLE_RESPONSE;
                parsedHeaders = null;
                REOT.utils?.showNotification('已加载示例响应', 'success');
            }
        }
    });

    // 导出工具函数
    window.HttpHeadersTool = {
        parse: parseHeaders,
        format: formatHeaders,
        detectType: detectHeaderType,
        detectFormat: detectInputFormat,
        toJsonObject: headersToJsonObject,
        toJsonArray: headersToJsonArray,
        toText: headersToText
    };

    // 设置默认示例数据
    const defaultInput = document.getElementById('input');
    if (defaultInput && !defaultInput.value) {
        defaultInput.value = SAMPLE_REQUEST;
    }

})();
