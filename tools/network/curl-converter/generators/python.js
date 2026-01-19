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

    const escapeStringBase = window.CurlGenerators.escapeString;
    const makeIndent = window.CurlGenerators.makeIndent;
    const getDefaultOptions = window.CurlGenerators.getDefaultOptions;
    const getQuote = window.CurlGenerators.getQuote;
    const getBaseUrl = window.CurlGenerators.getBaseUrl;

    /**
     * 包装字符串（带引号和转义）
     * @param {string} str - 要包装的字符串
     * @param {Object} opts - 选项
     * @returns {string} 带引号的字符串
     */
    function pyStr(str, opts) {
        const q = getQuote(opts);
        const escaped = escapeStringBase(str, 'python', opts);
        return `${q}${escaped}${q}`;
    }

    /**
     * 转义字符串（兼容旧调用）
     */
    function escapeString(str, lang, opts) {
        return escapeStringBase(str, lang, opts);
    }

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
            code += `url = ${pyStr(baseUrl, opts)}\n\n`;

            if (Object.keys(params).length > 0) {
                code += 'params = {\n';
                for (const [key, value] of Object.entries(params)) {
                    code += `${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
                }
                code += '}\n\n';
            }
        } else {
            code += `url = ${pyStr(parsed.url, opts)}\n\n`;
        }

        if (Object.keys(parsed.headers).length > 0) {
            code += 'headers = {\n';
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
            }
            code += '}\n\n';
        }

        if (parsed.cookies && Object.keys(parsed.cookies).length > 0) {
            code += 'cookies = {\n';
            for (const [key, value] of Object.entries(parsed.cookies)) {
                code += `${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
            }
            code += '}\n\n';
        }

        if (parsed.data) {
            code += `data = ${pyStr(parsed.data, opts)}\n\n`;
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
            code += `url = ${pyStr(baseUrl, opts)}\n\n`;

            if (Object.keys(params).length > 0) {
                code += 'params = {\n';
                for (const [key, value] of Object.entries(params)) {
                    code += `${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
                }
                code += '}\n\n';
            }
        } else {
            code += `url = ${pyStr(parsed.url, opts)}\n\n`;
        }

        if (Object.keys(parsed.headers).length > 0) {
            code += 'headers = {\n';
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
            }
            code += '}\n\n';
        }

        if (parsed.cookies && Object.keys(parsed.cookies).length > 0) {
            code += 'cookies = {\n';
            for (const [key, value] of Object.entries(parsed.cookies)) {
                code += `${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
            }
            code += '}\n\n';
        }

        if (parsed.data) {
            code += `data = ${pyStr(parsed.data, opts)}\n\n`;
        }

        code += `response = httpx.${parsed.method.toLowerCase()}(url`;
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
            code += `${i2}url = ${pyStr(baseUrl, opts)}\n\n`;

            if (Object.keys(params).length > 0) {
                code += `${i2}params = {\n`;
                for (const [key, value] of Object.entries(params)) {
                    code += `${i3}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
                }
                code += `${i2}}\n\n`;
            }
        } else {
            code += `${i2}url = ${pyStr(parsed.url, opts)}\n\n`;
        }

        if (Object.keys(parsed.headers).length > 0) {
            code += `${i2}headers = {\n`;
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `${i3}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
            }
            code += `${i2}}\n\n`;
        }

        if (parsed.cookies && Object.keys(parsed.cookies).length > 0) {
            code += `${i2}cookies = {\n`;
            for (const [key, value] of Object.entries(parsed.cookies)) {
                code += `${i3}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
            }
            code += `${i2}}\n\n`;
        }

        if (parsed.data) {
            code += `${i2}data = ${pyStr(parsed.data, opts)}\n\n`;
        }

        code += `${i2}async with session.${parsed.method.toLowerCase()}(url`;
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
        const q = getQuote(opts);

        let code = 'import urllib.request\nimport urllib.parse\n\n';

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);
            code += `base_url = ${pyStr(baseUrl, opts)}\n\n`;

            if (Object.keys(params).length > 0) {
                code += 'params = {\n';
                for (const [key, value] of Object.entries(params)) {
                    code += `${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
                }
                code += '}\n\n';
                code += `url = base_url + ${q}?${q} + urllib.parse.urlencode(params)\n\n`;
            } else {
                code += 'url = base_url\n\n';
            }
        } else {
            code += `url = ${pyStr(parsed.url, opts)}\n\n`;
        }

        if (parsed.data) {
            code += `data = ${pyStr(parsed.data, opts)}\n`;
            code += `data = data.encode(${q}utf-8${q})\n\n`;
        }

        code += `request = urllib.request.Request(url, method=${pyStr(parsed.method, opts)}`;
        if (parsed.data) {
            code += ', data=data';
        }
        code += ')\n\n';

        for (const [key, value] of Object.entries(parsed.headers)) {
            code += `request.add_header(${pyStr(key, opts)}, ${pyStr(value, opts)})\n`;
        }

        code += '\nwith urllib.request.urlopen(request) as response:\n';
        code += `${i1}print(response.status)\n`;
        code += `${i1}print(response.read().decode(${q}utf-8${q}))`;

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
            code += `${i2}url = ${pyStr(baseUrl, opts)}\n\n`;

            if (Object.keys(params).length > 0) {
                code += `${i2}params = {\n`;
                for (const [key, value] of Object.entries(params)) {
                    code += `${i2}${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
                }
                code += `${i2}}\n\n`;
            }
        } else {
            code += `${i2}url = ${pyStr(parsed.url, opts)}\n\n`;
        }

        if (Object.keys(parsed.headers).length > 0) {
            code += `${i2}headers = {\n`;
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `${i2}${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
            }
            code += `${i2}}\n\n`;
        }

        if (parsed.cookies && Object.keys(parsed.cookies).length > 0) {
            code += `${i2}cookies = {\n`;
            for (const [key, value] of Object.entries(parsed.cookies)) {
                code += `${i2}${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
            }
            code += `${i2}}\n\n`;
        }

        if (parsed.data) {
            code += `${i2}data = ${pyStr(parsed.data, opts)}\n\n`;
        }

        code += `${i2}response = await client.${parsed.method.toLowerCase()}(url`;
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
        code += `${i2}print(response.status_code)\n`;
        code += `${i2}print(response.text)\n\n`;
        code += 'asyncio.run(main())';

        return code;
    }

    /**
     * 将参数名转换为有效的 Python 变量名（Pydantic 兼容）
     * @param {string} name - 原始参数名
     * @returns {object} { varName: 有效的变量名, needsAlias: 是否需要别名 }
     */
    function toPythonVarName(name) {
        let varName = name;
        let needsAlias = false;

        // 1. 去除前导下划线（Pydantic 会把 _ 开头当私有属性）
        if (varName.startsWith('_')) {
            varName = varName.replace(/^_+/, '');
            needsAlias = true;
        }

        // 2. 替换无效字符为下划线
        const sanitized = varName.replace(/[^a-zA-Z0-9_]/g, '_');
        if (sanitized !== varName) {
            varName = sanitized;
            needsAlias = true;
        }

        // 3. 如果以数字开头，添加前缀
        if (/^[0-9]/.test(varName)) {
            varName = 'param_' + varName;
            needsAlias = true;
        }

        // 4. 如果为空，使用默认名
        if (!varName) {
            varName = 'param';
            needsAlias = true;
        }

        // 5. 处理 Python 关键字
        const pythonKeywords = ['False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
            'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
            'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not',
            'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'];
        if (pythonKeywords.includes(varName)) {
            varName = varName + '_param';
            needsAlias = true;
        }

        return { varName, needsAlias };
    }

    /**
     * 从字符串值推断 Python 类型
     * @param {string} value - 字符串值
     * @param {Object} opts - 选项（用于引号样式）
     * @returns {object} { pyType: Python类型, pyValue: Python格式的值 }
     */
    function inferPythonType(value, opts = {}) {
        const q = getQuote(opts);

        if (value === null || value === undefined || value === '') {
            return { pyType: 'str', pyValue: `${q}${q}` };
        }

        const strValue = String(value);

        // 1. 布尔值检测
        if (strValue.toLowerCase() === 'true') {
            return { pyType: 'bool', pyValue: 'True' };
        }
        if (strValue.toLowerCase() === 'false') {
            return { pyType: 'bool', pyValue: 'False' };
        }

        // 2. 整数检测（包括负数）
        if (/^-?\d+$/.test(strValue)) {
            // 检查是否超出 JavaScript 安全整数范围，超大数字保持字符串
            const num = parseInt(strValue, 10);
            if (Number.isSafeInteger(num)) {
                return { pyType: 'int', pyValue: strValue };
            }
            // 超大整数作为字符串处理
            return { pyType: 'str', pyValue: pyStr(strValue, opts) };
        }

        // 3. 浮点数检测
        if (/^-?\d+\.\d+$/.test(strValue)) {
            return { pyType: 'float', pyValue: strValue };
        }

        // 4. 默认为字符串
        return { pyType: 'str', pyValue: pyStr(strValue, opts) };
    }

    /**
     * 从 URI 路径生成有意义的名称
     * @param {string} path - URI 路径
     * @param {string} method - HTTP 方法
     * @returns {object} { className: PascalCase类名, funcName: snake_case函数名, baseName: 基础名称 }
     */
    function generateNamesFromPath(path, method) {
        // 提取路径段，过滤空段和版本号（如 v1, v2）
        const segments = path.split('/').filter(seg => {
            if (!seg) return false;
            if (/^v\d+$/i.test(seg)) return false;  // 过滤 v1, v2 等
            return true;
        });

        // 取最后 1-2 个有意义的路径段
        let meaningfulParts = segments.slice(-2);
        if (meaningfulParts.length === 0) {
            meaningfulParts = ['api'];
        }

        // 清理每个部分（移除特殊字符，保留字母数字）
        const cleanParts = meaningfulParts.map(part =>
            part.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '')
        ).filter(p => p);

        if (cleanParts.length === 0) {
            cleanParts.push('api');
        }

        // 生成 PascalCase 类名 (如 SeriesAweme)
        const className = cleanParts.map(part =>
            part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        ).join('');

        // 生成 snake_case 函数名 (如 get_series_aweme)
        const methodPrefix = method.toLowerCase();
        const funcName = methodPrefix + '_' + cleanParts.map(p => p.toLowerCase()).join('_');

        return { className, funcName, baseName: cleanParts.join('_') };
    }

    /**
     * Python - FastAPI + httpx 异步 API
     */
    function toPythonFastAPIHttpx(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const i2 = makeIndent(2, opts);
        const q = getQuote(opts);

        // 从 URL 提取完整路径作为 API 端点
        let apiPath = '/proxy';
        let targetBaseUrl = '';
        try {
            const urlObj = new URL(parsed.url);
            apiPath = urlObj.pathname || '/proxy';
            targetBaseUrl = `${urlObj.protocol}//${urlObj.host}`;
        } catch (e) {}

        // 从路径生成有意义的名称
        const { className, funcName } = generateNamesFromPath(apiPath, parsed.method);
        const responseModelName = className + 'Response';
        const queryParamsName = className + 'Params';

        // 提取查询参数
        const queryParams = extractQueryParams(parsed.url);
        const hasQueryParams = Object.keys(queryParams).length > 0;

        // 生成参数名映射（原始名 -> Python 变量名）
        const paramNameMap = {};
        let hasAnyAlias = false;
        for (const key of Object.keys(queryParams)) {
            const { varName, needsAlias } = toPythonVarName(key);
            paramNameMap[key] = { varName, needsAlias };
            if (needsAlias) hasAnyAlias = true;
        }

        // 文件头注释（docstring 固定使用三引号）
        let code = '"""\n';
        code += `FastAPI 代理接口 - ${apiPath}\n`;
        code += `目标地址: ${targetBaseUrl}${apiPath}\n`;
        code += `HTTP 方法: ${parsed.method}\n`;
        code += '"""\n\n';

        code += 'from fastapi import FastAPI, HTTPException, Depends\n';
        code += 'from pydantic import BaseModel, ConfigDict';
        if (hasAnyAlias) {
            code += ', Field';
        }
        code += '\n';
        code += 'import httpx\n';
        code += 'from typing import Any\n\n';

        code += 'app = FastAPI(\n';
        code += `${i1}title=${q}${className} API${q},\n`;
        code += `${i1}description=${q}代理请求到 ${targetBaseUrl}${q},\n`;
        code += `${i1}version=${q}1.0.0${q}\n`;
        code += ')\n\n';

        // 生成查询参数 Pydantic 模型
        if (hasQueryParams) {
            code += '# 查询参数模型\n';
            code += `class ${queryParamsName}(BaseModel):\n`;
            code += `${i1}model_config = ConfigDict(populate_by_name=True)\n\n`;

            for (const [key, value] of Object.entries(queryParams)) {
                const { varName, needsAlias } = paramNameMap[key];
                const { pyType, pyValue } = inferPythonType(value, opts);
                if (needsAlias) {
                    code += `${i1}${varName}: ${pyType} = Field(default=${pyValue}, alias=${pyStr(key, opts)})\n`;
                } else {
                    code += `${i1}${varName}: ${pyType} = ${pyValue}\n`;
                }
            }
            code += '\n';
        }

        // 如果有请求体，生成 Pydantic 模型
        const requestBodyName = className + 'Request';
        if (parsed.data && parsed.dataType === 'json') {
            code += '# 请求体模型\n';
            code += `class ${requestBodyName}(BaseModel):\n`;
            try {
                const jsonData = JSON.parse(parsed.data);
                for (const [key, value] of Object.entries(jsonData)) {
                    const pyType = getPythonType(value);
                    const { varName } = toPythonVarName(key);
                    code += `${i1}${varName}: ${pyType}\n`;
                }
            } catch (e) {
                code += `${i1}data: str\n`;
            }
            code += '\n';
        }

        code += '# 响应模型\n';
        code += `class ${responseModelName}(BaseModel):\n`;
        code += `${i1}status_code: int\n`;
        code += `${i1}data: Any\n\n`;

        // 生成 API 端点
        const methodDecorator = parsed.method.toLowerCase();
        code += `@app.${methodDecorator}(${q}${apiPath}${q}, response_model=${responseModelName})\n`;

        // 构建函数签名
        let funcParams = [];
        if (hasQueryParams) {
            funcParams.push(`params: ${queryParamsName} = Depends()`);
        }
        if (parsed.data && parsed.dataType === 'json') {
            funcParams.push(`body: ${requestBodyName}`);
        }
        code += `async def ${funcName}(${funcParams.join(', ')}):\n`;

        code += `${i1}"""\n`;
        code += `${i1}代理请求到: ${targetBaseUrl}${apiPath}\n`;
        code += `${i1}"""\n`;

        // 目标 URL（函数内部定义，便于修改）
        code += `${i1}target_url = ${pyStr(targetBaseUrl + apiPath, opts)}\n\n`;

        // 使用 model_dump 转换查询参数
        if (hasQueryParams) {
            code += `${i1}# 将查询参数模型转换为字典\n`;
            code += `${i1}query_params = params.model_dump(by_alias=True, exclude_none=True)\n\n`;
        }

        // Headers
        if (Object.keys(parsed.headers).length > 0) {
            code += `${i1}headers = {\n`;
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `${i2}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
            }
            code += `${i1}}\n\n`;
        }

        code += `${i1}async with httpx.AsyncClient(timeout=30.0) as client:\n`;
        code += `${i2}try:\n`;
        code += `${i2}${i1}response = await client.${parsed.method.toLowerCase()}(\n`;
        code += `${i2}${i2}target_url,\n`;
        if (hasQueryParams) {
            code += `${i2}${i2}params=query_params,\n`;
        }
        if (Object.keys(parsed.headers).length > 0) {
            code += `${i2}${i2}headers=headers,\n`;
        }
        if (parsed.data && parsed.dataType === 'json') {
            code += `${i2}${i2}json=body.model_dump(),\n`;
        } else if (parsed.data) {
            code += `${i2}${i2}data=${pyStr(parsed.data, opts)},\n`;
        }
        code += `${i2}${i1})\n`;
        code += `${i2}${i1}response.raise_for_status()\n\n`;

        code += `${i2}${i1}# 解析响应\n`;
        code += `${i2}${i1}try:\n`;
        code += `${i2}${i2}data = response.json()\n`;
        code += `${i2}${i1}except Exception:\n`;
        code += `${i2}${i2}data = response.text\n\n`;

        code += `${i2}${i1}return ${responseModelName}(status_code=response.status_code, data=data)\n\n`;

        code += `${i2}except httpx.HTTPStatusError as e:\n`;
        code += `${i2}${i1}raise HTTPException(status_code=e.response.status_code, detail=e.response.text)\n`;
        code += `${i2}except httpx.RequestError as e:\n`;
        code += `${i2}${i1}raise HTTPException(status_code=500, detail=f${q}请求失败: {e}${q})\n\n\n`;

        // 添加 main 入口
        code += 'if __name__ == "__main__":\n';
        code += `${i1}import uvicorn\n`;
        code += `${i1}# 直接运行: python main.py\n`;
        code += `${i1}# 访问文档: http://127.0.0.1:8000/docs\n`;
        code += `${i1}uvicorn.run(app, host=${q}0.0.0.0${q}, port=8000)\n`;

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

    /**
     * Python - curl_cffi 库 (同步)
     * @see https://github.com/lexiforest/curl_cffi
     */
    function toPythonCurlCffi(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const q = getQuote(opts);

        let code = 'from curl_cffi.requests import Session\n\n';

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);
            code += `url = ${pyStr(baseUrl, opts)}\n\n`;

            if (Object.keys(params).length > 0) {
                code += 'params = {\n';
                for (const [key, value] of Object.entries(params)) {
                    code += `${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
                }
                code += '}\n\n';
            }
        } else {
            code += `url = ${pyStr(parsed.url, opts)}\n\n`;
        }

        if (Object.keys(parsed.headers).length > 0) {
            code += 'headers = {\n';
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
            }
            code += '}\n\n';
        }

        if (parsed.cookies && Object.keys(parsed.cookies).length > 0) {
            code += 'cookies = {\n';
            for (const [key, value] of Object.entries(parsed.cookies)) {
                code += `${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
            }
            code += '}\n\n';
        }

        if (parsed.data) {
            code += `data = ${pyStr(parsed.data, opts)}\n\n`;
        }

        code += 'with Session() as session:\n';
        code += `${i1}response = session.${parsed.method.toLowerCase()}(\n`;
        code += `${i1}${i1}url,\n`;
        code += `${i1}${i1}impersonate=${q}chrome${q},\n`;
        if (opts.useParamsDict && Object.keys(extractQueryParams(parsed.url)).length > 0) {
            code += `${i1}${i1}params=params,\n`;
        }
        if (Object.keys(parsed.headers).length > 0) {
            code += `${i1}${i1}headers=headers,\n`;
        }
        if (parsed.cookies && Object.keys(parsed.cookies).length > 0) {
            code += `${i1}${i1}cookies=cookies,\n`;
        }
        if (parsed.data) {
            code += `${i1}${i1}data=data,\n`;
        }
        code += `${i1})\n\n`;
        code += `${i1}print(response.status_code)\n`;
        code += `${i1}print(response.text)`;

        return code;
    }

    /**
     * Python - curl_cffi 库 (异步)
     * @see https://github.com/lexiforest/curl_cffi
     */
    function toPythonCurlCffiAsync(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const i2 = makeIndent(2, opts);
        const q = getQuote(opts);

        let code = 'from curl_cffi import AsyncSession\nimport asyncio\n\n';
        code += 'async def main():\n';
        code += `${i1}async with AsyncSession() as session:\n`;

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);
            code += `${i2}url = ${pyStr(baseUrl, opts)}\n\n`;

            if (Object.keys(params).length > 0) {
                code += `${i2}params = {\n`;
                for (const [key, value] of Object.entries(params)) {
                    code += `${i2}${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
                }
                code += `${i2}}\n\n`;
            }
        } else {
            code += `${i2}url = ${pyStr(parsed.url, opts)}\n\n`;
        }

        if (Object.keys(parsed.headers).length > 0) {
            code += `${i2}headers = {\n`;
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `${i2}${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
            }
            code += `${i2}}\n\n`;
        }

        if (parsed.cookies && Object.keys(parsed.cookies).length > 0) {
            code += `${i2}cookies = {\n`;
            for (const [key, value] of Object.entries(parsed.cookies)) {
                code += `${i2}${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
            }
            code += `${i2}}\n\n`;
        }

        if (parsed.data) {
            code += `${i2}data = ${pyStr(parsed.data, opts)}\n\n`;
        }

        code += `${i2}response = await session.${parsed.method.toLowerCase()}(\n`;
        code += `${i2}${i1}url,\n`;
        code += `${i2}${i1}impersonate=${q}chrome${q},\n`;
        if (opts.useParamsDict && Object.keys(extractQueryParams(parsed.url)).length > 0) {
            code += `${i2}${i1}params=params,\n`;
        }
        if (Object.keys(parsed.headers).length > 0) {
            code += `${i2}${i1}headers=headers,\n`;
        }
        if (parsed.cookies && Object.keys(parsed.cookies).length > 0) {
            code += `${i2}${i1}cookies=cookies,\n`;
        }
        if (parsed.data) {
            code += `${i2}${i1}data=data,\n`;
        }
        code += `${i2})\n\n`;
        code += `${i2}print(response.status_code)\n`;
        code += `${i2}print(response.text)\n\n`;
        code += 'asyncio.run(main())';

        return code;
    }

    /**
     * Python - rnet 库 (同步)
     * @see https://github.com/0x676e67/rnet
     */
    function toPythonRnet(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const q = getQuote(opts);

        let code = 'from rnet import BlockingClient, Impersonate\n\n';

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);
            code += `url = ${pyStr(baseUrl, opts)}\n\n`;

            if (Object.keys(params).length > 0) {
                code += 'params = {\n';
                for (const [key, value] of Object.entries(params)) {
                    code += `${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
                }
                code += '}\n\n';
            }
        } else {
            code += `url = ${pyStr(parsed.url, opts)}\n\n`;
        }

        if (Object.keys(parsed.headers).length > 0) {
            code += 'headers = {\n';
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
            }
            code += '}\n\n';
        }

        if (parsed.cookies && Object.keys(parsed.cookies).length > 0) {
            code += 'cookies = {\n';
            for (const [key, value] of Object.entries(parsed.cookies)) {
                code += `${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
            }
            code += '}\n\n';
        }

        if (parsed.data) {
            code += `data = ${pyStr(parsed.data, opts)}\n\n`;
        }

        code += '# 创建带有浏览器指纹模拟的客户端\n';
        code += 'client = BlockingClient(impersonate=Impersonate.Chrome136)\n\n';

        code += `response = client.${parsed.method.toLowerCase()}(\n`;
        code += `${i1}url,\n`;
        if (opts.useParamsDict && Object.keys(extractQueryParams(parsed.url)).length > 0) {
            code += `${i1}params=params,\n`;
        }
        if (Object.keys(parsed.headers).length > 0) {
            code += `${i1}headers=headers,\n`;
        }
        if (parsed.cookies && Object.keys(parsed.cookies).length > 0) {
            code += `${i1}cookies=cookies,\n`;
        }
        if (parsed.data) {
            code += `${i1}body=data,\n`;
        }
        code += ')\n\n';
        code += 'print(response.status_code)\n';
        code += 'print(response.text())';

        return code;
    }

    /**
     * Python - rnet 库 (异步)
     * @see https://github.com/0x676e67/rnet
     */
    function toPythonRnetAsync(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const i2 = makeIndent(2, opts);
        const q = getQuote(opts);

        let code = 'from rnet import Client, Impersonate\nimport asyncio\n\n';
        code += 'async def main():\n';
        code += `${i1}# 创建带有浏览器指纹模拟的客户端\n`;
        code += `${i1}client = Client(impersonate=Impersonate.Chrome136)\n\n`;

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);
            code += `${i1}url = ${pyStr(baseUrl, opts)}\n\n`;

            if (Object.keys(params).length > 0) {
                code += `${i1}params = {\n`;
                for (const [key, value] of Object.entries(params)) {
                    code += `${i1}${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
                }
                code += `${i1}}\n\n`;
            }
        } else {
            code += `${i1}url = ${pyStr(parsed.url, opts)}\n\n`;
        }

        if (Object.keys(parsed.headers).length > 0) {
            code += `${i1}headers = {\n`;
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `${i1}${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
            }
            code += `${i1}}\n\n`;
        }

        if (parsed.cookies && Object.keys(parsed.cookies).length > 0) {
            code += `${i1}cookies = {\n`;
            for (const [key, value] of Object.entries(parsed.cookies)) {
                code += `${i1}${i1}${pyStr(key, opts)}: ${pyStr(value, opts)},\n`;
            }
            code += `${i1}}\n\n`;
        }

        if (parsed.data) {
            code += `${i1}data = ${pyStr(parsed.data, opts)}\n\n`;
        }

        code += `${i1}response = await client.${parsed.method.toLowerCase()}(\n`;
        code += `${i1}${i1}url,\n`;
        if (opts.useParamsDict && Object.keys(extractQueryParams(parsed.url)).length > 0) {
            code += `${i1}${i1}params=params,\n`;
        }
        if (Object.keys(parsed.headers).length > 0) {
            code += `${i1}${i1}headers=headers,\n`;
        }
        if (parsed.cookies && Object.keys(parsed.cookies).length > 0) {
            code += `${i1}${i1}cookies=cookies,\n`;
        }
        if (parsed.data) {
            code += `${i1}${i1}body=data,\n`;
        }
        code += `${i1})\n\n`;
        code += `${i1}print(response.status_code)\n`;
        code += `${i1}print(await response.text())\n\n`;
        code += 'asyncio.run(main())';

        return code;
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
        'python-curl-cffi': {
            name: 'Python - curl_cffi (同步)',
            generate: toPythonCurlCffi
        },
        'python-curl-cffi-async': {
            name: 'Python - curl_cffi (异步)',
            generate: toPythonCurlCffiAsync
        },
        'python-rnet': {
            name: 'Python - rnet (同步)',
            generate: toPythonRnet
        },
        'python-rnet-async': {
            name: 'Python - rnet (异步)',
            generate: toPythonRnetAsync
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
