"""注册校验测试（中国大陆本地化版本）。

上游原测试强制要求 @gmail.com 且姓名只能为 ASCII 字母；
本地化版本按任务要求放开邮箱服务商并支持中文姓名，因此断言同步更新。
"""
import os
import sys
import unittest
import uuid

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.models.user import User
from backend.utils.validation import validate_email, validate_full_name, validate_username


class TestRegistrationValidation(unittest.TestCase):
    def test_valid_user(self):
        """普通邮箱 + 中文姓名应被接受。"""
        user = User(username="zhangsan", email="zhangsan@example.com", full_name="张三")
        self.assertEqual(user.full_name, "张三")
        self.assertEqual(user.email, "zhangsan@example.com")
        self.assertEqual(user.location, "中国大陆")

    def test_non_gmail_email_is_allowed(self):
        """不再限制邮箱服务商。"""
        for email in ("user@qq.com", "user@163.com", "user@outlook.com", "user@example.com"):
            self.assertTrue(validate_email(email)[0], email)

    def test_invalid_email_format_is_rejected(self):
        self.assertFalse(validate_email("not-an-email")[0])
        self.assertFalse(validate_email("")[0])

    def test_chinese_full_name_is_allowed(self):
        self.assertTrue(validate_full_name("张三")[0])
        self.assertTrue(validate_full_name("阿依古丽·买买提")[0])
        self.assertTrue(validate_full_name("李小龙")[0])

    def test_invalid_name_is_rejected(self):
        self.assertFalse(validate_full_name("John 123")[0])
        self.assertFalse(validate_full_name("A")[0])
        self.assertFalse(validate_full_name("x" * 60)[0])

    def test_username_supports_chinese(self):
        self.assertTrue(validate_username("农户老张")[0])
        self.assertFalse(validate_username("bad name!")[0])

    def test_empty_fullname_falls_back_to_username(self):
        user = User(username="JohnDoe", email="john@example.com")
        self.assertEqual(user.full_name, "JohnDoe")


class TestAuthRoutes(unittest.TestCase):
    def _client(self):
        from app import app as flask_app
        flask_app.config['TESTING'] = True
        return flask_app.test_client()

    def test_register_route_accepts_chinese_name_and_common_email(self):
        client = self._client()
        unique = uuid.uuid4().hex[:8]
        payload = {
            'username': f'zhangsan_{unique}',
            'email': f'zhangsan_{unique}@example.com',
            'password': 'AgriTech123',
            'full_name': '张三',
            'role': 'farmer',
            'location': '湖北省武汉市',
        }
        resp = client.post('/api/auth/register', json=payload)
        self.assertEqual(resp.status_code, 201, resp.get_json())
        self.assertEqual(resp.get_json()['user']['full_name'], '张三')

    def test_register_route_rejects_invalid_name(self):
        client = self._client()
        unique = uuid.uuid4().hex[:8]
        payload = {
            'username': f'john{unique}',
            'email': f'john{unique}@example.com',
            'password': 'AgriTech123',
            'full_name': 'John 123',
            'role': 'farmer',
        }
        resp = client.post('/api/auth/register', json=payload)
        self.assertEqual(resp.status_code, 400)
        self.assertIn('姓名', resp.get_json().get('message', ''))

    def test_register_route_rejects_weak_password(self):
        client = self._client()
        unique = uuid.uuid4().hex[:8]
        payload = {
            'username': f'lisi_{unique}',
            'email': f'lisi_{unique}@example.com',
            'password': 'short',
            'full_name': '李四',
            'role': 'farmer',
        }
        resp = client.post('/api/auth/register', json=payload)
        self.assertEqual(resp.status_code, 400)


if __name__ == '__main__':
    unittest.main()
