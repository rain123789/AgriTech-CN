/* =========================================
   FAVORITES MANAGER
   (Restored logic to make the Heart buttons work)
   ========================================= */
class FavoritesManager {
    constructor() {
        this.storageKey = 'agritech_favorite_blogs';
        this.favorites = JSON.parse(localStorage.getItem(this.storageKey)) || [];
        window.favoritesManager = this;
    }

    isFavorite(blogId) {
        return this.favorites.some(blog => blog.id === blogId);
    }

    addToFavorites(blogData) {
        if (this.isFavorite(blogData.id)) return false;

        blogData.addedAt = new Date().toISOString();
        this.favorites.push(blogData);
        this.save();

        this.showNotification(`Added to favorites: ${blogData.title}`, 'success');
        this.dispatchEvent(blogData.id, true);
        return true;
    }

    removeFromFavorites(blogId) {
        this.favorites = this.favorites.filter(blog => blog.id !== blogId);
        this.save();

        this.showNotification('Removed from favorites', 'error');
        this.dispatchEvent(blogId, false);
        return true;
    }

    getFavorites() {
        return this.favorites;
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.favorites));
    }

    dispatchEvent(blogId, isFavorite) {
        const event = new CustomEvent('favoriteToggle', {
            detail: { blogId, isFavorite }
        });
        document.dispatchEvent(event);
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.textContent = message;

        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            background: type === 'success' ? '#2c5f2d' : '#e74c3c',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        });

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

if (!window.favoritesManager) {
    class FavoritesManager {
        constructor() {
            this.storageKey = 'agritech_favorite_blogs';
            this.favorites = JSON.parse(localStorage.getItem(this.storageKey)) || [];
            window.favoritesManager = this;
            // console.log('✅ FavoritesManager initialized');
        }

        isFavorite(blogId) {
            return this.favorites.some(blog => blog.id === blogId);
        }

        addToFavorites(blogData) {
            if (this.isFavorite(blogData.id)) return false;
            blogData.addedAt = new Date().toISOString();
            this.favorites.push(blogData);
            localStorage.setItem(this.storageKey, JSON.stringify(this.favorites));

            // Show notification
            const notification = document.createElement('div');
            notification.textContent = `Added to favorites: ${blogData.title}`;
            notification.style.cssText = 'position:fixed;top:20px;right:20px;background:#2c5f2d;color:white;padding:12px 20px;border-radius:8px;z-index:10000;';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);

            // Dispatch event
            const event = new CustomEvent('favoriteToggle', {
                detail: { blogId: blogData.id, isFavorite: true, blogData }
            });
            document.dispatchEvent(event);

            return true;
        }

        removeFromFavorites(blogId) {
            this.favorites = this.favorites.filter(blog => blog.id !== blogId);
            localStorage.setItem(this.storageKey, JSON.stringify(this.favorites));

            // Dispatch event
            const event = new CustomEvent('favoriteToggle', {
                detail: { blogId, isFavorite: false }
            });
            document.dispatchEvent(event);

            return true;
        }

        getFavorites() {
            return this.favorites;
        }
    }

    // Initialize immediately
    new FavoritesManager();
}

