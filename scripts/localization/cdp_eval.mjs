/**
 * 在真实 Chrome 中执行一段 JavaScript，用于诊断与自动化验收。
 * 用法：node cdp_eval.mjs --url URL --expression "document.title" [--port 9333] [--wait 1500]
 */
const getArg = (name, fallback = '') => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const url = getArg('url', 'http://127.0.0.1:5000/index.html');
const expression = getArg('expression', 'document.title');
const port = Number(getArg('port', '9333'));
const wait = Number(getArg('wait', '1500'));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const target = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
let nextId = 1;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const waiter = pending.get(message.id);
  if (!waiter) return;
  pending.delete(message.id);
  message.error ? waiter.reject(new Error(message.error.message)) : waiter.resolve(message.result);
});
const send = (method, params = {}) => {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
};
await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url });
await sleep(wait);
const result = await send('Runtime.evaluate', {
  expression,
  returnByValue: true,
  awaitPromise: true,
});
console.log(JSON.stringify(result.result?.value ?? result, null, 2));
socket.close();
await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
