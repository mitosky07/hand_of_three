import json
import re
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
VERSION = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["version"]
OUTPUT = ROOT / "release" / f"Hand-of-Three-{VERSION}-itch.zip"


def build_archive() -> None:
    if not (DIST / "index.html").is_file():
        raise SystemExit("dist/index.html is missing; run npm run build first")

    OUTPUT.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(OUTPUT, "w", zipfile.ZIP_DEFLATED) as archive:
        for source in sorted(path for path in DIST.rglob("*") if path.is_file()):
            archive.write(source, source.relative_to(DIST).as_posix())


def verify_archive() -> None:
    with zipfile.ZipFile(OUTPUT) as archive:
        names = archive.namelist()
        if names.count("index.html") != 1:
            raise SystemExit("archive must contain exactly one root index.html")
        if any("\\" in name or name.startswith("/") for name in names):
            raise SystemExit("archive contains a non-portable path")

        html = archive.read("index.html").decode("utf-8")
        references = re.findall(r'(?:src|href)="\./([^"]+)"', html)
        missing = sorted(reference for reference in references if reference not in names)
        if missing:
            raise SystemExit(f"index.html references missing files: {missing}")

    print(f"Created: {OUTPUT}")
    print(f"Entries: {len(names)}")
    print("Root index.html: yes")
    print("Portable paths: yes")
    print("Referenced assets: yes")


if __name__ == "__main__":
    build_archive()
    verify_archive()
