/**
 * cURL 代码生成器 - Swift
 * @description 生成 Swift HTTP 请求代码
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
     * Swift - URLSession
     */
    function toSwiftUrlSession(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const i2 = makeIndent(2, opts);

        let code = 'import Foundation\n\n';

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);

            if (Object.keys(params).length > 0) {
                code += `var components = URLComponents(string: "${escapeString(baseUrl, 'swift')}")!\n`;
                code += 'components.queryItems = [\n';
                for (const [key, value] of Object.entries(params)) {
                    code += `${i1}URLQueryItem(name: "${escapeString(key, 'swift')}", value: "${escapeString(value, 'swift')}"),\n`;
                }
                code += ']\n';
                code += 'let url = components.url!\n';
            } else {
                code += `let url = URL(string: "${escapeString(baseUrl, 'swift')}")!\n`;
            }
        } else {
            code += `let url = URL(string: "${escapeString(parsed.url, 'swift')}")!\n`;
        }

        code += 'var request = URLRequest(url: url)\n';
        code += `request.httpMethod = "${parsed.method}"\n\n`;

        for (const [key, value] of Object.entries(parsed.headers)) {
            code += `request.setValue("${escapeString(value, 'swift')}", forHTTPHeaderField: "${escapeString(key, 'swift')}")\n`;
        }

        if (parsed.data) {
            code += `\nrequest.httpBody = "${escapeString(parsed.data, 'swift')}".data(using: .utf8)\n`;
        }

        code += '\nlet task = URLSession.shared.dataTask(with: request) { data, response, error in\n';
        code += `${i1}if let error = error {\n`;
        code += `${i2}print("Error: \\(error)")\n`;
        code += `${i2}return\n`;
        code += `${i1}}\n\n`;
        code += `${i1}if let httpResponse = response as? HTTPURLResponse {\n`;
        code += `${i2}print("Status: \\(httpResponse.statusCode)")\n`;
        code += `${i1}}\n\n`;
        code += `${i1}if let data = data, let body = String(data: data, encoding: .utf8) {\n`;
        code += `${i2}print(body)\n`;
        code += `${i1}}\n`;
        code += '}\n\ntask.resume()';

        return code;
    }

    // 注册生成器
    window.CurlGenerators.swift = {
        'swift-urlsession': {
            name: 'Swift - URLSession',
            generate: toSwiftUrlSession
        }
    };

})();
