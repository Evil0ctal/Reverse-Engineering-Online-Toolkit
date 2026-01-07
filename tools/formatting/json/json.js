/**
 * JSON 格式化工具 (增强版)
 * @description JSON 格式化、压缩、校验、树形视图、Python Dict 转换
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // 状态变量
    // 注意：由于 SPA 动态加载，所有 DOM 元素都需要在使用时动态获取
    let currentJson = null;
    let currentMode = 'text'; // 'text' | 'tree'
    let selectedTreeNode = null;

    /**
     * Python Dict 转 JSON
     * 处理单引号、True/False/None、元组等
     */
    function pythonDictToJson(input) {
        let result = input;

        // 处理 Python 的 None -> null
        result = result.replace(/\bNone\b/g, 'null');

        // 处理 Python 的 True -> true
        result = result.replace(/\bTrue\b/g, 'true');

        // 处理 Python 的 False -> false
        result = result.replace(/\bFalse\b/g, 'false');

        // 处理单引号字符串 -> 双引号
        // 这个比较复杂，需要处理转义和嵌套的情况
        result = convertQuotes(result);

        // 处理元组 () -> 数组 []
        result = result.replace(/\(/g, '[').replace(/\)/g, ']');

        // 处理尾随逗号
        result = result.replace(/,(\s*[}\]])/g, '$1');

        return result;
    }

    /**
     * 将单引号字符串转换为双引号
     */
    function convertQuotes(str) {
        let result = '';
        let inString = false;
        let stringChar = null;
        let i = 0;

        while (i < str.length) {
            const char = str[i];
            const nextChar = str[i + 1];

            if (!inString) {
                if (char === "'" || char === '"') {
                    inString = true;
                    stringChar = char;
                    result += '"';
                } else {
                    result += char;
                }
            } else {
                if (char === '\\' && nextChar) {
                    // 处理转义字符
                    if (nextChar === stringChar) {
                        result += '\\' + (stringChar === "'" ? '"' : stringChar);
                        i++;
                    } else if (nextChar === '"' && stringChar === "'") {
                        // 在单引号字符串中的双引号需要转义
                        result += '\\"';
                        i++;
                    } else {
                        result += char;
                    }
                } else if (char === stringChar) {
                    // 字符串结束
                    inString = false;
                    stringChar = null;
                    result += '"';
                } else if (char === '"' && stringChar === "'") {
                    // 单引号字符串内的双引号需要转义
                    result += '\\"';
                } else {
                    result += char;
                }
            }
            i++;
        }

        return result;
    }

    /**
     * 尝试解析输入（支持 JSON 和 Python Dict）
     */
    function parseInput(input) {
        if (!input.trim()) {
            return null;
        }

        // 先尝试直接解析为 JSON
        try {
            return JSON.parse(input);
        } catch (e) {
            // 如果启用了 Python 自动转换，尝试转换
            const autoPython = document.getElementById('auto-python');
            if (autoPython && autoPython.checked) {
                try {
                    const converted = pythonDictToJson(input);
                    return JSON.parse(converted);
                } catch (e2) {
                    throw new Error(`JSON 解析错误: ${e.message}`);
                }
            }
            throw new Error(`JSON 解析错误: ${e.message}`);
        }
    }

    /**
     * 递归排序对象键名
     */
    function sortObjectKeys(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(sortObjectKeys);
        }
        const sorted = {};
        Object.keys(obj).sort().forEach(key => {
            sorted[key] = sortObjectKeys(obj[key]);
        });
        return sorted;
    }

    /**
     * 获取缩进值
     */
    function getIndent() {
        const indentSelect = document.getElementById('indent-select');
        let indent = indentSelect ? indentSelect.value : 4;
        if (indent === '\\t') {
            indent = '\t';
        } else {
            indent = parseInt(indent, 10);
        }
        return indent;
    }

    /**
     * 格式化 JSON
     */
    function format(input) {
        let obj = parseInput(input);
        if (obj === null) return '';

        const sortKeys = document.getElementById('sort-keys');
        if (sortKeys && sortKeys.checked) {
            obj = sortObjectKeys(obj);
        }

        currentJson = obj;
        return JSON.stringify(obj, null, getIndent());
    }

    /**
     * 压缩 JSON
     */
    function minify(input) {
        const obj = parseInput(input);
        if (obj === null) return '';
        currentJson = obj;
        return JSON.stringify(obj);
    }

    /**
     * 语法高亮
     */
    function syntaxHighlight(json) {
        if (typeof json !== 'string') {
            json = JSON.stringify(json, null, getIndent());
        }

        // 转义 HTML
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // 添加语法高亮
        return json.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            function(match) {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                        // 移除末尾的冒号，单独处理
                        return '<span class="' + cls + '">' + match.slice(0, -1) + '</span><span class="json-colon">:</span>';
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return '<span class="' + cls + '">' + match + '</span>';
            }
        );
    }

    /**
     * 显示高亮输出
     */
    function showHighlightedOutput(jsonStr) {
        const highlightedOutput = document.getElementById('highlighted-output');
        const output = document.getElementById('output');
        if (highlightedOutput) {
            highlightedOutput.innerHTML = syntaxHighlight(jsonStr);
        }
        if (output) {
            output.value = jsonStr;
        }
    }

    /**
     * 显示错误
     */
    function showError(message) {
        const highlightedOutput = document.getElementById('highlighted-output');
        const output = document.getElementById('output');
        if (highlightedOutput) {
            highlightedOutput.innerHTML = `<div class="json-error">${message}</div>`;
        }
        if (output) {
            output.value = message;
        }
    }

    // ==================== 树形视图 ====================

    /**
     * 创建树形视图
     */
    function createTreeView(obj, path = '$') {
        const container = document.createElement('div');
        container.className = 'tree-root';

        const rootNode = createTreeNode('root', obj, path, true);
        container.appendChild(rootNode);

        return container;
    }

    /**
     * 创建树节点
     */
    function createTreeNode(key, value, path, isRoot = false) {
        const node = document.createElement('div');
        node.className = 'tree-node';
        node.dataset.path = path;
        node.dataset.key = key;

        const content = document.createElement('div');
        content.className = 'tree-node-content';

        const type = getValueType(value);
        const isExpandable = type === 'object' || type === 'array';

        // 折叠按钮
        if (isExpandable) {
            const toggle = document.createElement('span');
            toggle.className = 'tree-toggle';
            toggle.innerHTML = '▼';
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleNode(node);
            });
            content.appendChild(toggle);
        } else {
            const placeholder = document.createElement('span');
            placeholder.className = 'tree-toggle-placeholder';
            content.appendChild(placeholder);
        }

        // 键名
        if (!isRoot) {
            const keySpan = document.createElement('span');
            keySpan.className = 'tree-key';
            keySpan.textContent = typeof key === 'number' ? `[${key}]` : `"${key}"`;
            content.appendChild(keySpan);

            const colon = document.createElement('span');
            colon.className = 'json-colon';
            colon.textContent = ': ';
            content.appendChild(colon);
        }

        // 值
        if (isExpandable) {
            const preview = document.createElement('span');
            preview.className = 'tree-preview';

            if (type === 'array') {
                preview.textContent = `Array(${value.length})`;
            } else {
                const keys = Object.keys(value);
                preview.textContent = `Object{${keys.length}}`;
            }
            content.appendChild(preview);
        } else {
            const valueSpan = document.createElement('span');
            valueSpan.className = `tree-value tree-value-${type}`;
            valueSpan.textContent = formatValue(value, type);
            content.appendChild(valueSpan);
        }

        // 右键菜单
        content.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e, node, key, value, path);
        });

        // 选中
        content.addEventListener('click', () => {
            selectTreeNode(node);
        });

        node.appendChild(content);

        // 子节点
        if (isExpandable) {
            const children = document.createElement('div');
            children.className = 'tree-children';

            if (type === 'array') {
                value.forEach((item, index) => {
                    const childPath = `${path}[${index}]`;
                    children.appendChild(createTreeNode(index, item, childPath));
                });
            } else {
                Object.keys(value).forEach(k => {
                    const childPath = `${path}.${k}`;
                    children.appendChild(createTreeNode(k, value[k], childPath));
                });
            }

            node.appendChild(children);
            node.dataset.value = JSON.stringify(value);
        } else {
            node.dataset.value = JSON.stringify(value);
        }

        return node;
    }

    /**
     * 获取值类型
     */
    function getValueType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }

    /**
     * 格式化值显示
     */
    function formatValue(value, type) {
        switch (type) {
            case 'string':
                return `"${value}"`;
            case 'null':
                return 'null';
            case 'undefined':
                return 'undefined';
            default:
                return String(value);
        }
    }

    /**
     * 切换节点展开/折叠
     */
    function toggleNode(node) {
        const toggle = node.querySelector(':scope > .tree-node-content > .tree-toggle');
        const children = node.querySelector(':scope > .tree-children');

        if (toggle && children) {
            toggle.classList.toggle('collapsed');
            children.classList.toggle('collapsed');
        }
    }

    /**
     * 展开所有节点
     */
    function expandAll() {
        const jsonTree = document.getElementById('json-tree');
        if (!jsonTree) return;
        const toggles = jsonTree.querySelectorAll('.tree-toggle');
        const children = jsonTree.querySelectorAll('.tree-children');

        toggles.forEach(t => t.classList.remove('collapsed'));
        children.forEach(c => c.classList.remove('collapsed'));
    }

    /**
     * 折叠所有节点
     */
    function collapseAll() {
        const jsonTree = document.getElementById('json-tree');
        if (!jsonTree) return;
        const toggles = jsonTree.querySelectorAll('.tree-toggle');
        const children = jsonTree.querySelectorAll('.tree-children');

        toggles.forEach(t => t.classList.add('collapsed'));
        children.forEach(c => c.classList.add('collapsed'));
    }

    /**
     * 选中树节点
     */
    function selectTreeNode(node) {
        const jsonTree = document.getElementById('json-tree');
        if (!jsonTree) return;
        // 移除之前的选中
        const prevSelected = jsonTree.querySelector('.tree-node-content.selected');
        if (prevSelected) {
            prevSelected.classList.remove('selected');
        }

        // 选中当前节点
        const content = node.querySelector(':scope > .tree-node-content');
        if (content) {
            content.classList.add('selected');
        }
        selectedTreeNode = node;
    }

    // ==================== 右键菜单 ====================

    /**
     * 显示右键菜单
     */
    function showContextMenu(e, node, key, value, path) {
        selectTreeNode(node);

        const contextMenu = document.getElementById('context-menu');
        if (!contextMenu) return;

        contextMenu.style.display = 'block';
        contextMenu.style.left = `${e.pageX}px`;
        contextMenu.style.top = `${e.pageY}px`;

        // 存储当前上下文
        contextMenu.dataset.path = path;
        contextMenu.dataset.key = key;
        contextMenu.dataset.value = JSON.stringify(value);

        // 确保菜单不超出视口
        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = `${e.pageX - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = `${e.pageY - rect.height}px`;
        }
    }

    /**
     * 隐藏右键菜单
     */
    function hideContextMenu() {
        const contextMenu = document.getElementById('context-menu');
        if (contextMenu) {
            contextMenu.style.display = 'none';
        }
    }

    /**
     * 处理右键菜单操作
     */
    function handleContextMenuAction(action) {
        const contextMenu = document.getElementById('context-menu');
        if (!contextMenu) return;

        const path = contextMenu.dataset.path;
        const key = contextMenu.dataset.key;
        let value;

        try {
            value = JSON.parse(contextMenu.dataset.value);
        } catch (e) {
            value = contextMenu.dataset.value;
        }

        switch (action) {
            case 'copy-path':
                copyToClipboard(path);
                break;
            case 'copy-key':
                copyToClipboard(key);
                break;
            case 'copy-value-formatted':
                copyToClipboard(JSON.stringify(value, null, getIndent()));
                break;
            case 'copy-value-minified':
                copyToClipboard(JSON.stringify(value));
                break;
            case 'expand-children':
                if (selectedTreeNode) {
                    const children = selectedTreeNode.querySelectorAll('.tree-toggle');
                    const childContainers = selectedTreeNode.querySelectorAll('.tree-children');
                    children.forEach(t => t.classList.remove('collapsed'));
                    childContainers.forEach(c => c.classList.remove('collapsed'));
                }
                break;
            case 'collapse-children':
                if (selectedTreeNode) {
                    const children = selectedTreeNode.querySelectorAll('.tree-toggle');
                    const childContainers = selectedTreeNode.querySelectorAll('.tree-children');
                    children.forEach(t => t.classList.add('collapsed'));
                    childContainers.forEach(c => c.classList.add('collapsed'));
                }
                break;
        }

        hideContextMenu();
    }

    /**
     * 复制到剪贴板
     */
    async function copyToClipboard(text) {
        const success = await REOT.utils?.copyToClipboard(text);
        if (success) {
            REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
        }
    }

    // ==================== 视图切换 ====================

    /**
     * 切换到树形视图
     */
    function switchToTreeView() {
        const input = document.getElementById('input');
        const textOutputSection = document.getElementById('text-output-section');
        const treeOutputSection = document.getElementById('tree-output-section');
        const jsonTree = document.getElementById('json-tree');

        if (!currentJson) {
            try {
                currentJson = parseInput(input?.value || '');
            } catch (e) {
                REOT.utils?.showNotification(e.message, 'error');
                return;
            }
        }

        if (!currentJson) {
            REOT.utils?.showNotification('请先输入有效的 JSON', 'warning');
            return;
        }

        currentMode = 'tree';
        if (textOutputSection) textOutputSection.style.display = 'none';
        if (treeOutputSection) treeOutputSection.style.display = 'block';

        // 渲染树形视图
        if (jsonTree) {
            jsonTree.innerHTML = '';
            jsonTree.appendChild(createTreeView(currentJson));
        }
    }

    /**
     * 切换到文本视图
     */
    function switchToTextView() {
        const textOutputSection = document.getElementById('text-output-section');
        const treeOutputSection = document.getElementById('tree-output-section');

        currentMode = 'text';
        if (textOutputSection) textOutputSection.style.display = 'block';
        if (treeOutputSection) treeOutputSection.style.display = 'none';
    }

    // ==================== 事件绑定 ====================
    // 使用事件委托来处理 SPA 动态加载的元素

    // 主要的事件委托处理器
    document.addEventListener('click', (e) => {
        const target = e.target;

        // 格式化按钮
        if (target.id === 'format-btn' || target.closest('#format-btn')) {
            try {
                const input = document.getElementById('input');
                const result = format(input.value);
                showHighlightedOutput(result);
                if (currentMode === 'tree') {
                    switchToTreeView();
                }
            } catch (error) {
                showError(error.message);
                REOT.utils?.showNotification(error.message, 'error');
            }
        }

        // 压缩按钮
        if (target.id === 'minify-btn' || target.closest('#minify-btn')) {
            try {
                const input = document.getElementById('input');
                const result = minify(input.value);
                showHighlightedOutput(result);
            } catch (error) {
                showError(error.message);
                REOT.utils?.showNotification(error.message, 'error');
            }
        }

        // 树形视图按钮
        if (target.id === 'tree-btn' || target.closest('#tree-btn')) {
            switchToTreeView();
        }

        // 清除按钮
        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            const input = document.getElementById('input');
            const output = document.getElementById('output');
            const highlightedOutput = document.getElementById('highlighted-output');
            const jsonTree = document.getElementById('json-tree');
            if (input) input.value = '';
            if (output) output.value = '';
            if (highlightedOutput) highlightedOutput.innerHTML = '';
            if (jsonTree) jsonTree.innerHTML = '';
            currentJson = null;
        }

        // 复制按钮
        if (target.id === 'copy-btn' || target.closest('#copy-btn')) {
            const output = document.getElementById('output');
            if (output) copyToClipboard(output.value);
        }

        // 展开全部
        if (target.id === 'expand-all' || target.closest('#expand-all')) {
            expandAll();
        }

        // 折叠全部
        if (target.id === 'collapse-all' || target.closest('#collapse-all')) {
            collapseAll();
        }

        // 返回文本视图
        if (target.id === 'back-to-text' || target.closest('#back-to-text')) {
            switchToTextView();
        }

        // 右键菜单项
        const menuItem = target.closest('.context-menu-item');
        if (menuItem) {
            handleContextMenuAction(menuItem.dataset.action);
        }

        // 点击其他地方关闭右键菜单
        const contextMenu = document.getElementById('context-menu');
        if (contextMenu && !contextMenu.contains(target)) {
            hideContextMenu();
        }
    });

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
        // Escape 关闭菜单
        if (e.key === 'Escape') {
            hideContextMenu();
        }
    });

    // 导出工具函数
    window.JsonTool = {
        format,
        minify,
        sortObjectKeys,
        pythonDictToJson,
        syntaxHighlight
    };

    // 设置默认示例数据
    const defaultInput = document.getElementById('input');
    if (defaultInput && !defaultInput.value) {
        const sampleJson = {
            "name": "REOT",
            "version": "1.0.0",
            "description": "逆向工程在线工具箱",
            "features": ["编码解码", "加密解密", "格式化"],
            "author": {
                "name": "Evil0ctal",
                "github": "https://github.com/Evil0ctal"
            },
            "isOpenSource": true,
            "stars": 1024
        };
        defaultInput.value = JSON.stringify(sampleJson, null, 2);
    }

})();
