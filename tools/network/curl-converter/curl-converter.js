/**
 * cURL 解析器工具
 * @description 解析、对比、编辑 cURL 命令并转换为多种编程语言代码
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // 当前解析结果
    let currentParsed = null;

    // CodeMirror 编辑器实例
    let inputEditor = null;
    let compareEditor1 = null;
    let compareEditor2 = null;
    let genInputEditor = null;
    let codeOutputEditor = null;
    let exportedCurlEditor = null;
    let editorsInitialized = false;

    // 代码生成器模块加载状态
    let generatorsLoaded = false;
    let generatorsLoading = null;

    /**
     * 动态加载代码生成器模块
     */
    async function loadGeneratorModules() {
        // 检查生成器是否已通过 HTML script 标签加载
        if (window.CurlGenerators && window.CurlGenerators.generateCode) {
            generatorsLoaded = true;
            return true;
        }
        if (generatorsLoaded) return true;
        if (generatorsLoading) return generatorsLoading;

        generatorsLoading = (async () => {
            // 检测基础路径
            const scripts = document.querySelectorAll('script[src*="curl-converter.js"]');
            let basePath = '';
            if (scripts.length > 0) {
                const src = scripts[0].src;
                basePath = src.substring(0, src.lastIndexOf('/') + 1);
            } else {
                // 备用路径检测
                basePath = '/tools/network/curl-converter/';
                if (window.REOT?.router?.basePath) {
                    basePath = window.REOT.router.basePath + basePath;
                }
            }

            const generatorFiles = [
                'generators/base.js',
                'generators/python.js',
                'generators/javascript.js',
                'generators/php.js',
                'generators/go.js',
                'generators/java.js',
                'generators/csharp.js',
                'generators/rust.js',
                'generators/ruby.js',
                'generators/swift.js',
                'generators/kotlin.js',
                'generators/index.js'
            ];

            // 按顺序加载脚本（base.js 必须先加载）
            for (const file of generatorFiles) {
                await loadScript(basePath + file);
            }

            generatorsLoaded = true;
            console.log('cURL Generators modules loaded');
            return true;
        })();

        return generatorsLoading;
    }

    /**
     * 加载单个脚本
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            // 检查是否已加载
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load: ${src}`));
            document.head.appendChild(script);
        });
    }

    // 获取编辑器值的辅助函数
    function getEditorValue(editor, fallbackId) {
        if (editor) {
            return editor.getValue();
        }
        const el = document.getElementById(fallbackId);
        if (!el) return '';
        if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
            return el.value || '';
        }
        return el.textContent || '';
    }

    // 设置编辑器值的辅助函数
    function setEditorValue(editor, fallbackId, value) {
        if (editor) {
            editor.setValue(value);
        }
        const el = document.getElementById(fallbackId);
        if (el) {
            if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
                el.value = value;
            } else {
                el.textContent = value;
            }
        }
    }

    // ==================== 常量定义 ====================

    // 常见 HTTP 请求头说明
    const HEADER_DESCRIPTIONS = {
        'accept': { tag: '内容协商', desc: '指定客户端能够接收的内容类型' },
        'accept-encoding': { tag: '压缩', desc: '指定客户端支持的压缩编码' },
        'accept-language': { tag: '国际化', desc: '指定客户端偏好的语言' },
        'authorization': { tag: '认证', desc: '包含用于验证用户身份的凭据' },
        'cache-control': { tag: '缓存', desc: '指定请求/响应的缓存机制' },
        'content-type': { tag: '内容类型', desc: '指定请求体的 MIME 类型' },
        'content-length': { tag: '内容长度', desc: '请求体的字节长度' },
        'cookie': { tag: 'Cookie', desc: '发送存储的 Cookie 到服务器' },
        'host': { tag: '主机', desc: '指定请求的目标主机和端口' },
        'origin': { tag: '跨域', desc: '标识请求的来源，用于 CORS' },
        'referer': { tag: '来源', desc: '标识请求的来源页面 URL' },
        'user-agent': { tag: '客户端', desc: '标识发起请求的客户端信息' },
        'x-requested-with': { tag: 'AJAX', desc: '标识 AJAX 请求，常用值为 XMLHttpRequest' },
        'x-csrf-token': { tag: '安全', desc: 'CSRF 防护令牌' },
        'x-xsrf-token': { tag: '安全', desc: 'XSRF 防护令牌' },
        'sec-ch-ua': { tag: '客户端提示', desc: '浏览器品牌和版本信息' },
        'sec-ch-ua-mobile': { tag: '客户端提示', desc: '是否为移动设备' },
        'sec-ch-ua-platform': { tag: '客户端提示', desc: '操作系统平台' },
        'sec-fetch-dest': { tag: '安全', desc: '请求的目标类型' },
        'sec-fetch-mode': { tag: '安全', desc: '请求的模式' },
        'sec-fetch-site': { tag: '安全', desc: '请求与资源的关系' },
        'if-none-match': { tag: '缓存', desc: '条件请求，比较 ETag' },
        'if-modified-since': { tag: '缓存', desc: '条件请求，比较修改时间' },
        'pragma': { tag: '缓存', desc: 'HTTP/1.0 缓存控制' },
        'connection': { tag: '连接', desc: '控制网络连接的状态' },
        'upgrade-insecure-requests': { tag: '安全', desc: '请求升级到 HTTPS' },
        'dnt': { tag: '隐私', desc: 'Do Not Track 请求' },
        'x-forwarded-for': { tag: '代理', desc: '标识客户端原始 IP' },
        'x-real-ip': { tag: '代理', desc: '客户端真实 IP' },
        'x-api-key': { tag: '认证', desc: 'API 密钥' },
        'x-auth-token': { tag: '认证', desc: '认证令牌' }
    };

    // 常见查询参数说明
    const PARAM_HINTS = {
        'page': '分页 - 当前页码',
        'pagenum': '分页 - 当前页码',
        'pagesize': '分页 - 每页数量',
        'limit': '分页 - 返回数量限制',
        'offset': '分页 - 数据偏移量',
        'cursor': '分页 - 游标位置',
        'sort': '排序字段',
        'order': '排序方向 (asc/desc)',
        'orderby': '排序字段',
        'q': '搜索关键词',
        'query': '搜索关键词',
        'search': '搜索关键词',
        'keyword': '搜索关键词',
        'filter': '过滤条件',
        'id': '资源唯一标识符',
        'uid': '用户 ID',
        'userid': '用户 ID',
        'token': '认证令牌',
        'access_token': 'OAuth 访问令牌',
        'refresh_token': 'OAuth 刷新令牌',
        'timestamp': '时间戳',
        't': '时间戳',
        'ts': '时间戳',
        '_': '缓存破坏参数',
        'callback': 'JSONP 回调函数名',
        'format': '响应格式 (json/xml)',
        'lang': '语言代码',
        'locale': '语言区域设置',
        'version': 'API 版本',
        'v': 'API 版本',
        'sign': '签名参数',
        'signature': '签名参数',
        'nonce': '随机数/防重放'
    };

    // ==================== cURL 解析器 ====================

    /**
     * 解析 cURL 命令
     * @param {string} curlCommand - cURL 命令字符串
     * @returns {Object} 解析结果
     */
    function parseCurl(curlCommand) {
        const result = {
            method: 'GET',
            url: '',
            urlParts: null,
            headers: {},
            cookies: {},
            data: null,
            dataType: null,
            auth: null,
            insecure: false,
            followRedirects: false,
            compressed: false,
            queryParams: {},
            bodyParams: {}
        };

        // 预处理命令
        let cmd = curlCommand
            .replace(/\\\r?\n/g, ' ')  // 处理续行符
            .replace(/\s+/g, ' ')
            .trim();

        // 移除 curl 命令本身
        cmd = cmd.replace(/^curl\s+/i, '');

        // 分词解析
        const tokens = tokenize(cmd);

        // 解析参数
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (token === '-X' || token === '--request') {
                result.method = (tokens[++i] || 'GET').toUpperCase();
            } else if (token === '-H' || token === '--header') {
                const header = tokens[++i] || '';
                const colonIndex = header.indexOf(':');
                if (colonIndex > 0) {
                    const name = header.slice(0, colonIndex).trim();
                    const value = header.slice(colonIndex + 1).trim();
                    result.headers[name] = value;

                    // 提取 Cookie
                    if (name.toLowerCase() === 'cookie') {
                        result.cookies = parseCookies(value);
                    }
                }
            } else if (token === '-d' || token === '--data' || token === '--data-raw' || token === '--data-binary' || token === '--data-urlencode') {
                result.data = tokens[++i] || '';
                if (result.method === 'GET') {
                    result.method = 'POST';
                }
            } else if (token === '-F' || token === '--form') {
                if (!result.formData) result.formData = [];
                result.formData.push(tokens[++i] || '');
                result.dataType = 'multipart';
                if (result.method === 'GET') {
                    result.method = 'POST';
                }
            } else if (token === '-u' || token === '--user') {
                result.auth = tokens[++i] || '';
            } else if (token === '-k' || token === '--insecure') {
                result.insecure = true;
            } else if (token === '-L' || token === '--location') {
                result.followRedirects = true;
            } else if (token === '--compressed') {
                result.compressed = true;
            } else if (token === '-b' || token === '--cookie') {
                const cookieStr = tokens[++i] || '';
                Object.assign(result.cookies, parseCookies(cookieStr));
            } else if (!token.startsWith('-') && !result.url) {
                result.url = token;
            }
        }

        // 解析 URL
        if (result.url) {
            result.urlParts = parseUrl(result.url);
            result.queryParams = result.urlParts.queryParams;
        }

        // 解析请求体
        if (result.data) {
            const bodyResult = parseBody(result.data, result.headers['Content-Type'] || result.headers['content-type']);
            result.dataType = bodyResult.type;
            result.bodyParams = bodyResult.params;
        }

        return result;
    }

    /**
     * 分词解析
     */
    function tokenize(cmd) {
        const tokens = [];
        let current = '';
        let inQuote = false;
        let quoteChar = '';

        for (let i = 0; i < cmd.length; i++) {
            const char = cmd[i];

            if (char === '\\' && i + 1 < cmd.length) {
                const nextChar = cmd[i + 1];
                if (inQuote) {
                    // 在引号内，保留反斜杠和被转义的字符
                    if (nextChar === quoteChar || nextChar === '\\') {
                        // 转义引号或反斜杠：只添加被转义的字符
                        current += nextChar;
                        i++;
                    } else {
                        // 其他情况（如 JSON 内的 \"），保留整个转义序列
                        current += char + nextChar;
                        i++;
                    }
                } else {
                    // 在引号外，处理转义
                    current += nextChar;
                    i++;
                }
                continue;
            }

            if ((char === '"' || char === "'")) {
                if (!inQuote) {
                    inQuote = true;
                    quoteChar = char;
                } else if (char === quoteChar) {
                    inQuote = false;
                } else {
                    current += char;
                }
            } else if (char === ' ' && !inQuote) {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }

        if (current) {
            tokens.push(current);
        }

        return tokens;
    }

    /**
     * 解析 URL
     */
    function parseUrl(url) {
        try {
            const urlObj = new URL(url);
            const queryParams = {};

            urlObj.searchParams.forEach((value, key) => {
                if (queryParams[key]) {
                    if (Array.isArray(queryParams[key])) {
                        queryParams[key].push(value);
                    } else {
                        queryParams[key] = [queryParams[key], value];
                    }
                } else {
                    queryParams[key] = value;
                }
            });

            return {
                protocol: urlObj.protocol,
                host: urlObj.host,
                hostname: urlObj.hostname,
                port: urlObj.port,
                pathname: urlObj.pathname,
                search: urlObj.search,
                hash: urlObj.hash,
                queryParams: queryParams,
                baseUrl: `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`
            };
        } catch (e) {
            return {
                protocol: '',
                host: '',
                hostname: '',
                port: '',
                pathname: url,
                search: '',
                hash: '',
                queryParams: {},
                baseUrl: url
            };
        }
    }

    /**
     * 解析 Cookie 字符串
     */
    function parseCookies(cookieStr) {
        const cookies = {};
        if (!cookieStr) return cookies;

        cookieStr.split(';').forEach(pair => {
            const [key, ...valueParts] = pair.trim().split('=');
            if (key) {
                cookies[key.trim()] = valueParts.join('=').trim();
            }
        });

        return cookies;
    }

    /**
     * 解析请求体
     */
    function parseBody(data, contentType) {
        const result = { type: 'raw', params: {} };

        if (!data) return result;

        // 尝试解析 JSON
        try {
            const json = JSON.parse(data);
            result.type = 'json';
            result.params = flattenObject(json);
            return result;
        } catch (e) {}

        // 尝试解析 form-urlencoded
        if (!contentType || contentType.includes('application/x-www-form-urlencoded')) {
            try {
                const params = new URLSearchParams(data);
                const parsed = {};
                params.forEach((value, key) => {
                    parsed[key] = value;
                });
                if (Object.keys(parsed).length > 0) {
                    result.type = 'form';
                    result.params = parsed;
                    return result;
                }
            } catch (e) {}
        }

        return result;
    }

    /**
     * 扁平化对象（支持数组和嵌套结构）
     */
    function flattenObject(obj, prefix = '', result = {}) {
        if (obj === null || obj === undefined) {
            return result;
        }

        // 处理数组
        if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                const newKey = prefix ? `${prefix}[${index}]` : `[${index}]`;
                if (typeof item === 'object' && item !== null) {
                    flattenObject(item, newKey, result);
                } else {
                    result[newKey] = item;
                }
            });
            return result;
        }

        // 处理对象
        for (const key in obj) {
            if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

            const value = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;

            if (typeof value === 'object' && value !== null) {
                if (Array.isArray(value)) {
                    // 数组递归处理
                    value.forEach((item, index) => {
                        const arrayKey = `${newKey}[${index}]`;
                        if (typeof item === 'object' && item !== null) {
                            flattenObject(item, arrayKey, result);
                        } else {
                            result[arrayKey] = item;
                        }
                    });
                } else {
                    // 对象递归处理
                    flattenObject(value, newKey, result);
                }
            } else {
                result[newKey] = value;
            }
        }
        return result;
    }

    // ==================== 数据类型推断 ====================

    /**
     * 推断值的数据类型
     */
    function inferDataType(value) {
        if (value === null || value === undefined) return 'null';
        if (value === 'true' || value === 'false') return 'boolean';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';

        const strValue = String(value);

        // UUID
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(strValue)) {
            return 'uuid';
        }

        // 时间戳 (秒或毫秒)
        if (/^\d{10}$/.test(strValue) || /^\d{13}$/.test(strValue)) {
            const ts = parseInt(strValue);
            const date = new Date(strValue.length === 10 ? ts * 1000 : ts);
            if (date.getFullYear() >= 2000 && date.getFullYear() <= 2100) {
                return 'timestamp';
            }
        }

        // 数字
        if (/^-?\d+(\.\d+)?$/.test(strValue)) {
            return 'number';
        }

        // Base64
        if (/^[A-Za-z0-9+/]+=*$/.test(strValue) && strValue.length > 20 && strValue.length % 4 === 0) {
            try {
                atob(strValue);
                return 'base64';
            } catch (e) {}
        }

        // URL
        if (/^https?:\/\//.test(strValue)) {
            return 'url';
        }

        // JSON 字符串
        if ((strValue.startsWith('{') && strValue.endsWith('}')) ||
            (strValue.startsWith('[') && strValue.endsWith(']'))) {
            try {
                JSON.parse(strValue);
                return 'json';
            } catch (e) {}
        }

        return 'string';
    }

    /**
     * 获取参数提示
     */
    function getParamHint(paramName) {
        const lowerName = paramName.toLowerCase();
        for (const [key, hint] of Object.entries(PARAM_HINTS)) {
            if (lowerName === key || lowerName.includes(key)) {
                return hint;
            }
        }
        return '';
    }

    // ==================== 渲染函数 ====================

    /**
     * 渲染解析结果
     */
    function renderParseResult(parsed) {
        currentParsed = parsed;

        const result = document.getElementById('parse-result');
        result.style.display = 'block';

        // 概览
        document.getElementById('overview-method').textContent = parsed.method;
        document.getElementById('overview-method').className = `overview-value method-badge ${parsed.method}`;
        document.getElementById('overview-url').textContent = parsed.url || '-';
        document.getElementById('overview-host').textContent = parsed.urlParts?.host || '-';
        document.getElementById('overview-path').textContent = parsed.urlParts?.pathname || '-';

        // 查询参数
        renderQueryParams(parsed.queryParams);

        // 请求头
        renderHeaders(parsed.headers);

        // 请求体
        renderBody(parsed);

        // Cookies
        renderCookies(parsed.cookies);

        // 生成导出的 cURL
        renderExportedCurl(parsed);
    }

    /**
     * 渲染查询参数表格
     */
    function renderQueryParams(params) {
        const tbody = document.querySelector('#query-table tbody');
        const empty = document.getElementById('query-empty');
        const table = document.getElementById('query-table');

        tbody.innerHTML = '';

        const keys = Object.keys(params);
        if (keys.length === 0) {
            table.style.display = 'none';
            empty.style.display = 'block';
            return;
        }

        table.style.display = '';
        empty.style.display = 'none';

        keys.forEach(key => {
            const value = params[key];
            const type = inferDataType(value);
            const hint = getParamHint(key);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="param-name clickable-cell" data-copy="${escapeHtml(key)}">${escapeHtml(key)}</td>
                <td class="param-value clickable-cell" data-copy="${escapeHtml(String(value))}">${escapeHtml(String(value))}</td>
                <td class="param-type"><span class="type-badge ${type}">${type}</span></td>
                <td class="param-desc">${escapeHtml(hint)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    /**
     * 渲染请求头表格
     */
    function renderHeaders(headers) {
        const tbody = document.querySelector('#headers-table tbody');
        const empty = document.getElementById('headers-empty');
        const table = document.getElementById('headers-table');

        tbody.innerHTML = '';

        const keys = Object.keys(headers);
        if (keys.length === 0) {
            table.style.display = 'none';
            empty.style.display = 'block';
            return;
        }

        table.style.display = '';
        empty.style.display = 'none';

        keys.forEach(key => {
            const value = headers[key];
            const lowerKey = key.toLowerCase();
            const info = HEADER_DESCRIPTIONS[lowerKey] || { tag: '', desc: '' };

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="param-name clickable-cell" data-copy="${escapeHtml(key)}">${escapeHtml(key)}</td>
                <td class="param-value clickable-cell" data-copy="${escapeHtml(value)}">${escapeHtml(value)}</td>
                <td class="header-function">
                    ${info.tag ? `<span class="function-tag">${info.tag}</span>` : ''}
                    ${escapeHtml(info.desc)}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    /**
     * 渲染请求体
     */
    function renderBody(parsed) {
        const tbody = document.querySelector('#body-table tbody');
        const empty = document.getElementById('body-empty');
        const table = document.getElementById('body-table').parentElement;
        const raw = document.getElementById('body-raw');

        tbody.innerHTML = '';

        if (!parsed.data) {
            table.style.display = 'none';
            raw.style.display = 'none';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';

        if (parsed.dataType === 'json' || parsed.dataType === 'form') {
            table.style.display = '';
            raw.style.display = 'none';

            const params = parsed.bodyParams;
            Object.keys(params).forEach(key => {
                const value = params[key];
                const type = inferDataType(value);

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="param-name clickable-cell" data-copy="${escapeHtml(key)}">${escapeHtml(key)}</td>
                    <td class="param-value clickable-cell" data-copy="${escapeHtml(String(value))}">${escapeHtml(String(value))}</td>
                    <td class="param-type"><span class="type-badge ${type}">${type}</span></td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            table.style.display = 'none';
            raw.style.display = 'block';

            // 尝试格式化 JSON
            try {
                const json = JSON.parse(parsed.data);
                raw.textContent = JSON.stringify(json, null, 2);
            } catch (e) {
                raw.textContent = parsed.data;
            }
        }
    }

    /**
     * 渲染 Cookies
     */
    function renderCookies(cookies) {
        const tbody = document.querySelector('#cookies-table tbody');
        const empty = document.getElementById('cookies-empty');
        const table = document.getElementById('cookies-table');

        tbody.innerHTML = '';

        const keys = Object.keys(cookies);
        if (keys.length === 0) {
            table.style.display = 'none';
            empty.style.display = 'block';
            return;
        }

        table.style.display = '';
        empty.style.display = 'none';

        keys.forEach(key => {
            const value = cookies[key];
            const type = inferDataType(value);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="param-name clickable-cell" data-copy="${escapeHtml(key)}">${escapeHtml(key)}</td>
                <td class="param-value clickable-cell" data-copy="${escapeHtml(value)}">${escapeHtml(value)}</td>
                <td class="param-type"><span class="type-badge ${type}">${type}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    /**
     * 渲染导出的 cURL
     */
    function renderExportedCurl(parsed) {
        const curl = generateCurlCommand(parsed);
        setEditorValue(exportedCurlEditor, 'exported-curl', curl);
    }

    /**
     * 生成 cURL 命令
     */
    function generateCurlCommand(parsed) {
        let cmd = 'curl';

        // URL
        cmd += ` '${parsed.url}'`;

        // Method
        if (parsed.method !== 'GET') {
            cmd += ` \\\n  -X ${parsed.method}`;
        }

        // Headers
        for (const [key, value] of Object.entries(parsed.headers)) {
            cmd += ` \\\n  -H '${key}: ${value}'`;
        }

        // Data
        if (parsed.data) {
            const escapedData = parsed.data.replace(/'/g, "'\\''");
            cmd += ` \\\n  --data-raw '${escapedData}'`;
        }

        // Options
        if (parsed.insecure) cmd += ' \\\n  -k';
        if (parsed.followRedirects) cmd += ' \\\n  -L';
        if (parsed.compressed) cmd += ' \\\n  --compressed';

        return cmd;
    }

    // ==================== 对比功能 ====================

    /**
     * 对比两个 cURL 命令
     */
    function compareCurls(curl1, curl2) {
        const parsed1 = parseCurl(curl1);
        const parsed2 = parseCurl(curl2);

        const diff = {
            url: compareValues(parsed1.url, parsed2.url),
            method: compareValues(parsed1.method, parsed2.method),
            query: compareObjects(parsed1.queryParams, parsed2.queryParams),
            headers: compareObjects(parsed1.headers, parsed2.headers),
            body: compareObjects(parsed1.bodyParams, parsed2.bodyParams),
            stats: { added: 0, removed: 0, changed: 0, same: 0 }
        };

        // 统计
        [diff.query, diff.headers, diff.body].forEach(section => {
            section.forEach(item => {
                diff.stats[item.status]++;
            });
        });

        return diff;
    }

    /**
     * 比较两个值
     */
    function compareValues(val1, val2) {
        if (val1 === val2) return { status: 'same', val1, val2 };
        if (!val1) return { status: 'added', val1, val2 };
        if (!val2) return { status: 'removed', val1, val2 };
        return { status: 'changed', val1, val2 };
    }

    /**
     * 将值转换为可比较的字符串
     */
    function valueToString(val) {
        if (val === null) return 'null';
        if (val === undefined) return '';
        if (typeof val === 'object') {
            try {
                return JSON.stringify(val);
            } catch (e) {
                return String(val);
            }
        }
        return String(val);
    }

    /**
     * 比较两个值是否相等
     */
    function valuesEqual(val1, val2) {
        if (val1 === val2) return true;
        if (val1 === undefined || val2 === undefined) return false;
        if (val1 === null || val2 === null) return val1 === val2;

        // 对于复杂类型，使用 JSON.stringify 比较
        if (typeof val1 === 'object' || typeof val2 === 'object') {
            try {
                return JSON.stringify(val1) === JSON.stringify(val2);
            } catch (e) {
                return false;
            }
        }

        return String(val1) === String(val2);
    }

    /**
     * 比较两个对象
     */
    function compareObjects(obj1, obj2) {
        const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
        const results = [];

        allKeys.forEach(key => {
            const val1 = obj1?.[key];
            const val2 = obj2?.[key];

            let status;
            if (valuesEqual(val1, val2)) {
                status = 'same';
            } else if (val1 === undefined) {
                status = 'added';
            } else if (val2 === undefined) {
                status = 'removed';
            } else {
                status = 'changed';
            }

            results.push({ key, val1: val1 ?? '', val2: val2 ?? '', status });
        });

        // 排序：changed > added > removed > same
        const order = { changed: 0, added: 1, removed: 2, same: 3 };
        results.sort((a, b) => order[a.status] - order[b.status]);

        return results;
    }

    /**
     * 渲染对比结果
     */
    function renderCompareResult(diff) {
        const result = document.getElementById('compare-result');
        result.style.display = 'block';

        // 统计摘要
        const stats = document.getElementById('diff-stats');
        stats.innerHTML = `
            <div class="diff-stat changed">
                <span class="stat-value">${diff.stats.changed}</span>
                <span class="stat-label">已改变</span>
            </div>
            <div class="diff-stat added">
                <span class="stat-value">${diff.stats.added}</span>
                <span class="stat-label">新增</span>
            </div>
            <div class="diff-stat removed">
                <span class="stat-value">${diff.stats.removed}</span>
                <span class="stat-label">移除</span>
            </div>
            <div class="diff-stat same">
                <span class="stat-value">${diff.stats.same}</span>
                <span class="stat-label">相同</span>
            </div>
        `;

        // URL 差异
        const urlContent = document.querySelector('#diff-url .diff-content');
        if (diff.url.status !== 'same') {
            urlContent.innerHTML = `
                <div style="color: #ef4444;">- ${escapeHtml(diff.url.val1 || '(空)')}</div>
                <div style="color: #10b981;">+ ${escapeHtml(diff.url.val2 || '(空)')}</div>
            `;
        } else {
            urlContent.innerHTML = `<div style="color: var(--text-muted);">URL 相同</div>`;
        }

        // 渲染差异表格
        renderDiffTable('#diff-query tbody', diff.query);
        renderDiffTable('#diff-headers tbody', diff.headers);
        renderDiffTable('#diff-body tbody', diff.body);
    }

    /**
     * 渲染差异表格
     */
    function renderDiffTable(selector, items) {
        const tbody = document.querySelector(selector);
        tbody.innerHTML = '';

        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">无数据</td></tr>';
            return;
        }

        items.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = `diff-${item.status}`;

            // 使用 valueToString 正确处理复杂值
            const val1Str = valueToString(item.val1);
            const val2Str = valueToString(item.val2);

            // 截断过长的值用于显示
            const maxDisplayLen = 200;
            const val1Display = val1Str.length > maxDisplayLen ? val1Str.substring(0, maxDisplayLen) + '...' : val1Str;
            const val2Display = val2Str.length > maxDisplayLen ? val2Str.substring(0, maxDisplayLen) + '...' : val2Str;

            tr.innerHTML = `
                <td class="diff-key clickable-cell" data-copy="${escapeHtml(item.key)}" title="${escapeHtml(item.key)}">${escapeHtml(item.key)}</td>
                <td class="diff-value clickable-cell" data-copy="${escapeHtml(val1Str)}" title="${escapeHtml(val1Str)}">${escapeHtml(val1Display)}</td>
                <td class="diff-value clickable-cell" data-copy="${escapeHtml(val2Str)}" title="${escapeHtml(val2Str)}">${escapeHtml(val2Display)}</td>
                <td class="diff-status"><span class="status-badge ${item.status}">${getStatusText(item.status)}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    /**
     * 获取状态文本
     */
    function getStatusText(status) {
        const texts = {
            added: '新增',
            removed: '移除',
            changed: '改变',
            same: '相同'
        };
        return texts[status] || status;
    }

    // ==================== 代码生成器 ====================
    // 注意：代码生成器已模块化，详见 generators/ 目录
    // - generators/base.js      - 共享工具函数
    // - generators/python.js    - Python (requests, httpx, aiohttp, urllib)
    // - generators/javascript.js - JavaScript/Node.js (fetch, axios, xhr, http)
    // - generators/php.js       - PHP (curl, guzzle)
    // - generators/go.js        - Go (net/http, resty)
    // - generators/java.js      - Java (HttpClient, OkHttp)
    // - generators/csharp.js    - C# (HttpClient, RestSharp)
    // - generators/rust.js      - Rust (reqwest)
    // - generators/ruby.js      - Ruby (Net::HTTP, Faraday)
    // - generators/swift.js     - Swift (URLSession)
    // - generators/kotlin.js    - Kotlin (OkHttp)
    // - generators/index.js     - 注册表

    /**
     * 获取代码生成选项
     * @returns {Object} 生成选项
     */
    function getGeneratorOptions() {
        const useParamsDict = document.getElementById('opt-use-params-dict')?.checked || false;
        const indentSize = parseInt(document.getElementById('opt-indent-size')?.value) || 4;
        const indentChar = document.getElementById('opt-indent-char')?.value || 'space';
        const quoteChar = document.getElementById('opt-quote-char')?.value || 'single';

        return {
            useParamsDict,
            indentSize,
            indentChar,
            quoteChar
        };
    }

    /**
     * 生成代码 - 使用模块化生成器
     */
    async function generateCode(curlCommand, language, options = null) {
        // 确保生成器模块已加载
        await loadGeneratorModules();

        const parsed = parseCurl(curlCommand);

        if (!parsed.url) {
            throw new Error('未找到有效的 URL');
        }

        // 检查生成器模块是否已加载
        if (!window.CurlGenerators || !window.CurlGenerators.generateCode) {
            throw new Error('代码生成器模块未加载，请刷新页面重试');
        }

        // 获取选项（如未传入则从 UI 读取）
        const genOptions = options || getGeneratorOptions();

        // 使用模块化代码生成器
        return window.CurlGenerators.generateCode(parsed, language, genOptions);
    }

    // ==================== 工具函数 ====================

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    /**
     * 复制数据为 JSON
     */
    function copyAsJson(target) {
        if (!currentParsed) return null;

        switch (target) {
            case 'query':
                return JSON.stringify(currentParsed.queryParams, null, 2);
            case 'headers':
                return JSON.stringify(currentParsed.headers, null, 2);
            case 'body':
                return currentParsed.dataType === 'json' ?
                    JSON.stringify(JSON.parse(currentParsed.data), null, 2) :
                    JSON.stringify(currentParsed.bodyParams, null, 2);
            case 'cookies':
                return JSON.stringify(currentParsed.cookies, null, 2);
            default:
                return null;
        }
    }

    /**
     * 复制数据为字符串
     */
    function copyAsString(target) {
        if (!currentParsed) return null;

        switch (target) {
            case 'query':
                return new URLSearchParams(currentParsed.queryParams).toString();
            case 'headers':
                return Object.entries(currentParsed.headers)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('\n');
            default:
                return null;
        }
    }

    // ==================== 示例数据 ====================

    const SAMPLE_CURL = `curl 'https://api.example.com/v1/users?page=1&limit=10&sort=created_at' \\
  -X POST \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMjM0NX0.signature' \\
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' \\
  -H 'Accept: application/json' \\
  -H 'X-Request-ID: 550e8400-e29b-41d4-a716-446655440000' \\
  -H 'Cookie: session_id=abc123; user_token=xyz789' \\
  --data-raw '{"name": "John Doe", "email": "john@example.com", "age": 30, "active": true}'`;

    const SAMPLE_COMPARE_1 = `curl 'https://api.example.com/v1/products?page=1&limit=20&category=electronics' \\
  -H 'Authorization: Bearer token123' \\
  -H 'X-Timestamp: 1704067200'`;

    const SAMPLE_COMPARE_2 = `curl 'https://api.example.com/v1/products?page=2&limit=20&category=electronics&sort=price' \\
  -H 'Authorization: Bearer token456' \\
  -H 'X-Timestamp: 1704067260' \\
  -H 'X-Page-Token: eyJwYWdlIjoyfQ=='`;

    // ==================== 编辑器初始化 ====================

    /**
     * 获取语言对应的 CodeMirror 语言标识
     */
    function getLanguageForEditor(langValue) {
        if (!langValue) return null;
        if (langValue.startsWith('python')) return 'python';
        if (langValue.startsWith('js-') || langValue.startsWith('node-')) return 'javascript';
        if (langValue.startsWith('php')) return 'php';
        if (langValue.startsWith('go')) return 'go';
        if (langValue.startsWith('java-')) return 'java';
        if (langValue.startsWith('csharp')) return 'csharp';
        if (langValue.startsWith('rust')) return 'rust';
        if (langValue.startsWith('ruby')) return 'ruby';
        if (langValue.startsWith('swift')) return 'swift';
        if (langValue.startsWith('kotlin')) return 'kotlin';
        return 'javascript'; // 默认使用 JavaScript 高亮
    }

    /**
     * 重新创建代码输出编辑器（切换语言时）
     */
    async function recreateCodeOutputEditor(language) {
        if (!REOT.CodeEditor) return;

        const container = document.getElementById('code-output-editor');
        if (!container) return;

        // 保存当前值
        const currentValue = codeOutputEditor ? codeOutputEditor.getValue() : '';

        // 销毁旧编辑器
        if (codeOutputEditor) {
            codeOutputEditor.destroy();
            codeOutputEditor = null;
        }

        // 清空容器
        container.innerHTML = '';

        try {
            const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            const editorLang = getLanguageForEditor(language);

            codeOutputEditor = await REOT.CodeEditor.create('#code-output-editor', {
                language: editorLang,
                value: currentValue,
                readOnly: true,
                theme: theme,
                lineWrapping: true
            });
        } catch (error) {
            console.error('Failed to recreate code output editor:', error);
        }
    }

    /**
     * 初始化 CodeMirror 编辑器
     */
    async function initializeEditors() {
        if (editorsInitialized) return;
        if (!REOT.CodeEditor) {
            console.warn('CodeEditor not available, using textarea fallback');
            // 显示 textarea 作为备用
            document.querySelectorAll('.code-editor-container').forEach(el => {
                el.style.display = 'none';
            });
            document.querySelectorAll('textarea[style*="display: none"]').forEach(el => {
                el.style.display = 'block';
            });
            return;
        }

        try {
            const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

            // 解析页面的输入编辑器 (使用 shell 语法高亮)
            if (document.getElementById('input-editor')) {
                inputEditor = await REOT.CodeEditor.create('#input-editor', {
                    language: 'shell',
                    value: '',
                    readOnly: false,
                    theme: theme,
                    lineWrapping: true,
                    placeholder: '粘贴 cURL 命令...'
                });
            }

            // 导出的 cURL 编辑器 (使用 shell 语法高亮)
            if (document.getElementById('exported-curl-editor')) {
                exportedCurlEditor = await REOT.CodeEditor.create('#exported-curl-editor', {
                    language: 'shell',
                    value: '',
                    readOnly: true,
                    theme: theme,
                    lineWrapping: true
                });
            }

            // 对比页面的编辑器 (使用 shell 语法高亮)
            if (document.getElementById('compare-editor-1')) {
                compareEditor1 = await REOT.CodeEditor.create('#compare-editor-1', {
                    language: 'shell',
                    value: '',
                    readOnly: false,
                    theme: theme,
                    lineWrapping: true,
                    placeholder: '粘贴第一个 cURL 命令...'
                });
            }

            if (document.getElementById('compare-editor-2')) {
                compareEditor2 = await REOT.CodeEditor.create('#compare-editor-2', {
                    language: 'shell',
                    value: '',
                    readOnly: false,
                    theme: theme,
                    lineWrapping: true,
                    placeholder: '粘贴第二个 cURL 命令...'
                });
            }

            // 代码生成页面的输入编辑器 (使用 shell 语法高亮)
            if (document.getElementById('gen-input-editor')) {
                genInputEditor = await REOT.CodeEditor.create('#gen-input-editor', {
                    language: 'shell',
                    value: '',
                    readOnly: false,
                    theme: theme,
                    lineWrapping: true,
                    placeholder: '粘贴 cURL 命令...'
                });
            }

            // 代码生成页面的输出编辑器
            if (document.getElementById('code-output-editor')) {
                codeOutputEditor = await REOT.CodeEditor.create('#code-output-editor', {
                    language: 'javascript',
                    value: '',
                    readOnly: true,
                    theme: theme,
                    lineWrapping: true
                });
            }

            editorsInitialized = true;
            console.log('cURL Converter editors initialized');
        } catch (error) {
            console.error('Failed to initialize editors:', error);
            // 显示 textarea 作为备用
            document.querySelectorAll('.code-editor-container').forEach(el => {
                el.style.display = 'none';
            });
            document.querySelectorAll('textarea[style*="display: none"]').forEach(el => {
                el.style.display = 'block';
            });
        }
    }

    // 初始化编辑器
    setTimeout(() => {
        if (isCurlConverterToolActive()) {
            initializeEditors();
        }
    }, 100);

    // ==================== 事件处理 ====================

    function isCurlConverterToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/network/curl-converter');
    }

    document.addEventListener('click', async (e) => {
        if (!isCurlConverterToolActive()) return;

        const target = e.target;

        // 功能选项卡切换
        if (target.classList.contains('feature-tab')) {
            const feature = target.dataset.feature;
            document.querySelectorAll('.feature-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.feature-section').forEach(sec => sec.classList.remove('active'));
            target.classList.add('active');
            document.getElementById(`${feature}-section`)?.classList.add('active');
        }

        // 视图选项卡切换
        if (target.classList.contains('view-tab')) {
            const view = target.dataset.view;
            document.querySelectorAll('.view-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.detail-section').forEach(sec => sec.classList.remove('active'));
            target.classList.add('active');
            document.getElementById(`${view}-section`)?.classList.add('active');
        }

        // 解析按钮
        if (target.id === 'parse-btn' || target.closest('#parse-btn')) {
            const input = getEditorValue(inputEditor, 'input');
            if (!input.trim()) {
                REOT.utils?.showNotification('请输入 cURL 命令', 'warning');
                return;
            }
            try {
                const parsed = parseCurl(input);
                if (!parsed.url) throw new Error('未找到有效的 URL');
                renderParseResult(parsed);
                REOT.utils?.showNotification('解析成功', 'success');
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
            }
        }

        // 示例按钮
        if (target.id === 'sample-btn' || target.closest('#sample-btn')) {
            setEditorValue(inputEditor, 'input', SAMPLE_CURL);
            const parsed = parseCurl(SAMPLE_CURL);
            renderParseResult(parsed);
        }

        // 清除按钮
        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            setEditorValue(inputEditor, 'input', '');
            document.getElementById('parse-result').style.display = 'none';
            currentParsed = null;
        }

        // 复制 JSON 按钮
        if (target.classList.contains('copy-json-btn')) {
            const dataTarget = target.dataset.target;
            const json = copyAsJson(dataTarget);
            if (json) {
                await REOT.utils?.copyToClipboard(json);
                REOT.utils?.showNotification('已复制 JSON', 'success');
            }
        }

        // 复制字符串按钮
        if (target.classList.contains('copy-string-btn')) {
            const dataTarget = target.dataset.target;
            const str = copyAsString(dataTarget);
            if (str) {
                await REOT.utils?.copyToClipboard(str);
                REOT.utils?.showNotification('已复制', 'success');
            }
        }

        // 导出 cURL 按钮
        if (target.id === 'export-curl-btn' || target.closest('#export-curl-btn')) {
            if (currentParsed) {
                const curl = generateCurlCommand(currentParsed);
                setEditorValue(exportedCurlEditor, 'exported-curl', curl);
            }
        }

        // 复制导出的 cURL
        if (target.id === 'copy-curl-btn' || target.closest('#copy-curl-btn')) {
            const curl = getEditorValue(exportedCurlEditor, 'exported-curl');
            if (curl) {
                await REOT.utils?.copyToClipboard(curl);
                REOT.utils?.showNotification('已复制 cURL 命令', 'success');
            }
        }

        // 对比按钮
        if (target.id === 'compare-btn' || target.closest('#compare-btn')) {
            const curl1 = getEditorValue(compareEditor1, 'compare-input-1');
            const curl2 = getEditorValue(compareEditor2, 'compare-input-2');

            if (!curl1.trim() || !curl2.trim()) {
                REOT.utils?.showNotification('请输入两个 cURL 命令', 'warning');
                return;
            }

            try {
                const diff = compareCurls(curl1, curl2);
                renderCompareResult(diff);
                REOT.utils?.showNotification('对比完成', 'success');
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
            }
        }

        // 对比示例按钮
        if (target.id === 'compare-sample-btn' || target.closest('#compare-sample-btn')) {
            setEditorValue(compareEditor1, 'compare-input-1', SAMPLE_COMPARE_1);
            setEditorValue(compareEditor2, 'compare-input-2', SAMPLE_COMPARE_2);
            const diff = compareCurls(SAMPLE_COMPARE_1, SAMPLE_COMPARE_2);
            renderCompareResult(diff);
        }

        // 代码生成示例按钮
        if (target.id === 'gen-sample-btn' || target.closest('#gen-sample-btn')) {
            setEditorValue(genInputEditor, 'gen-input', SAMPLE_CURL);
            const selectEl = document.getElementById('code-language-select');
            const language = selectEl?.value || 'python-requests';
            try {
                await recreateCodeOutputEditor(language);
                const code = await generateCode(SAMPLE_CURL, language);
                setEditorValue(codeOutputEditor, 'code-output', code);
            } catch (error) {
                console.error('Sample generation error:', error);
            }
            return;
        }

        // 生成代码按钮
        if (target.id === 'generate-btn' || target.closest('#generate-btn')) {
            const input = getEditorValue(genInputEditor, 'gen-input');
            const selectEl = document.getElementById('code-language-select');
            const language = selectEl?.value;

            if (!input.trim()) {
                REOT.utils?.showNotification('请输入 cURL 命令', 'warning');
                return;
            }

            if (!language) {
                REOT.utils?.showNotification('请选择编程语言', 'warning');
                return;
            }

            try {
                await recreateCodeOutputEditor(language);
                const code = await generateCode(input, language);
                setEditorValue(codeOutputEditor, 'code-output', code);
                REOT.utils?.showNotification('代码生成成功', 'success');
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
            }
            return;
        }

        // 复制代码按钮
        if (target.id === 'copy-code-btn' || target.closest('#copy-code-btn')) {
            const code = getEditorValue(codeOutputEditor, 'code-output');
            if (code) {
                await REOT.utils?.copyToClipboard(code);
                REOT.utils?.showNotification('代码已复制', 'success');
            }
        }

        // 选项面板切换按钮
        if (target.id === 'gen-options-toggle' || target.closest('#gen-options-toggle')) {
            const panel = document.getElementById('gen-options-panel');
            if (panel) {
                const isHidden = panel.style.display === 'none' || !panel.style.display;
                panel.style.display = isHidden ? 'block' : 'none';
                // 更新按钮状态
                const btn = document.getElementById('gen-options-toggle');
                if (btn) {
                    btn.classList.toggle('active', isHidden);
                }
            }
        }

        // 点击单元格复制内容
        const clickableCell = target.closest('.clickable-cell');
        if (clickableCell) {
            const copyText = clickableCell.dataset.copy || clickableCell.textContent;
            if (copyText) {
                await REOT.utils?.copyToClipboard(copyText);
                // 添加复制成功的视觉反馈
                clickableCell.classList.add('copied');
                setTimeout(() => clickableCell.classList.remove('copied'), 500);
                REOT.utils?.showNotification('已复制', 'success');
            }
        }
    });

    // 语言选择和选项变化时重新生成
    document.addEventListener('change', async (e) => {
        if (!isCurlConverterToolActive()) return;

        if (e.target.id === 'code-language-select') {
            const input = getEditorValue(genInputEditor, 'gen-input');
            const language = e.target.value;

            // 重新创建编辑器以应用新的语言高亮
            await recreateCodeOutputEditor(language);

            if (input.trim()) {
                try {
                    const code = await generateCode(input, language);
                    setEditorValue(codeOutputEditor, 'code-output', code);
                } catch (error) {
                    setEditorValue(codeOutputEditor, 'code-output', '错误: ' + error.message);
                }
            }
        }

        // 选项变化时重新生成代码
        if (e.target.id === 'opt-use-params-dict' ||
            e.target.id === 'opt-indent-size' ||
            e.target.id === 'opt-indent-char' ||
            e.target.id === 'opt-quote-char') {
            const input = getEditorValue(genInputEditor, 'gen-input');
            const selectEl = document.getElementById('code-language-select');
            const language = selectEl?.value;

            if (input.trim() && language) {
                try {
                    const code = await generateCode(input, language);
                    setEditorValue(codeOutputEditor, 'code-output', code);
                } catch (error) {
                    setEditorValue(codeOutputEditor, 'code-output', '错误: ' + error.message);
                }
            }
        }
    });

    // 监听路由变化，重新初始化编辑器
    window.addEventListener('hashchange', () => {
        if (isCurlConverterToolActive() && !editorsInitialized) {
            setTimeout(initializeEditors, 100);
        }
    });

    // 监听 popstate 事件（SPA 路由）
    window.addEventListener('popstate', () => {
        if (isCurlConverterToolActive() && !editorsInitialized) {
            setTimeout(initializeEditors, 100);
        }
    });

    // 监听自定义路由事件
    document.addEventListener('routechange', () => {
        if (isCurlConverterToolActive() && !editorsInitialized) {
            setTimeout(initializeEditors, 100);
        }
    });

    // 导出工具函数
    window.CurlConverterTool = {
        parseCurl,
        generateCode,
        compareCurls,
        inferDataType,
        initializeEditors
    };

})();
