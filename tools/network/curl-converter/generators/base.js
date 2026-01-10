/**
 * cURL 代码生成器 - 基础工具函数
 * @description 提供所有代码生成器共享的工具函数
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // 确保命名空间存在
    window.CurlGenerators = window.CurlGenerators || {};

    /**
     * 转义字符串用于不同语言
     * @param {string} str - 要转义的字符串
     * @param {string} lang - 目标语言
     * @returns {string} 转义后的字符串
     */
    function escapeString(str, lang) {
        if (!str) return '';

        switch (lang) {
            case 'python':
                return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
            case 'javascript':
            case 'typescript':
                return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
            case 'php':
                return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$').replace(/\n/g, '\\n');
            case 'java':
            case 'kotlin':
                return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
            case 'csharp':
                return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
            case 'go':
                return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
            case 'rust':
                return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
            case 'ruby':
                return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
            case 'swift':
                return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
            default:
                return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
        }
    }

    /**
     * 获取语言的代码高亮类型
     * @param {string} generatorId - 生成器 ID
     * @returns {string} 高亮语言类型
     */
    function getHighlightLanguage(generatorId) {
        const languageMap = {
            'python-requests': 'python',
            'python-httpx': 'python',
            'python-aiohttp': 'python',
            'python-urllib': 'python',
            'js-fetch': 'javascript',
            'js-axios': 'javascript',
            'js-xhr': 'javascript',
            'node-axios': 'javascript',
            'node-fetch': 'javascript',
            'node-http': 'javascript',
            'php-curl': 'php',
            'php-guzzle': 'php',
            'go-http': 'go',
            'go-resty': 'go',
            'java-httpclient': 'java',
            'java-okhttp': 'java',
            'csharp-httpclient': 'csharp',
            'csharp-restsharp': 'csharp',
            'rust-reqwest': 'rust',
            'ruby-net-http': 'ruby',
            'ruby-faraday': 'ruby',
            'swift-urlsession': 'swift',
            'kotlin-okhttp': 'kotlin'
        };
        return languageMap[generatorId] || 'javascript';
    }

    /**
     * 创建缩进字符串
     * @param {number} level - 缩进级别
     * @param {Object} options - 选项
     * @returns {string} 缩进字符串
     */
    function makeIndent(level, options = {}) {
        const size = options.indentSize || 4;
        const char = options.indentChar === 'tab' ? '\t' : ' ';
        return char.repeat(size * level);
    }

    /**
     * 获取默认选项
     * @param {Object} options - 用户提供的选项
     * @returns {Object} 合并后的选项
     */
    function getDefaultOptions(options = {}) {
        return {
            useParamsDict: options.useParamsDict || false,
            indentSize: parseInt(options.indentSize) || 4,
            indentChar: options.indentChar || 'space'
        };
    }

    /**
     * 从 URL 中提取基础 URL（不含查询参数）
     * @param {string} url - 完整 URL
     * @returns {string} 基础 URL
     */
    function getBaseUrl(url) {
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
        } catch (e) {
            return url.split('?')[0];
        }
    }

    // 导出工具函数
    window.CurlGenerators.escapeString = escapeString;
    window.CurlGenerators.getHighlightLanguage = getHighlightLanguage;
    window.CurlGenerators.makeIndent = makeIndent;
    window.CurlGenerators.getDefaultOptions = getDefaultOptions;
    window.CurlGenerators.getBaseUrl = getBaseUrl;

})();
