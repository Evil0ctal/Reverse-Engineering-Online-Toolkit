/**
 * cURL 转代码工具
 * @description 将 cURL 命令转换为各种编程语言代码
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    /**
     * 解析 cURL 命令
     */
    function parseCurl(curlCommand) {
        const result = {
            method: 'GET',
            url: '',
            headers: {},
            data: null,
            auth: null,
            insecure: false
        };

        // 移除换行和多余空格
        let cmd = curlCommand
            .replace(/\\\n/g, ' ')
            .replace(/\\\r\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // 移除 curl 命令本身
        cmd = cmd.replace(/^curl\s+/i, '');

        // 简单的参数解析
        const tokens = [];
        let current = '';
        let inQuote = false;
        let quoteChar = '';

        for (let i = 0; i < cmd.length; i++) {
            const char = cmd[i];

            if ((char === '"' || char === "'") && (i === 0 || cmd[i-1] !== '\\')) {
                if (!inQuote) {
                    inQuote = true;
                    quoteChar = char;
                } else if (char === quoteChar) {
                    inQuote = false;
                } else {
                    current += char;
                }
            } else if (char === ' ' && !inQuote) {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }
        if (current) {
            tokens.push(current);
        }

        // 解析参数
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (token === '-X' || token === '--request') {
                result.method = tokens[++i]?.toUpperCase() || 'GET';
            } else if (token === '-H' || token === '--header') {
                const header = tokens[++i] || '';
                const colonIndex = header.indexOf(':');
                if (colonIndex > 0) {
                    const name = header.slice(0, colonIndex).trim();
                    const value = header.slice(colonIndex + 1).trim();
                    result.headers[name] = value;
                }
            } else if (token === '-d' || token === '--data' || token === '--data-raw' || token === '--data-binary') {
                result.data = tokens[++i] || '';
                if (result.method === 'GET') {
                    result.method = 'POST';
                }
            } else if (token === '-u' || token === '--user') {
                result.auth = tokens[++i] || '';
            } else if (token === '-k' || token === '--insecure') {
                result.insecure = true;
            } else if (token === '-L' || token === '--location') {
                result.followRedirects = true;
            } else if (!token.startsWith('-') && !result.url) {
                result.url = token;
            }
        }

        return result;
    }

    /**
     * 转义字符串
     */
    function escapeString(str, lang) {
        if (!str) return '';

        if (lang === 'python' || lang === 'javascript' || lang === 'nodejs') {
            return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
        }
        if (lang === 'php') {
            return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        }
        if (lang === 'go' || lang === 'rust') {
            return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        }
        if (lang === 'java' || lang === 'csharp') {
            return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        }
        return str;
    }

    /**
     * 生成 Python 代码
     */
    function toPython(parsed) {
        let code = 'import requests\n\n';

        code += `url = "${escapeString(parsed.url, 'python')}"\n\n`;

        if (Object.keys(parsed.headers).length > 0) {
            code += 'headers = {\n';
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `    "${escapeString(key, 'python')}": "${escapeString(value, 'python')}",\n`;
            }
            code += '}\n\n';
        }

        if (parsed.data) {
            code += `data = '${escapeString(parsed.data, 'python')}'\n\n`;
        }

        code += `response = requests.${parsed.method.toLowerCase()}(\n    url`;

        if (Object.keys(parsed.headers).length > 0) {
            code += ',\n    headers=headers';
        }
        if (parsed.data) {
            code += ',\n    data=data';
        }
        if (parsed.auth) {
            const [user, pass] = parsed.auth.split(':');
            code += `,\n    auth=("${escapeString(user, 'python')}", "${escapeString(pass || '', 'python')}")`;
        }
        if (parsed.insecure) {
            code += ',\n    verify=False';
        }

        code += '\n)\n\n';
        code += 'print(response.status_code)\n';
        code += 'print(response.text)';

        return code;
    }

    /**
     * 生成 JavaScript (fetch) 代码
     */
    function toJavaScript(parsed) {
        let code = '';

        const options = {
            method: parsed.method
        };

        if (Object.keys(parsed.headers).length > 0) {
            options.headers = parsed.headers;
        }
        if (parsed.data) {
            options.body = parsed.data;
        }

        code += `fetch("${escapeString(parsed.url, 'javascript')}", ${JSON.stringify(options, null, 2)})\n`;
        code += '  .then(response => response.json())\n';
        code += '  .then(data => console.log(data))\n';
        code += '  .catch(error => console.error("Error:", error));';

        return code;
    }

    /**
     * 生成 Node.js (axios) 代码
     */
    function toNodeJS(parsed) {
        let code = "const axios = require('axios');\n\n";

        code += 'axios({\n';
        code += `  method: '${parsed.method.toLowerCase()}',\n`;
        code += `  url: '${escapeString(parsed.url, 'nodejs')}',\n`;

        if (Object.keys(parsed.headers).length > 0) {
            code += '  headers: {\n';
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `    '${escapeString(key, 'nodejs')}': '${escapeString(value, 'nodejs')}',\n`;
            }
            code += '  },\n';
        }

        if (parsed.data) {
            code += `  data: '${escapeString(parsed.data, 'nodejs')}',\n`;
        }

        if (parsed.auth) {
            const [user, pass] = parsed.auth.split(':');
            code += `  auth: {\n    username: '${escapeString(user, 'nodejs')}',\n    password: '${escapeString(pass || '', 'nodejs')}'\n  },\n`;
        }

        code += '})\n';
        code += '  .then(response => console.log(response.data))\n';
        code += '  .catch(error => console.error(error));';

        return code;
    }

    /**
     * 生成 PHP 代码
     */
    function toPHP(parsed) {
        let code = '<?php\n\n';

        code += '$ch = curl_init();\n\n';
        code += `curl_setopt($ch, CURLOPT_URL, '${escapeString(parsed.url, 'php')}');\n`;
        code += 'curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n';

        if (parsed.method !== 'GET') {
            code += `curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${parsed.method}');\n`;
        }

        if (Object.keys(parsed.headers).length > 0) {
            code += 'curl_setopt($ch, CURLOPT_HTTPHEADER, [\n';
            for (const [key, value] of Object.entries(parsed.headers)) {
                code += `    '${escapeString(key, 'php')}: ${escapeString(value, 'php')}',\n`;
            }
            code += ']);\n';
        }

        if (parsed.data) {
            code += `curl_setopt($ch, CURLOPT_POSTFIELDS, '${escapeString(parsed.data, 'php')}');\n`;
        }

        if (parsed.auth) {
            code += `curl_setopt($ch, CURLOPT_USERPWD, '${escapeString(parsed.auth, 'php')}');\n`;
        }

        if (parsed.insecure) {
            code += 'curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);\n';
        }

        code += '\n$response = curl_exec($ch);\n';
        code += 'curl_close($ch);\n\n';
        code += 'echo $response;\n';

        return code;
    }

    /**
     * 生成 Go 代码
     */
    function toGo(parsed) {
        let code = 'package main\n\nimport (\n';
        code += '    "fmt"\n    "io/ioutil"\n    "net/http"\n';
        if (parsed.data) code += '    "strings"\n';
        code += ')\n\nfunc main() {\n';

        if (parsed.data) {
            code += `    body := strings.NewReader("${escapeString(parsed.data, 'go')}")\n`;
            code += `    req, _ := http.NewRequest("${parsed.method}", "${escapeString(parsed.url, 'go')}", body)\n`;
        } else {
            code += `    req, _ := http.NewRequest("${parsed.method}", "${escapeString(parsed.url, 'go')}", nil)\n`;
        }

        for (const [key, value] of Object.entries(parsed.headers)) {
            code += `    req.Header.Set("${escapeString(key, 'go')}", "${escapeString(value, 'go')}")\n`;
        }

        if (parsed.auth) {
            const [user, pass] = parsed.auth.split(':');
            code += `    req.SetBasicAuth("${escapeString(user, 'go')}", "${escapeString(pass || '', 'go')}")\n`;
        }

        code += '\n    client := &http.Client{}\n';
        code += '    resp, _ := client.Do(req)\n';
        code += '    defer resp.Body.Close()\n\n';
        code += '    respBody, _ := ioutil.ReadAll(resp.Body)\n';
        code += '    fmt.Println(string(respBody))\n';
        code += '}';

        return code;
    }

    /**
     * 生成 Java 代码
     */
    function toJava(parsed) {
        let code = 'import java.net.http.*;\nimport java.net.URI;\n\n';
        code += 'public class Main {\n    public static void main(String[] args) throws Exception {\n';

        code += '        HttpClient client = HttpClient.newHttpClient();\n\n';

        code += '        HttpRequest request = HttpRequest.newBuilder()\n';
        code += `            .uri(URI.create("${escapeString(parsed.url, 'java')}"))\n`;
        code += `            .method("${parsed.method}", `;

        if (parsed.data) {
            code += `HttpRequest.BodyPublishers.ofString("${escapeString(parsed.data, 'java')}"))\n`;
        } else {
            code += 'HttpRequest.BodyPublishers.noBody())\n';
        }

        for (const [key, value] of Object.entries(parsed.headers)) {
            code += `            .header("${escapeString(key, 'java')}", "${escapeString(value, 'java')}")\n`;
        }

        code += '            .build();\n\n';

        code += '        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());\n';
        code += '        System.out.println(response.body());\n';
        code += '    }\n}';

        return code;
    }

    /**
     * 生成 C# 代码
     */
    function toCSharp(parsed) {
        let code = 'using System;\nusing System.Net.Http;\nusing System.Threading.Tasks;\n\n';
        code += 'class Program\n{\n    static async Task Main()\n    {\n';
        code += '        using var client = new HttpClient();\n\n';

        code += `        var request = new HttpRequestMessage(HttpMethod.${parsed.method.charAt(0) + parsed.method.slice(1).toLowerCase()}, "${escapeString(parsed.url, 'csharp')}");\n`;

        for (const [key, value] of Object.entries(parsed.headers)) {
            code += `        request.Headers.TryAddWithoutValidation("${escapeString(key, 'csharp')}", "${escapeString(value, 'csharp')}");\n`;
        }

        if (parsed.data) {
            code += `        request.Content = new StringContent("${escapeString(parsed.data, 'csharp')}");\n`;
        }

        code += '\n        var response = await client.SendAsync(request);\n';
        code += '        var content = await response.Content.ReadAsStringAsync();\n';
        code += '        Console.WriteLine(content);\n';
        code += '    }\n}';

        return code;
    }

    /**
     * 生成 Rust 代码
     */
    function toRust(parsed) {
        let code = 'use reqwest;\nuse std::error::Error;\n\n';
        code += '#[tokio::main]\nasync fn main() -> Result<(), Box<dyn Error>> {\n';
        code += '    let client = reqwest::Client::new();\n\n';

        code += `    let response = client.${parsed.method.toLowerCase()}("${escapeString(parsed.url, 'rust')}")\n`;

        for (const [key, value] of Object.entries(parsed.headers)) {
            code += `        .header("${escapeString(key, 'rust')}", "${escapeString(value, 'rust')}")\n`;
        }

        if (parsed.data) {
            code += `        .body("${escapeString(parsed.data, 'rust')}")\n`;
        }

        code += '        .send()\n        .await?\n        .text()\n        .await?;\n\n';
        code += '    println!("{}", response);\n';
        code += '    Ok(())\n}';

        return code;
    }

    /**
     * 转换 cURL 命令
     */
    function convertCurl() {
        const input = document.getElementById('input')?.value || '';
        const language = document.getElementById('language-select')?.value || 'python';
        const output = document.getElementById('output');

        if (!input.trim()) {
            if (output) output.textContent = '请输入 cURL 命令';
            return;
        }

        try {
            const parsed = parseCurl(input);

            if (!parsed.url) {
                throw new Error('未找到有效的 URL');
            }

            let code;

            switch (language) {
                case 'python':
                    code = toPython(parsed);
                    break;
                case 'javascript':
                    code = toJavaScript(parsed);
                    break;
                case 'nodejs':
                    code = toNodeJS(parsed);
                    break;
                case 'php':
                    code = toPHP(parsed);
                    break;
                case 'go':
                    code = toGo(parsed);
                    break;
                case 'java':
                    code = toJava(parsed);
                    break;
                case 'csharp':
                    code = toCSharp(parsed);
                    break;
                case 'rust':
                    code = toRust(parsed);
                    break;
                default:
                    code = toPython(parsed);
            }

            if (output) {
                output.textContent = code;
            }

            REOT.utils?.showNotification('转换成功', 'success');

        } catch (error) {
            if (output) {
                output.textContent = '错误: ' + error.message;
            }
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    const SAMPLE_CURL = `curl 'https://api.example.com/users' \\
  -X POST \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token123' \\
  -d '{"name": "John", "email": "john@example.com"}'`;

    function isCurlConverterToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/network/curl-converter');
    }

    document.addEventListener('click', async (e) => {
        if (!isCurlConverterToolActive()) return;

        const target = e.target;

        if (target.id === 'convert-btn' || target.closest('#convert-btn')) {
            convertCurl();
        }

        if (target.id === 'sample-btn' || target.closest('#sample-btn')) {
            const input = document.getElementById('input');
            if (input) {
                input.value = SAMPLE_CURL;
                convertCurl();
            }
        }

        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            const input = document.getElementById('input');
            const output = document.getElementById('output');
            if (input) input.value = '';
            if (output) output.textContent = '';
        }

        if (target.id === 'copy-btn' || target.closest('#copy-btn')) {
            const output = document.getElementById('output');
            if (output && output.textContent) {
                const success = await REOT.utils?.copyToClipboard(output.textContent);
                if (success) {
                    REOT.utils?.showNotification('代码已复制', 'success');
                }
            }
        }
    });

    document.addEventListener('change', (e) => {
        if (!isCurlConverterToolActive()) return;

        if (e.target.id === 'language-select') {
            const input = document.getElementById('input');
            if (input && input.value.trim()) {
                convertCurl();
            }
        }
    });

    window.CurlConverterTool = { parseCurl, convertCurl };

})();
