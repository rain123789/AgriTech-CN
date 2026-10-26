
function forumIsEn() {
  var l = document.documentElement.getAttribute("data-lang") || document.documentElement.lang || "zh-CN";
  return l === "en";
}
function forumT(zh, en) { return forumIsEn() ? en : zh; }
var FORUM_EN = {
  "连续阴雨后水稻叶片出现褐色斑点，如何排查？": "Brown spots on rice leaves after days of rain — how to diagnose?",
  "近日连续阴雨，田间部分叶片出现褐色斑点。希望了解应先观察什么、什么情况需要联系植保站，以及是否应立即喷药。": "After days of rain, brown spots appeared on some leaves. What should I check first, when should I contact plant protection, and should I spray immediately?",
  "测土后磷含量偏高，磷肥应该如何调整？": "Soil test shows high phosphorus — how should I adjust P fertilizer?",
  "本地检测结果显示有效磷偏高，计划下一季减少磷肥并轮作豆科作物，想听听大家的经验。": "Local tests show high available phosphorus. I plan to cut P fertilizer next season and rotate legumes — would love your experience.",
  "滴灌带堵塞的日常检查方法": "Routine Checks for Clogged Drip Lines",
  "整理一套简单的巡检流程：过滤网、压力表、冲洗顺序，供刚开始用滴灌的农户参考。": "A simple inspection routine — filters, pressure gauges and flushing order — for farmers new to drip irrigation.",
  "卖粮前为什么要谈清楚等级和水分": "Why Agree on Grade and Moisture Before Selling Grain",
  "整理了水分、杂质、容重、等级与交货方式对价格的影响，供准备售粮时参考。": "How moisture, impurities, test weight, grade and delivery terms affect price — a reference before selling grain."
};
var FORUM_TAG_EN = {
  "水稻": "Rice", "病害": "Disease", "雨季": "Rainy Season",
  "测土": "Soil Testing", "施肥": "Fertilization", "轮作": "Rotation",
  "灌溉": "Irrigation", "农机": "Machinery", "维护": "Maintenance",
  "销售": "Sales", "价格": "Price", "质量": "Quality"
};
var FORUM_CAT_EN = {
  "作物保护": "Crop Protection",
  "土壤与施肥": "Soil & Fertilizer",
  "农机与灌溉": "Machinery & Irrigation",
  "经营与市场": "Business & Market"
};
function forumText(t) { return forumIsEn() ? (FORUM_EN[t] || t) : t; }
document.addEventListener('DOMContentLoaded', () => {
    const forum = new ForumManager();
    forum.init();
});

class ForumManager {
    constructor() {
        this.apiBase = '/api/v1/forum';
        this.threadsContainer = document.getElementById('threads-feed');
        this.categoriesList = document.getElementById('categories-list');
        this.socket = null;
        this.currentToken = localStorage.getItem('token');
        this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        this.currentCategoryId = null;
    }

    async init() {
        this.initSocket();
        await this.loadCategories();
        await this.loadThreads();
        this.setupEventListeners();
        this.loadUserStats();
    }

    initSocket() {
        if (typeof window.io !== 'function') return;
        this.socket = io('/forum', {
            auth: { token: this.currentToken }
        });

        this.socket.on('new_post_comment', (data) => {
            this.handleNewComment(data);
        });

        this.socket.on('user_typing', (data) => {
            this.showTypingIndicator(data);
        });
    }

    async loadCategories() {
        try {
            const resp = await fetch(`${this.apiBase}/categories`);
            const data = await resp.json();

            if (data.status === 'success') {
                this.renderCategories(data.data);
            }
        } catch (err) {
            console.error('Failed to load categories', err);
        }
    }

    async loadThreads(params = {}) {
        try {
            this.threadsContainer.innerHTML = '<div class="loader">正在加载话题…</div>';

            const queryParams = new URLSearchParams(params);
            if (this.currentCategoryId) queryParams.set('category_id', this.currentCategoryId);

            const resp = await fetch(`${this.apiBase}/threads?${queryParams.toString()}`);
            const data = await resp.json();

            if (data.status === 'success') {
                this.renderThreads(data.data);
            }
        } catch (err) {
            console.error('Failed to load threads', err);
        }
    }

    renderCategories(categories) {
        this.categoriesList.innerHTML = categories.map(cat => `
            <div class="category-item ${this.currentCategoryId === cat.id ? 'active' : ''}" 
                 onclick="forum.filterByCategory(${cat.id})">
                <span><i class="fas ${cat.icon || 'fa-folder'}"></i> ${forumIsEn() ? (FORUM_CAT_EN[cat.name] || cat.name) : cat.name}</span>
                <span class="count">${cat.thread_count}</span>
            </div>
        `).join('') + `
            <div class="category-item ${!this.currentCategoryId ? 'active' : ''}" 
                 onclick="forum.filterByCategory(null)">
                <span><i class="fas fa-list"></i> ${forumT('全部话题', 'All Topics')}</span>
            </div>
        `;
    }

