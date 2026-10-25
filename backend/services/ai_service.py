"""
AgriTech 统一 AI 服务适配层。

设计目标：
1. 使用 DeepSeek 的 OpenAI 兼容 Chat Completions 接口替换原 Gemini 文本调用；
2. API Key 只从环境变量读取，绝不下发前端；
3. 未配置 Key 或网络失败时使用本地规则库，并明确标记为“离线规则回答”；
4. 图片分析由本地植物病害模型完成，再由 DeepSeek 对识别结果做农艺解读。
   DeepSeek 文本模型本身不能直接“看图”，因此不把它包装成视觉模型。
"""
from __future__ import annotations

import logging
import os
import re
from dataclasses import dataclass
from typing import Any, Dict, Optional

import requests

logger = logging.getLogger(__name__)

OFFLINE_NOTICE = "当前为离线规则回答，未调用大模型，结论仅供基础参考。"


@dataclass
class AIResult:
    reply: str
    mode: str
    provider: str
    model: Optional[str] = None
    notice: str = ""
    image_analysis: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "reply": self.reply,
            "mode": self.mode,
            "provider": self.provider,
            "model": self.model,
            "notice": self.notice,
            "image_analysis": self.image_analysis,
        }


# 离线规则库只包含平台确实覆盖的主题，避免用关键词冒充模型诊断。
OFFLINE_RULES = [
    {
        "keywords": ["水稻", "稻瘟病", "稻飞虱", "rice"],
        "answer": (
            "**水稻管理要点**\n\n"
            "- 分蘖期保持浅水层，晒田应结合苗数和天气逐步进行，避免长期深水。\n"
            "- 稻瘟病重点在破口前做好田间巡查，注意氮肥不要过量；发现中心病株及时记录并请当地植保站确认。\n"
            "- 稻飞虱可结合田埂和稻丛基部查虫，优先采用农业与生物防治，药剂选择须遵守中国登记标签，不建议自行加大剂量。\n\n"
            "如需针对具体生育期、地区天气和田块情况判断，请配置大模型后继续追问。"
        ),
    },
    {
        "keywords": ["小麦", "纹枯病", "赤霉病", "蚜虫", "wheat"],
        "answer": (
            "**小麦管理要点**\n\n"
            "- 返青至拔节期注意群体密度，旺长田可适当控旺，避免后期倒伏。\n"
            "- 赤霉病与抽穗扬花期湿度关系密切，应关注当地农业部门预报，在专业指导下预防。\n"
            "- 蚜虫防治应结合天敌数量，达到当地防治指标后再采取措施。\n\n"
            "具体用药必须核对在中国登记的作物、防治对象、安全间隔期与标签剂量。"
        ),
    },
    {
        "keywords": ["玉米", "草地贪夜蛾", "锈病", "corn", "maize"],
        "answer": (
            "**玉米管理要点**\n\n"
            "- 苗期关注缺苗断垄，拔节期合理追肥，避免一次性偏施氮肥。\n"
            "- 草地贪夜蛾应重点检查心叶，低龄幼虫期是防治关键窗口，用药须遵循登记标签。\n"
            "- 南方锈病在高温高湿条件下易发，注意田间通风和品种抗性差异。"
        ),
    },
    {
        "keywords": ["番茄", "西红柿", "晚疫病", "早疫病", "tomato"],
        "answer": (
            "**番茄管理要点**\n\n"
            "- 保持通风降湿，避免叶面长期结露；浇水尽量采用滴灌或膜下灌溉。\n"
            "- 早疫病常见下部老叶出现同心轮纹斑，及时摘除病叶并带出田外处理。\n"
            "- 晚疫病发展快，发现疑似病株应隔离并请当地植保部门确认；不要凭图片自行确定农药剂量。\n\n"
            "上传清晰叶部照片可使用本地病害模型做初步识别，但模型结果不能替代田间诊断。"
        ),
    },
    {
        "keywords": ["施肥", "肥料", "氮", "磷", "钾", "尿素", "复合肥", "fertilizer"],
        "answer": (
            "**科学施肥原则**\n\n"
            "- 先测土再配方。至少了解土壤 pH、有机质、碱解氮、有效磷和速效钾。\n"
            "- 基肥与追肥按作物需肥规律分配，沙质土宜少量多次，减少淋失。\n"
            "- 有机肥必须充分腐熟；畜禽粪肥还田要注意重金属和抗生素风险。\n"
            "- 叶面肥只能作为补充，不能替代土壤施肥。\n\n"
            "你可以使用平台的“科学施肥建议”模块输入土壤 pH、作物和生育期获取规则化建议。"
        ),
    },
    {
        "keywords": ["浇水", "灌溉", "干旱", "排水", "irrigation", "water"],
        "answer": (
            "**农田水分管理**\n\n"
            "- 根据土壤墒情、作物需水关键期和天气预报决定灌溉，避免只看固定天数。\n"
            "- 优先滴灌、喷灌和膜下灌溉；漫灌后应及时排水，防止根系缺氧。\n"
            "- 暴雨前清理沟渠，低洼地块准备排水泵；高温时段避免中午大水漫灌。\n\n"
            "平台天气页的离线数据会标注为演示数据，不能替代当地气象台预报。"
        ),
    },
    {
        "keywords": ["病害", "叶子发黄", "叶斑", "虫", "病", "disease", "pest"],
        "answer": (
            "**作物异常排查建议**\n\n"
            "1. 先确认是生理性问题（缺水、缺素、药害、温度）还是病虫害。\n"
            "2. 拍摄叶片正反面、整株和田间环境，记录发生面积与发展速度。\n"
            "3. 不要仅凭一张图片确定农药；应向当地农技推广站或植保站复核。\n"
            "4. 已使用药剂的田块，请保留包装和施用记录，便于追溯。\n\n"
            "你可以上传清晰图片使用本地识别模型，或配置 DeepSeek 后获得更完整的中文农艺解读。"
        ),
    },
    {
        "keywords": ["价格", "市场", "收购", "行情", "market", "price"],
        "answer": (
            "**农产品行情使用提示**\n\n"
            "平台中的价格和交易信息是本地演示数据，不代表实时市场成交价。\n"
            "实际销售前建议同时核对当地批发市场、农业农村部门发布信息和采购商报价，"
            "并明确计价单位（元/公斤、元/吨）与等级标准。"
        ),
    },
    {
        "keywords": ["注册", "登录", "账号", "密码", "register", "login"],
        "answer": (
            "**账号使用说明**\n\n"
            "平台支持常见邮箱注册，姓名可输入中文。密码至少 8 位，并同时包含大写字母、小写字母和数字。"
            "本地演示模式的数据保存在项目 SQLite 数据库中，不会上传到 Firebase。"
        ),
    },
    {
        "keywords": ["你好", "您好", "你是谁", "hello", "hi"],
        "answer": (
            "你好，我是 **AI 农业助手**。我可以回答水稻、小麦、玉米、番茄等常见作物管理问题，"
            "也可以协助使用作物推荐、施肥建议和病害识别功能。\n\n"
            "当前未配置大模型时会明确使用本地规则库；配置 `DEEPSEEK_API_KEY` 后可进行连续中文对话。"
        ),
    },
]

