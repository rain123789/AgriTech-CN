"""启动配置测试：本地演示模式不再因缺少大模型密钥而拒绝启动。

上游原测试要求缺少 GEMINI_API_KEY 时直接抛错；本地化版本改为
「默认基础演示模式 + 配置后启用在线服务」，因此断言同步更新。
"""
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


class TestLocalDemoMode:
    def test_app_imports_without_any_ai_key(self):
        """没有配置任何大模型密钥时，应用必须可以正常导入。"""
        for key in ("DEEPSEEK_API_KEY", "AI_API_KEY", "GEMINI_API_KEY"):
            os.environ.pop(key, None)
        from app import app as flask_app
        assert flask_app is not None

    def test_ai_status_reports_mode(self):
        from app import app as flask_app
        flask_app.config['TESTING'] = True
        client = flask_app.test_client()
        resp = client.get('/api/ai/status')
        assert resp.status_code == 200
        payload = resp.get_json()
        assert 'mode' in payload and 'configured' in payload
        assert payload['plant_disease_model']['classes'] == 38

    def test_health_endpoint_ok(self):
        from app import app as flask_app
        flask_app.config['TESTING'] = True
        client = flask_app.test_client()
        resp = client.get('/health')
        assert resp.status_code == 200
        assert resp.get_json()['status'] in {'healthy', 'ok', 'degraded'}

    def test_chat_endpoint_answers_in_chinese_without_key(self):
        """无 Key 时 /api/chat 返回中文离线回答并明确标注来源。"""
        from app import app as flask_app
        flask_app.config['TESTING'] = True
        client = flask_app.test_client()
        resp = client.post('/api/chat', json={'message': '水稻分蘖期怎么管理？'})
        assert resp.status_code == 200
        payload = resp.get_json()
        assert payload['reply']
        assert any('\u4e00' <= ch <= '\u9fff' for ch in payload['reply'])
        assert payload['mode'] in {'offline', 'offline-fallback', 'online'}

    def test_legacy_validate_required_config_still_available(self):
        """历史配置校验函数保留，便于追溯上游行为。"""
        from backend.config import validate_required_config
        assert callable(validate_required_config)
