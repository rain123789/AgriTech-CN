# 07 · Vercel 部署说明（可直接转发给他人）

> 本目录就是可直接部署的完整工程：Flask 后端 + 99 个静态页面 + 本地模型 + 离线中文词典。
> 部署方式：**Vercel 自定义容器（Dockerfile.vercel + gunicorn）**，无需本地安装 Docker。

---

## 一、三种上手方式

| 方式 | 适用 | 命令 |
| --- | --- | --- |
| A. 本地跑 | 试用、验收、二次开发 | 双击 `启动平台.cmd` → <http://127.0.0.1:5000> |
| B. 部署到 Vercel | 公网访问、演示 | `node scripts/deployment/vercel_deploy.mjs`（一键）或按第三节手动操作 |
| C. 部署到自己的服务器 | 长期运行、数据持久 | `pip install -r requirements-cn.txt` 后用 gunicorn 起 `app:app` |

---

## 二、部署前必读（3 条硬约束）

1. **Vercel 容器文件系统不持久**：`DATABASE_URL` 指向 `/tmp/agritech.db`，**注册/登录数据在每次重新部署后会被清空**。演示无碍，长期使用请把数据库换成托管数据库（PostgreSQL/MySQL）并把 `DATABASE_URL` 指向它。
2. **图片病害识别默认关闭**：上游权重自检未通过（见 `04_模型与数据适用范围.md`），部署包里**不含**该权重，`ENABLE_PLANT_MODEL=0`；页面会明确提示「图片识别已禁用」，不会伪造诊断。
3. **需要有效的 DeepSeek Key 才能用在线 AI**：不填也能跑，AI 助手会使用本地中文规则库并在回答里标注「离线规则回答」。

---

## 三、部署到 Vercel（推荐路径：一条命令）

### 3.1 前置条件

- 已安装 **Node.js 18+** 与 **Vercel CLI**：`npm i -g vercel`
- 登录：`vercel login`（或使用已有账号的 token）
- 在本工程根目录执行：

```bat
node scripts\deployment\vercel_deploy.mjs
```

该脚本会依次完成：

1. 读取 `%APPDATA%\xdg.data\com.vercel.cli\auth.json` 中的凭据；
2. 创建项目 `agritech-cn-localization`（已存在则跳过）；
3. 写入生产环境变量（`SECRET_KEY`、`JWT_SECRET` 本地随机生成，其余见 `.env.vercel.example`）；
4. 执行 `vercel deploy --prod` 并打印访问地址。

结果同时写入 `artifacts/deployment/vercel-deploy-result.json`。

### 3.2 手动方式（等价）

```bat
vercel project add agritech-cn-localization
vercel env add SECRET_KEY production
vercel env add JWT_SECRET production
vercel env add FLASK_ENV production
vercel env add DATABASE_URL production
vercel env add CACHE_TYPE production
vercel env add CORS_ORIGINS production
vercel deploy --prod
```

`vercel env add` 会提示输入值，对照 `.env.vercel.example` 填写即可。

### 3.3 部署产物说明

| 文件 | 作用 |
| --- | --- |
| `Dockerfile.vercel` | Python 3.12-slim + gunicorn，监听 `${PORT:-80}`；单进程 8 线程（兼容 SQLite 写入与 Socket.IO 长轮询） |
| `vercel.json` | 用 `@vercel/docker` 构建器把全部流量交给容器 |
| `requirements-vercel.txt` | 线上依赖（不含 torch/model 依赖，体积小） |
| `.vercelignore` / `.dockerignore` | 排除 `.git`、`.venv`、实验目录、病害权重等，控制上传与镜像体积 |
| `.env.vercel.example` | 全部线上环境变量说明 |

构建耗时：约 2–5 分钟（首次会拉取 scikit-learn / pandas 等 wheel）。构建日志：`vercel deploy --logs`。

---

## 四、绑定自定义域名

1. 先看域名是否已在账号里：`vercel domains ls`
2. 若域名已解析到 Vercel 但没挂到任何项目，直接挂到本项目即可，**无需改 DNS**：
   `POST https://api.vercel.com/v10/projects/{projectId}/domains?teamId={teamId}`，body `{"name":"你的域名"}`
