/**
 * 零依赖 Chrome CDP 页面探测工具（Windows 11 / 本地 Chrome）
 *
 * 先启动：
 * chrome --headless=new --remote-debugging-port=9333 --user-data-dir=<临时目录> about:blank
 *
 * 用法：
 * node scripts/localization/browser_probe.mjs --url http://127.0.0.1:5000/index.html \
 *      --out artifacts/screenshots/index --width 1440 --height 1200 --full-page
 */
import fs from 'node:fs';
import path from 'node:path';

function arg(name, fallback = '') {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}
const hasFlag = (name) => process.argv.includes(`--${name}`);

const url = arg('url', 'http://127.0.0.1:5000/index.html');
const out = arg('out', 'artifacts/screenshots/page');
const width = Number(arg('width', '1440'));
const height = Number(arg('height', '1200'));
const port = Number(arg('port', '9333'));
const waitMs = Number(arg('wait', '1800'));
const fullPage = hasFlag('full-page');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function newTarget(targetUrl) {
  const response = await fetch(
    `http://127.0.0.1:${port}/json/new?${encodeURIComponent(targetUrl)}`,
    { method: 'PUT' }
  );
  if (!response.ok) throw new Error(`无法创建浏览器标签页: ${response.status}`);
  return response.json();
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }
  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      const callbacks = this.listeners.get(message.method) || [];
      callbacks.forEach((callback) => callback(message.params));
    });
    return this;
  }
  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  on(method, callback) {
    const callbacks = this.listeners.get(method) || [];
    callbacks.push(callback);
    this.listeners.set(method, callbacks);
  }
  close() {
    this.ws.close();
  }
}

const target = await newTarget(url);
const cdp = await new CDP(target.webSocketDebuggerUrl).open();
const consoleMessages = [];
const exceptions = [];
const failedRequests = [];

cdp.on('Runtime.consoleAPICalled', (event) => {
  consoleMessages.push({
    type: event.type,
    text: event.args
      .map((item) => item.value ?? item.description ?? '')
      .join(' ')
      .slice(0, 1000),
  });
});
cdp.on('Runtime.exceptionThrown', (event) => {
  exceptions.push(event.exceptionDetails?.exception?.description || event.exceptionDetails?.text || '未知异常');
});
cdp.on('Network.loadingFailed', (event) => {
  if (!event.canceled) failedRequests.push({ error: event.errorText, type: event.type });
});

await cdp.send('Page.enable');
await cdp.send('Runtime.enable');
await cdp.send('Network.enable');
await cdp.send('Emulation.setDeviceMetricsOverride', {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: width < 600,
});
await cdp.send('Page.navigate', { url });
await sleep(waitMs);

const evaluate = async (expression) => {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    return { __evaluationError: result.exceptionDetails.exception?.description || result.exceptionDetails.text };
  }
  return result.result.value;
};

const snapshot = await evaluate(`(() => {
  const text = (element) => (element?.innerText || element?.textContent || '').replace(/\\s+/g, ' ').trim();
  const visible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  };
  return {
    url: location.href,
    title: document.title,
    lang: document.documentElement.lang,
    h1: [...document.querySelectorAll('h1')].map(text).filter(Boolean).slice(0, 8),
    nav: [...document.querySelectorAll('nav a, .navbar a, .top-nav a')].map(text).filter(Boolean).slice(0, 80),
    buttons: [...document.querySelectorAll('button')].filter(visible).map(text).filter(Boolean).slice(0, 80),
    headings: [...document.querySelectorAll('h2, h3')].map(text).filter(Boolean).slice(0, 60),
    bodyText: document.body.innerText.slice(0, 12000),
    imageCount: document.images.length,
    brokenImages: [...document.images].filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.src),
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyHeight: document.body.scrollHeight,
    overflowElements: [...document.querySelectorAll('body *')]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.right > window.innerWidth + 2 || rect.left < -2);
      })
      .slice(0, 20)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          id: element.id,
          className: String(element.className || '').slice(0, 100),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      }),
  };
})()`);

fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
const screenshot = await cdp.send('Page.captureScreenshot', {
  format: 'png',
  captureBeyondViewport: fullPage,
  ...(fullPage
    ? {
        clip: {
          x: 0,
          y: 0,
          width,
          height: Math.min(snapshot.bodyHeight + 100, 16000),
          scale: 1,
        },
      }
    : {}),
});
fs.writeFileSync(`${out}.png`, Buffer.from(screenshot.data, 'base64'));
const report = { ...snapshot, consoleMessages, exceptions, failedRequests };
fs.writeFileSync(`${out}.json`, JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify({
  url: report.url,
  title: report.title,
  lang: report.lang,
  h1: report.h1,
  boxes: {
    width: report.clientWidth,
    scrollWidth: report.scrollWidth,
    height: report.bodyHeight,
    horizontalOverflow: report.horizontalOverflow,
  },
  brokenImages: report.brokenImages.length,
  exceptions: report.exceptions,
  consoleErrors: report.consoleMessages.filter((message) => message.type === 'error'),
  screenshot: `${out}.png`,
}, null, 2));

cdp.close();
await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
