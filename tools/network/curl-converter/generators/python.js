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

    /**
     * Python - httpx 库 (异步)
     */
    function toPythonHttpxAsync(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const i2 = makeIndent(2, opts);

        let code = 'import httpx\nimport asyncio\n\n';
        code += 'async def main():\n';
        code += `${i1}async with httpx.AsyncClient() as client:\n`;

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);
            code += `${i2}url = '${escapeString(baseUrl, 'python')}'\n\n`;

            if (Object.keys(params).length > 0) {
                code += `${i2}params = {\n`;
                for (const [key, value] of Object.entries(params)) {
                    code += `${i2}${i1}'${escapeString(key, 'python')}': '${escapeString(value, 'python')}',\n`;
                }
                code += `${i2}}\n\n`;
            }
        } else {
            code += `${i2}url = '${escapeString(parsed.url, 'python')}'\n\n`;
        }

        if (Object.keys(parsed.headers).length > 0) {
            code += `${i2}headers = {\n`;
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `${i2}${i1}'${escapeString(key, 'python')}': '${escapeString(value, 'python')}',\n`;
            }
            code += `${i2}}\n\n`;
        }

        if (parsed.data) {
            code += `${i2}data = '${escapeString(parsed.data, 'python')}'\n\n`;
        }

        code += `${i2}response = await client.${parsed.method.toLowerCase()}(url`;
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
        code += `${i2}print(response.status_code)\n`;
        code += `${i2}print(response.text)\n\n`;
        code += 'asyncio.run(main())';

        return code;
    }

    /**
     * Python - FastAPI + httpx 异步 API
     */
    function toPythonFastAPIHttpx(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const i2 = makeIndent(2, opts);

        // 从 URL 提取路径作为 API 端点
        let apiPath = '/proxy';
        try {
            const urlObj = new URL(parsed.url);
            // 使用最后一段路径作为端点名
            const pathParts = urlObj.pathname.split('/').filter(p => p);
            if (pathParts.length > 0) {
                apiPath = '/' + pathParts[pathParts.length - 1];
            }
        } catch (e) {}

        let code = 'from fastapi import FastAPI, HTTPException\n';
        code += 'from pydantic import BaseModel\n';
        code += 'import httpx\n';
        code += 'from typing import Optional, Any\n\n';

        code += 'app = FastAPI()\n\n';

        // 如果有请求体，生成 Pydantic 模型
        if (parsed.data && parsed.dataType === 'json') {
            code += '# 请求体模型\n';
            code += 'class RequestBody(BaseModel):\n';
            try {
                const jsonData = JSON.parse(parsed.data);
                for (const [key, value] of Object.entries(jsonData)) {
                    const pyType = getPythonType(value);
                    code += `${i1}${key}: ${pyType}\n`;
                }
            } catch (e) {
                code += `${i1}data: str\n`;
            }
            code += '\n';
        }

        code += '# 响应模型\n';
        code += 'class ProxyResponse(BaseModel):\n';
        code += `${i1}status_code: int\n`;
        code += `${i1}data: Any\n\n`;

        // 生成 API 端点
        const methodDecorator = parsed.method.toLowerCase();
        code += `@app.${methodDecorator}("${apiPath}", response_model=ProxyResponse)\n`;

        if (parsed.data && parsed.dataType === 'json') {
            code += `async def proxy_request(body: RequestBody):\n`;
        } else {
            code += `async def proxy_request():\n`;
        }

        code += `${i1}"""\n`;
        code += `${i1}代理请求到目标 API\n`;
        code += `${i1}"""\n`;

        // URL
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);
            code += `${i1}url = '${escapeString(baseUrl, 'python')}'\n\n`;

            if (Object.keys(params).length > 0) {
                code += `${i1}params = {\n`;
                for (const [key, value] of Object.entries(params)) {
                    code += `${i2}'${escapeString(key, 'python')}': '${escapeString(value, 'python')}',\n`;
                }
                code += `${i1}}\n\n`;
            }
        } else {
            code += `${i1}url = '${escapeString(parsed.url, 'python')}'\n\n`;
        }

        // Headers
        if (Object.keys(parsed.headers).length > 0) {
            code += `${i1}headers = {\n`;
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `${i2}'${escapeString(key, 'python')}': '${escapeString(value, 'python')}',\n`;
            }
            code += `${i1}}\n\n`;
        }

        code += `${i1}async with httpx.AsyncClient() as client:\n`;
        code += `${i2}try:\n`;
        code += `${i2}${i1}response = await client.${parsed.method.toLowerCase()}(\n`;
        code += `${i2}${i2}url,\n`;
        if (opts.useParamsDict && Object.keys(extractQueryParams(parsed.url)).length > 0) {
            code += `${i2}${i2}params=params,\n`;
        }
        if (Object.keys(parsed.headers).length > 0) {
            code += `${i2}${i2}headers=headers,\n`;
        }
        if (parsed.data && parsed.dataType === 'json') {
            code += `${i2}${i2}json=body.model_dump(),\n`;
        } else if (parsed.data) {
            code += `${i2}${i2}data='${escapeString(parsed.data, 'python')}',\n`;
        }
        code += `${i2}${i1})\n`;
        code += `${i2}${i1}response.raise_for_status()\n\n`;

        code += `${i2}${i1}# 尝试解析 JSON 响应\n`;
        code += `${i2}${i1}try:\n`;
        code += `${i2}${i2}data = response.json()\n`;
        code += `${i2}${i1}except:\n`;
        code += `${i2}${i2}data = response.text\n\n`;

        code += `${i2}${i1}return ProxyResponse(status_code=response.status_code, data=data)\n\n`;

        code += `${i2}except httpx.HTTPStatusError as e:\n`;
        code += `${i2}${i1}raise HTTPException(status_code=e.response.status_code, detail=str(e))\n`;
        code += `${i2}except httpx.RequestError as e:\n`;
        code += `${i2}${i1}raise HTTPException(status_code=500, detail=f"请求失败: {str(e)}")\n\n`;

        code += '\n# 运行: uvicorn main:app --reload';

        return code;
    }

    /**
     * 获取 Python 类型
     */
    function getPythonType(value) {
        if (value === null) return 'Optional[Any]';
        if (typeof value === 'boolean') return 'bool';
        if (typeof value === 'number') {
            return Number.isInteger(value) ? 'int' : 'float';
        }
        if (Array.isArray(value)) return 'list';
        if (typeof value === 'object') return 'dict';
        return 'str';
    }

    // 注册生成器
    window.CurlGenerators.python = {
        'python-requests': {
            name: 'Python - requests',
            generate: toPythonRequests
        },
        'python-httpx': {
            name: 'Python - httpx (同步)',
            generate: toPythonHttpx
        },
        'python-httpx-async': {
            name: 'Python - httpx (异步)',
            generate: toPythonHttpxAsync
        },
        'python-aiohttp': {
            name: 'Python - aiohttp',
            generate: toPythonAiohttp
        },
        'python-urllib': {
            name: 'Python - urllib',
            generate: toPythonUrllib
        },
        'python-fastapi-httpx': {
            name: 'Python - FastAPI + httpx',
            generate: toPythonFastAPIHttpx
        }
    };

})();
