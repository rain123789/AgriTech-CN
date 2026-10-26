/**
 * 动态文本双语审计：扫描 JS 里写入 DOM 的中文字面量，检查是否有英文反查词条。
 * 用法: node scripts/audit-i18n-js.js [--verbose]
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const VERBOSE = new Set(process.argv.slice(2)).has("--verbose");

function extractObject(src, startMarker, endMarkerRe) {
  const i = src.indexOf(startMarker);
  if (!i) if (i < 0) return null;
  const tail = src.slice(i);
  const m = tail.match(endMarkerRe);
  if (!m) return null;
  let body = src.slice(i + startMarker.length - 1, i + m.index + m[0].length);
  body = body.replace(/;\s*$/, "");
  try {
    return vm.runInNewContext("(" + body + ")", {}, { timeout: 5000 });
  } catch (e) {
    return null;
  }
}

const i18nSrc = fs.readFileSync(path.join(ROOT, "scripts/i18n.js"), "utf8");
const TEXT = extractObject(i18nSrc, "const TEXT = {", /\n  \};/) || {};
const REVERSE_EXTRA = extractObject(i18nSrc, "const REVERSE_EXTRA = {", /\n  \};/) || {};
const REVERSE_PAGES = extractObject(i18nSrc, "const REVERSE_PAGES = {", /\n  \};/) || {};

const win = {};
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "scripts/locales/zh-CN-extra.js"), "utf8"), { window: win, Object }, { timeout: 10000 });
const CN_EXTRA = win.CN_EXTRA_TEXT || {};

const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
const hasCJK = (s) => /[\u4e00-\u9fff]/.test(s);

const reverse = new Set();
Object.values(TEXT).forEach((v) => { if (typeof v === "string" && hasCJK(v)) reverse.add(norm(v)); });
Object.values(CN_EXTRA).forEach((v) => { if (typeof v === "string" && hasCJK(v)) reverse.add(norm(v)); });
Object.keys(REVERSE_EXTRA).forEach((k) => reverse.add(norm(k)));
Object.keys(REVERSE_PAGES).forEach((k) => reverse.add(norm(k)));

/* 收集 JS 文件 */
const SKIP_DIRS = new Set(["node_modules", "vendor", "instance", "migrations", "logs", "tests", "examples", "assets", "images", "frontend", "backend", "src", "static", "styles", "domain", "docs", "changes", "completed", ".git", ".workbuddy", "AgriBot_folder", "Community", "Crop Yield Prediction", "Crop_Planning", "Crop_Prices_Tracker", "Fertiliser Recommendation System", "Forum", "Gov_schemes", "Labour_Alerts", "Plant Disease Detection", "Plant Seedlings Classification", "crop_recommendation", "spatial_analytics", "translations", "locals", "javascript", "css", "data"]);
const files = [];
function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full);
    else if (entry.name.endsWith(".js") && !/audit|min\.js|\.min\.|service-worker|sw\.js/.test(entry.name)) files.push(full);
  }
}
walkDir(ROOT);

/* 提取写入 DOM 的字符串 */
const PATTERNS = [
  /\.textContent\s*=\s*(["'`])((?:(?!\1)[^\\]|\\.)*?)\1/g,
  /\.innerText\s*=\s*(["'`])((?:(?!\1)[^\\]|\\.)*?)\1/g,
  /\.innerHTML\s*=\s*(["'`])((?:(?!\1)[^\\]|\\.)*?)\1/g,
  /\.setAttribute\(\s*["'](?:title|aria-label|placeholder|alt)["']\s*,\s*(["'`])((?:(?!\1)[^\\]|\\.)*?)\1/g,
  /showNotification\(\s*(["'`])((?:(?!\1)[^\\]|\\.)*?)\1/g,
  /alert\(\s*(["'`])((?:(?!\1)[^\\]|\\.)*?)\1/g,
];

const results = [];
let totalMissing = 0;
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const missing = new Set();
  for (const re of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src))) {
      let text = m[2];
      // 去掉模板插值后再判断
      text = text.replace(/\$\{[^}]*\}/g, " ");
      // 拆 HTML 片段为纯文本
      const chunks = text.replace(/<[^>]+>/g, "\n").split("\n");
      for (const chunk of chunks) {
        const t = norm(chunk);
        if (!t || !hasCJK(t)) continue;
        if (reverse.has(t)) continue;
        missing.add(t);
      }
    }
  }
  if (missing.size) {
    totalMissing += missing.size;
    results.push({ file: path.relative(ROOT, file), missing: Array.from(missing) });
  }
}

results.sort((a, b) => b.missing.length - a.missing.length);
console.log("=== 动态文本（JS 写入 DOM）双语覆盖审计 ===\n");
console.log(`可反查中文串: ${reverse.size}；扫描 JS 文件: ${files.length}\n`);
for (const r of results) {
  console.log(`\n[${r.file}] 未覆盖 ${r.missing.length} 条`);
  (VERBOSE ? r.missing : r.missing.slice(0, 8)).forEach((m) => console.log("   - " + (m.length > 80 ? m.slice(0, 80) + "…" : m)));
  if (!VERBOSE && r.missing.length > 8) console.log(`   … 其余 ${r.missing.length - 8} 条`);
}
console.log(`\n=== 合计 ${totalMissing} 条，涉及 ${results.length} 个脚本 ===`);
