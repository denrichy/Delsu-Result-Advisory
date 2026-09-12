import os

def replace_in_file(filepath, replacements):
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    
    modified = False
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
            modified = True
            
    if modified:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

replacements_dashboard = [
    ("ðŸ‘‹", "👋")
]
replace_in_file("frontend/src/pages/StudentDashboard.jsx", replacements_dashboard)

replacements_signup = [
    ("LoadingÃ¢â‚¬Â¦", "Loading..."),
    ("Creating AccountÃ¢â‚¬Â¦", "Creating Account...")
]
replace_in_file("frontend/src/pages/Signup.jsx", replacements_signup)

replacements_adviser = [
    ("'AAA?sAA,A?'}", "'-'}"),
    ("|| 'ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â '}", "|| '-'}"),
    ("`${u.semester} ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ ${u.session}` : 'ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â '}", "`${u.semester} — ${u.session}` : '-'}")
]
replace_in_file("frontend/src/pages/AdviserView.jsx", replacements_adviser)

print("Fixes applied.")
