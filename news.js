// News Data - Sample agricultural news articles
const newsArticles = [
  {
    id: 1,
    title: "水稻分蘖期管理要点",
    description: "连续阴雨时保持浅水层，利用雨隙晒田，并重点巡查稻瘟病中心病株。",
    content: "本条为本地演示资讯。分蘖期建议根据苗数和天气动态调整水层，避免长期深水；发现疑似病斑应拍照记录并联系当地植保部门复核，不凭单张图片直接用药。",
    category: "farming-tips",
    source: "本地演示资讯",
    date: "2026-10-24",
    image: "images/crop.avif",
    link: "#"
  },
  {
    id: 2,
    title: "小麦播种前的土壤准备",
    description: "适期整地、控制播深和基肥比例，比盲目增加播种量更能稳产。",
    content: "本条为本地演示资讯。播种前建议检查墒情、秸秆还田质量和耕层平整度；基肥用量应参考测土结果，避免偏施氮肥。",
    category: "farming-tips",
    source: "本地演示资讯",
    date: "2026-10-23",
    image: "images/farm.jpg",
    link: "#"
  },
  {
    id: 3,
    title: "设施番茄的通风降湿方法",
    description: "上午升温后逐步通风，避免叶面长时间结露，可降低真菌性病害风险。",
    content: "本条为本地演示资讯。可结合侧窗、顶窗和环流风机调节温湿度；浇水优先采用膜下滴灌，并在发病初期及时清除下部病叶。",
    category: "technology",
    source: "本地演示资讯",
    date: "2026-10-22",
    image: "images/disease.avif",
    link: "#"
  },
  {
    id: 4,
    title: "秋冬季农机保养清单",
    description: "作业结束后清洁、润滑、检查油路与轮胎，有助于减少来年春季停机。",
    content: "本条为本地演示资讯。建议登记作业小时、更换滤芯和易损件，并将农机存放在干燥通风处。",
    category: "technology",
    source: "本地演示资讯",
    date: "2026-10-21",
    image: "images/Swaraj-Harvester-Dealers.jpg",
    link: "#"
  },
  {
    id: 5,
    title: "绿色种养循环试点方向",
    description: "畜禽粪污经充分腐熟和检测后还田，需要配套田间记录和养分平衡核算。",
    content: "本条为本地演示资讯。具体试点范围、补助方式和申报时间以县农业农村局公开文件为准，本页面不虚构补贴金额。",
    category: "sustainability",
    source: "政策方向演示",
    date: "2026-10-20",
    image: "images/organic.jpg",
    link: "#"
  },
  {
    id: 6,
    title: "节水灌溉常用做法",
    description: "滴灌、喷灌和覆盖保墒可提高水分利用效率，但需结合土壤墒情调度。",
    content: "本条为本地演示资讯。建议在作物需水关键期优先保障供水，高温天气避开中午灌溉，并定期检查管路堵塞。",
    category: "sustainability",
    source: "本地演示资讯",
    date: "2026-10-19",
    image: "images/plantation.avif",
    link: "#"
  },
  {
    id: 7,
    title: "粮价信息应核对多来源",
    description: "平台中的价格走势为演示数据，实际交易前应同时核对批发市场与采购商报价。",
    content: "本条为本地演示资讯。粮油价格受品种、水分、杂质、运输距离和市场等级影响，不能只看单一报价。",
    category: "market-trends",
    source: "本地演示资讯",
    date: "2026-10-18",
    image: "images/farm2.jpg",
    link: "#"
  },
  {
    id: 8,
    title: "气象预报与农事安排",
    description: "降雨、大风和降温预警会影响喷药、施肥与收获窗口。",
    content: "本条为本地演示资讯。建议以当地气象台发布的预警为准；平台演示天气不能替代实时预报。",
    category: "weather",
    source: "本地演示资讯",
    date: "2026-10-17",
    image: "images/weather.webp",
    link: "#"
  }
];

// 全局语言键：与导航栏保持一致
function newsIsEn() {
  try {
    if (window.cnI18n && window.cnI18n.language) return window.cnI18n.language === 'en';
    const stored = localStorage.getItem('agritech_lang') || localStorage.getItem('lang') || 'zh-CN';
    return String(stored).toLowerCase().startsWith('en');
  } catch (error) {
    return false;
  }
}

