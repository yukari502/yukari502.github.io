document.addEventListener('DOMContentLoaded', () => {
    const markdownSource = document.getElementById('markdown-source');

    if (markdownSource) {
        initStaticArticle();
    } else {
        initSPA();
    }

    // --- Static Article Mode ---
    function initStaticArticle() {
        // Initialize theme
        const savedTheme = localStorage.getItem('theme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', savedTheme);

        if (typeof marked === 'undefined') {
            console.error('Marked.js not loaded');
            document.getElementById('article-content').innerHTML = '<p style="color:red">Error: Markdown parser not loaded. Please check your internet connection.</p>';
            return;
        }

        try {
            const contentDiv = document.getElementById('article-content');
            const articleSlugMeta = document.querySelector('meta[name="article-slug"]');
            const articleSlug = articleSlugMeta ? articleSlugMeta.content : '';

            const rootPathMeta = document.querySelector('meta[name="root-path"]');
            const rootPath = rootPathMeta ? rootPathMeta.content : '/';

            // Configure marked renderer
            const renderer = new marked.Renderer();

            // Custom code block renderer
            renderer.code = function (code, language) {
                // Handle both string and token object from marked.js
                // IMPORTANT: Check type BEFORE converting to string!
                let textToHighlight = code;
                let lang = language;

                if (typeof code === 'object' && code !== null) {
                    // If code is a token object, extract the actual code
                    textToHighlight = code.text || code.raw || '';
                    lang = code.lang || language || '';
                }

                // Now convert to string
                textToHighlight = String(textToHighlight || '');

                // Check if hljs is loaded
                if (typeof hljs === 'undefined') {
                    console.warn('Highlight.js not loaded');
                    return `<pre><code class="hljs ${lang || ''}">${textToHighlight}</code></pre>`;
                }

                const validLang = !!(lang && hljs.getLanguage(lang));
                const highlighted = validLang ? hljs.highlight(textToHighlight, { language: lang }).value : hljs.highlightAuto(textToHighlight).value;
                const langLabel = lang ? lang.toUpperCase() : 'TEXT';

                return `
                <div class="code-window">
                    <div class="window-header">
                        <div class="window-controls">
                            <span class="dot red"></span>
                            <span class="dot yellow"></span>
                            <span class="dot green"></span>
                        </div>
                        <div class="window-title">${langLabel}</div>
                        <button class="copy-btn" aria-label="Copy code" onclick="copyCode(this)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                    </div>
                    <pre><code class="hljs ${lang || ''}">${highlighted}</code></pre>
                </div>`;
            };

            // Custom image renderer to fix paths
            renderer.image = function (href, title, text) {
                // Handle both string and token object from marked.js
                if (typeof href === 'object' && href !== null) {
                    // If href is a token object, extract the actual href
                    href = href.href || href.raw || '';
                }

                // Convert to string and check if empty
                href = String(href || '');
                if (!href) return '';

                // Process relative paths
                // REMOVED: Automatic path conversion. User must provide correct path (e.g. absolute path /Pic/...)
                if (!href.startsWith('http') && !href.startsWith('/') && !href.startsWith('data:')) {
                    // Optional: You could still prepend rootPath if you wanted to support relative paths from site root,
                    // but the user requested "default absolute path", so we will leave it as is.
                    // However, if they write 'Pic/...' and we are in 'posts/cat/', it won't work without rootPath.
                    // But "default absolute path" usually implies starting with '/'.
                    // If the user writes 'image.png', it will break unless they change it to '/Pic/...'.
                    // I will strictly follow "delete automatic conversion".
                }

                // Escape quotes in text and title to prevent HTML breakage
                const safeText = String(text || '').replace(/"/g, '&quot;');
                const safeTitle = String(title || '').replace(/"/g, '&quot;');

                let out = `<img src="${href}" alt="${safeText}"`;
                if (title) {
                    out += ` title="${safeTitle}"`;
                }
                out += ' class="img-fluid">';
                return out;
            };

            // Custom heading renderer to add IDs for TOC
            renderer.heading = function (text, level) {
                // Handle token object if passed
                if (typeof text === 'object' && text !== null) {
                    level = text.depth || level;
                    text = text.text || text.raw || '';
                }

                const safeText = String(text || '');

                // Generate slug for ID
                // 1. Convert to lowercase
                // 2. Remove special characters (keep alphanumeric, spaces, hyphens, chinese)
                // 3. Replace spaces with hyphens
                // 4. Remove duplicate hyphens
                const slug = safeText
                    .toLowerCase()
                    .replace(/[^\w\s\-\u4e00-\u9fa5]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-+|-+$/g, ''); // Trim hyphens

                return `<h${level} id="${slug}">${safeText}</h${level}>`;
            };

            // Parse markdown
            const htmlContent = marked.parse(markdownSource.textContent, { renderer: renderer });
            contentDiv.innerHTML = htmlContent;

            // Initialize KaTeX rendering
            if (window.renderMathInElement) {
                renderMathInElement(contentDiv, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false },
                        { left: '\\(', right: '\\)', display: false },
                        { left: '\\[', right: '\\]', display: true }
                    ],
                    throwOnError: false
                });
            }

            // Render Mermaid diagrams
            if (window.mermaid) {
                // Find all mermaid code blocks
                const mermaidBlocks = contentDiv.querySelectorAll('pre code.language-mermaid, pre code.mermaid');

                mermaidBlocks.forEach((block, index) => {
                    try {
                        const code = block.textContent;
                        const pre = block.closest('pre');

                        // Create a div for mermaid to render into
                        const mermaidDiv = document.createElement('div');
                        mermaidDiv.className = 'mermaid';
                        mermaidDiv.textContent = code;

                        // Replace the pre element with the mermaid div
                        if (pre && pre.parentNode) {
                            pre.parentNode.replaceChild(mermaidDiv, pre);
                        }
                    } catch (e) {
                        console.error('Error rendering mermaid diagram:', e);
                    }
                });

                // Initialize mermaid rendering
                mermaid.run({
                    querySelector: '.mermaid',
                });
            }
        } catch (e) {
            console.error('Error rendering markdown:', e);
            document.getElementById('article-content').innerHTML = '<p style="color:red">Error rendering content. Please check console for details.</p>';
        }
    }

    // --- SPA Mode ---
    function initSPA() {
        // DOM Elements
        const pinnedArticlesList = document.getElementById('pinned-articles-list');
        const articlesList = document.getElementById('articles-list');
        const searchInput = document.getElementById('search-input');
        const themeToggle = document.getElementById('theme-toggle');
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.page-section');
        const articleView = document.getElementById('article-view');
        const markdownContent = document.getElementById('markdown-content');
        const backButton = document.getElementById('back-button');
        const pinnedToggle = document.getElementById('pinned-toggle');

        if (pinnedToggle) {
            pinnedToggle.addEventListener('click', () => {
                pinnedToggle.classList.toggle('collapsed');
                pinnedArticlesList.classList.toggle('collapsed');
            });
        }

        // --- Sidebar Toggle ---
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                document.body.classList.toggle('sidebar-collapsed');

                // Save state
                const isCollapsed = document.body.classList.contains('sidebar-collapsed');
                localStorage.setItem('sidebar-collapsed', isCollapsed);
            });

            // Restore state
            const savedState = localStorage.getItem('sidebar-collapsed');
            if (savedState === 'true') {
                document.body.classList.add('sidebar-collapsed');
            } else if (savedState === null && window.innerWidth <= 768) {
                // Default to collapsed on mobile
                document.body.classList.add('sidebar-collapsed');
            }
        }


        // State
        let allArticles = [];
        let currentPage = 1;
        const ITEMS_PER_PAGE = 30;
        let currentFilteredSet = []; // To track the current set of articles for pagination
        function navigateTo(targetId) {
            // Update Nav Links
            navLinks.forEach(link => {
                if (link.dataset.target === targetId) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

            // Update Sections
            sections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });

            // Special case: if navigating away from article-view, ensure it's hidden
            if (targetId !== 'article-view') {
                articleView.classList.remove('active');
            }

            // Scroll to top
            window.scrollTo(0, 0);
        }

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const target = link.dataset.target;
                if (!target) return; // Allow normal navigation for links without data-target

                e.preventDefault();

                // If clicking Home, reset the article list to show all
                if (target === 'home') {
                    const articlesList = document.getElementById('articles-list');
                    if (articlesList && allArticles.length > 0) {
                        currentPage = 1; // Reset to first page
                        renderArticles(allArticles, articlesList);
                        const header = document.querySelector('.section-header h2');
                        if (header) header.textContent = 'All Articles';
                    }
                }

                navigateTo(target);
            });
        });



        // --- Article Rendering ---
        function createArticleCard(article) {
            const card = document.createElement('div');
            card.className = 'article-card';

            // Use the pre-generated static URL
            const staticUrl = article.url || '#';

            card.innerHTML = `
                <div class="article-info-col">
                    <h3>${article.title}</h3>
                    <div class="category-badge">${article.category || 'General'}</div>
                </div>
                <p class="article-meta">${article.date}</p>
            `;

            // Make the card clickable and link to static page
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                if (staticUrl !== '#') {
                    window.location.href = staticUrl;
                }
            });

            return card;
        }

        function renderArticles(articles, container) {
            container.innerHTML = '';
            const paginationContainer = document.getElementById('pagination-container');
            if (paginationContainer) paginationContainer.innerHTML = ''; // Clear pagination

            // Update current set reference for pagination clicks
            currentFilteredSet = articles;

            // Filter out internal meta articles like "About Me"
            const filteredArticles = articles.filter(a => a.title.toLowerCase() !== 'about me');

            // Update global state for pagination re-renders
            currentFilteredSet = articles; // Note: We should store the 'input' articles or the 'filtered' ones? 
            // Better to store what was passed in, but the filter for "About Me" is intrinsic to rendering.
            // Let's store the filtered set actually, so we don't re-filter on every page click.
            // Wait, if we call renderArticles(currentFilteredSet) recursively, we might filter again.
            // Let's separate the concern. renderArticles takes a set. If we pass the full list again, it filters again.
            // To be safe: currentFilteredSet should trigger the *source* for the view.
            currentFilteredSet = articles;

            // Actually, let's optimize:
            // The 'articles' arg passed to renderArticles is usually the result of a category filter or search.
            // So we should save THAT as our working set.
            // However, the internal "About Me" filter happens *inside*.
            // If we paginate, we are just slicing.
            // Let's refine the logic in the next block.

            if (filteredArticles.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No topics found.</p>';
                return;
            }

            // Pagination Logic
            const totalItems = filteredArticles.length;
            const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

            // Validate currentPage
            if (currentPage < 1) currentPage = 1;
            if (currentPage > totalPages) currentPage = totalPages;

            const start = (currentPage - 1) * ITEMS_PER_PAGE;
            const end = start + ITEMS_PER_PAGE;
            const paginatedItems = filteredArticles.slice(start, end);

            // Add List Header if not already there (only once per render context)
            const header = document.createElement('div');
            header.className = 'list-header';
            header.innerHTML = `
                <div>Topic</div>
                <div>Activity</div>
            `;
            container.appendChild(header);

            paginatedItems.forEach(article => {
                container.appendChild(createArticleCard(article));
            });

            // Render Pagination Controls
            if (totalPages > 1 && paginationContainer) {
                renderPagination(paginationContainer, totalPages);
            }
        }

        function renderPagination(container, totalPages) {
            container.innerHTML = '';

            // Previous Button
            const prevBtn = document.createElement('button');
            prevBtn.className = 'pagination-btn';
            prevBtn.innerHTML = '&lt;';
            prevBtn.disabled = currentPage === 1;
            prevBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    const articlesList = document.getElementById('articles-list');
                    // We need to re-render with the ORIGINAL filtered list context.
                    // Ideally, renderArticles should know the current context or we re-trigger it.
                    // For simplicity in this structure: we assume 'currentArticlesContext' holds the list we are viewing.
                    // BUT renderArticles takes 'articles' as arg.
                    // Strategy: We need to store the current working set of articles globally or re-pass it.
                    // Let's use a global 'currentFilteredSet' state.
                    renderArticles(currentFilteredSet, articlesList);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
            container.appendChild(prevBtn);

            // Page Numbers
            // Simple logic: Show all if <= 7 pages, else show start, end, and current window
            // For now, let's implement a simple window: 1 ... current-1 current current+1 ... last

            function createPageBtn(page) {
                const btn = document.createElement('button');
                btn.className = `pagination-btn ${currentPage === page ? 'active' : ''}`;
                btn.textContent = page;
                btn.addEventListener('click', () => {
                    if (currentPage !== page) {
                        currentPage = page;
                        const articlesList = document.getElementById('articles-list');
                        renderArticles(currentFilteredSet, articlesList);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                });
                return btn;
            }

            // Always show first
            container.appendChild(createPageBtn(1));

            if (currentPage > 3) {
                const span = document.createElement('span');
                span.textContent = '...';
                span.style.color = 'var(--text-secondary)';
                container.appendChild(span);
            }

            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                container.appendChild(createPageBtn(i));
            }

            if (currentPage < totalPages - 2) {
                const span = document.createElement('span');
                span.textContent = '...';
                span.style.color = 'var(--text-secondary)';
                container.appendChild(span);
            }

            // Always show last if > 1
            if (totalPages > 1) {
                container.appendChild(createPageBtn(totalPages));
            }


            // Next Button
            const nextBtn = document.createElement('button');
            nextBtn.className = 'pagination-btn';
            nextBtn.innerHTML = '&gt;';
            nextBtn.disabled = currentPage === totalPages;
            nextBtn.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    const articlesList = document.getElementById('articles-list');
                    renderArticles(currentFilteredSet, articlesList);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
            container.appendChild(nextBtn);
        }

        // --- Data Fetching ---
        async function fetchArticles() {
            try {
                // Try hierarchical index first
                const response = await fetch('Index/index.json');
                if (response.ok) {
                    const mainIndex = await response.json();
                    const articles = [];

                    for (const year of mainIndex.years) {
                        try {
                            const yearResponse = await fetch(`Index/index_${year}.json`);
                            if (yearResponse.ok) {
                                const yearData = await yearResponse.json();
                                articles.push(...yearData.articles);
                            }
                        } catch (e) {
                            console.warn(`Failed to load year ${year}`, e);
                        }
                    }
                    return articles.sort((a, b) => new Date(b.date) - new Date(a.date));
                }
            } catch (e) {
                console.warn('Hierarchical index failed, trying fallback', e);
            }

            // Fallback
            try {
                const response = await fetch('articles.json');
                if (response.ok) return await response.json();
            } catch (e) {
                console.error('All fetch methods failed', e);
            }
            return [];
        }

        async function fetchPinned() {
            try {
                const response = await fetch('pinned-articles.json');
                if (response.ok) return await response.json();
            } catch (e) {
                console.warn('No pinned articles found');
            }
            return [];
        }

        // --- Article Loading (SPA) ---
        // Note: This is kept for backward compatibility or if we want to load articles dynamically in SPA
        // But now we link to static pages.
        async function loadArticle(path, title) {
            // ... (Existing loadArticle logic could be here if needed, but we are navigating to static pages now)
            // For now, we can keep the existing logic or simplify it.
            // Since we redirect to static pages, this might not be used much.
        }

        if (backButton) {
            backButton.addEventListener('click', () => {
                // Go back to home
                navigateTo('home');
            });
        }

        // --- Search Functionality ---
        let fuse; // Fuse instance

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();

                // Initialize Fuse if needed
                if (!fuse && allArticles.length > 0 && window.Fuse) {
                    fuse = new Fuse(allArticles, {
                        keys: [
                            { name: 'title', weight: 0.7 },
                            { name: 'description', weight: 0.3 }
                        ],
                        threshold: 0.4, // 0.0 = perfect match, 1.0 = match anything
                        includeScore: true,
                        ignoreLocation: true
                    });
                }

                if (!query) {
                    currentPage = 1;
                    renderArticles(allArticles, articlesList);
                    return;
                }

                if (fuse) {
                    const results = fuse.search(query).map(result => result.item);
                    currentPage = 1;
                    renderArticles(results, articlesList);
                } else {
                    // Fallback to simple filter if Fuse not loaded
                    const lowerQuery = query.toLowerCase();
                    const filtered = allArticles.filter(article =>
                        article.title.toLowerCase().includes(lowerQuery) ||
                        (article.description && article.description.toLowerCase().includes(lowerQuery))
                    );
                    currentPage = 1;
                    renderArticles(filtered, articlesList);
                }
            });
        }

        // --- Theme Toggle ---
        function initTheme() {
            const savedTheme = localStorage.getItem('theme') ||
                (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

            document.documentElement.setAttribute('data-theme', savedTheme);

            if (themeToggle) {
                themeToggle.addEventListener('click', () => {
                    const current = document.documentElement.getAttribute('data-theme');
                    const next = current === 'dark' ? 'light' : 'dark';
                    document.documentElement.setAttribute('data-theme', next);
                    localStorage.setItem('theme', next);
                });
            }
        }

        // --- Initialization ---
        async function init() {
            initTheme();

            // Load Data
            const [articles, pinnedPaths] = await Promise.all([fetchArticles(), fetchPinned()]);
            allArticles = articles;

            // Render Latest
            if (articlesList) renderArticles(allArticles, articlesList);

            // Render Pinned
            if (pinnedArticlesList) {
                if (pinnedPaths && pinnedPaths.length > 0) {
                    const pinned = allArticles.filter(a => {
                        const decodedPath = decodeURIComponent(a.path);
                        return pinnedPaths.includes(decodedPath) || pinnedPaths.includes(a.path);
                    });
                    // Sort by pinned order
                    pinned.sort((a, b) => {
                        const pathA = decodeURIComponent(a.path);
                        const pathB = decodeURIComponent(b.path);
                        const indexA = pinnedPaths.indexOf(pathA) !== -1 ? pinnedPaths.indexOf(pathA) : pinnedPaths.indexOf(a.path);
                        const indexB = pinnedPaths.indexOf(pathB) !== -1 ? pinnedPaths.indexOf(pathB) : pinnedPaths.indexOf(b.path);
                        return indexA - indexB;
                    });

                    // Render pinned items in sidebar
                    pinnedArticlesList.innerHTML = '';
                    pinned.forEach(article => {
                        const link = document.createElement('a');
                        link.className = 'pinned-item';

                        // Use pre-generated static URL
                        link.href = article.url || '#';

                        link.innerHTML = `
                            <h4>${article.title}</h4>
                            <span>${article.date}</span>
                        `;
                        pinnedArticlesList.appendChild(link);
                    });
                } else {
                    pinnedArticlesList.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-secondary);">No pinned articles.</p>';
                }
            }

            // Render Categories
            renderCategories(allArticles);
        }

        function renderCategories(articles) {
            const categoriesList = document.getElementById('categories-list');
            const categoriesToggle = document.getElementById('categories-toggle');

            if (!categoriesList) return;

            // Remove existing listeners to avoid duplicates if called multiple times
            if (categoriesToggle) {
                const newToggle = categoriesToggle.cloneNode(true);
                categoriesToggle.parentNode.replaceChild(newToggle, categoriesToggle);

                newToggle.addEventListener('click', () => {
                    newToggle.classList.toggle('collapsed');
                    categoriesList.classList.toggle('collapsed');
                });
            }

            // Build Tree
            const categoryTree = { name: 'root', children: {}, articles: [] };

            articles.forEach(article => {
                const catPath = article.category || 'Uncategorized';
                // Split by / or \ (just in case)
                const parts = catPath.split(/[/\\]/);

                let currentNode = categoryTree;

                parts.forEach((part, index) => {
                    if (!currentNode.children[part]) {
                        // Reconstruct full path for this node
                        const currentPath = parts.slice(0, index + 1).join('/');

                        currentNode.children[part] = {
                            name: part,
                            fullPath: currentPath,
                            children: {},
                            articles: []
                        };
                    }
                    currentNode = currentNode.children[part];
                });

                currentNode.articles.push(article);
            });

            categoriesList.innerHTML = '';

            // Recursive Render Function
            function renderChildren(parentNode, container) {
                // Sort keys: Uncategorized last, others alphabetical
                const keys = Object.keys(parentNode.children).sort((a, b) => {
                    if (a === 'Uncategorized') return 1;
                    if (b === 'Uncategorized') return -1;
                    return a.localeCompare(b);
                });

                keys.forEach(key => {
                    const node = parentNode.children[key];

                    const group = document.createElement('div');
                    group.className = 'category-group';

                    const header = document.createElement('div');
                    header.className = 'category-title';

                    header.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron-icon" style="transform: rotate(-90deg)">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                        ${node.name}
                    `;

                    const itemsContainer = document.createElement('div');
                    itemsContainer.className = 'category-items collapsed';

                    // Click Handler
                    header.addEventListener('click', (e) => {
                        e.stopPropagation();

                        itemsContainer.classList.toggle('collapsed');
                        const icon = header.querySelector('.chevron-icon');
                        if (icon) {
                            icon.style.transform = itemsContainer.classList.contains('collapsed') ? 'rotate(-90deg)' : 'rotate(0deg)';
                        }

                        // Filter Logic
                        const collectArticles = (n) => {
                            let acc = [...n.articles];
                            Object.values(n.children).forEach(child => {
                                acc = acc.concat(collectArticles(child));
                            });
                            return acc;
                        };

                        // Update sidebar width based on expansion depth
                        updateSidebarWidth();

                        const nodeArticles = collectArticles(node);

                        const articlesList = document.getElementById('articles-list');
                        if (articlesList && nodeArticles.length > 0) {
                            renderArticles(nodeArticles, articlesList);

                            const mainHeader = document.querySelector('.section-header h2');
                            if (mainHeader) mainHeader.textContent = node.fullPath;

                            window.scrollTo(0, 0);
                            navigateTo('home');
                        }
                    });

                    group.appendChild(header);
                    group.appendChild(itemsContainer);

                    // Render Direct Articles
                    node.articles.forEach(article => {
                        const link = document.createElement('a');
                        link.className = 'category-link';
                        link.href = article.url || '#';
                        link.textContent = article.title;
                        itemsContainer.appendChild(link);
                    });

                    // Recurse for children
                    renderChildren(node, itemsContainer);

                    container.appendChild(group);
                });
            }

            function updateSidebarWidth() {
                const baseWidth = 250; // Base width in px
                const step = 30; // Width increase per level in px

                const expandedItems = document.querySelectorAll('.category-items:not(.collapsed)');
                let maxExpandedLevel = 0;

                expandedItems.forEach(item => {
                    let level = 1; // Base level
                    let parent = item.parentElement.closest('.category-items');
                    while (parent) {
                        level++;
                        parent = parent.parentElement.closest('.category-items');
                    }
                    if (level > maxExpandedLevel) maxExpandedLevel = level;
                });

                const newWidth = baseWidth + (maxExpandedLevel * step);
                const maxWidth = window.innerWidth * 0.5; // Cap at 50% viewport
                // Ensure we don't shrink below base width if nothing is expanded
                const finalWidth = Math.max(baseWidth, Math.min(newWidth, maxWidth));

                document.documentElement.style.setProperty('--sidebar-width', `${finalWidth}px`);
            }

            renderChildren(categoryTree, categoriesList);
        }

        init();
    }

    // Make copyCode available globally
    window.copyCode = function (btn) {
        const codeBlock = btn.closest('.code-window').querySelector('code');
        const text = codeBlock.innerText;

        navigator.clipboard.writeText(text).then(() => {
            const originalIcon = btn.innerHTML;
            btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27c93f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;
            setTimeout(() => {
                btn.innerHTML = originalIcon;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    };
});
