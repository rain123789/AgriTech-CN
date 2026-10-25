"""构建期生成离线中文补充词典。

- 输入：artifacts/smoke/untranslated.json（真实浏览器提取）
- 翻译：MyMemory 公共接口，仅构建时调用；结果缓存到 JSON
- 运行：生成 scripts/locales/zh-CN-extra.js，由浏览器本地加载
- 人工覆盖：农业术语、导航、按钮、页面标题
"""
from __future__ import annotations

import html
import json
import re
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[2]
INPUT = ROOT / "artifacts" / "smoke" / "untranslated.json"
CACHE = ROOT / "artifacts" / "smoke" / "translation-cache.json"
OUTPUT = ROOT / "scripts" / "locales" / "zh-CN-extra.js"

MANUAL = {
    # 页面标题
    "about agritech": "关于我们｜农智云",
    "agritech blog": "农业资讯｜农智云",
    "my favorite blogs - agritech": "我的收藏｜农智云",
    "level up - contributor growth hub | agritech": "技能提升｜农智云",
    "supply chain support - agritech": "供应链服务｜农智云",
    "water management advisor | agritech": "农田灌溉管理｜农智云",
    "sustainable farming guidance - agritech": "绿色种植指导｜农智云",
    "iot farm monitoring | agritech": "物联网农场监测｜农智云",
    "financial support - agritech": "金融与保险服务｜农智云",
    "livestock management | agritech": "畜禽养殖管理｜农智云",
    "contact us - agritech": "联系我们｜农智云",
    "terms and service - agritech": "服务条款｜农智云",
    "cookie policy - agritech": "Cookie 政策｜农智云",
    "privacy policy - agritech": "隐私政策｜农智云",
    "agritech - share your thoughts": "意见反馈｜农智云",
    # 导航与通用操作
    "home": "首页", "about": "关于我们", "blog": "农业资讯", "schemes": "惠农政策",
    "community forum": "农户交流社区", "level up": "技能提升", "certificates": "学习证书",
    "favorites": "我的收藏", "login": "登录", "register": "注册", "logout": "退出登录",
    "english": "English", "certificates:": "学习证书：", "components": "功能模块",
    "pricing": "方案与费用", "services": "农业服务", "contact": "联系我们",
    "quick links": "快捷入口", "newsletter": "农事简报", "subscribe": "订阅",
    "back to home": "返回首页", "view all": "查看全部", "learn more": "了解更多",
    "read more": "阅读更多", "get started": "开始使用", "explore": "立即了解",
    "offline-ready": "支持离线", "all posts": "全部文章",
    "farming tips": "种植技巧", "business": "经营与市场", "sustainability": "绿色发展",
    # 农业务实术语
    "crop recommendation": "作物种植推荐", "crop recommendation:": "作物种植推荐：",
    "yield prediction": "作物产量预测", "yield prediction:": "作物产量预测：",
    "crop planning": "种植计划", "crop planning:": "种植计划：",
    "disease detection": "植物病害识别", "disease detection:": "植物病害识别：",
    "marketplace": "农产品交易市场", "marketplace:": "农产品交易市场：",
    "weather": "农业气象", "weather:": "农业气象：",
    "community forum:": "农户交流社区：", "schemes:": "惠农政策：",
    "equipment": "农机设备", "equipment:": "农机设备：",
    "livestock": "畜禽养殖", "livestock management": "畜禽养殖管理",
    "crop advisory": "种植指导", "crop advisor": "农技顾问",
    "water advisor": "灌溉顾问", "disease insights": "病害洞察",
    "supply chain": "供应链服务", "components": "功能模块",
    "ai assistant": "AI 农业助手", "dashboard": "工作台", "feedback": "意见反馈",
    "ag news": "农业资讯", "news": "农业资讯", "about us": "关于我们",
    "terms & service": "服务条款", "privacy policy": "隐私政策", "cookie policy": "Cookie 政策",
    "wheat": "小麦", "rice": "水稻", "maize": "玉米", "cotton": "棉花", "soybean": "大豆",
    "potato": "马铃薯", "tomato": "番茄", "onion": "洋葱", "groundnut": "花生",
    "sugarcane": "甘蔗", "paddy": "水稻", "fertilizer": "肥料", "pesticide": "农药",
    "irrigation": "灌溉", "soil": "土壤", "humidity": "湿度", "temperature": "温度",
    "rainfall": "降雨量", "loan": "贷款", "insurance": "保险", "subsidy": "补贴",
    "scheme": "惠农政策", "warehouse": "仓储", "logistics": "物流", "transportation": "运输",
    "quality": "品质", "harvest": "收获", "farmer": "农户", "buyer": "采购商",
    "supplier": "供应商", "retailer": "零售商", "expert": "农技专家",
    # 大段标题的人工校订
    "comprehensive logistics and supply chain management for seamless agricultural product distribution": "覆盖农业生产、集货、运输与分销的供应链服务演示",
    "end-to-end supply chain process": "端到端供应链流程",
    "farm production": "田间生产", "quality produce from verified farms": "来自示范合作基地的优质农产品",
    "collection centers": "集货中心", "efficient aggregation and sorting": "高效集货与分级",
    "climate-controlled logistics": "全程温控物流", "distribution": "分销",
    "retail and wholesale markets": "零售与批发市场",
    "ai-powered water management advisor": "AI 辅助农田灌溉顾问",
    "personalized irrigation schedules for every field": "按地块生成灌溉计划",
    "enter your crop, soil, farm size, irrigation method, and local weather to generate a daily and weekly watering plan that": "输入作物、土壤、地块面积、灌溉方式和当地天气，生成日度与周度浇水计划；结果仅作一般性参考。",
    "generate plan": "生成计划", "water intelligence": "水利智能",
    "eco-friendly farming practices for a greener future and sustainable agriculture": "面向绿色未来的生态种植实践",
    "sustainability impact": "可持续效益",
    "see the positive environmental impact of sustainable practices": "查看绿色种植措施的示范效益",
    "water saved (%)": "节水量（%）", "carbon reduced (%)": "碳减排（%）",
    "soil health (%)": "土壤健康（%）", "cost savings (%)": "成本节约（%）",
    "organic farming": "有机种植", "natural pest control methods": "自然防控方法",
    "real-time iot farm dashboard": "实时物联网农场看板",
    "continuous multi-zone sensor telemetry stream & microclimate control": "多区域传感器数据流与微气候管理演示",
    "financial support & insurance": "金融与保险服务",
    "comprehensive financial solutions designed specifically for farmers and agricultural businesses. access loans, insurance": "为农户和农业经营主体提供的金融信息与工具演示",
    "agricultural loan calculator": "涉农贷款试算器",
    "loan amount (₹)": "贷款金额（¥，演示）", "interest rate (%)": "年利率（%）",
    "loan term (years)": "贷款期限（年）", "calculate emi": "试算月供",
    "monthly emi: ₹": "每月还款：¥",
    "frequently asked questions": "常见问题",
    "get in touch": "联系我们",
    "send us a message": "给我们留言",
    "your feedback": "您的反馈", "share feedback": "提交反馈",
    "thank you for your feedback!": "感谢您的反馈！",
    "all feedback submissions": "全部反馈记录",
    "active contributors": "活跃贡献者", "merged feature PRs": "已合并功能 PR",
    "total community points": "社区总积分", "generate participation certificate": "生成参与证明",
    "view leaderboard": "查看排行榜", "explore level tiers": "查看等级体系",
    "agritech contributor growth hub": "农智云开源贡献成长中心",
    "level up your open-source impact": "提升你的开源贡献影响力",
    "real farmers. real results.": "真实使用场景",
    "share your experience": "分享使用体验",
    "your insights help us grow and serve you better": "你的意见将帮助平台改进",
}

