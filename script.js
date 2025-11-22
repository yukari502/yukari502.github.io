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

            // Strip frontmatter if present
            const contentBody = text.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');

            // Configure renderer to rewrite image paths
            const renderer = new marked.Renderer();
            const filename = path.split('/').pop().replace(/\.md$/i, '');
            const articleFolderName = decodeURIComponent(filename);

            renderer.image = function (href, title, text) {
                // Check if absolute or already pointing to Pic
                if (href && !href.startsWith('http') && !href.startsWith('https') && !href.startsWith('/') && !href.startsWith('data:') && !href.startsWith('Pic/')) {
                    href = `Pic/${articleFolderName}/${href}`;
                }
                return `<img src="${href}" alt="${text}"${title ? ` title="${title}"` : ''}>`;
            };

            const htmlContent = marked.parse(contentBody, { renderer: renderer });

            // Check if the content already starts with an H1
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            const hasH1 = tempDiv.firstElementChild && tempDiv.firstElementChild.tagName === 'H1';

            if (hasH1) {
                markdownContent.innerHTML = htmlContent;
            } else {
                markdownContent.innerHTML = `<h1>${title}</h1>${htmlContent}`;
            }

            // Highlight code blocks
            markdownContent.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });

            // Show article view
            sections.forEach(s => s.classList.remove('active'));
            articleView.classList.add('active');
            window.scrollTo(0, 0);

        } catch (e) {
            console.error(e);
            alert('Failed to load article content.');
        }
    }

    backButton.addEventListener('click', () => {
        // Go back to articles or home depending on where we came from? 
        // For now, default to articles list or just previous state.
        // Simplest: Go to 'articles' tab
        navigateTo('articles');
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
            renderArticles(pinned, pinnedArticlesList);
        } else {
            pinnedArticlesList.innerHTML = '<p>No pinned articles.</p>';
        }
    }

    init();
});
