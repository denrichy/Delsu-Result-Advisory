from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


OUT = Path(__file__).resolve().parents[1] / "assets" / "diagrams"
OUT.mkdir(parents=True, exist_ok=True)
FONT_DIR = Path("C:/Windows/Fonts")


def font(size: int, bold: bool = False):
    name = "arialbd.ttf" if bold else "arial.ttf"
    return ImageFont.truetype(str(FONT_DIR / name), size)


BLUE = "#2448E8"
INK = "#172033"
MUTED = "#5E6675"
PALE = "#EEF2FF"
LINE = "#B8C0D0"
WHITE = "#FFFFFF"


def canvas(title: str, subtitle: str = ""):
    image = Image.new("RGB", (1800, 1100), WHITE)
    draw = ImageDraw.Draw(image)
    draw.text((90, 55), title, fill=INK, font=font(42, True))
    if subtitle:
        draw.text((90, 112), subtitle, fill=MUTED, font=font(24))
    draw.line((90, 158, 1710, 158), fill=LINE, width=2)
    return image, draw


def box(draw, xy, title, lines=(), fill=PALE, outline=BLUE):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=22, fill=fill, outline=outline, width=3)
    title_size = 27
    while draw.textbbox((0, 0), title, font=font(title_size, True))[2] > (x2 - x1 - 48) and title_size > 18:
        title_size -= 1
    draw.text((x1 + 24, y1 + 20), title, fill=INK, font=font(title_size, True))
    y = y1 + 64
    for line in lines:
        draw.text((x1 + 24, y), line, fill=MUTED, font=font(21))
        y += 31


def arrow(draw, start, end, label=""):
    draw.line((*start, *end), fill=BLUE, width=5)
    ex, ey = end
    sx, sy = start
    import math
    a = math.atan2(ey - sy, ex - sx)
    for d in (2.6, 3.7):
        draw.line((ex, ey, ex + 18 * math.cos(a + d), ey + 18 * math.sin(a + d)), fill=BLUE, width=5)
    if label:
        mx, my = (sx + ex) / 2, (sy + ey) / 2
        label_font = font(18)
        bounds = draw.textbbox((0, 0), label, font=label_font)
        half = (bounds[2] - bounds[0]) / 2 + 10
        draw.rectangle((mx - half, my - 18, mx + half, my + 18), fill=WHITE)
        draw.text((mx, my), label, anchor="mm", fill=MUTED, font=label_font)


def save(image, name):
    image.save(OUT / name, dpi=(200, 200), optimize=True)


def architecture():
    image, draw = canvas("System architecture", "Main components and data movement")
    box(draw, (90, 245, 410, 505), "Client layer", ("React 19 interface", "Vite build", "Student and adviser views"))
    box(draw, (555, 225, 915, 525), "Application layer", ("FastAPI routes", "Result processing", "Analytics services", "Compass agent tools"))
    box(draw, (1060, 205, 1435, 455), "Data layer", ("Supabase Postgres", "Supabase Auth", "Realtime notifications"))
    box(draw, (1060, 580, 1435, 795), "AI service", ("Groq API", "openai/gpt-oss-120b", "Tool calling responses"), fill="#F7F4FF", outline="#7557D8")
    box(draw, (1500, 245, 1710, 455), "Input", ("Excel", "broadsheets"), fill="#F6FAF7", outline="#16835F")
    arrow(draw, (410, 370), (555, 370), "HTTPS JSON")
    arrow(draw, (915, 330), (1060, 330), "queries")
    arrow(draw, (915, 450), (1060, 675), "prompt and tools")
    arrow(draw, (1500, 350), (1435, 350), "upload")
    draw.text((90, 920), "Trust boundary", fill=INK, font=font(24, True))
    draw.text((275, 920), "Authentication identifies the user. Backend checks and database policies must enforce data ownership.", fill=MUTED, font=font(22))
    save(image, "architecture.png")


def use_case():
    image, draw = canvas("Use case model", "Functions available to each system role")
    box(draw, (100, 265, 390, 520), "Student", ("Sign in", "View own results", "Read notifications", "Ask Compass", "Simulate GPA"), fill="#F6FAF7", outline="#16835F")
    box(draw, (1410, 265, 1700, 520), "Course adviser", ("Sign in", "Upload broadsheet", "Review upload", "View analytics", "Notify students"), fill="#FFF8ED", outline="#D38414")
    cases = [
        (590, 220, "Authenticate user"), (930, 220, "Manage profile"),
        (590, 390, "Read academic record"), (930, 390, "Generate advice"),
        (590, 560, "Process results"), (930, 560, "Analyse class"),
        (760, 735, "Manage notifications"),
    ]
    for x, y, title in cases:
        draw.ellipse((x, y, x + 280, y + 105), fill=PALE, outline=BLUE, width=3)
        draw.text((x + 140, y + 52), title, anchor="mm", fill=INK, font=font(22, True))
    for y in (272, 442, 787):
        draw.line((390, 390, 590 if y != 787 else 760, y), fill=LINE, width=3)
        draw.line((1410, 390, 1210 if y != 787 else 1040, y), fill=LINE, width=3)
    draw.line((390, 390, 930, 442), fill=LINE, width=3)
    draw.line((1410, 390, 870, 612), fill=LINE, width=3)
    save(image, "use_case.png")


