/**
 * 中英文切换与跨页面偏好保持测试。
 */
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : 'http://127.0.0.1:5000';
const port = process.argv.includes('--port') ? Number(process.argv[process.argv.indexOf('--port') + 1]) : 9334;
const output = 'artifacts/e2e/language';
fs.mkdirSync(output, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDP {
  constructor(ws) { this.ws = new WebSocket(ws); this.id = 1; this.pending = new Map(); }
  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      }
    });
    return this;
  }
  send(method, params = {}) {
    const id = this.id++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  close() { this.ws.close(); }
}

const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const cdp = await new CDP(target.webSocketDebuggerUrl).open();
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');
await cdp.send('Network.enable');
await cdp.send('Network.clearBrowserCache');
await cdp.send('Storage.clearDataForOrigin', { origin: base, storageTypes: 'local_storage,session_storage' });
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
const steps = [];
const assert = (name, passed, detail) => {
  steps.push({ name, passed: Boolean(passed), detail });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  if (!passed) throw new Error(`${name} 未通过`);
};

// 1. 默认中文
await cdp.send('Page.navigate', { url: `${base}/index.html?lang=${Date.now()}` });
await waitFor("document.readyState === 'complete' && document.getElementById('cn-language-switch')");
await sleep(1200);
const zhState = await evaluate("({ lang: document.documentElement.lang, title: document.title, nav: document.querySelector('.nav-links a, .left-nav a')?.innerText.trim(), stored: localStorage.getItem('agritech_lang') })");
assert('默认语言为简体中文', zhState.lang === 'zh-CN' && /首页|关于/.test(zhState.nav || ''), zhState);

// 2. 切换英文
await evaluate("document.querySelector('#cn-language-switch [data-cn-language=\"en\"]').click(); true");
await waitFor("document.documentElement.lang === 'en'");
await sleep(1500);
const enState = await evaluate("({ lang: document.documentElement.lang, title: document.title, nav: document.querySelector('.nav-links a, .left-nav a')?.innerText.trim(), stored: localStorage.getItem('agritech_lang') })");
assert('可切换为英文', enState.lang === 'en' && /Home|About/i.test(enState.nav || ''), enState);

// 3. 刷新后保持英文
await cdp.send('Page.reload');
await waitFor("document.readyState === 'complete' && document.getElementById('cn-language-switch')");
await sleep(1000);
const afterReload = await evaluate("({ lang: document.documentElement.lang, stored: localStorage.getItem('agritech_lang') })");
assert('刷新后保持英文偏好', afterReload.lang === 'en' && afterReload.stored === 'en', afterReload);

// 4. 跨页面保持
await cdp.send('Page.navigate', { url: `${base}/marketplace.html?lang=${Date.now()}` });
await waitFor("document.readyState === 'complete' && document.getElementById('cn-language-switch')");
await sleep(800);
const cross = await evaluate("({ lang: document.documentElement.lang, stored: localStorage.getItem('agritech_lang') })");
assert('跨页面保持语言偏好', cross.lang === 'en' && cross.stored === 'en', cross);

// 5. 切回中文
await evaluate("document.querySelector('#cn-language-switch [data-cn-language=\"zh-CN\"]').click(); true");
await waitFor("document.documentElement.lang === 'zh-CN'");
await sleep(500);
const back = await evaluate("({ lang: document.documentElement.lang, stored: localStorage.getItem('agritech_lang'), cookie: document.cookie })");
assert('可切回简体中文', back.lang === 'zh-CN' && back.stored === 'zh-CN', back);

fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify({ steps }, null, 2), 'utf8');
console.log(`\n通过 ${steps.length} 项，结果已保存到 ${output}`);
cdp.close();
await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
