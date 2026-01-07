# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

REOT (Reverse Engineering Online Toolkit) is a **pure frontend SPA** for reverse engineering tasks. All computations run locally in the browser - no server-side processing. Currently has 38+ implemented tools across 13 categories.

## Development Commands

```bash
# Local development (choose one)
npm run serve              # Node serve on port 8080
python -m http.server 8080 # Python fallback
docker-compose up -d       # Docker with nginx

# Code quality
npm run lint               # ESLint check
npm run lint:fix           # Auto-fix linting issues
npm run test               # Run Jest tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report

# Docker production
docker build -t reot:latest .
docker run -d -p 80:80 reot:latest
```

## Architecture

### Core Systems (`assets/js/`)

| File | Purpose |
|------|---------|
| `main.js` | App initialization, theme management, global `REOT` namespace |
| `router.js` | SPA client-side routing, GitHub Pages path detection |
| `i18n.js` | Internationalization with `data-i18n` attributes |
| `tools-registry.js` | Tool registration, sidebar generation, search indexing |
| `utils.js` | Clipboard, file I/O, data conversion, validation helpers |

**Initialization flow**: `REOT.app.init()` → i18n → router → sidebar → home grid → theme

### Tool Module Structure

Each tool in `tools/<category>/<tool-name>/`:
```
├── <tool-name>.html   # UI with data-i18n attributes
├── <tool-name>.js     # IIFE-wrapped logic, exports to window.<ToolName>
├── <tool-name>.css    # Styles (optional)
└── locales/           # Per-tool i18n (optional)
    ├── zh-CN.json
    └── en-US.json
```

### Localization

- Global: `locales/zh-CN.json`, `locales/en-US.json`
- Tool-specific: `tools/<category>/<tool-name>/locales/`
- Keys: `tools.<tool-id>.title`, `tools.<tool-id>.description`

## Code Standards

- **JS**: IIFE pattern, 4-space indent, single quotes, semicolons required, `===` always
- **CSS**: BEM naming convention
- **HTML**: Semantic tags, `data-i18n` for all translatable text
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`)

## Adding a New Tool

1. Create `tools/<category>/<tool-name>/` with html, js files
2. Add i18n keys to both `locales/zh-CN.json` and `locales/en-US.json`
3. Register in `assets/js/tools-registry.js`:

```javascript
REOT.tools.register({
    id: 'tool-name',
    category: 'encoding',  // See tools-registry.js for valid categories
    name: 'tools.tool-name.title',
    description: 'tools.tool-name.description',
    icon: 'icon-tool-name',
    path: '/tools/encoding/tool-name/',
    keywords: ['search', 'keywords']
});
```

4. Write tests in `tests/unit/<tool-name>.test.js`

## Key Implementation Notes

- **Router**: Auto-detects GitHub Pages subdirectory (`/Reverse-Engineering-Online-Toolkit/`) vs local dev
- **Tool pages**: Include SPA detection script to redirect direct access into the main app frame
- **Global namespace**: All modules attach to `REOT` object (e.g., `REOT.utils`, `REOT.i18n`)
- **Theme**: Light/dark via CSS files in `assets/css/themes/`, persisted to localStorage