    renderThreads(threads) {
        if (threads.length === 0) {
            this.threadsContainer.innerHTML = '<div class="empty-state">' + forumT('该分类下暂无话题，来发布第一条吧。', 'No topics in this category yet. Be the first to post.') + '</div>';
            return;
        }

        this.threadsContainer.innerHTML = threads.map((thread, index) => `
            <div class="card thread-card ${thread.is_pinned ? 'pinned' : ''}" 
                 style="animation-delay: ${index * 0.1}s"
                 onclick="forum.viewThread(${thread.id})">
                <div class="author-info">
                    <div class="avatar">${thread.user_id ? 'U' : 'AI'}</div>
                    <div class="meta">
                        <div class="name">${thread.user_id ? forumT('社区成员（演示）', 'Community Member (Demo)') : forumT('平台助手', 'Platform Assistant')}</div>
                        <div class="date">${formatDate(thread.created_at)}</div>
                    </div>
                </div>
                <h3 class="thread-title">${forumText(thread.title)}</h3>
                <p class="thread-preview">${forumText(thread.content)}</p>
                <div class="thread-tags">
                    ${thread.tags.map(tag => `<span class="tag">#${forumIsEn() ? (FORUM_TAG_EN[tag] || tag) : tag}</span>`).join('')}
                </div>
                <div class="thread-footer">
                    <span><i class="far fa-thumbs-up"></i> ${thread.upvote_count}${forumT(' 赞同', ' Upvotes')}</span>
                    <span><i class="far fa-comment"></i> ${thread.comment_count}${forumT(' 回复', ' Replies')}</span>
                    <span><i class="far fa-eye"></i> ${thread.view_count}${forumT(' 浏览', ' Views')}</span>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        const searchInput = document.getElementById('forum-search');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.loadThreads({ q: e.target.value });
            }, 500);
        });

        document.getElementById('btn-new-thread').addEventListener('click', () => {
            this.toggleModal('create-thread-modal', true);
        });
    }

    async createThread() {
        const title = document.getElementById('thread-title-input').value;
        const content = document.getElementById('thread-content-input').value;
        const category_id = document.getElementById('thread-category-select').value;

        if (!title || !content || !category_id) {
            return this._toast('请完整填写标题、内容和分类。', 'error');
        }

        try {
            const resp = await fetch(`${this.apiBase}/threads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.currentToken}`
                },
                body: JSON.stringify({ title, content, category_id, tags: [] })
            });

            const data = await resp.json();
            if (data.status === 'success') {
                this._toast('演示环境已记录话题（未写入真实社区）。', 'success');
                this.toggleModal('create-thread-modal', false);
                this.loadThreads();
            } else {
                this._toast(data.message || '发布失败', 'error');
            }
        } catch (err) {
            this._toast('发布失败，请稍后重试。', 'error');
        }
    }

    _toast(message, type = 'info') {
        if (typeof window.Toast === 'object' && window.Toast && typeof window.Toast[type] === 'function') {
            window.Toast[type](message);
        } else {
            console.info(`[社区提示] ${message}`);
        }
    }

    filterByCategory(catId) {
        this.currentCategoryId = catId;
        this.loadCategories();
        this.loadThreads();
    }

    toggleModal(id, show) {
        const modal = document.getElementById(id);
        if (show) modal.classList.add('active');
        else modal.classList.remove('active');
    }

    async loadUserStats() {
        if (!this.currentUser.id) return;

        try {
            const resp = await fetch(`${this.apiBase}/reputation/${this.currentUser.id}`);
            const data = await resp.json();

            if (data.status === 'success') {
                const rep = data.data.reputation;
                document.getElementById('user-score').textContent = rep.total_score;
                document.getElementById('user-badge').innerHTML = rep.is_expert ?
                    '<span class="ai-badge">Expert</span>' : 'Member';
            }
        } catch (err) { }
    }

    // Modal open logic for thread details
    async viewThread(id) {
        // In a real app, this might navigate. For MVP, we'll open a full-page modal/detail view.
        // We'll simulate navigation for now
        window.location.hash = `thread/${id}`;
        // Implement detail view logic...
    }
}

// Helper Utilities
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now - date) / 1000;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
}

const Toast = {
    error: (msg) => Swal.fire({ icon: 'error', title: 'Error', text: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 }),
    success: (msg) => Swal.fire({ icon: 'success', title: 'Success', text: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 })
};

// Global instance access
window.forum = null;
document.addEventListener('DOMContentLoaded', () => { window.forum = new ForumManager(); window.forum.init(); });
