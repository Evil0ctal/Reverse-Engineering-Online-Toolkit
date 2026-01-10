/**
 * cURL 代码生成器 - Rust
 * @description 生成 Rust HTTP 请求代码
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
     * Rust - reqwest 库
     */
    function toRustReqwest(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);

        let code = 'use reqwest;\nuse std::error::Error;\n';
        if (opts.useParamsDict && Object.keys(extractQueryParams(parsed.url)).length > 0) {
            code += 'use std::collections::HashMap;\n';
        }
        code += '\n';

        code += '#[tokio::main]\nasync fn main() -> Result<(), Box<dyn Error>> {\n';
        code += `${i1}let client = reqwest::Client::new();\n\n`;

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);

            if (Object.keys(params).length > 0) {
                code += `${i1}let base_url = "${escapeString(baseUrl, 'rust')}";\n`;
                code += `${i1}let mut params = HashMap::new();\n`;
                for (const [key, value] of Object.entries(params)) {
                    code += `${i1}params.insert("${escapeString(key, 'rust')}", "${escapeString(value, 'rust')}");\n`;
                }
                code += '\n';
                code += `${i1}let response = client.${parsed.method.toLowerCase()}(base_url)\n`;
                code += `${i1}${i1}.query(&params)\n`;
            } else {
                code += `${i1}let response = client.${parsed.method.toLowerCase()}("${escapeString(baseUrl, 'rust')}")\n`;
            }
        } else {
            code += `${i1}let response = client.${parsed.method.toLowerCase()}("${escapeString(parsed.url, 'rust')}")\n`;
        }

        for (const [key, value] of Object.entries(parsed.headers)) {
            code += `${i1}${i1}.header("${escapeString(key, 'rust')}", "${escapeString(value, 'rust')}")\n`;
        }

        if (parsed.data) {
            code += `${i1}${i1}.body("${escapeString(parsed.data, 'rust')}")\n`;
        }

        code += `${i1}${i1}.send()\n${i1}${i1}.await?;\n\n`;
        code += `${i1}println!("{}", response.status());\n`;
        code += `${i1}println!("{}", response.text().await?);\n\n`;
        code += `${i1}Ok(())\n}`;

        return code;
    }

    // 注册生成器
    window.CurlGenerators.rust = {
        'rust-reqwest': {
            name: 'Rust - reqwest',
            generate: toRustReqwest
        }
    };

})();
