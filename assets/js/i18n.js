/**
 * REOT - Internationalization Module
 * 国际化模块 - 支持模块化工具翻译
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // 全局命名空间
    window.REOT = window.REOT || {};

    /**
     * 获取基础路径（支持GitHub Pages子目录部署）
     * @returns {string}
     */
    function getBasePath() {
        const origin = window.location.origin;

        // 检测 GitHub Pages 子目录 (如 /Reverse-Engineering-Online-Toolkit/)
        if (window.location.hostname.endsWith('github.io')) {
            const repoName = window.location.pathname.split('/')[1];
            if (repoName) {
                return `${origin}/${repoName}`;
            }
        }

        // 本地开发 / Docker 部署 - 直接使用 origin
        return origin;
    }

    /**
     * 国际化模块
     */
    REOT.i18n = {
        // 当前语言
        currentLocale: 'zh-CN',

        // 支持的语言列表
        supportedLocales: ['zh-CN', 'en-US'],

        // 语言包缓存（根目录翻译）
        locales: {},

        // 已加载的工具翻译缓存
        toolLocales: {},

        // 语言显示名称
        localeNames: {
            'zh-CN': '简体中文',
            'en-US': 'English'
        },

        /**
         * 初始化国际化模块
         * @returns {Promise<void>}
         */
        async init() {
            // 从本地存储获取语言设置，或使用浏览器语言
            const savedLocale = REOT.utils.storage.get('locale');
            const browserLocale = navigator.language || navigator.userLanguage;

            // 确定要使用的语言
            let locale = savedLocale || browserLocale;

            // 检查是否支持该语言
            if (!this.supportedLocales.includes(locale)) {
                // 尝试匹配语言前缀
                const prefix = locale.split('-')[0];
                locale = this.supportedLocales.find(l => l.startsWith(prefix)) || 'zh-CN';
            }

            // 加载语言包
            await this.setLocale(locale);

            // 监听语言选择器变化
            this.bindLanguageSelector();
        },

        /**
         * 设置当前语言
         * @param {string} locale - 语言代码
         * @returns {Promise<void>}
         */
        async setLocale(locale) {
            if (!this.supportedLocales.includes(locale)) {
                console.warn(`不支持的语言: ${locale}`);
                return;
            }

            // 加载语言包
            if (!this.locales[locale]) {
                await this.loadLocale(locale);
            }

            this.currentLocale = locale;
            REOT.utils.storage.set('locale', locale);

            // 重新加载当前工具的翻译（如果在工具页面）
            await this.reloadCurrentToolLocale(locale);

            // 更新页面文本
            this.updatePageTexts();

            // 更新语言选择器
            this.updateLanguageSelector();

            // 更新HTML lang属性
            document.documentElement.lang = locale;

            // 触发语言变更事件
            window.dispatchEvent(new CustomEvent('localechange', { detail: { locale } }));
        },

        /**
         * 加载语言包
         * @param {string} locale - 语言代码
         * @returns {Promise<Object>}
         */
        async loadLocale(locale) {
            try {
                const basePath = getBasePath();
                const response = await fetch(`${basePath}/locales/${locale}.json`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                this.locales[locale] = await response.json();
                return this.locales[locale];
            } catch (error) {
                console.error(`加载语言包失败: ${locale}`, error);
                // 使用内置的默认语言包
                this.locales[locale] = this.getDefaultLocale(locale);
                return this.locales[locale];
            }
        },

        /**
         * 加载工具特定的语言包
         * @param {string} toolPath - 工具路径 (如 /tools/formatting/json/)
         * @param {string} toolId - 工具ID (如 json)
         * @returns {Promise<boolean>} - 是否成功加载
         */
        async loadToolLocale(toolPath, toolId) {
            const locale = this.currentLocale;
            const cacheKey = `${toolId}_${locale}`;

            // 已经加载过则跳过
            if (this.toolLocales[cacheKey]) {
                return true;
            }

            // 确保路径以斜杠结尾
            if (!toolPath.endsWith('/')) {
                toolPath += '/';
            }

            try {
                const basePath = getBasePath();
                const response = await fetch(`${basePath}${toolPath}locales/${locale}.json`);
                if (!response.ok) {
                    // 工具没有本地化文件是正常的，静默处理
                    return false;
                }

                const toolTranslations = await response.json();
                this.toolLocales[cacheKey] = toolTranslations;

                // 合并到主语言包
                this.mergeToolTranslations(locale, toolId, toolTranslations);

                return true;
            } catch (error) {
                // 工具没有本地化文件是正常的，静默处理
                return false;
            }
        },

        /**
         * 合并工具翻译到主语言包
         * @param {string} locale - 语言代码
         * @param {string} toolId - 工具ID
         * @param {Object} translations - 工具翻译对象
         */
        mergeToolTranslations(locale, toolId, translations) {
            if (!this.locales[locale]) {
                this.locales[locale] = {};
            }

            if (!this.locales[locale].tools) {
                this.locales[locale].tools = {};
            }

            // 将工具翻译合并到 tools.{toolId} 命名空间
            this.locales[locale].tools[toolId] = this.deepMerge(
                this.locales[locale].tools[toolId] || {},
                translations
            );
        },

        /**
         * 深度合并对象
         * @param {Object} target - 目标对象
         * @param {Object} source - 源对象
         * @returns {Object}
         */
        deepMerge(target, source) {
            const result = { ...target };

            for (const key in source) {
                if (source.hasOwnProperty(key)) {
                    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                        result[key] = this.deepMerge(result[key] || {}, source[key]);
                    } else {
                        result[key] = source[key];
                    }
                }
            }

            return result;
        },

        /**
         * 切换语言时重新加载当前工具的翻译
         * @param {string} locale - 新语言代码
         */
        async reloadCurrentToolLocale(locale) {
            const currentPath = REOT.router?.getRoute();
            if (currentPath && currentPath.startsWith('/tools/')) {
                const tool = REOT.tools?.getByPath(currentPath);
                if (tool) {
                    await this.loadToolLocale(currentPath, tool.id);
                }
            }
        },

        /**
         * 获取默认语言包（内置备用）
         * @param {string} locale - 语言代码
         * @returns {Object}
         */
        getDefaultLocale(locale) {
            const defaults = {
                'zh-CN': {
                    site: {
                        title: 'REOT - 逆向工程在线工具箱',
                        name: 'REOT'
                    },
                    common: {
                        input: '输入',
                        output: '输出',
                        encode: '编码',
                        decode: '解码',
                        encrypt: '加密',
                        decrypt: '解密',
                        copy: '复制',
                        clear: '清除',
                        download: '下载',
                        upload: '上传',
                        paste: '粘贴',
                        swap: '交换',
                        searchPlaceholder: '搜索工具...',
                        searchResults: '搜索结果',
                        noResults: '未找到结果',
                        copied: '已复制',
                        copyFailed: '复制失败'
                    }
                },
                'en-US': {
                    site: {
                        title: 'REOT - Reverse Engineering Online Toolkit',
                        name: 'REOT'
                    },
                    common: {
                        input: 'Input',
                        output: 'Output',
                        encode: 'Encode',
                        decode: 'Decode',
                        encrypt: 'Encrypt',
                        decrypt: 'Decrypt',
                        copy: 'Copy',
                        clear: 'Clear',
                        download: 'Download',
                        upload: 'Upload',
                        paste: 'Paste',
                        swap: 'Swap',
                        searchPlaceholder: 'Search tools...',
                        searchResults: 'Search Results',
                        noResults: 'No results found',
                        copied: 'Copied',
                        copyFailed: 'Copy failed'
                    }
                }
            };
            return defaults[locale] || defaults['zh-CN'];
        },

        /**
         * 获取翻译文本
         * @param {string} key - 翻译键，支持点号分隔的路径
         * @param {Object} params - 替换参数
         * @returns {string}
         */
        t(key, params = {}) {
            // 确保 this 上下文正确（防止 this 丢失的情况）
            const self = this && this.locales ? this : REOT.i18n;
            if (!self || !self.locales) {
                // i18n 尚未初始化，返回 key 的最后部分作为默认值
                return key.split('.').pop();
            }

            const locale = self.locales[self.currentLocale] || {};
            let text = self.getNestedValue(locale, key);

            if (text === undefined) {
                // 尝试从默认语言获取
                const defaultLocale = self.locales['zh-CN'] || self.getDefaultLocale('zh-CN');
                text = self.getNestedValue(defaultLocale, key);
            }

            if (text === undefined) {
                console.warn(`翻译键未找到: ${key}`);
                return key;
            }

            // 替换参数
            if (params && typeof text === 'string') {
                Object.keys(params).forEach(param => {
                    text = text.replace(new RegExp(`{${param}}`, 'g'), params[param]);
                });
            }

            return text;
        },

        /**
         * 获取嵌套对象的值
         * @param {Object} obj - 对象
         * @param {string} path - 点号分隔的路径
         * @returns {*}
         */
        getNestedValue(obj, path) {
            return path.split('.').reduce((current, key) => {
                return current && current[key] !== undefined ? current[key] : undefined;
            }, obj);
        },

        /**
         * 更新页面所有带有 data-i18n 属性的元素
         */
        updatePageTexts() {
            // 更新文本内容
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                const text = this.t(key);
                if (text !== key) {
                    element.textContent = text;
                }
            });

            // 更新占位符
            document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
                const key = element.getAttribute('data-i18n-placeholder');
                const text = this.t(key);
                if (text !== key) {
                    element.placeholder = text;
                }
            });

            // 更新标题
            document.querySelectorAll('[data-i18n-title]').forEach(element => {
                const key = element.getAttribute('data-i18n-title');
                const text = this.t(key);
                if (text !== key) {
                    element.title = text;
                }
            });

            // 更新aria-label
            document.querySelectorAll('[data-i18n-aria]').forEach(element => {
                const key = element.getAttribute('data-i18n-aria');
                const text = this.t(key);
                if (text !== key) {
                    element.setAttribute('aria-label', text);
                }
            });

            // 更新页面标题
            const titleKey = document.querySelector('title[data-i18n]');
            if (titleKey) {
                document.title = this.t(titleKey.getAttribute('data-i18n'));
            }
        },

        /**
         * 绑定语言选择器事件
         */
        bindLanguageSelector() {
            const selector = document.getElementById('language-select');
            if (selector) {
                selector.addEventListener('change', (e) => {
                    this.setLocale(e.target.value);
                });
            }
        },

        /**
         * 更新语言选择器的值
         */
        updateLanguageSelector() {
            const selector = document.getElementById('language-select');
            if (selector) {
                selector.value = this.currentLocale;
            }
        },

        /**
         * 获取当前语言
         * @returns {string}
         */
        getLocale() {
            return this.currentLocale;
        },

        /**
         * 检查是否是RTL语言
         * @returns {boolean}
         */
        isRTL() {
            const rtlLocales = ['ar', 'he', 'fa', 'ur'];
            return rtlLocales.some(rtl => this.currentLocale.startsWith(rtl));
        }
    };

    // 创建快捷方法
    window.$t = (key, params) => REOT.i18n.t(key, params);

})();
