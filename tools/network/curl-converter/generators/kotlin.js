/**
 * cURL 代码生成器 - Kotlin
 * @description 生成 Kotlin HTTP 请求代码
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
     * Kotlin - OkHttp
     */
    function toKotlinOkHttp(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const i2 = makeIndent(2, opts);

        let code = 'import okhttp3.*\nimport okhttp3.MediaType.Companion.toMediaType\nimport okhttp3.RequestBody.Companion.toRequestBody\n';
        if (opts.useParamsDict && Object.keys(extractQueryParams(parsed.url)).length > 0) {
            code += 'import okhttp3.HttpUrl.Companion.toHttpUrl\n';
        }
        code += '\n';

        code += 'fun main() {\n';
        code += `${i1}val client = OkHttpClient()\n\n`;

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);

            if (Object.keys(params).length > 0) {
                code += `${i1}val urlBuilder = "${escapeString(baseUrl, 'kotlin')}".toHttpUrl().newBuilder()\n`;
                for (const [key, value] of Object.entries(params)) {
                    code += `${i1}urlBuilder.addQueryParameter("${escapeString(key, 'kotlin')}", "${escapeString(value, 'kotlin')}")\n`;
                }
                code += `${i1}val url = urlBuilder.build().toString()\n\n`;
            } else {
                code += `${i1}val url = "${escapeString(baseUrl, 'kotlin')}"\n\n`;
            }
        } else {
            code += `${i1}val url = "${escapeString(parsed.url, 'kotlin')}"\n\n`;
        }

        if (parsed.data) {
            code += `${i1}val mediaType = "application/json".toMediaType()\n`;
            code += `${i1}val body = """${parsed.data}""".toRequestBody(mediaType)\n\n`;
        }

        code += `${i1}val request = Request.Builder()\n`;
        code += `${i2}.url(url)\n`;

        for (const [key, value] of Object.entries(parsed.headers)) {
            code += `${i2}.addHeader("${escapeString(key, 'kotlin')}", "${escapeString(value, 'kotlin')}")\n`;
        }

        if (parsed.data) {
            code += `${i2}.method("${parsed.method}", body)\n`;
        } else if (parsed.method !== 'GET') {
            code += `${i2}.method("${parsed.method}", "".toRequestBody(null))\n`;
        }

        code += `${i2}.build()\n\n`;
        code += `${i1}client.newCall(request).execute().use { response ->\n`;
        code += `${i2}println(response.code)\n`;
        code += `${i2}println(response.body?.string())\n`;
        code += `${i1}}\n}`;

        return code;
    }

    // 注册生成器
    window.CurlGenerators.kotlin = {
        'kotlin-okhttp': {
            name: 'Kotlin - OkHttp',
            generate: toKotlinOkHttp
        }
    };

})();
