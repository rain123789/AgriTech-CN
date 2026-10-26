/**
 * 共享导航栏注入器
 * 用法：页面中放置 <div id="shared-navbar"></div>，并引入本脚本。
 * 作用：拉取 /navbar.html 注入占位容器，再加载 /navbar-home.js 完成交互初始化。
 */
(function () {
  "use strict";
  var VERSION = "20261026-shared12";

  function boot() {
    var host = document.getElementById("shared-navbar");
    if (!host) return;

    fetch("/navbar.html?v=" + VERSION, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("navbar fetch failed: " + res.status);
        return res.text();
      })
      .then(function (html) {
        host.innerHTML = html;
        // 注入完成立刻按当前全局语言对齐文案：
        // 页面里可能还有一个被隐藏的旧 nav.navbar，标签脚本会先命中它，
        // 若不主动补一次，注入的这套在英文模式下会停留中文。
        try {
          if (typeof window.applyNavbarLanguage === "function") {
            var saved = localStorage.getItem("agritech_lang") || localStorage.getItem("lang") || "zh-CN";
            var lang = window.cnI18n && window.cnI18n.language
              ? window.cnI18n.language
              : (String(saved).toLowerCase().indexOf("en") === 0 ? "en" : "zh-CN");
            window.applyNavbarLanguage(lang);
          }
        } catch (err) {}
        // 动态加载交互脚本（innerHTML 中的 <script> 不会执行，需单独加载）
        if (!document.querySelector('script[data-navbar-home]')) {
          var s = document.createElement("script");
          s.src = "/navbar-home.js?v=" + VERSION;
          s.setAttribute("data-navbar-home", "1");
          document.body.appendChild(s);
        }
      })
      .catch(function (err) {
        if (window.console) console.warn("[navbar] " + err.message);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
