"""Language parity check: every German page has an English twin with the same structure.

German pages live at the root of the docs folder, English pages under en/ with the same
file name. The check compares headings, figures, directive blocks, code embeds and
playgrounds, so a missing exercise or figure in one language shows up in CI.

    python scripts/check_parity.py
"""

import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "site" / "src" / "content" / "docs"


def structure(path: Path) -> Counter:
    text = path.read_text(encoding="utf-8")
    counts = Counter()
    counts["headings"] = len(re.findall(r"^#{2,6} ", text, re.MULTILINE))
    counts["figures"] = len(re.findall(r"!\[[^\]]*\]\([^)]*\.svg\)", text))
    counts["code embeds"] = len(re.findall(r"^::code\{", text, re.MULTILINE))
    counts["playgrounds"] = len(re.findall(r"^::playground\{", text, re.MULTILINE))
    counts["tables"] = len(re.findall(r"^\|[-| :]+\|\s*$", text, re.MULTILINE))
    counts["widgets"] = len(re.findall(r"^<[a-z]+-[a-z-]+[\s>]", text, re.MULTILINE))
    for name in re.findall(r"^:{3,}([a-z]+)", text, re.MULTILINE):
        counts[f"block {name}"] += 1
    return counts


def main() -> int:
    problems = []
    german = [path for path in DOCS.rglob("*.md") if "en" not in path.relative_to(DOCS).parts[:1]]
    for de_path in sorted(german):
        relative = de_path.relative_to(DOCS)
        en_path = DOCS / "en" / relative
        if not en_path.exists():
            problems.append(f"{relative.as_posix()} has no English twin")
            continue
        de, en = structure(de_path), structure(en_path)
        for key in sorted(set(de) | set(en)):
            if de[key] != en[key]:
                problems.append(f"{relative.as_posix()} {key}: German {de[key]}, English {en[key]}")
    english = [path for path in (DOCS / "en").rglob("*.md")] if (DOCS / "en").exists() else []
    for en_path in sorted(english):
        if not (DOCS / en_path.relative_to(DOCS / "en")).exists():
            problems.append(f"en/{en_path.relative_to(DOCS / 'en').as_posix()} has no German twin")
    for problem in problems:
        print(problem)
    print(f"{len(german)} German pages compared, {len(problems)} problems")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
