/**
 * 一键部署到 Vercel（容器 + gunicorn）。
 *
 *   node scripts/deployment/vercel_deploy.mjs [--project agritech-cn-localization] [--dry-run]
 *
 * 流程：
 *   1. 读取本机 Vercel 凭据（%APPDATA%/xdg.data/com.vercel.cli/auth.json）
 *   2. 创建项目（已存在则跳过）
 *   3. 写入生产环境变量（已存在则跳过，密钥本地随机生成）
 *   4. 调用 vercel deploy --prod 并输出访问地址
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const project = getArg('project', 'agritech-cn-localization');
const dryRun = args.includes('--dry-run');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const outDir = path.join(root, 'artifacts', 'deployment');
fs.mkdirSync(outDir, { recursive: true });

const authPath = path.join(process.env.APPDATA, 'xdg.data', 'com.vercel.cli', 'auth.json');
if (!fs.existsSync(authPath)) {
  console.error('未找到 Vercel 凭据，请先执行：vercel login');
  process.exit(1);
}
const token = JSON.parse(fs.readFileSync(authPath, 'utf8')).token;
const api = (pathname, init = {}) =>
  fetch(`https://api.vercel.com${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

const teamId = process.env.VERCEL_TEAM_ID || 'zings-projects-9e4c4761';
const secret = () => crypto.randomBytes(32).toString('hex');
const log = (...args) => console.log('[vercel]', ...args);

// 1) 找到或创建项目
let projectId = null;
const listRes = await api(`/v9/projects?teamId=${teamId}&limit=100`);
if (listRes.ok) {
  const list = (await listRes.json()).projects || [];
  const found = list.find((item) => item.name === project);
  if (found) projectId = found.id;
  log(`账号现有项目 ${list.length} 个，目标项目：${project}${found ? '（已存在）' : ''}`);
} else {
  log('读取项目列表失败：', (await listRes.text()).slice(0, 200));
}

if (!projectId) {
  const createRes = await api(`/v10/projects?teamId=${teamId}`, {
    method: 'POST',
    body: JSON.stringify({ name: project, framework: null }),
  });
  const createBody = await createRes.json().catch(() => ({}));
  if (!createRes.ok) {
    const message = createBody?.error?.message || `HTTP ${createRes.status}`;
    console.error(`\n[失败] 无法创建项目：${message}`);
    console.error('提示：若是 "exceeded our fair use limits"，说明 Vercel 账号被限额封锁，需换账号或等待额度重置。');
    fs.writeFileSync(path.join(outDir, 'vercel-deploy-result.json'), JSON.stringify({ ok: false, step: 'create-project', status: createRes.status, message }, null, 2));
    process.exit(2);
  }
  projectId = createBody.id;
  log(`项目已创建：${projectId}`);
}

if (dryRun) {
  log('dry-run 结束');
  process.exit(0);
}

// 2) 环境变量
const secrets = {
  SECRET_KEY: secret(),
  JWT_SECRET: secret(),
};
const plain = {
  FLASK_ENV: 'production',
  DEBUG: 'False',
  HOST: '0.0.0.0',
  PORT: '80',
  DATABASE_URL: 'sqlite:////tmp/agritech.db',
  CACHE_TYPE: 'SimpleCache',
  CACHE_DEFAULT_TIMEOUT: '3600',
  ENABLE_PLANT_MODEL: '0',
  CORS_ORIGINS: `https://${project}.vercel.app`,
  DEEPSEEK_BASE_URL: 'https://api.deepseek.com',
  DEEPSEEK_MODEL: 'deepseek-chat',
};

const envRes = await api(`/v10/projects/${projectId}/env?teamId=${teamId}`);
const existing = envRes.ok ? (await envRes.json()).envs || [] : [];
const have = new Set(existing.map((item) => item.key));
let added = 0;
for (const [key, value] of Object.entries({ ...plain, ...secrets })) {
  if (have.has(key)) continue;
  const type = key in secrets ? 'encrypted' : 'plain';
  const res = await api(`/v10/projects/${projectId}/env?teamId=${teamId}`, {
    method: 'POST',
    body: JSON.stringify({ key, value, type, target: ['production'] }),
  });
  if (res.ok) {
    added += 1;
    log(`已设置环境变量 ${key}`);
  } else {
    log(`设置 ${key} 失败：${(await res.text()).slice(0, 160)}`);
  }
}
if (added === 0) log('环境变量已存在，跳过写入');

// 3) 部署
log('开始构建并部署（容器构建约需 2–5 分钟）…');
const deploy = spawnSync('vercel', ['deploy', '--prod', '--yes', '--project', project], {
  cwd: root,
  encoding: 'utf8',
  shell: true,
  env: { ...process.env },
});
const deployOut = `${deploy.stdout || ''}${deploy.stderr || ''}`;
console.log(deployOut.trim().split('\n').slice(-25).join('\n'));

const urlMatch = deployOut.match(/https:\/\/[^\s]+\.vercel\.app/);
const result = {
  ok: deploy.status === 0,
  project,
  projectId,
  url: urlMatch ? urlMatch[0] : null,
  productionUrl: `https://${project}.vercel.app`,
  exitCode: deploy.status,
  at: new Date().toISOString(),
};
fs.writeFileSync(path.join(outDir, 'vercel-deploy-result.json'), JSON.stringify(result, null, 2));
log(result.ok ? `部署成功：${result.productionUrl}` : `部署失败（退出码 ${deploy.status}）`);
process.exit(result.ok ? 0 : 3);
