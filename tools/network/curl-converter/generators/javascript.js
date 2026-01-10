/**
 * cURL 代码生成器 - JavaScript/Node.js
 * @description 生成 JavaScript 和 Node.js HTTP 请求代码
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
     */
    function jsStr(str, opts) {
        const q = getQuote(opts);
        const escaped = escapeStringBase(str, 'javascript', opts);
        return `${q}${escaped}${q}`;
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
     * JavaScript - Fetch API
     */
    function toJsFetch(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const i2 = makeIndent(2, opts);

        let code = '';

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);

            if (Object.keys(params).length > 0) {
                code += `const baseUrl = ${jsStr(baseUrl, opts)};\n`;
                code += 'const params = new URLSearchParams({\n';
                for (const [key, value] of Object.entries(params)) {
                    code += `${i1}${jsStr(key, opts)}: ${jsStr(value, opts)},\n`;
                }
                code += '});\n';
                code += 'const url = `${baseUrl}?${params.toString()}`;\n\n';
            } else {
                code += `const url = ${jsStr(baseUrl, opts)};\n\n`;
            }
        } else {
            code += `const url = ${jsStr(parsed.url, opts)};\n\n`;
        }

        code += 'fetch(url, {\n';
        code += `${i1}method: ${jsStr(parsed.method, opts)},\n`;

        if (Object.keys(parsed.headers).length > 0) {
            code += `${i1}headers: {\n`;
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `${i2}${jsStr(key, opts)}: ${jsStr(value, opts)},\n`;
            }
            code += `${i1}},\n`;
        }

        if (parsed.data) {
            code += `${i1}body: ${jsStr(parsed.data, opts)},\n`;
        }

        code += '})\n';
        code += '.then(response => response.json())\n';
        code += '.then(data => console.log(data))\n';
        code += '.catch(error => console.error(error));';

        return code;
    }

    /**
     * JavaScript - Axios
     */
    function toJsAxios(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const i2 = makeIndent(2, opts);

        let code = '';

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);

            code += 'axios({\n';
            code += `${i1}method: ${jsStr(parsed.method.toLowerCase(), opts)},\n`;
            code += `${i1}url: ${jsStr(baseUrl, opts)},\n`;

            if (Object.keys(params).length > 0) {
                code += `${i1}params: {\n`;
                for (const [key, value] of Object.entries(params)) {
                    code += `${i2}${jsStr(key, opts)}: ${jsStr(value, opts)},\n`;
                }
                code += `${i1}},\n`;
            }
        } else {
            code += 'axios({\n';
            code += `${i1}method: ${jsStr(parsed.method.toLowerCase(), opts)},\n`;
            code += `${i1}url: ${jsStr(parsed.url, opts)},\n`;
        }

        if (Object.keys(parsed.headers).length > 0) {
            code += `${i1}headers: {\n`;
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `${i2}${jsStr(key, opts)}: ${jsStr(value, opts)},\n`;
            }
            code += `${i1}},\n`;
        }

        if (parsed.data) {
            code += `${i1}data: ${jsStr(parsed.data, opts)},\n`;
        }

        code += '})\n';
        code += '.then(response => console.log(response.data))\n';
        code += '.catch(error => console.error(error));';

        return code;
    }

    /**
     * JavaScript - XMLHttpRequest
     */
    function toJsXhr(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);

        let code = '';

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);

            if (Object.keys(params).length > 0) {
                code += `var baseUrl = ${jsStr(baseUrl, opts)};\n`;
                code += 'var params = new URLSearchParams({\n';
                for (const [key, value] of Object.entries(params)) {
                    code += `${i1}${jsStr(key, opts)}: ${jsStr(value, opts)},\n`;
                }
                code += '});\n';
                const q = getQuote(opts);
                code += `var url = baseUrl + ${q}?${q} + params.toString();\n\n`;
            } else {
                code += `var url = ${jsStr(baseUrl, opts)};\n\n`;
            }
        } else {
            code += `var url = ${jsStr(parsed.url, opts)};\n\n`;
        }

        code += 'var xhr = new XMLHttpRequest();\n';
        code += `xhr.open(${jsStr(parsed.method, opts)}, url);\n\n`;

        for (const [key, value] of Object.entries(parsed.headers)) {
            code += `xhr.setRequestHeader(${jsStr(key, opts)}, ${jsStr(value, opts)});\n`;
        }

        code += '\nxhr.onreadystatechange = function() {\n';
        code += `${i1}if (xhr.readyState === 4) {\n`;
        code += `${i1}${i1}console.log(xhr.status);\n`;
        code += `${i1}${i1}console.log(xhr.responseText);\n`;
        code += `${i1}}\n`;
        code += '};\n\n';

        if (parsed.data) {
            code += `xhr.send(${jsStr(parsed.data, opts)});`;
        } else {
            code += 'xhr.send();';
        }

        return code;
    }

    /**
     * Node.js - Axios
     */
    function toNodeAxios(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const i2 = makeIndent(2, opts);
        const q = getQuote(opts);

        let code = `const axios = require(${q}axios${q});\n\n`;

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);

            code += 'axios({\n';
            code += `${i1}method: ${jsStr(parsed.method.toLowerCase(), opts)},\n`;
            code += `${i1}url: ${jsStr(baseUrl, opts)},\n`;

            if (Object.keys(params).length > 0) {
                code += `${i1}params: {\n`;
                for (const [key, value] of Object.entries(params)) {
                    code += `${i2}${jsStr(key, opts)}: ${jsStr(value, opts)},\n`;
                }
                code += `${i1}},\n`;
            }
        } else {
            code += 'axios({\n';
            code += `${i1}method: ${jsStr(parsed.method.toLowerCase(), opts)},\n`;
            code += `${i1}url: ${jsStr(parsed.url, opts)},\n`;
        }

        if (Object.keys(parsed.headers).length > 0) {
            code += `${i1}headers: {\n`;
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `${i2}${jsStr(key, opts)}: ${jsStr(value, opts)},\n`;
            }
            code += `${i1}},\n`;
        }

        if (parsed.data) {
            code += `${i1}data: ${jsStr(parsed.data, opts)},\n`;
        }

        code += '})\n';
        code += '.then(response => console.log(response.data))\n';
        code += '.catch(error => console.error(error));';

        return code;
    }

    /**
     * Node.js - node-fetch
     */
    function toNodeFetch(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const i2 = makeIndent(2, opts);
        const q = getQuote(opts);

        let code = `const fetch = require(${q}node-fetch${q});\n\n`;

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);

            if (Object.keys(params).length > 0) {
                code += `const baseUrl = ${jsStr(baseUrl, opts)};\n`;
                code += 'const params = new URLSearchParams({\n';
                for (const [key, value] of Object.entries(params)) {
                    code += `${i1}${jsStr(key, opts)}: ${jsStr(value, opts)},\n`;
                }
                code += '});\n';
                code += 'const url = `${baseUrl}?${params.toString()}`;\n\n';
            } else {
                code += `const url = ${jsStr(baseUrl, opts)};\n\n`;
            }
        } else {
            code += `const url = ${jsStr(parsed.url, opts)};\n\n`;
        }

        code += 'fetch(url, {\n';
        code += `${i1}method: ${jsStr(parsed.method, opts)},\n`;

        if (Object.keys(parsed.headers).length > 0) {
            code += `${i1}headers: {\n`;
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `${i2}${jsStr(key, opts)}: ${jsStr(value, opts)},\n`;
            }
            code += `${i1}},\n`;
        }

        if (parsed.data) {
            code += `${i1}body: ${jsStr(parsed.data, opts)},\n`;
        }

        code += '})\n';
        code += '.then(response => response.json())\n';
        code += '.then(data => console.log(data))\n';
        code += '.catch(error => console.error(error));';

        return code;
    }

    /**
     * Node.js - http/https 模块
     */
    function toNodeHttp(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const i2 = makeIndent(2, opts);
        const q = getQuote(opts);

        const isHttps = parsed.url.startsWith('https');
        let code = `const ${isHttps ? 'https' : 'http'} = require(${q}${isHttps ? 'https' : 'http'}${q});\n`;

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);

            code += `const { URL } = require(${q}url${q});\n\n`;

            if (Object.keys(params).length > 0) {
                code += `const baseUrl = ${jsStr(baseUrl, opts)};\n`;
                code += 'const params = {\n';
                for (const [key, value] of Object.entries(params)) {
                    code += `${i1}${jsStr(key, opts)}: ${jsStr(value, opts)},\n`;
                }
                code += '};\n';
                code += 'const urlObj = new URL(baseUrl);\n';
                code += 'Object.keys(params).forEach(key => urlObj.searchParams.append(key, params[key]));\n';
                code += 'const url = urlObj.toString();\n\n';
            } else {
                code += `const url = ${jsStr(baseUrl, opts)};\n\n`;
            }
        } else {
            code += '\n';
            code += `const url = ${jsStr(parsed.url, opts)};\n\n`;
        }

        code += 'const options = {\n';
        code += `${i1}method: ${jsStr(parsed.method, opts)},\n`;

        if (Object.keys(parsed.headers).length > 0) {
            code += `${i1}headers: {\n`;
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `${i2}${jsStr(key, opts)}: ${jsStr(value, opts)},\n`;
            }
            code += `${i1}},\n`;
        }

        code += '};\n\n';

        code += `const req = ${isHttps ? 'https' : 'http'}.request(url, options, (res) => {\n`;
        code += `${i1}let data = ${q}${q};\n\n`;
        code += `${i1}res.on(${q}data${q}, (chunk) => {\n`;
        code += `${i2}data += chunk;\n`;
        code += `${i1}});\n\n`;
        code += `${i1}res.on(${q}end${q}, () => {\n`;
        code += `${i2}console.log(res.statusCode);\n`;
        code += `${i2}console.log(data);\n`;
        code += `${i1}});\n`;
        code += '});\n\n';

        code += `req.on(${q}error${q}, (error) => {\n`;
        code += `${i1}console.error(error);\n`;
        code += '});\n\n';

        if (parsed.data) {
            code += `req.write(${jsStr(parsed.data, opts)});\n`;
        }

        code += 'req.end();';

        return code;
    }

    // 注册生成器
    window.CurlGenerators.javascript = {
        'js-fetch': {
            name: 'JavaScript - Fetch',
            generate: toJsFetch
        },
        'js-axios': {
            name: 'JavaScript - Axios',
            generate: toJsAxios
        },
        'js-xhr': {
            name: 'JavaScript - XHR',
            generate: toJsXhr
        },
        'node-axios': {
            name: 'Node.js - Axios',
            generate: toNodeAxios
        },
        'node-fetch': {
            name: 'Node.js - node-fetch',
            generate: toNodeFetch
        },
        'node-http': {
            name: 'Node.js - http',
            generate: toNodeHttp
        }
    };

})();
