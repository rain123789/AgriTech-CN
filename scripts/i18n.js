/**
 * AgriTech 中文界面运行时（本地词典，无外部翻译依赖）
 *
 * 设计：
 * 1. 默认 zh-CN，语言选择跨页面持久化；
 * 2. 对静态文本、动态插入文本及 placeholder/title/aria-label 做本地替换；
 * 3. 英文原文保存于 WeakMap，可随时切回英文；
 * 4. 不引入 Google 翻译或远程字体，离线也能完整显示中文。
 *
 * 技术名词（API、pH、N/P/K、JSON 等）保持原样。
 */
(function () {
  "use strict";

  const STORAGE_KEY = "agritech_lang";
  const LEGACY_KEYS = ["agritech-lang", "lang", "selectedLang"];
  const DEFAULT_LANG = "zh-CN";

  const TEXT = {
    // 品牌 / 页面标题
    "agritech": "农智云",
    "agritech - revolutionizing agriculture with technology": "农智云｜用科技连接农业生产与市场",
    "premium marketplace - agritech": "农产品交易市场｜农智云",
    "smart crop monitoring - agritech": "作物智能监测｜农智云",
    "plant disease detection - ai powered diagnosis": "植物病害识别｜农智云",
    "agritech assistant - smart farming solutions": "AI 农业助手｜农智云",
    "weather advisory | agritech": "农业气象与农事建议｜农智云",
    "login - agritech": "登录｜农智云",
    "register - agritech": "注册｜农智云",
    "agriculture news - agritech": "农业资讯｜农智云",
    "community hub | agritech forum": "农户交流社区｜农智云",
    "faq - agritech | frequently asked questions": "常见问题｜农智云",
    "govt schemes & subsidy tracker": "惠农政策与补贴查询",
    "about us - agritech": "关于我们｜农智云",

    // 导航与账户
    "home": "首页",
    "about": "关于我们",
    "about us": "关于我们",
    "blog": "农业资讯",
    "ag news": "农业资讯",
    "news": "农业资讯",
    "favorites": "我的收藏",
    "schemes": "惠农政策",
    "community forum": "农户交流社区",
    "level up": "技能提升",
    "services": "农业服务",
    "smart crop monitoring": "作物智能监测",
    "supply chain support": "供应链服务",
    "water management advisor": "农田灌溉管理",
    "water management": "农田灌溉管理",
    "sustainable farming guidance": "绿色种植指导",
    "marketplace services": "农产品交易市场",
    "marketplace": "农产品交易市场",
    "iot farm monitoring": "物联网农场监测",
    "financial & insurance support": "金融与保险服务",
    "financial & insurance": "金融与保险",
    "livestock management": "畜禽养殖管理",
    "dashboard": "工作台",
    "login": "登录",
    "logout": "退出登录",
    "register": "注册",
    "sign in": "登录",
    "sign up": "注册",
    "faq": "常见问题",
    "feedback": "意见反馈",
    "contact": "联系我们",
    "contact us": "联系我们",
    "terms & service": "服务条款",
    "terms": "服务条款",
    "privacy policy": "隐私政策",
    "cookie policy": "Cookie 政策",
    "ai assistant": "AI 农业助手",
    "ai chatbot": "AI 农业助手",
    "download pdf": "下载 PDF",
    "english": "English",
    "notifications": "通知",
    "mark all as read": "全部标为已读",
    "no new notifications": "暂无新通知",
    "back to home": "返回首页",
    "back to main": "返回主站",
    "settings": "设置",
    "search": "搜索",
    "search...": "搜索…",
    "loading...": "加载中…",
    "loading": "加载中…",
    "clear": "清除",
    "export": "导出",
    "refresh": "刷新",
    "close": "关闭",
    "cancel": "取消",
    "save": "保存",
    "submit": "提交",
    "next": "下一步",
    "previous": "上一步",
    "today": "今天",
    "tomorrow": "明天",

    // 首页
    "empowering agriculture through technology": "用科技赋能中国农业",
    "agritech connects": "农智云连接",
    "farmers": "农户",
    "buyers": "采购商",
    "equipment suppliers": "农机服务商",
    ", and": "、",
    "grocery sellers": "生鲜零售商",
    "to revolutionize india's agricultural ecosystem through smart solutions and seamless collaboration.": "以数字化工具和顺畅协作，让生产、采购与服务更高效。",
    "🌾 get fertilizer recommendation": "🌾 获取科学施肥建议",
    "👩‍🌾 community forum": "👩‍🌾 进入农户社区",
    "our platform benefits": "平台能力",
    "agritech brings tailored tools and services to every stakeholder in the agricultural value chain. explore targeted benefits below and follow the quick links to learn more.": "面向农业生产与流通中的不同角色，提供实用工具与清晰入口。",
    "real-time crop monitoring, weather alerts, and direct-market access to get fair prices for your harvest.": "作物长势监测、气象提醒与产销对接，帮助农户更从容地安排生产。",
    "learn more": "了解更多",
    "buyers & retailers": "采购商与零售商",
    "source verified produce directly from farmers, schedule deliveries, and manage bulk orders with ease.": "直接对接产地，安排收货并管理批量采购订单。",
    "browse marketplace": "进入交易市场",
    "list equipment, offer rentals, and connect with nearby farmers who need modern machinery.": "发布农机设备、提供租赁，服务周边有需要的农户。",
    "list equipment": "发布农机",
    "integrate reliable suppliers into your supply chain and receive consistent quality produce on schedule.": "连接可靠供应商，按计划获得品质稳定的农产品。",
    "partner with suppliers": "对接供应商",
    "agronomists & advisors": "农技专家与顾问",
    "share expertise, provide remote diagnostic services, and recommend data-driven treatments to improve yields.": "分享农技经验，提供远程诊断与基于数据的种植建议。",
    "offer services": "提供服务",
    "finance & insurance": "金融与保险",
    "access loan options, crop insurance, and financial tools designed for seasonal agriculture cashflows.": "了解涉农贷款、农业保险与适配季节性现金流的信息。",
    "get support": "获取支持",
    "my activity": "我的经营概览",
    "track your purchases, sales, and tool usage on agritech.": "查看采购、销售与服务使用记录。",
    "select user:": "选择用户：",
    "choose a user...": "请选择用户…",
    "name": "名称",
    "items sold": "已售商品",
    "items purchased": "已购商品",
    "total revenue": "销售总额",
    "service usage": "服务使用",
    "recent transactions": "最近交易",
    "market price trends": "农产品价格走势",
    "view real-time crop prices and understand market movements.": "查看农产品价格走势与变化。当前为本地演示数据。",
    "wheat": "小麦",
    "rice": "水稻",
    "maize": "玉米",
    "cotton": "棉花",
    "daily": "日度",
    "weekly": "周度",
    "monthly": "月度",
    "quarterly": "季度",
    "current price": "当前价格",
    "₹0 / quintal": "¥0 / 百公斤",
    "change": "涨跌幅",
    "trend": "走势",
    "stable": "平稳",
    "profit & loss analytics": "收支与盈亏分析",
    "track revenue, expenses, and profitability trends for buyers and retailers.": "查看采购与销售的收入、支出和盈亏趋势。",
    "select buyer/retailer:": "选择采购商/零售商：",
    "export report": "导出报表",
    "total expenses": "支出总额",
    "net profit/loss": "净盈亏",
    "transactions": "交易笔数",
    "profit/loss trend": "盈亏趋势",
    "category breakdown": "品类构成",
    "empowering india's farming future with innovative technology connecting every stakeholder.": "用数字技术连接农业生产与市场，服务每一位参与者。",
    "empowering india's farming future": "用科技连接农业生产与市场",
    "empowering india's farming future with innovative technology.": "用数字技术连接农业生产与市场。",
    "quick links": "快捷入口",
    "newsletter": "农事简报",
    "subscribe to get the latest farming insights, tips, and updates.": "订阅每周农事提醒、种植要点与平台更新。",
    "subscribe": "订阅",
    "no spam.": "不发送垃圾邮件。",
    "unsubscribe": "退订",
    "anytime.": "可随时退订。",
    "agritech. all rights reserved.": "农智云 版权所有。",
    "we use cookies": "我们使用 Cookie",
    "agritech uses essential cookies and local storage to keep you signed in, remember preferences, and improve your experience. read the": "农智云使用必要的 Cookie 和本地存储来保持登录状态、记住偏好并改善体验。详情请阅读",
    "for details.": "。",
    "essential only": "仅必要",
    "accept all": "全部接受",
    "no results found": "未找到结果",
    "got it": "知道了",
    "enter your email to get the latest updates...": "输入邮箱，获取最新农事信息…",
    "email address for newsletter": "订阅邮箱",
    "fetching weather...": "正在获取天气…",
    "⚠️ offline or poor connection": "⚠️ 当前离线或网络不稳定",
    "⚠️ showing cached data — may be outdated": "⚠️ 当前显示缓存数据，可能已过期",

    // 商城
    "curated agri marketplace": "产地优选 · 演示市场",
    "discover verified farmers and trusted buyers, compare real-time prices, and trade smarter across india’s agricultural hubs.": "浏览产地农产品样例，按品类、地区与价格筛选。页面数据为演示数据，不代表实时成交行情。",
    "search for products, sellers, or locations...": "搜索商品、商家或产地…",
    "all categories": "全部品类",
    "vegetables": "蔬菜",
    "fruits": "水果",
    "grains": "粮食",
    "spices": "香辛料",
    "dairy": "乳品",
    "pulses": "豆类",
    "all locations": "全部产地",
    "punjab": "湖北省",
    "maharashtra": "河南省",
    "gujarat": "山东省",
    "rajasthan": "江苏省",
    "haryana": "四川省",
    "kashmir": "黑龙江省",
    "in cart only": "仅看购物车",
    "price": "价格",
    "rating": "评分",
    "distance": "距离",
    "newest": "最新",
    "active products": "在售商品",
    "verified sellers": "演示商家",
    "deals today": "今日成交",
    "avg rating": "平均评分",
    "browse categories": "浏览品类",
    "explore our wide range of agricultural products": "按品类浏览本地演示商品",
    "fresh vegetables": "新鲜蔬菜",
    "seasonal fruits": "时令水果",
    "grains & cereals": "粮食谷物",
    "spices & herbs": "香辛料与调味作物",
    "dairy products": "乳制品",
    "pulses & legumes": "豆类与杂粮",
    "featured products": "精选商品",
    "high-quality products from verified sellers": "来自演示商家的产地样例",
    "no products found": "没有找到商品",
    "try clearing some filters or turning off the \"in cart only\" filter to see more products.": "请尝试清除筛选条件，或关闭“仅看购物车”。",
    "organic": "有机",
    "fresh organic carrots": "新鲜胡萝卜",
    "kumar farms, punjab": "荆楚蔬果合作社 · 湖北",
    "premium quality organic carrots, freshly harvested and rich in vitamins.": "当日采收的优质胡萝卜，适合鲜食与团餐采购。",
    "₹45/kg": "¥4.30/公斤",
    "min 10kg": "10 公斤起订",
    "add to cart": "加入购物车",
    "premium": "优选",
    "kashmiri red apples": "红富士苹果",
    "mountain fresh, kashmir": "秦岭果业 · 陕西",
    "sweet and crispy kashmiri apples, directly from the orchards.": "果肉脆甜，产地冷链发货，适合商超与社区团购。",
    "₹180/kg": "¥7.80/公斤",
    "min 5kg": "5 公斤起订",
    "bulk deal": "批量采购",
    "premium milling wheat (bulk)": "优质制粉小麦（批量）",
    "green fields co., haryana": "中原粮贸有限公司 · 河南",
    "high-protein wheat suitable for milling, ready for immediate bulk purchase.": "面筋质量稳定，适合制粉加工，支持批量采购。",
    "₹2500/quintal": "¥238.00/百公斤",
    "min 50qt": "5,000 公斤起订",
    "hot stock": "现货",
    "organic turmeric powder": "姜黄粉",
    "spice hub, maharashtra": "川味香料合作社 · 四川",
    "high curcumin content, finely ground organic turmeric.": "细度均匀，香气充足，适合餐饮与调味品加工。",
    "₹120/100g": "¥11.40/100克",
    "min 1kg": "1 公斤起订",
    "sweet stock": "当季",
    "nashik green grapes": "阳光玫瑰葡萄",
    "vitis growers, maharashtra": "江南果蔬基地 · 江苏",
    "export quality, seedless green grapes, excellent for eating or wine.": "无籽脆甜，分级装框，适合鲜食与商超供应。",
    "₹120/kg": "¥11.40/公斤",
    "min 20kg": "20 公斤起订",
    "fresh daily": "每日鲜配",
    "pure farm cow milk": "巴氏鲜牛奶",
    "amulya dairy, gujarat": "齐鲁牧场 · 山东",
    "untouched, high-fat content cow milk, collected and chilled instantly.": "牧场直供，冷链配送，适合早餐与烘焙。",
    "₹60/liter": "¥5.70/升",
    "min 50l": "50 升起订",
    "load more products": "加载更多商品",
    "live price tracking and market analysis": "价格走势与演示行情",
    "interactive visualization ready": "价格走势演示",
    "real-time data visualization of commodity prices across different markets": "以下为本地维护的农产品样例价格，不代表实时行情。",
    "carrots": "胡萝卜",
    "+5% this week": "本周 +5%",
    "apples": "苹果",
    "-2% this week": "本周 -2%",
    "start trading today": "开始对接产销",
    "join thousands of farmers and buyers in our marketplace": "演示环境不提供真实交易、支付或物流结算。",
    "list your products": "发布供应信息",
    "find suppliers": "寻找供应商",
    "your cart": "我的购物车",
    "items visible here are highlighted on the marketplace": "购物车商品会在列表中高亮显示",
    "cart is empty": "购物车还是空的",
    "add products from the marketplace to see them here.": "从市场添加商品后会显示在这里。",
    "total items": "商品件数",
    "linked view": "联动视图",
    "in-cart products are marked with a green badge.": "已加入购物车的商品会显示绿色标识。",
    "view in cart on page": "在页面中查看",
    "checkout": "去结算",
    "quantity": "数量",
    "remove": "移除",
    "subtotal": "小计",
    "demo data": "演示数据",
    "clear filters": "清除筛选",

    // 作物与监测
    "advanced iot-powered crop monitoring system for precision agriculture and maximum yield optimization": "面向农田监测与精细化管理的作物智能监测演示页面",
    "why this crop?": "为什么推荐这类作物？",
    "show all crops": "查看全部作物",
    "soybean": "大豆",
    "wheat performs well in well-drained loamy soils; requires moderate rainfall. recommended for cooler seasons and rotational cropping with legumes to improve soil nitrogen.": "小麦适合排水良好的壤土，需水量中等，宜与豆科作物轮作以改善土壤氮素。",
    "rice thrives in flooded or saturated conditions; needs high water availability and warm temperatures. suitable for paddy fields and irrigated plains.": "水稻适合水源充足、温度较高的田块，需做好灌排配套与分蘖期水分管理。",
    "maize prefers fertile, well-drained soils and a warm growing season. it is water-responsive and benefits from balanced n-p-k fertilization.": "玉米适合肥沃、排水良好的土壤，对水分和氮磷钾平衡供应较敏感。",
    "soybean fixes atmospheric nitrogen and is an excellent rotational crop. prefers warm conditions and moderately fertile soils.": "大豆可固氮，是良好的轮作作物，适合温暖气候与中等肥力土壤。",
    "overview": "总览",
    "sensors": "传感器",
    "full iot hub": "物联网总览",
    "weather": "农业气象",
    "alerts": "预警",
    "sunny": "晴",
    "humidity": "湿度",
    "wind": "风速",
    "visibility": "能见度",
    "live monitoring dashboard": "实时监测看板",
    "real-time data from your field sensors - last updated:": "农田传感器数据 · 最后更新：",
    "just now": "刚刚",
    "soil moisture (%)": "土壤含水率（%）",
    "temperature (°c)": "温度（℃）",
    "humidity (%)": "空气湿度（%）",
    "light (lux)": "光照（lux）",
    "temperature": "温度",
    "soil moisture": "土壤含水率",
    "light intensity": "光照强度",
    "real-time": "实时",
    "data visualization": "数据可视化",
    "interactive charts showing trends and patterns": "展示变化趋势的交互图表",
    "environmental monitoring": "环境监测",
    "real-time tracking of environmental conditions affecting your crops": "跟踪影响作物生长的环境条件",
    "soil temperature and moisture": "土壤温度与含水率",
    "air temperature and humidity": "空气温度与湿度",
    "light intensity measurement": "光照强度测量",
    "wind speed and direction": "风速与风向",
    "rainfall and irrigation tracking": "降雨与灌溉记录",
    "iot sensor network": "物联网传感器网络",
    "comprehensive sensor deployment across your farmland": "覆盖田块的传感器部署样例",
    "wireless sensor nodes": "无线传感器节点",
    "solar-powered stations": "太阳能供电站点",
    "long-range communication": "远程通信",
    "weather-resistant design": "耐候设计",
    "easy installation and maintenance": "便于安装与维护",
    "data analytics": "数据分析",
    "advanced analytics and predictive insights for better decisions": "用数据分析辅助农事决策",
    "crop growth prediction models": "作物长势预测模型",
    "disease and pest alerts": "病虫害预警",
    "irrigation optimization": "灌溉优化",
    "harvest timing recommendations": "收获期建议",
    "historical data analysis": "历史数据分析",
    "operational": "运行正常",
    "strong": "强",
    "moderate": "中等",
    "excellent": "优秀",
    "unknown": "未知",
    "no signal": "无信号",
    "good": "良好",
    "today": "今天",
    "tomorrow": "明天",
    "system alerts & notifications": "系统预警与通知",
    "low soil moisture detected": "检测到土壤含水率偏低",
    "sensor connection lost": "传感器连接中断",
    "irrigation cycle completed": "灌溉周期已完成",
    "weather alert": "气象预警",
    "optimal growing conditions": "生长条件适宜",
    "get started with smart crop monitoring": "开始使用作物智能监测",
    "transform your farming with intelligent monitoring systems": "用数字化监测辅助田间管理",
    "start free trial": "开始体验",
    "request demo": "预约演示",
    "contact sales": "联系服务",
    "dashboard settings": "看板设置",
    "monitoring": "监测",
    "auto-refresh data": "自动刷新数据",
    "real-time alerts": "实时预警",
    "sound notifications": "声音提醒",
    "display": "显示",
    "show weather widget": "显示天气组件",
    "compact view": "紧凑视图",
    "animations": "动画",
    "data export": "数据导出",
    "export csv": "导出 CSV",
    "export pdf": "导出 PDF",
    "export excel": "导出 Excel",
    "export json": "导出 JSON",
    "thresholds": "阈值",
    "soil moisture alert (%)": "土壤含水率预警（%）",
    "temperature alert (°c)": "温度预警（℃）",
    "why this crop?": "推荐依据",

    // 病害识别
    "plant health ai": "植物健康 AI",
    "plant disease detection": "植物病害识别",
    "ai-powered plant health": "AI 辅助植物健康筛查",
    "detect plant diseases": "快速识别植物病害",
    "instantly": "初步筛查",
    "upload a photo of your plant and let our advanced ai diagnose diseases with 95%+ accuracy. get instant treatment recommendations and save your crops.": "上传清晰的叶片照片，由本地 38 类植物病害模型做初步筛查。模型使用 PlantVillage 公开数据集，结果不能替代当地植保部门诊断。",
    "accuracy": "模型类别",
    "2-3s": "CPU 推理",
    "analysis time": "分析耗时",
    "plant species": "适用作物",
    "start analysis": "开始识别",
    "ai disease analysis": "AI 病害分析",
    "ai model ready - upload an image to begin analysis": "模型已就绪，请上传一张作物图片",
    "drop your plant image here": "将作物图片拖到这里",
    "or click to browse files": "或点击选择文件",
    "supports jpg, png, webp formats": "支持 JPG、PNG、WebP，单张不超过 10 MB",
    "analyze plant health": "分析植物健康",
    "upload an image to get started": "请先上传图片",
    "ai is analyzing your plant...": "正在分析图片…",
    "compare with previous": "与上次结果对比",
    "diagnosis history": "识别历史",
    "high accuracy": "本地模型",
    "advanced machine learning algorithms for precise disease identification": "使用项目自带 PyTorch 模型进行初步识别",
    "instant results": "快速返回",
    "get comprehensive analysis within seconds of uploading": "上传后在本机完成推理，不上传第三方视觉服务",
    "treatment recommendations": "农艺管理建议",
    "detailed treatment suggestions and prevention tips": "提供通用田间管理建议，不虚构农药剂量",
    "multiple plant types": "支持类别",
    "support for various crops and plant species": "覆盖模型训练集中的 38 个作物/健康状态类别",
    "real farmers. real results.": "适用范围与限制",
    "farmer success stories & testimonials": "关于识别结果的正确理解",
    "supported plant types": "支持的植物类别",
    "comprehensive plant database": "模型类别说明",
    "diagnosis comparison": "诊断对比",
    "attribute": "项目",
    "previous diagnosis": "上次诊断",
    "current diagnosis": "本次诊断",
    "difference / change": "变化",
    "view all past scans": "查看全部历史记录",
    "review your past plant health diagnoses saved locally on your device. compare any previous scan with your current diagnosis.": "历史记录保存在本机浏览器中，可删除或用于对比。",
    "start analysis": "开始识别",
    "print": "打印",

    // 聊天
    "agribot": "AI 农业助手",
    "drop your crop or plant image here": "将作物图片拖到这里",
    "we'll analyze it for diseases and plant health recommendations": "可结合本地病害模型进行初步筛查",
    "ask me about agritech features or agriculture support": "咨询作物管理、施肥、灌溉或平台使用问题…",
    "welcome to agritech assistant!": "欢迎使用 AI 农业助手",
    "i'm powered by google gemini ai to help with all your farming questions and guide you through agritech platform features.": "我可以回答常见作物管理问题，并协助使用平台功能。未配置大模型时会明确使用本地规则库。",
    "what can i do on agritech?": "这个平台可以做什么？",
    "how to use crop recommendation?": "如何使用作物种植推荐？",
    "best crops for this season?": "当前季节适合种什么？",
    "organic pest control methods": "有机防控方法",
    "water conservation techniques": "节水灌溉方法",
    "soil health improvement": "如何改善土壤健康？",
    "how to use crop disease detection?": "如何使用病害识别？",
    "how does labour scheduling work?": "用工安排功能怎么用？",
    "how to access farmer forum?": "如何进入农户社区？",
    "how to check weather updates?": "在哪里查看农业气象？",
    "government schemes for farmers": "有哪些惠农政策？",
    "fertilizer recommendations": "科学施肥建议",
    "image attached": "已附加图片",
    "ready for ai crop diagnosis": "可进行作物图片初筛",
    "send": "发送",
    "crop diagnosis image": "作物诊断图片",
    "ask about crops or upload a photo...": "输入农业问题，或上传作物照片…",
    "chat input": "聊天输入框",
    "clear chat": "清空对话",

    // 天气
    "synchronizing...": "正在同步…",
    "connecting to satellite...": "正在连接气象数据…",
    "ai crop advisories": "AI 农事建议",
    "consulting intelligence engine...": "正在生成农事建议…",
    "search city": "搜索城市",
    "enter city name": "输入城市名称",
    "feels like": "体感温度",
    "pressure": "气压",
    "sunrise": "日出",
    "sunset": "日落",

    // 登录注册
    "login agritech": "登录农智云",
    "login to get started": "登录后使用完整功能",
    "forgot password?": "忘记密码？",
    "don't have an account?": "还没有账号？",
    "join agritech": "注册农智云",
    "create your account to get started": "创建账号，开始使用平台",
    "select your role": "选择用户角色",
    "🛒 buyer": "🛒 采购商",
    "🚜 farmer": "🚜 农户",
    "🔧 equipment shopkeeper": "🔧 农机服务商",
    "🏪 grocery shopkeeper": "🏪 生鲜零售商",
    "🎓 agricultural expert": "🎓 农技专家",
    "create account": "创建账号",
    "already have an account?": "已有账号？",
    "enter your full name": "请输入姓名或昵称",
    "only letters and spaces allowed": "支持中文、字母及常用姓名符号",
    "enter your email": "请输入邮箱",
    "create a strong password": "设置密码（至少 8 位，含大小写字母和数字）",
    "confirm your password": "再次输入密码",
    "enter your password": "请输入密码",
    "email address": "邮箱地址",
    "password": "密码",
    "full name": "姓名",
    "role": "角色",
    "forgot password": "找回密码",

    // 社区与资讯
    "discover": "发现",
    "fetching categories...": "正在加载分类…",
    "my reputation": "我的社区声望",
    "total points": "总积分",
    "new topic": "发布新话题",
    "crop protection": "作物保护",
    "posted by": "发布者",
    "• 2 hours ago": "· 2 小时前",
    "• 5 hours ago": "· 5 小时前",
    "• 1 day ago": "· 1 天前",
    "comments": "条评论",
    "views": "次浏览",
    "share": "分享",
    "soil health": "土壤健康",
    "equipment advice": "农机咨询",
    "agriai insights": "平台智能提示",
    "active": "运行中",
    "moderating content": "内容巡查",
    "trending topics": "热门话题",
    "real-time trends appearing soon...": "热门话题正在整理…",
    "start a conversation": "发起讨论",
    "discussion category": "讨论分类",
    "general farming": "综合种植",
    "topic title": "话题标题",
    "content details": "内容详情",
    "post discussion": "发布讨论",
    "search for experts, topics, or solutions...": "搜索专家、话题或解决方案…",
    "e.g. best organic fertilizer for wheat?": "例如：小麦有机肥怎么选？",
    "describe your question or share your knowledge here...": "描述你的问题，或分享经验…",
    "all news": "全部资讯",
    "market trends": "市场动态",
    "technology": "农业科技",
    "weather & climate": "气象与气候",
    "policy & government": "政策发布",
    "innovation": "创新实践",
    "sustainability": "绿色发展",
    "📭 no news found": "📭 暂无资讯",
    "check back soon for latest agricultural news and updates.": "稍后再来看看最新农业资讯。",
    "load more news": "加载更多资讯",
    "source:": "来源：",
    "read full article": "阅读全文",
    "search news articles...": "搜索资讯…",
    "stay informed with the latest agricultural news, market trends, and farming innovations worldwide.": "关注国内农业生产、市场动态与实用技术。",

    // 政策
    "check your scheme eligibility": "查询适配的惠农政策",
    "state": "省份",
    "india": "全国",
    "karnataka": "湖北省",
    "maharashtra": "河南省",
    "tamil nadu": "山东省",
    "uttar pradesh": "江苏省",
    "bihar": "四川省",
    "punjab": "黑龙江省",
    "haryana": "安徽省",
    "rajasthan": "湖南省",
    "madhya pradesh": "江西省",
    "telangana": "云南省",
    "andhra pradesh": "贵州省",
    "land holding (acres)": "经营面积（亩）",
    "find eligible schemes": "查询适配政策",
    "eligible schemes": "适配政策",
    "no eligible schemes found": "暂未找到匹配政策",
    "try changing the state or land holding to see matching schemes.": "可调整省份或经营面积后重新查询。政策信息请以主管部门最新公告为准。",
    "select language": "选择语言",
    "example: 2.5": "例如：2.5",

    // 通用措辞
    "try clearing some filters or turning off the \"in cart only\" filter to see more products.": "请尝试清除筛选条件，或关闭“仅看购物车”。",
    "please select a valid role": "请选择有效的用户角色",
    "please enter your full name": "请输入姓名",
    "please enter your email address": "请输入邮箱地址",
    "please create a password": "请设置密码",
    "weak password": "密码强度较弱",
    "fair password": "密码强度一般",
    "good password": "密码强度良好",
    "strong password": "密码强度较强",
    "creating account...": "正在创建账号…",
    "account created!": "账号创建成功！",
    "login successful!": "登录成功！",
    "something went wrong. please try again.": "操作失败，请稍后重试。",
    "invalid email or password.": "邮箱或密码不正确。",
    "email and password are required": "请输入邮箱和密码",
    "all fields are required": "请完整填写所有字段",
    "password must be at least 8 characters long": "密码至少需要 8 位字符",
    "password must contain at least one lowercase letter": "密码需要包含至少一个小写字母",
    "password must contain at least one uppercase letter": "密码需要包含至少一个大写字母",
    "password must contain at least one number": "密码需要包含至少一个数字",
    "invalid username/email or password": "邮箱/用户名或密码不正确",
    "please login to access this page.": "请先登录后再访问此页面。",
    "please log in to access this page.": "请先登录后再访问此页面。",
    "you don't have permission to view this page.": "当前账号没有访问该页面的权限。",
    "logout": "退出登录",
    "welcome back": "欢迎回来",
    "my profile": "个人资料",
    "order history": "历史订单",
    "my products": "我的商品",
    "add listing": "发布商品",
    "product name": "商品名称",
    "description": "描述",
    "quantity": "数量",
    "location": "所在地区",
    "my farm": "我的农场",
    "view details": "查看详情",
    "learn more": "了解更多",
    "read more": "阅读更多",
    "see all": "查看全部",
    "view all": "查看全部",
    "back": "返回",
    "filter": "筛选",
    "filters": "筛选条件",
    "sort by": "排序方式",
    "apply": "应用",
    "reset": "重置",
    "enabled": "已启用",
    "disabled": "已停用",
    "online": "在线",
    "offline": "离线",
    "success": "操作成功",
    "error": "操作失败",
    "warning": "提示",
    "unknown error": "未知错误",
    "plant": "植物",
    "healthy": "健康",
    "disease": "病害",
    "confidence": "置信度",
    "crop": "作物",
    "soil": "土壤",
    "water": "水分",
    "sunlight": "光照",
    "north field": "北区田块",
    "south field": "南区田块",
    "east field": "东区田块",
    "west field": "西区田块",
    "central hub": "中央枢纽",
    "main valve": "主阀门",
    "operational": "运行正常",
    "standby mode": "待机",
    "connection timeout": "连接超时",
    "low soil moisture detected": "检测到土壤含水率偏低",
    "all systems active": "系统运行正常",
    "ph levels normal": "pH 水平正常",
    "check power and network.": "请检查电源与网络。",
    "consider irrigation.": "建议结合墒情安排灌溉。",
  };

  // 构建期生成的离线补充词典（如存在），不进行任何运行时在线翻译。
  if (window.CN_EXTRA_TEXT && typeof window.CN_EXTRA_TEXT === "object") {
    Object.entries(window.CN_EXTRA_TEXT).forEach(([key, value]) => {
      if (key && value) TEXT[String(key).toLowerCase()] = value;
    });
  }

  // 中文 → 英文 反查表：保证动态插入的节点也能切回英文。
  const REVERSE = {};
  const EN_PACK = (window.translations && window.translations.en) || {};
  Object.entries(TEXT).forEach(([key, value]) => {
    if (typeof value === "string" && /[\u4e00-\u9fff]/.test(value)) {
      REVERSE[value] = EN_PACK[key] || key;
    }
  });
  if (window.CN_EXTRA_TEXT && typeof window.CN_EXTRA_TEXT === "object") {
    Object.entries(window.CN_EXTRA_TEXT).forEach(([key, value]) => {
      if (typeof value === "string" && /[\u4e00-\u9fff]/.test(value)) REVERSE[value] = key;
    });
  }

  const ATTR_TEXT = {
    "search...": "搜索…",
    "search products": "搜索商品",
    "filter by category": "按品类筛选",
    "filter by location": "按产地筛选",
    "switch to dark mode": "切换到深色模式",
    "switch to light mode": "切换到浅色模式",
    "toggle light/dark theme": "切换深浅色主题",
    "toggle theme": "切换主题",
    "close cart": "关闭购物车",
    "scroll to top": "回到顶部",
    "add to favorites": "加入收藏",
    "chat with us": "联系 AI 农业助手",
    "email address for newsletter": "订阅邮箱",
    "subscribe to newsletter": "订阅农事简报",
    "close menu": "关闭菜单",
    "open menu": "打开菜单",
    "search": "搜索",
    "close": "关闭",
    "chat input": "聊天输入框",
    "send message": "发送消息",
    "upload image": "上传图片",
    "logout": "退出登录",
    "login": "登录",
    "register": "注册",
    "previous slide": "上一张",
    "next slide": "下一张",
  };

  const originalText = new WeakMap();
  const originalAttrs = new WeakMap();
  let lang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
  if (lang === "zh") lang = "zh-CN";
  if (!["zh-CN", "en"].includes(lang)) lang = DEFAULT_LANG;
  // 兼容 index.html 中遗留的 currentLang 全局引用
  window.currentLang = lang === "en" ? "en" : "zh";

  function normalize(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function convertCurrency(value) {
    // 展示层兜底：按 1 INR ≈ 0.095 CNY 换算，并明确标注演示折算。
    return value.replace(/₹\s*([\d,]+(?:\.\d+)?)(?:\s*\/\s*(kg|quintal|liter|100g))?/gi, (_, amount, unit) => {
      const number = Number(String(amount).replace(/,/g, ""));
      if (!Number.isFinite(number)) return `¥${amount}`;
      const converted = number * 0.095;
      const unitMap = { kg: "/公斤", quintal: "/百公斤", liter: "/升", "100g": "/100克" };
      return `¥${converted.toFixed(converted >= 100 ? 0 : 2)}${unit ? unitMap[unit.toLowerCase()] || "" : ""}`;
    });
  }

  function translateString(value) {
    if (lang === "en") return value;
    const normalized = normalize(value);
    if (!normalized) return value;
    const exact = TEXT[normalized.toLowerCase()];
    if (exact) return exact;

    // 动态模板
    let match;
    if ((match = normalized.match(/^(\d+)\s+products?$/i))) return `${match[1]} 件商品`;
    if ((match = normalized.match(/^showing\s+(\d+)\s+of\s+(\d+)\s+products$/i))) return `显示第 ${match[1]} / ${match[2]} 件商品`;
    if ((match = normalized.match(/^page\s+(\d+)\s+of\s+(\d+)$/i))) return `第 ${match[1]} / ${match[2]} 页`;
    if ((match = normalized.match(/^min\s+([\d,.]+)\s*(kg|l|qt|quintal)$/i))) {
      const units = { kg: "公斤", l: "升", qt: "百公斤", quintal: "百公斤" };
      return `${match[1]} ${units[match[2].toLowerCase()]}起订`;
    }
    if ((match = normalized.match(/^(.+?)\s+scans? stored$/i))) return `已保存 ${match[1]} 条识别记录`;
    if ((match = normalized.match(/^(\d+)\s+comments?$/i))) return `${match[1]} 条评论`;
    if ((match = normalized.match(/^([\d.]+k?)\s+views$/i))) return `${match[1]} 次浏览`;
    if ((match = normalized.match(/^find\s+(\d+)\s+products?$/i))) return `找到 ${match[1]} 件商品`;
    if ((match = normalized.match(/^found\s+(\d+)\s+product\(s\)\s+matching\s+"(.+)"$/i))) return `找到 ${match[1]} 件与“${match[2]}”匹配的商品`;
    if ((match = normalized.match(/^no products found for\s+"(.+)"$/i))) return `未找到与“${match[1]}”匹配的商品`;
    if ((match = normalized.match(/^in cart only\s*\((\d+)\)$/i))) return `仅看购物车（${match[1]}）`;
    if ((match = normalized.match(/^(.+)\s+products$/i))) {
      const prefix = TEXT[match[1].toLowerCase()];
      if (prefix) return `${prefix}商品`;
    }
    if ((match = normalized.match(/^(\d+)\s*°c$/i))) return `${match[1]}℃`;
    if ((match = normalized.match(/^(\d+)\s*km\/h$/i))) return `${match[1]} 公里/小时`;
    if ((match = normalized.match(/^(\d+)\s*km$/i))) return `${match[1]} 公里`;
    if (value.includes("₹")) return convertCurrency(value);
    return value;
  }

  function shouldSkip(element) {
    if (!element) return true;
    const tag = element.tagName;
    return (
      ["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE"].includes(tag) ||
      element.closest("[data-no-i18n]") ||
      element.closest("#cn-language-switch")
    );
  }

  function translateTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || shouldSkip(node.parentElement)) return;
    const current = node.nodeValue;
    if (!normalize(current)) return;
    if (!originalText.has(node)) originalText.set(node, current);

    if (lang === "en") {
      const current = node.nodeValue;
      if (/[\u4e00-\u9fff]/.test(current) && REVERSE[current]) {
        node.nodeValue = REVERSE[current];
        originalText.set(node, REVERSE[current]);
        return;
      }
      const original = originalText.get(node);
      if (original !== undefined && current !== original) node.nodeValue = original;
      return;
    }

    let source = originalText.get(node);
    // 页面脚本更新过内容时，更新英文基线
    if (node.nodeValue !== translateString(source) && /[A-Za-z]/.test(node.nodeValue) && !/[\u4e00-\u9fff]/.test(node.nodeValue)) {
      source = node.nodeValue;
      originalText.set(node, source);
    }
    const translated = translateString(source);
    if (translated !== node.nodeValue) node.nodeValue = translated;
  }

  function translateAttributes(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE || shouldSkip(element)) return;
    const attributes = ["placeholder", "title", "aria-label", "alt"];
    attributes.forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      let saved = originalAttrs.get(element);
      if (!saved) {
        saved = {};
        originalAttrs.set(element, saved);
      }
      if (!(attribute in saved)) saved[attribute] = element.getAttribute(attribute);
      const source = saved[attribute];
      const translated = lang === "en" ? source : ATTR_TEXT[normalize(source).toLowerCase()] || translateString(source);
      if (translated && element.getAttribute(attribute) !== translated) {
        element.setAttribute(attribute, translated);
      }
    });
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) {
      translateAttributes(root);
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) translateTextNode(node);
    if (root.querySelectorAll) {
      root.querySelectorAll("[placeholder], [title], [aria-label], [alt]").forEach(translateAttributes);
    }
  }

  const originalTitle = document.title;

  function setDocumentLanguage() {
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
    document.documentElement.setAttribute("data-lang", lang);
    document.title = lang === "en" ? originalTitle : translateString(originalTitle);
  }

  function updateLanguageSelectors() {
    document.querySelectorAll("#current-lang-text, .current-lang-label, #navbarCurrentLang").forEach((element) => {
      element.textContent = lang === "en" ? "English" : "中文";
    });
    document.querySelectorAll(".lang-dropdown").forEach((dropdown) => {
      if (dropdown.querySelector(".cn-localized-option")) return;
      dropdown.innerHTML = `
        <div class="lang-option cn-localized-option" data-cn-lang="zh-CN"><span class="lang-flag">🇨🇳</span> 简体中文</div>
        <div class="lang-option cn-localized-option" data-cn-lang="en"><span class="lang-flag">🌐</span> English</div>
      `;
      dropdown.querySelectorAll("[data-cn-lang]").forEach((option) => {
        option.addEventListener("click", (event) => {
          event.preventDefault();
          setLanguage(option.dataset.cnLang);
          dropdown.classList.remove("active");
        });
      });
    });
  }

  function createSwitcher() {
    if (document.getElementById("cn-language-switch")) return;
    const switcher = document.createElement("div");
    switcher.id = "cn-language-switch";
    switcher.className = "cn-language-switch";
    switcher.setAttribute("aria-label", "语言选择");
    switcher.innerHTML = `
      <button type="button" data-cn-language="zh-CN" aria-label="切换到中文">中文</button>
      <span aria-hidden="true">/</span>
      <button type="button" data-cn-language="en" aria-label="Switch to English">EN</button>
    `;
    switcher.addEventListener("click", (event) => {
      const button = event.target.closest("[data-cn-language]");
      if (button) setLanguage(button.dataset.cnLanguage);
    });
    document.body.appendChild(switcher);
    syncSwitcher();
  }

  function syncSwitcher() {
    document.querySelectorAll("#cn-language-switch [data-cn-language]").forEach((button) => {
      button.classList.toggle("active", button.dataset.cnLanguage === lang);
      button.setAttribute("aria-pressed", String(button.dataset.cnLanguage === lang));
    });
  }

  function setLanguage(nextLang, options = {}) {
    lang = nextLang === "en" ? "en" : "zh-CN";
    localStorage.setItem(STORAGE_KEY, lang);
    LEGACY_KEYS.forEach((key) => localStorage.setItem(key, lang === "en" ? "en" : "zh"));
    document.cookie = `lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    window.currentLang = lang === "en" ? "en" : "zh";
    setDocumentLanguage();
    walk(document.body);
    updateLanguageSelectors();
    syncSwitcher();
    window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang } }));
    if (options.reload) window.location.reload();
  }

  let scheduled = false;
  const observer = new MutationObserver((mutations) => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") translateTextNode(mutation.target);
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE && node.id === "cn-language-switch") return;
          walk(node);
        });
      });
      updateLanguageSelectors();
    });
  });

  function start() {
    setDocumentLanguage();
    walk(document.body);
    createSwitcher();
    updateLanguageSelectors();
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  }

  window.cnI18n = {
    get language() { return lang; },
    setLanguage,
    translate: translateString,
    translations: TEXT,
  };
  window.i18nManager = window.cnI18n;
  window.setLanguage = setLanguage;
  window.platformLanguageChange = setLanguage;
  window.languagePlatformChange = setLanguage;
  window.updateContent = setLanguage;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
