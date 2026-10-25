/**
 * 依次执行全部真实浏览器测试并汇总结果。
 * 用法：node tests/localization/run_all.mjs --base http://127.0.0.1:5000 --port 9334
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : 'http://127.0.0.1:5000';
const port = process.argv.includes('--port') ? String(process.argv[process.argv.indexOf('--port') + 1]) : '9334';
const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));

const suites = [
  { name: 'marketplace', script: 'test_marketplace_flow.mjs' },
  { name: 'auth', script: 'test_auth_flow.mjs' },
  { name: 'ai', script: 'test_ai_flow.mjs' },
  { name: 'tools', script: 'test_tools_flow.mjs' },
  { name: 'language', script: 'test_language_switch.mjs' },
];

const summary = [];
for (const suite of suites) {
  const started = Date.now();
  const result = spawnSync(process.execPath, [path.join(dir, suite.script), '--base', base, '--port', port], {
    encoding: 'utf8',
  });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  const passes = (output.match(/^PASS /gm) || []).length;
  const fails = (output.match(/^FAIL /gm) || []).length;
  summary.push({
    suite: suite.name,
    passed: passes,
    failed: fails,
    exitCode: result.status,
    seconds: Math.round((Date.now() - started) / 100) / 10,
  });
  console.log(`\n=== ${suite.name}: ${passes} 通过 / ${fails} 失败 (${summary.at(-1).seconds}s) ===`);
  if (fails) console.log(output.slice(-1500));
}

fs.mkdirSync('artifacts/e2e', { recursive: true });
fs.writeFileSync('artifacts/e2e/summary.json', JSON.stringify(summary, null, 2), 'utf8');
const totalPass = summary.reduce((sum, item) => sum + item.passed, 0);
const totalFail = summary.reduce((sum, item) => sum + item.failed, 0);
console.log(`\n总计：${totalPass} 通过 / ${totalFail} 失败`);
process.exit(totalFail > 0 ? 1 : 0);
