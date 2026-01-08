/**
 * CodeMirror 6 编辑器封装
 * @description 提供代码高亮编辑器组件
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // 编辑器实例缓存
    const editorInstances = new Map();

    // CodeMirror 模块缓存
    let cmModules = null;
    let loadingPromise = null;

    /**
     * 加载 CodeMirror 所有需要的模块
     * 使用 esm.sh 的 bundle 功能一次性加载
     */
    async function loadCodeMirror() {
        if (cmModules) return cmModules;
        if (loadingPromise) return loadingPromise;

        loadingPromise = (async () => {
            try {
                // 使用 esm.sh 的 bundle 功能，一次性加载所有需要的模块
                const [
                    state,
                    view,
                    commands,
                    language,
                    autocomplete,
                    search,
                    lint,
                    langJavascript,
                    langCss,
                    langHtml,
                    langSql,
                    langJson,
                    langXml,
                    themeOneDark
                ] = await Promise.all([
                    import('https://esm.sh/@codemirror/state@6'),
                    import('https://esm.sh/@codemirror/view@6'),
                    import('https://esm.sh/@codemirror/commands@6'),
                    import('https://esm.sh/@codemirror/language@6'),
                    import('https://esm.sh/@codemirror/autocomplete@6'),
                    import('https://esm.sh/@codemirror/search@6'),
                    import('https://esm.sh/@codemirror/lint@6'),
                    import('https://esm.sh/@codemirror/lang-javascript@6'),
                    import('https://esm.sh/@codemirror/lang-css@6'),
                    import('https://esm.sh/@codemirror/lang-html@6'),
                    import('https://esm.sh/@codemirror/lang-sql@6'),
                    import('https://esm.sh/@codemirror/lang-json@6'),
                    import('https://esm.sh/@codemirror/lang-xml@6'),
                    import('https://esm.sh/@codemirror/theme-one-dark@6')
                ]);

                cmModules = {
                    // State
                    EditorState: state.EditorState,

                    // View
                    EditorView: view.EditorView,
                    keymap: view.keymap,
                    lineNumbers: view.lineNumbers,
                    highlightActiveLineGutter: view.highlightActiveLineGutter,
                    highlightSpecialChars: view.highlightSpecialChars,
                    drawSelection: view.drawSelection,
                    dropCursor: view.dropCursor,
                    rectangularSelection: view.rectangularSelection,
                    crosshairCursor: view.crosshairCursor,
                    highlightActiveLine: view.highlightActiveLine,
                    placeholder: view.placeholder,

                    // Commands
                    defaultKeymap: commands.defaultKeymap,
                    history: commands.history,
                    historyKeymap: commands.historyKeymap,
                    indentWithTab: commands.indentWithTab,

                    // Language
                    indentOnInput: language.indentOnInput,
                    syntaxHighlighting: language.syntaxHighlighting,
                    defaultHighlightStyle: language.defaultHighlightStyle,
                    bracketMatching: language.bracketMatching,
                    foldGutter: language.foldGutter,
                    foldKeymap: language.foldKeymap,

                    // Autocomplete
                    closeBrackets: autocomplete.closeBrackets,
                    closeBracketsKeymap: autocomplete.closeBracketsKeymap,
                    autocompletion: autocomplete.autocompletion,
                    completionKeymap: autocomplete.completionKeymap,

                    // Search
                    searchKeymap: search.searchKeymap,
                    highlightSelectionMatches: search.highlightSelectionMatches,

                    // Lint
                    lintKeymap: lint.lintKeymap,

                    // Languages
                    javascript: langJavascript.javascript,
                    css: langCss.css,
                    html: langHtml.html,
                    sql: langSql.sql,
                    json: langJson.json,
                    xml: langXml.xml,

                    // Theme
                    oneDark: themeOneDark.oneDark
                };

                console.log('CodeMirror modules loaded successfully');
                return cmModules;
            } catch (error) {
                console.error('Failed to load CodeMirror modules:', error);
                loadingPromise = null;
                throw error;
            }
        })();

        return loadingPromise;
    }

    /**
     * 获取语言扩展
     */
    function getLanguageExtension(cm, lang) {
        switch (lang) {
            case 'javascript':
            case 'js':
                return cm.javascript();
            case 'css':
                return cm.css();
            case 'html':
                return cm.html();
            case 'sql':
                return cm.sql();
            case 'json':
                return cm.json();
            case 'xml':
                return cm.xml();
            default:
                return null;
        }
    }

    /**
     * 创建基础扩展配置
     */
    function createExtensions(cm, options = {}) {
        const {
            language = null,
            readOnly = false,
            lineNumbers: showLineNumbers = true,
            foldGutter: showFoldGutter = true,
            theme = 'light',
            placeholderText = ''
        } = options;

        const extensions = [
            cm.highlightActiveLineGutter(),
            cm.highlightSpecialChars(),
            cm.history(),
            cm.drawSelection(),
            cm.dropCursor(),
            cm.EditorState.allowMultipleSelections.of(true),
            cm.indentOnInput(),
            cm.syntaxHighlighting(cm.defaultHighlightStyle, { fallback: true }),
            cm.bracketMatching(),
            cm.closeBrackets(),
            cm.rectangularSelection(),
            cm.crosshairCursor(),
            cm.highlightActiveLine(),
            cm.highlightSelectionMatches(),
            cm.keymap.of([
                ...cm.closeBracketsKeymap,
                ...cm.defaultKeymap,
                ...cm.searchKeymap,
                ...cm.historyKeymap,
                ...cm.foldKeymap,
                ...cm.completionKeymap,
                ...cm.lintKeymap,
                cm.indentWithTab
            ])
        ];

        // 行号
        if (showLineNumbers) {
            extensions.push(cm.lineNumbers());
        }

        // 代码折叠
        if (showFoldGutter) {
            extensions.push(cm.foldGutter());
        }

        // 只读模式
        if (readOnly) {
            extensions.push(cm.EditorState.readOnly.of(true));
            extensions.push(cm.EditorView.editable.of(false));
        }

        // 暗色主题
        if (theme === 'dark') {
            extensions.push(cm.oneDark);
        }

        // 语言支持
        if (language) {
            const langExt = getLanguageExtension(cm, language);
            if (langExt) {
                extensions.push(langExt);
            }
        }

        // 占位符
        if (placeholderText && cm.placeholder) {
            extensions.push(cm.placeholder(placeholderText));
        }

        return extensions;
    }

    /**
     * 创建编辑器
     * @param {HTMLElement|string} container - 容器元素或选择器
     * @param {Object} options - 配置选项
     * @returns {Promise<Object>} 编辑器实例包装
     */
    async function createEditor(container, options = {}) {
        const {
            language = 'javascript',
            value = '',
            readOnly = false,
            lineNumbers = true,
            foldGutter = true,
            theme = 'auto',
            onChange = null,
            placeholder = ''
        } = options;

        // 获取容器元素
        const containerEl = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!containerEl) {
            throw new Error('Editor container not found');
        }

        // 加载 CodeMirror
        const cm = await loadCodeMirror();

        // 检测主题
        const actualTheme = theme === 'auto'
            ? (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light')
            : theme;

        // 创建扩展
        const extensions = createExtensions(cm, {
            language,
            readOnly,
            lineNumbers,
            foldGutter,
            theme: actualTheme,
            placeholderText: placeholder
        });

        // 添加变更监听
        if (onChange && !readOnly) {
            extensions.push(cm.EditorView.updateListener.of(update => {
                if (update.docChanged) {
                    onChange(update.state.doc.toString());
                }
            }));
        }

        // 创建编辑器状态
        const state = cm.EditorState.create({
            doc: value,
            extensions
        });

        // 创建编辑器视图
        const view = new cm.EditorView({
            state,
            parent: containerEl
        });

        // 创建包装对象
        const editor = {
            view,
            cm,

            getValue() {
                return view.state.doc.toString();
            },

            setValue(content) {
                view.dispatch({
                    changes: {
                        from: 0,
                        to: view.state.doc.length,
                        insert: content
                    }
                });
            },

            focus() {
                view.focus();
            },

            destroy() {
                view.destroy();
                editorInstances.delete(containerEl);
            }
        };

        // 缓存实例
        editorInstances.set(containerEl, editor);

        return editor;
    }

    /**
     * 获取已创建的编辑器实例
     */
    function getEditor(container) {
        const containerEl = typeof container === 'string'
            ? document.querySelector(container)
            : container;
        return editorInstances.get(containerEl);
    }

    /**
     * 销毁所有编辑器实例
     */
    function destroyAll() {
        for (const editor of editorInstances.values()) {
            editor.destroy();
        }
        editorInstances.clear();
    }

    // 导出到全局
    window.REOT = window.REOT || {};
    window.REOT.CodeEditor = {
        create: createEditor,
        getEditor,
        destroyAll,
        loadCodeMirror
    };

    console.log('REOT.CodeEditor module initialized');

})();
