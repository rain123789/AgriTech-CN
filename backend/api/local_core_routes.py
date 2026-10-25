"""本地可运行的核心辅助接口：气象、农事建议、通知与活动汇总。

原则：
- 优先使用免费公开气象数据；请求失败时返回明确标记的本地演示数据；
- 不伪造实时行情、真实订单或外部服务成功；
- 不要求 Redis、Celery 或海外账号即可使用主站。
"""
from __future__ import annotations

import datetime as dt
import os
from typing import Any, Dict

import requests
from flask import Blueprint, jsonify, request

local_core_bp = Blueprint("local_core", __name__)

CITY_COORDS = {
    "武汉": (30.5928, 114.3055, "湖北省"),
    "湖北省武汉市": (30.5928, 114.3055, "湖北省"),
    "郑州": (34.7466, 113.6254, "河南省"),
    "河南省郑州市": (34.7466, 113.6254, "河南省"),
    "济南": (36.6512, 117.1201, "山东省"),
    "山东省济南市": (36.6512, 117.1201, "山东省"),
    "南京": (32.0603, 118.7969, "江苏省"),
    "江苏省南京市": (32.0603, 118.7969, "江苏省"),
    "成都": (30.5728, 104.0668, "四川省"),
    "四川省成都市": (30.5728, 104.0668, "四川省"),
    "哈尔滨": (45.8038, 126.5349, "黑龙江省"),
    "黑龙江省哈尔滨市": (45.8038, 126.5349, "黑龙江省"),
}

DEMO_WEATHER = {
    "temperature": 21.6,
    "humidity": 68,
    "wind_speed": 9.4,
    "weather_condition": "多云",
    "precipitation": 0.0,
}

WMO_CODES = {
    0: "晴",
    1: "大部晴朗",
    2: "多云",
    3: "阴",
    45: "有雾",
    48: "雾凇",
    51: "小毛毛雨",
    53: "毛毛雨",
    55: "较强毛毛雨",
    61: "小雨",
    63: "中雨",
    65: "大雨",
    71: "小雪",
    73: "中雪",
    75: "大雪",
    80: "阵雨",
    81: "较强阵雨",
    82: "强阵雨",
    95: "雷暴",
    96: "雷暴伴冰雹",
    99: "强雷暴伴冰雹",
}


def _find_city(location: str):
    value = (location or "").strip()
    for key, coords in CITY_COORDS.items():
        if key in value or value in key:
            return key, coords
    return "武汉", CITY_COORDS["武汉"]


def _weather_payload(location: str) -> Dict[str, Any]:
    city, (lat, lon, province) = _find_city(location)
    live = None
    source = "local-demo"
    is_demo = True

    # Open-Meteo 无需密钥；若网络不可达则退回本地演示值，并明确标注。
    try:
        response = requests.get(
            os.getenv("OPEN_METEO_URL", "https://api.open-meteo.com/v1/forecast"),
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
                "timezone": "Asia/Shanghai",
            },
            timeout=4,
        )
        response.raise_for_status()
        current = response.json().get("current") or {}
        if current.get("temperature_2m") is not None:
            code = int(current.get("weather_code", 2))
            live = {
                "temperature": round(float(current["temperature_2m"]), 1),
                "humidity": int(current.get("relative_humidity_2m", 0)),
                "wind_speed": round(float(current.get("wind_speed_10m", 0)), 1),
                "weather_condition": WMO_CODES.get(code, "多云"),
                "precipitation": round(float(current.get("precipitation", 0) or 0), 1),
            }
            source = "Open-Meteo"
            is_demo = False
    except Exception:
        live = None

    values = live or DEMO_WEATHER
    return {
        "location": f"{province}{city}市" if not city.endswith("市") else f"{province}{city}",
        "province": province,
        "city": city,
        "temperature": values["temperature"],
        "humidity": values["humidity"],
        "wind_speed": values["wind_speed"],
        "weather_condition": values["weather_condition"],
        "precipitation": values["precipitation"],
        "observed_at": dt.datetime.now().astimezone().isoformat(timespec="seconds"),
        "source": source,
        "is_demo": is_demo,
        "demo_notice": "当前为本地样例天气，不是实时气象数据。" if is_demo else "",
    }


