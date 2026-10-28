"""阿里云百炼（DashScope）多模态视觉服务：作物叶片病害初筛。

设计原则：
1. 只在配置了 DASHSCOPE_API_KEY 时启用，未配置时静默降级，不影响本地模型链路。
2. 返回结构与 plant_disease_service.predict_base64 保持一致，前端无需区分来源。
3. 模型只做初步筛查，提示词要求标注不确定性，不给出具体商品名与剂量。
"""
from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Dict, Optional
from urllib.parse import urlparse

import requests

logger = logging.getLogger(__name__)

DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
DEFAULT_MODEL = "qwen3-vl-plus"

PROMPT = """你是中国大陆农业生产一线的植保助手，请根据这张作物叶片照片做初步病害筛查。

只输出一个 JSON 对象，不要输出解释文字，不要使用代码块标记。字段要求：
{
  "is_plant": true 或 false，是否为作物叶片照片,
  "crop": "可能的作物名称，判断不出写 未知",
  "disease": "最可能的病害或虫害中文名，判断不出写 无法判断",
  "confidence": 0 到 1 之间的小数，表示你对判断的把握,
  "severity": "low" 或 "medium" 或 "high",
  "symptoms": "照片中可观察到的症状描述",
  "treatment": "可执行的防治方向，包含农业防治与药剂类别，不写商品名、不写具体剂量",
  "note": "需要提醒农户的不确定性或补充拍摄建议"
}

约束：
1. 看不清、不是作物、或症状不典型时，把 confidence 降到 0.3 以下，并在 note 中说明原因，不要编造病害名称。
2. 防治建议需符合中国大陆登记用药习惯，不推荐境外农药，不承诺防效。
3. 不要给出确诊结论，措辞使用“可能”“疑似”。
"""


class QwenVisionService:
    """调用阿里云百炼 OpenAI 兼容接口做图片理解。"""

    def __init__(self) -> None:
        self.api_key = (os.getenv("DASHSCOPE_API_KEY") or "").strip()
        self.base_url = (
            os.getenv("DASHSCOPE_BASE_URL") or DEFAULT_BASE_URL
        ).rstrip("/")
        self.model = (os.getenv("QWEN_VISION_MODEL") or DEFAULT_MODEL).strip()
        try:
            self.timeout = max(10, int(os.getenv("QWEN_VISION_TIMEOUT") or 45))
        except ValueError:
            self.timeout = 45

    @property
    def available(self) -> bool:
        return bool(self.api_key)

    def status(self) -> Dict[str, Any]:
        host = urlparse(self.base_url).netloc or self.base_url
        return {
            "available": self.available,
            "provider": "dashscope",
            "model": self.model,
            "endpoint": host,
            "scope": "云端多模态初筛，未使用中国田间图片验证，不构成田间诊断结论。",
        }

    def analyze_base64(
        self, image_base64: str, crop_hint: Optional[str] = None
    ) -> Dict[str, Any]:
        if not image_base64:
            return {"status": "error", "code": "no_image", "message": "未收到图片数据。"}
        if not self.available:
            return {
                "status": "unavailable",
                "code": "not_configured",
                "message": "未配置 DASHSCOPE_API_KEY，云端识别未启用。",
            }

        prompt = PROMPT
        if crop_hint:
            prompt += (
                f"\n用户填写的作物：{crop_hint}。请优先按该作物判断；"
                "若照片与该作物明显不符，按实际观察到的情况判断，并在 note 中提醒用户核对作物。"
            )

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": self._to_data_url(image_base64)}},
                        {"type": "text", "text": prompt},
                    ],
                }
            ],
            "temperature": 0.1,
            "max_tokens": 700,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=self.timeout,
            )
        except requests.RequestException as exc:
            logger.warning("调用阿里云百炼失败：%s", exc)
            return {
                "status": "error",
                "code": "network_error",
                "message": f"调用云端识别服务失败：{exc}",
            }

        if response.status_code != 200:
            logger.warning("阿里云百炼返回 %s：%s", response.status_code, response.text[:200])
            return {
                "status": "error",
                "code": f"http_{response.status_code}",
                "message": self._http_message(response.status_code),
            }

        try:
            content = response.json()["choices"][0]["message"]["content"]
        except (KeyError, IndexError, ValueError) as exc:
            return {
                "status": "error",
                "code": "invalid_response",
                "message": f"云端返回结构异常：{exc}",
            }

        parsed = self._parse_json(content)
        if not parsed:
            return {
                "status": "error",
                "code": "unparsable_content",
                "message": "云端返回内容无法解析为诊断结果。",
            }

        return self._to_result(parsed)

    @staticmethod
    def _http_message(status_code: int) -> str:
        if status_code in (401, 403):
            return "云端识别鉴权失败，请检查 DASHSCOPE_API_KEY 与地域配置。"
        if status_code == 429:
            return "云端识别触发限流，请稍后重试。"
        return f"云端识别服务返回 HTTP {status_code}。"

    @staticmethod
    def _to_data_url(image_base64: str) -> str:
        if image_base64.startswith("data:"):
            return image_base64
        return f"data:image/jpeg;base64,{image_base64}"

    @staticmethod
    def _parse_json(content: str) -> Optional[Dict[str, Any]]:
        if not content:
            return None
        text = re.sub(r"^```(?:json)?|```$", "", content.strip(), flags=re.MULTILINE).strip()
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end <= start:
            return None
        try:
            parsed = json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            return None
        return parsed if isinstance(parsed, dict) else None

    def _to_result(self, parsed: Dict[str, Any]) -> Dict[str, Any]:
        disease = str(parsed.get("disease") or "").strip() or "无法判断"
        is_plant = bool(parsed.get("is_plant", True))
        try:
            confidence = float(parsed.get("confidence"))
        except (TypeError, ValueError):
            confidence = 0.0
        confidence = min(1.0, max(0.0, confidence))

        notes = [str(parsed.get("note") or "").strip()]
        if not is_plant:
            notes.insert(0, "照片中未识别出作物叶片。")
        note_text = "；".join(n for n in notes if n)
        description = str(parsed.get("symptoms") or "").strip()
        if note_text:
            description = f"{description}（{note_text}）".strip()

        prediction = {
            "label": disease,
            "label_cn": disease,
            "confidence": round(confidence, 4),
            "is_healthy": is_plant and ("健康" in disease or "无病害" in disease),
            "description": description or "云端未提供症状描述。",
            "treatment": str(parsed.get("treatment") or "").strip()
            or "建议联系当地农技或植保部门复核。",
            "severity": str(parsed.get("severity") or "").strip().lower() or None,
            "crop": str(parsed.get("crop") or "").strip() or None,
        }

        return {
            "status": "ok",
            "engine": "cloud",
            "prediction": prediction,
            "predictions": [prediction],
            "low_confidence": confidence < 0.6,
            "model": {
                "name": f"{self.model}（阿里云百炼）",
                "provider": "dashscope",
                "dataset": "云端多模态大模型",
                "scope": "模型基于公开知识推断，未使用中国田间图片验证，不构成田间诊断结论。",
            },
            "disclaimer": "图片识别仅为初步筛查，不能替代当地农技或植保部门诊断。",
        }


qwen_vision_service = QwenVisionService()
