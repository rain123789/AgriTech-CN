/**
 * 农产品交易市场端到端验收（真实 Chrome DOM 交互，无第三方测试依赖）
 * 运行前：
 *   1. 启动 Flask
 *   2. 启动 Chrome: --headless=new --remote-debugging-port=9334
 * 运行：
 *   node tests/localization/test_marketplace_flow.mjs --base http://127.0.0.1:5000 --port 9334
 */
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://127.0.0.1:5000';
const port = process.argv.includes('--port')
  ? Number(process.argv[process.argv.indexOf('--port') + 1])
  : 9334;
const output = 'artifacts/e2e/marketplace';
const screenshotDir = path.join(output, 'screenshots');
fs.mkdirSync(screenshotDir, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
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
        const job = this.pending.get(message.id);
        if (!job) return;
        this.pending.delete(message.id);
        if (message.error) job.reject(new Error(message.error.message));
        else job.resolve(message.result);
        return;
      }
      for (const listener of this.listeners.get(message.method) || []) listener(message.params);
    });
    return this;
  }
  send(method, params = {}) {
    const id = this.id++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  on(method, handler) {
    const handlers = this.listeners.get(method) || [];
    handlers.push(handler);
    this.listeners.set(method, handlers);
  }
  close() { this.ws.close(); }
}