@local_core_bp.get("/api/v1/weather/current")
def weather_current():
    location = request.args.get("location", "湖北省武汉市")
    data = _weather_payload(location)
    return jsonify({"status": "success", "data": data, "is_demo": data["is_demo"]})


@local_core_bp.get("/api/weather")
def weather_compat():
    location = request.args.get("location", request.args.get("city", "湖北省武汉市"))
    data = _weather_payload(location)
    return jsonify(
        {
            "status": "success",
            "data": {
                "location": data["location"],
                "temperature": data["temperature"],
                "condition": data["weather_condition"],
                "humidity": data["humidity"],
                "wind_kph": data["wind_speed"],
                "is_demo": data["is_demo"],
                "source": data["source"],
            },
        }
    )


@local_core_bp.get("/api/v1/advisories/")
def advisories():
    now = dt.datetime.now().astimezone()
    return jsonify(
        {
            "status": "success",
            "is_demo": True,
            "notice": "以下为本地演示农事建议，请结合当地气象与田间实际情况判断。",
            "data": [
                {
                    "id": 1,
                    "priority": "MEDIUM",
                    "crop_name": "水稻",
                    "growth_stage": "分蘖期",
                    "advisory_text": "连续阴雨时保持浅水层，雨隙及时晒田；重点关注稻瘟病中心病株，发现异常请当地植保站复核。",
                    "created_at": now.isoformat(),
                },
                {
                    "id": 2,
                    "priority": "LOW",
                    "crop_name": "小麦",
                    "growth_stage": "拔节期",
                    "advisory_text": "根据苗情控制旺长，避免偏施氮肥；抽穗扬花期关注当地赤霉病预报。",
                    "created_at": now.isoformat(),
                },
                {
                    "id": 3,
                    "priority": "HIGH",
                    "crop_name": "番茄",
                    "growth_stage": "结果期",
                    "advisory_text": "设施内注意通风降湿，避免叶面长时间结露；及时清除下部病叶并带出棚外。",
                    "created_at": now.isoformat(),
                },
            ],
        }
    )


@local_core_bp.post("/api/v1/advisories/<int:advisory_id>/feedback")
def advisory_feedback(advisory_id: int):
    payload = request.get_json(silent=True) or {}
    rating = payload.get("rating")
    return jsonify(
        {
            "status": "success",
            "message": "演示模式已记录反馈（仅本次请求，不写入真实评价系统）。",
            "advisory_id": advisory_id,
            "rating": rating,
        }
    )


@local_core_bp.get("/api/v1/notifications/")
def notifications():
    return jsonify(
        {
            "status": "success",
            "data": [],
            "notifications": [],
            "unread_count": 0,
            "notice": "本地演示模式暂无通知。",
        }
    )


@local_core_bp.post("/api/v1/notifications/<notification_id>/read")
def notification_read(notification_id: str):
    return jsonify({"status": "success", "message": "通知已标记为已读。", "id": notification_id})


@local_core_bp.get("/api/v1/alerts/")
def alerts():
    return jsonify({"status": "success", "data": [], "notice": "本地演示模式暂无预警。"})


@local_core_bp.get("/api/activities/summary")
def activities_summary():
    return jsonify(
        {
            "status": "success",
            "is_demo": True,
            "data": {
                "items_sold": 0,
                "items_purchased": 0,
                "total_revenue_cny": 0,
                "service_usage": 0,
                "transactions": [],
                "notice": "演示模式没有真实交易，统计均为 0。",
            },
        }
    )


