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
     * PHP - cURL
     */
    function toPhpCurl(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);

        let code = '<?php\n\n';
        code += '$ch = curl_init();\n\n';

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);

            if (Object.keys(params).length > 0) {
                code += `$baseUrl = '${escapeString(baseUrl, 'php')}';\n`;
                code += '$params = [\n';
                for (const [key, value] of Object.entries(params)) {
                    code += `${i1}'${escapeString(key, 'php')}' => '${escapeString(value, 'php')}',\n`;
                }
                code += '];\n';
                code += '$url = $baseUrl . \'?\' . http_build_query($params);\n\n';
            } else {
                code += `$url = '${escapeString(baseUrl, 'php')}';\n\n`;
            }
        } else {
            code += `$url = '${escapeString(parsed.url, 'php')}';\n\n`;
        }

        code += 'curl_setopt($ch, CURLOPT_URL, $url);\n';
        code += 'curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n';

        if (parsed.method !== 'GET') {
            code += `curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${parsed.method}');\n`;
        }

        if (Object.keys(parsed.headers).length > 0) {
            code += '\ncurl_setopt($ch, CURLOPT_HTTPHEADER, [\n';
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `${i1}'${escapeString(key, 'php')}: ${escapeString(value, 'php')}',\n`;
            }
            code += ']);\n';
        }

        if (parsed.data) {
            code += `\ncurl_setopt($ch, CURLOPT_POSTFIELDS, '${escapeString(parsed.data, 'php')}');\n`;
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

        let code = '<?php\n\n';
        code += "require 'vendor/autoload.php';\n\n";
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
                urlCode = escapeString(baseUrl, 'php');
            } else {
                urlCode = escapeString(baseUrl, 'php');
            }
        } else {
            urlCode = escapeString(parsed.url, 'php');
        }

        code += '$response = $client->request(\'' + parsed.method + '\', \'' + urlCode + '\'';

        const hasOptions = Object.keys(parsed.headers).length > 0 || parsed.data || hasQueryParams;
        if (hasOptions) {
            code += ', [\n';

            if (hasQueryParams) {
                const params = extractQueryParams(parsed.url);
                code += `${i1}'query' => [\n`;
                for (const [key, value] of Object.entries(params)) {
                    code += `${i2}'${escapeString(key, 'php')}' => '${escapeString(value, 'php')}',\n`;
                }
                code += `${i1}],\n`;
            }

            if (Object.keys(parsed.headers).length > 0) {
                code += `${i1}'headers' => [\n`;
                for (const [key, value] of Object.entries(parsed.headers)) {
                    code += `${i2}'${escapeString(key, 'php')}' => '${escapeString(value, 'php')}',\n`;
                }
                code += `${i1}],\n`;
            }

            if (parsed.data) {
                code += `${i1}'body' => '${escapeString(parsed.data, 'php')}',\n`;
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
