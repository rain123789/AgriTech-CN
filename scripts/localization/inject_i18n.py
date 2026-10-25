"""把统一的中文运行时与字体补丁注入项目 HTML。

可重复执行：已经注入的页面不会重复添加。
不处理备份、测试、构建产物目录。
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
EXCLUDED_PARTS = {
    ".git",
    "node_modules",
    "artifacts",
    "dist",
    "build",
    ".venv",
    "__pycache__",
}

updated = 0
skipped = 0
for path in ROOT.rglob("*.html"):
    if any(part in EXCLUDED_PARTS for part in path.parts):
        continue
    rel = path.relative_to(ROOT)
    if any(token in path.name.lower() for token in ("backup", "test-")):
        skipped += 1
        continue
    depth = max(0, len(rel.parts) - 1)
    prefix = "../" * depth
    css_href = f"{prefix}cn-i18n.css"
    js_src = f"{prefix}scripts/i18n.js"

    text = path.read_text(encoding="utf-8", errors="ignore")
    original = text

    # 统一文档语言；只改首个 html 开标签
    def normalize_html_tag(match):
        attrs = re.sub(r'\s+(?:lang|data-lang)\s*=\s*["\'][^"\']*["\']', "", match.group(1), flags=re.I)
        return f'<html{attrs} lang="zh-CN" data-lang="zh-CN">'

    text = re.sub(r"<html\b([^>]*)>", normalize_html_tag, text, count=1, flags=re.I)

    if "cn-i18n.css" not in text and "</head>" in text.lower():
        index = text.lower().rfind("</head>")
        text = text[:index] + f'  <link rel="stylesheet" href="{css_href}" />\n' + text[index:]

    extra_src = f"{prefix}scripts/locales/zh-CN-extra.js"
    translations_src = f"{prefix}translations.js"
    if "scripts/locales/zh-CN-extra.js" not in text:
        extra_tag = f'  <script src="{extra_src}" defer></script>\n'
        translations_tag = f'  <script src="{translations_src}" defer></script>\n'
        i18n_marker = f'<script src="{js_src}"'
        if i18n_marker in text:
            index = text.index(i18n_marker)
            block = (translations_tag if "translations.js" not in text else "") + extra_tag
            text = text[:index] + block + text[index:]
        else:
            already_script = "scripts/i18n.js" in text or "cn-i18n.js" in text
            if not already_script:
                tag = f'  <script src="{js_src}" defer></script>\n'
                block = (translations_tag if "translations.js" not in text else "") + extra_tag
                if "</body>" in text.lower():
                    index = text.lower().rfind("</body>")
                    text = text[:index] + block + tag + text[index:]
                else:
                    text += "\n" + block + tag
    else:
        already_script = "scripts/i18n.js" in text or "cn-i18n.js" in text
        if not already_script:
            tag = f'  <script src="{js_src}" defer></script>\n'
            if "</body>" in text.lower():
                index = text.lower().rfind("</body>")
                text = text[:index] + tag + text[index:]
            else:
                text += "\n" + tag

    if text != original:
        path.write_text(text, encoding="utf-8")
        updated += 1

print(f"已更新 {updated} 个 HTML，跳过备份/测试页面 {skipped} 个。")
