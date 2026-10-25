/**
 * 提取页面中仍以英文显示、且未被本地词典覆盖的文本。
 * 输出 artifacts/smoke/untranslated.json，供构建期生成离线词典。
 */
import fs from 'node:fs';
import path from 'node:path';

const base = 'http://127.0.0.1:5000';
const port = 9334;
const pages = [
  'about.html', 'blog.html', 'news.html', 'levelup.html', 'crop.html', 'supply-chain.html',
  'irrigation.html', 'sustainable-farming.html', 'iot_monitoring.html', 'financial-support.html',
  'faq.html', 'feed-back.html', 'livestock.html', 'contact.html', 'favorites.html',
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 1;
const pending = new Map();
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const current = id++;
    pending.set(current, { resolve, reject });
    ws.send(JSON.stringify({ id: current, method, params }));
  });
await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return result.result?.value;
};
const all = {};
const flat = new Map();
for (const page of pages) {
  await send('Page.navigate', { url: `${base}/${page}?extract=${Date.now()}` });
  await sleep(3200);
  const strings = await evaluate(`(() => {
    const list = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.nodeValue.replace(/\\s+/g, ' ').trim();
      const parent = node.parentElement;
      if (!text || text.length < 3 || !/[A-Za-z]/.test(text) || /[\\u4e00-\\u9fff]/.test(text)) continue;
      if (!parent || ['SCRIPT','STYLE','NOSCRIPT','CODE','PRE'].includes(parent.tagName)) continue;
      if (parent.closest('[data-no-i18n]')) continue;
      const style = getComputedStyle(parent);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      if (/^(AI|API|NPK|pH|FAQ|PDF|CNY|GPS|IoT|JSON|CSV|HTTP|HTTPS|DAP|MOP|SSP|N|P|K)$/i.test(text)) continue;
      if (/^[\\d\\s.,:%+\\-–—℃°\\/]+$/.test(text)) continue;
      list.push(text.slice(0, 500));
    }
    return [...new Set(list)];
  })()`);
  all[page] = strings || [];
  for (const text of strings || []) flat.set(text, (flat.get(text) || 0) + 1);
  console.log(page, strings?.length || 0);
}
const rows = [...flat.entries()].sort((a, b) => b[1] - a[1]).map(([text, count]) => ({ text, count }));
fs.mkdirSync('artifacts/smoke', { recursive: true });
fs.writeFileSync('artifacts/smoke/untranslated.json', JSON.stringify({ pages: all, flat: rows }, null, 2), 'utf8');
console.log('unique', rows.length, 'chars', rows.reduce((sum, row) => sum + row.text.length, 0));
ws.close();
await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
