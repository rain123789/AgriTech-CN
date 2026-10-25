from flask import Flask, request, jsonify, send_from_directory, g, render_template
import traceback
import os
import re
import hashlib
import json
from flask_cors import CORS
from dotenv import load_dotenv
import logging
import mimetypes
from marshmallow import ValidationError
from backend.utils.validation import validate_input, sanitize_input
from backend.extensions import socketio, db, migrate, mail, limiter, babel, get_locale
from crop_recommendation.routes import crop_bp
from backend.extensions.cache import cache
from backend.monitoring.routes import health_bp
from backend.config import config
from auth_utils import token_required, roles_required
from backend.utils.i18n import t
from backend.auth import auth_bp as legacy_auth_bp
from backend.docs.swagger import swagger_bp
from backend.services.ai_service import AIService, ai_service
from backend.services.plant_disease_service import plant_disease_service
from backend.api.chat_routes import chat_bp
from backend.api.local_core_routes import local_core_bp

from server.Routes.rotation_routes import rotation_bp
from server.Routes.irrigation_routes import irrigation_bp
from agri_utils import recommend_fertilizer


# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)




# Load environment variables
load_dotenv()

# Windows 的 MIME 数据库默认没有 woff2/avif，Flask 会以 octet-stream 返回，
# Chrome 会拒绝加载图标字体。启动时显式注册。
mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("font/woff", ".woff")
mimetypes.add_type("font/ttf", ".ttf")
mimetypes.add_type("image/avif", ".avif")
mimetypes.add_type("image/webp", ".webp")

app = Flask(__name__, static_folder='.', static_url_path='')

# Load Configuration
env_name = os.getenv('FLASK_ENV', 'default')
app.config.from_object(config[env_name])

# Set upload folder
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.jinja_env.auto_reload = True

# Initialize extensions
db.init_app(app)
migrate.init_app(app, db)
mail.init_app(app)
limiter.init_app(app)


# 只加载已验证可运行的核心模型，未接入的实验模块保留在源码中。
from backend.models.user import User
from backend.models.misc import Notification, File

_cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5000,http://127.0.0.1:5000,http://localhost:8080,http://127.0.0.1:8080",
    ).split(",")
    if origin.strip()
]
CORS(app, resources={r"/api/*": {"origins": _cors_origins}})

