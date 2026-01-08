/**
 * SQL 格式化工具
 * @description SQL 语句格式化、美化与压缩
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    /**
     * 检查当前是否在 SQL 工具页面
     */
    function isSqlToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/formatting/sql');
    }

    // SQL 关键字
    const SQL_KEYWORDS = [
        'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL',
        'LIKE', 'BETWEEN', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
        'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
        'CREATE', 'TABLE', 'INDEX', 'VIEW', 'DATABASE', 'SCHEMA',
        'ALTER', 'ADD', 'DROP', 'COLUMN', 'CONSTRAINT',
        'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE',
        'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'CROSS', 'ON',
        'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET',
        'UNION', 'ALL', 'INTERSECT', 'EXCEPT', 'DISTINCT',
        'AS', 'WITH', 'RECURSIVE', 'TEMPORARY', 'TEMP', 'IF',
        'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION', 'SAVEPOINT',
        'GRANT', 'REVOKE', 'TRUNCATE', 'CASCADE', 'RESTRICT',
        'DEFAULT', 'CHECK', 'AUTO_INCREMENT', 'IDENTITY',
        'TOP', 'FETCH', 'NEXT', 'ROWS', 'ONLY', 'FIRST', 'PERCENT',
        'OVER', 'PARTITION', 'ROW_NUMBER', 'RANK', 'DENSE_RANK',
        'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'NULLIF',
        'CAST', 'CONVERT', 'SUBSTRING', 'TRIM', 'CONCAT',
        'TRUE', 'FALSE', 'BOOLEAN', 'INT', 'INTEGER', 'BIGINT', 'SMALLINT',
        'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'REAL',
        'VARCHAR', 'CHAR', 'TEXT', 'BLOB', 'DATE', 'TIME', 'TIMESTAMP', 'DATETIME'
    ];

    // 需要换行的关键字
    const NEWLINE_KEYWORDS = [
        'SELECT', 'FROM', 'WHERE', 'AND', 'OR',
        'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN',
        'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN',
        'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET',
        'UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT',
        'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
        'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
        'ON', 'WHEN', 'ELSE', 'THEN'
    ];

    // 增加缩进的关键字
    const INDENT_KEYWORDS = ['SELECT', 'FROM', 'WHERE', 'SET', 'VALUES'];

    /**
     * 词法分析器
     */
    function tokenize(sql) {
        const tokens = [];
        let i = 0;

        while (i < sql.length) {
            const char = sql[i];

            // 跳过空白
            if (/\s/.test(char)) {
                i++;
                continue;
            }

            // 单行注释
            if (sql.substr(i, 2) === '--') {
                const end = sql.indexOf('\n', i);
                const comment = sql.substring(i, end === -1 ? sql.length : end);
                tokens.push({ type: 'comment', value: comment });
                i += comment.length;
                continue;
            }

            // 多行注释
            if (sql.substr(i, 2) === '/*') {
                const end = sql.indexOf('*/', i);
                const comment = sql.substring(i, end === -1 ? sql.length : end + 2);
                tokens.push({ type: 'comment', value: comment });
                i += comment.length;
                continue;
            }

            // 字符串（单引号）
            if (char === "'") {
                let str = "'";
                i++;
                while (i < sql.length) {
                    if (sql[i] === "'" && sql[i + 1] === "'") {
                        str += "''";
                        i += 2;
                    } else if (sql[i] === "'") {
                        str += "'";
                        i++;
                        break;
                    } else {
                        str += sql[i];
                        i++;
                    }
                }
                tokens.push({ type: 'string', value: str });
                continue;
            }

            // 字符串（双引号/标识符）
            if (char === '"') {
                let str = '"';
                i++;
                while (i < sql.length && sql[i] !== '"') {
                    str += sql[i];
                    i++;
                }
                if (i < sql.length) {
                    str += '"';
                    i++;
                }
                tokens.push({ type: 'identifier', value: str });
                continue;
            }

            // 反引号标识符（MySQL）
            if (char === '`') {
                let str = '`';
                i++;
                while (i < sql.length && sql[i] !== '`') {
                    str += sql[i];
                    i++;
                }
                if (i < sql.length) {
                    str += '`';
                    i++;
                }
                tokens.push({ type: 'identifier', value: str });
                continue;
            }

            // 方括号标识符（T-SQL）
            if (char === '[') {
                let str = '[';
                i++;
                while (i < sql.length && sql[i] !== ']') {
                    str += sql[i];
                    i++;
                }
                if (i < sql.length) {
                    str += ']';
                    i++;
                }
                tokens.push({ type: 'identifier', value: str });
                continue;
            }

            // 数字
            if (/\d/.test(char) || (char === '.' && /\d/.test(sql[i + 1]))) {
                let num = '';
                while (i < sql.length && /[\d.eE+-]/.test(sql[i])) {
                    num += sql[i];
                    i++;
                }
                tokens.push({ type: 'number', value: num });
                continue;
            }

            // 标识符/关键字
            if (/[a-zA-Z_]/.test(char)) {
                let word = '';
                while (i < sql.length && /[a-zA-Z0-9_]/.test(sql[i])) {
                    word += sql[i];
                    i++;
                }
                const upper = word.toUpperCase();
                if (SQL_KEYWORDS.includes(upper)) {
                    tokens.push({ type: 'keyword', value: word, keyword: upper });
                } else {
                    tokens.push({ type: 'identifier', value: word });
                }
                continue;
            }

            // 操作符和符号
            const twoChar = sql.substr(i, 2);
            if (['<=', '>=', '<>', '!=', '||', '&&', '::', '->'].includes(twoChar)) {
                tokens.push({ type: 'operator', value: twoChar });
                i += 2;
                continue;
            }

            tokens.push({ type: 'symbol', value: char });
            i++;
        }

        return tokens;
    }

    /**
     * 格式化 SQL
     */
    function formatSql(sql, options = {}) {
        const {
            indent = '    ',
            keywordCase = 'upper',
            lineBetweenStatements = true
        } = options;

        const tokens = tokenize(sql);
        let result = '';
        let currentIndent = 0;
        let newLine = true;
        let prevToken = null;

        // 组合多词关键字
        const combinedTokens = [];
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (token.type === 'keyword') {
                // 检查是否是多词关键字
                const nextToken = tokens[i + 1];
                if (nextToken && nextToken.type === 'keyword') {
                    const combined = token.keyword + ' ' + nextToken.keyword;
                    if (NEWLINE_KEYWORDS.includes(combined)) {
                        combinedTokens.push({
                            type: 'keyword',
                            value: token.value + ' ' + nextToken.value,
                            keyword: combined
                        });
                        i++;
                        continue;
                    }
                }
            }
            combinedTokens.push(token);
        }

        function addIndent() {
            result += indent.repeat(currentIndent);
        }

        function transformKeyword(value, keyword) {
            if (keywordCase === 'upper') {
                return keyword || value.toUpperCase();
            } else if (keywordCase === 'lower') {
                return (keyword || value).toLowerCase();
            }
            return value;
        }

        for (let i = 0; i < combinedTokens.length; i++) {
            const token = combinedTokens[i];
            const nextToken = combinedTokens[i + 1];

            if (token.type === 'keyword') {
                const keyword = token.keyword;

                // 检查是否需要换行
                if (NEWLINE_KEYWORDS.includes(keyword)) {
                    // 某些关键字前需要换行
                    if (!newLine && prevToken) {
                        result += '\n';
                        newLine = true;
                    }

                    // 调整缩进
                    if (['FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET'].includes(keyword)) {
                        currentIndent = 0;
                    } else if (['AND', 'OR'].includes(keyword)) {
                        currentIndent = 1;
                    } else if (keyword.includes('JOIN')) {
                        currentIndent = 0;
                    } else if (keyword === 'ON') {
                        currentIndent = 1;
                    }
                }

                if (newLine) {
                    addIndent();
                    newLine = false;
                } else if (prevToken && prevToken.type !== 'symbol') {
                    result += ' ';
                }

                result += transformKeyword(token.value, token.keyword);

                // SELECT 后增加缩进
                if (keyword === 'SELECT') {
                    currentIndent = 1;
                }

            } else if (token.type === 'comment') {
                if (!newLine) {
                    result += ' ';
                }
                result += token.value;
                if (!token.value.startsWith('/*')) {
                    result += '\n';
                    newLine = true;
                }

            } else if (token.type === 'symbol') {
                if (token.value === ';') {
                    result += token.value;
                    if (lineBetweenStatements) {
                        result += '\n\n';
                    } else {
                        result += '\n';
                    }
                    newLine = true;
                    currentIndent = 0;
                } else if (token.value === ',') {
                    result += token.value;
                    result += '\n';
                    newLine = true;
                } else if (token.value === '(') {
                    if (!newLine && prevToken && prevToken.type === 'keyword') {
                        result += ' ';
                    }
                    result += token.value;
                } else if (token.value === ')') {
                    result += token.value;
                } else {
                    if (!newLine && prevToken && !['(', '.'].includes(prevToken.value)) {
                        result += ' ';
                    }
                    result += token.value;
                }
                if (token.value !== '(' && token.value !== ')' && token.value !== '.' && token.value !== ',' && token.value !== ';') {
                    newLine = false;
                }

            } else {
                // 标识符、字符串、数字
                if (newLine) {
                    addIndent();
                    newLine = false;
                } else if (prevToken && prevToken.value !== '(' && prevToken.value !== '.') {
                    result += ' ';
                }
                result += token.value;
            }

            prevToken = token;
        }

        return result.trim();
    }

    /**
     * 压缩 SQL
     */
    function minifySql(sql) {
        const tokens = tokenize(sql);
        let result = '';
        let prevToken = null;

        for (const token of tokens) {
            if (token.type === 'comment') {
                // 跳过注释
                continue;
            }

            // 判断是否需要空格
            if (prevToken) {
                const needSpace = (
                    (prevToken.type === 'keyword' || prevToken.type === 'identifier' || prevToken.type === 'number') &&
                    (token.type === 'keyword' || token.type === 'identifier' || token.type === 'number')
                ) || (
                    prevToken.value === ',' ||
                    (prevToken.type === 'operator' && token.type !== 'symbol') ||
                    (token.type === 'operator' && prevToken.type !== 'symbol')
                );

                if (needSpace && prevToken.value !== '(' && prevToken.value !== '.' && token.value !== ')' && token.value !== '.' && token.value !== ',') {
                    result += ' ';
                }
            }

            result += token.value;
            prevToken = token;
        }

        return result;
    }

    /**
     * 获取选项
     */
    function getOptions() {
        const indentValue = document.getElementById('indent-select')?.value || '4';
        const indent = indentValue === 'tab' ? '\t' : ' '.repeat(parseInt(indentValue));
        const keywordCase = document.getElementById('case-select')?.value || 'upper';
        const lineBetweenStatements = document.getElementById('line-between')?.checked ?? true;

        return { indent, keywordCase, lineBetweenStatements };
    }

    /**
     * 加载示例
     */
    function loadExample() {
        return `SELECT u.id, u.name, u.email, COUNT(o.id) as order_count, SUM(o.total) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active' AND u.created_at >= '2024-01-01'
GROUP BY u.id, u.name, u.email
HAVING COUNT(o.id) > 0
ORDER BY total_spent DESC
LIMIT 10;

INSERT INTO logs (user_id, action, timestamp) VALUES (1, 'login', NOW());

UPDATE users SET last_login = NOW(), login_count = login_count + 1 WHERE id = 1;`;
    }

    // 编辑器实例
    let inputEditor = null;
    let outputEditor = null;

    function getInputValue() {
        if (inputEditor) return inputEditor.getValue();
        return document.getElementById('input')?.value || '';
    }

    function setInputValue(value) {
        if (inputEditor) {
            inputEditor.setValue(value);
        } else {
            const el = document.getElementById('input');
            if (el) el.value = value;
        }
    }

    function setOutputValue(value) {
        if (outputEditor) {
            outputEditor.setValue(value);
        } else {
            const el = document.getElementById('output');
            if (el) el.value = value;
        }
    }

    function getOutputValue() {
        if (outputEditor) return outputEditor.getValue();
        return document.getElementById('output')?.value || '';
    }

    async function initEditors() {
        if (!REOT.CodeEditor) {
            console.warn('CodeEditor not available, using textarea fallback');
            const inputEl = document.getElementById('input');
            const outputEl = document.getElementById('output');
            if (inputEl) inputEl.style.display = '';
            if (outputEl) outputEl.style.display = '';
            const inputContainer = document.getElementById('input-editor');
            const outputContainer = document.getElementById('output-editor');
            if (inputContainer) inputContainer.style.display = 'none';
            if (outputContainer) outputContainer.style.display = 'none';
            return;
        }

        try {
            const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

            inputEditor = await REOT.CodeEditor.create('#input-editor', {
                language: 'sql',
                value: '',
                readOnly: false,
                theme: theme,
                placeholder: '请输入 SQL 语句...'
            });

            outputEditor = await REOT.CodeEditor.create('#output-editor', {
                language: 'sql',
                value: '',
                readOnly: true,
                theme: theme
            });

            console.log('SQL editors initialized');
        } catch (error) {
            console.error('Failed to initialize editors:', error);
            const inputEl = document.getElementById('input');
            const outputEl = document.getElementById('output');
            if (inputEl) inputEl.style.display = '';
            if (outputEl) outputEl.style.display = '';
            const inputContainer = document.getElementById('input-editor');
            const outputContainer = document.getElementById('output-editor');
            if (inputContainer) inputContainer.style.display = 'none';
            if (outputContainer) outputContainer.style.display = 'none';
        }
    }

    // 事件处理
    document.addEventListener('click', async (e) => {
        if (!isSqlToolActive()) return;

        const target = e.target;

        if (target.id === 'format-btn' || target.closest('#format-btn')) {
            try {
                const options = getOptions();
                const result = formatSql(getInputValue(), options);
                setOutputValue(result);
                REOT.utils?.showNotification('格式化成功', 'success');
            } catch (error) {
                REOT.utils?.showNotification('格式化失败: ' + error.message, 'error');
            }
        }

        if (target.id === 'minify-btn' || target.closest('#minify-btn')) {
            try {
                const result = minifySql(getInputValue());
                setOutputValue(result);
                REOT.utils?.showNotification('压缩成功', 'success');
            } catch (error) {
                REOT.utils?.showNotification('压缩失败: ' + error.message, 'error');
            }
        }

        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            setInputValue('');
            setOutputValue('');
        }

        if (target.id === 'copy-btn' || target.closest('#copy-btn')) {
            const value = getOutputValue();
            if (value) {
                const success = await REOT.utils?.copyToClipboard(value);
                if (success) {
                    REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
                }
            }
        }

        if (target.id === 'example-btn' || target.closest('#example-btn')) {
            setInputValue(loadExample());
        }
    });

    // 页面加载时初始化编辑器
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (isSqlToolActive()) initEditors();
        });
    } else {
        if (isSqlToolActive()) initEditors();
    }

    // 监听路由变化重新初始化
    window.addEventListener('routeChange', () => {
        if (isSqlToolActive() && !inputEditor) initEditors();
    });

    // 导出工具函数
    window.SqlTool = { formatSql, minifySql, tokenize };

})();