@local_core_bp.post("/api/fertilizer/recommend")
def fertilizer_recommend():
    """基于项目原有 agri_utils 规则库输出科学施肥建议。

    该接口不声称是机器学习模型；所有用量换算为公斤/亩并提示以测土配方为准。
    """
    payload = request.get_json(silent=True) or {}
    crop = str(payload.get("crop_type") or "rice").strip().lower()
    try:
        soil_ph = float(payload.get("soil_ph", 6.5))
    except (TypeError, ValueError):
        return jsonify({"status": "error", "message": "土壤 pH 必须是数字。"}), 400
    if not 3.5 <= soil_ph <= 10:
        return jsonify({"status": "error", "message": "土壤 pH 应在 3.5–10.0 之间。"}), 400
    growth_stage = str(payload.get("growth_stage") or "vegetative").strip()
    rainfall = payload.get("rainfall")
    temperature = payload.get("temperature")
    try:
        recent_weather = {
            "rainfall": float(rainfall) if rainfall not in (None, "") else None,
            "temperature": float(temperature) if temperature not in (None, "") else None,
        }
    except (TypeError, ValueError):
        recent_weather = None

    from agri_utils import recommend_fertilizer

    rec = recommend_fertilizer(soil_ph, crop, growth_stage, recent_weather)
    fertilizer_cn = {
        "Urea": "尿素",
        "DAP (Diammonium Phosphate)": "磷酸二铵（DAP）",
        "MOP (Muriate of Potash)": "氯化钾（MOP）",
        "NPK Complex (10:26:26)": "复合肥（10-26-26）",
        "SSP (Single Super Phosphate)": "过磷酸钙（SSP）",
        "balanced NPK": "平衡型复合肥",
    }
    note_cn = {
        "Soil test recommended": "建议先进行土壤检测，再确定具体配方。",
        "Split applications where appropriate": "根据作物需肥规律分次施用。",
        "Acidic soil: consider liming before heavy P applications": "土壤偏酸，可在大量施磷前评估石灰调理。",
        "Alkaline soil: monitor micronutrients (Fe, Zn)": "土壤偏碱，注意铁、锌等微量元素有效性。",
        "Heavy recent rainfall: delay application to avoid leaching": "近期降雨较大，宜推迟施肥以减少淋失。",
        "avoid_excess": "避免过量施用。",
        "split_application": "建议分次施用。",
        "irrigate_after": "施用后根据墒情适量灌溉。",
        "avoid_direct_contact": "避免种子与肥料直接接触。",
        "mix_with_soil": "与土壤充分混匀。",
        "avoid_chloride_sensitive_crops": "忌氯作物慎用含氯化钾产品。",
        "balanced_nutrition": "注意养分平衡，不要单一偏施。",
        "soil_test_based": "以测土配方结果为准。",
        "good_for_acidic_soil": "适用于酸性土壤，但仍需结合检测结果。",
        "provides_calcium": "可同时补充钙素。",
    }
    rate = list(rec.get("application_rate_kg_per_hectare") or [0, 0])
    low, high = (rate + [0, 0])[:2]
    notes = [note_cn.get(note, note) for note in rec.get("notes", [])]
    return jsonify(
        {
            "status": "success",
            "is_demo": True,
            "recommendation": {
                "fertilizer_name": fertilizer_cn.get(rec.get("fertilizer_name"), rec.get("fertilizer_name")),
                "npk_ratio": rec.get("NPK_ratio"),
                "rate_kg_per_mu": [round(float(low) / 15, 1), round(float(high) / 15, 1)],
                "growth_stage": growth_stage,
                "soil_ph": soil_ph,
                "notes": notes,
                "basis": "规则库：作物养分需求 + 土壤 pH 调整；未使用机器学习模型。",
                "confidence": rec.get("confidence"),
            },
            "notice": "施肥建议为一般性农艺参考，必须结合土壤检测、目标产量和当地肥料登记信息确定最终用量。",
        }
    )


