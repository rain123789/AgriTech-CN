/**
 * 农产品交易市场 — 中国大陆本土化交互层
 *
 * 保留原页面布局、商品卡样式、深色/浅色主题、筛选栏、购物车抽屉和动效。
 * 数据全部为明确标记的本地演示数据，不提供支付、物流或真实成交。
 */
(function () {
  "use strict";

  const CART_KEY = "agritech_marketplace_cart_v1";
  const PAGE_SIZE = 12;

  const CATEGORIES = {
    vegetables: "蔬菜",
    fruits: "水果",
    grains: "粮食",
    spices: "香辛料",
    dairy: "乳品",
    pulses: "豆类与杂粮",
  };

  const PRODUCTS = [
    {
      id: "hubei-lotus-root",
      title: "洪湖莲藕",
      category: "vegetables",
      icon: "🪷",
      badge: "产地直供",
      seller: "荆楚蔬果合作社",
      location: "湖北省",
      locationCode: "hubei",
      rating: 4.8,
      price: 6.8,
      priceUnit: "公斤",
      minQty: 10,
      minUnit: "公斤",
      distance: 50,
      newest: 0,
      stock: 1200,
      description: "洪湖湿地种植，脆嫩多汁，适合炖汤与餐饮供应。",
    },
    {
      id: "yantai-apple",
      title: "烟台红富士苹果",
      category: "fruits",
      icon: "🍎",
      badge: "当季鲜果",
      seller: "齐鲁果业",
      location: "山东省",
      locationCode: "shandong",
      rating: 4.9,
      price: 9.8,
      priceUnit: "公斤",
      minQty: 5,
      minUnit: "公斤",
      distance: 180,
      newest: 1,
      stock: 860,
      description: "果形端正、脆甜多汁，按等级分选后冷链发货。",
    },
    {
      id: "henan-wheat",
      title: "优质制粉小麦",
      category: "grains",
      icon: "🌾",
      badge: "批量采购",
      seller: "中原粮贸有限公司",
      location: "河南省",
      locationCode: "henan",
      rating: 4.5,
      price: 2.38,
      priceUnit: "公斤",
      minQty: 1000,
      minUnit: "公斤",
      distance: 120,
      newest: 2,
      stock: 30000,
      description: "容重稳定，适合制粉加工，支持按批次验质。",
    },
    {
      id: "sichuan-chili",
      title: "四川三樱椒",
      category: "spices",
      icon: "🌶️",
      badge: "现货",
      seller: "川味香料合作社",
      location: "四川省",
      locationCode: "sichuan",
      rating: 4.7,
      price: 28.0,
      priceUnit: "公斤",
      minQty: 2,
      minUnit: "公斤",
      distance: 150,
      newest: 3,
      stock: 260,
      description: "色泽红亮、辣味充足，适合调味品与餐饮加工。",
    },
    {
      id: "jiangsu-grape",
      title: "阳光玫瑰葡萄",
      category: "fruits",
      icon: "🍇",
      badge: "冷链发货",
      seller: "江南果蔬基地",
      location: "江苏省",
      locationCode: "jiangsu",
      rating: 4.9,
      price: 26.0,
      priceUnit: "公斤",
      minQty: 5,
      minUnit: "公斤",
      distance: 90,
      newest: 4,
      stock: 380,
      description: "无籽脆甜，按串分级装箱，适合商超和社区团购。",
    },
    {
      id: "shandong-milk",
      title: "巴氏鲜牛奶",
      category: "dairy",
      icon: "🥛",
      badge: "每日鲜配",
      seller: "齐鲁牧场",
      location: "山东省",
      locationCode: "shandong",
      rating: 4.7,
      price: 8.5,
      priceUnit: "升",
      minQty: 20,
      minUnit: "升",
      distance: 65,
      newest: 5,
      stock: 500,
      description: "牧场冷链直供，适合早餐、烘焙与零售渠道。",
    },
    {
      id: "heilongjiang-soybean",
      title: "非转基因大豆",
      category: "pulses",
      icon: "🫘",
      badge: "产地粮源",
      seller: "北大荒粮油",
      location: "黑龙江省",
      locationCode: "heilongjiang",
      rating: 4.6,
      price: 5.6,
      priceUnit: "公斤",
      minQty: 50,
      minUnit: "公斤",
      distance: 800,
      newest: 6,
      stock: 12000,
      description: "颗粒饱满，适合豆制品加工与饲料企业采购。",
    },
    {
      id: "yunnan-potato",
      title: "高原马铃薯",
      category: "vegetables",
      icon: "🥔",
      badge: "高原产地",
      seller: "云岭农产品",
      location: "云南省",
      locationCode: "yunnan",
      rating: 4.6,
      price: 2.8,
      priceUnit: "公斤",
      minQty: 20,
      minUnit: "公斤",
      distance: 620,
      newest: 7,
      stock: 5600,
      description: "黄心品种，规格均匀，适合团餐与批发市场。",
    },
    {
      id: "hubei-rice",
      title: "江汉优质稻谷",
      category: "grains",
      icon: "🌾",
      badge: "本地粮源",
      seller: "江汉米业",
      location: "湖北省",
      locationCode: "hubei",
      rating: 4.4,
      price: 2.96,
      priceUnit: "公斤",
      minQty: 1000,
      minUnit: "公斤",
      distance: 110,
      newest: 8,
      stock: 20000,
      description: "水分与出米率按批次检测，适合米厂批量采购。",
    },
    {
      id: "shandong-garlic",
      title: "金乡大蒜",
      category: "spices",
      icon: "🧄",
      badge: "出口级",
      seller: "金乡蒜业",
      location: "山东省",
      locationCode: "shandong",
      rating: 4.8,
      price: 7.2,
      priceUnit: "公斤",
      minQty: 10,
      minUnit: "公斤",
      distance: 300,
      newest: 9,
      stock: 9000,
      description: "蒜瓣饱满，按规格分级，适合批发与加工。",
    },
    {
      id: "chifeng-millet",
      title: "赤峰小米",
      category: "pulses",
      icon: "🌾",
      badge: "杂粮优选",
      seller: "草原杂粮合作社",
      location: "内蒙古自治区",
      locationCode: "inner-mongolia",
      rating: 4.7,
      price: 9.6,
      priceUnit: "公斤",
      minQty: 10,
      minUnit: "公斤",
      distance: 740,
      newest: 10,
      stock: 2200,
      description: "色泽金黄、颗粒均匀，适合家庭消费与礼盒分装。",
    },
    {
      id: "henan-peanut",
      title: "豫东花生",
      category: "pulses",
      icon: "🥜",
      badge: "产地直采",
      seller: "豫东油料合作社",
      location: "河南省",
      locationCode: "henan",
      rating: 4.5,
      price: 7.8,
      priceUnit: "公斤",
      minQty: 20,
      minUnit: "公斤",
      distance: 160,
      newest: 11,
      stock: 4800,
      description: "籽粒饱满，可用于榨油或食品加工，支持样品查验。",
    },
  ];

  const state = {
    filtered: [...PRODUCTS],
    category: "",
    location: "",
    search: "",
    sortKey: "price",
    sortDirection: "asc",
    inCartOnly: false,
    cart: loadCart(),
    page: 1,
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function loadCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(parsed)) return {};
      return parsed.reduce((accumulator, item) => {
        if (item && item.id && Number(item.qty) > 0) {
          accumulator[item.id] = { qty: Math.min(99, Math.max(1, Number(item.qty))) };
        }
        return accumulator;
      }, {});
    } catch (_) {
      return {};
    }
  }

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(
      Object.entries(state.cart).map(([id, value]) => ({ id, qty: value.qty }))
    ));
  }

  function money(value) {
    return `¥${Number(value).toLocaleString("zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function getProduct(id) {
    return PRODUCTS.find((product) => product.id === id);
  }

  function cartLines() {
    return Object.entries(state.cart)
      .map(([id, item]) => {
        const product = getProduct(id);
        if (!product) return null;
        const lotPrice = product.price * product.minQty;
        return { product, qty: item.qty, lotPrice, subtotal: lotPrice * item.qty };
      })
      .filter(Boolean);
  }

  function cartItemCount() {
    return Object.values(state.cart).reduce((total, item) => total + item.qty, 0);
  }

  function cartTotal() {
    return cartLines().reduce((total, line) => total + line.subtotal, 0);
  }

  function updateStats() {
    const sellers = new Set(PRODUCTS.map((product) => product.seller));
    const avgRating = PRODUCTS.reduce((sum, product) => sum + product.rating, 0) / PRODUCTS.length;
    const stats = [
      { value: PRODUCTS.length, decimals: 0 },
      { value: sellers.size, decimals: 0 },
      { value: 0, decimals: 0 },
      { value: avgRating, decimals: 1 },
    ];
    $$(".marketplace-stats .stat-value").forEach((element, index) => {
      const stat = stats[index];
      if (!stat) return;
      element.dataset.target = String(stat.value);
      element.dataset.decimals = String(stat.decimals);
      element.textContent = stat.decimals
        ? stat.value.toFixed(stat.decimals)
        : String(stat.value);
    });
    const labels = $$(".marketplace-stats .stat-label");
    if (labels[2]) labels[2].title = "演示环境没有真实成交，固定为 0";
  }

  function categoryCounts() {
    const counts = Object.keys(CATEGORIES).reduce((result, key) => ({ ...result, [key]: 0 }), {});
    PRODUCTS.forEach((product) => {
      counts[product.category] = (counts[product.category] || 0) + 1;
    });
    return counts;
  }

  function renderCategoryCounts() {
    const ids = {
      vegetables: "vegCount",
      fruits: "fruitCount",
      grains: "grainCount",
      spices: "spiceCount",
      dairy: "dairyCount",
      pulses: "pulseCount",
    };
    const counts = categoryCounts();
    Object.entries(ids).forEach(([category, id]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = `${counts[category] || 0} 件商品`;
    });
  }

  function renderProductCard(product) {
    const inCart = Boolean(state.cart[product.id]);
    return `
      <article class="product-card ${inCart ? "in-cart" : ""}"
        data-product-id="${product.id}"
        data-category="${product.category}"
        data-location="${product.locationCode}"
        data-price="${product.price}"
        data-rating="${product.rating}"
        data-distance="${product.distance}"
        data-newest="${product.newest}"
        data-no-i18n="true">
        <div class="product-image" role="button" tabindex="0" aria-label="查看${product.title}详情">
          <span aria-hidden="true">${product.icon}</span>
          <div class="product-badge">${product.badge}</div>
          <span class="cn-demo-tag">演示数据</span>
        </div>
        <div class="product-info">
          ${inCart ? '<div class="product-in-cart-label"><i class="fas fa-check-circle"></i> 已在购物车</div>' : ""}
          <div class="product-title" role="button" tabindex="0">${product.title}</div>
          <div class="product-seller">
            <i class="fas fa-user-circle"></i> ${product.seller} · ${product.location}
            <span class="seller-rating"><i class="fas fa-star"></i> ${product.rating.toFixed(1)}</span>
          </div>
          <p class="product-description">${product.description}</p>
          <div class="product-details">
            <div class="product-price">${money(product.price)}/${product.priceUnit}</div>
            <div class="product-quantity">${product.minQty} ${product.minUnit}起订</div>
          </div>
          <div class="product-actions">
            <button class="btn-primary" type="button" data-action="add" data-id="${product.id}">
              <i class="fas fa-cart-plus"></i>
              <span class="btn-label">${inCart ? "再加一批" : "加入购物车"}</span>
            </button>
            <button class="btn-primary" type="button" data-action="contact" data-id="${product.id}">
              <i class="fas fa-phone"></i> 联系商家
            </button>
            <button class="btn-secondary" type="button" data-action="detail" data-id="${product.id}"
              aria-label="查看${product.title}详情">
              <i class="fas fa-circle-info"></i>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function applyFilters() {
    const search = state.search.trim().toLowerCase();
    state.filtered = PRODUCTS.filter((product) => {
      const categoryLabel = CATEGORIES[product.category] || "";
      const haystack = [
        product.title,
        product.seller,
        product.location,
        product.description,
        categoryLabel,
      ].join(" ").toLowerCase();
      return (
        (!search || haystack.includes(search)) &&
        (!state.category || product.category === state.category) &&
        (!state.location || product.locationCode === state.location) &&
        (!state.inCartOnly || Boolean(state.cart[product.id]))
      );
    });

    state.filtered.sort((a, b) => {
      const direction = state.sortDirection === "asc" ? 1 : -1;
      if (state.sortKey === "newest") return (b.newest - a.newest) * direction;
      return (a[state.sortKey] - b[state.sortKey]) * direction;
    });
    state.page = 1;
    render();
  }

  function render() {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;
    grid.innerHTML = state.filtered.map(renderProductCard).join("");

    const emptyState = document.getElementById("empty-marketplace-state");
    if (emptyState) emptyState.style.display = state.filtered.length ? "none" : "block";

    const showing = state.filtered.length;
    const totalElement = document.getElementById("totalCount");
    const showingElement = document.getElementById("showingCount");
    if (totalElement) totalElement.textContent = String(PRODUCTS.length);
    if (showingElement) showingElement.textContent = String(showing);

    const loadMoreSection = document.getElementById("loadMoreSection");
    if (loadMoreSection) loadMoreSection.style.display = "none";
    const paginationSection = document.getElementById("paginationSection");
    if (paginationSection) paginationSection.style.display = "block";

    const currentPageDisplay = document.getElementById("currentPageDisplay");
    const totalPagesDisplay = document.getElementById("totalPagesDisplay");
    const totalPages = Math.max(1, Math.ceil(state.filtered.length / PAGE_SIZE));
    if (currentPageDisplay) currentPageDisplay.textContent = String(state.page);
    if (totalPagesDisplay) totalPagesDisplay.textContent = String(totalPages);

    const pageNumbers = document.getElementById("pageNumbers");
    if (pageNumbers) {
      pageNumbers.innerHTML = Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1;
        return `<button class="sort-btn ${page === state.page ? "active" : ""}" type="button" data-page="${page}">${page}</button>`;
      }).join("");
      pageNumbers.onclick = (event) => {
        const button = event.target.closest("[data-page]");
        if (!button) return;
        state.page = Number(button.dataset.page);
        render();
        document.querySelector(".products-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    }

    renderCategoryCounts();
    updateCartUI();
    document.dispatchEvent(new CustomEvent("cn:marketplace-rendered"));
  }

  function showNotification(message, type = "success") {
    let container = document.getElementById("notificationContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "notificationContainer";
      document.body.appendChild(container);
    }
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    const icon =
      type === "danger"
        ? "fa-exclamation-triangle"
        : type === "info"
          ? "fa-info-circle"
          : "fa-check-circle";
    notification.innerHTML = `<i class="fas ${icon}"></i><span></span>`;
    notification.querySelector("span").textContent = message;
    container.appendChild(notification);
    requestAnimationFrame(() => notification.classList.add("show"));
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 350);
    }, 2800);
  }

  function addToCart(productId) {
    const product = getProduct(productId);
    if (!product) return;
    state.cart[productId] = { qty: Math.min(99, (state.cart[productId]?.qty || 0) + 1) };
    saveCart();
    render();
    showNotification(`${product.title}已加入购物车，按起订量计价。`, "success");
  }

  function updateCartQty(productId, delta) {
    const current = state.cart[productId]?.qty || 0;
    const next = current + delta;
    if (next <= 0) {
      delete state.cart[productId];
    } else {
      state.cart[productId] = { qty: Math.min(99, next) };
    }
    saveCart();
    render();
  }

  function removeFromCart(productId) {
    delete state.cart[productId];
    saveCart();
    render();
    showNotification("已从购物车移除该商品。", "info");
  }

  function updateCartUI() {
    const lines = cartLines();
    const count = cartItemCount();
    const cartCount = document.getElementById("cartCount");
    if (cartCount) cartCount.textContent = String(count);

    const list = document.getElementById("cartItemsList");
    if (list) {
      if (!lines.length) {
        list.innerHTML = `
          <div class="cart-empty">
            <strong>购物车还是空的</strong>
            <div style="margin-top:4px;">从市场添加商品后会显示在这里。</div>
          </div>`;
      } else {
        list.innerHTML = lines.map(({ product, qty, lotPrice, subtotal }) => `
          <div class="cart-item-row" data-no-i18n="true">
            <div class="cart-item-top">
              <div>
                <div class="cart-item-name">${product.title}</div>
                <div class="cart-item-meta">${product.seller} · ${product.location}</div>
                <div class="cart-item-meta">1 批 = ${product.minQty} ${product.minUnit} · ${money(lotPrice)}</div>
              </div>
              <button type="button" class="cn-cart-remove" data-cart-remove="${product.id}" aria-label="移除${product.title}">
                <i class="fas fa-trash-can"></i>
              </button>
            </div>
            <div class="cn-cart-line">
              <div class="cn-qty-control">
                <button type="button" data-cart-minus="${product.id}" aria-label="减少一批">−</button>
                <strong>${qty} 批</strong>
                <button type="button" data-cart-plus="${product.id}" aria-label="增加一批">＋</button>
              </div>
              <strong class="cn-line-subtotal">${money(subtotal)}</strong>
            </div>
          </div>
        `).join("");
      }
    }

    const itemCount = document.getElementById("cartItemCount");
    if (itemCount) itemCount.textContent = String(count);

    let totalRow = document.getElementById("cnCartTotalRow");
    const summary = document.querySelector(".cart-summary");
    if (summary) {
      if (!totalRow) {
        totalRow = document.createElement("div");
        totalRow.id = "cnCartTotalRow";
        totalRow.className = "cart-summary-row cn-cart-total-row";
        totalRow.innerHTML = '<span>预估合计</span><strong id="cnCartTotal">¥0.00</strong>';
        const cta = summary.querySelector(".cart-summary-cta");
        summary.insertBefore(totalRow, cta || null);
      }
      const totalElement = document.getElementById("cnCartTotal");
      if (totalElement) totalElement.textContent = money(cartTotal());
      totalRow.style.display = lines.length ? "flex" : "none";
    }
  }

  function toggleCart(force) {
    const panel = document.getElementById("cartPanel");
    if (!panel) return;
    if (typeof force === "boolean") panel.classList.toggle("open", force);
    else panel.classList.toggle("open");
  }

  function closeCart() {
    document.getElementById("cartPanel")?.classList.remove("open");
  }

  function openDetail(productId) {
    const product = getProduct(productId);
    if (!product) return;
    closeDetail();
    const modal = document.createElement("div");
    modal.id = "cnProductModal";
    modal.className = "cn-product-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", `${product.title}商品详情`);
    modal.innerHTML = `
      <div class="cn-product-modal-card" data-no-i18n="true">
        <button type="button" class="cn-product-modal-close" aria-label="关闭商品详情">
          <i class="fas fa-xmark"></i>
        </button>
        <div class="cn-product-modal-hero">
          <span class="cn-product-modal-icon">${product.icon}</span>
          <span class="cn-demo-tag">演示数据</span>
        </div>
        <div class="cn-product-modal-body">
          <span class="cn-kicker">${CATEGORIES[product.category] || "农产品"} · ${product.location}</span>
          <h2>${product.title}</h2>
          <p>${product.description}</p>
          <div class="cn-detail-grid">
            <div><span>价格</span><strong>${money(product.price)}/${product.priceUnit}</strong></div>
            <div><span>起订量</span><strong>${product.minQty} ${product.minUnit}</strong></div>
            <div><span>商家</span><strong>${product.seller}</strong></div>
            <div><span>评分</span><strong>${product.rating.toFixed(1)} / 5.0</strong></div>
            <div><span>可供货量</span><strong>${product.stock.toLocaleString("zh-CN")} ${product.minUnit}</strong></div>
            <div><span>数据性质</span><strong>本地演示样例</strong></div>
          </div>
          <p class="cn-detail-note">价格为演示数据，不代表实时行情或真实成交价。平台不提供在线支付与物流结算。</p>
          <div class="cn-product-modal-actions">
            <button type="button" class="cta-button" data-detail-add="${product.id}">
              <i class="fas fa-cart-plus"></i> 加入购物车
            </button>
            <button type="button" class="btn-outline" data-detail-close>继续浏览</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    document.body.classList.add("cn-modal-open");
    requestAnimationFrame(() => modal.classList.add("show"));
    modal.addEventListener("click", (event) => {
      if (event.target === modal || event.target.closest("[data-detail-close], .cn-product-modal-close")) {
        closeDetail();
      }
      const addButton = event.target.closest("[data-detail-add]");
      if (addButton) {
        addToCart(addButton.dataset.detailAdd);
        closeDetail();
        toggleCart(true);
      }
    });
    document.addEventListener("keydown", escapeDetail);
    modal.querySelector("[data-detail-close]")?.focus();
  }

  function escapeDetail(event) {
    if (event.key === "Escape") closeDetail();
  }

  function closeDetail() {
    const modal = document.getElementById("cnProductModal");
    if (!modal) return;
    modal.classList.remove("show");
    setTimeout(() => modal.remove(), 180);
    document.body.classList.remove("cn-modal-open");
    document.removeEventListener("keydown", escapeDetail);
  }

  function setupFilters() {
    const category = document.getElementById("categoryFilter");
    const location = document.getElementById("locationFilter");
    if (category) {
      category.innerHTML = `
        <option value="">全部品类</option>
        ${Object.entries(CATEGORIES).map(([key, label]) => `<option value="${key}">${label}</option>`).join("")}
      `;
      category.value = state.category;
      category.addEventListener("change", () => {
        state.category = category.value;
        applyFilters();
      });
    }
    if (location) {
      const locations = [...new Map(PRODUCTS.map((p) => [p.locationCode, p.location])).entries()];
      location.innerHTML = `
        <option value="">全部产地</option>
        ${locations.map(([key, label]) => `<option value="${key}">${label}</option>`).join("")}
      `;
      location.value = state.location;
      location.addEventListener("change", () => {
        state.location = location.value;
        applyFilters();
      });
    }

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.placeholder = "搜索商品、商家或产地…";
      let timer;
      searchInput.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          state.search = searchInput.value;
          applyFilters();
        }, 120);
      });
      searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          state.search = searchInput.value;
          applyFilters();
        }
      });
    }

    const searchButtons = $$(".search-btn");
    searchButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.search = searchInput?.value || "";
        applyFilters();
      });
    });

    const cartFilterToggle = document.getElementById("cartFilterToggle");
    if (cartFilterToggle) {
      cartFilterToggle.removeAttribute("onclick");
      cartFilterToggle.addEventListener("click", () => {
        state.inCartOnly = !state.inCartOnly;
        cartFilterToggle.classList.toggle("active", state.inCartOnly);
        applyFilters();
        showNotification(state.inCartOnly ? "仅显示购物车中的商品。" : "已显示全部商品。", "info");
      });
    }

    $$(".sort-buttons .sort-btn").forEach((button) => {
      const key = button.getAttribute("onclick")?.match(/sortProducts\('([^']+)'/)?.[1];
      if (!key) return;
      button.removeAttribute("onclick");
      button.addEventListener("click", () => {
        if (state.sortKey === key) {
          state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
        } else {
          state.sortKey = key;
          state.sortDirection = "asc";
        }
        $$(".sort-buttons .sort-btn").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        applyFilters();
        const labels = { price: "价格", rating: "评分", distance: "距离", newest: "最新" };
        showNotification(`已按${labels[key] || key}排序（${state.sortDirection === "asc" ? "升序" : "降序"}）。`, "info");
      });
    });

    // 分类卡点击
    const categoryKeys = ["vegetables", "fruits", "grains", "spices", "dairy", "pulses"];
    $$(".category-card").forEach((card, index) => {
      card.removeAttribute("onclick");
      card.addEventListener("click", () => {
        state.category = categoryKeys[index] || "";
        if (category) category.value = state.category;
        applyFilters();
        document.querySelector(".products-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function setupProductEvents() {
    const grid = document.getElementById("productsGrid");
    if (grid && !grid.dataset.cnBound) {
      grid.dataset.cnBound = "true";
      grid.addEventListener("click", (event) => {
        const actionButton = event.target.closest("[data-action]");
        if (actionButton) {
          const { action, id } = actionButton.dataset;
          if (action === "add") addToCart(id);
          if (action === "contact") {
            const product = getProduct(id);
            showNotification(`已记录对“${product?.seller || "商家"}”的联系意向。演示模式不会发送真实消息。`, "info");
          }
          if (action === "detail") openDetail(id);
          return;
        }
        if (event.target.closest(".product-image, .product-title")) {
          const card = event.target.closest(".product-card");
          if (card) openDetail(card.dataset.productId);
        }
      });
      grid.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        if (event.target.closest(".product-image, .product-title")) {
          event.preventDefault();
          const card = event.target.closest(".product-card");
          if (card) openDetail(card.dataset.productId);
        }
      });
    }

    const cartList = document.getElementById("cartItemsList");
    if (cartList && !cartList.dataset.cnBound) {
      cartList.dataset.cnBound = "true";
      cartList.addEventListener("click", (event) => {
        const remove = event.target.closest("[data-cart-remove]");
        const plus = event.target.closest("[data-cart-plus]");
        const minus = event.target.closest("[data-cart-minus]");
        if (remove) removeFromCart(remove.dataset.cartRemove);
        if (plus) updateCartQty(plus.dataset.cartPlus, 1);
        if (minus) updateCartQty(minus.dataset.cartMinus, -1);
      });
    }

    $$(".cart-widget").forEach((widget) => {
      widget.removeAttribute("onclick");
      widget.addEventListener("click", () => toggleCart());
    });

    const closeButton = document.getElementById("closeCartBtn");
    if (closeButton) closeButton.addEventListener("click", closeCart);

    const checkout = document.querySelector(".cart-summary-cta .btn-solid");
    if (checkout) {
      checkout.removeAttribute("onclick");
      checkout.addEventListener("click", () => {
        if (!cartItemCount()) {
          showNotification("购物车为空，无法结算。", "info");
          return;
        }
        showNotification("演示环境不提供支付和物流结算，本页仅验证购物车交互。", "info");
      });
    }

    const viewInCart = document.querySelector(".cart-summary-cta .btn-outline");
    if (viewInCart) {
      viewInCart.removeAttribute("onclick");
      viewInCart.addEventListener("click", () => {
        state.inCartOnly = true;
        document.getElementById("cartFilterToggle")?.classList.add("active");
        applyFilters();
        closeCart();
        document.querySelector(".products-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    $$(".cta-section button").forEach((button, index) => {
      button.removeAttribute("onclick");
      button.addEventListener("click", () => {
        showNotification(
          index === 0
            ? "商品发布为演示入口，未接入真实审核与交易系统。"
            : "供应商搜索为演示入口，本页未接入真实商家数据库。",
          "info"
        );
      });
    });
  }

  function setupMisc() {
    const demoNotice = document.createElement("div");
    demoNotice.className = "cn-demo-notice";
    demoNotice.setAttribute("data-no-i18n", "true");
    demoNotice.innerHTML = `
      <i class="fas fa-circle-info"></i>
      <span><strong>本地演示数据：</strong>商品、商家、价格与库存均为中国大陆样例，不代表实时行情或真实交易。</span>
    `;
    document.querySelector(".header")?.appendChild(demoNotice);

    const closeSearch = document.getElementById("searchPopupClose");
    if (closeSearch) closeSearch.onclick = () => {
      const popup = document.getElementById("searchPopup");
      if (popup) popup.style.display = "none";
    };

    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  }

  function initialize() {
    setupFilters();
    setupProductEvents();
    setupMisc();
    updateStats();
    applyFilters();
  }

  // 兼容原页面可能遗留的全局调用
  window.addToCart = addToCart;
  window.filterProducts = applyFilters;
  window.searchProducts = () => {
    state.search = document.getElementById("searchInput")?.value || "";
    applyFilters();
  };
  window.sortProducts = (key) => {
    state.sortKey = key;
    applyFilters();
  };
  window.toggleCart = toggleCart;
  window.closeCart = closeCart;
  window.loadMoreProducts = () => {};
  window.toggleCartFilter = () => {
    state.inCartOnly = !state.inCartOnly;
    applyFilters();
  };
  window.toggleCartFilterFromPanel = () => {
    state.inCartOnly = true;
    applyFilters();
    closeCart();
  };
  window.showNotification = showNotification;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
