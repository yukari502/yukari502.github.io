document.addEventListener('DOMContentLoaded', () => {
    const articlesListDiv = document.getElementById('articles-list');
    // Removed mainContentSection as it's no longer used for replacement

    // --- MODIFICATION 1: Renamed function for clarity ---
    // Helper function to attach listeners to the entire article card
    function attachArticleClickListeners() {
        // --- MODIFICATION 2: Changed selector from '.article-item a' to '.article-item' ---
        document.querySelectorAll('.article-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault(); // Prevents any default action, like following the 'Read more' link
                // --- MODIFICATION 3: Get data from the item (the div) itself ---
                const articlePath = item.dataset.path;
                const articleTitle = item.dataset.title;
                await displayArticleContent(articlePath, articleTitle);
            });
        });
    }

    // Function to fetch and display articles
    async function loadArticles() {
        try {
            // Assume articles.json contains an array of article objects
            // Each object should have: title, description, path (to .md file), category, date
            const response = await fetch('articles.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const articles = await response.json();

            // Sort articles by date (descending) if date is available
            articles.sort((a, b) => new Date(b.date) - new Date(a.date));

            articlesListDiv.innerHTML = ''; // Clear loading message

            if (articles.length === 0) {
                articlesListDiv.innerHTML = '<p class="error">No articles found. Please add some Markdown files to the Articles folder and create an articles.json file.</p>';
                return;
            }

            articles.forEach(article => {
                const articleCard = document.createElement('div');
                articleCard.className = 'article-item';

                // --- MODIFICATION 4: Moved data attributes from <a> to the parent div ---
                articleCard.dataset.path = article.path;
                articleCard.dataset.title = article.title;

                articleCard.innerHTML = `
                    <h3>${article.title}</h3>
                    <p>${article.description || ''}</p>
                    <a href="#">Read more →</a>
                `;
                articlesListDiv.appendChild(articleCard);
            });

            // --- MODIFICATION 5: Called the updated function ---
            // Add event listeners to the article cards
            attachArticleClickListeners();

        } catch (error) {
            console.error('Error loading articles:', error);
            articlesListDiv.innerHTML = `<p class="error">Failed to load articles. Please check console for details.</p>`;
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

            // Store original content to restore later
            const originalArticlesListContent = articlesListDiv.innerHTML;

            // Update articlesListDiv with the article content
            articlesListDiv.innerHTML = `
                <section id="article-view">
                    <a href="#" id="back-to-articles">← Back to Articles</a>
                    <h2>${articleTitle}</h2>
                    <div class="article-content">
                        ${htmlContent}
                    </div>
                </section>
            `;

            // Add event listener for the back button
            document.getElementById('back-to-articles').addEventListener('click', (e) => {
                e.preventDefault();
                // Restore original content and re-attach listeners
                articlesListDiv.innerHTML = originalArticlesListContent;
                // --- MODIFICATION 6: Called the updated function ---
                attachArticleClickListeners(); // Re-attach listeners for the article cards
            });

        } catch (error) {
            console.error('Error loading article content:', error);
            // Store original content to restore later even on error
            const originalArticlesListContent = articlesListDiv.innerHTML;

            articlesListDiv.innerHTML = `
                <section id="article-view">
                    <a href="#" id="back-to-articles">← Back to Articles</a>
                    <h2>Error loading article</h2>
                    <p class="error">Failed to load article content from ${articlePath}. Please check console for details.</p>
                </section>
            `;
             document.getElementById('back-to-articles').addEventListener('click', (e) => {
                e.preventDefault();
                // Restore original content and re-attach listeners
                articlesListDiv.innerHTML = originalArticlesListContent;
                // --- MODIFICATION 7: Called the updated function ---
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
    loadArticles();
    initTheme(); // Initialize theme when the DOM is ready
});