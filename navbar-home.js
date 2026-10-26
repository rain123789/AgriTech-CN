/**
 * 共享导航栏交互（语言切换 + 搜索）
 * 说明：主题切换由各页面已有的 initThemeToggle() 处理；
 *       服务下拉使用 CSS hover，不在此重复绑定，避免双重切换。
 */
(function () {
  "use strict";

  // 简单的页面关键词映射（与首页搜索保持一致）
  var PAGE_MAP = {
    "首页": "index.html", home: "index.html",
    "关于": "about.html", "关于我们": "about.html", about: "about.html",
    "资讯": "blog.html", "农业资讯": "blog.html", blog: "blog.html",
    "收藏": "favorites.html", favorites: "favorites.html",
    "政策": "scheme.html", "惠农政策": "scheme.html", schemes: "scheme.html",
    "社区": "community_forum.html", "交流": "community_forum.html", community: "community_forum.html",
    "技能": "levelup.html", "提升": "levelup.html", level: "levelup.html",
    "证书": "certificate.html", certificate: "certificate.html",
    "作物": "crop.html", crop: "crop.html",
    "施肥": "fertilizer.html", fertilizer: "fertilizer.html",
    "病害": "disease.html", disease: "disease.html",
    "市场": "marketplace.html", marketplace: "marketplace.html",
    "供应链": "supply-chain.html", supply: "supply-chain.html",
    "灌溉": "irrigation.html", irrigation: "irrigation.html",
    "可持续": "sustainable-farming.html", sustainable: "sustainable-farming.html",
    "金融": "financial-support.html", finance: "financial-support.html",
    "登录": "login.html", login: "login.html",
    "注册": "register.html", register: "register.html",
    "问答": "faq.html", faq: "faq.html",
    "反馈": "feed-back.html", feedback: "feed-back.html",
    "助手": "chat.html", chat: "chat.html"
  };

  function initLang(navbar) {
    var container = navbar.querySelector(".lang-container");
    var trigger = navbar.querySelector(".lang-trigger");
    if (!container || !trigger) return;
    if (trigger.dataset.navBound) return;
    trigger.dataset.navBound = "1";

    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      container.classList.toggle("active");
    });

    // 事件委托：即使 i18n 重新生成下拉选项（.cn-localized-option），点击也能生效
    container.addEventListener("click", function (e) {
      var opt = e.target.closest(".lang-option, [data-cn-lang], [data-lang]");
      if (!opt || !container.contains(opt)) return;
      if (opt.classList.contains("lang-trigger")) return;
      var lang = opt.getAttribute("data-cn-lang") || opt.getAttribute("data-lang");
      if (!lang) return;

      e.preventDefault();
      e.stopPropagation();
      container.classList.remove("active");

      var target = lang === "en" ? "en" : "zh-CN";
      var called = false;

      // 优先调用 i18n 暴露的切换 API
      try {
        if (window.cnI18n && typeof window.cnI18n.setLanguage === "function") {
          window.cnI18n.setLanguage(lang);
          called = true;
        } else if (typeof window.setLanguage === "function") {
          window.setLanguage(lang);
          called = true;
        }
      } catch (err) {
        if (window.console) console.warn("[navbar] setLanguage failed:", err);
      }

      // 兜底：无论如何先保证语言状态、持久化与导航栏文案切换
      document.documentElement.setAttribute("data-lang", target);
      document.documentElement.setAttribute("lang", target);
      try { localStorage.setItem("agritech_lang", target); } catch (err) {}
      if (window.applyNavbarLanguage) window.applyNavbarLanguage(target);

      // i18n 调用失败时，刷新整页以按新语言重新初始化
      if (!called) window.location.reload();
    });
  }

  function initSearch(navbar) {
    var input = navbar.querySelector(".search-input");
    var btn = navbar.querySelector(".search-button");
    var box = navbar.querySelector(".search-container");
    if (!input || !box) return;
    if (input.dataset.navBound) return;
    input.dataset.navBound = "1";

    // 建议列表
    var list = document.createElement("div");
    list.className = "nav-search-suggest";
    list.style.cssText =
      "position:absolute;top:calc(100% + 6px);left:0;right:0;min-width:220px;background:var(--nav-surface);" +
      "border:1px solid var(--nav-border);border-radius:10px;box-shadow:0 14px 34px rgba(0,0,0,.18);" +
      "padding:.3rem;z-index:1002;display:none;max-height:280px;overflow:auto;";
    box.appendChild(list);

    function matches(q) {
      q = (q || "").trim().toLowerCase();
      if (!q) return [];
      var out = [];
      Object.keys(PAGE_MAP).forEach(function (k) {
        if (k.toLowerCase().indexOf(q) !== -1) out.push({ key: k, url: PAGE_MAP[k] });
      });
      // 去重
      var seen = {};
      return out.filter(function (it) {
        if (seen[it.url]) return false;
        seen[it.url] = 1;
        return true;
      }).slice(0, 6);
    }

    function render() {
      var q = input.value;
      var res = matches(q);
      if (!res.length) {
        list.style.display = "none";
        list.innerHTML = "";
        return;
      }
      list.innerHTML = res
        .map(function (it) {
          return '<div class="nav-search-item" data-url="' + it.url + '" style="padding:.45rem .6rem;border-radius:8px;cursor:pointer;font-size:.85rem;color:var(--nav-text);">' +
            '<i class="fas fa-search" style="opacity:.5;margin-right:6px;"></i>' + it.key +
            "</div>";
        })
        .join("");
      list.style.display = "block";
    }

    function go() {
      var res = matches(input.value);
      if (res.length) {
        window.location.href = res[0].url;
      }
    }

    input.addEventListener("input", render);
    input.addEventListener("focus", render);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        go();
      }
      if (e.key === "Escape") {
        list.style.display = "none";
      }
    });
    if (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        go();
      });
    }
    list.addEventListener("click", function (e) {
      var item = e.target.closest(".nav-search-item");
      if (item && item.getAttribute("data-url")) {
        window.location.href = item.getAttribute("data-url");
      }
    });
    document.addEventListener("click", function (e) {
      if (!box.contains(e.target)) list.style.display = "none";
    });
  }

  function initTheme(navbar) {
    var toggle = navbar.querySelector(".theme-toggle");
    if (!toggle) return;

    // 读取全局主题偏好（与 theme.js 共用，跨页面保持一致）
    try {
      var saved = localStorage.getItem("agritech-theme");
      if (saved === "dark" || saved === "light") {
        document.documentElement.setAttribute("data-theme", saved);
      }
    } catch (e) {}

    // theme.js 已绑定（enhancedToggle）或本脚本已绑定过，则跳过，避免双重绑定
    if (toggle.dataset.enhancedToggle || toggle.dataset.navThemeBound) return;

    // 共享导航栏通常是异步注入的，theme.js 的 DOMContentLoaded 绑定会错过它，
    // 这里补绑，并打上标记，防止 theme.js 之后重复绑定。
    toggle.dataset.navThemeBound = "1";
    toggle.dataset.enhancedToggle = "true";

    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      if (window.themeManager && typeof window.themeManager.toggleTheme === "function") {
        window.themeManager.toggleTheme();
        return;
      }
      var root = document.documentElement;
      var current = root.getAttribute("data-theme") || "light";
      var next = current === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try {
        // 全局共享：切某页后其他页面也保持同一主题
        localStorage.setItem("agritech-theme", next);
      } catch (err) {}
    });
  }

  function init(navbar) {
    if (!navbar || navbar.dataset.navInited) return;
    navbar.dataset.navInited = "1";
    initLang(navbar);
    initSearch(navbar);
    initTheme(navbar);
  }

  function boot() {
    // 确保导航栏中英文标签脚本已加载（共享导航栏页面统一由它管理文案）
    if (!window.applyNavbarLanguage && !document.querySelector('script[data-navbar-labels]')) {
      var ls = document.createElement("script");
      ls.src = "/navbar-labels.js?v=20261026c";
      ls.setAttribute("data-navbar-labels", "1");
      document.head.appendChild(ls);
    }

    // 导航栏通过 includeHTML 异步注入，轮询等待其出现
    var tries = 0;
    var timer = setInterval(function () {
      var navbar = document.querySelector("nav.navbar");
      if (navbar) {
        clearInterval(timer);
        init(navbar);
      } else if (++tries > 60) {
        clearInterval(timer);
      }
    }, 100);

    // 关闭语言下拉（点击空白处）
    document.addEventListener("click", function (e) {
      document.querySelectorAll(".navbar .lang-container.active").forEach(function (c) {
        if (!c.contains(e.target)) c.classList.remove("active");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
