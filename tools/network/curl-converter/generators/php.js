/**
 * cURL 代码生成器 - PHP
 * @description 生成 PHP HTTP 请求代码
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
    const getBaseUrl = window.CurlGenerators.getBaseUrl;
    const getQuote = window.CurlGenerators.getQuote;

    /**
     * 包装字符串（带引号和转义）
     */
    function phpStr(str, opts) {
        const q = getQuote(opts);
        const escaped = escapeStringBase(str, 'php', opts);
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
     * PHP - cURL
     */
    function toPhpCurl(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const q = getQuote(opts);

        let code = '<?php\n\n';
        code += '$ch = curl_init();\n\n';

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);

            if (Object.keys(params).length > 0) {
                code += `$baseUrl = ${phpStr(baseUrl, opts)};\n`;
                code += '$params = [\n';
                for (const [key, value] of Object.entries(params)) {
                    code += `${i1}${phpStr(key, opts)} => ${phpStr(value, opts)},\n`;
                }
                code += '];\n';
                code += `$url = $baseUrl . ${q}?${q} . http_build_query($params);\n\n`;
            } else {
                code += `$url = ${phpStr(baseUrl, opts)};\n\n`;
            }
        } else {
            code += `$url = ${phpStr(parsed.url, opts)};\n\n`;
        }

        code += 'curl_setopt($ch, CURLOPT_URL, $url);\n';
        code += 'curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n';

        if (parsed.method !== 'GET') {
            code += `curl_setopt($ch, CURLOPT_CUSTOMREQUEST, ${phpStr(parsed.method, opts)});\n`;
        }

        if (Object.keys(parsed.headers).length > 0) {
            code += '\ncurl_setopt($ch, CURLOPT_HTTPHEADER, [\n';
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `${i1}${phpStr(key + ': ' + value, opts)},\n`;
            }
            code += ']);\n';
        }

        if (parsed.data) {
            code += `\ncurl_setopt($ch, CURLOPT_POSTFIELDS, ${phpStr(parsed.data, opts)});\n`;
        }

        code += '\n$response = curl_exec($ch);\n';
        code += '$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);\n';
        code += 'curl_close($ch);\n\n';
        code += 'echo "Status: " . $httpCode . "\\n";\n';
        code += 'echo $response;\n';
        code += '?>';

        return code;
    }

    /**
     * PHP - Guzzle
     */
    function toPhpGuzzle(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const i2 = makeIndent(2, opts);
        const q = getQuote(opts);

        let code = '<?php\n\n';
        code += `require ${q}vendor/autoload.php${q};\n\n`;
        code += 'use GuzzleHttp\\Client;\n\n';
        code += '$client = new Client();\n\n';

        // 处理 URL 和查询参数
        let urlCode;
        let hasQueryParams = false;
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);

            if (Object.keys(params).length > 0) {
                hasQueryParams = true;
                urlCode = baseUrl;
            } else {
                urlCode = baseUrl;
            }
        } else {
            urlCode = parsed.url;
        }

        code += `$response = $client->request(${phpStr(parsed.method, opts)}, ${phpStr(urlCode, opts)}`;

        const hasOptions = Object.keys(parsed.headers).length > 0 || parsed.data || hasQueryParams;
        if (hasOptions) {
            code += ', [\n';

            if (hasQueryParams) {
                const params = extractQueryParams(parsed.url);
                code += `${i1}${phpStr('query', opts)} => [\n`;
                for (const [key, value] of Object.entries(params)) {
                    code += `${i2}${phpStr(key, opts)} => ${phpStr(value, opts)},\n`;
                }
                code += `${i1}],\n`;
            }

            if (Object.keys(parsed.headers).length > 0) {
                code += `${i1}${phpStr('headers', opts)} => [\n`;
                for (const [key, value] of Object.entries(parsed.headers)) {
                    code += `${i2}${phpStr(key, opts)} => ${phpStr(value, opts)},\n`;
                }
                code += `${i1}],\n`;
            }

            if (parsed.data) {
                code += `${i1}${phpStr('body', opts)} => ${phpStr(parsed.data, opts)},\n`;
            }

            code += ']';
        }

        code += ');\n\n';
        code += 'echo $response->getStatusCode() . "\\n";\n';
        code += 'echo $response->getBody();\n';
        code += '?>';

        return code;
    }

    // 注册生成器
    window.CurlGenerators.php = {
        'php-curl': {
            name: 'PHP - cURL',
            generate: toPhpCurl
        },
        'php-guzzle': {
            name: 'PHP - Guzzle',
            generate: toPhpGuzzle
        }
    };

})();