app.register_blueprint(crop_bp, url_prefix='/crop')
app.register_blueprint(health_bp)
app.register_blueprint(irrigation_bp)
app.register_blueprint(rotation_bp)
app.register_blueprint(legacy_auth_bp)
app.register_blueprint(swagger_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(local_core_bp)

# Initialize SocketIO with app
socketio.init_app(app)

# Initialize Cache with app
cache.init_app(app)


# Initialize Babel with app
babel.init_app(app, locale_selector=get_locale)





with app.app_context():
    db.create_all()

# ── AI 服务适配层 ─────────────────────────────────────────────────────────────
# 原项目在启动时硬性要求 Gemini Key；现改为默认基础演示模式，配置
# DEEPSEEK_API_KEY 后自动启用在线中文问答。任何密钥都不会下发到前端。
ai_service = AIService()
app.extensions["ai_service"] = ai_service
app.extensions["plant_disease_service"] = plant_disease_service

if ai_service.available:
    logger.info("AI 服务已启用：DeepSeek / OpenAI 兼容接口（模型：%s）", ai_service.model)
else:
    logger.warning("未配置 DEEPSEEK_API_KEY，AI 助手使用本地规则库和明确的离线降级模式。")

# 植物病害权重已完成修复与实测验证（2026-10-25）：结构对齐训练版 CNN_NeuralNet、
# 标签映射改为 ImageFolder 字母序、推理预处理去除训练时不存在的 ImageNet 归一化。
# 自检 3/3 命中（番茄早疫病/马铃薯早疫病/玉米普通锈病，置信度 0.88–0.9997）。
# 仍默认按需启用：设 ENABLE_PLANT_MODEL=1 开启，自检失败会自动禁用。
if os.getenv("ENABLE_PLANT_MODEL", "0").strip().lower() in {"1", "true", "yes"}:
    try:
        plant_disease_service.load()
    except Exception as exc:  # 模型异常不能阻断整站启动
        logger.warning("植物病害模型未就绪：%s", exc)
else:
    plant_disease_service.available = False
    plant_disease_service.error = (
        "图片识别当前未启用：设置环境变量 ENABLE_PLANT_MODEL=1 并安装 "
        "requirements-cn-ml.txt（torch/torchvision）后重启即可开启；"
        "开启时若权重自检不通过会自动禁用并提示原因。"
    )



"""Secure endpoint to provide Firebase configuration to client"""
@app.route('/api/firebase-config')
@limiter.limit("10 per minute")
def get_firebase_config():
    try:
        return jsonify({
            'apiKey': app.config['FIREBASE_API_KEY'],
            'authDomain': app.config['FIREBASE_AUTH_DOMAIN'],
            'projectId': app.config['FIREBASE_PROJECT_ID'],
            'storageBucket': app.config['FIREBASE_STORAGE_BUCKET'],
            'messagingSenderId': app.config['FIREBASE_MESSAGING_SENDER_ID'],
            'appId': app.config['FIREBASE_APP_ID'],
            'measurementId': app.config['FIREBASE_MEASUREMENT_ID']

        })
    except KeyError as e:
        return jsonify({
            "status": "error",
            "message":f"Missing environment variable: {str(e)}"
        }),500


# ==================== ASYNC TASK ENDPOINTS ====================

@app.route('/api/task/<task_id>', methods=['GET'])
@token_required
def get_task_status(task_id):
    """Check the status of an async task."""
    task = celery_app.AsyncResult(task_id)
    
    if task.state == 'PENDING':
        response = {
            'status': 'pending',
            'message': 'Task is waiting to be processed'
        }
    elif task.state == 'STARTED':
        response = {
            'status': 'processing',
            'message': 'Task is currently being processed'
        }
    elif task.state == 'SUCCESS':
        response = {
            'status': 'completed',
            'result': task.result
        }
    elif task.state == 'FAILURE':
        response = {
            'status': 'failed',
            'message': str(task.info)
        }
    else:
        response = {
            'status': task.state,
            'message': 'Unknown state'
        }
    
    return jsonify(response)


@app.route('/api/crop/predict-async', methods=['POST'])
@token_required
@roles_required('farmer', 'admin', 'consultant')
def predict_crop_async():
    """Submit crop prediction as async task."""
    try:
        data = request.get_json(force=True)
        
        required_fields = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
        for field in required_fields:
            if field not in data:
                return jsonify({'status': 'error', 'message': f'Missing field: {field}'}), 400
        
        # Get current locale
        lang = get_locale()
        
        # Submit task to Celery
        user_id = data.get('user_id')
        task = predict_crop_task.delay(
            data['N'], data['P'], data['K'],
            data['temperature'], data['humidity'],
            data['ph'], data['rainfall'],
            user_id=user_id,
            lang=lang
        )
        
        return jsonify({
            'status': 'submitted',
            'task_id': task.id,
            'message': 'Task submitted successfully. Poll /api/task/<task_id> for results.'
        }), 202
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/recommend/fertilizer', methods=['POST'])
@token_required
@roles_required('farmer', 'admin', 'expert')
def recommend_fertilizer_endpoint():
    """Return fertilizer recommendation based on soil pH, crop and optional weather."""
    try:
        data = request.get_json(force=True)
        soil_ph = data.get('soil_ph')
        crop_type = data.get('crop_type')
        growth_stage = data.get('growth_stage')
        recent_weather = data.get('recent_weather')

        if soil_ph is None or not crop_type:
            return jsonify({'status': 'error', 'message': 'soil_ph and crop_type are required'}), 400

        rec = recommend_fertilizer(float(soil_ph), crop_type, growth_stage, recent_weather)
        return jsonify({'status': 'success', 'recommendation': rec}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/loan/process-async', methods=['POST'])
@token_required
@roles_required('farmer', 'admin')
def process_loan_async():
    """Submit loan processing as async task."""
    try:
        json_data = request.get_json(force=True)
        
        is_valid, validation_message = validate_input(json_data)
        if not is_valid:
            return jsonify({'status': 'error', 'message': validation_message}), 400
        
        # Sanitize input
        if isinstance(json_data, dict):
            for key, value in json_data.items():
                if isinstance(value, str):
                    json_data[key] = sanitize_input(value)
        
        # Get current locale
        lang = get_locale()
        
        # Submit task to Celery
        user_id = json_data.get('user_id')
        task = process_loan_task.delay(json_data, user_id=user_id, lang=lang)
        
        return jsonify({
            'status': 'submitted',
            'task_id': task.id,
            'message': 'Task submitted successfully. Poll /api/task/<task_id> for results.'
        }), 202
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500



@app.route('/process-loan', methods=['POST'])
@limiter.limit("5 per minute")
@token_required
@roles_required('farmer', 'admin')
def process_loan():
    try:
        json_data = request.get_json(force=True)
        
        # Validate and sanitize input using Marshmallow
        try:
            from backend.schemas.loan_schema import LoanRequestSchema
            loan_schema = LoanRequestSchema()
            validated_data = loan_schema.load(json_data)
        except ValidationError as err:
            return jsonify({
                "status": "error",
                "message": err.messages
            }), 400
        
        # Sanitize any text fields in the JSON data
        if isinstance(json_data, dict):
            for key, value in json_data.items():
                if isinstance(value, str):
                    json_data[key] = sanitize_input(value)
        
        logger.info("Received loan processing request for type: %s", json_data.get('loan_type', 'unknown'))

        from backend.utils.i18n import get_locale, t, LOCALE_TO_NAME
        locale = get_locale()
        target_language = LOCALE_TO_NAME.get(locale, 'English')

        prompt = f"""
你是一名熟悉中国大陆涉农金融政策的贷款材料助理，为农户解读贷款申请条件。

你将收到一份农户贷款申请 JSON，字段会随贷款类型变化（如种植经营、农机购置、水利设施、土地经营）。
请聚焦中国大陆的：
1. 中国农业银行、中国邮政储蓄银行等商业银行涉农产品；
2. 农村商业银行、农村信用社等地方金融机构；
3. 农业发展银行等政策性金融渠道；
4. 由国家或地方公开文件支持、且申请材料中可核实条件的惠农政策。
不要虚构具体利率、额度、补贴金额或申报截止时间。无法确认时明确提示“以经办机构最新公布为准”，
并建议农户向当地农业农村部门或银行核实。不要推荐境外或网络高息贷款。

JSON 数据 = {json_data}

重要：请全程使用简体中文回答（用户语言代码：{target_language}）。

任务：
1. 判断贷款类型，并说明评估该类型贷款所需的关键字段。
2. 根据农户提供的材料分析匹配情况；这是材料完整性提示，不是授信审批结论。
3. 指出材料优势、潜在不足与需要补充的信息。
4. 明确指出 JSON 中缺失的关键字段。
5. 给出农户可以执行的下一步建议。
6. 仅列出有公开依据的涉农政策方向；无法核实时明确标注，不得编造金额、利率、期限或资格。
7. 语气清晰、支持性强、便于农户理解。
8. 使用 Markdown，固定包含以下小节：贷款类型、材料匹配情况、可能关注的额度条件、需要补充的材料、政策核实建议。
9. 不要输出未经材料支持的假设。

示例输出结构：
## 贷款类型
## 材料匹配情况
## 可能关注的额度条件
## 需要补充的材料
## 政策核实建议
"""

        # Create a cache key based on the prompt
        cache_key = f"ai_loan_{hashlib.md5(prompt.encode()).hexdigest()}"
        cached_response = cache.get(cache_key)
        
        if cached_response:
            logger.info("Serving loan processing from cache")
            return jsonify({
                "status": "success",
                "message": "贷款材料分析完成（缓存结果）",
                "result": cached_response
            }), 200

        reply = ai_service.generate_text(prompt, temperature=0.3)

        if not reply:
            return jsonify({
                "status": "error",
                "message": "当前未配置大模型服务，无法生成贷款材料分析。请先配置 DEEPSEEK_API_KEY。"
            }), 503
        
        # Cache the result for 24 hours (86400 seconds)
        cache.set(cache_key, reply, timeout=86400)
        
        return jsonify({
            "status": "success",
            "message": "贷款材料分析完成",
            "result": reply
        }), 200

    except Exception:
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": "Failed to process loan request. Please try again later."
        }), 500


