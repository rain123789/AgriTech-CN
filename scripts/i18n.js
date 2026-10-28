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
    "📰 agriculture news & updates": "📰 农业资讯与动态",
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
  const normKey = (s) => String(s || "").replace(/\s+/g, " ").trim();
  // 词条 key 多为小写英文，回退时首字母大写，避免英文模式出现小写残片
  const prettyEn = (key) => {
    const value = normKey(key);
    if (!value) return value;
    if (/^[a-z]/.test(value) && !value.includes(" ")) return value.charAt(0).toUpperCase() + value.slice(1);
    return value;
  };
  Object.entries(TEXT).forEach(([key, value]) => {
    if (typeof value === "string" && /[\u4e00-\u9fff]/.test(value)) {
      REVERSE[normKey(value)] = normKey(EN_PACK[key]) || prettyEn(key);
    }
  });
  if (window.CN_EXTRA_TEXT && typeof window.CN_EXTRA_TEXT === "object") {
    Object.entries(window.CN_EXTRA_TEXT).forEach(([key, value]) => {
      if (typeof value === "string" && /[\u4e00-\u9fff]/.test(value)) {
        REVERSE[normKey(value)] = normKey(EN_PACK[key]) || prettyEn(key);
      }
    });
  }

  // 显式中文 → 规范英文（避免反查回退成小写 key 或残留中文）
  const REVERSE_EXTRA = {
    "平台能力": "Our Platform Benefits",
    "为农业产业链上的每一个角色提供实用工具与服务。": "Practical tools and services for every role in the agricultural value chain.",
    "农户": "Farmers",
    "采购商与零售商": "Buyers & Retailers",
    "农机服务商": "Equipment Suppliers",
    "生鲜零售商": "Grocery Sellers",
    "了解更多": "Learn More",
    "进入交易市场": "Marketplace",
    "对接供应商": "Partner with Suppliers",
    "全部文章": "All Posts",
    "种植技巧": "Farming Tips",
    "经营与市场": "Business & Market",
    "发现": "Discover",
    "我的声誉": "My Reputation",
    "总积分": "Total Points",
    "加载中...": "Loading...",
    "热门话题": "Trending Topics",
    "全部话题": "All Topics",
    "作物保护": "Crop Protection",
    "土壤与施肥": "Soil & Fertilizer",
    "农机与灌溉": "Machinery & Irrigation",
    "社区成员（演示）": "Community Member (Demo)",
    "平台助手": "Platform Assistant",
    "400-000-0000（演示）": "400-000-0000 (Demo)",
    "⚠️ 网络已断开": "⚠️ Network disconnected",
    "⚠️ 正在显示缓存数据，内容可能已过期": "⚠️ Showing cached data; content may be outdated",
    "经营面积（亩）": "Operating Area (mu)",
    "匹配结果": "Matching Results",
    "可调整省份后重新查询。所有政策信息均需以主管部门最新公告为准。": "Adjust the province and search again. All policy information is subject to the latest announcements from the competent authorities.",
    "规则库农艺工具": "Rule-based Agronomy Tool",
    "输入地块信息": "Enter Field Information",
    "以下数据仅在本机提交给本地 Flask 服务，不发送到第三方模型。": "Data is submitted only to the local Flask service and is not sent to third-party models.",
    "常见范围 3.5–10.0": "Typical range 3.5–10.0",
    "生育期": "Growth Stage",
    "苗期": "Seedling Stage",
    "营养生长期": "Vegetative Stage",
    "开花期": "Flowering Stage",
    "结果期": "Fruiting Stage",
    "近7天降雨量（毫米）": "Rainfall in the Last 7 Days (mm)",
    "近期平均气温（℃）": "Recent Average Temperature (℃)",
    "获取施肥建议": "Get Fertilizer Advice",
    "填写左侧信息后查看建议": "Fill in the form on the left to see advice",
    "结果为一般性规则建议，不是处方": "Results are general rule-based advice, not a prescription",
    "产地优选 · 本地演示": "Origin Selection · Local Demo",
    "2 件商品": "2 products",
    "1 件商品": "1 product",
    "3 件商品": "3 products",
    "本地演示价格 · 非实时行情": "Local Demo Prices · Not Real-time",
    "以下为本地维护的农产品样例价格，使用人民币计价，不代表真实成交价。": "Sample prices maintained locally in CNY; not actual transaction prices.",
    "¥6.80/公斤": "¥6.80/kg",
    "¥9.80/公斤": "¥9.80/kg",
    "演示环境不提供真实交易、在线支付或物流结算。": "This demo does not provide real transactions, online payment or logistics settlement.",
    "本地演示资讯：内容用于页面演示，不代表真实新闻或市场数据。": "Local demo news: for page demonstration only; not real news or market data.",
    "来源：": "Source: ",
  };
  Object.assign(REVERSE, REVERSE_EXTRA);

  // 长文页面（FAQ / 条款 / 隐私 / Cookie / 病害说明 / 联系 / 助手）中文 → 英文
  const REVERSE_PAGES = {
    /* ---------- faq.html ---------- */
    "没有找到匹配的问题，请更换关键词。": "No matching questions found. Please try another keyword.",
    "农智云是什么，能帮我做什么？": "What is AgriTech-CN and what can it do for me?",
    "农智云是 AgriTech 的中国大陆本地化演示版，围绕农户的日常经营提供四类工具：": "AgriTech-CN is the mainland-China localized demo of AgriTech. It offers four kinds of tools for the daily work of farming households:",
    "输入土壤与气候参数，由随机森林模型给出 22 类作物建议；": "enter soil and climate parameters and a random-forest model suggests one of 22 crop classes;",
    "科学施肥建议：": "Fertilizer Advice:",
    "按作物、土壤 pH 与生育期给出肥料方向与公斤/亩用量区间；": "gives fertilizer direction and kg-per-mu ranges by crop, soil pH and growth stage;",
    "农业气象与农事提示：": "Agro-Weather & Farming Tips:",
    "优先使用公开气象数据，并区分实时数据与演示数据；": "uses public weather data first and clearly separates live data from demo data;",
    "AI 农业助手：": "AI Farming Assistant:",
    "中文问答，可配置 DeepSeek，未配置时使用本地规则库。": "Chinese Q&A with optional DeepSeek; falls back to a local rule base when not configured.",
    "平台内的价格、天气样例、商家与订单均为本地演示数据，不提供真实交易结算。": "All prices, weather samples, merchants and orders on this platform are local demo data; no real transaction settlement is provided.",
    "如何注册账号？可以填中文姓名吗？": "How do I register? Can I use a Chinese name?",
    "在「注册」页选择角色，填写姓名或昵称、常用邮箱和密码即可。姓名支持中文、少数民族姓名间隔号与英文字符，长度 2–50 个字符；邮箱不再限制为 Gmail 等特定服务商。": "Pick a role on the Register page and fill in your name or nickname, a valid email and a password. Names may contain Chinese characters, the ethnic-name middle dot and Latin letters, 2–50 characters long. Email addresses are no longer limited to Gmail or any specific provider.",
    "密码至少 8 位，并同时包含大写字母、小写字母和数字。账号保存在本机 SQLite 数据库中，密码以安全哈希保存。": "Passwords must be at least 8 characters and include upper-case letters, lower-case letters and digits. Accounts are stored in the local SQLite database with securely hashed passwords.",
    "平台收费吗？": "Is the platform free to use?",
    "本地演示版不收取任何费用，页面浏览、模型推理与账号功能均可直接使用。若自行配置在线大模型，会产生对应服务商的调用费用。": "The local demo is free of charge: browsing, model inference and account features are all available at no cost. If you configure an online LLM yourself, that provider's usage fees apply.",
    "使用平台": "Using the Platform",
    "农产品交易市场如何使用？": "How do I use the Marketplace?",
    "支持按关键词、品类和产地筛选，可按价格、评分、距离或最新排序；点击商品卡查看详情，加入购物车后可调整批次数量、查看预估合计并删除。购物车保存在浏览器本地，刷新后依然保留。": "Filter by keyword, category and origin, and sort by price, rating, distance or newest. Click a product card for details; after adding to the cart you can adjust batch quantities, see the estimated total and remove items. The cart is stored in your browser and survives a refresh.",
    "平台不提供支付、物流与担保，所有商品与商家均为演示样例。": "The platform provides no payment, logistics or escrow; all products and merchants are demo samples.",
    "AI 助手没有联网还能用吗？": "Does the AI assistant work without an internet connection?",
    "可以。未配置": "Yes. When it is not configured",
    "或请求失败时，助手会切换到本地中文规则库，覆盖水稻、小麦、玉米、番茄、施肥、灌溉、病虫害与行情等主题，并在回答中明确标注来源；未覆盖的问题会直说知识库没有覆盖。": "or a request fails, the assistant switches to the local Chinese rule base covering rice, wheat, maize, tomato, fertilization, irrigation, pests and market topics, and labels the source in every answer. Questions outside its scope are answered with an explicit “not covered by the knowledge base”.",
    "图片识别为什么提示不可用？": "Why does image recognition show as unavailable?",
    "上游随附的 PlantVillage 38 类权重存在缺陷：对项目自带的番茄早疫病、马铃薯早疫病、玉米锈病、苹果黑星病等不同样本，均输出同一「健康」类别且置信度接近 100%。": "The bundled PlantVillage 38-class weights are defective: for different bundled samples such as tomato early blight, potato early blight, maize rust and apple scab, they all output the same “healthy” class with near-100% confidence.",
    "为避免误导，系统默认禁用该模型并明确提示，而不是给出看似专业却不可靠的诊断结论。": "To avoid misleading users, the system disables that model by default with a clear notice instead of returning a professional-looking but unreliable diagnosis.",
    "数据与安全": "Data & Security",
    "我的数据保存在哪里？": "Where is my data stored?",
    "账号与偏好保存在本机 SQLite 数据库和浏览器本地存储中，不上传到 Firebase 等海外服务。商品、气象与社区内容均为本地演示数据。": "Accounts and preferences are stored in the local SQLite database and browser storage; nothing is uploaded to Firebase or other overseas services. Products, weather and community content are all local demo data.",
    "模型结论可以直接用于生产决策吗？": "Can model results be used directly for production decisions?",
    "不可以。作物推荐与病害识别模型使用公开数据训练，尚未用中国田间数据验证，只适合作为初筛参考。涉及农药时必须核对在中国登记的作物、防治对象、标签剂量与安全间隔期。": "No. The crop-recommendation and disease-detection models are trained on public datasets and have not been validated with Chinese field data, so they are only suitable as a first-pass reference. For any pesticide, always verify the crops, target pests, label dose and pre-harvest interval registered in China.",
    "惠农政策信息准确吗？": "Is the farm policy information accurate?",
    "政策页只提供方向性入口并链接农业农村部、财政部等官方站点，不写具体补贴金额、资格与截止日期。实际申报请以属地主管部门最新公告为准。": "The policy pages only provide pointers and links to official sites such as the Ministry of Agriculture and Rural Affairs and the Ministry of Finance; they do not state specific subsidy amounts, eligibility or deadlines. For actual applications, follow the latest announcements from your local competent authority.",
    "语言与界面": "Language & Interface",
    "可以切换成英文吗？": "Can I switch to English?",
    "可以。页面左下角提供「中文 / EN」切换，选择会保存在浏览器中，刷新与跨页面跳转后保持。默认语言为简体中文。": "Yes. A “中文 / EN” switch is available in the bottom-left corner; your choice is saved in the browser and persists across refreshes and page changes. Simplified Chinese is the default.",
    "页面提示的“演示数据”是什么意思？": "What does the “demo data” label mean?",
    "表示该内容由本项目本地编写，用于展示界面与交互，不代表实时行情、真实成交或官方结论。真实使用前请以当地主管部门、气象台和农技部门的信息为准。": "It means the content was written locally for this project to demonstrate the interface and interactions. It is not live market data, a real transaction or an official conclusion. Before real use, rely on your local authorities, weather bureau and agricultural extension service.",
    "还有其他问题？": "Still have questions?",
    "没有找到需要的答案？可以联系支持团队，或在 AI 助手中继续追问。": "Didn't find the answer you need? Contact the support team or keep asking in the AI assistant.",
    "询问 AI 助手": "Ask the AI Assistant",

    /* ---------- terms-and-service.html ---------- */
    "使用农智云本地演示版前，请阅读以下说明": "Please read the following before using the AgriTech-CN local demo",
    "最后更新：2026 年 10 月 25 日": "Last updated: October 25, 2026",
    "目录": "Contents",
    "1. 条款接受": "1. Acceptance of Terms",
    "2. 服务范围": "2. Scope of Service",
    "3. 用户账号": "3. User Accounts",
    "4. 使用规范": "4. Acceptable Use",
    "5. 知识产权": "5. Intellectual Property",
    "6. 隐私与数据": "6. Privacy & Data",
    "7. AI 与模型边界": "7. AI & Model Boundaries",
    "8. 市场演示": "8. Marketplace Demo",
    "9. 责任限制": "9. Limitation of Liability",
    "10. 终止使用": "10. Termination",
    "11. 条款变更": "11. Changes to These Terms",
    "12. 联系方式": "12. Contact",
    "重要说明：": "Important:",
    "本项目是开源 AgriTech 的中国大陆本地化演示版本，不是经过金融、医疗或政务许可的生产系统。页面中的价格、商家、订单、模型类别与天气均按界面标识区分演示数据和实际模型输出。": "This project is the mainland-China localized demo of the open-source AgriTech project and is not a production system licensed for financial, medical or government services. Prices, merchants, orders, model classes and weather on the pages are labelled in the interface to distinguish demo data from actual model output.",
    "访问或使用本平台即表示你理解并同意本条款。如不同意，请停止使用。演示环境中的账号、商品和交易记录不得用于真实商业结算。": "By accessing or using this platform you confirm that you understand and accept these terms. If you do not agree, please stop using it. Accounts, products and transaction records in the demo must not be used for real commercial settlement.",
    "使用项目自带随机森林模型，基于土壤与气候参数输出 22 个作物类别之一。": "Uses the bundled random-forest model to output one of 22 crop classes from soil and climate parameters.",
    "基于作物养分需求与土壤 pH 的规则库，不声称是机器学习诊断。": "A rule base driven by crop nutrient requirements and soil pH; it does not claim to be a machine-learning diagnosis.",
    "使用 PlantVillage 38 类 PyTorch 权重；自检失败时自动禁用。": "Uses PlantVillage 38-class PyTorch weights; automatically disabled if the self-check fails.",
    "优先使用配置的 DeepSeek 兼容接口，失败时降级为本地规则库并明确提示。": "Prefers the configured DeepSeek-compatible endpoint and falls back to the local rule base with a clear notice on failure.",
    "本地演示商品、筛选与购物车交互，不提供真实支付或物流。": "Local demo products, filtering and cart interactions; no real payment or logistics.",
    "农业气象与政策：": "Agro-Weather & Policy:",
    "优先使用公开气象数据或官方政策入口；无法获取时明确标注演示数据。": "Uses public weather data or official policy entry points first; labels demo data clearly when unavailable.",
    "注册需提供有效邮箱、姓名或昵称及符合强度要求的密码。账号保存在本机 SQLite 数据库，密码使用安全哈希。你应妥善保管账号密码，不得冒用他人身份或绕过角色权限。": "Registration requires a valid email, a name or nickname and a password that meets the strength rules. Accounts are stored in the local SQLite database with hashed passwords. You are responsible for keeping your credentials safe and must not impersonate others or bypass role permissions.",
    "不得上传违法、侵权或恶意内容；不得尝试攻击服务、绕过限流、批量注册或获取他人数据。发现安全问题时请负责任地联系维护者。": "Do not upload unlawful, infringing or malicious content; do not attempt to attack the service, bypass rate limits, bulk-register accounts or obtain other users' data. Please report security issues responsibly to the maintainers.",
    "原 AgriTech 项目遵循仓库中的 MIT 许可证。第三方图标、字体、数据集和模型保留各自许可。中国本土化修改保留原项目署名与版本追溯信息，不改变原始许可义务。": "The original AgriTech project follows the MIT licence in its repository. Third-party icons, fonts, datasets and models retain their own licences. The China localization keeps the original attribution and version history and does not alter the original licence obligations.",
    "数据处理方式详见": "For details on how data is handled, see",
    "。API Key 只保存在服务端环境变量，不下发到浏览器。请勿在演示环境录入真实身份证号、银行卡或敏感商业数据。": ". API keys are kept only in server-side environment variables and are never sent to the browser. Do not enter real ID numbers, bank card details or sensitive business data into the demo.",
    "作物推荐与病害识别模型使用公开农业数据集，尚未用中国田间数据验证。模型输出不构成农艺、植保、金融或法律结论。涉及农药时必须核对在中国登记的作物、防治对象、标签剂量和安全间隔期。政策补贴、贷款与保险信息须以主管部门或经办机构最新公告为准。": "The crop-recommendation and disease-detection models use public agricultural datasets and have not been validated with Chinese field data. Their output is not agronomic, plant-protection, financial or legal advice. For any pesticide, verify the crops, target pests, label dose and pre-harvest interval registered in China. Policy subsidy, loan and insurance information is subject to the latest announcements from the competent authority or handling institution.",
    "商城中的商品、商家、库存、评分和价格均为本地演示样例，不代表实时行情或真实成交。平台不参与支付、担保、物流和售后，也不对线下交易作信用背书。": "Products, merchants, stock, ratings and prices in the marketplace are local demo samples and do not represent live market data or real transactions. The platform takes no part in payment, escrow, logistics or after-sales service and does not vouch for offline transactions.",
    "本演示按“现状”提供。维护者不对因依赖模型输出、演示数据、第三方接口中断或使用者误操作造成的直接或间接损失承担责任。生产使用前应完成独立验证、合规评估和安全加固。": "This demo is provided “as is”. The maintainers accept no liability for direct or indirect losses arising from reliance on model output or demo data, interruption of third-party endpoints, or user error. Before production use, complete independent validation, compliance review and security hardening.",
    "如发现滥用、攻击或违法行为，维护者可停止相关服务或删除测试数据。你可随时退出登录并清除浏览器存储。": "If abuse, attacks or unlawful behaviour are detected, the maintainers may suspend the relevant service or delete test data. You may log out and clear browser storage at any time.",
    "条款会随功能调整更新，更新日期显示在页面顶部。继续使用更新后的版本视为接受修改。": "These terms are updated as features change; the update date is shown at the top of the page. Continued use of the updated version means you accept the changes.",
    "演示环境联系邮箱：": "Demo contact email:",
    "（示例地址，不实际收信）。原项目地址：": "(a sample address that does not receive mail). Original project:",
    "确认": "Confirm",
    "继续使用本平台即表示你已阅读并理解以上条款，以及页面中关于演示数据和模型适用范围的说明。": "By continuing to use this platform you confirm that you have read and understood these terms and the notes on this page about demo data and the scope of the models.",

    /* ---------- privacy-policy.html ---------- */
    "隐私保护概览": "Privacy Overview",
    "本政策说明农智云本地演示版如何收集、使用、存储和保护账号、商城交互及 AI 辅助功能中的数据。": "This policy explains how the AgriTech-CN local demo collects, uses, stores and protects data in accounts, marketplace interactions and AI-assisted features.",
    "更新日期：2026 年 10 月 25 日": "Updated: October 25, 2026",
    "Cookie 与本地存储": "Cookies & Local Storage",
    "不出售个人数据": "No Sale of Personal Data",
    "本项目是 AgriTech 的中国大陆本地化演示版本。核心页面和账号数据默认保存在本机 SQLite 数据库；不会因为演示而将个人数据出售给第三方。": "This project is the mainland-China localized demo of AgriTech. Core pages and account data are kept in the local SQLite database by default; personal data is never sold to third parties.",
    "最小化收集": "Minimal Collection",
    "仅处理注册、登录和功能演示所必需的信息。": "Only the information needed for registration, login and feature demos is processed.",
    "用户可控": "User Control",
    "你可以清除浏览器存储、退出登录或联系维护者删除本地账号。": "You can clear browser storage, log out, or contact the maintainers to delete your local account.",
    "边界透明": "Transparent Boundaries",
    "AI 在线/离线状态、演示数据和模型限制均在界面明确标注。": "AI online/offline status, demo data and model limitations are all clearly labelled in the interface.",
    "1. 我们处理的信息": "1. Information We Process",
    "账号信息：姓名或昵称、邮箱、角色、所在地区和加密后的密码摘要。": "Account data: name or nickname, email, role, region and a hashed password digest.",
    "功能输入：作物参数、施肥条件、聊天文字以及你主动上传的作物图片。": "Feature input: crop parameters, fertilization conditions, chat text and any crop images you upload.",
    "本地偏好：语言、主题、购物车和识别历史等浏览器本地存储。": "Local preferences: language, theme, cart and detection history in browser storage.",
    "运行日志：本地服务为排查错误可能记录请求路径和异常信息，不包含明文密码。": "Runtime logs: the local service may record request paths and error details for troubleshooting; plain-text passwords are never logged.",
    "2. 使用目的": "2. Purposes of Use",
    "验证账号身份、维持登录状态并应用角色权限。": "Verify account identity, keep you signed in and apply role permissions.",
    "执行作物推荐、施肥建议、病害初步筛查和 AI 农业问答。": "Run crop recommendation, fertilizer advice, preliminary disease screening and AI farming Q&A.",
    "保存购物车、语言与主题偏好，改善页面体验。": "Remember your cart, language and theme preferences to improve the page experience.",
    "定位程序错误、检查接口状态和维护演示稳定性。": "Diagnose program errors, check endpoint status and keep the demo stable.",
    "3. AI 与第三方服务": "3. AI & Third-Party Services",
    "配置 DeepSeek API Key 后，文字问题和必要的上下文会发送到你配置的模型服务用于生成回答。API Key 仅保存在服务端环境变量中，不会写入前端。": "Once a DeepSeek API key is configured, your text questions and the necessary context are sent to the model service you configured in order to generate answers. The API key is stored only in server-side environment variables and is never written to the frontend.",
    "未配置 API Key 或请求失败时，系统使用本地规则库并明确标注“离线规则回答”。": "When no API key is configured or a request fails, the system uses the local rule base and labels the reply “offline rule-based answer”.",
    "图片识别由本机模型执行；模型不可用时会禁用识别，不会把图片描述冒充为诊断结果。": "Image recognition runs on the local model; when the model is unavailable recognition is disabled, and an image caption is never passed off as a diagnosis.",
    "演示页面不接入支付、征信、短信或真实物流服务。": "The demo pages are not connected to payment, credit-reporting, SMS or real logistics services.",
    "4. Cookie 与本地存储": "4. Cookies & Local Storage",
    "站点使用必要的本地存储保存语言、主题、登录会话、购物车和识别历史。你也可以在浏览器中清除这些数据，但登录状态和购物车会随之丢失。": "The site uses essential local storage for language, theme, login session, cart and detection history. You can clear this data in your browser, but the login state and cart will be lost with it.",
    "本演示不接入第三方广告或行为追踪脚本。": "This demo includes no third-party advertising or behavioural tracking scripts.",
    "5. 安全与保存期限": "5. Security & Retention",
    "密码使用 Werkzeug 安全哈希保存，接口按角色校验令牌。本地演示数据默认保留在本机，直到你删除数据库或清除相应记录。任何系统都不能保证绝对安全，请勿在演示环境录入真实敏感信息。": "Passwords are stored with Werkzeug secure hashing and endpoints validate tokens by role. Local demo data stays on this machine until you delete the database or the relevant records. No system can guarantee absolute security, so please do not enter real sensitive information into the demo.",
    "6. 你的权利": "6. Your Rights",
    "查看和更正账号资料，或退出当前登录。": "View and correct your account details, or log out.",
    "清除浏览器本地存储、购物车记录和识别历史。": "Clear browser storage, cart records and detection history.",
    "联系维护者删除本地 SQLite 中的测试账号和相关数据。": "Contact the maintainers to delete test accounts and related data from the local SQLite database.",
    "7. 政策更新与联系": "7. Policy Updates & Contact",
    "本政策可能随着功能调整更新，更新日期会显示在本页。演示环境联系邮箱：": "This policy may be updated as features change; the update date is shown on this page. Demo contact email:",
    "（示例地址，不会实际收信）。": "(a sample address that does not receive mail).",
    "查看服务条款": "View Terms of Service",

    /* ---------- disease.html ---------- */
    "植物病害": "Plant Disease",
    "初步识别": "Preliminary Screening",
    "上传清晰的叶片照片，由本机 PyTorch 模型在 38 个公开数据集类别上做初步筛查。模型未使用中国田间数据验证，结果不能替代当地农技或植保部门诊断。": "Upload a clear leaf photo for preliminary screening by a local PyTorch model over 38 public-dataset classes. The model has not been validated with Chinese field data; the result cannot replace a diagnosis by your local extension or plant-protection service.",
    "38 类": "38 classes",
    "本地": "Local",
    "推理方式": "Inference",
    "未验证": "Not validated",
    "中国田间数据": "Chinese field data",
    "了解范围": "Scope",
    "正在检查本地模型状态…": "Checking local model status…",
    "将作物叶片图片拖到这里": "Drag a crop leaf image here",
    "请先上传一张作物图片": "Please upload a crop image first",
    "正在运行本地模型…": "Running the local model…",
    "使用边界与拍摄规范": "Usage Boundaries & Photo Guidelines",
    "模型能力与限制": "Model Capabilities & Limits",
    "以下说明用于帮助正确理解识别结果。平台不展示无法核实的增产或降本案例。": "These notes help you read the results correctly. The platform does not show unverifiable yield-gain or cost-saving cases.",
    "本地 38 类模型": "Local 38-class model",
    "PlantVillage 公开数据集": "PlantVillage public dataset",
    "“模型覆盖 38 个作物与健康状态类别，但并非中国全部作物病害。若权重自检失败，系统会禁用推理，不返回猜测结果。”": "“The model covers 38 crop and health-status classes, not every crop disease in China. If the weight self-check fails, the system disables inference instead of returning a guess.”",
    "类别：38": "Classes: 38",
    "用途：初步筛查": "Use: preliminary screening",
    "诊": "Dx",
    "不能替代田间诊断": "Cannot replace field diagnosis",
    "当地农技推广 / 植保部门": "Local extension / plant protection service",
    "“图片识别无法替代田间症状、栽培条件和实验室检测。发现疑似检疫性病害，应立即向当地植保机构报告。”": "“Image recognition cannot replace field symptoms, growing conditions and laboratory tests. If a quarantine pest or disease is suspected, report it to the local plant-protection agency immediately.”",
    "药剂：核对登记标签": "Pesticide: check the registered label",
    "剂量：不自动生成": "Dose: not auto-generated",
    "拍": "Photo",
    "拍摄建议": "Photo Guidelines",
    "叶片正反面 + 整株 + 田间环境": "Both leaf surfaces + whole plant + field context",
    "“建议记录发生面积、天气和已采取措施。仅凭一张模糊照片无法可靠判断，系统在低置信度时也会提示复核。”": "“Record the affected area, weather and measures already taken. A single blurry photo is not enough for a reliable judgement, and the system asks for a review when confidence is low.”",
    "格式：JPG / PNG / WebP": "Format: JPG / PNG / WebP",
    "大小：不超过 10 MB": "Size: up to 10 MB",

    /* ---------- cookie-policy.html ---------- */
    "Cookie 使用说明": "Cookie Notice",
    "农智云只使用维持登录、记住偏好和保存演示购物车所必需的 Cookie 与浏览器本地存储，不接入广告追踪。": "AgriTech-CN uses only the cookies and browser storage needed to keep you signed in, remember preferences and hold the demo cart. No advertising tracking is involved.",
    "1. 必要存储": "1. Essential Storage",
    "登录状态：": "Login state:",
    "保存本地会话信息，以便在页面之间保持登录。": "Stores local session information so you stay signed in across pages.",
    "语言与主题：": "Language & theme:",
    "保存简体中文/English 和深浅色偏好。": "Stores your Chinese/English and light/dark preference.",
    "购物车：": "Cart:",
    "保存本地演示商品和数量，刷新页面后仍可查看。": "Stores demo items and quantities so the cart survives a refresh.",
    "识别历史：": "Detection history:",
    "仅在你使用病害识别并产生结果后保存在浏览器中。": "Saved in your browser only after you run disease detection and get a result.",
    "2. 如何管理": "2. How to Manage",
    "你可以通过浏览器设置清除本站 Cookie 和本地存储。清除后，登录状态、语言偏好和购物车会重置。演示站点不提供跨站广告 Cookie。": "You can clear this site's cookies and local storage in your browser settings. Doing so resets your login state, language preference and cart. The demo site sets no cross-site advertising cookies.",
    "3. 第三方请求": "3. Third-Party Requests",
    "核心页面已本地化字体、图标和图表脚本。若配置在线大模型，服务端会向你指定的模型接口发送问答内容；浏览器端不会直接持有 API Key。": "Core pages use locally hosted fonts, icons and chart scripts. If an online LLM is configured, the server sends your Q&A content to the model endpoint you specified; the browser never holds the API key directly.",
    "查看隐私政策": "View Privacy Policy",

    /* ---------- index.html ---------- */
    "与": "and",
    "用数字工具和顺畅协作，让生产更高效、交易更透明。": "Digital tools and smooth collaboration for more efficient production and more transparent trade.",
    "🌾 获取作物种植建议": "🌾 Get Crop Recommendations",
    "🧪 科学施肥建议": "🧪 Fertilizer Advice",
    "🔬 病害识别": "🔬 Disease Detection",
    "👩‍🌾 农户社区": "👩‍🌾 Farmer Community",
    "销售收入": "Sales Revenue",
    "¥0 / 百公斤（演示）": "¥0 / quintal (demo)",
    "支出合计": "Total Expenses",
    "收支构成": "Revenue & Expense Breakdown",

    /* ---------- contact.html ---------- */
    "邮件支持": "Email Support",
    "电话支持": "Phone Support",
    "立即加入": "Join Now",
    "姓名 *": "Full Name *",
    "姓 *": "Surname *",
    "邮箱地址 *": "Email Address *",
    "主题 *": "Subject *",
    "留言内容 *": "Message *",
    "发送留言": "Send Message",

    /* ---------- chat.html ---------- */
    "可结合本地病害模型进行初步筛查，结果仅供参考": "Preliminary screening with the local disease model; results are for reference only",
    "咨询作物管理、施肥、灌溉或平台使用问题": "Ask about crop management, fertilization, irrigation or using the platform",
    "正在检查 AI 模式…": "Checking AI mode…",
    "我可以回答水稻、小麦、玉米、番茄等常见作物管理问题。未配置大模型时会明确使用本地规则库，不会把关键词匹配冒充模型诊断。": "I can answer common crop-management questions about rice, wheat, maize and tomato. Without an LLM configured I use the local rule base explicitly and never pass keyword matching off as a model diagnosis.",
    "有哪些有机防控方法？": "What organic control methods are available?",
    "如何做好节水灌溉？": "How do I irrigate while saving water?",

    /* ---------- marketplace.html ---------- */
    "浏览产地农产品样例，按品类、地区与价格筛选。页面数据为本地演示数据，不代表实时行情或真实成交。": "Browse sample produce by origin and filter by category, region and price. Page data is local demo data, not live market data or real transactions.",
    "本周 +5%（演示）": "+5% this week (demo)",
    "本周 -2%（演示）": "-2% this week (demo)",

    /* ---------- fertilizer.html ---------- */
    "根据作物类型、土壤 pH、生育期与近期降雨给出一般性施肥方向。建议先测土配方，再结合目标产量与当地肥料登记信息确定用量。": "Gives general fertilizer direction based on crop type, soil pH, growth stage and recent rainfall. Start with a soil test, then set the rate from your target yield and local fertilizer registration information.",

    /* ---------- 动态文本：marketplace-cn.js ---------- */
    "预估合计": "Estimated Total",
    "起订量": "MOQ",
    "商家": "Seller",
    "可供货量": "Available",
    "数据性质": "Data nature",
    "本地演示样例": "Local demo sample",
    "价格为演示数据，不代表实时行情或真实成交价。平台不提供在线支付与物流结算。": "Prices are demo data, not live market quotes or real transaction prices. The platform provides no online payment or logistics settlement.",
    "继续浏览": "Keep Browsing",
    "本地演示数据：": "Local demo data:",
    "商品、商家、价格与库存均为中国大陆样例，不代表实时行情或真实交易。": "Products, sellers, prices and stock are mainland-China samples and do not represent live quotes or real transactions.",
    "商品详情": "Product Details",
    "已加入购物车，按起订量计价。": "Added to cart; priced by minimum order quantity.",
    "已从购物车移除该商品。": "Removed from cart.",
    "购物车为空，无法结算。": "Your cart is empty, so checkout is unavailable.",
    "演示环境不提供支付和物流结算，本页仅验证购物车交互。": "The demo provides no payment or logistics settlement; this page only exercises cart interactions.",

    /* ---------- 动态文本：disease.js ---------- */
    "模型自检失败 · 暂不可识别": "Model self-check failed · detection unavailable",
    "风险提示：": "Risk notice:",
    "适用范围：": "Scope:",
    "🌿 通用农艺管理建议": "🌿 General Agronomic Advice",
    "具体药剂须核对在中国登记的作物、防治对象、标签剂量和安全间隔期，不得凭图片识别自行用药。": "For any specific pesticide, verify the crops, target pests, label dose and pre-harvest interval registered in China; never apply chemicals based on an image result alone.",
    "本地病害模型自检失败，图片识别已禁用；请查看页面说明，不能替代田间诊断。": "The local disease model failed its self-check, so image detection is disabled. See the page notes: it cannot replace field diagnosis.",
    "本地模型已就绪，请上传清晰叶片图片": "The local model is ready — upload a clear leaf photo",

    /* ---------- 动态文本：chat.js ---------- */
    "我可以回答常见作物管理问题。未配置大模型时会明确使用本地规则库，不会把关键词匹配冒充模型诊断。": "I can answer common crop-management questions. Without an LLM configured I use the local rule base explicitly and never pass keyword matching off as a model diagnosis.",
    "请选择有效的图片文件（PNG、JPEG 或 WebP）。": "Please choose a valid image file (PNG, JPEG or WebP).",
    "图片超过 10 MB，请压缩后重试。": "The image is over 10 MB. Please compress it and try again.",
    "消息过长，请控制在 1000 字以内。": "The message is too long. Please keep it under 1000 characters.",

    /* ---------- 动态文本：登录 / 注册 ---------- */
    "密码至少需要 8 位字符。": "The password must be at least 8 characters.",
    "💡 开": "💡 On",
    "💡 关": "💡 Off",
    "正在登录…": "Signing in…",

    /* ---------- 动态文本：voice-input.js ---------- */
    "在线（DeepSeek 兼容接口）": "Online (DeepSeek-compatible endpoint)",
    "正在朗读…": "Reading aloud…",
    "语音农事助手": "Voice Farming Assistant",
    "🌾 AI 农业语音助手": "🌾 AI Agricultural Voice Assistant",

    /* ---------- 动态文本：weather_dashboard.js ---------- */
    "本地建议服务暂时不可用，请确认后端已启动。": "The local advisory service is temporarily unavailable; please make sure the backend is running.",
    "暂无农事建议。演示模式不提供基于个人地块的实时建议。": "No farming advisories yet. Demo mode does not provide plot-specific live advice.",
    "生成于": "Generated at",
    "反馈": "Feedback",

    /* ---------- 动态文本：index.js / blog.js / forum.js / notifications.js ---------- */
    "⚠️ 网络已断开，正在使用离线缓存": "⚠️ Network offline — using cached data",
    "📶 当前网络较慢，加载可能延迟": "📶 Slow network — loading may be delayed",
    "演示数据：以下经营数据仅用于展示交互，不代表真实交易。": "Demo data: the figures below only demonstrate the interaction and are not real transactions.",
    "深色模式": "Dark mode",
    "浅色模式": "Light mode",
    "正在加载话题…": "Loading topics…",
    "暂无通知": "No notifications",
    "加载更多文章": "Load More Posts",
    "内蒙古自治区": "Inner Mongolia",

    /* ---------- /crop/ 蓝图模板 ---------- */
    "面向现代农业的作物种植推荐": "Crop Recommendation for Modern Agriculture",
    "输入土壤养分与气候参数，由项目自带的随机森林模型给出作物建议。模型使用印度公开农业数据训练，尚未用中国田间数据验证，结果仅作演示参考。": "Enter soil nutrient and climate parameters and the bundled random-forest model suggests crops. The model is trained on public Indian agricultural data and has not been validated with Chinese field data; results are for demonstration only.",
    "数据辅助决策": "Data-Assisted Decisions",
    "基于土壤养分与气候条件给出作物匹配建议，不承诺增产比例。": "Suggests matching crops from soil nutrients and climate conditions, without promising any yield increase.",
    "保持土壤健康": "Keep Soil Healthy",
    "结合轮作与养分管理，减少盲目施肥。": "Combine rotation with nutrient management to cut blind fertilization.",
    "模型范围透明": "Transparent Model Scope",
    "公开 22 个作物类别，并明确展示适用范围。": "Discloses 22 crop classes and clearly states the scope of use.",
    "获取作物种植建议": "Get Crop Recommendations",
    "请填写土壤与气候参数。所有输入仅在本机 Flask 服务中计算。": "Please fill in the soil and climate parameters. All inputs are computed only by the local Flask service.",
    "氮含量（N）": "Nitrogen (N)",
    "磷含量（P）": "Phosphorus (P)",
    "钾含量（K）": "Potassium (K)",
    "平均温度": "Average Temperature",
    "相对湿度": "Relative Humidity",
    "土壤 pH": "Soil pH",
    "年降雨量": "Annual Rainfall",
    "常见范围：0–140 kg/ha": "Typical range: 0–140 kg/ha",
    "常见范围：5–145 kg/ha": "Typical range: 5–145 kg/ha",
    "常见范围：5–205 kg/ha": "Typical range: 5–205 kg/ha",
    "常见范围：8–45℃": "Typical range: 8–45℃",
    "常见范围：14–100%": "Typical range: 14–100%",
    "常见范围：3.5–10.0": "Typical range: 3.5–10.0",
    "常见范围：20–300 mm": "Typical range: 20–300 mm",
    "返回工作台": "Back to Dashboard",
    "🌿 推荐作物": "🌿 Recommended Crop",
    "模型类别：": "Model class: ",
    "根据土壤与气候参数得到的模型建议": "Model suggestion based on soil and climate parameters",
    "适用范围提示：": "Scope notice:",
    "。结果可靠性下降，请结合当地试种与农技意见。": ". Reliability is reduced; combine with local trial planting and agronomic advice.",
    "模型使用印度公开农业数据训练，共 22 个作物类别；尚未用中国田间数据验证。本结果仅作演示参考，不构成生产决策。": "The model is trained on public Indian agricultural data across 22 crop classes and has not been validated with Chinese field data. This result is for demonstration only and is not a production decision.",
    "📄 下载分析报告": "📄 Download Analysis Report",
    "🔄 重新评估": "🔄 Re-evaluate",
    "🔙 返回主站": "🔙 Back to Home",
    "模型辅助": "Model-assisted",
    "数据驱动": "Data-driven",
    "优化建议": "Suggestions",
  };
  Object.assign(REVERSE, REVERSE_PAGES);

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
      if (/[\u4e00-\u9fff]/.test(current)) {
        const normalized = normalize(current);
        const en = REVERSE[normalized] || REVERSE[current];
        if (en) {
          // 保留原有首尾空白，避免行内文本拼接时丢空格
          const lead = (current.match(/^\s*/) || [""])[0];
          const tail = (current.match(/\s*$/) || [""])[0];
          const next = lead + en + tail;
          node.nodeValue = next;
          originalText.set(node, next);
          return;
        }
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
