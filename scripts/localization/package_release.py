"""打包发布版：生成可直接交付的 zip 压缩包。

用法：
    python scripts/localization/package_release.py            # 输出到 dist/
    python scripts/localization/package_release.py --out D:/somewhere

默认排除：.git、artifacts、node_modules、虚拟环境、__pycache__、
上游体量较大的实验数据目录（保留仓库中的原始文件，仅不进入压缩包），
以及病害测试图（仅保留自动化测试实际引用的 3 张）。
"""
from __future__ import annotations

import argparse
import hashlib
import zipfile
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

EXCLUDE_DIR_NAMES = {
    ".git", ".github-cache", "artifacts", "node_modules", "__pycache__",
    ".venv", "venv", ".pytest_cache", ".mypy_cache", "dist", ".idea", ".vscode",
    "instance", ".cache",
}
# 上游体量较大的实验目录：仓库内保留，压缩包中不携带
EXCLUDE_DIR_PATHS = {
    "Disease prediction",
    "tomato disease detection",
    "disease_prediction",
    "Soil Classifier CNN",
    "Soil Classification Model",
}
# 人脸模型：仅上游迁移脚本引用，页面不用，随包省 12MB
EXCLUDE_FILES = {
    "face_vs_nonface_model.h5",
}

# 病害测试图：仅保留自动化测试引用的样本
DISEASE_TEST_KEEP = {
    "TomatoEarlyBlight1.JPG",
    "PotatoEarlyBlight1.JPG",
    "CornCommonRust1.JPG",
}


def is_excluded_dir(path: Path) -> bool:
    rel = path.relative_to(ROOT)
    if rel.name in EXCLUDE_DIR_NAMES:
        return True
    if str(rel) in EXCLUDE_DIR_PATHS:
        return True
    return False


def should_skip_file(path: Path) -> bool:
    rel = path.relative_to(ROOT)
    if rel.parts[:2] == ("Plant Disease Detection", "test"):
        return path.name not in DISEASE_TEST_KEEP
    if str(rel) in EXCLUDE_FILES:
        return True
    return False


def iter_files():
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT)
        if any(is_excluded_dir(ROOT.joinpath(*rel.parts[:i])) for i in range(1, len(rel.parts) + 1)):
            continue
        if should_skip_file(path):
            continue
        yield path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default=str(ROOT / "dist"))
    args = parser.parse_args()
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M")
    target = out_dir / f"AgriTech-CN-vercel-deploy-{stamp}.zip"

    count = 0
    total = 0
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for path in iter_files():
            rel = path.relative_to(ROOT)
            archive.write(path, arcname=str(Path("AgriTech-CN") / rel))
            count += 1
            total += path.stat().st_size

    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    manifest = out_dir / f"AgriTech-CN-vercel-deploy-{stamp}.sha256"
    manifest.write_text(f"{digest}  {target.name}\n", encoding="utf-8")

    print(f"已打包 {count} 个文件（原始 {total / 1024 / 1024:.1f} MB）")
    print(f"压缩包：{target}（{target.stat().st_size / 1024 / 1024:.1f} MB）")
    print(f"校验值：{digest}")
    print(f"校验文件：{manifest}")


if __name__ == "__main__":
    main()
