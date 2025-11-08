document.addEventListener('DOMContentLoaded', () => {
    // Removed mainContentSection as it's no longer used for replacement

    const pinnedArticlesListDiv = document.getElementById('pinned-articles-list');
    const articlesListDiv = document.getElementById('articles-list');

    // Helper function to create and render an article card
    function renderArticleCard(article, targetDivId) {
        const targetDiv = document.getElementById(targetDivId);
        if (!targetDiv) return; // Exit if the target div doesn't exist

        const articleCard = document.createElement('div');
        articleCard.className = 'article-item';
        articleCard.dataset.path = article.path;
        articleCard.dataset.title = article.title;

        articleCard.innerHTML = `
            <h3>${article.title}</h3>
            <p>${article.description || ''}</p>
        `;
        targetDiv.appendChild(articleCard);
    }

    // Helper function to attach listeners to the entire article card
    function attachArticleClickListeners() {
        document.querySelectorAll('.article-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                const articlePath = item.dataset.path;
                const articleTitle = item.dataset.title;
                await displayArticleContent(articlePath, articleTitle);
            });
        });
    }

    // Function to fetch and display pinned articles
    async function loadPinnedArticles() {
        try {
            const pinnedResponse = await fetch('pinned-articles.json');
            if (!pinnedResponse.ok) {
                console.warn('pinned-articles.json not found or could not be fetched. Proceeding without pinned articles.');
                pinnedArticlesListDiv.innerHTML = ''; // Clear loading message if no pinned articles
                return;
            }
            const pinnedArticlePaths = await pinnedResponse.json();

            const articlesResponse = await fetch('articles.json');
            if (!articlesResponse.ok) {
                throw new Error(`HTTP error! status: ${articlesResponse.status}`);
            }
            const allArticles = await articlesResponse.json();

            // Filter for pinned articles
            const pinnedArticles = allArticles.filter(article =>
                pinnedArticlePaths.some(path => path === article.path)
            );

            // Sort pinned articles according to the order in pinned-articles.json
            pinnedArticles.sort((a, b) => {
                const indexA = pinnedArticlePaths.indexOf(a.path);
                const indexB = pinnedArticlePaths.indexOf(b.path);
                return indexA - indexB;
            });

            pinnedArticlesListDiv.innerHTML = ''; // Clear loading message

            if (pinnedArticles.length === 0) {
                pinnedArticlesListDiv.innerHTML = '<p>No pinned articles.</p>';
                return;
            }

            pinnedArticles.forEach(article => {
                renderArticleCard(article, 'pinned-articles-list');
            });

        } catch (error) {
            console.error('Error loading pinned articles:', error);
            pinnedArticlesListDiv.innerHTML = `<p class="error">Failed to load pinned articles. Please check console for details.</p>`;
        }
    }

    // Function to fetch and display latest articles
    async function loadLatestArticles() {
        try {
            const articlesResponse = await fetch('articles.json');
            if (!articlesResponse.ok) {
                throw new Error(`HTTP error! status: ${articlesResponse.status}`);
            }
            let articles = await articlesResponse.json();

            // Sort all articles by date (descending) - including pinned articles
            articles.sort((a, b) => new Date(b.date) - new Date(a.date));

            articlesListDiv.innerHTML = ''; // Clear loading message

            if (articles.length === 0) {
                articlesListDiv.innerHTML = '<p>No articles found.</p>';
                return;
            }

            articles.forEach(article => {
                renderArticleCard(article, 'articles-list');
            });

        } catch (error) {
            console.error('Error loading latest articles:', error);
            articlesListDiv.innerHTML = `<p class="error">Failed to load latest articles. Please check console for details.</p>`;
        }
    }

    // Function to display the full content of a single article
    async function displayArticleContent(articlePath, articleTitle) {
        try {
            const response = await fetch(articlePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const markdownContent = await response.text();
            const htmlContent = marked.parse(markdownContent);

            // Hide article lists and show article view
            document.getElementById('about').style.display = 'none';
            document.getElementById('pinned-articles').style.display = 'none';
            document.getElementById('articles').style.display = 'none';
            document.getElementById('contact').style.display = 'none'; // Also hide contact section

            // Create and insert the article view section
            const articleViewSection = document.createElement('section');
            articleViewSection.id = 'article-view';
            articleViewSection.innerHTML = `
                <a href="#" id="back-to-articles">← Back to Articles</a>
                <h2>${articleTitle}</h2>
                <div class="article-content">
                    ${htmlContent}
                </div>
            `;
            document.querySelector('main').appendChild(articleViewSection);

            // Add event listener for the back button
            document.getElementById('back-to-articles').addEventListener('click', async (e) => {
                e.preventDefault();
                // Remove the article view section
                articleViewSection.remove();
                // Show article lists again
                document.getElementById('about').style.display = ''; // Restore default display
                document.getElementById('pinned-articles').style.display = '';
                document.getElementById('articles').style.display = '';
                document.getElementById('contact').style.display = '';
                // Re-render lists and re-attach listeners
                await loadLatestArticles();
                await loadPinnedArticles();
                attachArticleClickListeners();
            });

        } catch (error) {
            console.error('Error loading article content:', error);
            // Display error message in a way that allows going back
            const errorViewSection = document.createElement('section');
            errorViewSection.id = 'article-view'; // Use same ID for consistency
            errorViewSection.innerHTML = `
                <a href="#" id="back-to-articles">← Back to Articles</a>
                <h2>Error loading article</h2>
                <p class="error">Failed to load article content from ${articlePath}. Please check console for details.</p>
            `;
            document.querySelector('main').appendChild(errorViewSection);

            document.getElementById('back-to-articles').addEventListener('click', async (e) => {
                e.preventDefault();
                errorViewSection.remove();
                document.getElementById('about').style.display = '';
                document.getElementById('pinned-articles').style.display = '';
                document.getElementById('articles').style.display = '';
                document.getElementById('contact').style.display = '';
                // Re-render lists and re-attach listeners
                await loadLatestArticles();
                await loadPinnedArticles();
                attachArticleClickListeners();
            });
        }
    }

    // Theme toggle functionality
    function initTheme() {
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        const storedTheme = localStorage.getItem('theme');
        
        if (storedTheme) {
            document.documentElement.setAttribute('data-theme', storedTheme);
        } else if (prefersDarkScheme.matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }

        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) { // Ensure the button exists before adding listener
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
            });
        }

        prefersDarkScheme.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            }
        });
    }

    // Initial load of articles
    loadLatestArticles().then(() => {
        loadPinnedArticles(); // Load pinned articles after latest articles are loaded
    }).then(() => {
        attachArticleClickListeners(); // Attach listeners after both lists are populated
    });
    initTheme(); // Initialize theme when the DOM is ready
});
