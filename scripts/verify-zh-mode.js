/**
 * 中文模式回归检查：确认切到中文后，页面没有大段英文残留（原文英文除外）。
 * 用法: node scripts/verify-zh-mode.js [页面...]
 */
"use strict";
const fs = require("fs");
const path = require("path");
const loadJsdom = require("./load-jsdom");
const jsdom = loadJsdom();
const JSDOM = jsdom.JSDOM;
const VirtualConsole = jsdom.VirtualConsole;

const BASE = "http://127.0.0.1:5000";
const PAGES = process.argv.slice(2).length ? process.argv.slice(2) : ["index.html", "faq.html", "marketplace.html", "disease.html"];

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE"]);

(async () => {
  for (const page of PAGES) {
    const dom = await JSDOM.fromURL(`${BASE}/${page}`, {
      runScripts: "dangerously",
      resources: "usable",
      pretendToBeVisual: true,
      virtualConsole: new VirtualConsole(),
      beforeParse(window) {
        try {
          window.localStorage.setItem("agritech_lang", "zh-CN");
          window.localStorage.setItem("lang", "zh");
        } catch (e) { /* ignore */ }
      },
    });
    const { window } = dom;
    await new Promise((r) => {
      let d = false;
      const f = () => { if (!d) { d = true; r(); } };
      window.addEventListener("load", f, { once: true });
      setTimeout(f, 8000);
    });
    await new Promise((r) => setTimeout(r, 900));
    try { if (window.cnI18n) window.cnI18n.setLanguage("zh-CN"); } catch (e) { /* ignore */ }
    await new Promise((r) => setTimeout(r, 300));

    const doc = window.document;
    const leaks = [];
    const walker = doc.createTreeWalker(doc.body, 4);
    let node;
    while ((node = walker.nextNode())) {
      const p = node.parentElement;
      if (!p || SKIP_TAGS.has(p.tagName)) continue;
      if (p.closest("[data-no-i18n]")) continue;
      const t = (node.nodeValue || "").replace(/\s+/g, " ").trim();
      if (!t) continue;
      const cjk = (t.match(/[\u4e00-\u9fff]/g) || []).length;
      const latin = (t.match(/[A-Za-z]/g) || []).length;
      // 纯英文且长度较长、无中文 → 视为疑似未汉化
      if (cjk === 0 && latin > 24) leaks.push(t);
    }
    const nav = doc.querySelector("#shared-navbar");
    const navTexts = nav ? Array.from(nav.querySelectorAll("a, button"))
      .map((e) => (e.textContent || "").replace(/\s+/g, " ").trim())
      .filter(Boolean) : [];
    const navZh = navTexts.filter((t) => /[\u4e00-\u9fff]/.test(t)).length;
    console.log(`[${page}] 长英文片段 ${leaks.length} 条；导航栏中文字样 ${navZh}/${navTexts.length}`);
    leaks.slice(0, 5).forEach((t) => console.log("   - " + (t.length > 70 ? t.slice(0, 70) + "…" : t)));
    dom.window.close();
  }
})();
