/**
 * cURL 代码生成器 - Java
 * @description 生成 Java HTTP 请求代码
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
     * Java - HttpClient (Java 11+)
     */
    function toJavaHttpClient(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const i2 = makeIndent(2, opts);
        const i3 = makeIndent(3, opts);

        let code = 'import java.net.http.*;\nimport java.net.URI;\n';
        if (opts.useParamsDict && Object.keys(extractQueryParams(parsed.url)).length > 0) {
            code += 'import java.net.URLEncoder;\nimport java.nio.charset.StandardCharsets;\nimport java.util.Map;\nimport java.util.stream.Collectors;\n';
        }
        code += '\n';

        code += 'public class Main {\n';
        code += `${i1}public static void main(String[] args) throws Exception {\n`;

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);

            if (Object.keys(params).length > 0) {
                code += `${i2}String baseUrl = "${escapeString(baseUrl, 'java')}";\n`;
                code += `${i2}Map<String, String> params = Map.of(\n`;
                const entries = Object.entries(params);
                entries.forEach(([key, value], index) => {
                    code += `${i3}"${escapeString(key, 'java')}", "${escapeString(value, 'java')}"${index < entries.length - 1 ? ',' : ''}\n`;
                });
                code += `${i2});\n`;
                code += `${i2}String queryString = params.entrySet().stream()\n`;
                code += `${i3}.map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))\n`;
                code += `${i3}.collect(Collectors.joining("&"));\n`;
                code += `${i2}String url = baseUrl + "?" + queryString;\n\n`;
            } else {
                code += `${i2}String url = "${escapeString(baseUrl, 'java')}";\n\n`;
            }
        } else {
            code += `${i2}String url = "${escapeString(parsed.url, 'java')}";\n\n`;
        }

        code += `${i2}HttpClient client = HttpClient.newHttpClient();\n\n`;
        code += `${i2}HttpRequest request = HttpRequest.newBuilder()\n`;
        code += `${i3}.uri(URI.create(url))\n`;

        for (const [key, value] of Object.entries(parsed.headers)) {
            code += `${i3}.header("${escapeString(key, 'java')}", "${escapeString(value, 'java')}")\n`;
        }

        code += `${i3}.method("${parsed.method}", `;
        if (parsed.data) {
            code += `HttpRequest.BodyPublishers.ofString("${escapeString(parsed.data, 'java')}"))\n`;
        } else {
            code += 'HttpRequest.BodyPublishers.noBody())\n';
        }
        code += `${i3}.build();\n\n`;
        code += `${i2}HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());\n\n`;
        code += `${i2}System.out.println(response.statusCode());\n`;
        code += `${i2}System.out.println(response.body());\n`;
        code += `${i1}}\n}`;

        return code;
    }

    /**
     * Java - OkHttp
     */
    function toJavaOkHttp(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const i2 = makeIndent(2, opts);
        const i3 = makeIndent(3, opts);

        let code = 'import okhttp3.*;\n';
        if (opts.useParamsDict && Object.keys(extractQueryParams(parsed.url)).length > 0) {
            code += 'import okhttp3.HttpUrl;\n';
        }
        code += '\n';

        code += 'public class Main {\n';
        code += `${i1}public static void main(String[] args) throws Exception {\n`;
        code += `${i2}OkHttpClient client = new OkHttpClient();\n\n`;

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);

            if (Object.keys(params).length > 0) {
                code += `${i2}HttpUrl.Builder urlBuilder = HttpUrl.parse("${escapeString(baseUrl, 'java')}").newBuilder();\n`;
                for (const [key, value] of Object.entries(params)) {
                    code += `${i2}urlBuilder.addQueryParameter("${escapeString(key, 'java')}", "${escapeString(value, 'java')}");\n`;
                }
                code += `${i2}String url = urlBuilder.build().toString();\n\n`;
            } else {
                code += `${i2}String url = "${escapeString(baseUrl, 'java')}";\n\n`;
            }
        } else {
            code += `${i2}String url = "${escapeString(parsed.url, 'java')}";\n\n`;
        }

        if (parsed.data) {
            code += `${i2}RequestBody body = RequestBody.create("${escapeString(parsed.data, 'java')}", MediaType.parse("application/json"));\n\n`;
        }

        code += `${i2}Request request = new Request.Builder()\n`;
        code += `${i3}.url(url)\n`;

        for (const [key, value] of Object.entries(parsed.headers)) {
            code += `${i3}.addHeader("${escapeString(key, 'java')}", "${escapeString(value, 'java')}")\n`;
        }

        if (parsed.data) {
            code += `${i3}.method("${parsed.method}", body)\n`;
        } else if (parsed.method !== 'GET') {
            code += `${i3}.method("${parsed.method}", RequestBody.create("", null))\n`;
        }

        code += `${i3}.build();\n\n`;
        code += `${i2}Response response = client.newCall(request).execute();\n\n`;
        code += `${i2}System.out.println(response.code());\n`;
        code += `${i2}System.out.println(response.body().string());\n`;
        code += `${i1}}\n}`;

        return code;
    }

    // 注册生成器
    window.CurlGenerators.java = {
        'java-httpclient': {
            name: 'Java - HttpClient',
            generate: toJavaHttpClient
        },
        'java-okhttp': {
            name: 'Java - OkHttp',
            generate: toJavaOkHttp
        }
    };

})();
