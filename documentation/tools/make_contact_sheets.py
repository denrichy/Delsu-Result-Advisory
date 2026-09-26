from pathlib import Path

from PIL import Image, ImageDraw


source = Path(__file__).resolve().parents[1] / "qa" / "prelim-ch1-ch2-word-render"
pages = sorted(source.glob("page-*.png"))

for start in range(0, len(pages), 4):
    batch = pages[start : start + 4]
    thumbs = []
    for page in batch:
        image = Image.open(page).convert("RGB")
        image.thumbnail((620, 875))
        thumbs.append((page, image.copy()))

    sheet = Image.new("RGB", (1280, 1810), "#d7d7d7")
    draw = ImageDraw.Draw(sheet)
    for index, (page, image) in enumerate(thumbs):
        x = 15 + (index % 2) * 635
        y = 30 + (index // 2) * 895
        sheet.paste(image, (x, y))
        draw.text((x, 8 + (index // 2) * 895), page.stem, fill="black")

    first = start + 1
    last = start + len(batch)
    sheet.save(source / f"contact-{first:02d}-{last:02d}.png")
