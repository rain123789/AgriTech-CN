/**
 * AI 农业助手端到端验收：文字问答、在线失败降级、图片分析不可用提示。
 */
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : 'http://127.0.0.1:5000';
const port = process.argv.includes('--port') ? Number(process.argv[process.argv.indexOf('--port') + 1]) : 9334;
const output = 'artifacts/e2e/ai';
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
        const job = this.pending.get(msg.id);
        if (!job) return;
        this.pending.delete(msg.id);
        msg.error ? job.reject(new Error(msg.error.message)) : job.resolve(msg.result);
      } else {
        for (const handler of this.listeners.get(msg.method) || []) handler(msg.params);
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
cdp.on('Runtime.exceptionThrown', (e) => errors.push(e.exceptionDetails?.exception?.description || e.exceptionDetails?.text));
cdp.on('Runtime.consoleAPICalled', (e) => {
  if (e.type === 'error') errors.push(e.args.map((arg) => arg.value || arg.description || '').join(' '));
});
cdp.on('Network.loadingFailed', (e) => {
  if (!e.canceled && e.type !== 'Font') errors.push(`NETWORK ${e.errorText} ${e.type}`);
});
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');
await cdp.send('Network.enable');
await cdp.send('DOM.enable');
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await cdp.send('Network.clearBrowserCache');
await cdp.send('Storage.clearDataForOrigin', { origin: base, storageTypes: 'service_workers,cache_storage,local_storage' });

const evaluate = async (expression) => {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const waitFor = async (expression, timeout = 20000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { if (await evaluate(expression)) return true; } catch (_) {}
    await sleep(200);
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

await cdp.send('Page.navigate', { url: `${base}/chat.html?e2e=${Date.now()}` });
await waitFor("document.readyState === 'complete' && document.getElementById('chat-form') && document.getElementById('send-button')");
await sleep(1200);
const initial = await evaluate("({ lang: document.documentElement.lang, welcome: document.getElementById('chat-window')?.innerText.slice(0, 240), mode: document.getElementById('cn-ai-mode')?.textContent })");
assert('AI 助手默认中文', initial.lang === 'zh-CN' && /欢迎使用|AI 农业助手|你好/.test(initial.welcome), initial);
await shot('01-chat');

// 文字问答
await evaluate(`(() => {
  const input = document.getElementById('chat-input');
  input.value = '湖北水稻分蘖期遇到连续阴雨应该怎么管理？';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  document.getElementById('send-button').click();
  return true;
})()`);
const gotReply = await waitFor("document.querySelectorAll('#chat-window .message.bot .message-text').length >= 2 && ![...document.querySelectorAll('#chat-window .message.bot .message-text')].at(-1).innerText.startsWith('你好，我是')", 30000);
const textResult = await evaluate(`(() => {
  const messages = [...document.querySelectorAll('#chat-window .message.bot .message-text')];
  return {
    count: messages.length,
    text: messages.at(-1)?.innerText || '',
    badge: document.getElementById('cn-ai-mode')?.textContent || '',
    userMessages: [...document.querySelectorAll('#chat-window .message.user .message-text')].map((el) => el.innerText),
  };
})()`);
assert('文字问答返回中文回答', gotReply && /水稻|分蘖|阴雨|管理/.test(textResult.text), textResult);
assert('在线失败时明确降级', /离线|本地规则|无法连接|失败/.test(textResult.text + textResult.badge), textResult.badge);
await shot('02-text-answer');

// 图片分析
const doc = await cdp.send('DOM.getDocument', { depth: -1 });
const fileInput = await cdp.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#image-input' });
const imagePath = path.resolve('Plant Disease Detection/test/TomatoEarlyBlight1.JPG');
await cdp.send('DOM.setFileInputFiles', { nodeId: fileInput.nodeId, files: [imagePath] });
const previewReady = await waitFor("document.getElementById('image-preview-container')?.style.display !== 'none'");
assert('图片上传预览正常', previewReady, await evaluate("document.getElementById('preview-filename')?.innerText"));
await evaluate(`(() => {
  const input = document.getElementById('chat-input');
  input.value = '请识别这张番茄叶片图片';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  document.getElementById('send-button').click();
  return true;
})()`);
const gotImageReply = await waitFor("document.querySelectorAll('#chat-window .message.bot .message-text').length >= 3 && /图片|模型|不可用/.test([...document.querySelectorAll('#chat-window .message.bot .message-text')].at(-1).innerText)", 30000);
const imageResult = await evaluate(`(() => {
  const messages = [...document.querySelectorAll('#chat-window .message.bot .message-text')];
  return {
    count: messages.length,
    text: messages.at(-1)?.innerText || '',
    hasImage: document.querySelectorAll('#chat-window .message.user .message-image').length > 0,
    badge: document.getElementById('cn-ai-mode')?.textContent || '',
  };
})()`);
assert('图片消息正确展示', imageResult.hasImage, imageResult);
assert('模型不可用时不伪造诊断', gotImageReply && /图片识别暂不可用|模型|无法/.test(imageResult.text) && !/置信度\s*9[0-9]%/.test(imageResult.text), imageResult.text.slice(0, 500));
await shot('03-image-answer');

assert('AI 页面无脚本异常', errors.length === 0, errors);
fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify({ base, steps, errors }, null, 2), 'utf8');
console.log(`\n通过 ${steps.length} 项，结果已保存到 ${output}`);
cdp.close();
await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