// 英文模式下的演示资讯内容（与中文条目一一对应，不做逐词直译）
const NEWS_EN = {
  1: {
    title: "Key Points for Rice at Tillering",
    description: "Keep a shallow water layer during spells of rain, aerate the field between showers, and scout for the first rice-blast lesions.",
    content: "This is local demo content. During tillering, adjust the water layer according to plant density and weather instead of leaving the field deeply flooded. If suspicious lesions appear, photograph them and ask your local plant-protection service to review; never spray based on a single image.",
    source: "Local demo news"
  },
  2: {
    title: "Preparing Soil Before Sowing Wheat",
    description: "Timely tillage, controlled sowing depth and a balanced base fertilizer keep yields steadier than simply raising the seeding rate.",
    content: "This is local demo content. Before sowing, check soil moisture, straw incorporation and seedbed levelness. Set the base fertilizer rate from a soil test and avoid one-sided nitrogen applications.",
    source: "Local demo news"
  },
  3: {
    title: "Ventilating Greenhouses to Cut Humidity",
    description: "Ventilate gradually as the house warms in the morning to stop leaves staying wet and lower fungal risk.",
    content: "This is local demo content. Use side vents, roof vents and circulation fans to manage temperature and humidity. Prefer drip irrigation under plastic mulch, and remove lower diseased leaves as soon as symptoms appear.",
    source: "Local demo news"
  },
  4: {
    title: "Autumn–Winter Machinery Maintenance Checklist",
    description: "Clean, lubricate and check oil lines and tyres after the season to avoid breakdowns next spring.",
    content: "This is local demo content. Log operating hours, replace filters and wear parts, and store machinery somewhere dry and well ventilated.",
    source: "Local demo news"
  },
  5: {
    title: "Directions for Green Crop–Livestock pilots",
    description: "Returning manure to fields after full composting and testing requires field records and nutrient-balance accounting.",
    content: "This is local demo content. The exact pilot scope, subsidy method and application window follow the public documents of your county agriculture bureau; this page does not invent subsidy amounts.",
    source: "Policy direction demo"
  },
  6: {
    title: "Common Water-Saving Irrigation Practices",
    description: "Drip, sprinkler and mulching improve water-use efficiency, but scheduling still has to follow soil moisture.",
    content: "This is local demo content. Prioritise supply during the crop's critical water-demand stages, avoid midday irrigation in hot weather, and check lines for blockages regularly.",
    source: "Local demo news"
  },
  7: {
    title: "Cross-Check Grain Prices Across Sources",
    description: "Price trends on this platform are demo data; before trading, compare wholesale market and buyer quotes.",
    content: "This is local demo content. Grain and oilseed prices depend on variety, moisture, impurities, transport distance and market grade, so never rely on a single quote.",
    source: "Local demo news"
  },
  8: {
    title: "Weather Forecasts and Farm Scheduling",
    description: "Rain, wind and cold warnings change the window for spraying, fertilizing and harvest.",
    content: "This is local demo content. Follow the warnings issued by your local weather bureau; demo weather on this platform cannot replace a live forecast.",
    source: "Local demo news"
  }
};

// 演示资讯数据的本地化包装
function newsLocalized(article) {
  if (newsIsEn() && NEWS_EN[article.id]) return Object.assign({}, article, NEWS_EN[article.id]);
  return article;
}

// DOM Elements
const newsGrid = document.getElementById('newsGrid');
const searchInput = document.getElementById('searchInput');
const categoryButtons = document.querySelectorAll('.filter-btn');
const newsModal = document.getElementById('newsModal');
const closeModal = document.getElementById('closeNewsModal');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const refreshBtn = document.getElementById('refreshBtn');
const emptyState = document.getElementById('empty-news-state');
const backToTopBtn = document.getElementById('backToTopBtn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

// State
let currentCategories = ['all']; // supports up to 2 real categories
let currentSearchTerm = '';
let displayedArticles = 6;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderNews();
  setupEventListeners();
});

// 语言切换后重渲染资讯卡片
window.addEventListener('languageChanged', () => {
  try {
    renderNews();
  } catch (error) {
    /* 初始化未完成时忽略 */
  }
});

