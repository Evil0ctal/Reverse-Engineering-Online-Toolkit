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

        // 编辑模式
        editMode: false,

        // 所有工具是否折叠
        allToolsCollapsed: true,

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
            },
            system: {
                id: 'system',
                icon: '⚙️',
                order: 14
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

        // 默认快速访问工具列表（按使用频率排序）
        defaultQuickAccessIds: [
            'json',              // JSON 格式化 - 最常用
            'base64',            // Base64 编解码
            'curl-converter',    // cURL 转换器 - 开发者常用
            'jwt',               // JWT 解析 - API 开发
            'url-encode',        // URL 编解码
            'hex-viewer',        // Hex 查看器 - 逆向工程
            'regex',             // 正则表达式测试
            'md5',               // MD5 哈希
            'protobuf',          // Protobuf 解码 - 逆向工程
            'aes',               // AES 加解密
            'uuid',              // UUID 生成
            'qrcode'             // 二维码生成
        ],

        /**
         * 获取用户自定义的快速访问工具ID列表
         * @returns {Array}
         */
        getQuickAccessIds() {
            const saved = REOT.utils?.storage?.get('quickAccessTools', null);
            if (saved && Array.isArray(saved)) {
                return saved;
            }
            // 返回默认的快速访问列表（按使用频率排序）
            return [...this.defaultQuickAccessIds];
        },

        /**
         * 保存快速访问工具ID列表
         * @param {Array} ids - 工具ID数组
         */
        saveQuickAccessIds(ids) {
            REOT.utils?.storage?.set('quickAccessTools', ids);
        },

        /**
         * 检查工具是否在快速访问中
         * @param {string} toolId - 工具ID
         * @returns {boolean}
         */
        isInQuickAccess(toolId) {
            return this.getQuickAccessIds().includes(toolId);
        },

        /**
         * 添加工具到快速访问
         * @param {string} toolId - 工具ID
         */
        addToQuickAccess(toolId) {
            const ids = this.getQuickAccessIds();
            if (!ids.includes(toolId)) {
                ids.push(toolId);
                this.saveQuickAccessIds(ids);
            }
        },

        /**
         * 从快速访问移除工具
         * @param {string} toolId - 工具ID
         */
        removeFromQuickAccess(toolId) {
            const ids = this.getQuickAccessIds().filter(id => id !== toolId);
            this.saveQuickAccessIds(ids);
        },

        /**
         * 重置快速访问为默认
         */
        resetQuickAccess() {
            REOT.utils?.storage?.remove('quickAccessTools');
        },

        /**
         * 获取热门工具（现在基于用户自定义）
         * @param {number} limit - 数量限制
         * @returns {Array}
         */
        getPopular(limit = 12) {
            const ids = this.getQuickAccessIds();
            return ids
                .map(id => this.getById(id))
                .filter(Boolean)
                .slice(0, limit);
        },

        /**
         * 检查用户是否自定义过快速访问
         * @returns {boolean}
         */
        hasCustomQuickAccess() {
            return REOT.utils?.storage?.get('quickAccessTools', null) !== null;
        },

        /**
         * 获取所有工具折叠状态
         * @returns {boolean}
         */
        getAllToolsCollapsed() {
            return REOT.utils?.storage?.get('allToolsCollapsed', true);
        },

        /**
         * 保存所有工具折叠状态
         * @param {boolean} collapsed
         */
        setAllToolsCollapsed(collapsed) {
            this.allToolsCollapsed = collapsed;
            REOT.utils?.storage?.set('allToolsCollapsed', collapsed);
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
            // 更新首页统计数据
            this.updateHomeStats();

            // 初始化快速访问
            this.renderQuickAccess();

            // 初始化分类卡片
            this.renderCategoryCards();

            // 初始化所有工具（折叠状态）
            this.renderAllTools();

            // 初始化编辑模式按钮
            this.initQuickAccessEdit();

            // 初始化折叠功能
            this.initAllToolsCollapse();
        },

        /**
         * 更新首页统计数据（工具数量、分类数量）
         */
        updateHomeStats() {
            // 更新工具数量
            const toolCountEl = document.getElementById('stat-tools');
            if (toolCountEl) {
                toolCountEl.textContent = this.registry.length + '+';
            }

            // 更新分类数量
            const categoryCountEl = document.getElementById('stat-categories');
            if (categoryCountEl) {
                const categoriesWithTools = this.getCategories().filter(cat =>
                    this.getByCategory(cat.id).length > 0
                );
                categoryCountEl.textContent = categoriesWithTools.length;
            }
        },

        /**
         * 渲染快速访问区域
         */
        renderQuickAccess() {
            const popularGrid = document.getElementById('popular-tools');
            const emptyState = document.getElementById('quick-access-empty');
            const resetBtn = document.getElementById('reset-quick-access');

            if (!popularGrid) return;

            const popularTools = this.getPopular();

            if (popularTools.length === 0) {
                popularGrid.style.display = 'none';
                if (emptyState) emptyState.style.display = 'flex';
            } else {
                popularGrid.style.display = 'grid';
                if (emptyState) emptyState.style.display = 'none';
                popularGrid.innerHTML = popularTools.map(tool =>
                    this.createToolCard(tool, { showStar: this.editMode, isStarred: true })
                ).join('');
            }

            // 显示/隐藏重置按钮
            if (resetBtn) {
                resetBtn.style.display = this.hasCustomQuickAccess() ? 'inline-flex' : 'none';
            }
        },

        /**
         * 渲染分类卡片
         */
        renderCategoryCards() {
            const container = document.getElementById('category-cards');
            if (!container) return;

            const categories = this.getCategories();

            container.innerHTML = categories.map(category => {
                const tools = this.getByCategory(category.id);
                if (tools.length === 0) return '';

                const categoryName = REOT.i18n?.t(`categories.${category.id}`) || category.id;

                return `
                    <div class="category-card" data-category="${category.id}">
                        <div class="category-card__header">
                            <span class="category-card__icon">${category.icon}</span>
                            <span class="category-card__name">${categoryName}</span>
                            <span class="category-card__count">${tools.length}</span>
                        </div>
                        <div class="category-card__tools">
                            ${tools.map(tool => {
                                const name = REOT.i18n?.t(tool.name) || tool.name;
                                return `
                                    <a href="${tool.path}" class="category-tool-link" data-route="${tool.path}" title="${name}">
                                        <span class="category-tool-icon">${tool.icon}</span>
                                        <span class="category-tool-name">${name}</span>
                                    </a>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        },

        /**
         * 渲染所有工具区域
         */
        renderAllTools() {
            const allGrid = document.getElementById('all-tools');
            const toolCount = document.getElementById('tool-count');
            const toggleBtn = document.getElementById('toggle-all-tools');

            if (!allGrid) return;

            // 设置工具数量
            if (toolCount) {
                const countText = REOT.i18n?.t('home.toolCount') || '{count} 个工具';
                toolCount.textContent = countText.replace('{count}', this.registry.length);
            }

            // 渲染工具卡片
            allGrid.innerHTML = this.registry.map(tool =>
                this.createToolCard(tool, { showStar: this.editMode, isStarred: this.isInQuickAccess(tool.id) })
            ).join('');

            // 恢复折叠状态
            this.allToolsCollapsed = this.getAllToolsCollapsed();
            this.updateCollapseState();
        },

        /**
         * 初始化快速访问编辑功能
         */
        initQuickAccessEdit() {
            const editBtn = document.getElementById('edit-quick-access');
            const resetBtn = document.getElementById('reset-quick-access');
            const hint = document.getElementById('quick-access-hint');

            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    this.editMode = !this.editMode;
                    editBtn.classList.toggle('active', this.editMode);
                    if (hint) hint.style.display = this.editMode ? 'block' : 'none';

                    // 重新渲染
                    this.renderQuickAccess();
                    this.renderAllTools();
                });
            }

            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    if (confirm(REOT.i18n?.t('home.confirmReset') || '确定要重置快速访问为默认设置吗？')) {
                        this.resetQuickAccess();
                        this.renderQuickAccess();
                        this.renderAllTools();
                    }
                });
            }
        },

        /**
         * 初始化所有工具折叠功能
         */
        initAllToolsCollapse() {
            const header = document.getElementById('all-tools-header');
            const toggleBtn = document.getElementById('toggle-all-tools');

            if (header) {
                header.addEventListener('click', () => {
                    this.allToolsCollapsed = !this.allToolsCollapsed;
                    this.setAllToolsCollapsed(this.allToolsCollapsed);
                    this.updateCollapseState();
                });
            }
        },

        /**
         * 更新折叠状态
         */
        updateCollapseState() {
            const allGrid = document.getElementById('all-tools');
            const toggleBtn = document.getElementById('toggle-all-tools');
            const section = document.getElementById('all-tools-section');

            if (allGrid) {
                allGrid.classList.toggle('collapsed', this.allToolsCollapsed);
            }
            if (section) {
                section.classList.toggle('collapsed', this.allToolsCollapsed);
            }
        },

        /**
         * 展开所有工具并滚动到指定分类
         */
        expandAllToolsAndScrollTo(categoryId) {
            this.allToolsCollapsed = false;
            this.setAllToolsCollapsed(false);
            this.updateCollapseState();

            // 滚动到所有工具区域
            setTimeout(() => {
                const section = document.getElementById('all-tools-section');
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        },

        /**
         * 处理星标点击
         */
        handleStarClick(toolId, e) {
            e.preventDefault();
            e.stopPropagation();

            if (this.isInQuickAccess(toolId)) {
                this.removeFromQuickAccess(toolId);
            } else {
                this.addToQuickAccess(toolId);
            }

            // 重新渲染
            this.renderQuickAccess();
            this.renderAllTools();
        },

        /**
         * 创建工具卡片HTML
         * @param {Object} tool - 工具配置
         * @param {Object} options - 选项
         * @returns {string}
         */
        createToolCard(tool, options = {}) {
            const { showStar = false, isStarred = false } = options;
            const name = REOT.i18n?.t(tool.name) || tool.name;
            const desc = REOT.i18n?.t(tool.description) || tool.description;

            const starHtml = showStar ? `
                <button class="tool-card__star ${isStarred ? 'starred' : ''}"
                        onclick="REOT.tools.handleStarClick('${tool.id}', event)"
                        title="${isStarred ?
                            (REOT.i18n?.t('home.removeFromQuickAccess') || '从快速访问移除') :
                            (REOT.i18n?.t('home.addToQuickAccess') || '添加到快速访问')}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="${isStarred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                </button>
            ` : '';

            return `
                <a href="${tool.path}"
                   class="tool-card ${showStar ? 'tool-card--editable' : ''}"
                   data-route="${tool.path}"
                   data-tool-id="${tool.id}">
                    ${starHtml}
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
                    const isStarred = this.isInQuickAccess(tool.id);
                    const starTitle = isStarred ?
                        (REOT.i18n?.t('home.removeFromQuickAccess') || '从快速访问移除') :
                        (REOT.i18n?.t('home.addToQuickAccess') || '添加到快速访问');

                    return `
                        <div class="search-result-item" data-path="${tool.path}" data-tool-id="${tool.id}">
                            <span class="search-result-item__icon">${tool.icon}</span>
                            <div class="search-result-item__info">
                                <div class="search-result-item__name">${name}</div>
                                <div class="search-result-item__category">${categoryName}</div>
                            </div>
                            <button class="search-result-item__star ${isStarred ? 'starred' : ''}"
                                    data-tool-id="${tool.id}"
                                    title="${starTitle}">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="${isStarred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                </svg>
                            </button>
                        </div>
                    `;
                }).join('');

                // 绑定点击事件
                searchResults.querySelectorAll('.search-result-item').forEach(item => {
                    // 主区域点击跳转
                    item.addEventListener('click', (e) => {
                        // 如果点击的是星标按钮，不跳转
                        if (e.target.closest('.search-result-item__star')) {
                            return;
                        }
                        const path = item.getAttribute('data-path');
                        REOT.router.navigate(path);
                        searchOverlay.style.display = 'none';
                        document.getElementById('search-input').value = '';
                    });
                });

                // 绑定星标点击事件
                searchResults.querySelectorAll('.search-result-item__star').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const toolId = btn.getAttribute('data-tool-id');
                        this.toggleQuickAccess(toolId);

                        // 更新按钮状态
                        const isNowStarred = this.isInQuickAccess(toolId);
                        btn.classList.toggle('starred', isNowStarred);
                        btn.querySelector('svg').setAttribute('fill', isNowStarred ? 'currentColor' : 'none');
                        btn.title = isNowStarred ?
                            (REOT.i18n?.t('home.removeFromQuickAccess') || '从快速访问移除') :
                            (REOT.i18n?.t('home.addToQuickAccess') || '添加到快速访问');

                        // 显示提示
                        this.showQuickAccessToast(toolId, isNowStarred);
                    });
                });
            }

            searchOverlay.style.display = 'flex';

            // 更新国际化文本
            if (REOT.i18n) {
                REOT.i18n.updatePageTexts();
            }
        },

        /**
         * 切换快速访问状态
         * @param {string} toolId - 工具ID
         */
        toggleQuickAccess(toolId) {
            if (this.isInQuickAccess(toolId)) {
                this.removeFromQuickAccess(toolId);
            } else {
                this.addToQuickAccess(toolId);
            }
        },

        /**
         * 显示快速访问操作提示
         * @param {string} toolId - 工具ID
         * @param {boolean} added - 是否添加
         */
        showQuickAccessToast(toolId, added) {
            const tool = this.getById(toolId);
            if (!tool) return;

            const name = REOT.i18n?.t(tool.name) || tool.name;
            const message = added ?
                (REOT.i18n?.t('home.addedToQuickAccess') || '已添加到快速访问').replace('{name}', name) :
                (REOT.i18n?.t('home.removedFromQuickAccess') || '已从快速访问移除').replace('{name}', name);

            // 创建或复用 toast 元素
            let toast = document.getElementById('quick-access-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'quick-access-toast';
                toast.className = 'quick-access-toast';
                document.body.appendChild(toast);
            }

            toast.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="${added ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span>${message}</span>
            `;

            // 显示动画
            toast.classList.remove('hide');
            toast.classList.add('show');

            // 3秒后隐藏
            clearTimeout(toast._hideTimer);
            toast._hideTimer = setTimeout(() => {
                toast.classList.remove('show');
                toast.classList.add('hide');
            }, 2500);
        },

        /**
         * 在工具页面创建快速访问按钮
         * @param {string} toolId - 工具ID
         */
        createToolPageQuickAccessBtn(toolId) {
            const tool = this.getById(toolId);
            if (!tool) return null;

            const isStarred = this.isInQuickAccess(toolId);
            const btn = document.createElement('button');
            btn.className = `tool-page-quick-access ${isStarred ? 'starred' : ''}`;
            btn.title = isStarred ?
                (REOT.i18n?.t('home.removeFromQuickAccess') || '从快速访问移除') :
                (REOT.i18n?.t('home.addToQuickAccess') || '添加到快速访问');

            btn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="${isStarred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span>${isStarred ?
                    (REOT.i18n?.t('home.inQuickAccess') || '已在快速访问') :
                    (REOT.i18n?.t('home.addToQuickAccess') || '添加到快速访问')}</span>
            `;

            btn.addEventListener('click', () => {
                this.toggleQuickAccess(toolId);
                const isNowStarred = this.isInQuickAccess(toolId);

                // 更新按钮状态
                btn.classList.toggle('starred', isNowStarred);
                btn.querySelector('svg').setAttribute('fill', isNowStarred ? 'currentColor' : 'none');
                btn.querySelector('span').textContent = isNowStarred ?
                    (REOT.i18n?.t('home.inQuickAccess') || '已在快速访问') :
                    (REOT.i18n?.t('home.addToQuickAccess') || '添加到快速访问');
                btn.title = isNowStarred ?
                    (REOT.i18n?.t('home.removeFromQuickAccess') || '从快速访问移除') :
                    (REOT.i18n?.t('home.addToQuickAccess') || '添加到快速访问');

                // 显示提示
                this.showQuickAccessToast(toolId, isNowStarred);
            });

            return btn;
        },

        /**
         * 初始化当前工具页面的快速访问按钮
         */
        initToolPageQuickAccess() {
            // 获取当前路径对应的工具
            const currentPath = window.location.pathname;
            const tool = this.getByPath(currentPath);

            if (!tool) return;

            // 查找工具页面的标题区域
            const toolHeader = document.querySelector('.tool-header');
            if (!toolHeader) return;

            // 检查是否已经存在按钮
            if (toolHeader.querySelector('.tool-page-quick-access')) return;

            // 创建按钮并添加到标题区域
            const btn = this.createToolPageQuickAccessBtn(tool.id);
            if (btn) {
                // 创建按钮容器
                const container = document.createElement('div');
                container.className = 'tool-header__actions';
                container.appendChild(btn);

                // 插入到标题后面
                const title = toolHeader.querySelector('h1');
                if (title) {
                    title.parentNode.insertBefore(container, title.nextSibling);
                } else {
                    toolHeader.appendChild(container);
                }
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
        {
            id: 'cbor',
            category: 'encoding',
            name: 'tools.cbor.title',
            description: 'tools.cbor.description',
            icon: '📦',
            path: '/tools/encoding/cbor/',
            keywords: ['cbor', 'binary', 'json', 'rfc8949', 'encode', 'decode', '二进制', '编码', '解码']
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
        {
            id: 'des',
            category: 'encryption',
            name: 'tools.des.title',
            description: 'tools.des.description',
            icon: '🔓',
            path: '/tools/encryption/des/',
            keywords: ['des', '3des', 'triple des', '加密', '解密', 'encrypt', 'decrypt']
        },
        {
            id: 'rc4',
            category: 'encryption',
            name: 'tools.rc4.title',
            description: 'tools.rc4.description',
            icon: '🔀',
            path: '/tools/encryption/rc4/',
            keywords: ['rc4', 'stream', 'cipher', '流加密', '加密', '解密']
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
        {
            id: 'http-headers',
            category: 'network',
            name: 'tools.http-headers.title',
            description: 'tools.http-headers.description',
            icon: '📋',
            path: '/tools/network/http-headers/',
            keywords: ['http', 'header', 'request', 'response', '请求', '响应', '头部']
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
        {
            id: 'csv',
            category: 'formatting',
            name: 'tools.csv.title',
            description: 'tools.csv.description',
            icon: '📊',
            path: '/tools/formatting/csv/',
            keywords: ['csv', 'tsv', 'excel', 'table', '表格', '解析']
        },
        {
            id: 'toml',
            category: 'formatting',
            name: 'tools.toml.title',
            description: 'tools.toml.description',
            icon: '⚙️',
            path: '/tools/formatting/toml/',
            keywords: ['toml', 'config', 'cargo', 'pyproject', '配置', '格式化']
        },
        {
            id: 'sql',
            category: 'formatting',
            name: 'tools.sql.title',
            description: 'tools.sql.description',
            icon: '🗄️',
            path: '/tools/formatting/sql/',
            keywords: ['sql', 'mysql', 'postgresql', 'sqlite', 'query', '查询', '格式化']
        },
        {
            id: 'html',
            category: 'formatting',
            name: 'tools.html.title',
            description: 'tools.html.description',
            icon: '🌐',
            path: '/tools/formatting/html/',
            keywords: ['html', 'markup', 'web', '网页', '格式化', '标记']
        },
        {
            id: 'css',
            category: 'formatting',
            name: 'tools.css.title',
            description: 'tools.css.description',
            icon: '🎨',
            path: '/tools/formatting/css/',
            keywords: ['css', 'style', 'stylesheet', '样式', '格式化']
        },
        {
            id: 'javascript',
            category: 'formatting',
            name: 'tools.javascript.title',
            description: 'tools.javascript.description',
            icon: '📜',
            path: '/tools/formatting/javascript/',
            keywords: ['javascript', 'js', 'ecmascript', '脚本', '格式化']
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
        {
            id: 'deflate',
            category: 'compression',
            name: 'tools.deflate.title',
            description: 'tools.deflate.description',
            icon: '📦',
            path: '/tools/compression/deflate/',
            keywords: ['deflate', 'compress', 'decompress', 'zlib', '压缩', '解压']
        },
        {
            id: 'brotli',
            category: 'compression',
            name: 'tools.brotli.title',
            description: 'tools.brotli.description',
            icon: '📦',
            path: '/tools/compression/brotli/',
            keywords: ['brotli', 'compress', 'decompress', 'google', '压缩', '解压']
        },
        {
            id: 'zstd',
            category: 'compression',
            name: 'tools.zstd.title',
            description: 'tools.zstd.description',
            icon: '📦',
            path: '/tools/compression/zstd/',
            keywords: ['zstd', 'zstandard', 'compress', 'decompress', 'facebook', '压缩', '解压']
        },
        {
            id: 'lz4',
            category: 'compression',
            name: 'tools.lz4.title',
            description: 'tools.lz4.description',
            icon: '📦',
            path: '/tools/compression/lz4/',
            keywords: ['lz4', 'compress', 'decompress', 'fast', '压缩', '解压', '高速']
        },

        // ========== 哈希工具（新增） ==========
        {
            id: 'blake2',
            category: 'hashing',
            name: 'tools.blake2.title',
            description: 'tools.blake2.description',
            icon: '🔒',
            path: '/tools/hashing/blake2/',
            keywords: ['blake2', 'blake2b', 'blake2s', 'hash', '哈希', '摘要']
        },
        {
            id: 'sha3',
            category: 'hashing',
            name: 'tools.sha3.title',
            description: 'tools.sha3.description',
            icon: '🔒',
            path: '/tools/hashing/sha3/',
            keywords: ['sha3', 'sha3-256', 'sha3-512', 'keccak', 'hash', '哈希']
        },

        // ========== 协议解析（新增） ==========
        {
            id: 'x509',
            category: 'protocol',
            name: 'tools.x509.title',
            description: 'tools.x509.description',
            icon: '📜',
            path: '/tools/protocol/x509/',
            keywords: ['x509', 'certificate', 'ssl', 'tls', 'pem', 'der', '证书', '解析']
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
        },

        // 文件哈希
        {
            id: 'file-hash',
            category: 'binary',
            name: 'tools.file-hash.title',
            description: 'tools.file-hash.description',
            icon: '#️⃣',
            path: '/tools/binary/file-hash/',
            keywords: ['file', 'hash', 'md5', 'sha', 'checksum', '文件', '哈希', '校验']
        },

        // 文件类型检测
        {
            id: 'file-type',
            category: 'binary',
            name: 'tools.file-type.title',
            description: 'tools.file-type.description',
            icon: '🔍',
            path: '/tools/binary/file-type/',
            keywords: ['file', 'type', 'magic', 'detect', '文件类型', '检测', 'magic number']
        },

        // 字节序转换
        {
            id: 'byte-order',
            category: 'binary',
            name: 'tools.byte-order.title',
            description: 'tools.byte-order.description',
            icon: '🔃',
            path: '/tools/binary/byte-order/',
            keywords: ['byte', 'order', 'endian', 'big', 'little', '字节序', '大端', '小端']
        },

        // 二进制编辑器
        {
            id: 'binary-editor',
            category: 'binary',
            name: 'tools.binary-editor.title',
            description: 'tools.binary-editor.description',
            icon: '📝',
            path: '/tools/binary/binary-editor/',
            keywords: ['binary', 'editor', 'hex', 'edit', '二进制', '编辑器', '十六进制', '编辑']
        },

        // EXIF 查看器
        {
            id: 'exif-viewer',
            category: 'binary',
            name: 'tools.exif-viewer.title',
            description: 'tools.exif-viewer.description',
            icon: '📷',
            path: '/tools/media/exif-viewer/',
            keywords: ['exif', 'image', 'photo', 'metadata', 'gps', 'camera', '图片', '元数据', '相机', '位置']
        },

        // IEEE 754 浮点数
        {
            id: 'ieee754',
            category: 'converters',
            name: 'tools.ieee754.title',
            description: 'tools.ieee754.description',
            icon: '🔢',
            path: '/tools/converters/ieee754/',
            keywords: ['ieee', '754', 'float', 'double', 'floating', 'point', '浮点数', '单精度', '双精度']
        },

        // ========== 逆向专用工具 ==========
        {
            id: 'strings-extractor',
            category: 'reverse',
            name: 'tools.strings-extractor.title',
            description: 'tools.strings-extractor.description',
            icon: '📜',
            path: '/tools/reverse/strings-extractor/',
            keywords: ['strings', 'extract', 'binary', 'ascii', 'utf', '字符串', '提取', '二进制']
        },
        {
            id: 'xor-analyzer',
            category: 'reverse',
            name: 'tools.xor-analyzer.title',
            description: 'tools.xor-analyzer.description',
            icon: '⊕',
            path: '/tools/reverse/xor-analyzer/',
            keywords: ['xor', 'cipher', 'bruteforce', 'key', '异或', '加密', '解密', '破解']
        },
        {
            id: 'frequency-analyzer',
            category: 'reverse',
            name: 'tools.frequency-analyzer.title',
            description: 'tools.frequency-analyzer.description',
            icon: '📊',
            path: '/tools/reverse/frequency-analyzer/',
            keywords: ['frequency', 'analysis', 'cipher', 'crypto', '频率', '分析', '密码']
        },
        {
            id: 'offset-calculator',
            category: 'reverse',
            name: 'tools.offset-calculator.title',
            description: 'tools.offset-calculator.description',
            icon: '🧮',
            path: '/tools/reverse/offset-calculator/',
            keywords: ['offset', 'address', 'rva', 'va', 'pe', '偏移', '地址', '内存']
        },

        // ========== 加密工具（新增） ==========
        {
            id: 'chacha20',
            category: 'encryption',
            name: 'tools.chacha20.title',
            description: 'tools.chacha20.description',
            icon: '🔐',
            path: '/tools/encryption/chacha20/',
            keywords: ['chacha20', 'chacha', 'poly1305', 'stream', 'cipher', '流加密', '加密', '解密']
        },
        {
            id: 'blowfish',
            category: 'encryption',
            name: 'tools.blowfish.title',
            description: 'tools.blowfish.description',
            icon: '🐡',
            path: '/tools/encryption/blowfish/',
            keywords: ['blowfish', 'cipher', 'encrypt', 'decrypt', '加密', '解密', '对称']
        },
        {
            id: 'pattern-search',
            category: 'reverse',
            name: 'tools.pattern-search.title',
            description: 'tools.pattern-search.description',
            icon: '🔎',
            path: '/tools/reverse/pattern-search/',
            keywords: ['pattern', 'search', 'binary', 'hex', 'wildcard', '模式', '搜索', '字节']
        },
        {
            id: 'struct-parser',
            category: 'reverse',
            name: 'tools.struct-parser.title',
            description: 'tools.struct-parser.description',
            icon: '🏗️',
            path: '/tools/reverse/struct-parser/',
            keywords: ['struct', 'layout', 'memory', 'padding', 'alignment', '结构体', '内存', '布局']
        },

        // ========== 哈希工具（新增） ==========
        {
            id: 'ripemd',
            category: 'hashing',
            name: 'tools.ripemd.title',
            description: 'tools.ripemd.description',
            icon: '🔐',
            path: '/tools/hashing/ripemd/',
            keywords: ['ripemd', 'ripemd160', 'hash', 'bitcoin', '哈希', '比特币']
        },

        // ========== 加密工具（新增） ==========
        {
            id: 'sm4',
            category: 'encryption',
            name: 'tools.sm4.title',
            description: 'tools.sm4.description',
            icon: '🔒',
            path: '/tools/encryption/sm4/',
            keywords: ['sm4', '国密', 'china', 'encrypt', 'decrypt', '加密', '解密', '对称']
        },
        {
            id: 'ecc',
            category: 'encryption',
            name: 'tools.ecc.title',
            description: 'tools.ecc.description',
            icon: '🔐',
            path: '/tools/encryption/ecc/',
            keywords: ['ecc', 'ecdh', 'ecies', 'elliptic', 'curve', '椭圆曲线', 'encrypt', 'decrypt', '加密', '解密']
        },
        {
            id: 'sm2',
            category: 'encryption',
            name: 'tools.sm2.title',
            description: 'tools.sm2.description',
            icon: '🔒',
            path: '/tools/encryption/sm2/',
            keywords: ['sm2', '国密', 'china', 'elliptic', 'curve', '椭圆曲线', 'encrypt', 'decrypt', '加密', '解密', '签名']
        },
        {
            id: 'ed25519',
            category: 'encryption',
            name: 'tools.ed25519.title',
            description: 'tools.ed25519.description',
            icon: '🔏',
            path: '/tools/encryption/ed25519/',
            keywords: ['ed25519', 'eddsa', 'signature', 'sign', 'verify', '签名', '验证', '数字签名']
        },

        // ========== 协议解析（新增） ==========
        {
            id: 'pem',
            category: 'protocol',
            name: 'tools.pem.title',
            description: 'tools.pem.description',
            icon: '📄',
            path: '/tools/protocol/pem/',
            keywords: ['pem', 'certificate', 'key', 'base64', '证书', '密钥', '解析']
        },
        {
            id: 'asn1',
            category: 'protocol',
            name: 'tools.asn1.title',
            description: 'tools.asn1.description',
            icon: '🔬',
            path: '/tools/protocol/asn1/',
            keywords: ['asn1', 'der', 'ber', 'x509', 'pkcs', '解析']
        },
        {
            id: 'protobuf',
            category: 'protocol',
            name: 'tools.protobuf.title',
            description: 'tools.protobuf.description',
            icon: '📦',
            path: '/tools/protocol/protobuf/',
            keywords: ['protobuf', 'protocol buffers', 'google', 'binary', '解码', '二进制'],
            popular: true
        },

        // ========== 生成器（新增） ==========
        {
            id: 'keypair',
            category: 'generators',
            name: 'tools.keypair.title',
            description: 'tools.keypair.description',
            icon: '🔑',
            path: '/tools/generators/keypair/',
            keywords: ['keypair', 'rsa', 'ecdsa', 'ed25519', 'key', 'generate', '密钥对', '生成']
        },

        // ========== 网络工具（新增） ==========
        {
            id: 'curl-converter',
            category: 'network',
            name: 'tools.curl-converter.title',
            description: 'tools.curl-converter.description',
            icon: '🔄',
            path: '/tools/network/curl-converter/',
            keywords: ['curl', 'convert', 'python', 'javascript', 'php', 'go', '转换', '代码'],
            popular: true
        },

        // ========== 加密工具（综合） ==========
        {
            id: 'x509-certificate',
            category: 'encryption',
            name: 'tools.x509-certificate.title',
            description: 'tools.x509-certificate.description',
            icon: '📜',
            path: '/tools/crypto/x509-certificate/',
            keywords: ['x509', 'certificate', 'csr', 'ca', 'ssl', 'tls', 'pem', 'keypair', 'self-signed', '证书', '密钥对', '自签名', '签发'],
            popular: true
        },

        // ========== 系统工具 ==========
        {
            id: 'crontab',
            category: 'system',
            name: 'tools.crontab.title',
            description: 'tools.crontab.description',
            icon: '⏰',
            path: '/tools/system/crontab/',
            keywords: ['crontab', 'cron', 'schedule', 'timer', '定时任务', '计划任务', '调度']
        },
        {
            id: 'chmod',
            category: 'system',
            name: 'tools.chmod.title',
            description: 'tools.chmod.description',
            icon: '🔐',
            path: '/tools/system/chmod/',
            keywords: ['chmod', 'permission', 'unix', 'linux', '权限', '文件权限', '755', '644']
        },

        // ========== 网络工具（扩展） ==========
        {
            id: 'cidr',
            category: 'network',
            name: 'tools.cidr.title',
            description: 'tools.cidr.description',
            icon: '🌐',
            path: '/tools/network/cidr/',
            keywords: ['cidr', 'subnet', 'ip', 'network', 'mask', '子网', '网络', 'IP地址', '子网掩码']
        },

        // ========== 生成器（扩展） ==========
        {
            id: 'snowflake',
            category: 'generators',
            name: 'tools.snowflake.title',
            description: 'tools.snowflake.description',
            icon: '❄️',
            path: '/tools/generators/snowflake/',
            keywords: ['snowflake', 'id', 'twitter', 'discord', '雪花', '分布式', 'unique', '时间戳']
        },
        {
            id: 'ulid',
            category: 'generators',
            name: 'tools.ulid.title',
            description: 'tools.ulid.description',
            icon: '🆔',
            path: '/tools/generators/ulid/',
            keywords: ['ulid', 'id', 'unique', 'sortable', '标识符', '可排序', 'uuid']
        },
        {
            id: 'objectid',
            category: 'generators',
            name: 'tools.objectid.title',
            description: 'tools.objectid.description',
            icon: '🍃',
            path: '/tools/generators/objectid/',
            keywords: ['objectid', 'mongodb', 'bson', 'id', '标识符', '数据库']
        },
        {
            id: 'timestamp-guesser',
            category: 'generators',
            name: 'tools.timestamp-guesser.title',
            description: 'tools.timestamp-guesser.description',
            icon: '🔮',
            path: '/tools/generators/timestamp-guesser/',
            keywords: ['timestamp', 'guess', 'format', 'unix', 'excel', 'ldap', 'filetime', '时间戳', '格式', '猜测']
        },

        // ========== 协议解析（扩展） ==========
        {
            id: 'msgpack',
            category: 'protocol',
            name: 'tools.msgpack.title',
            description: 'tools.msgpack.description',
            icon: '📦',
            path: '/tools/protocol/msgpack/',
            keywords: ['msgpack', 'messagepack', 'binary', 'serialize', 'tiktok', '抖音', '序列化', '二进制']
        },

        // ========== 哈希工具（扩展） ==========
        {
            id: 'hash-identifier',
            category: 'hashing',
            name: 'tools.hash-identifier.title',
            description: 'tools.hash-identifier.description',
            icon: '🔍',
            path: '/tools/hashing/hash-identifier/',
            keywords: ['hash', 'identifier', 'detect', 'md5', 'sha', 'bcrypt', 'argon2', '哈希', '识别', '检测']
        },
        {
            id: 'kdf',
            category: 'hashing',
            name: 'tools.kdf.title',
            description: 'tools.kdf.description',
            icon: '🔑',
            path: '/tools/hashing/kdf/',
            keywords: ['kdf', 'pbkdf2', 'bcrypt', 'password', 'key', 'derivation', '密钥派生', '密码哈希', '派生函数']
        },
        {
            id: 'hkdf',
            category: 'hashing',
            name: 'tools.hkdf.title',
            description: 'tools.hkdf.description',
            icon: '🔑',
            path: '/tools/hashing/hkdf/',
            keywords: ['hkdf', 'hmac', 'kdf', 'key', 'derivation', 'rfc5869', '密钥派生', 'HMAC']
        },
        {
            id: 'xxhash',
            category: 'hashing',
            name: 'tools.xxhash.title',
            description: 'tools.xxhash.description',
            icon: '⚡',
            path: '/tools/hashing/xxhash/',
            keywords: ['xxhash', 'xxhash32', 'xxhash64', 'hash', 'fast', 'non-cryptographic', '哈希', '高性能']
        },

        // ========== 协议解析（扩展） ==========
        {
            id: 'plist',
            category: 'protocol',
            name: 'tools.plist.title',
            description: 'tools.plist.description',
            icon: '🍎',
            path: '/tools/protocol/plist/',
            keywords: ['plist', 'property list', 'apple', 'ios', 'macos', 'xml', 'binary', '属性列表', '解析']
        }
    ]);

})();
