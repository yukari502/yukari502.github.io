# 项目拓扑结构与工作流说明 (Project Topology & Workflow)

本文档旨在描述 **Yukari502.github.io** (Digital Garden) 的架构、工作流及核心组件，以便于 LLM 或开发者快速理解和维护项目。

## 1. 项目概述 (Project Overview)
这是一个基于 **GitHub Pages** 托管的静态博客/数字花园。
- **核心理念**: 自动化构建，Markdown 写作，静态部署。
- **技术栈**:
  - **构建工具**: Python (`generate_*.py` 脚本)
  - **前端**: 原生 HTML5, CSS3, JavaScript (无大型框架)
  - **渲染**: 客户端渲染 (Markdown -> HTML via `marked.js`), 代码高亮 (`highlight.js`), 数学公式 (`KaTeX`)
  - **数据源**: Markdown 文件 (`Articles/`) + JSON 索引 (`Index/`)

## 2. 文件目录结构 (Directory Structure)

```text
/Users/kaze/Documents/yukari502.github.io/
├── Articles/                  # [源文件] 存放 Markdown 格式的文章源码
│   ├── Category/              # 文章可以按文件夹分类
│   └── article.md             # 文章文件
├── Pic/                       # [资源] 图片存储目录
│   └── {article_slug}/        # 每篇文章的图片存放在以 Slug 命名的子文件夹中
├── posts/                     # [生成物] 自动生成的静态 HTML 文章页面
│   └── {category}/            # 按分类存放生成的 HTML
├── Index/                     # [生成物] 存放生成的 JSON 索引数据
│   ├── index.json             # 主索引 (包含年份列表)
│   └── index_{year}.json      # 按年份分片的文章索引
├── articles.json              # [生成物] 所有文章的汇总元数据 (旧版兼容/备份)
├── generate_articles_json.py  # [构建脚本] 步骤1: 解析 Markdown，生成 JSON 索引
├── generate_article_pages.py  # [构建脚本] 步骤2: 根据 JSON 生成 HTML 页面
├── generate_sitemap.py        # [构建脚本] 步骤3: 生成 sitemap.xml
├── article-template.html      # [模板] 文章页面的 HTML 模板
├── index.html                 # [入口] 网站主页 (SPA 模式入口)
├── script.js                  # [逻辑] 核心前端逻辑 (SPA 路由 + 文章渲染)
├── style.css                  # [样式] 全局样式表
└── .github/workflows/         # [CI/CD] GitHub Actions 配置
```

## 3. 网站工作流 (Website Workflow)

整个网站的更新流程如下：

1.  **写作 (Writing)**:
    *   用户在 `Articles/` 目录下创建 `.md` 文件。
    *   文章图片放入 `Pic/{article_slug}/` 目录 (Slug 通常是文件名的小写+连字符形式)。
    *   Markdown 中引用图片使用相对路径或文件名: `![alt](image.png)`。

2.  **构建 (Build)** (通常由 GitHub Actions 自动执行，也可本地执行):
    *   **Step 1**: 运行 `python3 generate_articles_json.py`
        *   扫描 `Articles/` 目录。
        *   解析 Frontmatter (元数据) 和 Git 修改时间。
        *   生成 `articles.json` 和 `Index/` 目录下的分片索引。
    *   **Step 2**: 运行 `python3 generate_article_pages.py`
        *   读取 `articles.json`。
        *   读取 `article-template.html`。
        *   将 Markdown 源码注入到 HTML 模板的 `<script type="text/markdown">` 标签中。
        *   注入元数据 (Title, Date, Slug 等)。
        *   输出 HTML 文件到 `posts/` 目录。
    *   **Step 3**: 运行 `python3 generate_sitemap.py`
        *   生成 `sitemap.xml` 用于 SEO。

3.  **部署 (Deploy)**:
    *   提交更改到 GitHub。
    *   GitHub Actions 触发，执行上述构建步骤。
    *   将生成的文件部署到 GitHub Pages。

