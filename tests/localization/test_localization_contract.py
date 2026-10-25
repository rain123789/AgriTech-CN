"""本地化契约测试：检查关键约定是否在代码中成立（无需浏览器）。"""
import json
import os
import re
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

SOURCE_SUFFIXES = {".py", ".js", ".html", ".css", ".json", ".md", ".txt", ".cmd"}
SKIP_DIRS = {".git", "artifacts", "vendor", "node_modules", ".venv", "instance", "__pycache__"}


def iter_source_files():
    for path in ROOT.rglob("*"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.suffix.lower() in SOURCE_SUFFIXES and path.is_file():
            yield path


def test_no_hardcoded_api_key_in_sources():
    """源码中不得出现形如 sk-xxxxxxxx 的真实密钥。"""
    pattern = re.compile(r"sk-[A-Za-z0-9]{20,}")
    offenders = []
    for path in iter_source_files():
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for match in pattern.findall(text):
            offenders.append(f"{path.relative_to(ROOT)}: {match[:6]}…")
    assert not offenders, f"检测到疑似硬编码密钥：{offenders}"


def test_env_example_declares_deepseek_and_keeps_key_empty():
    text = (ROOT / ".env.example").read_text(encoding="utf-8")
    assert "DEEPSEEK_API_KEY=" in text
    assert re.search(r"^DEEPSEEK_API_KEY=\s*$", text, re.M)
    assert "GEMINI_API_KEY" in text  # 仅作为上游遗留注释保留


def test_translations_have_zh_and_en():
    text = (ROOT / "translations.js").read_text(encoding="utf-8")
    assert "zh:" in text and "en:" in text
    assert "首页" in text


def test_offline_locale_dictionary_exists_and_is_chinese():
    path = ROOT / "scripts" / "locales" / "zh-CN-extra.js"
    assert path.exists()
    body = path.read_text(encoding="utf-8")
    assert "window.CN_EXTRA_TEXT" in body
    assert re.search(r"[\u4e00-\u9fff]", body)


def test_marketplace_uses_cny_and_mainland_provinces():
    text = (ROOT / "marketplace-cn.js").read_text(encoding="utf-8")
    assert "¥" in text
    for province in ("湖北省", "河南省", "山东省", "江苏省", "四川省", "黑龙江省"):
        assert province in text
    assert "₹" not in text


def test_ai_service_prefers_deepseek_over_gemini():
    app_text = (ROOT / "app.py").read_text(encoding="utf-8")
    node_text = (ROOT / "server.js").read_text(encoding="utf-8")
    assert "DEEPSEEK_API_KEY" in node_text
    assert "generativelanguage.googleapis.com" not in node_text
    assert "genai.configure" not in app_text


def test_plant_disease_model_is_disabled_by_default():
    app_text = (ROOT / "app.py").read_text(encoding="utf-8")
    assert 'ENABLE_PLANT_MODEL' in app_text
    assert 'os.getenv("ENABLE_PLANT_MODEL", "0")' in app_text


def test_fertilizer_converts_kg_per_ha_to_kg_per_mu():
    """1 公顷 = 15 亩，用量换算必须除以 15。"""
    from backend.api.local_core_routes import local_core_bp  # noqa: F401
    source = (ROOT / "backend" / "api" / "local_core_routes.py").read_text(encoding="utf-8")
    assert "/ 15" in source or "/15" in source


def test_local_interfaces_are_registered():
    from app import app as flask_app
    rules = {rule.rule for rule in flask_app.url_map.iter_rules()}
    for endpoint in (
        "/api/chat",
        "/api/ai/status",
        "/api/disease/predict",
        "/api/fertilizer/recommend",
        "/api/v1/weather/current",
        "/api/v1/advisories/",
        "/api/v1/forum/categories",
        "/crop/predict",
    ):
        assert endpoint in rules, f"缺少接口：{endpoint}"


def test_chinese_default_language_in_pages():
    """主要页面必须声明 zh-CN。"""
    pages = [
        "index.html", "marketplace.html", "chat.html", "disease.html",
        "fertilizer.html", "login.html", "register.html", "faq.html",
        "news.html", "blog.html", "community_forum.html", "scheme.html",
    ]
    for page in pages:
        text = (ROOT / page).read_text(encoding="utf-8")
        assert 'lang="zh-CN"' in text, page
