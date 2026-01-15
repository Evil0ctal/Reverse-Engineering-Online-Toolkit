/**
 * GraphQL 格式化工具
 * @description GraphQL 查询格式化、美化与解析
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    /**
     * 检查当前是否在 GraphQL 工具页面
     */
    function isGraphqlToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/formatting/graphql');
    }

    // GraphQL 关键字
    const KEYWORDS = [
        'query', 'mutation', 'subscription', 'fragment', 'on',
        'type', 'interface', 'union', 'enum', 'scalar', 'input', 'extend',
        'implements', 'directive', 'schema', 'true', 'false', 'null'
    ];

    // 操作类型
    const OPERATION_TYPES = ['query', 'mutation', 'subscription'];

    // 类型定义关键字
    const TYPE_KEYWORDS = ['type', 'interface', 'union', 'enum', 'scalar', 'input', 'extend', 'schema'];

    /**
     * GraphQL 词法分析器
     */
    function tokenize(graphql) {
        const tokens = [];
        let i = 0;

        while (i < graphql.length) {
            const char = graphql[i];

            // 跳过空白
            if (/\s/.test(char)) {
                i++;
                continue;
            }

            // 注释 (# 开头)
            if (char === '#') {
                let comment = '#';
                i++;
                while (i < graphql.length && graphql[i] !== '\n') {
                    comment += graphql[i];
                    i++;
                }
                tokens.push({ type: 'comment', value: comment });
                continue;
            }

            // 字符串 (三引号 """ 或单引号 ")
            if (graphql.substr(i, 3) === '"""') {
                let str = '"""';
                i += 3;
                while (i < graphql.length) {
                    if (graphql.substr(i, 3) === '"""') {
                        str += '"""';
                        i += 3;
                        break;
                    }
                    str += graphql[i];
                    i++;
                }
                tokens.push({ type: 'blockstring', value: str });
                continue;
            }

            if (char === '"') {
                let str = '"';
                i++;
                while (i < graphql.length) {
                    if (graphql[i] === '\\' && i + 1 < graphql.length) {
                        str += graphql[i] + graphql[i + 1];
                        i += 2;
                    } else if (graphql[i] === '"') {
                        str += '"';
                        i++;
                        break;
                    } else if (graphql[i] === '\n') {
                        break;
                    } else {
                        str += graphql[i];
                        i++;
                    }
                }
                tokens.push({ type: 'string', value: str });
                continue;
            }

            // 数字 (包括负数和浮点数)
            if (/[\d-]/.test(char) && (char !== '-' || /\d/.test(graphql[i + 1]))) {
                let num = '';
                if (char === '-') {
                    num = '-';
                    i++;
                }
                while (i < graphql.length && /[\d.eE+-]/.test(graphql[i])) {
                    num += graphql[i];
                    i++;
                }
                tokens.push({ type: 'number', value: num });
                continue;
            }

            // 变量 ($name)
            if (char === '$') {
                let variable = '$';
                i++;
                while (i < graphql.length && /[a-zA-Z0-9_]/.test(graphql[i])) {
                    variable += graphql[i];
                    i++;
                }
                tokens.push({ type: 'variable', value: variable });
                continue;
            }

            // 指令 (@name)
            if (char === '@') {
                let directive = '@';
                i++;
                while (i < graphql.length && /[a-zA-Z0-9_]/.test(graphql[i])) {
                    directive += graphql[i];
                    i++;
                }
                tokens.push({ type: 'directive', value: directive });
                continue;
            }

            // 展开运算符 (...)
            if (graphql.substr(i, 3) === '...') {
                tokens.push({ type: 'spread', value: '...' });
                i += 3;
                continue;
            }

            // 标识符/关键字
            if (/[a-zA-Z_]/.test(char)) {
                let word = '';
                while (i < graphql.length && /[a-zA-Z0-9_]/.test(graphql[i])) {
                    word += graphql[i];
                    i++;
                }
                if (KEYWORDS.includes(word)) {
                    tokens.push({ type: 'keyword', value: word });
                } else {
                    tokens.push({ type: 'name', value: word });
                }
                continue;
            }

            // 符号
            tokens.push({ type: 'symbol', value: char });
            i++;
        }

        return tokens;
    }

    /**
     * 格式化 GraphQL
     */
    function formatGraphql(graphql, options = {}) {
        const {
            indent = '  ',
            sortFields = false,
            sortArgs = false
        } = options;

        const tokens = tokenize(graphql);
        let result = '';
        let currentIndent = 0;
        let newLine = true;
        let prevToken = null;
        let inArguments = false;
        let argDepth = 0;

        function addIndent() {
            result += indent.repeat(currentIndent);
        }

        function needsSpaceBefore(token, prev) {
            if (!prev) return false;

            // 关键字后通常需要空格
            if (prev.type === 'keyword' && token.type !== 'symbol') {
                return true;
            }

            // 名称后面跟名称或关键字需要空格
            if ((prev.type === 'name' || prev.type === 'keyword') &&
                (token.type === 'name' || token.type === 'keyword')) {
                return true;
            }

            // 冒号后面需要空格
            if (prev.value === ':') {
                return true;
            }

            // 类型名后跟 ! 或 ] 不需要空格
            if (token.value === '!' || token.value === ']') {
                return false;
            }

            // 指令前需要空格
            if (token.type === 'directive' && prev.value !== '(') {
                return true;
            }

            return false;
        }

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const nextToken = tokens[i + 1];

            // 注释
            if (token.type === 'comment') {
                if (!newLine && prevToken) {
                    result += ' ';
                } else if (newLine) {
                    addIndent();
                }
                result += token.value + '\n';
                newLine = true;
                prevToken = token;
                continue;
            }

            // 块字符串 (描述)
            if (token.type === 'blockstring') {
                if (!newLine) {
                    result += '\n';
                }
                addIndent();
                // 格式化块字符串
                const lines = token.value.slice(3, -3).split('\n');
                result += '"""\n';
                for (const line of lines) {
                    if (line.trim()) {
                        addIndent();
                        result += line.trim() + '\n';
                    } else if (lines.indexOf(line) !== 0 && lines.indexOf(line) !== lines.length - 1) {
                        result += '\n';
                    }
                }
                addIndent();
                result += '"""\n';
                newLine = true;
                prevToken = token;
                continue;
            }

            // 左花括号
            if (token.value === '{') {
                if (!newLine) {
                    result += ' ';
                } else {
                    addIndent();
                }
                result += '{\n';
                currentIndent++;
                newLine = true;
                prevToken = token;
                continue;
            }

            // 右花括号
            if (token.value === '}') {
                currentIndent = Math.max(0, currentIndent - 1);
                if (!newLine) {
                    result += '\n';
                }
                addIndent();
                result += '}';
                // 检查是否需要换行
                if (nextToken && nextToken.value !== '}') {
                    result += '\n';
                    newLine = true;
                } else {
                    newLine = false;
                }
                prevToken = token;
                continue;
            }

            // 左括号 (参数开始)
            if (token.value === '(') {
                inArguments = true;
                argDepth++;
                result += '(';
                newLine = false;
                prevToken = token;
                continue;
            }

            // 右括号 (参数结束)
            if (token.value === ')') {
                argDepth--;
                if (argDepth === 0) {
                    inArguments = false;
                }
                result += ')';
                newLine = false;
                prevToken = token;
                continue;
            }

            // 左方括号 (类型数组)
            if (token.value === '[') {
                result += '[';
                newLine = false;
                prevToken = token;
                continue;
            }

            // 右方括号
            if (token.value === ']') {
                result += ']';
                newLine = false;
                prevToken = token;
                continue;
            }

            // 冒号
            if (token.value === ':') {
                result += ':';
                newLine = false;
                prevToken = token;
                continue;
            }

            // 感叹号 (非空类型)
            if (token.value === '!') {
                result += '!';
                newLine = false;
                prevToken = token;
                continue;
            }

            // 等号 (默认值)
            if (token.value === '=') {
                result += ' = ';
                newLine = false;
                prevToken = token;
                continue;
            }

            // 逗号
            if (token.value === ',') {
                result += ',';
                if (inArguments) {
                    result += ' ';
                } else {
                    result += '\n';
                    newLine = true;
                }
                prevToken = token;
                continue;
            }

            // 管道符 (union)
            if (token.value === '|') {
                result += ' | ';
                newLine = false;
                prevToken = token;
                continue;
            }

            // 展开运算符
            if (token.type === 'spread') {
                if (newLine) {
                    addIndent();
                    newLine = false;
                }
                result += '...';
                prevToken = token;
                continue;
            }

            // 其他 token
            if (newLine) {
                addIndent();
                newLine = false;
            } else if (needsSpaceBefore(token, prevToken)) {
                result += ' ';
            }

            result += token.value;
            prevToken = token;
        }

        return result.trim();
    }

    /**
     * 压缩 GraphQL
     */
    function minifyGraphql(graphql) {
        const tokens = tokenize(graphql);
        let result = '';
        let prevToken = null;

        for (const token of tokens) {
            // 跳过注释和块字符串
            if (token.type === 'comment') {
                continue;
            }

            // 保留块字符串但压缩空白
            if (token.type === 'blockstring') {
                const content = token.value.slice(3, -3).trim().replace(/\s+/g, ' ');
                result += '"""' + content + '"""';
                prevToken = token;
                continue;
            }

            // 判断是否需要空格
            if (prevToken) {
                const needSpace = (
                    (prevToken.type === 'keyword' || prevToken.type === 'name' || prevToken.type === 'number') &&
                    (token.type === 'keyword' || token.type === 'name' || token.type === 'number' || token.type === 'variable')
                ) || (
                    prevToken.type === 'keyword' && token.type === 'directive'
                ) || (
                    prevToken.value === ':' && token.type !== 'symbol'
                ) || (
                    token.value === '|'
                ) || (
                    prevToken.value === '|'
                );

                if (needSpace) {
                    result += ' ';
                }
            }

            result += token.value;
            prevToken = token;
        }

        return result;
    }

    /**
     * 解析 GraphQL 结构
     */
    function parseGraphql(graphql) {
        const tokens = tokenize(graphql);
        const result = {
            operations: [],
            fragments: [],
            variables: [],
            directives: new Set(),
            types: [],
            ast: null
        };

        let i = 0;

        function parseSelection() {
            const selections = [];

            while (i < tokens.length && tokens[i].value !== '}') {
                const token = tokens[i];

                // 展开运算符 (片段引用)
                if (token.type === 'spread') {
                    i++;
                    if (tokens[i] && tokens[i].value === 'on') {
                        // 内联片段
                        i++; // skip 'on'
                        const typeName = tokens[i]?.value;
                        i++;
                        if (tokens[i]?.value === '{') {
                            i++;
                            const subSelections = parseSelection();
                            i++; // skip '}'
                            selections.push({
                                kind: 'InlineFragment',
                                typeCondition: typeName,
                                selections: subSelections
                            });
                        }
                    } else if (tokens[i]?.type === 'name') {
                        // 片段展开
                        selections.push({
                            kind: 'FragmentSpread',
                            name: tokens[i].value
                        });
                        i++;
                    }
                    continue;
                }

                // 字段
                if (token.type === 'name') {
                    const field = { kind: 'Field', name: token.value };
                    i++;

                    // 检查别名
                    if (tokens[i]?.value === ':') {
                        field.alias = field.name;
                        i++;
                        field.name = tokens[i]?.value;
                        i++;
                    }

                    // 检查参数
                    if (tokens[i]?.value === '(') {
                        field.arguments = [];
                        i++;
                        while (tokens[i] && tokens[i].value !== ')') {
                            if (tokens[i].type === 'name') {
                                const argName = tokens[i].value;
                                i++;
                                if (tokens[i]?.value === ':') {
                                    i++;
                                    const argValue = tokens[i]?.value;
                                    field.arguments.push({ name: argName, value: argValue });
                                    i++;
                                }
                            }
                            if (tokens[i]?.value === ',') i++;
                        }
                        i++; // skip ')'
                    }

                    // 检查指令
                    while (tokens[i]?.type === 'directive') {
                        result.directives.add(tokens[i].value);
                        field.directives = field.directives || [];
                        field.directives.push(tokens[i].value);
                        i++;
                        // 跳过指令参数
                        if (tokens[i]?.value === '(') {
                            let depth = 1;
                            i++;
                            while (i < tokens.length && depth > 0) {
                                if (tokens[i].value === '(') depth++;
                                if (tokens[i].value === ')') depth--;
                                i++;
                            }
                        }
                    }

                    // 检查子选择
                    if (tokens[i]?.value === '{') {
                        i++;
                        field.selections = parseSelection();
                        i++; // skip '}'
                    }

                    selections.push(field);
                    continue;
                }

                i++;
            }

            return selections;
        }

        while (i < tokens.length) {
            const token = tokens[i];

            // 操作 (query, mutation, subscription)
            if (token.type === 'keyword' && OPERATION_TYPES.includes(token.value)) {
                const operation = {
                    kind: 'OperationDefinition',
                    operation: token.value,
                    name: null,
                    variables: [],
                    selections: []
                };
                i++;

                // 操作名称
                if (tokens[i]?.type === 'name') {
                    operation.name = tokens[i].value;
                    i++;
                }

                // 变量定义
                if (tokens[i]?.value === '(') {
                    i++;
                    while (tokens[i] && tokens[i].value !== ')') {
                        if (tokens[i].type === 'variable') {
                            const varName = tokens[i].value;
                            result.variables.push(varName);
                            operation.variables.push(varName);
                        }
                        i++;
                    }
                    i++; // skip ')'
                }

                // 指令
                while (tokens[i]?.type === 'directive') {
                    result.directives.add(tokens[i].value);
                    i++;
                    if (tokens[i]?.value === '(') {
                        let depth = 1;
                        i++;
                        while (i < tokens.length && depth > 0) {
                            if (tokens[i].value === '(') depth++;
                            if (tokens[i].value === ')') depth--;
                            i++;
                        }
                    }
                }

                // 选择集
                if (tokens[i]?.value === '{') {
                    i++;
                    operation.selections = parseSelection();
                    i++; // skip '}'
                }

                result.operations.push(operation);
                continue;
            }

            // 匿名查询 (直接以 { 开头)
            if (token.value === '{' && (!tokens[i-1] || tokens[i-1].value === '}' || i === 0)) {
                const operation = {
                    kind: 'OperationDefinition',
                    operation: 'query',
                    name: null,
                    variables: [],
                    selections: []
                };
                i++;
                operation.selections = parseSelection();
                i++; // skip '}'
                result.operations.push(operation);
                continue;
            }

            // 片段
            if (token.type === 'keyword' && token.value === 'fragment') {
                const fragment = {
                    kind: 'FragmentDefinition',
                    name: null,
                    typeCondition: null,
                    selections: []
                };
                i++;

                // 片段名称
                if (tokens[i]?.type === 'name') {
                    fragment.name = tokens[i].value;
                    i++;
                }

                // on TypeName
                if (tokens[i]?.value === 'on') {
                    i++;
                    if (tokens[i]?.type === 'name') {
                        fragment.typeCondition = tokens[i].value;
                        i++;
                    }
                }

                // 指令
                while (tokens[i]?.type === 'directive') {
                    result.directives.add(tokens[i].value);
                    i++;
                    if (tokens[i]?.value === '(') {
                        let depth = 1;
                        i++;
                        while (i < tokens.length && depth > 0) {
                            if (tokens[i].value === '(') depth++;
                            if (tokens[i].value === ')') depth--;
                            i++;
                        }
                    }
                }

                // 选择集
                if (tokens[i]?.value === '{') {
                    i++;
                    fragment.selections = parseSelection();
                    i++; // skip '}'
                }

                result.fragments.push(fragment);
                continue;
            }

            // 类型定义
            if (token.type === 'keyword' && TYPE_KEYWORDS.includes(token.value)) {
                const typeDef = {
                    kind: 'TypeDefinition',
                    type: token.value,
                    name: null
                };
                i++;

                if (tokens[i]?.type === 'name') {
                    typeDef.name = tokens[i].value;
                    i++;
                }

                // 跳过类型体
                if (tokens[i]?.value === '{') {
                    let depth = 1;
                    i++;
                    while (i < tokens.length && depth > 0) {
                        if (tokens[i].value === '{') depth++;
                        if (tokens[i].value === '}') depth--;
                        i++;
                    }
                }

                result.types.push(typeDef);
                continue;
            }

            // 收集变量
            if (token.type === 'variable' && !result.variables.includes(token.value)) {
                result.variables.push(token.value);
            }

            // 收集指令
            if (token.type === 'directive') {
                result.directives.add(token.value);
            }

            i++;
        }

        // 转换指令 Set 为数组
        result.directives = Array.from(result.directives);

        // 生成简化的 AST
        result.ast = {
            kind: 'Document',
            definitions: [...result.operations, ...result.fragments, ...result.types]
        };

        return result;
    }

    /**
     * 获取选项
     */
    function getOptions() {
        const indentValue = document.getElementById('indent-select')?.value || '2';
        const indent = indentValue === 'tab' ? '\t' : ' '.repeat(parseInt(indentValue));
        const sortFields = document.getElementById('sort-fields')?.checked ?? false;
        const sortArgs = document.getElementById('sort-args')?.checked ?? false;

        return { indent, sortFields, sortArgs };
    }

    /**
     * 加载示例
     */
    function loadExample() {
        return `# 用户查询示例
query GetUserWithPosts($userId: ID!, $first: Int = 10) {
  user(id: $userId) {
    id
    name
    email
    avatar @deprecated(reason: "Use profilePicture instead")
    profilePicture(size: LARGE)
    posts(first: $first, orderBy: CREATED_AT_DESC) {
      edges {
        node {
          id
          title
          content
          createdAt
          ...PostStats
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}

# 创建文章
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    post {
      id
      title
      author {
        id
        name
      }
    }
    errors {
      field
      message
    }
  }
}

# 文章统计片段
fragment PostStats on Post {
  viewCount
  likeCount
  commentCount
}

# 订阅新评论
subscription OnNewComment($postId: ID!) {
  commentAdded(postId: $postId) {
    id
    content
    author {
      name
    }
    createdAt
  }
}`;
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

    /**
     * 创建标签元素
     */
    function createTag(text, className) {
        const span = document.createElement('span');
        span.className = 'tag ' + className;
        span.textContent = text;
        return span;
    }

    /**
     * 创建代码元素
     */
    function createCode(text, className) {
        const code = document.createElement('code');
        code.className = className;
        code.textContent = text;
        return code;
    }

    /**
     * 显示解析结果
     */
    function showParseResult(parsed) {
        const parseSection = document.getElementById('parse-section');
        if (!parseSection) return;

        parseSection.style.display = 'block';

        // 操作
        const operationsEl = document.getElementById('parse-operations');
        if (operationsEl) {
            operationsEl.textContent = '';
            if (parsed.operations.length > 0) {
                parsed.operations.forEach(op => {
                    const name = op.name || '(anonymous)';
                    operationsEl.appendChild(createTag(op.operation + ': ' + name, 'tag--' + op.operation));
                    operationsEl.appendChild(document.createTextNode(' '));
                });
            } else {
                const span = document.createElement('span');
                span.className = 'text-muted';
                span.textContent = '无';
                operationsEl.appendChild(span);
            }
        }

        // 片段
        const fragmentsEl = document.getElementById('parse-fragments');
        if (fragmentsEl) {
            fragmentsEl.textContent = '';
            if (parsed.fragments.length > 0) {
                parsed.fragments.forEach(f => {
                    fragmentsEl.appendChild(createTag(f.name + ' on ' + f.typeCondition, 'tag--fragment'));
                    fragmentsEl.appendChild(document.createTextNode(' '));
                });
            } else {
                const span = document.createElement('span');
                span.className = 'text-muted';
                span.textContent = '无';
                fragmentsEl.appendChild(span);
            }
        }

        // 变量
        const variablesEl = document.getElementById('parse-variables');
        if (variablesEl) {
            variablesEl.textContent = '';
            if (parsed.variables.length > 0) {
                parsed.variables.forEach(v => {
                    variablesEl.appendChild(createCode(v, 'variable'));
                    variablesEl.appendChild(document.createTextNode(' '));
                });
            } else {
                const span = document.createElement('span');
                span.className = 'text-muted';
                span.textContent = '无';
                variablesEl.appendChild(span);
            }
        }

        // 指令
        const directivesEl = document.getElementById('parse-directives');
        if (directivesEl) {
            directivesEl.textContent = '';
            if (parsed.directives.length > 0) {
                parsed.directives.forEach(d => {
                    directivesEl.appendChild(createCode(d, 'directive'));
                    directivesEl.appendChild(document.createTextNode(' '));
                });
            } else {
                const span = document.createElement('span');
                span.className = 'text-muted';
                span.textContent = '无';
                directivesEl.appendChild(span);
            }
        }

        // AST 树
        const treeEl = document.getElementById('parse-tree-output');
        if (treeEl) {
            treeEl.textContent = JSON.stringify(parsed.ast, null, 2);
        }
    }

    /**
     * 隐藏解析结果
     */
    function hideParseResult() {
        const parseSection = document.getElementById('parse-section');
        if (parseSection) {
            parseSection.style.display = 'none';
        }
    }

    /**
     * 检测是否为 Facebook/Instagram API 请求格式
     */
    function isFbApiRequest(input) {
        if (!input || typeof input !== 'string') return false;
        // 检测 URL 编码的 FB API 参数
        const fbIndicators = ['doc_id=', 'fb_api_req_friendly_name=', 'variables=', '__d=www', '__a=1', 'fb_dtsg='];
        const matchCount = fbIndicators.filter(indicator => input.includes(indicator)).length;
        return matchCount >= 2;
    }

    /**
     * 解析 Facebook/Instagram API 请求
     */
    function parseFbApiRequest(input) {
        const result = {
            docId: null,
            friendlyName: null,
            lsd: null,
            userId: null,
            variables: null,
            variablesRaw: null,
            allParams: {}
        };

        try {
            // 尝试解码整个输入（可能是 URL 编码的）
            let decoded = input;
            try {
                // 多次解码以处理多重编码
                let prev = '';
                while (prev !== decoded) {
                    prev = decoded;
                    decoded = decodeURIComponent(decoded);
                }
            } catch (e) {
                // 忽略解码错误
            }

            // 解析参数
            const params = new URLSearchParams(decoded);

            // 如果 URLSearchParams 解析失败，尝试手动解析
            if (!params.has('doc_id') && !params.has('variables')) {
                // 尝试用 & 分割
                const pairs = decoded.split('&');
                for (const pair of pairs) {
                    const [key, ...valueParts] = pair.split('=');
                    const value = valueParts.join('=');
                    if (key && value !== undefined) {
                        result.allParams[key] = value;
                    }
                }
            } else {
                params.forEach((value, key) => {
                    result.allParams[key] = value;
                });
            }

            // 提取关键字段
            result.docId = result.allParams['doc_id'] || result.allParams['docid'] || null;
            result.friendlyName = result.allParams['fb_api_req_friendly_name'] || result.allParams['server_timestamps'] || null;
            result.lsd = result.allParams['lsd'] || result.allParams['__lsd'] || null;
            result.userId = result.allParams['__user'] || null;

            // 解析 variables JSON
            let variablesStr = result.allParams['variables'];
            if (variablesStr) {
                result.variablesRaw = variablesStr;
                try {
                    // 尝试解码 variables
                    let decodedVars = variablesStr;
                    try {
                        let prev = '';
                        while (prev !== decodedVars) {
                            prev = decodedVars;
                            decodedVars = decodeURIComponent(decodedVars);
                        }
                    } catch (e) {}
                    result.variables = JSON.parse(decodedVars);
                } catch (e) {
                    // 保持原始字符串
                    result.variables = variablesStr;
                }
            }

        } catch (error) {
            console.error('Failed to parse FB API request:', error);
        }

        return result;
    }

    /**
     * 显示 FB API 解析结果
     */
    function showFbApiResult(parsed) {
        const fbSection = document.getElementById('fb-api-section');
        if (!fbSection) return;

        fbSection.style.display = 'block';

        // Doc ID
        const docIdEl = document.getElementById('fb-doc-id');
        if (docIdEl) {
            docIdEl.textContent = parsed.docId || '-';
        }

        // Friendly Name
        const friendlyNameEl = document.getElementById('fb-friendly-name');
        if (friendlyNameEl) {
            friendlyNameEl.textContent = parsed.friendlyName || '-';
        }

        // LSD Token
        const lsdEl = document.getElementById('fb-lsd');
        if (lsdEl) {
            lsdEl.textContent = parsed.lsd || '-';
        }

        // User ID
        const userIdEl = document.getElementById('fb-user-id');
        if (userIdEl) {
            userIdEl.textContent = parsed.userId || '-';
        }

        // Variables JSON
        const variablesEl = document.getElementById('fb-variables-output');
        if (variablesEl) {
            if (parsed.variables && typeof parsed.variables === 'object') {
                variablesEl.textContent = JSON.stringify(parsed.variables, null, 2);
            } else if (parsed.variablesRaw) {
                variablesEl.textContent = parsed.variablesRaw;
            } else {
                variablesEl.textContent = '-';
            }
        }

        // All Params
        const paramsEl = document.getElementById('fb-params-output');
        if (paramsEl) {
            const sortedParams = Object.keys(parsed.allParams)
                .sort()
                .reduce((obj, key) => {
                    obj[key] = parsed.allParams[key];
                    return obj;
                }, {});
            paramsEl.textContent = JSON.stringify(sortedParams, null, 2);
        }
    }

    /**
     * 隐藏 FB API 解析结果
     */
    function hideFbApiResult() {
        const fbSection = document.getElementById('fb-api-section');
        if (fbSection) {
            fbSection.style.display = 'none';
        }
    }

    /**
     * 初始化代码编辑器
     */
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
                language: 'graphql',
                value: '',
                readOnly: false,
                theme: theme,
                placeholder: '请输入 GraphQL 查询...'
            });

            outputEditor = await REOT.CodeEditor.create('#output-editor', {
                language: 'graphql',
                value: '',
                readOnly: true,
                theme: theme
            });

            console.log('GraphQL editors initialized');
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
        if (!isGraphqlToolActive()) return;

        const target = e.target;

        // 格式化按钮
        if (target.id === 'format-btn' || target.closest('#format-btn')) {
            try {
                const input = getInputValue();

                // 检测是否为 FB/IG API 请求
                if (isFbApiRequest(input)) {
                    const parsed = parseFbApiRequest(input);
                    // 如果有 variables 且是对象，格式化输出
                    if (parsed.variables && typeof parsed.variables === 'object') {
                        setOutputValue(JSON.stringify(parsed.variables, null, 2));
                    } else {
                        setOutputValue(JSON.stringify(parsed.allParams, null, 2));
                    }
                    hideParseResult();
                    showFbApiResult(parsed);
                    REOT.utils?.showNotification(REOT.i18n?.t('tools.graphql.fbApiDetected') || '检测到 FB/IG API 请求', 'success');
                } else {
                    const options = getOptions();
                    const result = formatGraphql(input, options);
                    setOutputValue(result);
                    hideParseResult();
                    hideFbApiResult();
                    REOT.utils?.showNotification(REOT.i18n?.t('tools.graphql.formatSuccess') || '格式化成功', 'success');
                }
            } catch (error) {
                REOT.utils?.showNotification((REOT.i18n?.t('tools.graphql.formatError') || '格式化失败: ') + error.message, 'error');
            }
        }

        // 压缩按钮
        if (target.id === 'minify-btn' || target.closest('#minify-btn')) {
            try {
                const result = minifyGraphql(getInputValue());
                setOutputValue(result);
                hideParseResult();
                REOT.utils?.showNotification(REOT.i18n?.t('tools.graphql.minifySuccess') || '压缩成功', 'success');
            } catch (error) {
                REOT.utils?.showNotification((REOT.i18n?.t('tools.graphql.minifyError') || '压缩失败: ') + error.message, 'error');
            }
        }

        // 解析按钮
        if (target.id === 'parse-btn' || target.closest('#parse-btn')) {
            try {
                const parsed = parseGraphql(getInputValue());
                setOutputValue(JSON.stringify(parsed.ast, null, 2));
                showParseResult(parsed);
                REOT.utils?.showNotification(REOT.i18n?.t('tools.graphql.parseSuccess') || '解析成功', 'success');
            } catch (error) {
                REOT.utils?.showNotification((REOT.i18n?.t('tools.graphql.parseError') || '解析失败: ') + error.message, 'error');
            }
        }

        // 清除按钮
        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            setInputValue('');
            setOutputValue('');
            hideParseResult();
            hideFbApiResult();
        }

        // 复制按钮
        if (target.id === 'copy-btn' || target.closest('#copy-btn')) {
            const value = getOutputValue();
            if (value) {
                const success = await REOT.utils?.copyToClipboard(value);
                if (success) {
                    REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
                }
            }
        }

        // 加载示例
        if (target.id === 'example-btn' || target.closest('#example-btn')) {
            setInputValue(loadExample());
        }
    });

    // 页面加载时初始化编辑器
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (isGraphqlToolActive()) initEditors();
        });
    } else {
        if (isGraphqlToolActive()) initEditors();
    }

    // 监听路由变化重新初始化
    window.addEventListener('routeChange', () => {
        if (isGraphqlToolActive() && !inputEditor) initEditors();
    });

    // 导出工具函数
    window.GraphqlTool = { formatGraphql, minifyGraphql, parseGraphql, tokenize, isFbApiRequest, parseFbApiRequest };

})();
