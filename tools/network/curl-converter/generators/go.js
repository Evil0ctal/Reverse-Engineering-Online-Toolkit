/**
 * cURL 代码生成器 - Go
 * @description 生成 Go HTTP 请求代码
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
     * Go - net/http 标准库
     */
    function toGoHttp(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const i2 = makeIndent(2, opts);

        let code = 'package main\n\n';
        code += 'import (\n';
        code += `${i1}"fmt"\n`;
        code += `${i1}"io"\n`;
        code += `${i1}"net/http"\n`;
        if (opts.useParamsDict && Object.keys(extractQueryParams(parsed.url)).length > 0) {
            code += `${i1}"net/url"\n`;
        }
        if (parsed.data) {
            code += `${i1}"strings"\n`;
        }
        code += ')\n\n';

        code += 'func main() {\n';

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);

            if (Object.keys(params).length > 0) {
                code += `${i1}baseURL := "${escapeString(baseUrl, 'go')}"\n`;
                code += `${i1}params := url.Values{}\n`;
                for (const [key, value] of Object.entries(params)) {
                    code += `${i1}params.Add("${escapeString(key, 'go')}", "${escapeString(value, 'go')}")\n`;
                }
                code += `${i1}requestURL := baseURL + "?" + params.Encode()\n\n`;
            } else {
                code += `${i1}requestURL := "${escapeString(baseUrl, 'go')}"\n\n`;
            }
        } else {
            code += `${i1}requestURL := "${escapeString(parsed.url, 'go')}"\n\n`;
        }

        if (parsed.data) {
            code += `${i1}body := strings.NewReader("${escapeString(parsed.data, 'go')}")\n`;
            code += `${i1}req, err := http.NewRequest("${parsed.method}", requestURL, body)\n`;
        } else {
            code += `${i1}req, err := http.NewRequest("${parsed.method}", requestURL, nil)\n`;
        }

        code += `${i1}if err != nil {\n${i2}panic(err)\n${i1}}\n\n`;

        for (const [key, value] of Object.entries(parsed.headers)) {
            code += `${i1}req.Header.Set("${escapeString(key, 'go')}", "${escapeString(value, 'go')}")\n`;
        }

        code += `\n${i1}client := &http.Client{}\n`;
        code += `${i1}resp, err := client.Do(req)\n`;
        code += `${i1}if err != nil {\n${i2}panic(err)\n${i1}}\n`;
        code += `${i1}defer resp.Body.Close()\n\n`;
        code += `${i1}respBody, err := io.ReadAll(resp.Body)\n`;
        code += `${i1}if err != nil {\n${i2}panic(err)\n${i1}}\n\n`;
        code += `${i1}fmt.Println(resp.StatusCode)\n`;
        code += `${i1}fmt.Println(string(respBody))\n`;
        code += '}';

        return code;
    }

    /**
     * Go - Resty 库
     */
    function toGoResty(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);
        const i2 = makeIndent(2, opts);

        let code = 'package main\n\n';
        code += 'import (\n';
        code += `${i1}"fmt"\n`;
        code += `${i1}"github.com/go-resty/resty/v2"\n`;
        code += ')\n\n';

        code += 'func main() {\n';
        code += `${i1}client := resty.New()\n\n`;

        // 处理 URL 和查询参数
        let urlCode;
        let hasQueryParams = false;
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);
            urlCode = escapeString(baseUrl, 'go');
            hasQueryParams = Object.keys(params).length > 0;
        } else {
            urlCode = escapeString(parsed.url, 'go');
        }

        code += `${i1}resp, err := client.R().\n`;

        for (const [key, value] of Object.entries(parsed.headers)) {
            code += `${i2}SetHeader("${escapeString(key, 'go')}", "${escapeString(value, 'go')}").\n`;
        }

        if (hasQueryParams) {
            const params = extractQueryParams(parsed.url);
            code += `${i2}SetQueryParams(map[string]string{\n`;
            for (const [key, value] of Object.entries(params)) {
                code += `${i2}${i1}"${escapeString(key, 'go')}": "${escapeString(value, 'go')}",\n`;
            }
            code += `${i2}}).\n`;
        }

        if (parsed.data) {
            code += `${i2}SetBody("${escapeString(parsed.data, 'go')}").\n`;
        }

        code += `${i2}${parsed.method.charAt(0) + parsed.method.slice(1).toLowerCase()}("${urlCode}")\n\n`;

        code += `${i1}if err != nil {\n${i2}panic(err)\n${i1}}\n\n`;
        code += `${i1}fmt.Println(resp.StatusCode())\n`;
        code += `${i1}fmt.Println(string(resp.Body()))\n`;
        code += '}';

        return code;
    }

    // 注册生成器
    window.CurlGenerators.go = {
        'go-http': {
            name: 'Go - net/http',
            generate: toGoHttp
        },
        'go-resty': {
            name: 'Go - Resty',
            generate: toGoResty
        }
    };

})();
