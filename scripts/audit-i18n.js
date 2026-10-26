/**
 * 全站中英双语覆盖审计
 * 用法: node scripts/audit-i18n.js [--verbose]
 *
 * 逻辑：
 *  1. 抽出 i18n.js 的 TEXT / REVERSE_EXTRA / ATTR_TEXT
 *  2. 抽出 zh-CN-extra.js 的 CN_EXTRA_TEXT
 *  3. 抽出 translations.js 的 window.translations.en
 *  4. 合成中文模式可翻译集合（TEXT 值 + CN_EXTRA 值）与英文模式反查集合 REVERSE
 *  5. 扫描每个 HTML 页面可见文本节点（去 script/style），找出既无中文译法、也无英文反查的中文串
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const args = new Set(process.argv.slice(2));
const VERBOSE = args.has("--verbose");

function read(p) {
  return fs.readFileSync(path.join(ROOT, p), "utf8");
}
function exists(p) {
  return fs.existsSync(path.join(ROOT, p));
}

/* ---------- 1. 解析 JS 里的对象字面量 ---------- */
function extractObject(src, startMarker, endMarkerRe) {
  const i = src.indexOf(startMarker);
  if (i < 0) return null;
  const tail = src.slice(i);
  const m = tail.match(endMarkerRe);
  if (!m) return null;
  const j = i + m.index;
  let body = src.slice(i + startMarker.length - 1, j + m[0].length); // 含 { 到 }
  body = body.replace(/;\s*$/, ""); // 去掉结尾分号，避免 ({...};) 语法错误
  try {
    return vm.runInNewContext("(" + body + ")", {}, { timeout: 5000 });
  } catch (e) {
    console.error("解析失败:", startMarker, e.message);
    return null;
  }
}

const i18nSrc = read("scripts/i18n.js");
const TEXT = extractObject(i18nSrc, "const TEXT = {", /\n  \};/) || {};
const REVERSE_EXTRA = extractObject(i18nSrc, "const REVERSE_EXTRA = {", /\n  \};/) || {};
const REVERSE_PAGES = extractObject(i18nSrc, "const REVERSE_PAGES = {", /\n  \};/) || {};
// ATTR_TEXT 在 REVERSE_EXTRA 之后
const attrIdx = i18nSrc.indexOf("const ATTR_TEXT = {");
const ATTR_TEXT = attrIdx >= 0 ? extractObject(i18nSrc.slice(attrIdx), "const ATTR_TEXT = {", /\n  \};/) || {} : {};

// 扩展词典 / 词条包：按浏览器方式执行，避免解析多个 Object.assign 块
const win = {};
vm.runInNewContext(read("scripts/locales/zh-CN-extra.js"), { window: win, Object }, { timeout: 10000 });
const CN_EXTRA = win.CN_EXTRA_TEXT || {};

const sandbox = { window: {} };
vm.runInNewContext(transSrcRaw(), sandbox, { timeout: 10000 });
function transSrcRaw() {
  return read("translations.js");
}
const EN_PACK = (sandbox.window.translations && sandbox.window.translations.en) || {};

/* ---------- 2. 合成集合 ---------- */
const hasCJK = (s) => /[\u4e00-\u9fff]/.test(s);

const zhSet = new Set(); // 中文模式：可把英文 key 译成中文（判断英文页是否汉化）
Object.entries(TEXT).forEach(([k, v]) => {
  if (typeof v === "string" && hasCJK(v)) zhSet.add(v.replace(/\s+/g, " ").trim());
});
Object.entries(CN_EXTRA).forEach(([k, v]) => {
  if (typeof v === "string" && hasCJK(v)) zhSet.add(v.replace(/\s+/g, " ").trim());
});

const reverse = new Set(); // 英文模式：可把中文反查成英文
Object.entries(TEXT).forEach(([k, v]) => {
  if (typeof v === "string" && hasCJK(v)) reverse.add(v.replace(/\s+/g, " ").trim());
});
zhSet.forEach((v) => reverse.add(v));
Object.keys(REVERSE_EXTRA).forEach((k) => reverse.add(k.replace(/\s+/g, " ").trim()));
Object.keys(REVERSE_PAGES).forEach((k) => reverse.add(k.replace(/\s+/g, " ").trim()));

// 语言自称（简体中文 / 中文）按惯例保留原文，不算漏翻
const WHITELIST = new Set(["简体中文", "中文", "English"]);

/* ---------- 3. 扫描 HTML 可见文本 ---------- */
function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, "\n");
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

const PAGES = fs
  .readdirSync(ROOT)
  .filter((f) => f.endsWith(".html"))
  .filter((f) => !/backup|test-|ThemeSelector|blog-backup/i.test(f));

const report = [];
for (const page of PAGES) {
  const raw = read(page);
  const bodyMatch = raw.match(/<body[\s\S]*<\/body>/i);
  const body = bodyMatch ? bodyMatch[0] : raw;
  const text = decodeEntities(stripHtml(body));
  const lines = text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l && hasCJK(l));

  const seen = new Set();
  const missing = [];
  for (const l of lines) {
    if (seen.has(l)) continue;
    seen.add(l);
    if (reverse.has(l) || WHITELIST.has(l)) continue;
    // 允许包含关系：长句里嵌入了已知短语时，仍算未覆盖（因为整句需要独立词条）
    missing.push(l);
  }
  if (missing.length) report.push({ page, missing });
}

report.sort((a, b) => b.missing.length - a.missing.length);

if (args.has("--json")) {
  const out = path.join(ROOT, ".workbuddy", "i18n-missing.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const flat = {};
  report.forEach((r) => r.missing.forEach((m) => (flat[m] = "")));
  fs.writeFileSync(out, JSON.stringify({ pages: report, flat }, null, 2), "utf8");
  console.log("已写出:", out, "共", Object.keys(flat).length, "条");
  process.exit(0);
}

let total = 0;
console.log("=== 中英双语覆盖审计（英文模式残留中文风险）===\n");
console.log(`词条库: TEXT=${Object.keys(TEXT).length}  CN_EXTRA=${Object.keys(CN_EXTRA).length}  EN_PACK=${Object.keys(EN_PACK).length}  REVERSE_EXTRA=${Object.keys(REVERSE_EXTRA).length}`);
console.log(`可反查中文串: ${reverse.size}\n`);

for (const r of report) {
  total += r.missing.length;
  console.log(`\n[${r.page}] 未覆盖 ${r.missing.length} 条`);
  const show = VERBOSE ? r.missing : r.missing.slice(0, 12);
  show.forEach((m) => console.log("   - " + (m.length > 90 ? m.slice(0, 90) + "…" : m)));
  if (!VERBOSE && r.missing.length > 12) console.log(`   … 其余 ${r.missing.length - 12} 条`);
}
console.log(`\n=== 合计未覆盖 ${total} 条，涉及 ${report.length} 个页面 ===`);
