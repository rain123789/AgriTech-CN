/**
 * 主要导航页面烟测：HTTP 可达、默认中文、无明显脚本异常、横向溢出。
 * 同时统计仍可见的英文文本，作为中文化覆盖扫描。
 */
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : 'http://127.0.0.1:5000';
const port = process.argv.includes('--port') ? Number(process.argv[process.argv.indexOf('--port') + 1]) : 9334;
const pages = [
  'index.html', 'about.html', 'blog.html', 'favorites.html', 'news.html', 'scheme.html',
  'community_forum.html', 'levelup.html', 'crop.html', 'supply-chain.html', 'irrigation.html',
  'sustainable-farming.html', 'marketplace.html', 'iot_monitoring.html', 'financial-support.html',
  'login.html', 'faq.html', 'register.html', 'terms-and-service.html', 'feed-back.html',
  'chat.html', 'cookie-policy.html', 'livestock.html', 'privacy-policy.html', 'disease.html',
  'fertilizer.html', 'weather_dashboard.html', 'contact.html'
];
const output = 'artifacts/smoke';
fs.mkdirSync(output, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class CDP {
  constructor(ws) { this.ws = new WebSocket(ws); this.id = 1; this.pending = new Map(); this.listeners = new Map(); }
  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id) {
        const job = this.pending.get(msg.id); if (!job) return;
        this.pending.delete(msg.id);
        msg.error ? job.reject(new Error(msg.error.message)) : job.resolve(msg.result);
      } else for (const handler of this.listeners.get(msg.method) || []) handler(msg.params);
    });
    return this;
  }
  send(method, params = {}) {
    const id = this.id++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  on(method, handler) { const list = this.listeners.get(method) || []; list.push(handler); this.listeners.set(method, list); }
  close() { this.ws.close(); }
}

const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const cdp = await new CDP(target.webSocketDebuggerUrl).open();
let currentErrors = [];
cdp.on('Runtime.exceptionThrown', (event) => currentErrors.push(event.exceptionDetails?.exception?.description || event.exceptionDetails?.text || 'JS 异常'));
cdp.on('Runtime.consoleAPICalled', (event) => {
  if (event.type === 'error') currentErrors.push(event.args.map((arg) => arg.value || arg.description || '').join(' '));
});
cdp.on('Network.loadingFailed', (event) => {
  if (!event.canceled && event.type !== 'Font') currentErrors.push(`NETWORK ${event.errorText} ${event.type}`);
});
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');
await cdp.send('Network.enable');
await cdp.send('Network.clearBrowserCache');
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

const evaluate = async (expression) => {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const waitFor = async (expression, timeout = 12000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { if (await evaluate(expression)) return true; } catch (_) {}
    await sleep(180);
  }
  return false;
};

const results = [];
for (const page of pages) {
  currentErrors = [];
  const url = `${base}/${page}?smoke=${Date.now()}`;
  try {
    await cdp.send('Page.navigate', { url });
    await waitFor("document.readyState === 'complete'");
    await sleep(3000);
    const info = await evaluate(`(() => {
      const technical = /^(AI|API|NPK|pH|FAQ|PDF|CNY|GPS|IoT|JSON|CSV|HTTP|HTTPS|AgriTech|DAP|MOP|SSP|N|P|K|N-P-K)$/i;
      const candidates = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const value = node.nodeValue.replace(/\\s+/g, ' ').trim();
        const parent = node.parentElement;
        if (!value || value.length < 3 || !/[A-Za-z]/.test(value) || /[\\u4e00-\\u9fff]/.test(value)) continue;
        if (!parent || ['SCRIPT','STYLE','NOSCRIPT','CODE','PRE'].includes(parent.tagName)) continue;
        if (technical.test(value) || /^[\\d\\s.,:%+\\-–—℃°\\/]+$/.test(value)) continue;
        if (parent.closest('[data-no-i18n]')) continue;
        const style = getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        if (!parent.getClientRects().length) continue;
        candidates.push(value.slice(0, 120));
      }
      return {
        title: document.title,
        lang: document.documentElement.lang,
        h1: document.querySelector('h1')?.innerText?.trim() || '',
        bodyHeight: document.body.scrollHeight,
        overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
        englishSamples: [...new Set(candidates)].slice(0, 12),
        englishCount: new Set(candidates).size,
      };
    })()`);
    results.push({ page, ok: true, ...info, errors: [...new Set(currentErrors)].slice(0, 10) });
    console.log(`${currentErrors.length ? 'WARN' : 'PASS'} ${page} | ${info.lang} | ${info.title} | EN=${info.englishCount} | overflow=${info.overflow} | errors=${[...new Set(currentErrors)].length}`);
  } catch (error) {
    results.push({ page, ok: false, error: String(error), errors: [...new Set(currentErrors)].slice(0, 10) });
    console.log(`FAIL ${page} | ${error}`);
  }
}

fs.writeFileSync(path.join(output, 'smoke-result.json'), JSON.stringify(results, null, 2), 'utf8');
const failed = results.filter((item) => !item.ok || item.englishCount > 20 || item.overflow);
console.log(`\n页面 ${results.length} 个，异常/待优化 ${failed.length} 个。详细结果：${output}/smoke-result.json`);
cdp.close();
await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