// Sample blog data - UPDATED with full content for "Read More" functionality
const defaultBlogPosts = [
    {
        id: 'cn-soil-health',
        title: "土壤健康是稳产的第一步",
        category: "farming-tips",
        description: "从有机质、耕层结构和测土配方三个基础点看土壤管理。",
        image: "images/farm.jpg",
        content: `
            <p>土壤管理不是单季工程，而是连续记录和调整的过程。</p>
            <h4>三个基础动作</h4>
            <ul>
                <li>定期检测 pH、有机质和速效养分；</li>
                <li>秸秆还田要配合腐熟与翻压质量检查；</li>
                <li>避免长期单一深翻，减少耕层结构破坏。</li>
            </ul>
            <p>本内容为平台演示文章，具体方案应结合本地测土结果。</p>
        `,
        author: "农智云演示",
        date: "2026-10-24"
    },
    {
        id: 'cn-water-saving',
        title: "节水灌溉：先看墒情再定时间",
        category: "farming-tips",
        description: "滴灌、喷灌和覆盖保墒的组合使用建议。",
        image: "images/plantation.avif",
        content: `
            <p>灌溉安排应综合土壤含水率、作物需水关键期和天气预报。</p>
            <h4>建议</h4>
            <ul>
                <li>高温时段避免大水漫灌；</li>
                <li>滴灌系统定期检查堵塞和压力；</li>
                <li>垄面覆盖可降低蒸发，但不能替代排水管理。</li>
            </ul>
        `,
        author: "农智云演示",
        date: "2026-10-23"
    },
    {
        id: 'cn-iot-monitoring',
        title: "物联网农田监测如何落地",
        category: "technology",
        description: "传感器、网络和看板只是工具，关键是形成巡查闭环。",
        image: "images/farm4.png",
        content: `
            <p>物联网监测的价值在于把异常提醒与田间复核连接起来。</p>
            <h4>实施要点</h4>
            <ul>
                <li>先明确要监控的变量和阈值；</li>
                <li>保留原始数据，便于判断传感器漂移；</li>
                <li>异常报警必须有人跟进，不能只看自动结论。</li>
            </ul>
        `,
        author: "农智云演示",
        date: "2026-10-22"
    },
    {
        id: 'cn-disease-check',
        title: "病害识别结果的正确使用方式",
        category: "technology",
        description: "图片识别适合初筛，不适合替代田间诊断和用药决策。",
        image: "images/disease.avif",
        content: `
            <p>上传清晰照片可以加快记录和沟通，但识别结果只是参考。</p>
            <h4>建议</h4>
            <ul>
                <li>同时拍摄叶片正反面、整株和田间环境；</li>
                <li>记录天气、发生面积和发展速度；</li>
                <li>用药前核对登记作物、防治对象和标签剂量。</li>
            </ul>
        `,
        author: "农智云演示",
        date: "2026-10-21"
    },
    {
        id: 'cn-green-practice',
        title: "绿色种植：先记录，再评估",
        category: "sustainability",
        description: "没有田间记录，就很难判断一项措施是否真的有效。",
        image: "images/organic.jpg",
        content: `
            <p>绿色措施应从投入、产出和田间状态三方面记录。</p>
            <h4>记录项</h4>
            <ul>
                <li>有机肥来源、腐熟程度和用量；</li>
                <li>水肥投入时间和数量；</li>
                <li>病虫害发生位置与处理结果。</li>
            </ul>
        `,
        author: "农智云演示",
        date: "2026-10-20"
    },
    {
        id: 'cn-market-mindset',
        title: "看价格先看规格和来源",
        category: "market-trends",
        description: "同一作物在不同等级、产地和交货方式下价格可能差别很大。",
        image: "images/farm2.jpg",
        content: `
            <p>交易前应明确品种、等级、水分、杂质、包装和运输责任。</p>
            <h4>建议</h4>
            <ul>
                <li>至少核对两个可靠来源；</li>
                <li>把计价单位写进合同或确认单；</li>
                <li>平台演示价格不作为报价依据。</li>
            </ul>
        `,
        author: "农智云演示",
        date: "2026-10-19"
    }
];

// Initialize blogPosts with defaults + user posts
let userPosts = JSON.parse(localStorage.getItem('agritech_user_posts')) || [];
let blogPosts = [...defaultBlogPosts, ...userPosts];

// Default fallback image (inline SVG data URL) for missing or broken images
const DEFAULT_BLOG_IMAGE = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
        <rect width="100%" height="100%" fill="#e6f4ea"/>
        <g fill="#2e7d32">
            <circle cx="150" cy="150" r="80" />
            <rect x="250" y="110" width="520" height="80" rx="8"/>
        </g>
        <text x="50%" y="85%" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="#2e7d32" text-anchor="middle">AgriTech — Image unavailable</text>
    </svg>
