/**
 * REOT - Router Module
 * 路由模块
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // 全局命名空间
    window.REOT = window.REOT || {};

    /**
     * 路由模块
     */
    REOT.router = {
        // 当前路由
        currentRoute: null,

        // 路由历史
        history: [],

        // 路由变更回调
        listeners: [],

        /**
         * 初始化路由
         */
        init() {
            // 监听 popstate 事件（浏览器前进/后退）
            window.addEventListener('popstate', (e) => {
                this.handleRouteChange(e.state?.path || window.location.pathname);
            });

            // 监听点击事件，拦截导航链接
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a[data-route]');
                if (link) {
                    e.preventDefault();
                    const path = link.getAttribute('href') || link.getAttribute('data-route');
                    this.navigate(path);
                }
            });

            // 初始化当前路由
            this.handleRouteChange(window.location.pathname);
        },

        /**
         * 导航到指定路径
         * @param {string} path - 路径
         * @param {boolean} replace - 是否替换当前历史记录
         */
        navigate(path, replace = false) {
            if (path === this.currentRoute) {
                return;
            }

            if (replace) {
                window.history.replaceState({ path }, '', path);
            } else {
                window.history.pushState({ path }, '', path);
            }

            this.handleRouteChange(path);
        },

        /**
         * 处理路由变化
         * @param {string} path - 路径
         */
        handleRouteChange(path) {
            const previousRoute = this.currentRoute;
            this.currentRoute = path;

            // 添加到历史
            this.history.push(path);

            // 通知所有监听器
            this.listeners.forEach(callback => {
                callback(path, previousRoute);
            });

            // 加载对应页面内容
            this.loadPage(path);
        },

        /**
         * 加载页面内容
         * @param {string} path - 路径
         */
        async loadPage(path) {
            const homeContent = document.getElementById('home-content');
            const toolContent = document.getElementById('tool-content');

            // 根路径显示首页
            if (path === '/' || path === '/index.html') {
                if (homeContent) {
                    homeContent.style.display = 'block';
                }
                if (toolContent) {
                    toolContent.style.display = 'none';
                    toolContent.innerHTML = '';
                }
                this.updateActiveNav(null);
                return;
            }

            // 工具页面
            if (path.startsWith('/tools/')) {
                if (homeContent) {
                    homeContent.style.display = 'none';
                }
                if (toolContent) {
                    toolContent.style.display = 'block';
                    await this.loadToolPage(path, toolContent);
                }
                this.updateActiveNav(path);
                return;
            }

            // 其他页面 - 显示 404
            this.show404();
        },

        /**
         * 加载工具页面
         * @param {string} path - 工具路径
         * @param {HTMLElement} container - 容器元素
         */
        async loadToolPage(path, container) {
            try {
                // 显示加载状态
                container.innerHTML = `
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                        <p data-i18n="common.loading">加载中...</p>
                    </div>
                `;

                // 获取工具信息
                const tool = REOT.tools?.getByPath(path);

                if (!tool) {
                    this.show404();
                    return;
                }

                // 加载工具HTML
                const response = await fetch(`${path}index.html`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const html = await response.text();

                // 解析HTML并提取body内容
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const toolContainer = doc.querySelector('.tool-container');

                if (toolContainer) {
                    container.innerHTML = toolContainer.outerHTML;
                } else {
                    container.innerHTML = doc.body.innerHTML;
                }

                // 加载工具JS
                await this.loadToolScript(path, tool.id);

                // 加载工具CSS
                this.loadToolStyle(path, tool.id);

                // 加载工具特定的翻译文件（如果存在）
                if (REOT.i18n) {
                    await REOT.i18n.loadToolLocale(path, tool.id);
                }

                // 更新国际化文本
                if (REOT.i18n) {
                    REOT.i18n.updatePageTexts();
                }

                // 更新页面标题
                document.title = `${REOT.i18n?.t(`tools.${tool.id}.title`) || tool.name} - REOT`;

            } catch (error) {
                console.error('加载工具页面失败:', error);
                container.innerHTML = `
                    <div class="error-container">
                        <h2 data-i18n="errors.loadFailed">加载失败</h2>
                        <p>${error.message}</p>
                        <button onclick="REOT.router.navigate('/')" class="btn btn--primary">
                            <span data-i18n="common.backHome">返回首页</span>
                        </button>
                    </div>
                `;
            }
        },

        /**
         * 加载工具脚本
         * @param {string} path - 工具路径
         * @param {string} toolId - 工具ID
         */
        async loadToolScript(path, toolId) {
            // 移除之前加载的工具脚本
            const oldScript = document.querySelector(`script[data-tool="${toolId}"]`);
            if (oldScript) {
                oldScript.remove();
            }

            // 创建新脚本元素
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = `${path}${toolId}.js`;
                script.setAttribute('data-tool', toolId);
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });
        },

        /**
         * 加载工具样式
         * @param {string} path - 工具路径
         * @param {string} toolId - 工具ID
         */
        loadToolStyle(path, toolId) {
            // 移除之前加载的工具样式
            const oldStyle = document.querySelector(`link[data-tool="${toolId}"]`);
            if (oldStyle) {
                oldStyle.remove();
            }

            // 创建新样式链接
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `${path}${toolId}.css`;
            link.setAttribute('data-tool', toolId);
            link.onerror = () => {
                // CSS文件不存在时静默处理
                link.remove();
            };
            document.head.appendChild(link);
        },

        /**
         * 显示404页面
         */
        show404() {
            const homeContent = document.getElementById('home-content');
            const toolContent = document.getElementById('tool-content');

            if (homeContent) {
                homeContent.style.display = 'none';
            }

            if (toolContent) {
                toolContent.style.display = 'block';
                toolContent.innerHTML = `
                    <div class="error-container" style="text-align: center; padding: 60px 20px;">
                        <h1 style="font-size: 72px; margin-bottom: 20px;">404</h1>
                        <h2 data-i18n="errors.pageNotFound">页面未找到</h2>
                        <p data-i18n="errors.pageNotFoundDesc">您访问的页面不存在或已被移除</p>
                        <button onclick="REOT.router.navigate('/')" class="btn btn--primary" style="margin-top: 20px;">
                            <span data-i18n="common.backHome">返回首页</span>
                        </button>
                    </div>
                `;
            }

            if (REOT.i18n) {
                REOT.i18n.updatePageTexts();
            }
        },

        /**
         * 更新导航栏激活状态
         * @param {string} path - 当前路径
         */
        updateActiveNav(path) {
            // 移除所有激活状态
            document.querySelectorAll('.tool-link.active').forEach(link => {
                link.classList.remove('active');
            });

            // 添加当前激活状态
            if (path) {
                const activeLink = document.querySelector(`.tool-link[href="${path}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');

                    // 展开父分类
                    const category = activeLink.closest('.nav-category');
                    if (category) {
                        category.classList.remove('collapsed');
                    }
                }
            }
        },

        /**
         * 添加路由变更监听器
         * @param {Function} callback - 回调函数
         */
        onChange(callback) {
            this.listeners.push(callback);
        },

        /**
         * 移除路由变更监听器
         * @param {Function} callback - 回调函数
         */
        offChange(callback) {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        },

        /**
         * 后退
         */
        back() {
            window.history.back();
        },

        /**
         * 前进
         */
        forward() {
            window.history.forward();
        },

        /**
         * 获取当前路由
         * @returns {string}
         */
        getRoute() {
            return this.currentRoute;
        },

        /**
         * 检查路由是否匹配
         * @param {string} pattern - 路由模式
         * @returns {boolean}
         */
        isMatch(pattern) {
            if (pattern.includes('*')) {
                const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                return regex.test(this.currentRoute);
            }
            return this.currentRoute === pattern;
        }
    };

    // 添加加载样式
    const style = document.createElement('style');
    style.textContent = `
        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 300px;
        }
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--border-color);
            border-top-color: var(--color-primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .error-container {
            text-align: center;
            padding: 40px;
        }
        .error-container h2 {
            margin-bottom: 10px;
            color: var(--text-primary);
        }
        .error-container p {
            color: var(--text-secondary);
            margin-bottom: 20px;
        }
    `;
    document.head.appendChild(style);

})();