// Setup Event Listeners
function setupEventListeners() {
  // Category filter (multi-select up to 2)
  categoryButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-category');

      // 点击“全部资讯”时重置筛选
      if (category === 'all') {
        currentCategories = ['all'];
        categoryButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      } else {
        // Remove "all" if any specific category is chosen
        currentCategories = currentCategories.filter((c) => c !== 'all');

        if (btn.classList.contains('active')) {
          // Deselect this category
          btn.classList.remove('active');
          currentCategories = currentCategories.filter((c) => c !== category);

          // If none left, fallback to "all"
          if (currentCategories.length === 0) {
            currentCategories = ['all'];
            const allBtn = document.querySelector('.filter-btn[data-category="all"]');
            if (allBtn) allBtn.classList.add('active');
          }
        } else {
          // Select category if we have a slot
          if (currentCategories.length < 2) {
            btn.classList.add('active');
            currentCategories.push(category);
          } else {
            // Replace the oldest selected category
            const oldest = currentCategories.shift();
            const oldestBtn = document.querySelector(`.filter-btn[data-category="${oldest}"]`);
            if (oldestBtn) oldestBtn.classList.remove('active');

            btn.classList.add('active');
            currentCategories.push(category);
          }
        }
      }

      displayedArticles = 6;
      renderNews();
    });
  });

  // Search
  searchInput.addEventListener('input', (e) => {
    currentSearchTerm = e.target.value.toLowerCase();
    displayedArticles = 6;
    renderNews();
  });

  // Load More
  loadMoreBtn.addEventListener('click', () => {
    displayedArticles += 6;
    renderNews();
  });

  // Refresh (acts as "clear all" including search)
  refreshBtn.addEventListener('click', () => {
    resetFiltersAndSearch();
    renderNews();
  });

  // Clear Filters button (only filters + search, keep pagination reset)
  clearFiltersBtn.addEventListener('click', () => {
    resetFiltersAndSearch();
    renderNews();
  });

  // Close Modal
  closeModal.addEventListener('click', () => {
    newsModal.classList.remove('active');
  });

  newsModal.addEventListener('click', (e) => {
    if (e.target === newsModal) {
      newsModal.classList.remove('active');
    }
  });
}

// Reset filters + search to defaults
function resetFiltersAndSearch() {
  displayedArticles = 6;
  currentCategories = ['all'];
  currentSearchTerm = '';
  searchInput.value = '';

  categoryButtons.forEach((b) => b.classList.remove('active'));
  const allBtn = document.querySelector('.filter-btn[data-category="all"]');
  if (allBtn) allBtn.classList.add('active');
}

// Decide when to show/hide Clear Filters button
function updateClearFiltersVisibility() {
  const hasNonAllCategory =
    !currentCategories.includes('all') && currentCategories.length > 0;
  const hasSearch = currentSearchTerm.trim().length > 0;

  if (hasNonAllCategory || hasSearch) {
    clearFiltersBtn.classList.remove('hidden');
  } else {
    clearFiltersBtn.classList.add('hidden');
  }
}

// Filter News
function getFilteredNews() {
  let filtered = newsArticles;

  // Category filter (allow "all" or up to two categories)
  if (!currentCategories.includes('all')) {
    filtered = filtered.filter((article) =>
      currentCategories.includes(article.category)
    );
  }

  // Search filter
  if (currentSearchTerm) {
    const term = currentSearchTerm;
    filtered = filtered.filter(
      (article) =>
        article.title.toLowerCase().includes(term) ||
        article.description.toLowerCase().includes(term) ||
        article.content.toLowerCase().includes(term)
    );
  }

  return filtered;
}