4.  **运行时 (Runtime)**:
    *   **主页 (`index.html`)**: 加载 `script.js`，初始化 SPA 模式 (`initSPA`)，从 `Index/` 异步加载文章列表并渲染。
    *   **文章页 (`posts/.../*.html`)**: 加载 `script.js`，初始化静态文章模式 (`initStaticArticle`)。
        *   读取页面内嵌入的 Markdown 源码。
        *   使用 `marked.js` 解析 Markdown 为 HTML。
        *   **关键**: 使用 `article-slug` 元数据修正图片路径 (将 `image.png` 转换为 `/Pic/{slug}/image.png`)。
        *   使用 `highlight.js` 高亮代码。
        *   使用 `KaTeX` 渲染数学公式。

## 4. 核心脚本与函数说明 (Core Scripts & Functions)

### A. `generate_articles_json.py`
负责数据提取和索引构建。
*   **`parse_frontmatter(content)`**:
    *   **作用**: 从 Markdown 文件头部提取 YAML 格式的元数据 (Title, Date, Category, Tags 等)。
    *   **重要性**: 决定了文章在列表中的显示信息。
*   **`get_file_dates(filepath)`**:
    *   **作用**: 通过 `git log` 获取文件的创建和修改时间。
    *   **重要性**: 自动化维护文章时间，无需手动标注。
*   **`main` 流程**:
    *   遍历 `Articles` 文件夹。
    *   生成 Slug (URL 友好的文件名)。
    *   构建层级索引 (`Index/index_{year}.json`) 以优化前端加载性能。

### B. `generate_article_pages.py`
负责静态 HTML 生成。
*   **`generate_article_html(article, template_content, ...)`**:
    *   **作用**: 核心生成逻辑。
    *   **关键操作**:
        *   替换模板变量 `{TITLE}`, `{DATE}`, `{CONTENT}`, `{SLUG}` 等。
        *   **安全处理**: 使用 `html.escape` 转义元数据，防止 HTML 注入。
        *   **脚本保护**: 将 Markdown 中的 `</script>` 替换为 `<\\/script>`，防止提前闭合标签。

### C. `script.js`
前端核心逻辑，包含 SPA 和 静态页 两种模式。
*   **入口判断**:
    *   检查是否存在 `id="markdown-source"` 元素。存在则进入 **静态文章模式**，否则进入 **SPA 模式**。

*   **`initStaticArticle()` (静态文章模式)**:
    *   **作用**: 在生成的 HTML 页面中运行，负责将 Markdown 转换为可视 HTML。
    *   **`renderer.image(href, title, text)`**:
        *   **关键修复**: 拦截图片渲染。如果路径是相对的 (如 `page1.png`)，自动拼接 `/Pic/{article_slug}/` 前缀。
        *   **依赖**: 需要 HTML `<meta name="article-slug">` 提供 Slug。
    *   **`renderer.code(...)`**:
        *   **增强**: 自定义代码块 HTML，添加 macOS 风格窗口头和复制按钮。
        *   **容错**: 检查 `hljs` 是否加载，防止报错。

*   **`initSPA()` (SPA 模式)**:
    *   **作用**: 处理主页 (`index.html`) 的交互。
    *   **`fetchArticles()`**:
        *   **策略**: 优先尝试加载 `Index/index.json` (分片加载)，失败则回退到 `articles.json`。
    *   **`renderArticles(...)`**: 动态生成文章卡片列表。
    *   **`navigateTo(...)`**: 处理单页应用内的视图切换 (Home <-> About)。

## 5. 维护指南 (Maintenance Guide)

*   **图片不显示**:
    *   检查 `Pic/` 下是否有对应的 `{slug}` 文件夹。
    *   检查 `script.js` 中的 `renderer.image` 逻辑是否正确获取了 `article-slug` meta 标签。
*   **文章未更新**:
    *   确保运行了 `generate_articles_json.py` 更新索引。
    *   确保运行了 `generate_article_pages.py` 重新生成 HTML。
*   **Markdown 渲染错误**:
    *   检查 `script.js` 中 `marked.parse` 的配置。
    *   查看浏览器控制台 (Console) 是否有 JS 报错。
