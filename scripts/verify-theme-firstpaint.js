/**
 * 首帧主题检查：页面在「外部脚本尚未执行」时，html 的 data-theme 是否已确定。
 * 外部资源不加载，只执行 head 内联脚本 —— 这等价于首帧绘制时刻的状态。
 *
 * 用法: node scripts/verify-theme-firstpaint.js [页面...]
 */
"use strict";
const { JSDOM, VirtualConsole } = require("./load-jsdom")();

const BASE = "http://127.0.0.1:5000";
const PAGES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["levelup.html", "faq.html", "index.html"];

async function probe(page, storedTheme) {
  const dom = await JSDOM.fromURL(`${BASE}/${page}`, {
    runScripts: "dangerously",
    // 不设置 resources → 不加载外部 JS，仅执行内联脚本
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(),
    beforeParse(window) {
      // jsdom 未实现 matchMedia，缺省会导致部分页面的主题预置脚本抛错中断
      if (typeof window.matchMedia !== "function") {
        window.matchMedia = function () {
          return {
            matches: false,
            media: "",
            onchange: null,
            addListener: function () {},
            removeListener: function () {},
            addEventListener: function () {},
            removeEventListener: function () {},
            dispatchEvent: function () { return false; },
          };
        };
      }
      try {
        if (storedTheme) window.localStorage.setItem("agritech-theme", storedTheme);
      } catch (e) { /* ignore */ }
    },
  });
  const { window } = dom;
  await new Promise((r) => setTimeout(r, 250));
  const value = window.document.documentElement.getAttribute("data-theme");
  dom.window.close();
  return value;
}

(async () => {
  console.log("=== 首帧主题检查（仅内联脚本）===\n");
  let failed = 0;
  for (const page of PAGES) {
    const cases = [
      { stored: "light", expect: "light" },
      { stored: "dark", expect: "dark" },
      { stored: null, expect: "light" },
    ];
    const results = [];
    for (const c of cases) {
      let got;
      try {
        got = await probe(page, c.stored);
      } catch (e) {
        got = "ERROR:" + e.message;
      }
      const ok = got === c.expect;
      if (!ok) failed += 1;
      results.push(`${c.stored || "未记录"}→${got}${ok ? "" : " ✗(期望" + c.expect + ")"}`);
    }
    console.log(`[${page}] ${results.join("  |  ")}`);
  }
  console.log(`\n=== ${failed === 0 ? "全部通过：首帧主题已确定，无闪烁窗口" : failed + " 项未通过"} ===`);
  process.exit(failed === 0 ? 0 : 1);
})();