def erd():
    image, draw = canvas("Database relationship model", "Operational tables observed in the Supabase project")
    entities = {
        "students": (80, 230, ("id PK", "auth_user_id", "matric_number", "baseline fields")),
        "results": (520, 230, ("id PK", "student_id FK", "course_id FK", "upload_id FK", "score and grade")),
        "courses": (990, 230, ("id PK", "course_code", "units", "course_type")),
        "uploads": (1390, 230, ("id PK", "adviser_id FK", "filename", "session")),
        "advisers": (1390, 610, ("id PK", "auth_user_id", "department", "level")),
        "chat_sessions": (80, 650, ("id PK", "matric_number", "title", "temporary flag")),
        "chat_messages": (520, 650, ("id PK", "session_id FK", "role", "content")),
        "notifications": (990, 650, ("id PK", "student_id FK", "message", "read flag")),
    }
    positions = {}
    for name, (x, y, fields) in entities.items():
        h = 80 + 32 * len(fields)
        box(draw, (x, y, x + 330, y + h), name, fields, fill="#FAFBFD", outline=BLUE)
        positions[name] = (x, y, x + 330, y + h)
    arrow(draw, (410, 340), (520, 340), "1 to many")
    arrow(draw, (850, 340), (990, 340), "many to 1")
    arrow(draw, (1390, 380), (850, 380), "1 to many")
    arrow(draw, (1555, 610), (1555, 520), "many to 1")
    arrow(draw, (410, 760), (520, 760), "1 to many")
    arrow(draw, (245, 520), (245, 650), "student scope")
    arrow(draw, (410, 430), (990, 760), "1 to many")
    save(image, "erd.png")


def ingestion():
    image, draw = canvas("Result ingestion workflow", "Validation, computation, persistence and notification stages")
    stages = [
        (90, "Select semester and session", ("Choose Excel file",)),
        (410, "Parse and normalise", ("Wide or long format", "Course and student fields")),
        (750, "Validate", ("Required columns", "Scores and units", "Duplicate checks")),
        (1090, "Compute", ("Grades and quality points", "GPA and CGPA", "Carryovers and anomalies")),
        (1430, "Confirm", ("Persist upload", "Insert results", "Create notifications")),
    ]
    for i, (x, title, lines) in enumerate(stages):
        box(draw, (x, 325, x + 280, 610), title, lines)
        if i < len(stages) - 1:
            arrow(draw, (x + 280, 465), (stages[i + 1][0], 465))
    draw.text((90, 745), "Failure path", fill=INK, font=font(27, True))
    draw.text((255, 745), "Invalid rows remain in preview with reasons. The adviser can correct the source file before confirmation.", fill=MUTED, font=font(23))
    save(image, "ingestion_workflow.png")


def agent_sequence():
    image, draw = canvas("Compass advisory sequence", "Verified retrieval before natural language response")
    actors = [(170, "Student"), (590, "React client"), (1010, "FastAPI agent"), (1440, "Supabase and Groq")]
    for x, label in actors:
        draw.rounded_rectangle((x - 120, 205, x + 120, 275), radius=18, fill=PALE, outline=BLUE, width=3)
        draw.text((x, 240), label, anchor="mm", fill=INK, font=font(22, True))
        draw.line((x, 275, x, 970), fill=LINE, width=2)
    events = [
        (335, 170, 590, "Ask academic question"),
        (425, 590, 1010, "POST chat request"),
        (520, 1010, 1440, "Read authorised record"),
        (610, 1440, 1010, "Return verified data"),
        (700, 1010, 1440, "Send grounded prompt"),
        (790, 1440, 1010, "Return advisory text"),
        (880, 1010, 590, "Stream response"),
        (945, 590, 170, "Display answer"),
    ]
    for y, sx, ex, label in events:
        arrow(draw, (sx, y), (ex, y), label)
    save(image, "agent_sequence.png")


if __name__ == "__main__":
    architecture()
    use_case()
    erd()
    ingestion()
    agent_sequence()
    print(f"Created diagrams in {OUT}")
