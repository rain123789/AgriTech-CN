/**
 * 作物推荐与科学施肥真实浏览器测试。
 */
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : 'http://127.0.0.1:5000';
const port = process.argv.includes('--port') ? Number(process.argv[process.argv.indexOf('--port') + 1]) : 9334;
const output = 'artifacts/e2e/tools';
const screenshots = path.join(output, 'screenshots');
fs.mkdirSync(screenshots, { recursive: true });
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
const errors = [];
cdp.on('Runtime.exceptionThrown', (event) => errors.push(event.exceptionDetails?.exception?.description || event.exceptionDetails?.text));
cdp.on('Runtime.consoleAPICalled', (event) => {
  if (event.type === 'error') errors.push(event.args.map((arg) => arg.value || arg.description || '').join(' '));
});
cdp.on('Network.loadingFailed', (event) => {
  if (!event.canceled && event.type !== 'Font') errors.push(`NETWORK ${event.errorText} ${event.type}`);
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
const waitFor = async (expression, timeout = 15000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { if (await evaluate(expression)) return true; } catch (_) {}
    await sleep(160);
  }
  return false;
};
const shot = async (name) => {
  const result = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(path.join(screenshots, `${name}.png`), Buffer.from(result.data, 'base64'));
};
const steps = [];
const assert = (name, passed, detail) => {
  steps.push({ name, passed: Boolean(passed), detail });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  if (!passed) throw new Error(`${name} 未通过`);
};

// 作物推荐
await cdp.send('Page.navigate', { url: `${base}/crop/?e2e=${Date.now()}` });
await waitFor("document.readyState === 'complete' && document.getElementById('cropForm')");
const cropPage = await evaluate("({ title: document.title, lang: document.documentElement.lang, h1: document.querySelector('h1')?.innerText, button: document.querySelector('.btn-primary')?.innerText, scope: document.body.innerText.includes('尚未用中国田间数据验证') })");
assert('作物推荐页中文与说明完整', cropPage.lang === 'zh-CN' && /作物/.test(cropPage.h1) && cropPage.scope, cropPage);
await shot('01-crop-form');
await evaluate(`(() => {
  const values = { nitrogen: 90, phosphorus: 42, potassium: 43, temperature: 20.8, humidity: 82, ph: 6.5, rainfall: 202 };
  for (const [id, value] of Object.entries(values)) {
    const el = document.getElementById(id);
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  document.getElementById('cropForm').requestSubmit();
  return true;
})()`);
const cropDone = await waitFor("document.readyState === 'complete' && /推荐作物/.test(document.body.innerText)", 15000);
const cropResult = await evaluate("({ url: location.href, text: document.body.innerText.slice(0, 1800), crop: document.getElementById('crop-display')?.innerText, modelClass: [...document.querySelectorAll('.result-subtitle')].map(el => el.innerText) })");
assert('作物模型返回实际预测', cropDone && ['水稻', '苹果', '香蕉', '玉米'].some((name) => cropResult.text.includes(name)), cropResult);
assert('结果展示模型适用范围', /22 个作物类别|中国田间数据/.test(cropResult.text), cropResult.text.slice(-500));
await shot('02-crop-result');

// 施肥建议
await cdp.send('Page.navigate', { url: `${base}/fertilizer.html?e2e=${Date.now()}` });
await waitFor("document.readyState === 'complete' && document.getElementById('fertilizerForm')");
await evaluate(`(() => {
  document.getElementById('crop').value = 'rice';
  document.getElementById('soilPh').value = '5.2';
  document.getElementById('growthStage').value = 'vegetative';
  document.getElementById('rainfall').value = '120';
  document.getElementById('fertilizerForm').requestSubmit();
  return true;
})()`);
const fertDone = await waitFor("document.querySelector('.result-main') !== null", 12000);
const fert = await evaluate("({ text: document.getElementById('resultCard').innerText, empty: document.getElementById('emptyState') !== null })");
assert('施肥建议显示肥料与用量', fertDone && /尿素|复合肥|磷酸二铵/.test(fert.text) && /公斤\/亩/.test(fert.text), fert);
assert('施肥建议注明依据与边界', /规则库|测土|标签/.test(fert.text), fert.text);
await shot('03-fertilizer-result');

assert('工具页面无脚本异常', errors.length === 0, errors);
fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify({ base, steps, errors }, null, 2), 'utf8');
console.log(`\n通过 ${steps.length} 项，结果已保存到 ${output}`);
cdp.close();
await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
