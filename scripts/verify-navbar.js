/**
 * 导航栏双语静态验证：直接加载 navbar.html + navbar-labels.js，
 * 调用 apply("en") 后统计 nav 内残留中文。
 * 用法: node scripts/verify-navbar.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("./load-jsdom")();

const ROOT = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "navbar.html"), "utf8");
const dom = new JSDOM(html, { runScripts: "outside-only", url: "http://localhost/" });
const { window } = dom;

window.localStorage.setItem("agritech_lang", "en");
window.eval(fs.readFileSync(path.join(ROOT, "navbar-labels.js"), "utf8"));

if (typeof window.applyNavbarLanguage !== "function") {
  console.error("applyNavbarLanguage 未注册");
  process.exit(1);
}
window.applyNavbarLanguage("en");

const nav = window.document.querySelector("nav.navbar");
const remains = [];

// 文本节点
const walker = window.document.createTreeWalker(nav, 4);
let node;
while ((node = walker.nextNode())) {
  const t = (node.nodeValue || "").replace(/\s+/g, " ").trim();
  if (t && /[\u4e00-\u9fff]/.test(t)) remains.push("文本: " + t);
}

// 属性
nav.querySelectorAll("[aria-label], [title], [placeholder], [alt]").forEach((el) => {
  ["aria-label", "title", "placeholder", "alt"].forEach((attr) => {
    if (!el.hasAttribute(attr)) return;
    const v = el.getAttribute(attr);
    if (v && /[\u4e00-\u9fff]/.test(v)) remains.push(`${attr}: ${v}`);
  });
});

// 语言自称允许保留
const ALLOW = /^(简体中文|中文)$/;
const filtered = remains.filter((r) => !ALLOW.test(r.split(": ")[1] || ""));

console.log("=== 导航栏英文模式残留检查 ===\n");
if (!filtered.length) {
  console.log("OK：导航栏无残留中文");
} else {
  console.log(`残留 ${filtered.length} 项：`);
  filtered.forEach((r) => console.log("   - " + r));
}
process.exit(filtered.length ? 1 : 0);
