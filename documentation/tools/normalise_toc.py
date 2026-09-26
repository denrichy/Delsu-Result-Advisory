from pathlib import Path
import sys

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt


path = Path(sys.argv[1]).resolve()
document = Document(path)

for style_name in ("TOC 1", "TOC 2", "TOC 3"):
    if style_name in document.styles:
        style = document.styles[style_name]
        style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        style.paragraph_format.line_spacing = 1.0
        style.paragraph_format.space_after = Pt(5)

for paragraph in document.paragraphs:
    if paragraph.style and paragraph.style.name.startswith("TOC "):
        paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
        paragraph.paragraph_format.first_line_indent = Inches(0)
        paragraph.paragraph_format.line_spacing = 1.0
        paragraph.paragraph_format.space_after = Pt(5)

for paragraph_element in document._element.xpath(".//w:p[w:pPr/w:pStyle[starts-with(@w:val, 'TOC')]]"):
    properties = paragraph_element.get_or_add_pPr()
    justification = properties.find(qn("w:jc"))
    if justification is None:
        justification = OxmlElement("w:jc")
        properties.append(justification)
    justification.set(qn("w:val"), "left")
    for tab in properties.xpath("./w:tabs/w:tab"):
        if tab.get(qn("w:val")) == "right":
            tab.set(qn("w:pos"), "7200")

document.save(path)