@local_core_bp.get("/api/v1/forum/categories")
def forum_categories():
    return jsonify(
        {
            "status": "success",
            "is_demo": True,
            "data": [
                {"id": 1, "name": "作物保护", "icon": "fa-seedling", "thread_count": 2},
                {"id": 2, "name": "土壤与施肥", "icon": "fa-mountain", "thread_count": 1},
                {"id": 3, "name": "农机与灌溉", "icon": "fa-tractor", "thread_count": 1},
                {"id": 4, "name": "经营与市场", "icon": "fa-store", "thread_count": 1},
            ],
        }
    )


@local_core_bp.get("/api/v1/forum/threads")
def forum_threads():
    return jsonify(
        {
            "status": "success",
            "is_demo": True,
            "notice": "以下为本地演示话题，不代表真实用户发布内容。",
            "data": [
                {
                    "id": 1,
                    "user_id": 1,
                    "title": "连续阴雨后水稻叶片出现褐色斑点，如何排查？",
                    "content": "近日连续阴雨，田间部分叶片出现褐色斑点。希望了解应先观察什么、什么情况需要联系植保站，以及是否应立即喷药。",
                    "tags": ["水稻", "病害", "雨季"],
                    "created_at": "2026-10-24T09:30:00",
                    "is_pinned": True,
                    "upvote_count": 12,
                    "comment_count": 4,
                    "view_count": 168,
                },
                {
                    "id": 2,
                    "user_id": 0,
                    "title": "测土后磷含量偏高，磷肥应该如何调整？",
                    "content": "本地检测结果显示有效磷偏高，计划下一季减少磷肥并轮作豆科作物，想听听大家的经验。",
                    "tags": ["测土", "施肥", "轮作"],
                    "created_at": "2026-10-23T14:10:00",
                    "is_pinned": False,
                    "upvote_count": 8,
                    "comment_count": 3,
                    "view_count": 96,
                },
                {
                    "id": 3,
                    "user_id": 1,
                    "title": "滴灌带堵塞的日常检查方法",
                    "content": "整理一套简单的巡检流程：过滤网、压力表、冲洗顺序，供刚开始用滴灌的农户参考。",
                    "tags": ["灌溉", "农机", "维护"],
                    "created_at": "2026-10-22T08:05:00",
                    "is_pinned": False,
                    "upvote_count": 21,
                    "comment_count": 7,
                    "view_count": 233,
                },
                {
                    "id": 4,
                    "user_id": 0,
                    "title": "卖粮前为什么要谈清楚等级和水分",
                    "content": "整理了水分、杂质、容重、等级与交货方式对价格的影响，供准备售粮时参考。",
                    "tags": ["销售", "价格", "质量"],
                    "created_at": "2026-10-21T16:40:00",
                    "is_pinned": False,
                    "upvote_count": 15,
                    "comment_count": 5,
                    "view_count": 187,
                },
            ],
        }
    )


@local_core_bp.post("/api/v1/forum/threads")
def forum_create_thread():
    return jsonify(
        {
            "status": "success",
            "is_demo": True,
            "message": "演示环境已记录该话题，未写入真实社区数据库。",
            "data": {"id": 99},
        }
    )


@local_core_bp.get("/api/v1/forum/reputation/<int:user_id>")
def forum_reputation(user_id: int):
    return jsonify(
        {
            "status": "success",
            "is_demo": True,
            "data": {"reputation": {"total_score": 0, "is_expert": False, "level": "新成员"}},
        }
    )


@local_core_bp.post("/api/alert-subscribe")
def alert_subscribe():
    return jsonify({"status": "success", "message": "演示模式已记录订阅意向，未发送真实短信或邮件。"})


@local_core_bp.post("/api/forecast")
def forecast():
    return jsonify({"status": "error", "message": "产量预测为独立实验模块，未接入主站。"}), 503


@local_core_bp.post("/api/optimize-profit")
def optimize_profit():
    return jsonify({"status": "error", "message": "收益优化为实验模块，未接入主站。"}), 503
