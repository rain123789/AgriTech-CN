/**
 * 导航栏中英文标签管理
 * 说明：共享导航栏与首页导航栏的文字统一由本脚本切换，
 *       避免 i18n 反查表产生 "home / about us" 这类小写或残留中文的问题。
 */
(function () {
  "use strict";

  var BY_FILE = {
    "index.html": ["首页", "Home"],
    "about.html": ["关于我们", "About Us"],
    "blog.html": ["农业资讯", "Blog"],
    "favorites.html": ["我的收藏", "Favorites"],
    "news.html": ["农业资讯", "Ag News"],
    "scheme.html": ["惠农政策", "Schemes"],
    "community_forum.html": ["农户交流社区", "Community Forum"],
    "levelup.html": ["技能提升", "Level Up"],
    "login.html": ["登录", "Login"],
    "faq.html": ["常见问题", "FAQ"],
    "register.html": ["注册", "Register"],
    // 农业服务下拉条目
    "crop/": ["作物种植推荐", "Crop Recommendation"],
    "fertilizer.html": ["科学施肥建议", "Fertilizer Advice"],
    "crop.html": ["作物智能监测", "Smart Crop Monitoring"],
    "supply-chain.html": ["供应链服务", "Supply Chain"],
    "irrigation.html": ["农田灌溉管理", "Irrigation Management"],
    "sustainable-farming.html": ["绿色种植指导", "Sustainable Farming"],
    "marketplace.html": ["农产品交易市场", "Marketplace"],
    "iot_monitoring.html": ["物联网农场监测", "IoT Farm Monitoring"],
    "financial-support.html": ["金融与保险服务", "Finance & Insurance"]
  };

  function fileOf(a) {
    var h = (a.getAttribute("href") || "").split("?")[0].split("#")[0];
    // 目录型链接（如 /crop/）取其目录名，避免匹配到空串
    if (/\/$/.test(h)) {
      var seg = h.split("/").filter(Boolean);
      return seg.length ? seg[seg.length - 1] + "/" : "";
    }
    var parts = h.split("/");
    return parts[parts.length - 1] || "";
  }

  // 只改元素的文字部分，保留前面的图标 <i>
  // 幂等：总是「保留第一个文本节点并改写，删掉其余文本节点」，
  // 避免重复执行时中文与新写入的英文并存（首页 Home 这类问题）。
  function setText(el, text) {
    if (!el) return;
    // 若里面有普通 span（如收藏按钮的 <span>），优先改 span
    var span = el.querySelector("span:not(.theme-toggle-track):not(.theme-toggle-icon):not(.theme-toggle-thumb)");
    var target = span || el;

    var texts = [];
    for (var i = 0; i < target.childNodes.length; i++) {
      if (target.childNodes[i].nodeType === 3) texts.push(target.childNodes[i]);
    }

    if (!texts.length) {
      target.appendChild(document.createTextNode(text));
      return;
    }

    // 第一个非空文本节点承载文案；若全为空白也复用第一个，避免多余节点
    var carrier = texts.filter(function (n) { return n.nodeValue.trim(); })[0] || texts[0];
    if (carrier.nodeValue !== text) carrier.nodeValue = text;
    texts.forEach(function (n) {
      if (n !== carrier && target.contains(n)) target.removeChild(n);
    });
  }

  function currentLang() {
    try {
      if (window.cnI18n && window.cnI18n.language) return window.cnI18n.language;
      // 未加载 i18n 的页面也读取全局语言，保证跨页面一致
      var saved = localStorage.getItem("agritech_lang");
      if (saved === "en" || saved === "zh-CN" || saved === "zh") {
        return saved === "en" ? "en" : "zh-CN";
      }
    } catch (e) {}
    return document.documentElement.getAttribute("data-lang") ||
      document.documentElement.getAttribute("lang") || "zh-CN";
  }

  function apply(lang) {
    var en = lang === "en";
    // 同步 html 的 lang/data-lang，让语言相关样式与后续脚本保持一致
    document.documentElement.setAttribute("lang", en ? "en" : "zh-CN");
    document.documentElement.setAttribute("data-lang", en ? "en" : "zh-CN");
    var navs = document.querySelectorAll("nav.navbar");
    if (!navs.length) return;

    navs.forEach(function (nav) {
      // 品牌名
      var brand = nav.querySelector(".brand-text");
      if (brand) brand.textContent = en ? "AgriTech" : "农智云";

      // 导航链接（按文件名匹配）；跳过品牌 logo，避免把品牌名改成「首页」
      nav.querySelectorAll("a[href]").forEach(function (a) {
        if (a.classList.contains("brand")) return;
        var key = fileOf(a);
        var pair = BY_FILE[key];
        if (!pair) return;
        setText(a, en ? pair[1] : pair[0]);
      });

      // 服务下拉
      var st = nav.querySelector(".services-toggle");
      if (st) setText(st, en ? "Services" : "农业服务");

      // 搜索占位
      var si = nav.querySelector(".search-input");
      if (si) si.placeholder = en ? "Search..." : "搜索...";

      // 语言按钮
      var cl = nav.querySelector("#current-lang-text");
      if (cl) cl.textContent = en ? "English" : "中文";

      // 辅助说明文本（data-no-i18n 下 i18n 不会处理，这里补上）
      nav.querySelectorAll("[aria-label], [title]").forEach(function (el) {
        var zhAria = el.getAttribute("data-zh-aria");
        var enAria = el.getAttribute("data-en-aria");
        if (!zhAria) return;
        el.setAttribute("aria-label", en ? enAria || zhAria : zhAria);
        if (el.hasAttribute("title") && el.getAttribute("data-has-title")) {
          el.setAttribute("title", en ? enAria || zhAria : zhAria);
        }
      });
    });
  }

  window.applyNavbarLanguage = apply;

  // 监听 i18n 的语言切换事件（i18n 会先翻译页面，再派发事件，这里后执行覆盖导航栏）
  window.addEventListener("languageChanged", function (e) {
    apply((e && e.detail && e.detail.lang) || currentLang());
  });

  function boot() {
    // 导航栏可能是异步注入的；页面里还可能存在被隐藏的旧 nav，
    // 因此不能「找到第一个 nav.navbar 就停」，否则注入的共享导航会漏处理。
    // apply 本身幂等，这里持续对齐一段时间，覆盖注入与延迟渲染。
    var tries = 0;
    var timer = setInterval(function () {
      apply(currentLang());
      if (++tries > 40) clearInterval(timer);
    }, 150);

    // 注入完成后立即再对齐一次
    if (typeof MutationObserver === "function") {
      var mo = new MutationObserver(function () {
        if (document.querySelector("#shared-navbar nav.navbar, nav.navbar")) apply(currentLang());
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(function () { mo.disconnect(); }, 8000);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
