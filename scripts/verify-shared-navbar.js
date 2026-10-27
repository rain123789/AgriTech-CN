/**
 * 复现/验证：英文模式下，注入的共享导航栏是否跟随语言。
 *
 * 背景：首页同时有内联旧导航（CSS 隐藏）与注入的新导航。
 * 旧脚本只对「第一个出现的 nav.navbar」生效，注入的新导航会被漏掉。
 *
 * 用法: node scripts/verify-shared-navbar.js [--base URL] [页面...]
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("./load-jsdom")();

const argv = process.argv.slice(2);
let BASE = "http://127.0.0.1:5000";
let FETCH_DELAY = 0;
const rest = [];
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === "--base") { BASE = argv[i + 1]; i += 1; }
  else if (argv[i] === "--delay") { FETCH_DELAY = Number(argv[i + 1]) || 0; i += 1; }
  else rest.push(argv[i]);
}
const PAGES = rest.length ? rest : ["index.html", "faq.html", "levelup.html"];

const CJK = /[\u4e00-\u9fff]/;
/** 语言自称不需要翻译 */
const ALLOW = new Set(["简体中文", "中文"]);

async function check(page, lang) {
  const virtualConsole = new VirtualConsole();
  let dom;
  try {
    dom = await JSDOM.fromURL(`${BASE}/${page}`, {
      runScripts: "dangerously",
      resources: "usable",
      pretendToBeVisual: true,
      virtualConsole,
      beforeParse(window) {
        // jsdom 无内置 fetch，注入 Node 的实现，否则 navbar 不会被注入
        if (typeof window.fetch !== "function") {
          window.fetch = (input, init) => {
            const url = typeof input === "string" && input.startsWith("/") ? BASE + input : input;
            // 模拟线上慢响应：让注入晚于 navbar-labels 的首次轮询
            if (!FETCH_DELAY) return globalThis.fetch(url, init);
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                globalThis.fetch(url, init).then(resolve, reject);
              }, FETCH_DELAY);
            });
          };
        }
        window.Headers = globalThis.Headers;
        window.Request = globalThis.Request;
        window.Response = globalThis.Response;
        try {
          window.localStorage.setItem("agritech_lang", lang);
          window.localStorage.setItem("lang", lang === "en" ? "en" : "zh");
          window.localStorage.setItem("agritech-theme", "light");
        } catch (e) { /* ignore */ }
      },
    });
  } catch (e) {
    return { error: "load: " + e.message, injected: false, remains: [] };
  }

  const { window } = dom;
  await new Promise((resolve) => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    window.addEventListener("load", finish, { once: true });
    setTimeout(finish, 10000);
  });
  // 等待 fetch 注入 + 动态脚本加载 + 轮询（窗口需覆盖人为注入的延迟）
  await new Promise((r) => setTimeout(r, 2500 + FETCH_DELAY * 2));

  const doc = window.document;
  const host = doc.getElementById("shared-navbar");
  const nav = host && host.querySelector("nav.navbar");
  const injected = !!nav;

  const remains = [];
  if (nav) {
    // 只采集导航链接与按钮上的文字，忽略图标
    nav.querySelectorAll("a, button, span, li").forEach((el) => {
      const own = Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.nodeValue)
        .join("")
        .replace(/\s+/g, " ")
        .trim();
      if (own && CJK.test(own) && !ALLOW.has(own)) remains.push(own);
    });
  }
  dom.window.close();
  return { injected, remains: Array.from(new Set(remains)) };
}

(async () => {
  console.log(`=== 共享导航栏语言跟随检查（${BASE}）===\n`);
  let failed = 0;
  for (const page of PAGES) {
    for (const lang of ["en", "zh-CN"]) {
      const r = await check(page, lang);
      if (r.error) {
        console.log(`[${page}][${lang}] ⚠ ${r.error}`);
        failed += 1;
        continue;
      }
      if (!r.injected) {
        console.log(`[${page}][${lang}] ⚠ 导航栏未注入（测试环境问题）`);
        failed += 1;
        continue;
      }
      if (lang === "en") {
        if (r.remains.length) {
          failed += 1;
          console.log(`[${page}][en] ✗ 残留中文 ${r.remains.length} 项`);
          r.remains.forEach((t) => console.log("     - " + t));
        } else {
          console.log(`[${page}][en] OK 导航栏已英文化`);
        }
      } else {
        const leaks = r.remains.filter((t) => /^[A-Za-z][A-Za-z\s&/]{12,}$/.test(t));
        console.log(`[${page}][zh] ${leaks.length ? "✗ 疑似英文残留 " + leaks.length + " 项" : "OK 导航栏为中文"}`);
        if (leaks.length) {
          failed += 1;
          leaks.forEach((t) => console.log("     - " + t));
        }
      }
    }
  }
  console.log(`\n=== 结论：${failed === 0 ? "全部通过" : failed + " 项未通过"} ===`);
  process.exit(failed === 0 ? 0 : 1);
})();
