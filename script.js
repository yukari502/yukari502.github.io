document.addEventListener('DOMContentLoaded', () => {
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

    // State
    let allArticles = [];

    // --- Navigation Logic ---
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
            e.preventDefault();
            const target = link.dataset.target;
            navigateTo(target);
        });
    });

    // --- Article Rendering ---
    function createArticleCard(article) {
        const card = document.createElement('div');
        card.className = 'article-card';
        card.dataset.path = article.path;
        card.dataset.title = article.title;

        card.innerHTML = `
            <h3>${article.title}</h3>
            <p class="article-meta">${article.date}</p>
            <p class="article-desc">${article.description || 'No description available.'}</p>
        `;

        card.addEventListener('click', () => {
            loadArticle(article.path, article.title);
        });

        return card;
    }

    function renderArticles(articles, container) {
        container.innerHTML = '';
        if (articles.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No articles found.</p>';
            return;
        }
        articles.forEach(article => {
            container.appendChild(createArticleCard(article));
        });
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

    // --- Article Loading ---
    async function loadArticle(path, title) {
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error('Failed to load article');

            const text = await response.text();

            // Configure renderer
            const renderer = new marked.Renderer();

            // Custom code block renderer
            renderer.code = function (code, language) {
                // In some marked versions or configurations, 'code' might be an object or token.
                // But typically with renderer.code(code, lang, escaped), code is string.
                // The issue '[object Object]' suggests 'code' is being stringified from an object.
                // Let's handle the case where the first arg is an object (token).

                let textToHighlight = code;
                let lang = language;

                if (typeof code === 'object' && code !== null) {
                    textToHighlight = code.text || code.raw || '';
                    lang = code.lang || language;
                }

                textToHighlight = String(textToHighlight || '');

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

            // Strip frontmatter if present
            const contentBody = text.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');

            // Calculate folder name for images
            const filename = path.split('/').pop().replace(/\.md$/i, '');
            // We need the decoded name to match the folder on disk, but for the URL we might need encoding.
            // Actually, since we are constructing a URL, we should use the encoded version for the path segment.
            // But we already have the encoded version in 'filename' (e.g. 'About%20me').
            // Let's just use 'filename' directly if it is already URL-safe/encoded.
            // Wait, 'path' from articles.json is 'Articles/About%20me.md'.
            // So 'filename' is 'About%20me'. This is perfect for the URL.

            const htmlContent = marked.parse(contentBody, {
                renderer: renderer,
                walkTokens: (token) => {
                    if (token.type === 'image') {
                        const href = token.href;
                        if (href && !href.startsWith('http') && !href.startsWith('https') && !href.startsWith('/') && !href.startsWith('data:') && !href.startsWith('Pic/')) {
                            token.href = `Pic/${filename}/${href}`;
                        }
                    }
                }
            });

            // Check if the content already starts with an H1
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            const hasH1 = tempDiv.firstElementChild && tempDiv.firstElementChild.tagName === 'H1';

            if (hasH1) {
                markdownContent.innerHTML = htmlContent;
            } else {
                markdownContent.innerHTML = `<h1>${title}</h1>${htmlContent}`;
            }

            // Highlight code blocks (already done in renderer, but keep for safety or other blocks)
            // Actually, since we render manually, we don't need hljs.highlightElement here for the main blocks.
            // But let's keep it if there are inline codes or other things.
            // markdownContent.querySelectorAll('pre code').forEach((block) => {
            //    hljs.highlightElement(block);
            // });

            // Show article view
            sections.forEach(s => s.classList.remove('active'));
            articleView.classList.add('active');
            window.scrollTo(0, 0);

        } catch (e) {
            console.error(e);
            alert('Failed to load article content.');
        }
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

    backButton.addEventListener('click', () => {
        // Go back to home
        navigateTo('home');
    });

    // --- Search Functionality ---
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allArticles.filter(article =>
            article.title.toLowerCase().includes(query) ||
            (article.description && article.description.toLowerCase().includes(query))
        );
        renderArticles(filtered, articlesList);
    });

    // --- Theme Toggle ---
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

        document.documentElement.setAttribute('data-theme', savedTheme);

        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
        });
    }

    // --- Initialization ---
    async function init() {
        initTheme();

        // Load Data
        const [articles, pinnedPaths] = await Promise.all([fetchArticles(), fetchPinned()]);
        allArticles = articles;

        // Render Latest
        renderArticles(allArticles, articlesList);

        // Render Pinned
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
                link.href = '#';
                link.innerHTML = `
                    <h4>${article.title}</h4>
                    <span>${article.date}</span>
                `;
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    loadArticle(article.path, article.title);
                });
                pinnedArticlesList.appendChild(link);
            });
        } else {
            pinnedArticlesList.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-secondary);">No pinned articles.</p>';
        }
    }

    init();
});
