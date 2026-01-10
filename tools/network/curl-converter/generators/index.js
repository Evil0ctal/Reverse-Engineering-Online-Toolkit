/**
 * cURL 代码生成器 - 注册表
 * @description 聚合所有语言的代码生成器
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // 确保命名空间存在
    window.CurlGenerators = window.CurlGenerators || {};

    /**
     * 获取所有已注册的生成器
     * @returns {Object} 生成器映射表
     */
    function getAllGenerators() {
        const generators = {};

        // 聚合所有语言模块的生成器
        const modules = [
            window.CurlGenerators.python,
            window.CurlGenerators.javascript,
            window.CurlGenerators.php,
            window.CurlGenerators.go,
            window.CurlGenerators.java,
            window.CurlGenerators.csharp,
            window.CurlGenerators.rust,
            window.CurlGenerators.ruby,
            window.CurlGenerators.swift,
            window.CurlGenerators.kotlin
        ];

        for (const module of modules) {
            if (module) {
                for (const [id, generator] of Object.entries(module)) {
                    generators[id] = generator;
                }
            }
        }

        return generators;
    }

    /**
     * 根据 ID 获取生成器
     * @param {string} id - 生成器 ID
     * @returns {Object|null} 生成器对象
     */
    function getGenerator(id) {
        const generators = getAllGenerators();
        return generators[id] || null;
    }

    /**
     * 生成代码
     * @param {Object} parsed - 解析后的 cURL 数据
     * @param {string} language - 语言/库 ID
     * @param {Object} options - 生成选项
     * @returns {string} 生成的代码
     */
    function generateCode(parsed, language, options = {}) {
        const generator = getGenerator(language);
        if (!generator) {
            throw new Error('不支持的语言: ' + language);
        }
        return generator.generate(parsed, options);
    }

    /**
     * 获取所有可用的语言选项（用于填充下拉菜单）
     * @returns {Array} 语言选项数组
     */
    function getLanguageOptions() {
        const generators = getAllGenerators();
        const options = [];

        // 按语言分组
        const groups = {
            'Python': ['python-requests', 'python-httpx', 'python-httpx-async', 'python-aiohttp', 'python-urllib', 'python-fastapi-httpx'],
            'JavaScript': ['js-fetch', 'js-axios', 'js-xhr'],
            'Node.js': ['node-axios', 'node-fetch', 'node-http'],
            'PHP': ['php-curl', 'php-guzzle'],
            'Go': ['go-http', 'go-resty'],
            'Java': ['java-httpclient', 'java-okhttp'],
            'C#': ['csharp-httpclient', 'csharp-restsharp'],
            'Rust': ['rust-reqwest'],
            'Ruby': ['ruby-net-http', 'ruby-faraday'],
            'Swift': ['swift-urlsession'],
            'Kotlin': ['kotlin-okhttp']
        };

        for (const [groupName, ids] of Object.entries(groups)) {
            for (const id of ids) {
                if (generators[id]) {
                    options.push({
                        id: id,
                        name: generators[id].name,
                        group: groupName
                    });
                }
            }
        }

        return options;
    }

    /**
     * 检查生成器是否可用
     * @returns {boolean} 是否所有生成器都已加载
     */
    function isReady() {
        return !!(
            window.CurlGenerators.escapeString &&
            window.CurlGenerators.python &&
            window.CurlGenerators.javascript &&
            window.CurlGenerators.php &&
            window.CurlGenerators.go &&
            window.CurlGenerators.java &&
            window.CurlGenerators.csharp &&
            window.CurlGenerators.rust &&
            window.CurlGenerators.ruby &&
            window.CurlGenerators.swift &&
            window.CurlGenerators.kotlin
        );
    }

    // 导出注册表 API
    window.CurlGenerators.getAllGenerators = getAllGenerators;
    window.CurlGenerators.getGenerator = getGenerator;
    window.CurlGenerators.generateCode = generateCode;
    window.CurlGenerators.getLanguageOptions = getLanguageOptions;
    window.CurlGenerators.isReady = isReady;

    console.log('CurlGenerators registry initialized');

})();
