# 贡献指南

感谢您对 REOT (Reverse Engineering Online Toolkit) 的关注！我们欢迎所有形式的贡献，包括但不限于：

- 提交 Bug 报告
- 提出新功能建议
- 改进文档
- 提交代码修复或新功能
- 添加新语言支持

## 在线访问

- **官方网站**：[https://reot.dev](https://reot.dev)
- **GitHub Pages**：[https://evil0ctal.github.io/Reverse-Engineering-Online-Toolkit](https://evil0ctal.github.io/Reverse-Engineering-Online-Toolkit)

## 开发环境设置

### 前置要求

- 现代浏览器（Chrome、Firefox、Safari、Edge）
- Git
- Docker（推荐）或 Node.js

### 本地运行

由于本项目是 SPA（单页应用），需要服务器支持路由重定向。

```bash
# 克隆仓库
git clone https://github.com/Evil0ctal/Reverse-Engineering-Online-Toolkit.git
cd Reverse-Engineering-Online-Toolkit

# 方式一：使用 Docker Compose（推荐，支持热更新）
docker-compose up -d

# 方式二：使用 Node.js serve（带 SPA 支持）
npx serve -s -l 8080

# 方式三：使用 npm scripts
npm run serve

# 访问 http://localhost:8080
```

> ⚠️ **注意**：简单的 HTTP 服务器（如 `python -m http.server`）不支持 SPA 路由，直接访问工具页面 URL 会导致 404 错误。

## 如何贡献

### 报告 Bug

1. 确保 Bug 尚未被报告，搜索 [Issues](https://github.com/Evil0ctal/Reverse-Engineering-Online-Toolkit/issues)
2. 如果没有找到相关 Issue，创建一个新的 Issue
3. 提供详细的复现步骤、预期行为和实际行为
4. 如果可能，提供截图或录屏

### 提交新功能

1. 首先创建一个 Issue 讨论您的想法
2. 获得维护者的认可后再开始开发
3. 遵循下面的代码规范和提交流程

### 贡献代码

#### 1. Fork 并克隆仓库

```bash
git clone https://github.com/YOUR_USERNAME/Reverse-Engineering-Online-Toolkit.git
cd Reverse-Engineering-Online-Toolkit
```

#### 2. 创建功能分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

#### 3. 编写代码

遵循项目的代码规范：

- **JavaScript**: 使用 ESLint 标准配置
- **CSS**: 遵循 BEM 命名规范
- **HTML**: 使用语义化标签

#### 4. 提交代码

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
git commit -m "feat(encoding): 添加 Base64 URL 安全编码支持"
git commit -m "fix(hashing): 修复 MD5 计算中文字符的问题"
git commit -m "docs: 更新 README 安装说明"
```

提交类型：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具相关

#### 5. 推送并创建 Pull Request

```bash
git push origin feature/your-feature-name
```

然后在 GitHub 上创建 Pull Request。

## 添加新工具

### 目录结构

```
tools/<category>/<tool-name>/
├── <tool-name>.html   # 工具页面（以工具ID命名）
├── <tool-name>.js     # 核心逻辑
├── <tool-name>.css    # 工具样式（可选）
├── README.md          # 工具文档
└── locales/           # 工具专属国际化（推荐）
    ├── zh-CN.json
    └── en-US.json
```

> **重要**：工具文件必须以工具 ID 命名（如 `base64.html`、`base64.js`），而不是 `index.html`。这是为了避免直接访问 URL 时返回 HTML 片段。

### 实现步骤

1. 创建工具目录
2. 实现 HTML 页面（使用 data-i18n 属性支持国际化）
3. 实现 JavaScript 逻辑（使用 IIFE 模式）
4. 添加国际化支持（见下方详细说明）
5. 在 `assets/js/tools-registry.js` 中注册工具
6. 编写工具文档

详细模板请参考 [README.md](./README.md) 中的"如何贡献新功能/工具"章节。

### 模块化国际化

REOT 采用**模块化国际化架构**，工具的翻译分为两部分：

**1. 根目录 locales（必须）** - 用于侧边栏和搜索

在 `locales/zh-CN.json` 和 `locales/en-US.json` 的 `tools` 对象中添加工具的 `title` 和 `description`：

```json
{
    "tools": {
        "my-tool": {
            "title": "我的工具",
            "description": "工具描述"
        }
    }
}
```

**2. 工具目录 locales（推荐）** - 工具详细翻译

在工具目录下创建 `locales/` 文件夹，存放工具特有的翻译：

```
tools/<category>/<tool-name>/locales/
├── zh-CN.json
└── en-US.json
```

工具 locales 文件格式（无需 `tools.my-tool` 前缀）：

```json
{
    "title": "我的工具",
    "description": "工具描述",
    "placeholder": "请输入内容",
    "customOption": "自定义选项"
}
```

系统会自动将工具 locales 合并到 `tools.<tool-id>` 命名空间下。

**优势**：
- 工具完全自包含，便于添加/移除
- 按需加载，提升性能
- 避免 Git 合并冲突

## 添加新语言支持

### 添加全局翻译

1. 复制 `locales/en-US.json` 到新文件（如 `locales/ja-JP.json`）
2. 翻译所有文本
3. 在 `assets/js/i18n.js` 的 `supportedLocales` 数组中添加新语言代码
4. 提交 PR

### 添加工具翻译

1. 找到工具目录下的 `locales/` 文件夹（如 `tools/formatting/json/locales/`）
2. 复制 `en-US.json` 并重命名为新语言代码
3. 翻译所有文本
4. 提交 PR

> **注意**：工具翻译是可选的。如果工具没有对应语言的翻译文件，系统会回退到 `zh-CN`。

## 代码规范

### JavaScript

```javascript
/**
 * 函数描述
 * @param {string} input - 输入参数描述
 * @returns {string} - 返回值描述
 */
function myFunction(input) {
    'use strict';
    // 实现
}
```

### CSS (BEM)

```css
/* Block */
.tool-container {}

/* Element */
.tool-container__header {}
.tool-container__input {}

/* Modifier */
.tool-container--dark {}
.tool-container__input--error {}
```

### HTML

```html
<!-- 使用语义化标签 -->
<section class="tool-section">
    <header class="tool-header">
        <h1 data-i18n="tools.my-tool.title">标题</h1>
    </header>
    <main class="tool-main">
        <!-- 内容 -->
    </main>
</section>
```

## 测试

在提交 PR 之前，请确保：

1. 所有现有功能正常工作
2. 新功能在主流浏览器中测试通过
3. 响应式设计在不同屏幕尺寸下正常显示
4. 国际化文本正确显示

## 行为准则

- 尊重所有贡献者
- 保持友善和专业的交流
- 接受建设性的批评
- 专注于项目的最佳利益

## 许可证

通过向本项目贡献代码，您同意您的贡献将按照 [Apache License 2.0](./LICENSE) 许可证授权。

## 联系我们

如有任何问题，请通过以下方式联系：

- GitHub Issues: [提交问题](https://github.com/Evil0ctal/Reverse-Engineering-Online-Toolkit/issues)
- GitHub: [@Evil0ctal](https://github.com/Evil0ctal)

感谢您的贡献！
