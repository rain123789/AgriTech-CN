"""AI 助手与植物病害识别接口。"""
from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request

from backend.services.ai_service import ai_service
from backend.services.plant_disease_service import plant_disease_service

chat_bp = Blueprint("chat_api", __name__)


@chat_bp.get("/api/ai/status")
def ai_status():
    status = ai_service.status()
    status["plant_disease_model"] = {
        "available": plant_disease_service.available,
        "classes": len(plant_disease_service.classes),
        "error": plant_disease_service.error,
        "model_path": plant_disease_service.model_path,
        "scope": "PlantVillage 38 类公开数据集，未使用中国田间数据验证。",
    }
    return jsonify(status)


@chat_bp.post("/api/chat")
def chat():
    payload = request.get_json(silent=True) or {}
    message = str(payload.get("message") or "").strip()
    image = payload.get("image")
    if len(message) > 4000:
        return jsonify({"error": "消息过长，请控制在 4000 字以内。", "reply": "消息过长，请控制在 4000 字以内。"}), 400
    if not message and not image:
        return jsonify({"error": "请输入问题或上传图片。", "reply": "请输入问题或上传图片。"}), 400
    if image is not None and not isinstance(image, str):
        return jsonify({"error": "图片格式无效。", "reply": "图片格式无效。"}), 400

    result = ai_service.chat(message=message, image_base64=image)
    return jsonify(result.to_dict())


@chat_bp.post("/api/disease/predict")
def disease_predict():
    payload = request.get_json(silent=True) or {}
    image = payload.get("image")
    if not image or not isinstance(image, str):
        return jsonify({"status": "error", "code": "no_image", "message": "请先选择一张作物图片。"}), 400
    result = plant_disease_service.predict_base64(image)
    status_code = 200 if result.get("status") == "ok" else 503
    if result.get("status") == "error":
        status_code = 400
    return jsonify(result), status_code


@chat_bp.get("/api/disease/classes")
def disease_classes():
    return jsonify(
        {
            "count": len(plant_disease_service.classes),
            "classes": plant_disease_service.classes,
            "dataset": "PlantVillage",
            "scope_notice": "模型支持的 38 类主要来自公开 PlantVillage 数据集，不代表已覆盖中国全部作物病害。",
        }
    )
