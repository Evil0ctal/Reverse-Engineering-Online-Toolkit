/**
 * cURL 代码生成器 - Python
 * @description 生成 Python HTTP 请求代码
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // 确保命名空间存在
    window.CurlGenerators = window.CurlGenerators || {};

    const escapeString = window.CurlGenerators.escapeString;
    const makeIndent = window.CurlGenerators.makeIndent;
    const getDefaultOptions = window.CurlGenerators.getDefaultOptions;
    const getBaseUrl = window.CurlGenerators.getBaseUrl;

    /**
     * 从 URL 中提取查询参数
     * @param {string} url - 完整 URL
     * @returns {Object} 查询参数对象
     */
    function extractQueryParams(url) {
        try {
            const urlObj = new URL(url);
            const params = {};
            urlObj.searchParams.forEach((value, key) => {
                params[key] = value;
            });
            return params;
        } catch (e) {
            return {};
        }
    }

    /**
     * Python - requests 库
     */
    function toPythonRequests(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);

        let code = 'import requests\n\n';

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);
            code += `url = '${escapeString(baseUrl, 'python')}'\n\n`;

            if (Object.keys(params).length > 0) {
                code += 'params = {\n';
                for (const [key, value] of Object.entries(params)) {
                    code += `${i1}'${escapeString(key, 'python')}': '${escapeString(value, 'python')}',\n`;
                }
                code += '}\n\n';
            }
        } else {
            code += `url = '${escapeString(parsed.url, 'python')}'\n\n`;
        }

        if (Object.keys(parsed.headers).length > 0) {
            code += 'headers = {\n';
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `${i1}'${escapeString(key, 'python')}': '${escapeString(value, 'python')}',\n`;
            }
            code += '}\n\n';
        }

        if (parsed.cookies && Object.keys(parsed.cookies).length > 0) {
            code += 'cookies = {\n';
            for (const [key, value] of Object.entries(parsed.cookies)) {
                code += `${i1}'${escapeString(key, 'python')}': '${escapeString(value, 'python')}',\n`;
            }
            code += '}\n\n';
        }

        if (parsed.data) {
            code += `data = '${escapeString(parsed.data, 'python')}'\n\n`;
        }

        code += `response = requests.${parsed.method.toLowerCase()}(url`;
        if (opts.useParamsDict && Object.keys(extractQueryParams(parsed.url)).length > 0) {
            code += ', params=params';
        }
        if (Object.keys(parsed.headers).length > 0) {
            code += ', headers=headers';
        }
        if (parsed.cookies && Object.keys(parsed.cookies).length > 0) {
            code += ', cookies=cookies';
        }
        if (parsed.data) {
            code += ', data=data';
        }
        code += ')\n\n';
        code += 'print(response.status_code)\n';
        code += 'print(response.text)';

        return code;
    }

    /**
     * Python - httpx 库
     */
    function toPythonHttpx(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);

        let code = 'import httpx\n\n';

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);
            code += `url = '${escapeString(baseUrl, 'python')}'\n\n`;

            if (Object.keys(params).length > 0) {
                code += 'params = {\n';
                for (const [key, value] of Object.entries(params)) {
                    code += `${i1}'${escapeString(key, 'python')}': '${escapeString(value, 'python')}',\n`;
                }
                code += '}\n\n';
            }
        } else {
            code += `url = '${escapeString(parsed.url, 'python')}'\n\n`;
        }

        if (Object.keys(parsed.headers).length > 0) {
            code += 'headers = {\n';
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `${i1}'${escapeString(key, 'python')}': '${escapeString(value, 'python')}',\n`;
            }
            code += '}\n\n';
        }

        if (parsed.data) {
            code += `data = '${escapeString(parsed.data, 'python')}'\n\n`;
        }

        code += `response = httpx.${parsed.method.toLowerCase()}(url`;
        if (opts.useParamsDict && Object.keys(extractQueryParams(parsed.url)).length > 0) {
            code += ', params=params';
        }
        if (Object.keys(parsed.headers).length > 0) {
            code += ', headers=headers';
        }
        if (parsed.data) {
            code += ', data=data';
        }
        code += ')\n\n';
        code += 'print(response.status_code)\n';
        code += 'print(response.text)';

        return code;
    }

    /**
     * Python - aiohttp 库 (异步)
     */
    function toPythonAiohttp(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const i2 = makeIndent(2, opts);
        const i3 = makeIndent(3, opts);

        let code = 'import aiohttp\nimport asyncio\n\n';
        code += 'async def main():\n';
        code += `${i1}async with aiohttp.ClientSession() as session:\n`;

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);
            code += `${i2}url = '${escapeString(baseUrl, 'python')}'\n\n`;

            if (Object.keys(params).length > 0) {
                code += `${i2}params = {\n`;
                for (const [key, value] of Object.entries(params)) {
                    code += `${i3}'${escapeString(key, 'python')}': '${escapeString(value, 'python')}',\n`;
                }
                code += `${i2}}\n\n`;
            }
        } else {
            code += `${i2}url = '${escapeString(parsed.url, 'python')}'\n\n`;
        }

        if (Object.keys(parsed.headers).length > 0) {
            code += `${i2}headers = {\n`;
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `${i3}'${escapeString(key, 'python')}': '${escapeString(value, 'python')}',\n`;
            }
            code += `${i2}}\n\n`;
        }

        if (parsed.data) {
            code += `${i2}data = '${escapeString(parsed.data, 'python')}'\n\n`;
        }

        code += `${i2}async with session.${parsed.method.toLowerCase()}(url`;
        if (opts.useParamsDict && Object.keys(extractQueryParams(parsed.url)).length > 0) {
            code += ', params=params';
        }
        if (Object.keys(parsed.headers).length > 0) {
            code += ', headers=headers';
        }
        if (parsed.data) {
            code += ', data=data';
        }
        code += ') as response:\n';
        code += `${i3}print(response.status)\n`;
        code += `${i3}print(await response.text())\n\n`;
        code += 'asyncio.run(main())';

        return code;
    }

    /**
     * Python - urllib 标准库
     */
    function toPythonUrllib(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);

        let code = 'import urllib.request\nimport urllib.parse\n\n';

        // 处理 URL 和查询参数
        let urlVar = 'url';
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);
            code += `base_url = '${escapeString(baseUrl, 'python')}'\n\n`;

            if (Object.keys(params).length > 0) {
                code += 'params = {\n';
                for (const [key, value] of Object.entries(params)) {
                    code += `${i1}'${escapeString(key, 'python')}': '${escapeString(value, 'python')}',\n`;
                }
                code += '}\n\n';
                code += 'url = base_url + \'?\' + urllib.parse.urlencode(params)\n\n';
            } else {
                code += 'url = base_url\n\n';
            }
        } else {
            code += `url = '${escapeString(parsed.url, 'python')}'\n\n`;
        }

        if (parsed.data) {
            code += `data = '${escapeString(parsed.data, 'python')}'\n`;
            code += 'data = data.encode(\'utf-8\')\n\n';
        }

        code += `request = urllib.request.Request(url, method='${parsed.method}'`;
        if (parsed.data) {
            code += ', data=data';
        }
        code += ')\n\n';

        for (const [key, value] of Object.entries(parsed.headers)) {
            code += `request.add_header('${escapeString(key, 'python')}', '${escapeString(value, 'python')}')\n`;
        }

        code += '\nwith urllib.request.urlopen(request) as response:\n';
        code += `${i1}print(response.status)\n`;
        code += `${i1}print(response.read().decode('utf-8'))`;

        return code;
    }

    // 注册生成器
    window.CurlGenerators.python = {
        'python-requests': {
            name: 'Python - requests',
            generate: toPythonRequests
        },
        'python-httpx': {
            name: 'Python - httpx',
            generate: toPythonHttpx
        },
        'python-aiohttp': {
            name: 'Python - aiohttp',
            generate: toPythonAiohttp
        },
        'python-urllib': {
            name: 'Python - urllib',
            generate: toPythonUrllib
        }
    };

})();
