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
    let compareEditors = []; // 多个对比编辑器数组
    let compareEditorCount = 0; // 编辑器计数器
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

    // ==================== 选项面板控制 ====================

    /**
     * 切换选项面板显示
     */
    function toggleOptionsPanel() {
        const panel = document.getElementById('gen-options-panel');
        const btn = document.getElementById('gen-options-toggle');
        if (!panel) return;

        const isHidden = panel.style.display === 'none' || !panel.style.display;
        if (isHidden) {
            panel.style.display = 'block';
            panel.classList.remove('closing');
            if (btn) btn.classList.add('active');
            // 添加点击外部关闭的监听
            setTimeout(() => {
                document.addEventListener('click', handleOutsideClick);
            }, 0);
        } else {
            closeOptionsPanel();
        }
    }

    /**
     * 关闭选项面板
     */
    function closeOptionsPanel() {
        const panel = document.getElementById('gen-options-panel');
        const btn = document.getElementById('gen-options-toggle');
        if (!panel || panel.style.display === 'none') return;

        panel.classList.add('closing');
        if (btn) btn.classList.remove('active');
        document.removeEventListener('click', handleOutsideClick);

        setTimeout(() => {
            panel.style.display = 'none';
            panel.classList.remove('closing');
        }, 150);
    }

    /**
     * 处理点击外部区域
     */
    function handleOutsideClick(e) {
        const panel = document.getElementById('gen-options-panel');
        const btn = document.getElementById('gen-options-toggle');
        if (!panel || !btn) return;

        // 如果点击的不是面板内部也不是按钮，则关闭面板
        if (!panel.contains(e.target) && !btn.contains(e.target)) {
            closeOptionsPanel();
        }
    }

    // ==================== 文件名生成 ====================

    /**
     * 根据 cURL 命令和语言生成文件名
     * @param {string} curlCommand - cURL 命令
     * @param {string} language - 编程语言
     * @returns {string} 生成的文件名
     */
    function generateFilename(curlCommand, language) {
        // 语言到文件扩展名的映射
        const extMap = {
            'python-requests': 'py',
            'python-httpx': 'py',
            'python-httpx-async': 'py',
            'python-curl-cffi': 'py',
            'python-curl-cffi-async': 'py',
            'python-rnet': 'py',
            'python-rnet-async': 'py',
            'python-aiohttp': 'py',
            'python-urllib': 'py',
            'python-fastapi-httpx': 'py',
            'js-fetch': 'js',
            'js-axios': 'js',
            'js-xhr': 'js',
            'node-axios': 'js',
            'node-fetch': 'js',
            'node-http': 'js',
            'php-curl': 'php',
            'php-guzzle': 'php',
            'go-http': 'go',
            'go-resty': 'go',
            'java-httpclient': 'java',
            'java-okhttp': 'java',
            'csharp-httpclient': 'cs',
            'csharp-restsharp': 'cs',
            'rust-reqwest': 'rs',
            'ruby-net-http': 'rb',
            'ruby-faraday': 'rb',
            'swift-urlsession': 'swift',
            'kotlin-okhttp': 'kt'
        };

        const ext = extMap[language] || 'txt';

        // 尝试从 cURL 命令中提取 URL
        let baseName = 'request';
        try {
            // 简单提取 URL
            const urlMatch = curlCommand.match(/['"]?(https?:\/\/[^\s'"]+)['"]?/i);
            if (urlMatch) {
                const url = new URL(urlMatch[1]);
                // 从路径中提取有意义的名称
                let pathname = url.pathname.replace(/^\/+|\/+$/g, '');
                if (pathname) {
                    // 取最后一个路径段
                    const segments = pathname.split('/').filter(s => s);
                    if (segments.length > 0) {
                        let lastSegment = segments[segments.length - 1];
                        // 移除扩展名
                        lastSegment = lastSegment.replace(/\.[^/.]+$/, '');
                        // 移除特殊字符，只保留字母数字和下划线
                        lastSegment = lastSegment.replace(/[^a-zA-Z0-9_-]/g, '_');
                        if (lastSegment && lastSegment.length > 0 && lastSegment.length <= 50) {
                            baseName = lastSegment;
                        }
                    }
                }
                // 如果路径没有有意义的名称，使用主机名
                if (baseName === 'request') {
                    baseName = url.hostname.replace(/\./g, '_').replace(/^www_/, '');
                }
            }
        } catch (e) {
            // 解析失败，使用默认名称
        }

        return `${baseName}.${ext}`;
    }

    // ==================== Shell 类型检测 ====================

    /**
     * Shell 类型枚举
     */
    const SHELL_TYPES = {
        BASH: 'bash',
        CMD: 'cmd',
        POWERSHELL: 'powershell'
    };

    /**
     * 检测 cURL 命令来自哪种 Shell
     * @param {string} curlCommand - cURL 命令字符串
     * @returns {string} Shell 类型
     */
    function detectShellType(curlCommand) {
        // PowerShell 特征检测
        // 1. 使用反引号作为续行符
        // 2. 使用 curl.exe 而非 curl
        // 3. 使用 --% 停止解析符号
        // 4. 使用 `" 或 `' 转义
        if (/`\r?\n/.test(curlCommand) ||
            /curl\.exe\s/i.test(curlCommand) ||
            /\s--%\s/.test(curlCommand) ||
            /`["']/.test(curlCommand)) {
            return SHELL_TYPES.POWERSHELL;
        }

        // CMD 特征检测
        // 1. 使用 ^ 作为续行符
        // 2. 使用 ^" 包裹参数（CMD 特有的转义引号格式）
        // 3. 使用 ^$ 或 ^^ 转义特殊字符
        if (/\^\s*\r?\n/.test(curlCommand) ||
            (/\^$/.test(curlCommand.split('\n')[0]) && curlCommand.includes('\n'))) {
            return SHELL_TYPES.CMD;
        }

        // CMD 特有格式: ^" 包裹的参数
        if (/\^"[^"]*\^"/.test(curlCommand) || /\^\^/.test(curlCommand) || /\^\$/.test(curlCommand)) {
            return SHELL_TYPES.CMD;
        }

        // 检测 -H ^" 或 -b ^" 等 CMD 格式
        if (/-[HbXdu]\s+\^"/.test(curlCommand)) {
            return SHELL_TYPES.CMD;
        }

        // 进一步检测 CMD: 如果完全没有单引号，但有双引号，可能是 CMD
        const hasSingleQuotes = /'[^']*'/.test(curlCommand);
        const hasDoubleQuotes = /"[^"]*"/.test(curlCommand);
        const hasBackslashContinuation = /\\\r?\n/.test(curlCommand);

        // CMD 通常不使用单引号，且不使用反斜杠续行
        if (!hasSingleQuotes && hasDoubleQuotes && !hasBackslashContinuation && curlCommand.includes('^')) {
            return SHELL_TYPES.CMD;
        }

        // 默认为 Bash（Unix/Linux/macOS）
        return SHELL_TYPES.BASH;
    }

    /**
     * 根据 Shell 类型预处理 cURL 命令
     * @param {string} curlCommand - 原始 cURL 命令
     * @param {string} shellType - Shell 类型
     * @returns {string} 预处理后的命令
     */
    function preprocessCurlCommand(curlCommand, shellType) {
        let cmd = curlCommand;

        switch (shellType) {
            case SHELL_TYPES.POWERSHELL:
                // PowerShell: 处理反引号续行符
                cmd = cmd.replace(/`\r?\n/g, ' ');
                // 移除 curl.exe 改为 curl
                cmd = cmd.replace(/curl\.exe\s/i, 'curl ');
                // 处理 --% (停止解析) 后的内容
                cmd = cmd.replace(/\s--%\s/, ' ');
                // 处理 PowerShell 的反引号转义: `" -> "
                cmd = cmd.replace(/`"/g, '"');
                cmd = cmd.replace(/`'/g, "'");
                // 处理 PowerShell 的 $(...) 变量（简单移除）
                cmd = cmd.replace(/\$\([^)]*\)/g, '');
                break;

            case SHELL_TYPES.CMD:
                // CMD: 处理 ^ 续行符（行尾的 ^ 后跟换行）
                cmd = cmd.replace(/\^\s*\r?\n\s*/g, ' ');
                // 移除独立行尾的 ^（没有跟换行的情况）
                cmd = cmd.replace(/\^$/gm, '');

                // CMD 特殊处理: ^ 是转义字符，用于转义特殊字符
                // 先处理 ^^ 转义的 ^ 符号（用占位符保护）
                cmd = cmd.replace(/\^\^/g, '\x00CARET\x00');

                // 处理 ^\^" 这种嵌套转义（表示字面的 \"）
                cmd = cmd.replace(/\^\\\^"/g, '\\"');

                // 处理 CMD 中常见的转义字符
                // ^& → & (URL 参数分隔符)
                cmd = cmd.replace(/\^&/g, '&');
                // ^% → % (URL 编码前缀)
                cmd = cmd.replace(/\^%/g, '%');
                // ^! → ! (感叹号)
                cmd = cmd.replace(/\^!/g, '!');
                // ^| → | (管道符)
                cmd = cmd.replace(/\^\|/g, '|');
                // ^< → <
                cmd = cmd.replace(/\^</g, '<');
                // ^> → >
                cmd = cmd.replace(/\^>/g, '>');
                // ^( → (
                cmd = cmd.replace(/\^\(/g, '(');
                // ^) → )
                cmd = cmd.replace(/\^\)/g, ')');
                // ^$ → $
                cmd = cmd.replace(/\^\$/g, '$');

                // 处理 ^" 作为引号边界
                cmd = cmd.replace(/\^"/g, '"');

                // 恢复 ^^ 为单个 ^
                cmd = cmd.replace(/\x00CARET\x00/g, '^');
                break;

            case SHELL_TYPES.BASH:
            default:
                // Bash: 处理 \ 续行符
                cmd = cmd.replace(/\\\r?\n/g, ' ');
                break;
        }

        // 通用处理：合并多余空格
        cmd = cmd.replace(/\s+/g, ' ').trim();

        return cmd;
    }

    // ==================== cURL 解析器 ====================

    /**
     * 解析 cURL 命令
     * @param {string} curlCommand - cURL 命令字符串
     * @returns {Object} 解析结果
     */
    function parseCurl(curlCommand) {
        // 检测 Shell 类型
        const shellType = detectShellType(curlCommand);

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
            bodyParams: {},
            shellType: shellType  // 保存检测到的 Shell 类型
        };

        // 根据 Shell 类型预处理命令
        let cmd = preprocessCurlCommand(curlCommand, shellType);

        // 移除 curl 命令本身
        cmd = cmd.replace(/^curl\s+/i, '');

        // 分词解析（传入 Shell 类型以正确处理引号）
        const tokens = tokenize(cmd, shellType);

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
            } else if (token === '-d' || token === '--data' || token === '--data-raw' || token === '--data-binary') {
                // 处理普通 data 参数，多个参数需要拼接
                const newData = tokens[++i] || '';
                if (result.data) {
                    result.data += '&' + newData;
                } else {
                    result.data = newData;
                }
                if (result.method === 'GET') {
                    result.method = 'POST';
                }
            } else if (token === '--data-urlencode') {
                // 处理 --data-urlencode 参数
                // 根据 curl 文档：name=value 形式中，name 不编码，value 编码
                // 纯 value 形式中，整个值都编码
                const rawValue = tokens[++i] || '';
                let encodedPart;
                const eqIndex = rawValue.indexOf('=');
                if (eqIndex !== -1) {
                    const name = rawValue.substring(0, eqIndex);
                    const value = rawValue.substring(eqIndex + 1);
                    // name 部分不编码（假设已经是合法的），value 部分编码
                    encodedPart = name + '=' + encodeURIComponent(value);
                } else {
                    // 整个值都要编码
                    encodedPart = encodeURIComponent(rawValue);
                }
                if (result.data) {
                    result.data += '&' + encodedPart;
                } else {
                    result.data = encodedPart;
                }
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
     * @param {string} cmd - 预处理后的命令字符串
     * @param {string} shellType - Shell 类型
     * @returns {string[]} 分词结果
     */
    function tokenize(cmd, shellType = SHELL_TYPES.BASH) {
        const tokens = [];
        let current = '';
        let inQuote = false;
        let quoteChar = '';

        for (let i = 0; i < cmd.length; i++) {
            const char = cmd[i];

            // 处理转义字符
            if (char === '\\' && i + 1 < cmd.length) {
                const nextChar = cmd[i + 1];

                if (shellType === SHELL_TYPES.CMD) {
                    // CMD: \" 是转义双引号
                    if (nextChar === '"') {
                        current += '"';
                        i++;
                        continue;
                    }
                    // CMD 中其他反斜杠不是转义
                    current += char;
                    continue;
                }

                // Bash/PowerShell 转义处理
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

            // 处理引号
            if (char === '"' || char === "'") {
                // CMD 只支持双引号
                if (shellType === SHELL_TYPES.CMD && char === "'") {
                    // CMD 中单引号作为普通字符
                    current += char;
                    continue;
                }

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
     * 获取 Shell 类型显示名称
     */
    function getShellDisplayName(shellType) {
        const names = {
            [SHELL_TYPES.BASH]: 'Bash',
            [SHELL_TYPES.CMD]: 'CMD',
            [SHELL_TYPES.POWERSHELL]: 'PowerShell'
        };
        return names[shellType] || 'Bash';
    }

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

        // Shell 类型
        const shellEl = document.getElementById('overview-shell');
        if (shellEl) {
            const shellName = getShellDisplayName(parsed.shellType);
            shellEl.textContent = shellName;
            shellEl.className = `overview-value shell-badge shell-${parsed.shellType}`;
        }

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
    // ==================== 多 cURL 对比功能 ====================

    /**
     * 创建对比编辑器输入框
     */
    async function createCompareInput(index) {
        const container = document.getElementById('compare-inputs-container');
        if (!container) return null;

        compareEditorCount++;
        const id = compareEditorCount;

        const card = document.createElement('div');
        card.className = 'compare-input-card';
        card.dataset.compareId = id;

        // 使用 DOM API 构建元素避免 innerHTML 安全问题
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
        label.appendChild(document.createTextNode(' 请求 ' + index));

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
        editorDiv.id = 'compare-editor-' + id;
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
                editor = await REOT.CodeEditor.create('#compare-editor-' + id, {
                    language: 'shell',
                    value: '',
                    readOnly: false,
                    theme: theme,
                    lineWrapping: true,
                    placeholder: '粘贴第 ' + index + ' 个 cURL 命令...'
                });
            }
        } catch (e) {
            console.error('Failed to create compare editor:', e);
        }

        const editorInfo = { id, index, editor, element: card };
        compareEditors.push(editorInfo);

        updateCompareInputsUI();
        return editorInfo;
    }

    /**
     * 移除对比编辑器
     */
    function removeCompareInput(id) {
        const index = compareEditors.findIndex(e => e.id === id);
        if (index === -1) return;

        // 至少保留2个
        if (compareEditors.length <= 2) {
            REOT.utils?.showNotification('至少需要保留 2 个对比输入框', 'warning');
            return;
        }

        const editorInfo = compareEditors[index];
        if (editorInfo.editor && editorInfo.editor.destroy) {
            editorInfo.editor.destroy();
        }
        editorInfo.element.remove();
        compareEditors.splice(index, 1);

        // 重新编号
        reindexCompareInputs();
        updateCompareInputsUI();
    }

    /**
     * 重新编号对比输入框
     */
    function reindexCompareInputs() {
        compareEditors.forEach((editorInfo, idx) => {
            const newIndex = idx + 1;
            editorInfo.index = newIndex;
            const label = editorInfo.element.querySelector('.compare-input-label');
            if (label) {
                label.innerHTML = '';
                const numSpan = document.createElement('span');
                numSpan.className = 'compare-input-number';
                numSpan.textContent = newIndex;
                label.appendChild(numSpan);
                label.appendChild(document.createTextNode(' 请求 ' + newIndex));
            }
        });
    }

    /**
     * 更新对比输入 UI
     */
    function updateCompareInputsUI() {
        const count = compareEditors.length;
        const badge = document.getElementById('compare-count-badge');
        if (badge) {
            badge.textContent = count + ' 个请求';
        }

        // 更新删除按钮状态
        const canRemove = count > 2;
        compareEditors.forEach(editorInfo => {
            const removeBtn = editorInfo.element.querySelector('.compare-input-remove');
            if (removeBtn) {
                removeBtn.disabled = !canRemove;
            }
        });

        // 更新容器列数样式
        const container = document.getElementById('compare-inputs-container');
        if (container) {
            container.classList.remove('cols-3', 'cols-4', 'cols-5-plus');
            if (count === 3) {
                container.classList.add('cols-3');
            } else if (count === 4) {
                container.classList.add('cols-4');
            } else if (count >= 5) {
                container.classList.add('cols-5-plus');
            }
        }
    }

    /**
     * 初始化对比编辑器（默认2个）
     */
    async function initCompareEditors() {
        const container = document.getElementById('compare-inputs-container');
        if (!container || compareEditors.length > 0) return;

        await createCompareInput(1);
        await createCompareInput(2);
    }

    /**
     * 清除所有对比编辑器内容
     */
    function clearAllCompareInputs() {
        compareEditors.forEach(editorInfo => {
            if (editorInfo.editor) {
                if (editorInfo.editor.setValue) {
                    editorInfo.editor.setValue('');
                } else if (editorInfo.editor.dispatch) {
                    editorInfo.editor.dispatch({
                        changes: { from: 0, to: editorInfo.editor.state.doc.length, insert: '' }
                    });
                }
            }
            // 展开输入框
            editorInfo.element.classList.remove('collapsed');
        });
        // 隐藏结果
        const result = document.getElementById('compare-result');
        if (result) result.style.display = 'none';
    }

    /**
     * 折叠所有对比编辑器输入框
     */
    function collapseAllCompareInputs() {
        compareEditors.forEach(editorInfo => {
            editorInfo.element.classList.add('collapsed');
            const toggleBtn = editorInfo.element.querySelector('.compare-input-toggle');
            if (toggleBtn) {
                toggleBtn.title = '展开';
            }
        });
    }

    /**
     * 多 cURL 对比
     * @param {string[]} curls - cURL 命令数组
     * @returns {Object} 对比结果
     */
    function compareMultipleCurls(curls) {
        if (curls.length < 2) {
            throw new Error('至少需要 2 个 cURL 命令进行对比');
        }

        const parsedList = curls.map(curl => parseCurl(curl));

        // 对比结果结构
        const diff = {
            urls: parsedList.map((p, i) => ({ index: i + 1, url: p.url, method: p.method })),
            query: compareMultipleObjects(parsedList.map(p => p.queryParams)),
            headers: compareMultipleObjects(parsedList.map(p => p.headers)),
            body: compareMultipleObjects(parsedList.map(p => p.bodyParams)),
            count: curls.length,
            stats: { different: 0, same: 0 }
        };

        // 统计
        [diff.query, diff.headers, diff.body].forEach(section => {
            section.forEach(item => {
                if (item.allSame) {
                    diff.stats.same++;
                } else {
                    diff.stats.different++;
                }
            });
        });

        return diff;
    }

    /**
     * 比较多个对象
     * @param {Object[]} objects - 对象数组
     */
    function compareMultipleObjects(objects) {
        // 收集所有 key
        const allKeys = new Set();
        objects.forEach(obj => {
            if (obj) {
                Object.keys(obj).forEach(key => allKeys.add(key));
            }
        });

        const results = [];

        allKeys.forEach(key => {
            const values = objects.map(obj => obj?.[key] ?? undefined);
            const valuesStr = values.map(v => valueToString(v));

            // 检查是否所有值都相同
            const firstVal = valuesStr[0];
            const allSame = valuesStr.every(v => v === firstVal);

            results.push({
                key,
                values,
                valuesStr,
                allSame
            });
        });

        // 排序：不同的排前面
        results.sort((a, b) => {
            if (a.allSame !== b.allSame) {
                return a.allSame ? 1 : -1;
            }
            return a.key.localeCompare(b.key);
        });

        return results;
    }

    // 保留旧的两个 cURL 对比函数用于兼容
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

    // 存储当前对比结果用于复制
    let currentMultiDiff = null;

    /**
     * 渲染多 cURL 对比结果
     */
    function renderMultiCompareResult(diff) {
        currentMultiDiff = diff;
        const result = document.getElementById('compare-result');
        result.style.display = 'block';

        // 统计摘要
        const stats = document.getElementById('diff-stats');
        stats.innerHTML = '';
        const differentStat = document.createElement('div');
        differentStat.className = 'diff-stat changed';
        differentStat.innerHTML = '<span class="stat-value">' + diff.stats.different + '</span><span class="stat-label">有差异</span>';
        const sameStat = document.createElement('div');
        sameStat.className = 'diff-stat same';
        sameStat.innerHTML = '<span class="stat-value">' + diff.stats.same + '</span><span class="stat-label">完全相同</span>';
        stats.appendChild(differentStat);
        stats.appendChild(sameStat);

        // URL 差异
        const urlContent = document.querySelector('#diff-url .diff-content');
        urlContent.innerHTML = '';
        const urlGrid = document.createElement('div');
        urlGrid.className = 'diff-url-grid';

        // 检查 URL 是否都相同
        const allUrlsSame = diff.urls.every(u => u.url === diff.urls[0].url);

        diff.urls.forEach((urlInfo, i) => {
            const item = document.createElement('div');
            item.className = 'diff-url-item' + (allUrlsSame ? ' url-same' : ' url-different');
            const labelSpan = document.createElement('span');
            labelSpan.className = 'url-label';
            labelSpan.textContent = '请求 ' + urlInfo.index;
            const valueSpan = document.createElement('span');
            valueSpan.className = 'url-value clickable-cell';
            valueSpan.dataset.copy = urlInfo.url || '';
            valueSpan.title = urlInfo.url || '';
            valueSpan.textContent = urlInfo.url || '';
            item.appendChild(labelSpan);
            item.appendChild(valueSpan);
            urlGrid.appendChild(item);
        });
        urlContent.appendChild(urlGrid);

        // 渲染多列差异表格并添加复制按钮
        renderMultiDiffTable('#diff-query-table', diff.query, diff.count, 'query');
        renderMultiDiffTable('#diff-headers-table', diff.headers, diff.count, 'headers');
        renderMultiDiffTable('#diff-body-table', diff.body, diff.count, 'body');

        // 添加复制JSON按钮到各个section
        addCopyJsonButtons();
    }

    /**
     * 添加复制JSON按钮到差异section
     */
    function addCopyJsonButtons() {
        const sections = [
            { id: 'diff-query', type: 'query', label: '查询参数' },
            { id: 'diff-headers', type: 'headers', label: '请求头' },
            { id: 'diff-body', type: 'body', label: '请求体' }
        ];

        sections.forEach(section => {
            const sectionEl = document.getElementById(section.id);
            if (!sectionEl) return;

            const h5 = sectionEl.querySelector('h5');
            if (!h5) return;

            // 检查是否已有按钮容器
            let btnContainer = sectionEl.querySelector('.diff-section-actions');
            if (!btnContainer) {
                // 创建标题和按钮的容器
                const headerWrapper = document.createElement('div');
                headerWrapper.className = 'diff-section-header';

                // 移动h5到容器中
                h5.parentNode.insertBefore(headerWrapper, h5);
                headerWrapper.appendChild(h5);

                // 创建按钮容器
                btnContainer = document.createElement('div');
                btnContainer.className = 'diff-section-actions';
                headerWrapper.appendChild(btnContainer);
            } else {
                btnContainer.innerHTML = '';
            }

            // 复制不同参数按钮
            const copyDiffBtn = document.createElement('button');
            copyDiffBtn.className = 'btn btn--sm btn--outline';
            copyDiffBtn.dataset.copyType = section.type;
            copyDiffBtn.dataset.copyMode = 'different';
            copyDiffBtn.textContent = '复制差异';
            copyDiffBtn.title = '复制有差异的参数为 JSON';
            btnContainer.appendChild(copyDiffBtn);

            // 复制全部按钮
            const copyAllBtn = document.createElement('button');
            copyAllBtn.className = 'btn btn--sm btn--outline';
            copyAllBtn.dataset.copyType = section.type;
            copyAllBtn.dataset.copyMode = 'all';
            copyAllBtn.textContent = '复制全部';
            copyAllBtn.title = '复制全部参数为 JSON';
            btnContainer.appendChild(copyAllBtn);
        });
    }

    /**
     * 复制差异参数为JSON
     */
    function copyDiffAsJson(type, mode) {
        if (!currentMultiDiff) {
            REOT.utils?.showNotification('没有可复制的数据', 'warning');
            return;
        }

        let items = currentMultiDiff[type];
        if (!items || items.length === 0) {
            REOT.utils?.showNotification('没有可复制的数据', 'warning');
            return;
        }

        // 根据模式过滤
        if (mode === 'different') {
            items = items.filter(item => !item.allSame);
        }

        if (items.length === 0) {
            REOT.utils?.showNotification('没有差异数据', 'info');
            return;
        }

        // 构建每个请求的参数对象
        const result = {};
        for (let i = 0; i < currentMultiDiff.count; i++) {
            result['请求' + (i + 1)] = {};
        }

        items.forEach(item => {
            item.values.forEach((val, i) => {
                if (val !== undefined && val !== '') {
                    result['请求' + (i + 1)][item.key] = val;
                }
            });
        });

        const jsonStr = JSON.stringify(result, null, 2);
        REOT.utils?.copyToClipboard(jsonStr);
        REOT.utils?.showNotification('已复制 ' + items.length + ' 个参数', 'success');
    }

    /**
     * 渲染多列差异表格
     */
    function renderMultiDiffTable(tableSelector, items, count, type) {
        const table = document.querySelector(tableSelector);
        if (!table) return;

        table.classList.add('multi-compare');
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        thead.innerHTML = '';
        tbody.innerHTML = '';

        // 创建表头
        const headerRow = document.createElement('tr');
        const keyTh = document.createElement('th');
        keyTh.textContent = '参数名';
        headerRow.appendChild(keyTh);

        for (let i = 1; i <= count; i++) {
            const th = document.createElement('th');
            th.className = 'value-col';
            th.textContent = '请求 ' + i;
            headerRow.appendChild(th);
        }

        const statusTh = document.createElement('th');
        statusTh.textContent = '状态';
        headerRow.appendChild(statusTh);
        thead.appendChild(headerRow);

        // 空数据提示
        if (items.length === 0) {
            const emptyRow = document.createElement('tr');
            const emptyTd = document.createElement('td');
            emptyTd.colSpan = count + 2;
            emptyTd.style.textAlign = 'center';
            emptyTd.style.color = 'var(--text-muted)';
            emptyTd.textContent = '无数据';
            emptyRow.appendChild(emptyTd);
            tbody.appendChild(emptyRow);
            return;
        }

        // 渲染数据行
        const maxDisplayLen = 150;
        items.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = item.allSame ? 'diff-same' : 'diff-changed';

            // 参数名列
            const keyTd = document.createElement('td');
            keyTd.className = 'diff-key clickable-cell';
            keyTd.dataset.copy = item.key;
            keyTd.title = item.key;
            keyTd.textContent = item.key;
            tr.appendChild(keyTd);

            // 各请求的值列
            item.valuesStr.forEach((valStr, i) => {
                const valTd = document.createElement('td');
                valTd.className = 'diff-value value-col clickable-cell';
                valTd.dataset.copy = valStr;
                valTd.title = valStr;
                const displayVal = valStr.length > maxDisplayLen ? valStr.substring(0, maxDisplayLen) + '...' : valStr;
                valTd.textContent = displayVal;

                // 如果不同，高亮显示
                if (!item.allSame && valStr !== item.valuesStr[0]) {
                    valTd.style.background = 'rgba(245, 158, 11, 0.15)';
                }
                tr.appendChild(valTd);
            });

            // 状态列
            const statusTd = document.createElement('td');
            statusTd.className = 'diff-status';
            const badge = document.createElement('span');
            badge.className = 'status-badge ' + (item.allSame ? 'same' : 'changed');
            badge.textContent = item.allSame ? '相同' : '不同';
            statusTd.appendChild(badge);
            tr.appendChild(statusTd);

            tbody.appendChild(tr);
        });
    }

    /**
     * 渲染对比结果（兼容旧版两个 cURL 对比）
     */
    function renderCompareResult(diff) {
        const result = document.getElementById('compare-result');
        result.style.display = 'block';

        // 统计摘要
        const stats = document.getElementById('diff-stats');
        stats.innerHTML = '';
        const changedStat = document.createElement('div');
        changedStat.className = 'diff-stat changed';
        changedStat.innerHTML = '<span class="stat-value">' + diff.stats.changed + '</span><span class="stat-label">已改变</span>';
        const addedStat = document.createElement('div');
        addedStat.className = 'diff-stat added';
        addedStat.innerHTML = '<span class="stat-value">' + diff.stats.added + '</span><span class="stat-label">新增</span>';
        const removedStat = document.createElement('div');
        removedStat.className = 'diff-stat removed';
        removedStat.innerHTML = '<span class="stat-value">' + diff.stats.removed + '</span><span class="stat-label">移除</span>';
        const sameStat = document.createElement('div');
        sameStat.className = 'diff-stat same';
        sameStat.innerHTML = '<span class="stat-value">' + diff.stats.same + '</span><span class="stat-label">相同</span>';
        stats.appendChild(changedStat);
        stats.appendChild(addedStat);
        stats.appendChild(removedStat);
        stats.appendChild(sameStat);

        // URL 差异
        const urlContent = document.querySelector('#diff-url .diff-content');
        urlContent.innerHTML = '';
        if (diff.url.status !== 'same') {
            const div1 = document.createElement('div');
            div1.style.color = '#ef4444';
            div1.textContent = '- ' + (diff.url.val1 || '(空)');
            const div2 = document.createElement('div');
            div2.style.color = '#10b981';
            div2.textContent = '+ ' + (diff.url.val2 || '(空)');
            urlContent.appendChild(div1);
            urlContent.appendChild(div2);
        } else {
            const div = document.createElement('div');
            div.style.color = 'var(--text-muted)';
            div.textContent = 'URL 相同';
            urlContent.appendChild(div);
        }

        // 渲染差异表格（转换为多列格式）
        const convertToMulti = (items) => items.map(item => ({
            key: item.key,
            values: [item.val1, item.val2],
            valuesStr: [valueToString(item.val1), valueToString(item.val2)],
            allSame: item.status === 'same'
        }));

        renderMultiDiffTable('#diff-query-table', convertToMulti(diff.query), 2);
        renderMultiDiffTable('#diff-headers-table', convertToMulti(diff.headers), 2);
        renderMultiDiffTable('#diff-body-table', convertToMulti(diff.body), 2);
    }

    /**
     * 渲染差异表格（旧版，保留兼容）
     */
    function renderDiffTable(selector, items) {
        const tbody = document.querySelector(selector);
        if (!tbody) return;
        tbody.innerHTML = '';

        if (items.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 4;
            td.style.textAlign = 'center';
            td.style.color = 'var(--text-muted)';
            td.textContent = '无数据';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        const maxDisplayLen = 200;
        items.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = 'diff-' + item.status;

            const val1Str = valueToString(item.val1);
            const val2Str = valueToString(item.val2);
            const val1Display = val1Str.length > maxDisplayLen ? val1Str.substring(0, maxDisplayLen) + '...' : val1Str;
            const val2Display = val2Str.length > maxDisplayLen ? val2Str.substring(0, maxDisplayLen) + '...' : val2Str;

            const keyTd = document.createElement('td');
            keyTd.className = 'diff-key clickable-cell';
            keyTd.dataset.copy = item.key;
            keyTd.title = item.key;
            keyTd.textContent = item.key;

            const val1Td = document.createElement('td');
            val1Td.className = 'diff-value clickable-cell';
            val1Td.dataset.copy = val1Str;
            val1Td.title = val1Str;
            val1Td.textContent = val1Display;

            const val2Td = document.createElement('td');
            val2Td.className = 'diff-value clickable-cell';
            val2Td.dataset.copy = val2Str;
            val2Td.title = val2Str;
            val2Td.textContent = val2Display;

            const statusTd = document.createElement('td');
            statusTd.className = 'diff-status';
            const badge = document.createElement('span');
            badge.className = 'status-badge ' + item.status;
            badge.textContent = getStatusText(item.status);
            statusTd.appendChild(badge);

            tr.appendChild(keyTd);
            tr.appendChild(val1Td);
            tr.appendChild(val2Td);
            tr.appendChild(statusTd);
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

            // 对比页面的编辑器 (动态创建)
            if (document.getElementById('compare-inputs-container')) {
                await initCompareEditors();
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

        // 添加对比输入框按钮
        if (target.id === 'add-compare-btn' || target.closest('#add-compare-btn')) {
            const newIndex = compareEditors.length + 1;
            await createCompareInput(newIndex);
            REOT.utils?.showNotification('已添加第 ' + newIndex + ' 个对比输入', 'success');
            return;
        }

        // 移除对比输入框按钮
        const removeBtn = target.closest('.compare-input-remove');
        if (removeBtn) {
            const removeId = parseInt(removeBtn.dataset.removeId);
            if (removeId) {
                removeCompareInput(removeId);
            }
            return;
        }

        // 展开/折叠对比输入框
        const toggleBtn = target.closest('.compare-input-toggle');
        if (toggleBtn) {
            const card = toggleBtn.closest('.compare-input-card');
            if (card) {
                card.classList.toggle('collapsed');
                const isCollapsed = card.classList.contains('collapsed');
                toggleBtn.title = isCollapsed ? '展开' : '折叠';
                toggleBtn.querySelector('svg').style.transform = isCollapsed ? 'rotate(-90deg)' : '';
            }
            return;
        }

        // 复制差异参数为JSON按钮
        if (target.dataset.copyType && target.dataset.copyMode) {
            copyDiffAsJson(target.dataset.copyType, target.dataset.copyMode);
            return;
        }
        const copyJsonBtn = target.closest('[data-copy-type][data-copy-mode]');
        if (copyJsonBtn) {
            copyDiffAsJson(copyJsonBtn.dataset.copyType, copyJsonBtn.dataset.copyMode);
            return;
        }

        // 清除全部按钮
        if (target.id === 'compare-clear-btn' || target.closest('#compare-clear-btn')) {
            clearAllCompareInputs();
            REOT.utils?.showNotification('已清除全部内容', 'success');
            return;
        }

        // 对比按钮
        if (target.id === 'compare-btn' || target.closest('#compare-btn')) {
            // 收集所有 cURL 输入
            const curls = [];
            let hasEmpty = false;

            compareEditors.forEach(editorInfo => {
                let value = '';
                if (editorInfo.editor) {
                    if (editorInfo.editor.getValue) {
                        value = editorInfo.editor.getValue();
                    } else if (editorInfo.editor.state) {
                        value = editorInfo.editor.state.doc.toString();
                    }
                }
                if (!value.trim()) {
                    hasEmpty = true;
                } else {
                    curls.push(value);
                }
            });

            if (curls.length < 2) {
                REOT.utils?.showNotification('至少需要填写 2 个 cURL 命令', 'warning');
                return;
            }

            if (hasEmpty && curls.length < compareEditors.length) {
                // 有空的输入框，但有足够的非空输入
                REOT.utils?.showNotification('部分输入框为空，将只对比已填写的 ' + curls.length + ' 个请求', 'info');
            }

            try {
                const diff = compareMultipleCurls(curls);
                renderMultiCompareResult(diff);
                // 对比完成后折叠所有输入框
                collapseAllCompareInputs();
                REOT.utils?.showNotification('对比完成，共 ' + curls.length + ' 个请求', 'success');
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
            }
            return;
        }

        // 对比示例按钮
        if (target.id === 'compare-sample-btn' || target.closest('#compare-sample-btn')) {
            // 确保至少有2个输入框
            while (compareEditors.length < 2) {
                await createCompareInput(compareEditors.length + 1);
            }

            // 设置示例值
            if (compareEditors[0] && compareEditors[0].editor) {
                if (compareEditors[0].editor.setValue) {
                    compareEditors[0].editor.setValue(SAMPLE_COMPARE_1);
                } else if (compareEditors[0].editor.dispatch) {
                    compareEditors[0].editor.dispatch({
                        changes: { from: 0, to: compareEditors[0].editor.state.doc.length, insert: SAMPLE_COMPARE_1 }
                    });
                }
            }
            if (compareEditors[1] && compareEditors[1].editor) {
                if (compareEditors[1].editor.setValue) {
                    compareEditors[1].editor.setValue(SAMPLE_COMPARE_2);
                } else if (compareEditors[1].editor.dispatch) {
                    compareEditors[1].editor.dispatch({
                        changes: { from: 0, to: compareEditors[1].editor.state.doc.length, insert: SAMPLE_COMPARE_2 }
                    });
                }
            }

            const diff = compareMultipleCurls([SAMPLE_COMPARE_1, SAMPLE_COMPARE_2]);
            renderMultiCompareResult(diff);
            // 对比完成后折叠所有输入框
            collapseAllCompareInputs();
            return;
        }

        // 代码生成按钮
        if (target.id === 'gen-code-btn' || target.closest('#gen-code-btn')) {
            const input = getEditorValue(genInputEditor, 'gen-input');
            if (!input.trim()) {
                REOT.utils?.showNotification('请输入 cURL 命令', 'warning');
                return;
            }
            const selectEl = document.getElementById('code-language-select');
            const language = selectEl?.value || 'python-requests';

            // 更新语言标签
            const langBadge = document.getElementById('output-lang-badge');
            if (langBadge) {
                const selectedOption = selectEl.options[selectEl.selectedIndex];
                langBadge.textContent = selectedOption?.text || language;
            }

            try {
                await recreateCodeOutputEditor(language);
                const code = await generateCode(input, language);
                setEditorValue(codeOutputEditor, 'code-output', code);
                REOT.utils?.showNotification('代码生成成功', 'success');
            } catch (error) {
                setEditorValue(codeOutputEditor, 'code-output', '错误: ' + error.message);
                REOT.utils?.showNotification(error.message, 'error');
            }
            return;
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

        // 复制代码按钮
        if (target.id === 'copy-code-btn' || target.closest('#copy-code-btn')) {
            const code = getEditorValue(codeOutputEditor, 'code-output');
            if (code) {
                await REOT.utils?.copyToClipboard(code);
                REOT.utils?.showNotification('代码已复制', 'success');
            }
            return;
        }

        // 保存代码文件按钮
        if (target.id === 'save-code-btn' || target.closest('#save-code-btn')) {
            const code = getEditorValue(codeOutputEditor, 'code-output');
            if (!code || !code.trim()) {
                REOT.utils?.showNotification('没有可保存的代码', 'warning');
                return;
            }

            const selectEl = document.getElementById('code-language-select');
            const language = selectEl?.value || 'python-requests';
            const input = getEditorValue(genInputEditor, 'gen-input');

            // 生成文件名
            const filename = generateFilename(input, language);

            // 下载文件
            const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            REOT.utils?.showNotification('代码已保存: ' + filename, 'success');
            return;
        }

        // 选项面板切换按钮
        if (target.id === 'gen-options-toggle' || target.closest('#gen-options-toggle')) {
            e.stopPropagation();
            toggleOptionsPanel();
        }

        // 选项面板关闭按钮
        if (target.id === 'gen-options-close' || target.closest('#gen-options-close')) {
            e.stopPropagation();
            closeOptionsPanel();
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

            // 更新语言标签
            const langBadge = document.getElementById('output-lang-badge');
            if (langBadge) {
                const selectedOption = e.target.options[e.target.selectedIndex];
                langBadge.textContent = selectedOption?.text || language;
            }

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
        compareMultipleCurls,
        inferDataType,
        initializeEditors,
        initCompareEditors,
        createCompareInput,
        removeCompareInput,
        detectShellType,
        SHELL_TYPES
    };

})();