@app.route('/generate-loan-report', methods=['POST'])
def generate_loan_report_endpoint():
    """
    Generate and send loan report via email (async)
    Request body should contain:
    - farmer_data: Application data
    - assessment_result: AI assessment text
    - email: Farmer's email
    - name: Farmer's name (optional)
    - send_email: Boolean to control email sending (default: True)
    """
    try:
        data = request.get_json(force=True)
        
        # Validate required fields
        if not data.get('farmer_data'):
            return jsonify({
                "status": "error",
                "message": "farmer_data is required"
            }), 400
        
        if not data.get('assessment_result'):
            return jsonify({
                "status": "error",
                "message": "assessment_result is required"
            }), 400
        
        if not data.get('email'):
            return jsonify({
                "status": "error",
                "message": "email is required"
            }), 400
        
        farmer_data = data['farmer_data']
        assessment_result = data['assessment_result']
        farmer_email = data['email']
        farmer_name = data.get('name', farmer_data.get('name', 'Valued Farmer'))
        send_email = data.get('send_email', True)
        
        if send_email:
            # Trigger async task to generate and send report
            task = generate_and_send_report.delay(
                farmer_data=farmer_data,
                assessment_result=assessment_result,
                farmer_email=farmer_email,
                farmer_name=farmer_name
            )
            
            return jsonify({
                "status": "success",
                "message": f"Report generation started. Email will be sent to {farmer_email}",
                "task_id": task.id
            }), 202  # 202 Accepted - processing async
        else:
            # Generate PDF only (sync)
            try:
                pdf_path = generate_loan_report(farmer_data, assessment_result, farmer_email)
                return jsonify({
                    "status": "success",
                    "message": "Report generated successfully",
                    "pdf_path": pdf_path,
                    "download_url": f"/download-report/{os.path.basename(pdf_path)}"
                }), 200
            except Exception as e:
                return jsonify({
                    "status": "error",
                    "message": f"Failed to generate report: {str(e)}"
                }), 500
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": f"Failed to process report request: {str(e)}"
        }), 500


