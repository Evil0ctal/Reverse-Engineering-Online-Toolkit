/**
 * cURL 代码生成器 - C#
 * @description 生成 C# HTTP 请求代码
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
     * C# - HttpClient
     */
    function toCsharpHttpClient(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const i2 = makeIndent(2, opts);

        let code = 'using System;\nusing System.Net.Http;\nusing System.Text;\nusing System.Threading.Tasks;\n';
        if (opts.useParamsDict && Object.keys(extractQueryParams(parsed.url)).length > 0) {
            code += 'using System.Web;\nusing System.Collections.Specialized;\n';
        }
        code += '\n';

        code += 'class Program\n{\n';
        code += `${i1}static async Task Main()\n${i1}{\n`;
        code += `${i2}using var client = new HttpClient();\n\n`;

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);

            if (Object.keys(params).length > 0) {
                code += `${i2}var baseUrl = "${escapeString(baseUrl, 'csharp')}";\n`;
                code += `${i2}var query = HttpUtility.ParseQueryString(string.Empty);\n`;
                for (const [key, value] of Object.entries(params)) {
                    code += `${i2}query["${escapeString(key, 'csharp')}"] = "${escapeString(value, 'csharp')}";\n`;
                }
                code += `${i2}var url = baseUrl + "?" + query.ToString();\n\n`;
            } else {
                code += `${i2}var url = "${escapeString(baseUrl, 'csharp')}";\n\n`;
            }
        } else {
            code += `${i2}var url = "${escapeString(parsed.url, 'csharp')}";\n\n`;
        }

        code += `${i2}var request = new HttpRequestMessage(HttpMethod.${parsed.method.charAt(0) + parsed.method.slice(1).toLowerCase()}, url);\n\n`;

        for (const [key, value] of Object.entries(parsed.headers)) {
            code += `${i2}request.Headers.TryAddWithoutValidation("${escapeString(key, 'csharp')}", "${escapeString(value, 'csharp')}");\n`;
        }

        if (parsed.data) {
            code += `\n${i2}request.Content = new StringContent("${escapeString(parsed.data, 'csharp')}", Encoding.UTF8, "application/json");\n`;
        }

        code += `\n${i2}var response = await client.SendAsync(request);\n`;
        code += `${i2}var content = await response.Content.ReadAsStringAsync();\n\n`;
        code += `${i2}Console.WriteLine((int)response.StatusCode);\n`;
        code += `${i2}Console.WriteLine(content);\n`;
        code += `${i1}}\n}`;

        return code;
    }

    /**
     * C# - RestSharp
     */
    function toCsharpRestSharp(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);

        let code = 'using RestSharp;\n\n';

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);

            code += 'var client = new RestClient();\n';
            code += `var request = new RestRequest("${escapeString(baseUrl, 'csharp')}", Method.${parsed.method});\n\n`;

            if (Object.keys(params).length > 0) {
                for (const [key, value] of Object.entries(params)) {
                    code += `request.AddQueryParameter("${escapeString(key, 'csharp')}", "${escapeString(value, 'csharp')}");\n`;
                }
                code += '\n';
            }
        } else {
            code += 'var client = new RestClient();\n';
            code += `var request = new RestRequest("${escapeString(parsed.url, 'csharp')}", Method.${parsed.method});\n\n`;
        }

        for (const [key, value] of Object.entries(parsed.headers)) {
            code += `request.AddHeader("${escapeString(key, 'csharp')}", "${escapeString(value, 'csharp')}");\n`;
        }

        if (parsed.data) {
            code += `\nrequest.AddJsonBody("${escapeString(parsed.data, 'csharp')}");\n`;
        }

        code += '\nvar response = await client.ExecuteAsync(request);\n\n';
        code += 'Console.WriteLine((int)response.StatusCode);\n';
        code += 'Console.WriteLine(response.Content);';

        return code;
    }

    // 注册生成器
    window.CurlGenerators.csharp = {
        'csharp-httpclient': {
            name: 'C# - HttpClient',
            generate: toCsharpHttpClient
        },
        'csharp-restsharp': {
            name: 'C# - RestSharp',
            generate: toCsharpRestSharp
        }
    };

})();