# 常见机翻错误修正（对译文做后处理）
FIXES = {
    "裁剪建议": "作物种植推荐", "裁剪推荐": "作物种植推荐",
    "收益率预测": "作物产量预测", "产量预测": "作物产量预测",
    "作物病害检测": "植物病害识别", "植物病害检测": "植物病害识别",
    "日工（农业）": "农业", "组件": "功能模块",
    "定价": "方案与费用", "牲畜管理": "畜禽养殖管理",
    "供应链支持": "供应链服务", "供水管理": "农田灌溉管理",
    "可持续农业指导": "绿色种植指导", "物联网农场监控": "物联网农场监测",
}


def translate(text: str) -> str | None:
    if text.lower() in MANUAL:
        return MANUAL[text.lower()]
    if len(text) > 450:
        return None
    try:
        response = requests.get(
            "https://api.mymemory.translated.net/get",
            params={"q": text, "langpair": "en|zh-CN"},
            timeout=15,
        )
        response.raise_for_status()
        payload = response.json()
        translated = html.unescape(str(payload.get("responseData", {}).get("translatedText", ""))).strip()
        if not translated or "MYMEMORY WARNING" in translated.upper():
            return None
        if translated.lower() == text.lower():
            return None
        for old, new in FIXES.items():
            translated = translated.replace(old, new)
        return translated
    except Exception:
        return None


def main() -> None:
    data = json.loads(INPUT.read_text(encoding="utf-8"))
    rows = data["flat"]
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    result = dict(cache)
    for index, row in enumerate(rows, 1):
        text = row["text"].strip()
        key = text.lower()
        if not text or key in result or key in MANUAL:
            continue
        translation = translate(text)
        if translation:
            result[key] = translation
        if index % 25 == 0:
            CACHE.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"{index}/{len(rows)} 已翻译 {len(result)}", flush=True)
        time.sleep(0.25)

    for key, value in MANUAL.items():
        result[key] = value
    result = {key: value for key, value in result.items() if value and key.strip()}
    CACHE.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        "/* 构建期生成的离线中文补充词典，运行时无需联网。 */\n"
        "window.CN_EXTRA_TEXT = Object.assign(window.CN_EXTRA_TEXT || {}, "
        + json.dumps(result, ensure_ascii=False, indent=2)
        + ");\n",
        encoding="utf-8",
    )
    print(f"输出 {len(result)} 条：{OUTPUT}", flush=True)


if __name__ == "__main__":
    main()