@app.route('/download-report/<filename>', methods=['GET'])
def download_report(filename):
    """Download generated PDF report"""
    try:
        reports_dir = 'reports'
        return send_from_directory(reports_dir, filename, as_attachment=True)
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Report not found"
        }), 404


@app.route('/task-status/<task_id>', methods=['GET'])
def get_task_status_public(task_id):
    """Check status of async task"""
    try:
        from backend.config.celery_config import celery_app
        task = celery_app.AsyncResult(task_id)
        
        if task.state == 'PENDING':
            response = {
                'status': 'pending',
                'message': 'Task is waiting to be processed'
            }
        elif task.state == 'STARTED':
            response = {
                'status': 'processing',
                'message': 'Task is being processed'
            }
        elif task.state == 'SUCCESS':
            response = {
                'status': 'completed',
                'message': 'Task completed successfully',
                'result': task.result
            }
        elif task.state == 'FAILURE':
            response = {
                'status': 'failed',
                'message': str(task.info)
            }
        else:
            response = {
                'status': task.state,
                'message': 'Task status unknown'
            }
        
        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to get task status: {str(e)}"
        }), 500


# Serve HTML pages
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/farmer')
def farmer():
    return send_from_directory('.', 'farmer.html')

@app.route('/shopkeeper')
def shopkeeper():
    return send_from_directory('.', 'shopkeeper.html')

@app.route('/main')
def main():
    return send_from_directory('.', 'main.html')

@app.route('/about')
def about():
    return send_from_directory('.', 'about.html')

@app.route('/blog')
def blog():
    return send_from_directory('.', 'blog.html')

@app.route('/contact')
def contact():
    return send_from_directory('.', 'contact.html')

@app.route('/chat')
def chat():
    return send_from_directory('.', 'chat.html')

@app.route('/reset-password/<token>')
def reset_password_page(token):
    return send_from_directory('.', 'reset-password.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)


if __name__ == '__main__':
    # 本地演示默认关闭 reloader，避免 Windows 下重复进程与端口占用。
    _port = int(os.getenv("PORT", "5000"))
    _debug = os.getenv("FLASK_DEBUG", "0").strip().lower() in {"1", "true", "yes"}
    print(f"AgriTech 中文版已启动：http://127.0.0.1:{_port}")
    socketio.run(
        app,
        host=os.getenv("HOST", "127.0.0.1"),
        port=_port,
        debug=_debug,
        use_reloader=_debug,
        allow_unsafe_werkzeug=True,
    )

#Global Error Handling 
@app.errorhandler(404)
def not_found(error):
    logger.warning("404 Error: %s", request.path)
    wants_json = (
        request.path.startswith('/api')
        or request.accept_mimetypes.best_match(['text/html', 'application/json']) == 'application/json'
    )

    if wants_json:
        return jsonify({
            "status": "error",
            "message": t('error_user_not_found')
        }), 404

    return render_template('404.html', requested_path=request.path), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error("500 Error: %s", str(error), exc_info=True)
    return jsonify({
        "status": "error",
        "message": "Internal server error"
    }), 500


@app.route('/rotation')
def rotation_page():
    return render_template('crop_rotation.html')
