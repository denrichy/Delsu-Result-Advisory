import os
import glob
import re

src_dir = r"c:\Users\HP\Desktop\FYP\Delsu-Result-Advisory\frontend\src"

def fix_literals():
    files = glob.glob(os.path.join(src_dir, "**", "*.jsx"), recursive=True)
    files.extend(glob.glob(os.path.join(src_dir, "**", "*.js"), recursive=True))
    
    # Regex to match single-quoted strings starting with ${import.meta.env.VITE_API_BASE}
    pattern = re.compile(r"'(\$\{import\.meta\.env\.VITE_API_BASE\}[^']*)'")
    
    for path in files:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
            
        new_content, count = pattern.subn(r"`\1`", content)
        
        if count > 0:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Fixed {count} instances in {os.path.basename(path)}")

if __name__ == "__main__":
    fix_literals()