// Render News
function renderNews() {
  const filtered = getFilteredNews();
  const toDisplay = filtered.slice(0, displayedArticles);

  // Show/hide empty state
  if (toDisplay.length === 0) {
    emptyState.style.display = 'block';
    newsGrid.innerHTML = '';
    loadMoreBtn.style.display = 'none';
    updateClearFiltersVisibility();
    return;
  }

  emptyState.style.display = 'none';

  // Render articles
  newsGrid.innerHTML = toDisplay
    .map((article) => {
      const L = newsLocalized(article);
      return `
        <div class="news-card" onclick="openNewsModal(${article.id})">
          <img src="${L.image}" alt="${L.title}" class="news-card-image">
          <div class="news-card-content">
            <span class="news-card-category">${capitalizeCategory(article.category)}</span>
            <h3 class="news-card-title">${L.title}</h3>
            <p class="news-card-description">${L.description}</p>
            <div class="news-card-meta">
              <span class="news-card-source">
                <i class="fas fa-globe"></i> ${L.source}
              </span>
              <span class="news-card-date">
                <i class="far fa-calendar-alt"></i> ${formatDate(article.date)}
              </span>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  // Show/hide load more button
  loadMoreBtn.style.display = displayedArticles < filtered.length ? 'block' : 'none';

  // Update clear filters visibility
  updateClearFiltersVisibility();
}

// Open News Modal
function openNewsModal(id) {
  const article = newsArticles.find((a) => a.id === id);
  if (!article) return;

  const L = newsLocalized(article);
  document.getElementById('modalTitle').textContent = L.title;
  document.getElementById('modalImage').src = article.image;
  document.getElementById('modalContent').textContent = L.content;
  document.getElementById('modal-source').innerHTML = `<i class="fas fa-globe"></i> ${newsIsEn() ? 'Source' : '来源'}：${L.source}`;
  document.getElementById('modal-date').innerHTML = `<i class="far fa-calendar-alt"></i> ${formatDate(article.date)}`;
  document.getElementById('modalCategory').textContent = capitalizeCategory(article.category);
  document.getElementById('modalLink').href = article.link;

  newsModal.classList.add('active');
}

// Helper Functions
function capitalizeCategory(category) {
  return category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Add keyboard support
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    newsModal.classList.remove('active');
  }
});

// --- Cursor Trailing Effect ---
const container = document.getElementById('cursorTrail');
const circleCount = 12;
const circles = [];

let mouseX = 0;
let mouseY = 0;

// Create circles
for (let i = 0; i < circleCount; i++) {
  const circle = document.createElement('div');
  circle.classList.add('cursor-circle');
  container.appendChild(circle);
  circles.push({ el: circle, x: 0, y: 0 });
}

// Mouse move
document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// Click effects
document.addEventListener('mousedown', () => {
  circles.forEach((c) => c.el.classList.add('cursor-clicking'));
});
document.addEventListener('mouseup', () => {
  circles.forEach((c) => c.el.classList.remove('cursor-clicking'));
});

// Hover effects on interactive elements
document.addEventListener('mouseover', (e) => {
  if (e.target.closest('a, button, .cta-button, .service-card, .shipment-card')) {
    circles.forEach((c) => c.el.classList.add('cursor-hovering'));
  }
});
document.addEventListener('mouseout', (e) => {
  if (e.target.closest('a, button, .cta-button, .service-card, .shipment-card')) {
    circles.forEach((c) => c.el.classList.remove('cursor-hovering'));
  }
});

// Animate trailing effect
function animateCursor() {
  let x = mouseX;
  let y = mouseY;

  circles.forEach((circle) => {
    circle.x += (x - circle.x) * 0.25;
    circle.y += (y - circle.y) * 0.25;

    circle.el.style.left = circle.x + 'px';
    circle.el.style.top = circle.y + 'px';

    x = circle.x;
    y = circle.y;
  });

  requestAnimationFrame(animateCursor);
}
animateCursor();

// --- Back to Top button logic ---
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Toggle visibility and FAB position on scroll
window.addEventListener('scroll', () => {
  const scrollPosition = window.scrollY || document.documentElement.scrollTop;

  if (scrollPosition > 600) {
    backToTopBtn.classList.add('show');      // show back-to-top
    refreshBtn.classList.add('raised');      // move refresh FAB up
  } else {
    backToTopBtn.classList.remove('show');   // hide back-to-top
    refreshBtn.classList.remove('raised');   // reset FAB position
  }
});

// Scroll to top on click
backToTopBtn.addEventListener('click', () => {
  const behavior = prefersReducedMotion.matches ? 'auto' : 'smooth';

  window.scrollTo({
    top: 0,
    left: 0,
    behavior
  });

  // Move focus to the first focusable element near the top
  const firstFocusable = document.querySelector(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (firstFocusable) {
    firstFocusable.focus({ preventScroll: true });
  }
});