SYSTEM_PROMPT = """你是“AI 农业助手”，服务中国大陆农户、合作社和农技人员。
要求：
1. 默认使用简体中文，语言清楚、可执行，避免空泛套话。
2. 优先给出农业通用措施：品种、播期、水肥、通风、轮作、清园、监测。
3. 涉及农药时必须提醒核对在中国登记的作物、防治对象、标签剂量和安全间隔期；
   不得编造具体用药量、补贴金额、贷款利率或政策截止日期。
4. 对无法确认的诊断明确说明不确定性，建议联系当地农技或植保部门。
5. 平台内的价格、天气、订单若为演示数据，要明确说明，不能称为实时数据。
6. 回答使用 Markdown，但不要输出 HTML。
"""


class AIService:
    """DeepSeek / OpenAI 兼容文本服务，带本地规则降级。"""

    def __init__(self) -> None:
        self.api_key = (
            os.getenv("DEEPSEEK_API_KEY")
            or os.getenv("AI_API_KEY")
            or ""
        ).strip()
        self.base_url = (
            os.getenv("DEEPSEEK_BASE_URL")
            or os.getenv("AI_BASE_URL")
            or "https://api.deepseek.com"
        ).rstrip("/")
        self.model = (
            os.getenv("DEEPSEEK_MODEL")
            or os.getenv("AI_MODEL")
            or "deepseek-chat"
        ).strip()
        self.timeout = int(os.getenv("AI_TIMEOUT_SECONDS", "60"))
        self.max_tokens = int(os.getenv("AI_MAX_TOKENS", "1200"))
        self.temperature = float(os.getenv("AI_TEMPERATURE", "0.5"))

    @property
    def available(self) -> bool:
        return bool(self.api_key)

    def status(self) -> Dict[str, Any]:
        return {
            "configured": self.available,
            "provider": "deepseek" if "deepseek" in self.base_url else "openai-compatible",
            "model": self.model if self.available else None,
            "mode": "online" if self.available else "offline",
            "notice": (
                "已配置在线大模型，回答由模型生成。"
                if self.available
                else "未配置 DEEPSEEK_API_KEY，当前使用本地规则库。"
            ),
        }

    def generate_text(self, prompt: str, temperature: Optional[float] = None) -> Optional[str]:
        if not self.available or not prompt:
            return None
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": self.temperature if temperature is None else temperature,
                    "max_tokens": self.max_tokens,
                    "stream": False,
                },
                timeout=self.timeout,
            )
            response.raise_for_status()
            payload = response.json()
            content = payload["choices"][0]["message"]["content"]
            return content.strip() if content else None
        except requests.Timeout:
            logger.warning("DeepSeek 请求超时")
        except requests.RequestException as exc:
            logger.warning("DeepSeek 请求失败：%s", exc)
        except (KeyError, IndexError, TypeError, ValueError) as exc:
            logger.warning("DeepSeek 返回格式异常：%s", exc)
        return None

    def chat(
        self,
        message: str,
        image_base64: Optional[str] = None,
        history: Optional[list] = None,
    ) -> AIResult:
        message = (message or "").strip()
        image_result = None

        if image_base64:
            from backend.services.plant_disease_service import plant_disease_service

            image_result = plant_disease_service.predict_base64(image_base64)
            if image_result.get("status") == "ok":
                diagnosis = image_result["prediction"]
                label_cn = diagnosis["label_cn"]
                confidence = diagnosis["confidence"]
                image_context = (
                    f"用户上传了一张作物图片。本地 38 类植物病害模型识别结果为："
                    f"{label_cn}，置信度 {confidence:.1%}。"
                    f"该结果仅代表模型在公开 PlantVillage 数据集类别上的判断，不能替代田间诊断。"
                    f"请围绕识别结果给出温和、可执行的农艺建议，并说明不确定性。"
                )
                if diagnosis.get("is_healthy"):
                    image_context += " 识别类别为健康植株。"
            else:
                image_context = (
                    "用户上传了一张作物图片，但本地病害模型当前不可用或图片无法识别。"
                    f"系统原因：{image_result.get('message', '未知')}。"
                    "请明确告知用户当前无法完成真实图片识别，不要猜测具体病害；"
                    "可以给出拍摄规范和田间自查步骤。"
                )
            message = f"{message}\n\n[图片分析上下文]\n{image_context}" if message else image_context

        if not message:
            return AIResult(
                reply="请告诉我你想咨询的作物和问题，或上传一张清晰的作物叶片图片。",
                mode="offline",
                provider="local",
                notice=OFFLINE_NOTICE,
                image_analysis=image_result,
            )

        if self.available:
            reply = self.generate_text(message)
            if reply:
                return AIResult(
                    reply=reply,
                    mode="online",
                    provider="deepseek" if "deepseek" in self.base_url else "openai-compatible",
                    model=self.model,
                    notice=(
                        "图片由本地模型识别，文字建议由 DeepSeek 生成。"
                        if image_result
                        else ""
                    ),
                    image_analysis=image_result,
                )
            if image_result and image_result.get("status") == "ok":
                diagnosis = image_result["prediction"]
                fallback = (
                    "在线大模型暂时不可用，以下为本地模型识别结果。\n\n"
                    f"**{diagnosis['label_cn']}**（置信度 {diagnosis['confidence']:.1%}）\n\n"
                    f"{diagnosis['description']}\n\n"
                    f"通用管理建议：{diagnosis['treatment']}\n\n"
                    "该结果仅作初步筛查，不能替代当地农技或植保部门诊断。"
                )
            elif image_result:
                image_reason = str(image_result.get("message", "模型或图片处理失败")).rstrip("。")
                fallback = (
                    "图片识别暂不可用。\n\n"
                    f"原因：{image_reason}。\n\n"
                    "在线大模型也未成功返回。为避免误导，我不会猜测具体病害。"
                    "请重新拍摄清晰叶片，并向当地农技推广或植保部门咨询。"
                )
            else:
                fallback = (
                    "在线大模型暂时不可用，以下是本地规则库的回答。\n\n"
                    + self.offline_reply(message)
                )
            return AIResult(
                reply=fallback,
                mode="offline-fallback",
                provider="local",
                notice="DeepSeek 请求失败，已自动降级为本地规则回答。",
                image_analysis=image_result,
            )

        if image_result and image_result.get("status") == "ok":
            diagnosis = image_result["prediction"]
            reply = (
                f"**本地模型识别结果：{diagnosis['label_cn']}**\n\n"
                f"- 置信度：{diagnosis['confidence']:.1%}\n"
                f"- 类别说明：{diagnosis['description']}\n"
                f"- 通用管理建议：{diagnosis['treatment']}\n\n"
                "说明：以上由本地 PlantVillage 38 类模型生成，只能作为初步筛查，不能替代当地植保部门诊断。"
                "如需更具体的综合建议，请配置 `DEEPSEEK_API_KEY` 启用在线农艺解读。"
            )
        elif image_result:
            reply = (
                "图片识别暂不可用。\n\n"
                f"原因：{image_result.get('message', '模型或图片处理失败')}。\n\n"
                "你可以先拍摄叶片正反面、整株和田间环境，记录发生面积；"
                "并向当地农技推广站咨询。离线模式下我不会猜测具体病害。"
            )
        else:
            reply = self.offline_reply(message)

        return AIResult(
            reply=reply,
            mode="offline",
            provider="local",
            notice=OFFLINE_NOTICE,
            image_analysis=image_result,
        )

    def offline_reply(self, message: str) -> str:
        normalized = message.lower()
        best = None
        best_score = 0
        for rule in OFFLINE_RULES:
            score = sum(1 for keyword in rule["keywords"] if keyword.lower() in normalized)
            if score > best_score:
                best = rule
                best_score = score

        if best:
            return best["answer"]

        return (
            "当前是**离线规则回答**，本地知识库没有覆盖这个问题，因此不能给出可靠结论。\n\n"
            "你可以尝试：\n"
            "- 换一种说法，说明作物、生育期、地区和具体症状；\n"
            "- 点击“作物种植推荐”“科学施肥建议”或“植物病害识别”使用对应工具；\n"
            "- 配置 `DEEPSEEK_API_KEY` 后启用在线大模型连续问答。\n\n"
            "涉及具体病虫害时，请联系当地农技推广或植保部门复核。"
        )


ai_service = AIService()
