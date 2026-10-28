/**
 * 共享导航栏注入器
 * 用法：页面中放置 <div id="shared-navbar"></div>，并引入本脚本。
 * 作用：拉取 /navbar.html 注入占位容器，再加载 /navbar-home.js 完成交互初始化。
 */
(function () {
  "use strict";
  var VERSION = "20261028a";

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
        // 注入完成即按当前语言对齐文案。
        // 不能依赖 navbar-labels 的轮询：它一旦命中页面内联的旧导航就会停止轮询，
        // 若本次 fetch 慢于首轮轮询（线上 CDN 常见），新导航会停留在 navbar.html 的中文原文。
        if (typeof window.applyNavbarLanguage === "function") {
          window.applyNavbarLanguage();
        }
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
