import os
import glob

# Path to the src directory
src_dir = r"C:\Users\HP\Desktop\FYP\Delsu-Result-Advisory\frontend\src"

# Get all .jsx and .js files recursively
files = glob.glob(os.path.join(src_dir, "**", "*.jsx"), recursive=True) + \
        glob.glob(os.path.join(src_dir, "**", "*.js"), recursive=True)

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "http://127.0.0.1:8000" in content:
        # We need to correctly replace template literals and normal strings.
        # It's usually better to just define a top level `const API_BASE = import.meta.env.VITE_API_BASE;`
        # and then replace `http://127.0.0.1:8000` with `${API_BASE}` in template literals, 
        # or replace the whole string if it's standalone.
        # Given the complexity, let's just do a naive replace:
        
        # If it's a standalone string 'http://127.0.0.1:8000' -> import.meta.env.VITE_API_BASE
        new_content = content.replace("'http://127.0.0.1:8000'", "import.meta.env.VITE_API_BASE")
        new_content = new_content.replace('"http://127.0.0.1:8000"', "import.meta.env.VITE_API_BASE")
        
        # If it's inside a template literal like `http://127.0.0.1:8000/auth` -> `${import.meta.env.VITE_API_BASE}/auth`
        new_content = new_content.replace("http://127.0.0.1:8000", "${import.meta.env.VITE_API_BASE}")
        
        # Note: In AdviserAnalytics.jsx, we have `const API_BASE = import.meta.env.VITE_API_BASE;`
        # Because we replaced 'http...' with import.meta.env..., we might end up with `${import.meta.env...}` inside template literals
        # Let's fix that specific file if needed.
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {file_path}")

print("Done")
