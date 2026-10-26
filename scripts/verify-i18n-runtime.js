/**
 * 运行时双语验证（真实服务 + 真实脚本执行）
 * 用法: node scripts/verify-i18n-runtime.js [--base http://127.0.0.1:5000] [页面...]
 */
"use strict";
const fs = require("fs");
const path = require("path");
const loadJsdom = require("./load-jsdom");
const jsdom = loadJsdom();
const JSDOM = jsdom.JSDOM;
const VirtualConsole = jsdom.VirtualConsole;

const argv = process.argv.slice(2);
let BASE = "http://127.0.0.1:5000";
const rest = [];
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === "--base") { BASE = argv[i + 1]; i += 1; }
  else rest.push(argv[i]);
}

const DEFAULT_PAGES = [
  "index.html", "about.html", "blog.html", "favorites.html", "scheme.html", "community_forum.html", "levelup.html",
  "faq.html", "login.html", "register.html", "disease.html", "fertilizer.html", "marketplace.html", "chat.html",
  "contact.html", "terms-and-service.html", "privacy-policy.html", "cookie-policy.html", "news.html",
  "farmer.html", "buyer.html", "admin.html", "equipment.html", "equipments.html", "expert.html", "feed-back.html",
  "financial-support.html", "grocery.html", "mission.html", "smart_loan.html", "warehouse_control.html",
  "weather_dashboard.html", "crop.html", "certificate.html", "supply-chain.html", "irrigation.html",
  "sustainable-farming.html", "iot_monitoring.html", "livestock.html", "organic.html", "career.html",
  "sitemap.html", "transparency_portal.html", "carbon_portal.html", "climate_dashboard.html", "crop_advisory.html",
  "crop_rotation.html", "eco_toolbox.html", "farm_dashboard.html", "fleet_manager.html", "insurance_portal.html",
  "labor_portal.html", "loan_dashboard.html", "logistics_hub.html", "notifications.html", "pest_suite.html",
  "plantation.html", "processing_hub.html", "procurement_hub.html", "soil_portal.html", "spatial.html",
  "trace.html", "verify-produce.html", "barter_exchange.html", "knowledge_hub.html", "shopkeeper.html",
  "roadmap.html", "ai_disease.html", "audit_dashboard.html", "cropCalendar.html", "crisis_dashboard.html",
];
const PAGES = rest.length ? rest : DEFAULT_PAGES;

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE"]);
const TIMEOUT = 7000;

async function check(page) {
  const url = `${BASE}/${page}`;
  const virtualConsole = new VirtualConsole();
  let dom;
  try {
    dom = await JSDOM.fromURL(url, {
      runScripts: "dangerously",
      resources: "usable",
      pretendToBeVisual: true,
      virtualConsole,
      beforeParse(window) {
        try {
          window.localStorage.setItem("agritech_lang", "en");
          window.localStorage.setItem("lang", "en");
          window.localStorage.setItem("agritech-theme", "light");
        } catch (e) { /* ignore */ }
      },
    });
  } catch (e) {
    return { page, error: "load: " + e.message, remains: [] };
  }

  const { window } = dom;
  await new Promise((resolve) => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    window.addEventListener("load", finish, { once: true });
    setTimeout(finish, TIMEOUT);
  });
  // 等待异步注入（共享导航栏等）
  await new Promise((r) => setTimeout(r, 900));

  try {
    if (window.cnI18n) window.cnI18n.setLanguage("en");
  } catch (e) { /* ignore */ }
  await new Promise((r) => setTimeout(r, 300));

  const doc = window.document;
  const remains = [];
  const walker = doc.createTreeWalker(doc.body, 4);
  let node;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!parent) continue;
    if (SKIP_TAGS.has(parent.tagName)) continue;
    if (parent.closest("[data-no-i18n]")) continue;
    if (parent.closest("#cn-language-switch")) continue;
    const text = (node.nodeValue || "").replace(/\s+/g, " ").trim();
    if (!text || !/[\u4e00-\u9fff]/.test(text)) continue;
    // 整句已是英文、仅含个别中文专名（如“中文 / EN”标签）视为正常
    const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const latin = (text.match(/[A-Za-z]/g) || []).length;
    if (cjk <= 4 && latin > cjk * 3) continue;
    remains.push(text);
  }
  dom.window.close();
  return { page, remains: Array.from(new Set(remains)) };
}

(async () => {
  const lines = [];
  const log = (s) => { lines.push(s); console.log(s); };
  log(`=== 运行时验证：切到英文后残留中文（${BASE}）===\n`);
  let bad = 0;
  let failed = 0;
  for (const page of PAGES) {
    let r;
    try {
      r = await Promise.race([
        check(page),
        new Promise((resolve) => setTimeout(() => resolve({ page, error: "hard timeout", remains: [] }), 20000)),
      ]);
    } catch (e) {
      r = { page, error: "crash: " + e.message, remains: [] };
    }
    const out = path.join(__dirname, "..", ".workbuddy", "i18n-runtime-report.txt");
    if (r.error) {
      log(`[${page}] ⚠ ${r.error}`);
      failed += 1;
      fs.writeFileSync(out, lines.join("\n"), "utf8");
      continue;
    }
    if (!r.remains.length) {
      log(`[${page}] OK`);
      fs.writeFileSync(out, lines.join("\n"), "utf8");
      continue;
    }
    bad += r.remains.length;
    log(`[${page}] 残留 ${r.remains.length} 条`);
    r.remains.forEach((t) => log("   - " + (t.length > 90 ? t.slice(0, 90) + "…" : t)));
    fs.writeFileSync(out, lines.join("\n"), "utf8");
  }
  log(`\n=== 合计残留 ${bad} 条，加载失败 ${failed} 个页面 ===`);
})();

process.on("uncaughtException", (e) => {
  console.error("uncaught:", e.message);
});
process.on("unhandledRejection", (e) => {
  console.error("unhandled:", e && e.message);
});
