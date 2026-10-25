/**
 * 四档视口响应式截图（1920×1080 / 1366×768 / 768×1024 / 390×844）
 */
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : 'http://127.0.0.1:5000';
const port = process.argv.includes('--port') ? Number(process.argv[process.argv.indexOf('--port') + 1]) : 9334;
const output = 'artifacts/screenshots';
fs.mkdirSync(output, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const pages = [
  { name: 'index', url: '/index.html' },
  { name: 'marketplace', url: '/marketplace.html' },
  { name: 'chat', url: '/chat.html' },
  { name: 'crop-model', url: '/crop/' },
];
const viewports = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];

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
const evaluate = async (expression) => {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return result.result?.value;
};
const report = [];
for (const page of pages) {
  for (const viewport of viewports) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.width < 600,
    });
    await cdp.send('Page.navigate', { url: `${base}${page.url}?shot=${Date.now()}` });
    await sleep(2600);
    const info = await evaluate(`({
      title: document.title,
      lang: document.documentElement.lang,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      height: document.body.scrollHeight,
    })`);
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: viewport.width, height: Math.min(info.height, 12000), scale: 1 },
    });
    const file = path.join(output, `${page.name}-${viewport.width}x${viewport.height}.png`);
    fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
    report.push({ page: page.name, ...viewport, ...info, file });
    console.log(`${page.name} ${viewport.width}x${viewport.height} overflow=${info.overflow} lang=${info.lang} -> ${file}`);
  }
}
fs.writeFileSync(path.join(output, 'responsive-report.json'), JSON.stringify(report, null, 2), 'utf8');
cdp.close();
await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
