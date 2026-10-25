/**
 * 注册 / 登录端到端验收：中文姓名 + 非 Gmail 邮箱 + 本地 SQLite。
 */
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://127.0.0.1:5000';
const port = process.argv.includes('--port')
  ? Number(process.argv[process.argv.indexOf('--port') + 1])
  : 9334;
const output = 'artifacts/e2e/auth';
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
      const message = JSON.parse(event.data);
      if (message.id) {
        const job = this.pending.get(message.id);
        if (!job) return;
        this.pending.delete(message.id);
        message.error ? job.reject(new Error(message.error.message)) : job.resolve(message.result);
      } else {
        for (const listener of this.listeners.get(message.method) || []) listener(message.params);
      }
    });
    return this;
  }
  send(method, params = {}) {
    const id = this.id++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  on(method, handler) {
    const list = this.listeners.get(method) || [];
    list.push(handler);
    this.listeners.set(method, list);
  }
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
  if (!event.canceled) errors.push(`NETWORK ${event.errorText} ${event.type}`);
});
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');
await cdp.send('Network.enable');
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await cdp.send('Storage.clearDataForOrigin', { origin: base, storageTypes: 'service_workers,cache_storage,local_storage' });

const evaluate = async (expression) => {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const waitFor = async (expression, timeout = 10000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { if (await evaluate(expression)) return true; } catch (_) {}
    await sleep(160);
  }
  return false;
};
const shot = async (name) => {
  const result = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(screenshots, `${name}.png`), Buffer.from(result.data, 'base64'));
};
const steps = [];
const assert = (name, passed, detail) => {
  steps.push({ name, passed: Boolean(passed), detail });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  if (!passed) throw new Error(`${name} 未通过`);
};

const email = `nonghu${Date.now()}@example.com`;
fs.writeFileSync(path.join(output, 'test-account.json'), JSON.stringify({ email, password: 'AgriTech123', name: '李小明' }, null, 2));

// 注册
await cdp.send('Page.navigate', { url: `${base}/register.html?e2e=${Date.now()}` });
await waitFor("document.readyState === 'complete' && document.getElementById('register-btn')");
assert('注册页加载中文界面', (await evaluate('document.documentElement.lang')) === 'zh-CN', await evaluate('document.title'));
await shot('01-register');

await evaluate(`(() => {
  const set = (id, value) => {
    const el = document.getElementById(id);
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  set('role', 'farmer');
  set('fullname', '李小明');
  set('email', ${JSON.stringify(email)});
  set('password', 'AgriTech123');
  set('confirmPassword', 'AgriTech123');
  updateRoleIcon();
  updateProgress();
  return true;
})()`);
await shot('02-filled');
await evaluate("document.getElementById('register-btn').click(); true");
const registered = await waitFor("location.pathname.endsWith('/farmer.html')", 12000);
const session = await evaluate("localStorage.getItem('agritech_session')");
assert('中文姓名与普通邮箱注册成功', registered && Boolean(session), { url: await evaluate('location.href'), session });
const user = JSON.parse(session);
assert('注册资料正确保存', user.fullname === '李小明' && user.email === email && user.role === 'farmer', user);
await shot('03-registered-dashboard');

// 清理会话后测登录
await evaluate("localStorage.removeItem('agritech_session'); localStorage.removeItem('agritech_access_token'); true");
await cdp.send('Page.navigate', { url: `${base}/login.html?e2e=${Date.now()}` });
await waitFor("document.readyState === 'complete' && document.getElementById('password') && window.authManager");
await shot('04-login');
await evaluate(`(() => {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  emailInput.value = ${JSON.stringify(email)};
  passwordInput.value = 'AgriTech123';
  emailInput.dispatchEvent(new Event('input', { bubbles: true }));
  passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
  document.querySelector('button[type=submit]').click();
  return true;
})()`);
const loggedIn = await waitFor("location.pathname.endsWith('/farmer.html')", 12000);
const session2 = await evaluate("localStorage.getItem('agritech_session')");
assert('本地账号登录成功并跳转角色首页', loggedIn && Boolean(session2), { url: await evaluate('location.href'), session2 });
await shot('05-logged-in');

// 错误密码
await evaluate("localStorage.removeItem('agritech_session'); localStorage.removeItem('agritech_access_token'); true");
await cdp.send('Page.navigate', { url: `${base}/login.html?e2e=${Date.now()}` });
await waitFor("document.readyState === 'complete' && document.getElementById('password') && window.authManager");
await evaluate(`(() => {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  emailInput.value = ${JSON.stringify(email)};
  passwordInput.value = 'WrongPass123';
  emailInput.dispatchEvent(new Event('input', { bubbles: true }));
  passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
  document.querySelector('button[type=submit]').click();
  return true;
})()`);
await waitFor("document.querySelector('.auth-message') !== null", 7000);
const wrong = await evaluate("document.querySelector('.auth-message')?.innerText || ''");
assert('错误密码显示中文提示', /密码|不正确/.test(wrong), wrong);

assert('认证流程无脚本异常', errors.length === 0, errors);
fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify({ base, email, steps, errors }, null, 2), 'utf8');
console.log(`\n通过 ${steps.length} 项，结果已保存到 ${output}`);
cdp.close();
await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
