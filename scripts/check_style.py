"""House style check for the course pages.

Flags patterns the style guide rules out: dashes as separators, semicolons, bold lead-ins,
horizontal rules, summary headings, emojis, the German sharp s, guillemets in English pages,
colons in running text, titles built as from-to, teaser, question, indirect question or slogan, and known stock
phrases. Code blocks, inline code, formulas, front matter and directive lines are skipped. Exit code 1 when a page
breaks a rule.

    python scripts/check_style.py [paths...]

Without paths it checks every course page. The private teaching guide is checked locally by passing its folder.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "site" / "src" / "content" / "docs"

SUMMARY_HEADINGS = re.compile(
    r"^#{2,6}\s+(zusammenfassung|fazit|das wichtigste in kürze|summary|in summary|conclusion|key takeaways|recap)\b",
    re.IGNORECASE,
)
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿]")

# Headings and box titles name the subject plainly, see the style guide (headings and titles)
TITLE_PATTERNS = [
    (re.compile(r"^(vom|von)\b.*\b(zum|zur|zu|bis)\b", re.IGNORECASE), "from-to title"),
    (re.compile(r"^from\b.*\bto\b", re.IGNORECASE), "from-to title"),
    (re.compile(r"^(warum|wieso|weshalb|why)\b", re.IGNORECASE), "teaser title"),
    (re.compile(r"\?\s*$"), "question as title"),
    (
        re.compile(r"^(was|wie|welche[mnrs]?|wann|wo|wozu|wer|how|what|which|when|where|who)\b", re.IGNORECASE),
        "indirect question as title",
    ),
    (re.compile(r"\b(reicht|reichen|genügt|genügen) nicht\s*$|\bis(n't| not) enough\s*$", re.IGNORECASE), "slogan title"),
]
DIRECTIVE_LABEL = re.compile(r"^:{3,}[a-z]+\[(.+)\]")
FRONT_MATTER_TITLE = re.compile(r"^(title|label):\s*[\"']?(.+?)[\"']?\s*$")

# Formulaic openers and aphoristic closers that read like generated text
STOCK_PHRASES = [
    "zwei dinge fallen auf",
    "ist es nicht anders",
    "der ausweg ist",
    "tauchen wir ein",
    "spannende reise",
    "werfen wir einen blick",
    "kurz gesagt",
    "mit anderen worten",
    "zusammenfassend",
    "erklärt viel, aber nicht alles",
    "spielt eine wichtige rolle",
    "spielt eine zentrale rolle",
    "kommt ins spiel",
    "two things stand out",
    "dive into",
    "let's take a look",
    "here's the thing",
    "in a nutshell",
    "in other words",
    "it's worth noting",
    "plays a crucial role",
    "plays a key role",
    "comes into play",
    "the way out is",
    "is no different",
    "explains a lot",
    "at its core",
    "at the heart of",
    "im kern",
    "the real question",
    "liegt die sache anders",
    "dreht man die arbeit um",
    "genau das ist gemeint",
    "wie sich gleich zeigt",
    "is a different matter",
    "turns the work around",
    "that is exactly what people mean",
    "as it soon turns out",
]


def title_problems(title: str) -> list[str]:
    return [message for pattern, message in TITLE_PATTERNS if pattern.search(title.strip())]


def prose_of(line: str) -> str:
    """Removes inline code, which may contain any character."""
    return re.sub(r"`[^`]*`", "", line)


def check(path: Path) -> list[str]:
    english = "/en/" in path.as_posix() or path.as_posix().endswith("/en")
    problems = []
    in_code = False
    in_front_matter = False
    in_math = False
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        stripped = line.strip()
        where = f"{display(path)}:{number}"
        if number == 1 and stripped == "---":
            in_front_matter = True
            continue
        if in_front_matter:
            in_front_matter = stripped != "---"
            field = FRONT_MATTER_TITLE.match(stripped)
            if field:
                problems.extend(f"{where} {message}" for message in title_problems(field.group(2)))
            continue
        if stripped.startswith("```"):
            in_code = not in_code
            continue
        if stripped == "$$":
            in_math = not in_math
            continue
        label = DIRECTIVE_LABEL.match(stripped)
        if label and not in_code:
            problems.extend(f"{where} {message}" for message in title_problems(label.group(1)))
        if in_code or in_math or stripped.startswith(":") or stripped.startswith("<"):
            continue

        prose = prose_of(line)
        heading = re.match(r"^#{2,6}\s+(.*)$", stripped)
        if heading:
            problems.extend(f"{where} {message}" for message in title_problems(heading.group(1)))
        lowered = prose.lower()
        for phrase in STOCK_PHRASES:
            if phrase in lowered:
                problems.append(f'{where} stock phrase "{phrase}"')
        if re.fullmatch(r"\s*([-*_]\s*){3,}", line):
            problems.append(f"{where} horizontal rule")
        if re.search(r"[—–]", prose):
            problems.append(f"{where} dash used as a separator")
        if ";" in prose:
            problems.append(f"{where} semicolon")
        if re.search(r"\*\*[^*]+:\*\*|\*\*[^*]+\*\*:", prose):
            problems.append(f"{where} bold lead-in with a colon")
        if SUMMARY_HEADINGS.match(stripped):
            problems.append(f"{where} summary heading")
        if EMOJI.search(prose):
            problems.append(f"{where} emoji")
        if not english and "ß" in prose:
            problems.append(f"{where} sharp s in Swiss German text")
        if english and re.search(r"«[^»]*»", prose):
            problems.append(f"{where} guillemets in English text")
        # Colons may end a line before a formula, code or a list, or stand right before a formula
        colon_in_text = re.search(r":\s", prose) and not prose.rstrip().endswith(":")
        if colon_in_text and not stripped.startswith("|") and not re.search(r":\s*\$", line):
            problems.append(f"{where} colon in running text")
    return problems


def display(path: Path) -> str:
    try:
        return path.relative_to(ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def main(arguments: list[str]) -> int:
    paths = []
    for argument in arguments:
        path = Path(argument).resolve()
        paths.extend(sorted(path.rglob("*.md")) if path.is_dir() else [path])
    paths = paths or sorted(DOCS.rglob("*.md"))
    problems = [problem for path in paths for problem in check(path)]
    for problem in problems:
        print(problem)
    print(f"{len(paths)} pages checked, {len(problems)} problems")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
