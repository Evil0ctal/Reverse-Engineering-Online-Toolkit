/**
 * REOT - Tools Registry Module
 * 工具注册模块
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // 全局命名空间
    window.REOT = window.REOT || {};

    /**
     * 工具注册模块
     */
    REOT.tools = {
        // 已注册的工具列表
        registry: [],

        // 分类配置
        categories: {
            encoding: {
                id: 'encoding',
                icon: '📝',
                order: 1
            },
            compression: {
                id: 'compression',
                icon: '📦',
                order: 2
            },
            hashing: {
                id: 'hashing',
                icon: '🔐',
                order: 3
            },
            hmac: {
                id: 'hmac',
                icon: '🔑',
                order: 4
            },
            encryption: {
                id: 'encryption',
                icon: '🔒',
                order: 5
            },
            formatting: {
                id: 'formatting',
                icon: '📋',
                order: 6
            },
            binary: {
                id: 'binary',
                icon: '💾',
                order: 7
            },
            protocol: {
                id: 'protocol',
                icon: '📡',
                order: 8
            },
            network: {
                id: 'network',
                icon: '🌐',
                order: 9
            },
            generators: {
                id: 'generators',
                icon: '⚡',
                order: 10
            },
            converters: {
                id: 'converters',
                icon: '🔄',
                order: 11
            },
            text: {
                id: 'text',
                icon: '📄',
                order: 12
            },
            reverse: {
                id: 'reverse',
                icon: '🔧',
                order: 13
            }
        },

        /**
         * 注册一个工具
         * @param {Object} tool - 工具配置
         */
        register(tool) {
            // 验证必需字段
            const required = ['id', 'category', 'name', 'path'];
            for (const field of required) {
                if (!tool[field]) {
                    console.error(`工具注册失败: 缺少必需字段 "${field}"`, tool);
                    return false;
                }
            }

            // 检查是否已注册
            if (this.registry.find(t => t.id === tool.id)) {
                console.warn(`工具已注册: ${tool.id}`);
                return false;
            }

            // 设置默认值
            tool.description = tool.description || '';
            tool.icon = tool.icon || this.categories[tool.category]?.icon || '🔧';
            tool.keywords = tool.keywords || [];
            tool.popular = tool.popular || false;

            // 添加到注册表
            this.registry.push(tool);

            return true;
        },

        /**
         * 批量注册工具
         * @param {Array} tools - 工具配置数组
         */
        registerAll(tools) {
            tools.forEach(tool => this.register(tool));
        },

        /**
         * 获取所有工具
         * @returns {Array}
         */
        getAll() {
            return this.registry;
        },

        /**
         * 根据ID获取工具
         * @param {string} id - 工具ID
         * @returns {Object|null}
         */
        getById(id) {
            return this.registry.find(tool => tool.id === id) || null;
        },

        /**
         * 根据路径获取工具
         * @param {string} path - 工具路径
         * @returns {Object|null}
         */
        getByPath(path) {
            // 规范化路径
            path = path.replace(/\/+$/, '/');
            if (!path.endsWith('/')) {
                path += '/';
            }
            return this.registry.find(tool => tool.path === path) || null;
        },

        /**
         * 根据分类获取工具
         * @param {string} category - 分类ID
         * @returns {Array}
         */
        getByCategory(category) {
            return this.registry.filter(tool => tool.category === category);
        },

        /**
         * 获取热门工具
         * @param {number} limit - 数量限制
         * @returns {Array}
         */
        getPopular(limit = 8) {
            return this.registry
                .filter(tool => tool.popular)
                .slice(0, limit);
        },

        /**
         * 搜索工具
         * @param {string} query - 搜索词
         * @returns {Array}
         */
        search(query) {
            if (!query || query.trim() === '') {
                return [];
            }

            const q = query.toLowerCase().trim();

            return this.registry.filter(tool => {
                // 搜索工具ID
                if (tool.id.toLowerCase().includes(q)) {
                    return true;
                }

                // 搜索工具名称（获取翻译后的名称）
                const name = REOT.i18n?.t(tool.name) || tool.name;
                if (name.toLowerCase().includes(q)) {
                    return true;
                }

                // 搜索描述
                const desc = REOT.i18n?.t(tool.description) || tool.description;
                if (desc.toLowerCase().includes(q)) {
                    return true;
                }

                // 搜索关键词
                if (tool.keywords.some(kw => kw.toLowerCase().includes(q))) {
                    return true;
                }

                return false;
            });
        },

        /**
         * 获取所有分类
         * @returns {Array}
         */
        getCategories() {
            return Object.values(this.categories)
                .sort((a, b) => a.order - b.order);
        },

        /**
         * 初始化侧边栏
         */
        initSidebar() {
            const categories = this.getCategories();

            categories.forEach(category => {
                const categoryEl = document.querySelector(`.nav-category[data-category="${category.id}"]`);
                if (!categoryEl) {
                    return;
                }

                const toolsList = categoryEl.querySelector('.category-tools');
                if (!toolsList) {
                    return;
                }

                const tools = this.getByCategory(category.id);

                if (tools.length === 0) {
                    // 隐藏空分类
                    categoryEl.style.display = 'none';
                    return;
                }

                // 生成工具链接
                toolsList.innerHTML = tools.map(tool => `
                    <li>
                        <a href="${tool.path}"
                           class="tool-link"
                           data-route="${tool.path}"
                           data-i18n="${tool.name}">
                            ${REOT.i18n?.t(tool.name) || tool.name}
                        </a>
                    </li>
                `).join('');
            });

            // 绑定分类折叠事件
            document.querySelectorAll('.category-header').forEach(header => {
                header.addEventListener('click', () => {
                    const category = header.closest('.nav-category');
                    category.classList.toggle('collapsed');
                });
            });
        },

        /**
         * 初始化首页工具网格
         */
        initHomeGrid() {
            // 热门工具
            const popularGrid = document.getElementById('popular-tools');
            if (popularGrid) {
                const popularTools = this.getPopular();
                popularGrid.innerHTML = popularTools.map(tool => this.createToolCard(tool)).join('');
            }

            // 所有工具
            const allGrid = document.getElementById('all-tools');
            if (allGrid) {
                allGrid.innerHTML = this.registry.map(tool => this.createToolCard(tool)).join('');
            }
        },

        /**
         * 创建工具卡片HTML
         * @param {Object} tool - 工具配置
         * @returns {string}
         */
        createToolCard(tool) {
            const name = REOT.i18n?.t(tool.name) || tool.name;
            const desc = REOT.i18n?.t(tool.description) || tool.description;

            return `
                <a href="${tool.path}"
                   class="tool-card"
                   data-route="${tool.path}">
                    <span class="tool-card__icon">${tool.icon}</span>
                    <span class="tool-card__name">${name}</span>
                    ${desc ? `<span class="tool-card__desc">${desc}</span>` : ''}
                </a>
            `;
        },

        /**
         * 初始化搜索功能
         */
        initSearch() {
            const searchInput = document.getElementById('search-input');
            const searchOverlay = document.getElementById('search-overlay');
            const searchResults = document.getElementById('search-results');
            const closeBtn = document.getElementById('close-search');

            if (!searchInput || !searchOverlay || !searchResults) {
                return;
            }

            // 搜索输入防抖
            const handleSearch = REOT.utils.debounce((query) => {
                if (!query.trim()) {
                    searchOverlay.style.display = 'none';
                    return;
                }

                const results = this.search(query);
                this.showSearchResults(results);
            }, 300);

            searchInput.addEventListener('input', (e) => {
                handleSearch(e.target.value);
            });

            searchInput.addEventListener('focus', () => {
                if (searchInput.value.trim()) {
                    handleSearch(searchInput.value);
                }
            });

            // 关闭搜索
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    searchOverlay.style.display = 'none';
                });
            }

            searchOverlay.addEventListener('click', (e) => {
                if (e.target === searchOverlay) {
                    searchOverlay.style.display = 'none';
                }
            });

            // ESC 关闭搜索
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchOverlay.style.display = 'none';
                }
            });
        },

        /**
         * 显示搜索结果
         * @param {Array} results - 搜索结果
         */
        showSearchResults(results) {
            const searchOverlay = document.getElementById('search-overlay');
            const searchResults = document.getElementById('search-results');

            if (!searchOverlay || !searchResults) {
                return;
            }

            if (results.length === 0) {
                searchResults.innerHTML = `
                    <div class="no-results" style="padding: 40px; text-align: center; color: var(--text-muted);">
                        <p data-i18n="common.noResults">未找到结果</p>
                    </div>
                `;
            } else {
                searchResults.innerHTML = results.map(tool => {
                    const name = REOT.i18n?.t(tool.name) || tool.name;
                    const categoryName = REOT.i18n?.t(`categories.${tool.category}`) || tool.category;

                    return `
                        <div class="search-result-item" data-path="${tool.path}">
                            <span class="search-result-item__icon">${tool.icon}</span>
                            <div class="search-result-item__info">
                                <div class="search-result-item__name">${name}</div>
                                <div class="search-result-item__category">${categoryName}</div>
                            </div>
                        </div>
                    `;
                }).join('');

                // 绑定点击事件
                searchResults.querySelectorAll('.search-result-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const path = item.getAttribute('data-path');
                        REOT.router.navigate(path);
                        searchOverlay.style.display = 'none';
                        document.getElementById('search-input').value = '';
                    });
                });
            }

            searchOverlay.style.display = 'flex';

            // 更新国际化文本
            if (REOT.i18n) {
                REOT.i18n.updatePageTexts();
            }
        }
    };

    // 注册默认工具
    REOT.tools.registerAll([
        // ========== 编码与解码 ==========
        {
            id: 'base64',
            category: 'encoding',
            name: 'tools.base64.title',
            description: 'tools.base64.description',
            icon: '📄',
            path: '/tools/encoding/base64/',
            keywords: ['base64', '编码', '解码', 'encode', 'decode'],
            popular: true
        },
        // ========== 编码扩展 ==========
        {
            id: 'base32',
            category: 'encoding',
            name: 'tools.base32.title',
            description: 'tools.base32.description',
            icon: '📄',
            path: '/tools/encoding/base32/',
            keywords: ['base32', '编码', '解码']
        },
        {
            id: 'base58',
            category: 'encoding',
            name: 'tools.base58.title',
            description: 'tools.base58.description',
            icon: '₿',
            path: '/tools/encoding/base58/',
            keywords: ['base58', 'bitcoin', '编码', '解码']
        },
        {
            id: 'ascii',
            category: 'encoding',
            name: 'tools.ascii.title',
            description: 'tools.ascii.description',
            icon: '🔤',
            path: '/tools/encoding/ascii/',
            keywords: ['ascii', 'char', '字符', '码']
        },
        {
            id: 'url-encode',
            category: 'encoding',
            name: 'tools.url-encode.title',
            description: 'tools.url-encode.description',
            icon: '🔗',
            path: '/tools/encoding/url-encode/',
            keywords: ['url', 'encode', 'decode', '编码', '解码', 'percent'],
            popular: true
        },
        {
            id: 'hex',
            category: 'encoding',
            name: 'tools.hex.title',
            description: 'tools.hex.description',
            icon: '🔢',
            path: '/tools/encoding/hex/',
            keywords: ['hex', '十六进制', 'hexadecimal']
        },
        {
            id: 'unicode',
            category: 'encoding',
            name: 'tools.unicode.title',
            description: 'tools.unicode.description',
            icon: '🌐',
            path: '/tools/encoding/unicode/',
            keywords: ['unicode', 'utf-8', 'utf-16', '编码']
        },
        {
            id: 'html-entity',
            category: 'encoding',
            name: 'tools.html-entity.title',
            description: 'tools.html-entity.description',
            icon: '📝',
            path: '/tools/encoding/html-entity/',
            keywords: ['html', 'entity', '实体', '转义']
        },

        // ========== 哈希计算 ==========
        {
            id: 'md5',
            category: 'hashing',
            name: 'tools.md5.title',
            description: 'tools.md5.description',
            icon: '🔐',
            path: '/tools/hashing/md5/',
            keywords: ['md5', 'hash', '哈希', '摘要'],
            popular: true
        },
        {
            id: 'sha',
            category: 'hashing',
            name: 'tools.sha.title',
            description: 'tools.sha.description',
            icon: '🔒',
            path: '/tools/hashing/sha/',
            keywords: ['sha', 'sha1', 'sha256', 'sha512', 'hash', '哈希'],
            popular: true
        },

        // ========== 加密与解密 ==========
        {
            id: 'aes',
            category: 'encryption',
            name: 'tools.aes.title',
            description: 'tools.aes.description',
            icon: '🔐',
            path: '/tools/encryption/aes/',
            keywords: ['aes', '加密', '解密', 'encrypt', 'decrypt'],
            popular: true
        },
        {
            id: 'rsa',
            category: 'encryption',
            name: 'tools.rsa.title',
            description: 'tools.rsa.description',
            icon: '🔑',
            path: '/tools/encryption/rsa/',
            keywords: ['rsa', '非对称', '公钥', '私钥', 'encrypt', 'decrypt']
        },

        // ========== 数据格式化 ==========
        {
            id: 'json',
            category: 'formatting',
            name: 'tools.json.title',
            description: 'tools.json.description',
            icon: '📋',
            path: '/tools/formatting/json/',
            keywords: ['json', '格式化', 'format', 'beautify', '美化'],
            popular: true
        },

        // ========== 协议解析 ==========
        {
            id: 'jwt',
            category: 'protocol',
            name: 'tools.jwt.title',
            description: 'tools.jwt.description',
            icon: '🎫',
            path: '/tools/protocol/jwt/',
            keywords: ['jwt', 'token', 'json web token', '令牌'],
            popular: true
        },

        // ========== 生成器 ==========
        {
            id: 'uuid',
            category: 'generators',
            name: 'tools.uuid.title',
            description: 'tools.uuid.description',
            icon: '🆔',
            path: '/tools/generators/uuid/',
            keywords: ['uuid', 'guid', '唯一标识符', 'unique'],
            popular: true
        },
        {
            id: 'timestamp',
            category: 'generators',
            name: 'tools.timestamp.title',
            description: 'tools.timestamp.description',
            icon: '⏰',
            path: '/tools/generators/timestamp/',
            keywords: ['timestamp', 'unix', '时间戳', 'time']
        },
        {
            id: 'random-string',
            category: 'generators',
            name: 'tools.random-string.title',
            description: 'tools.random-string.description',
            icon: '🎲',
            path: '/tools/generators/random-string/',
            keywords: ['random', 'string', '随机', '字符串']
        },
        {
            id: 'password',
            category: 'generators',
            name: 'tools.password.title',
            description: 'tools.password.description',
            icon: '🔐',
            path: '/tools/generators/password/',
            keywords: ['password', '密码', 'generate', '生成'],
            popular: true
        },
        {
            id: 'rot13',
            category: 'encoding',
            name: 'tools.rot13.title',
            description: 'tools.rot13.description',
            icon: '🔄',
            path: '/tools/encoding/rot13/',
            keywords: ['rot13', 'rot47', 'caesar', '凯撒']
        },
        {
            id: 'morse',
            category: 'encoding',
            name: 'tools.morse.title',
            description: 'tools.morse.description',
            icon: '📡',
            path: '/tools/encoding/morse/',
            keywords: ['morse', 'code', '摩斯', '电码']
        },

        // ========== 数值转换 ==========
        {
            id: 'number-base',
            category: 'converters',
            name: 'tools.number-base.title',
            description: 'tools.number-base.description',
            icon: '🔢',
            path: '/tools/converters/number-base/',
            keywords: ['binary', 'hex', 'octal', '进制', '二进制', '十六进制']
        },
        {
            id: 'color',
            category: 'converters',
            name: 'tools.color.title',
            description: 'tools.color.description',
            icon: '🎨',
            path: '/tools/converters/color/',
            keywords: ['color', 'hex', 'rgb', 'hsl', '颜色'],
            popular: true
        },

        // ========== 文本处理 ==========
        {
            id: 'text-statistics',
            category: 'text',
            name: 'tools.text-statistics.title',
            description: 'tools.text-statistics.description',
            icon: '📊',
            path: '/tools/text/statistics/',
            keywords: ['count', 'word', 'char', '统计', '字数']
        },
        {
            id: 'case-converter',
            category: 'text',
            name: 'tools.case-converter.title',
            description: 'tools.case-converter.description',
            icon: '🔠',
            path: '/tools/text/case-converter/',
            keywords: ['case', 'upper', 'lower', 'camel', '大小写']
        },
        {
            id: 'text-dedup',
            category: 'text',
            name: 'tools.text-dedup.title',
            description: 'tools.text-dedup.description',
            icon: '🧹',
            path: '/tools/text/dedup/',
            keywords: ['dedup', 'duplicate', '去重', '重复']
        },
        {
            id: 'text-sort',
            category: 'text',
            name: 'tools.text-sort.title',
            description: 'tools.text-sort.description',
            icon: '📝',
            path: '/tools/text/sort/',
            keywords: ['sort', 'order', '排序']
        },
        {
            id: 'regex',
            category: 'text',
            name: 'tools.regex.title',
            description: 'tools.regex.description',
            icon: '🔍',
            path: '/tools/text/regex/',
            keywords: ['regex', 'regular', 'expression', '正则'],
            popular: true
        },

        // ========== 新增编码工具 ==========
        {
            id: 'punycode',
            category: 'encoding',
            name: 'tools.punycode.title',
            description: 'tools.punycode.description',
            icon: '🌍',
            path: '/tools/encoding/punycode/',
            keywords: ['punycode', 'idn', 'domain', '国际化域名', 'internationalized']
        },

        // ========== 新增哈希工具 ==========
        {
            id: 'hmac',
            category: 'hashing',
            name: 'tools.hmac.title',
            description: 'tools.hmac.description',
            icon: '🔑',
            path: '/tools/hashing/hmac/',
            keywords: ['hmac', 'hash', 'mac', 'sha', '消息认证码']
        },
        {
            id: 'crc',
            category: 'hashing',
            name: 'tools.crc.title',
            description: 'tools.crc.description',
            icon: '✓',
            path: '/tools/hashing/crc/',
            keywords: ['crc', 'crc32', 'checksum', '校验', '循环冗余']
        },

        // ========== 新增网络工具 ==========
        {
            id: 'url-parser',
            category: 'network',
            name: 'tools.url-parser.title',
            description: 'tools.url-parser.description',
            icon: '🔗',
            path: '/tools/network/url-parser/',
            keywords: ['url', 'parse', 'query', 'uri', '解析']
        },
        {
            id: 'ip-converter',
            category: 'network',
            name: 'tools.ip-converter.title',
            description: 'tools.ip-converter.description',
            icon: '🌐',
            path: '/tools/network/ip-converter/',
            keywords: ['ip', 'address', 'convert', '地址', '转换']
        },

        // ========== 新增转换器 ==========
        {
            id: 'byte-unit',
            category: 'converters',
            name: 'tools.byte-unit.title',
            description: 'tools.byte-unit.description',
            icon: '💾',
            path: '/tools/converters/byte-unit/',
            keywords: ['byte', 'kb', 'mb', 'gb', 'size', '字节', '大小']
        },
        {
            id: 'time-unit',
            category: 'converters',
            name: 'tools.time-unit.title',
            description: 'tools.time-unit.description',
            icon: '⏱️',
            path: '/tools/converters/time-unit/',
            keywords: ['time', 'convert', 'second', 'minute', 'hour', '时间']
        },

        // ========== 新增文本工具 ==========
        {
            id: 'text-diff',
            category: 'text',
            name: 'tools.text-diff.title',
            description: 'tools.text-diff.description',
            icon: '📝',
            path: '/tools/text/diff/',
            keywords: ['diff', 'compare', 'difference', '对比', '差异']
        },

        // ========== 新增生成器 ==========
        {
            id: 'qrcode',
            category: 'generators',
            name: 'tools.qrcode.title',
            description: 'tools.qrcode.description',
            icon: '📱',
            path: '/tools/generators/qrcode/',
            keywords: ['qr', 'qrcode', 'barcode', '二维码', '条形码', 'code128', 'ean', 'upc', '生成'],
            popular: true
        },
        {
            id: 'lorem-ipsum',
            category: 'generators',
            name: 'tools.lorem-ipsum.title',
            description: 'tools.lorem-ipsum.description',
            icon: '📜',
            path: '/tools/generators/lorem-ipsum/',
            keywords: ['lorem', 'ipsum', 'placeholder', 'text', '占位', '文本']
        },
        {
            id: 'barcode-scanner',
            category: 'generators',
            name: 'tools.barcode-scanner.title',
            description: 'tools.barcode-scanner.description',
            icon: '📷',
            path: '/tools/generators/barcode-scanner/',
            keywords: ['qr', 'barcode', 'scan', 'scanner', '扫描', '条码', '二维码']
        },

        // ========== 数据格式化（新增） ==========
        {
            id: 'xml',
            category: 'formatting',
            name: 'tools.xml.title',
            description: 'tools.xml.description',
            icon: '📰',
            path: '/tools/formatting/xml/',
            keywords: ['xml', 'format', 'beautify', '格式化', '美化']
        },
        {
            id: 'yaml',
            category: 'formatting',
            name: 'tools.yaml.title',
            description: 'tools.yaml.description',
            icon: '📝',
            path: '/tools/formatting/yaml/',
            keywords: ['yaml', 'yml', 'json', 'format', '格式化']
        },

        // ========== 压缩工具（新增） ==========
        {
            id: 'gzip',
            category: 'compression',
            name: 'tools.gzip.title',
            description: 'tools.gzip.description',
            icon: '📦',
            path: '/tools/compression/gzip/',
            keywords: ['gzip', 'compress', 'decompress', '压缩', '解压'],
            popular: true
        },

        // ========== 哈希工具（新增） ==========
        {
            id: 'sha3',
            category: 'hashing',
            name: 'tools.sha3.title',
            description: 'tools.sha3.description',
            icon: '🔒',
            path: '/tools/hashing/sha3/',
            keywords: ['sha3', 'sha3-256', 'sha3-512', 'keccak', 'hash', '哈希']
        },

        // ========== 网络工具（新增） ==========
        {
            id: 'cookie-parser',
            category: 'network',
            name: 'tools.cookie-parser.title',
            description: 'tools.cookie-parser.description',
            icon: '🍪',
            path: '/tools/network/cookie-parser/',
            keywords: ['cookie', 'parse', 'http', '解析', 'web']
        },
        {
            id: 'user-agent',
            category: 'network',
            name: 'tools.user-agent.title',
            description: 'tools.user-agent.description',
            icon: '🔍',
            path: '/tools/network/user-agent/',
            keywords: ['user-agent', 'ua', 'browser', 'detect', '浏览器', '识别']
        },

        // ========== 二进制分析（新增） ==========
        {
            id: 'hex-viewer',
            category: 'binary',
            name: 'tools.hex-viewer.title',
            description: 'tools.hex-viewer.description',
            icon: '🔢',
            path: '/tools/binary/hex-viewer/',
            keywords: ['hex', 'binary', 'viewer', '十六进制', '二进制', '查看器'],
            popular: true
        }
    ]);

})();