const target = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(base + '/marketplace.html')}`, { method: 'PUT' })).json();
const cdp = await new CDP(target.webSocketDebuggerUrl).open();
const errors = [];
cdp.on('Runtime.exceptionThrown', (event) => errors.push(event.exceptionDetails?.exception?.description || event.exceptionDetails?.text));
cdp.on('Runtime.consoleAPICalled', (event) => {
  if (event.type === 'error') errors.push(event.args.map((arg) => arg.value || arg.description || '').join(' '));
});
cdp.on('Network.loadingFailed', (event) => {
  if (!event.canceled) errors.push(`NETWORK ${event.errorText} ${event.type}`);
});
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');
await cdp.send('Network.enable');
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

const evaluate = async (expression) => {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const evaluateJson = async (expression) => {
  const encoded = JSON.stringify(expression);
  const raw = await evaluate(`JSON.stringify(eval(${encoded}))`);
  return raw ? JSON.parse(raw) : undefined;
};
const waitFor = async (expression, timeout = 10000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      if (await evaluate(expression)) return true;
    } catch (_) {}
    await sleep(150);
  }
  return false;
};
const shot = async (name) => {
  const result = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(screenshotDir, `${name}.png`), Buffer.from(result.data, 'base64'));
};
const steps = [];
const record = (name, passed, detail) => {
  steps.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
};
const assert = (name, passed, detail) => {
  record(name, Boolean(passed), detail);
  if (!passed) throw new Error(`${name} 未通过`);
};

await cdp.send('Page.navigate', { url: `${base}/marketplace.html?e2e=${Date.now()}` });
await sleep(500);
const ready = await waitFor("document.readyState === 'complete' && document.querySelectorAll('.product-card').length > 0");
if (!ready) throw new Error(`商城页面未就绪：${await evaluate('document.title + " " + location.href')}`);

const initial = await evaluateJson(`((() => ({
  cards: document.querySelectorAll('.product-card').length,
  names: [...document.querySelectorAll('.product-title')].map((el) => el.textContent.trim()),
  stats: [...document.querySelectorAll('.marketplace-stats .stat-value')].map((el) => el.textContent.trim()),
  labels: [...document.querySelectorAll('.marketplace-stats .stat-label')].map((el) => el.textContent.trim()),
  cart: document.getElementById('cartCount')?.textContent,
  pagination: document.querySelector('.page-display')?.innerText,
  demoNotice: document.querySelector('.cn-demo-notice')?.innerText,
  lang: document.documentElement.lang,
}))())`);
assert('商城默认中文', initial?.lang === 'zh-CN', initial?.lang);
assert('商品数量与数据源一致', initial.cards === 12, { cards: initial.cards, stats: initial.stats });
assert('统计值来自 12 件商品', initial.stats[0] === '12' && initial.stats[1] === '12', initial.stats);
assert('无真实成交时不伪造订单', initial.stats[2] === '0', initial.stats[2]);
assert('显示演示数据标识', /本地演示数据/.test(initial.demoNotice), initial.demoNotice);
assert('购物车初始为空', initial.cart === '0', initial.cart);
await shot('01-initial');

// 搜索
await evaluate(`(() => {
  const input = document.getElementById('searchInput');
  input.value = '苹果';
  input.dispatchEvent(new Event('input', { bubbles: true }));
})()`);
await sleep(500);
const search = await evaluateJson(`({
  count: document.querySelectorAll('.product-card').length,
  names: [...document.querySelectorAll('.product-title')].map((el) => el.textContent.trim()),
  total: document.getElementById('totalCount')?.textContent,
  showing: document.getElementById('showingCount')?.textContent,
})`);
assert('中文搜索“苹果”命中', search.count === 1 && search.names[0].includes('苹果'), search);
await shot('02-search');

// 筛选品类
await evaluate(`(() => {
  const input = document.getElementById('searchInput');
  input.value = '';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  const select = document.getElementById('categoryFilter');
  select.value = 'fruits';
  select.dispatchEvent(new Event('change', { bubbles: true }));
})()`);
await sleep(400);
const filter = await evaluateJson(`({
  count: document.querySelectorAll('.product-card').length,
  categories: [...document.querySelectorAll('.product-card')].map((el) => el.dataset.category),
})`);
assert('水果筛选仅显示水果', filter.count === 2 && filter.categories.every((item) => item === 'fruits'), filter);
await shot('03-filter');

// 查看详情
await evaluate("document.querySelector('.product-card .product-image').click()");
await sleep(350);
const detail = await evaluate(`(() => {
  const modal = document.getElementById('cnProductModal');
  return {
    visible: Boolean(modal && modal.classList.contains('show')),
    title: modal?.querySelector('h2')?.textContent,
    grids: modal?.querySelectorAll('.cn-detail-grid > div').length,
    demo: modal?.textContent.includes('本地演示样例'),
  };
})()`);
assert('商品详情可打开', detail.visible && detail.title, detail);
await shot('04-detail');
await evaluate("document.querySelector('[data-detail-close]').click()");
await sleep(250);

// 加入购物车
await evaluate("document.querySelector('.product-card [data-action=add]').click()");
await sleep(400);
const added = await evaluateJson(`({
  count: document.getElementById('cartCount')?.textContent,
  inCart: document.querySelectorAll('.product-card.in-cart').length,
  toast: document.getElementById('notificationContainer')?.innerText,
})`);
assert('加入购物车并高亮', added.count === '1' && added.inCart === 1, added);

// 打开购物车，改数量
await evaluate("document.getElementById('cartWidget').click()");
await sleep(300);
const cartOpen = await evaluateJson(`({
  open: document.getElementById('cartPanel')?.classList.contains('open'),
  row: document.querySelectorAll('.cart-item-row').length,
  qty: document.querySelector('.cn-qty-control strong')?.textContent,
  total: document.getElementById('cnCartTotal')?.textContent,
})`);
assert('购物车抽屉打开并显示商品', cartOpen.open && cartOpen.row === 1 && cartOpen.qty.includes('1'), cartOpen);
await shot('05-cart');

await evaluate("document.querySelector('[data-cart-plus]').click()");
await sleep(350);
const plus = await evaluateJson(`({
  count: document.getElementById('cartCount')?.textContent,
  qty: document.querySelector('.cn-qty-control strong')?.textContent,
  total: document.getElementById('cnCartTotal')?.textContent,
  subtotal: document.querySelector('.cn-line-subtotal')?.textContent,
})`);
assert('购物车数量可增加', plus.count === '2' && plus.qty.includes('2'), plus);
await shot('06-quantity');

// 刷新持久化
await cdp.send('Page.navigate', { url: `${base}/marketplace.html?reload=${Date.now()}` });
await sleep(500);
const reloadReady = await waitFor("document.readyState === 'complete' && document.querySelectorAll('.product-card').length > 0");
if (!reloadReady) throw new Error('刷新后商城未就绪');
const persisted = await evaluateJson(`({
  count: document.getElementById('cartCount')?.textContent,
  row: document.querySelectorAll('.cart-item-row').length,
  qty: document.querySelector('.cn-qty-control strong')?.textContent,
  total: document.getElementById('cnCartTotal')?.textContent,
  cartRaw: localStorage.getItem('agritech_marketplace_cart_v1'),
})`);
assert('刷新后购物车保持', persisted.count === '2' && persisted.row === 1 && persisted.qty.includes('2'), persisted);
await shot('07-persisted');

// 删除
await evaluate(`(() => {
  document.getElementById('cartWidget').click();
  setTimeout(() => document.querySelector('[data-cart-remove]')?.click(), 150);
})()`);
await sleep(500);
const removed = await evaluateJson(`({
  count: document.getElementById('cartCount')?.textContent,
  row: document.querySelectorAll('.cart-item-row').length,
  empty: document.querySelector('.cart-empty')?.innerText,
})`);
assert('删除后购物车为空', removed.count === '0' && removed.row === 0 && /购物车还是空的/.test(removed.empty), removed);
await shot('08-removed');

// 空搜索
await evaluate(`(() => {
  const input = document.getElementById('searchInput');
  input.value = '不存在的商品';
  input.dispatchEvent(new Event('input', { bubbles: true }));
})()`);
await sleep(400);
const empty = await evaluateJson(`({
  count: document.querySelectorAll('.product-card').length,
  visible: getComputedStyle(document.getElementById('empty-marketplace-state')).display !== 'none',
  text: document.getElementById('empty-marketplace-state').innerText,
})`);
assert('空搜索结果状态正确', empty.count === 0 && empty.visible && /没有找到商品/.test(empty.text), empty);

assert('控制台无脚本异常或资源失败', errors.length === 0, errors);
fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify({ base, steps, errors }, null, 2), 'utf8');
console.log(`\n通过 ${steps.filter((step) => step.passed).length}/${steps.length} 项，结果已保存到 ${output}`);
cdp.close();
await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