`);

// Global variables
let currentPage = 0;
const postsPerPage = 6;
let filteredPosts = [...blogPosts];
let currentCategory = 'all';
let searchQuery = '';
let currentModalPostId = null;
let _lastFocusedElement = null;

// Wait for DOM and FavoritesManager to be ready
document.addEventListener('DOMContentLoaded', function () {
    // Slight delay to ensure FavoritesManager is attached
    setTimeout(() => {
        if (!window.favoritesManager) {
            window.favoritesManager = new FavoritesManager();
        }

        displayPosts();
        setupEventListeners();
        updateFavoriteCounter();
        openBlogFromQuery();
    }, 50);
});

function openBlogFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const blogId = params.get('id');

    if (!blogId) return;

    const post = blogPosts.find((item) => item.id === blogId);
    if (!post) return;

    openModal(blogId);
}



// Setup event listeners
function setupEventListeners() {
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', function () {
        searchQuery = this.value.toLowerCase();
        filterPosts();
    });
    // Specific listener for the enhanced modal close button
    const closeBlogBtn = document.getElementById('closeBlogModal');
    if (closeBlogBtn) {
        closeBlogBtn.addEventListener('click', closeModalHandler);
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function () {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            filterPosts();
        });
    });

    // Load more button
    document.getElementById('loadMoreBtn').addEventListener('click', loadMorePosts);

    // Modal functionality
    document.querySelector('.close').addEventListener('click', closeModalHandler);

    window.addEventListener('click', function (event) {
        if (event.target === document.getElementById('blogModal')) {
            closeModalHandler();
        }
    });

    // Modal favorite button
    document.getElementById('modalFavoriteBtn').addEventListener('click', toggleModalFavorite);

    // Keyboard handling for blog modal: ESC close and focus trap
    document.addEventListener('keydown', function (event) {
        const blogModal = document.getElementById('blogModal');
        if (!blogModal) return;

        const isOpen = blogModal.style.display === 'block';

        if (!isOpen) return;

        if (event.key === 'Escape') {
            closeModalHandler();
        }

        if (event.key === 'Tab') {
            // Focus trap within modal
            const focusableSelectors = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
            const focusable = Array.from(blogModal.querySelectorAll(focusableSelectors)).filter(el => el.offsetParent !== null);
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey) {
                if (document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        }
    });

    // Event delegation for favorite buttons
    document.addEventListener('click', function (e) {
        if (e.target.closest('.favorite-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const button = e.target.closest('.favorite-btn');
            const blogId = button.getAttribute('data-blog-id');

            // console.log('🎯 Favorite button clicked:', blogId);
            toggleFavorite(blogId);
        }
    });

    // Create Post Modal
    const createPostBtn = document.getElementById('createPostBtn');
    if (createPostBtn) {
        createPostBtn.addEventListener('click', () => {
            const modal = document.getElementById('createPostModal');
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            createPostBtn.setAttribute('aria-expanded', 'true');

            setTimeout(() => {
                const firstField = document.getElementById('postTitle');
                if (firstField) {
                    firstField.focus();
                }
            }, 50);
        });
    }

    const closeCreateModal = document.getElementById('closeCreateModal');
    if (closeCreateModal) {
        closeCreateModal.addEventListener('click', () => {
            document.getElementById('createPostModal').style.display = 'none';
            document.body.style.overflow = 'auto';
            if (createPostBtn) {
                createPostBtn.setAttribute('aria-expanded', 'false');
                createPostBtn.focus();
            }
        });
    }

    // Handle Create Post Form Submission
    const createPostForm = document.getElementById('createPostForm');
    if (createPostForm) {
        createPostForm.addEventListener('submit', handleCreatePost);
    }

    // Close create modal on clicking outside
    window.addEventListener('click', function (event) {
        if (event.target === document.getElementById('createPostModal')) {
            document.getElementById('createPostModal').style.display = 'none';
            document.body.style.overflow = 'auto';
            if (createPostBtn) {
                createPostBtn.setAttribute('aria-expanded', 'false');
            }
        }
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            const modal = document.getElementById('createPostModal');
            if (modal && modal.style.display === 'block') {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
                if (createPostBtn) {
                    createPostBtn.setAttribute('aria-expanded', 'false');
                    createPostBtn.focus();
                }
            }
        }
    });
}

// Update favorite counter
function updateFavoriteCounter() {
    if (window.favoritesManager) {
        const favorites = window.favoritesManager.getFavorites();
        const count = favorites.length;
        document.querySelectorAll('.favorite-count').forEach(element => {
            element.textContent = count;
            if (count > 0) {
                element.style.display = 'inline-flex';
            } else {
                element.style.display = 'none';
            }
        });
    }
}

// Filter posts
function filterPosts() {
    filteredPosts = blogPosts.filter(post => {
        const matchesSearch =
    post.title.toLowerCase().includes(searchQuery) ||
    (post.description && post.description.toLowerCase().includes(searchQuery)) ||
    (post.category && post.category.toLowerCase().includes(searchQuery));
        const matchesCategory = currentCategory === 'all' || post.category === currentCategory;
        return matchesSearch && matchesCategory;
    });

    currentPage = 0;
    document.getElementById('blogGrid').innerHTML = '';
    displayPosts();
}

// Display posts with favorite buttons
function displayPosts() {
    const blogGrid = document.getElementById('blogGrid');
    const startIndex = currentPage * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToShow = filteredPosts.slice(startIndex, endIndex);

    if (postsToShow.length === 0 && startIndex === 0) {
        blogGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #666;">No posts found.</div>';
        document.getElementById('loadMoreBtn').style.display = 'none';
        return;
    }

    postsToShow.forEach(post => {
        const isFavorite = window.favoritesManager ? window.favoritesManager.isFavorite(post.id) : false;
        const favoriteIcon = isFavorite ? 'fas fa-heart' : 'far fa-heart';
        const favoriteClass = isFavorite ? 'favorite-btn active' : 'favorite-btn';

        const postElement = document.createElement('div');
        postElement.className = 'blog-card';
        postElement.innerHTML = `
            <img src="${post.image || DEFAULT_BLOG_IMAGE}" alt="${post.title}" onerror="this.onerror=null;this.src='${DEFAULT_BLOG_IMAGE}';">
            <button
                class="${favoriteClass}"
                data-blog-id="${post.id}"
                aria-label="${isFavorite ? 'Remove blog from favorites' : 'Add blog to favorites'}"
                aria-pressed="${isFavorite}"
                >
                    <i class="${favoriteIcon}" aria-hidden="true"></i>
                </button>
            </button>
            <div class="card-content">
                <span class="card-category">${post.category.replace('-', ' ')}</span>
                <h3 class="card-title">${post.title}</h3>

                <p class="card-description">${post.description || ''}</p>
    
                <div class="card-footer">
                <div class="card-meta">
                    <span class="card-author">By ${post.author}</span>
                    <span class="card-date">${post.date}</span>
                </div>
                <button class="read-more-btn"style="margin-top:16px" onclick="openModal('${post.id}')">Read More</button>
            </div>
        `;
        blogGrid.appendChild(postElement);
    });

    

    if (loadMoreBtn) {
        loadMoreBtn.style.display = 
            (currentPage + 1) * postsPerPage >= filteredPosts.length ? 'none' : 'inline-block';
    }
}

// Toggle favorite
function toggleFavorite(blogId) {
    // console.log('🔄 Toggling favorite for:', blogId);

    if (!window.favoritesManager) {
        alert('❌ Favorites feature not loaded');
        return;
    }

    const post = blogPosts.find(p => p.id === blogId);
    if (!post) {
        // console.error('❌ Post not found:', blogId);
        return;
    }

    const isFavorite = window.favoritesManager.isFavorite(blogId);

    if (isFavorite) {
        window.favoritesManager.removeFromFavorites(blogId);
    } else {
        window.favoritesManager.addToFavorites({
            id: blogId,
            title: post.title,
            description: post.description,
            category: post.category,
            image: post.image,
            author: post.author,
            date: post.date,
            content: post.content
        });
    }

    updateFavoriteButtons(blogId);
    updateFavoriteCounter();
}

// Update favorite buttons
function updateFavoriteButtons(blogId) {
    const buttons = document.querySelectorAll(`.favorite-btn[data-blog-id="${blogId}"]`);
    const isFavorite = window.favoritesManager.isFavorite(blogId);

    buttons.forEach(button => {
        const icon = button.querySelector('i');
        button.classList.toggle('active', isFavorite);
        icon.className = isFavorite ? 'fas fa-heart' : 'far fa-heart';

        button.setAttribute(
        'aria-label',
        isFavorite ? 'Remove blog from favorites' : 'Add blog to favorites'
        );
        button.setAttribute('aria-pressed', isFavorite);

    });

    if (currentModalPostId === blogId) {
        updateModalFavoriteButton();
    }
}

// Load more posts
function loadMorePosts() {
    currentPage++;
    displayPosts();
}

// Open modal
function openModal(postId) {
    const post = blogPosts.find(p => p.id === postId);
    if (!post) return;

    currentModalPostId = postId;
    document.getElementById('modalTitle').textContent = post.title;
    document.getElementById('modalCategory').textContent = post.category.replace('-', ' ');
    const modalImg = document.getElementById('modalImage');
    modalImg.src = post.image || DEFAULT_BLOG_IMAGE;
    modalImg.onerror = function () { this.onerror = null; this.src = DEFAULT_BLOG_IMAGE; };

    document.getElementById('modalContent').innerHTML = post.content;

    // Populate author and date if available
    const authorEl = document.getElementById('modal-Author');
    const dateEl = document.getElementById('modal-Date');
    if (authorEl) authorEl.textContent = (post.author ? 'By ' + post.author : '');
    if (dateEl) dateEl.textContent = (post.date ? post.date : '');

    updateModalFavoriteButton();
    const blogModal = document.getElementById('blogModal');
    // save last focused element to restore later
    _lastFocusedElement = document.activeElement;

    blogModal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // set focus to close button for accessibility
    setTimeout(() => {
        const closeBtn = document.getElementById('closeBlogModal');
        if (closeBtn) closeBtn.focus();
        // ensure modal-content is focusable for screen readers
        const modalContent = blogModal.querySelector('.modal-content');
        if (modalContent) modalContent.focus();
    }, 50);
}

// Close modal
function closeModalHandler() {
    const blogModal = document.getElementById('blogModal');
    if (blogModal) blogModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentModalPostId = null;

    // restore focus to the previously focused element
    try {
        if (_lastFocusedElement && typeof _lastFocusedElement.focus === 'function') {
            _lastFocusedElement.focus();
        }
    } catch (e) {
        // ignore
    }
}

// Update modal favorite button
function updateModalFavoriteButton() {
    if (!window.favoritesManager || !currentModalPostId) return;

    const isFavorite = window.favoritesManager.isFavorite(currentModalPostId);
    const button = document.getElementById('modalFavoriteBtn');
    const icon = button.querySelector('i');

    button.classList.toggle('active', isFavorite);
    icon.className = isFavorite ? 'fas fa-heart' : 'far fa-heart';

    button.setAttribute(
    'aria-label',
    isFavorite ? 'Remove blog from favorites' : 'Add blog to favorites'
    );
    button.setAttribute('aria-pressed', isFavorite);

}

// Toggle favorite from modal
function toggleModalFavorite() {
    if (currentModalPostId) {
        toggleFavorite(currentModalPostId);
    }
}

// Theme toggle
const blogThemeToggle = document.getElementById('themeToggle');
if (blogThemeToggle) blogThemeToggle.addEventListener('click', function () {
    const isDark = document.documentElement.hasAttribute('data-theme');
    const icon = document.getElementById('themeIcon');
    const text = document.getElementById('themeText');

    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        icon.textContent = '🌙';
        text.textContent = 'Dark Mode';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        icon.textContent = '☀️';
        text.textContent = 'Light Mode';
    }
});

// Listen for favorite changes
document.addEventListener('favoriteToggle', function (event) {
    // console.log('📢 Favorite event:', event.detail);
    updateFavoriteButtons(event.detail.blogId);
    updateFavoriteCounter();
});

// Handle Create Post
function handleCreatePost(e) {
    e.preventDefault();

    const title = document.getElementById('postTitle').value;
    const category = document.getElementById('postCategory').value;
    const description = document.getElementById('postContent').value.slice(0, 120) + '...';
    const image = document.getElementById('postImage').value;
    const tags = document.getElementById('postTags').value
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);
    const author = document.getElementById('postAuthor').value || 'AgriTech Contributor';
    const content = document.getElementById('postContent').value;

    const newPost = {
        id: 'user-post-' + Date.now(),
        title,
        category,
        description,
        image,
        tags,
        author,
        date: new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }),
        content,
        isUserPost: true
    };

    const userPosts = JSON.parse(localStorage.getItem('agritech_user_posts')) || [];
    userPosts.unshift(newPost);
    localStorage.setItem('agritech_user_posts', JSON.stringify(userPosts));

    blogPosts.unshift(newPost);
    filterPosts();

    document.getElementById('createPostModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('createPostForm').reset();

    alert('✅ Blog post published successfully!');
}

/* =========================================
   MULTILINGUAL DYNAMIC BLOG SUPPORT
   ========================================= */
let originalBlogTitles = {};
let originalBlogDescriptions = {};

async function updateBlogTranslations(lang) {
    if (!lang) {
        lang = localStorage.getItem('agritech-lang') || 'en';
    }

    if (lang === 'en') {
        // Restore original English titles/descriptions
        blogPosts.forEach(post => {
            if (originalBlogTitles[post.id]) post.title = originalBlogTitles[post.id];
            if (originalBlogDescriptions[post.id]) post.description = originalBlogDescriptions[post.id];
        });
        filterPosts();
        return;
    }

    // Cache original English text first
    blogPosts.forEach(post => {
        if (!originalBlogTitles[post.id]) originalBlogTitles[post.id] = post.title;
        if (!originalBlogDescriptions[post.id]) originalBlogDescriptions[post.id] = post.description;
    });

    if (window.i18nManager && typeof window.i18nManager.translateBatch === 'function') {
        try {
            const titles = blogPosts.map(p => originalBlogTitles[p.id] || p.title);
            const translatedTitles = await window.i18nManager.translateBatch(titles, lang);
            if (translatedTitles && translatedTitles.length === blogPosts.length) {
                blogPosts.forEach((p, idx) => {
                    p.title = translatedTitles[idx];
                });
            }
        } catch (err) {
            console.debug('Dynamic blog translation fallback:', err);
        }
    }

    filterPosts();
}

window.addEventListener('languageChanged', (e) => {
    const lang = e.detail ? e.detail.lang : 'en';
    updateBlogTranslations(lang);
});

document.addEventListener('DOMContentLoaded', () => {
    const initialLang = localStorage.getItem('agritech-lang') || 'en';
    if (initialLang && initialLang !== 'en') {
        setTimeout(() => updateBlogTranslations(initialLang), 300);
    }
});