3. 若 DNS 还没指过来，先查权威 NS（`nslookup -type=ns 你的域名 8.8.8.8`），在**权威 DNS 服务商**处加记录：
   - `CNAME` → `<hash>.vercel-dns-017.com`（用 `GET /v6/domains/{域名}/config` 取准确值）
   - 或 `A` → `216.198.79.1`
4. 证书由 Vercel 自动签发，DNS 生效后几分钟即可 HTTPS 访问。
5. 用 Cloudflare 时新增记录必须选 **DNS only（灰色云朵）**；若要开代理，先把 SSL 模式改成 `Full (strict)`，否则会无限重定向。

---

## 五、部署后自检清单

```bat
curl -I https://<你的域名>/                       :: 200
curl -s https://<你的域名>/api/ai/status          :: 应有 mode / plant_disease_model.classes=38
curl -s -X POST https://<你的域名>/api/chat -H "Content-Type: application/json" -d "{\"message\":\"水稻怎么管理\"}"
                                                  :: 返回中文回答（在线或离线降级）
curl -s -X POST https://<你的域名>/api/fertilizer/recommend -H "Content-Type: application/json" -d "{\"crop_type\":\"rice\",\"soil_ph\":5.2,\"growth_stage\":\"vegetative\",\"rainfall\":120}"
                                                  :: 应返回 fertilizer_name=尿素 与公斤/亩用量
```

页面级自检（中文、无控制台报错、购物车可用）可直接复用仓库里的真实浏览器测试：

```bat
node tests\localization\run_all.mjs --base https://<你的域名> --port 9334
```

---

## 六、常见问题

| 现象 | 原因与处理 |
| --- | --- |
| `Your Team exceeded our fair use limits and has been blocked` | Vercel 账号被公平使用限额封锁（免费账号每日部署/资源创建上限）。换账号、在 Vercel 控制台升级付费方案，或等待额度窗口重置后重试本脚本 |
| 部署“成功”但没有 Docker 日志 | `vercel.json` 未生效。确认仓库根目录存在 `Dockerfile.vercel` 且 `vercel.json` 用 `builds` + `routes` 写法 |
| 首页 500，日志报缺包 | `requirements-vercel.txt` 与实际 import 不一致。看构建日志里的 `ModuleNotFoundError` 并补依赖 |
| 静态资源 404 | Flask 以仓库根目录为静态目录；若用其他静态托管，请同步上传根目录 HTML/CSS/JS 与 `vendor/`、`images/`、`scripts/` |
| 注册后刷新数据丢失 | Vercel 容器不持久，见第二节第 1 条；改用托管数据库 |
| 页面出现方框图标 | 浏览器缓存了旧 CSS，Ctrl+F5 强刷 |

---

## 七、目录速览（部署包内）

```text
AgriTech-CN/
├── app.py                      # Flask 入口（Flask(__name__, static_folder='.')，静态与接口同源）
├── backend/                    # 认证、AI 适配、模型服务、本地接口
├── crop_recommendation/        # 作物推荐模型（rf_model.pkl + label_encoder.pkl）
├── server/Routes/              # 轮作与灌溉接口
├── scripts/
│   ├── i18n.js                 # 统一中文运行时
│   ├── locales/zh-CN-extra.js  # 离线中文词典（1163 条）
│   ├── deployment/vercel_deploy.mjs  # 一键部署脚本
│   └── localization/           # 词典构建、页面注入、打包脚本
├── vendor/                     # 本地图标字体与前端库（无 CDN 依赖）
├── tests/localization/         # 真实浏览器测试（40 断言）+ 烟测 + 截图脚本
├── docs/localization/          # 审计/说明/缺陷/模型边界/测试/验收/本部署说明
├── 启动平台.cmd / 停止平台.cmd / 检查环境.cmd   # Windows 一键脚本（GBK 编码）
└── Dockerfile.vercel / vercel.json / requirements-vercel.txt
```
