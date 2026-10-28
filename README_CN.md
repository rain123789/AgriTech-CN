# 农智云（AgriTech 中国大陆本地化版）

> 基于开源项目 [omroy07/AgriTech](https://github.com/omroy07/AgriTech) 的中国大陆本土化移植。
> 上游版本：`a50b4332263b9bede5426f67b9bb0ca60e50bb1d`（分支 `localization/zh-cn`）。
> 上游许可证为 MIT，本移植保留原始版权与署名。

---

## 一、这个版本做了什么

| 方向 | 说明 |
| --- | --- |
| 全站中文化 | 默认 `zh-CN`，HTML `lang="zh-CN"`，中文日期/货币/地区；页面底部提供「中文 / EN」切换，选择跨页面保持 |
| 货币与单位 | 卢比改为人民币 ¥；面积使用亩/公顷；温度使用 ℃；商品价格统一标注计价单位 |
| 地区数据 | 商城、气象、运营概览改用中国大陆省市（湖北、河南、山东、江苏、四川、黑龙江等） |
| AI 适配 | Gemini → **DeepSeek / OpenAI 兼容接口**（`DEEPSEEK_API_KEY`），未配置或调用失败时自动降级为本地规则库并明确标注 |
| 账号体系 | 去掉 Firebase 与「仅 Gmail」限制，支持中文姓名与常见邮箱，数据落在本地 SQLite，密码用 Werkzeug 安全哈希 |
| 商城 | 12 件中国样例商品、真实可用的搜索/筛选/排序/详情/加购/改数量/删除/刷新持久化/合计 |
| 气象 | 优先 Open-Meteo 免密钥数据，不可用时返回明确标记的本地演示气象 |
| 政策 | 改为中国口径的政策**入口**，只保留可核实的官方来源，不虚构补贴金额与截止日期 |
| 离线可用 | 图标字体、图表库、弹窗库、地图库全部本地化；核心页面不依赖 Google Fonts / cdnjs |

---

## 二、快速开始（Windows 11）

1. 安装 **Python 3.11 或更高版本**（安装时勾选 *Add Python to PATH*）。
2. 双击 **`检查环境.cmd`**，确认 Python 与端口状态。
3. 双击 **`启动平台.cmd`**：
   - 首次运行自动创建 `.venv` 虚拟环境并安装依赖（约 3–8 分钟）；
   - 自动从 `.env.example` 生成 `.env`；
   - 服务启动后打开 <http://127.0.0.1:5000>。
4. 结束服务：关闭启动窗口，或运行 **`停止平台.cmd`**。

> 依赖安装完成后不会重复安装；如需强制重装，删除 `.venv\.deps-installed` 后再启动即可。
>
> 说明：三个 `.cmd` 以 **GBK** 编码保存（配合 `chcp 936`），在中文 Windows 控制台下显示正常；
> 依赖安装默认走阿里云镜像，镜像不可用时自动回退官方源。

### 手动启动（可选）

```bat
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements-cn.txt
.venv\Scripts\python app.py
```

---

## 三、两种运行模式

| 模式 | 条件 | 行为 |
| --- | --- | --- |
| **基础演示模式** | 不配置 `DEEPSEEK_API_KEY` | 全站可用；AI 助手使用本地中文规则库，回答后会标注「离线规则回答」，不会冒充大模型 |
| **在线服务模式** | `.env` 中填写有效 `DEEPSEEK_API_KEY` | AI 助手调用 DeepSeek 兼容接口；请求失败时自动降级并提示原因 |

`.env` 关键配置：

```ini
DEEPSEEK_API_KEY=你的密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

密钥只存在于服务端环境变量，不会写入前端代码、示例配置或 Git 提交。

### 图片病害识别的两条通道

| 通道 | 条件 | 说明 |
| --- | --- | --- |
| 本地模型 | 容器内可 `import torch` 且存在 `Plant Disease Detection/plant-disease-model.pth` | 38 类 PlantVillage 公开数据集，离线可用、零调用成本 |
| 云端多模态 | `.env` 配置 `DASHSCOPE_API_KEY` | 阿里云百炼 OpenAI 兼容接口，本地模型不可用时自动接管 |

```ini
DASHSCOPE_API_KEY=你的百炼密钥
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_VISION_MODEL=qwen3-vl-plus
QWEN_VISION_TIMEOUT=45
```

- 本地优先：本地模型能出结果时不调用云端，避免产生费用；本地调试可设 `DISEASE_ENGINE=cloud` 强制走云端。
- 作物提示：页面可选出作物，云端按该作物收窄判断范围，准确率明显提升（实测玉米锈病 3/3 命中）。
- 自动降级：本地不可用（Vercel 容器未安装 torch）时改用云端；两条通道都不可用才报错。
- 地域：中国站用 `dashscope.aliyuncs.com`，国际站用 `dashscope-intl.aliyuncs.com`，密钥不可跨站使用。
- 免费额度：新用户按模型分别赠送（常见为 100 万 Token、90 天有效），仅限指定地域；用尽后按量计费，建议在控制台开启「额度用尽即停止调用」。

---

## 四、主要页面与可用状态

| 页面 | 路径 | 状态 | 说明 |
| --- | --- | --- | --- |
| 首页 | `/` | ✅ 可用 | 平台概览、演示经营数据、农产品价格走势（演示） |
| 农产品交易市场 | `/marketplace.html` | ✅ 可用 | 搜索 / 品类 / 产地筛选、排序、详情、加购、改量、删除、刷新保留 |
| 作物种植推荐 | `/crop/` | ✅ 可用 | 7 项土壤与气候参数 → 随机森林模型 → 22 类作物建议 + 适用范围提示 |
| 科学施肥建议 | `/fertilizer.html` | ✅ 可用 | 作物、土壤 pH、生育期、降雨 → 规则库建议（公斤/亩） |
| 农业气象 | `/weather_dashboard.html` | ✅ 可用 | Open-Meteo 实时数据或明确标记的演示数据 + 农事建议 |
| 惠农政策 | `/scheme.html` | ✅ 可用 | 中国口径政策入口，标注「需核实资格」 |
| 农户社区 | `/community_forum.html` | ✅ 可用（演示数据） | 分类、话题列表来自本地演示接口 |
| AI 农业助手 | `/chat.html` | ✅ 可用 | 文字问答 + 图片上传；模型不可用时给出明确说明 |
| 植物病害识别 | `/disease.html` | ⚠️ 已修复但模型自检未通过 | 见「模型适用范围」 |
| 农业资讯 / 博客 | `/news.html`、`/blog.html` | ✅ 可用 | 已替换为中文演示内容 |
| 登录 / 注册 | `/login.html`、`/register.html` | ✅ 可用 | 本地账号，支持中文姓名与任意常见邮箱 |
| 隐私 / 条款 / Cookie | `/privacy-policy.html` 等 | ✅ 可用 | 已按本地部署重写 |
| 产量预测 | `Crop Yield Prediction/` | ⚠️ 独立实验模块 | 上游自带独立 Flask 应用与 XGBoost 权重，未接入主站，界面不完整 |
| 物联网监测、畜禽、供应链等 | `/iot_monitoring.html` 等 | ⚠️ 演示/实验页面 | 保留原交互，数据为本地演示 |

---

## 五、模型与数据的适用范围（重要）

### 1. 作物种植推荐（可用）

- 模型：项目自带 `crop_recommendation/model/rf_model.pkl`（随机森林）与 `label_encoder.pkl`。
- 输入：N、P、K、温度、湿度、pH、降雨量，共 7 个特征。
- 输出：22 个作物类别之一，并同时展示英文类别名便于追溯。
- **限制**：训练数据来自印度公开农业数据，**未使用中国田间数据验证**。结果页面会固定提示该边界；输入超出常见范围时会提示可靠性下降。
- 不做「增产 30%」之类的承诺。

### 2. 植物病害识别（默认禁用）

- 权重：`Plant Disease Detection/plant-disease-model.pth`（38 类 PlantVillage）。
- **实测问题**：用项目自带 33 张测试图做自检，番茄早疫病、马铃薯早疫病、玉米锈病、苹果黑星病等不同类别**全部被模型判为同一类（healthy，置信度约 1.00）**，
  判定为上游权重或标签映射损坏，而不是预处理问题。
- 因此默认 `ENABLE_PLANT_MODEL=0`，服务端**拒绝返回伪诊断**，页面明确显示「模型自检失败，图片识别已禁用」。
- 若你自行验证后认为可用，可安装 `requirements-cn-ml.txt` 并设置 `ENABLE_PLANT_MODEL=1`。

### 3. AI 助手

- 文字：DeepSeek / OpenAI 兼容接口（`/api/chat`）。
- 图片：DeepSeek 文本模型不能直接识图，因此图片由本地模型负责；模型不可用时如实告知，不猜测病害。
- 离线规则库只覆盖水稻、小麦、玉米、番茄、施肥、灌溉、病虫害、行情等主题；未覆盖时明确说明「知识库没有覆盖」。

### 4. 商城与气象

- 商城价格、商家、库存、评分、订单均为**本地演示样例**，页面有醒目标识，不提供支付、物流与信用背书。
- 气象优先使用 Open-Meteo；不可用时返回「本地演示天气」，与实时预报区分。

---

## 六、目录结构（节选）

```text
AgriTech-CN/
├── app.py                     # Flask 主入口（本地演示模式 + AI 适配 + 本地接口）
├── auth.js                    # 本地账号前端（替代 Firebase）
├── scripts/i18n.js            # 统一中文运行时（默认中文、EN 切换、动态文本）
├── scripts/locales/           # 构建期生成的离线中文补充词典
├── cn-i18n.css               # 中文字体与排版补丁
├── marketplace-cn.js         # 商城交互（搜索/筛选/详情/购物车持久化）
├── fertilizer.html            # 科学施肥建议
├── backend/
│   ├── services/ai_service.py            # DeepSeek 适配 + 离线规则库
│   ├── services/plant_disease_service.py # 本地病害模型（默认禁用）
│   └── api/chat_routes.py                # /api/chat、/api/disease/*
├── crop_recommendation/       # 作物推荐模型与模板
├── docs/localization/         # 审计、说明、测试与验收报告
├── tests/localization/        # 真实浏览器端到端测试脚本
├── vendor/                    # 本地图标字体、图表库、地图库
├── 启动平台.cmd / 停止平台.cmd / 检查环境.cmd
└── README_CN.md
```

---

## 七、自动化测试

```bat
.venv\Scripts\python -m pip install pytest
.venv\Scripts\python -m pytest tests/localization -q
```

真实浏览器（Chrome DevTools Protocol）测试脚本位于 `tests/localization/`：

| 脚本 | 覆盖内容 |
| --- | --- |
| `test_marketplace_flow.mjs` | 中文搜索、品类筛选、详情、加购、改数量、刷新持久化、删除、空状态、控制台零异常 |
| `test_auth_flow.mjs` | 中文姓名 + 非 Gmail 邮箱注册、登录、错误密码提示 |
| `test_ai_flow.mjs` | 文字问答、在线失败降级、图片上传与「不伪造诊断」 |
| `test_tools_flow.mjs` | 作物推荐模型真实推理、施肥建议 |
| `smoke_pages.mjs` | 28 个主要页面的可达性、中文覆盖、横向溢出与脚本异常扫描 |

运行方式（需先启动 Chrome 远程调试端口）：

```bat
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --remote-debugging-port=9334 --user-data-dir=%TEMP%\agritech-cdp
node tests\localization\test_marketplace_flow.mjs --base http://127.0.0.1:5000 --port 9334
```

---

## 八、常见问题

| 现象 | 原因与处理 |
| --- | --- |
| 启动窗口提示端口 5000 被占用 | 运行 `停止平台.cmd`，或修改 `.env` 的 `PORT` |
| AI 助手回答“在线大模型暂时不可用” | Key 无效/额度不足/网络不可达；系统已自动降级为本地规则库，不影响其他功能 |
| 病害识别按钮显示“模型自检失败” | 上游权重缺陷，默认禁用（见「模型适用范围」） |
| 页面出现方框图标 | 浏览器缓存了旧 CSS；按 Ctrl+F5，或清空站点数据 |
| 依赖安装很慢 | 使用阿里云镜像：`.venv\Scripts\python -m pip install -r requirements-cn.txt -i https://mirrors.aliyun.com/pypi/simple/` |

---

## 九、许可与署名

- 代码沿用上游 MIT 许可；本移植新增部分同样以 MIT 提供。
- 上游项目：<https://github.com/omroy07/AgriTech>，原作者 Om Roy、Shubhangi Roy。
- 第三方资源：Font Awesome Free（CC BY 4.0 / SIL OFL 1.1 / MIT）、Chart.js（MIT）、SweetAlert2（MIT）、Leaflet（BSD-2-Clause）、Three.js（MIT）、Socket.IO（MIT），
  许可证文本随 `vendor/` 目录保留。
- PlantVillage 数据集与 `plant-disease-model.pth` 权重来自上游仓库，权利归原作者；本地化版本未修改其内容。
- 商城商品、天气、政策与社区内容均为演示数据，不构成任何商业或农业技术承诺。
