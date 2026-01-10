/**
 * cURL 代码生成器 - Ruby
 * @description 生成 Ruby HTTP 请求代码
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
     * Ruby - Net::HTTP 标准库
     */
    function toRubyNetHttp(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);

        let code = "require 'net/http'\nrequire 'uri'\nrequire 'json'\n\n";

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);

            if (Object.keys(params).length > 0) {
                code += `base_url = '${escapeString(baseUrl, 'ruby')}'\n`;
                code += 'params = {\n';
                for (const [key, value] of Object.entries(params)) {
                    code += `${i1}'${escapeString(key, 'ruby')}' => '${escapeString(value, 'ruby')}',\n`;
                }
                code += '}\n';
                code += "uri = URI.parse(base_url + '?' + URI.encode_www_form(params))\n\n";
            } else {
                code += `uri = URI.parse('${escapeString(baseUrl, 'ruby')}')\n\n`;
            }
        } else {
            code += `uri = URI.parse('${escapeString(parsed.url, 'ruby')}')\n\n`;
        }

        code += 'http = Net::HTTP.new(uri.host, uri.port)\n';
        if (parsed.url.startsWith('https')) {
            code += 'http.use_ssl = true\n';
        }
        code += '\n';
        code += `request = Net::HTTP::${parsed.method.charAt(0) + parsed.method.slice(1).toLowerCase()}.new(uri.request_uri)\n\n`;

        for (const [key, value] of Object.entries(parsed.headers)) {
            code += `request['${escapeString(key, 'ruby')}'] = '${escapeString(value, 'ruby')}'\n`;
        }

        if (parsed.data) {
            code += `\nrequest.body = '${escapeString(parsed.data, 'ruby')}'\n`;
        }

        code += '\nresponse = http.request(request)\n\n';
        code += 'puts response.code\n';
        code += 'puts response.body';

        return code;
    }

    /**
     * Ruby - Faraday 库
     */
    function toRubyFaraday(parsed, options = {}) {
        const opts = getDefaultOptions(options);
        const i1 = makeIndent(1, opts);

        let code = "require 'faraday'\nrequire 'json'\n\n";
        code += "conn = Faraday.new do |f|\n";
        code += `${i1}f.adapter Faraday.default_adapter\n`;
        code += "end\n\n";

        // 处理 URL 和查询参数
        if (opts.useParamsDict) {
            const params = extractQueryParams(parsed.url);
            const baseUrl = getBaseUrl(parsed.url);

            if (Object.keys(params).length > 0) {
                code += `response = conn.${parsed.method.toLowerCase()}('${escapeString(baseUrl, 'ruby')}') do |req|\n`;
                code += `${i1}req.params = {\n`;
                for (const [key, value] of Object.entries(params)) {
                    code += `${i1}${i1}'${escapeString(key, 'ruby')}' => '${escapeString(value, 'ruby')}',\n`;
                }
                code += `${i1}}\n`;
            } else {
                code += `response = conn.${parsed.method.toLowerCase()}('${escapeString(baseUrl, 'ruby')}') do |req|\n`;
            }
        } else {
            code += `response = conn.${parsed.method.toLowerCase()}('${escapeString(parsed.url, 'ruby')}') do |req|\n`;
        }

        for (const [key, value] of Object.entries(parsed.headers)) {
            code += `${i1}req.headers['${escapeString(key, 'ruby')}'] = '${escapeString(value, 'ruby')}'\n`;
        }

        if (parsed.data) {
            code += `${i1}req.body = '${escapeString(parsed.data, 'ruby')}'\n`;
        }

        code += 'end\n\n';
        code += 'puts response.status\n';
        code += 'puts response.body';

        return code;
    }

    // 注册生成器
    window.CurlGenerators.ruby = {
        'ruby-net-http': {
            name: 'Ruby - Net::HTTP',
            generate: toRubyNetHttp
        },
        'ruby-faraday': {
            name: 'Ruby - Faraday',
            generate: toRubyFaraday
        }
    };

})();
