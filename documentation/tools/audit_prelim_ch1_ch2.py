import re
import sys
from pathlib import Path

from docx import Document


path = Path(sys.argv[1])
doc = Document(path)
paragraphs = [p.text for p in doc.paragraphs]
text = "\n".join(paragraphs)
lower = text.lower()

required = [
    "DECLARATION",
    "CERTIFICATION",
    "DEDICATION",
    "ACKNOWLEDGEMENTS",
    "ABSTRACT",
    "TABLE OF CONTENTS",
    "LIST OF TABLES",
    "LIST OF FIGURES",
    "LIST OF ABBREVIATIONS",
    "CHAPTER ONE INTRODUCTION",
    "CHAPTER TWO LITERATURE REVIEW",
    "REFERENCES",
]
for heading in required:
    assert heading in text, f"Missing required section: {heading}"

for prohibited in [
    "ai writing",
    "writing assistant",
    "documentation process",
    "generated statements",
    "ethical and ai use statement",
    "appendix d",
    "right click and update",
    "lorem ipsum",
    "todo",
    "tbd",
]:
    assert prohibited not in lower, f"Prohibited text found: {prohibited}"

assert "\u2014" not in text, "Em dash found"
assert "\u2013" not in text, "En dash found"

abstract_start = paragraphs.index("ABSTRACT") + 1
toc_start = paragraphs.index("TABLE OF CONTENTS")
abstract = " ".join(paragraphs[abstract_start:toc_start])
abstract_words = re.findall(r"\b[\w'-]+\b", abstract)
assert len(abstract_words) <= 300, f"Abstract has {len(abstract_words)} words"

print(f"PASS: {path.name}")
print(f"Abstract words: {len(abstract_words)}")
print("Em dash count: 0")
print("En dash count: 0")
print("Prohibited disclosure or placeholder phrases: 0")
