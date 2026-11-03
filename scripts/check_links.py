"""Link check of the built site: every internal link points to a page that exists and every anchor
to an id on that page. Run it after the build.

    python scripts/check_links.py [site/dist]
"""

import os
import re
import sys
import urllib.parse
from pathlib import Path

BASE = "/"
SKIPPED = ("http", "mailto", "#_top", "data:")
ASSETS = (".svg", ".css", ".js", ".png", ".ico", ".xml", ".txt")


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / "site" / "dist")
    pages = list(root.rglob("*.html"))
    ids = {page.resolve(): set(re.findall(r'id="([^"]+)"', page.read_text(encoding="utf-8"))) for page in pages}
    problems = []
    for page in pages:
        for href in re.findall(r'href="([^"]+)"', page.read_text(encoding="utf-8")):
            if href.startswith(SKIPPED) or href.startswith(BASE + "_astro"):
                continue
            path, _, fragment = href.partition("#")
            if href.startswith(BASE):
                target = root / path[len(BASE):]
            elif path == "":
                target = page
            else:
                target = page.parent / path
            target = Path(os.path.normpath(target))
            if target.is_dir() or not target.suffix:
                target = target / "index.html"
            if not target.exists():
                if not path.endswith(ASSETS):
                    problems.append(f"{page.relative_to(root)}: missing page {href}")
                continue
            if fragment and urllib.parse.unquote(fragment) not in ids.get(target.resolve(), set()):
                problems.append(f"{page.relative_to(root)}: missing anchor {href}")
    for problem in problems:
        print(problem)
    print(f"{len(pages)} pages checked, {len(problems)} problems")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
