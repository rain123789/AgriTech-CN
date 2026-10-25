"""合并缓存译文与人工校订词典，生成运行时使用的 scripts/locales/zh-CN-extra.js。

不进行网络请求，仅做本地合并。
"""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LOCALES = ROOT / "scripts" / "locales"
CACHE = ROOT / "artifacts" / "smoke" / "translation-cache.json"
OUTPUT = LOCALES / "zh-CN-extra.js"


def load_builtin_manual() -> dict:
    spec = importlib.util.spec_from_file_location(
        "build_extra_locale", ROOT / "scripts" / "localization" / "build_extra_locale.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return dict(module.MANUAL)


def main() -> None:
    result: dict[str, str] = {}
    if CACHE.exists():
        result.update(json.loads(CACHE.read_text(encoding="utf-8")))
    result.update(load_builtin_manual())
    for path in sorted(LOCALES.glob("manual-override*.json")):
        result.update(json.loads(path.read_text(encoding="utf-8")))
    result = {key.strip(): value for key, value in result.items() if key and value and isinstance(value, str)}

    LOCALES.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        "/* 构建期生成的离线中文补充词典，运行时无需联网。\n"
        "   来源：真实浏览器提取的未翻译文本 + 构建期翻译 + 人工农业术语校订。 */\n"
        "window.CN_EXTRA_TEXT = Object.assign(window.CN_EXTRA_TEXT || {}, "
        + json.dumps(result, ensure_ascii=False, indent=2)
        + ");\n",
        encoding="utf-8",
    )
    print(f"已合并 {len(result)} 条词典 -> {OUTPUT}")


if __name__ == "__main__":
    main()
