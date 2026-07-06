import os
import glob
import re

src_dir = r"c:\Users\HP\Desktop\FYP\Delsu-Result-Advisory\frontend\src"

def process_auth_pages():
    print("Processing Auth Pages...")
    auth_files = [
        "Login.jsx", "Signup.jsx", "StudentLogin.jsx", "StudentSignup.jsx", 
        "AdviserLogin.jsx", "AdviserSignup.jsx", "AdminLogin.jsx"
    ]
    
    for filename in auth_files:
        path = os.path.join(src_dir, "pages", filename)
        if not os.path.exists(path):
            continue
            
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Replace rigid width with responsive width
        new_content = content.replace("w-[400px]", "w-full max-w-[400px]")
        new_content = new_content.replace("w-[450px]", "w-full max-w-[450px]")
        new_content = new_content.replace("w-[500px]", "w-full max-w-[500px]")
        new_content = new_content.replace("w-[800px]", "w-full max-w-[800px]")
        
        # Make side-by-side flex containers stack on mobile
        # Search for flex items that should be column on mobile
        # e.g., <div className="flex gap-4"> inside forms
        new_content = new_content.replace('className="flex gap-4"', 'className="flex flex-col md:flex-row gap-4"')
        
        if content != new_content:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated {filename}")

def process_tables():
    print("\nProcessing Tables...")
    table_files = [
        "StudentResults.jsx", "AdviserAnalytics.jsx", 
        "AdviserHistory.jsx", "AdviserUploadDetails.jsx",
        "StudentDashboard.jsx", "AdminDashboard.jsx"
    ]
    
    for filename in table_files:
        path = os.path.join(src_dir, "pages", filename)
        if not os.path.exists(path):
            continue
            
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # We need to wrap <table ...> with <div className="overflow-x-auto"><table ...>
        # And </table> with </table></div>
        # But only if it's not already wrapped.
        
        # A simple regex approach:
        # Find all <table ... </table> and wrap them.
        # But wait, JSX tables might have nested tags. Regex for HTML is tricky.
        # Let's do a simple string replace for the opening and closing tags.
        
        # Since we might run this multiple times, let's check if already wrapped.
        if "overflow-x-auto" not in content and "<table" in content:
            # We will just replace '<table' with '<div className="overflow-x-auto w-full">\n<table'
            # and '</table>' with '</table>\n</div>'
            new_content = content.replace("<table", '<div className="overflow-x-auto w-full">\n              <table')
            new_content = new_content.replace("</table>", '</table>\n            </div>')
            
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated tables in {filename}")

def process_grids_and_flex():
    print("\nProcessing Grids and Flex layouts...")
    pages = glob.glob(os.path.join(src_dir, "pages", "*.jsx"))
    
    for path in pages:
        filename = os.path.basename(path)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
            
        new_content = content
        # Change fixed grids to responsive grids
        new_content = new_content.replace('grid-cols-2', 'grid-cols-1 md:grid-cols-2')
        new_content = new_content.replace('grid-cols-3', 'grid-cols-1 md:grid-cols-3')
        new_content = new_content.replace('grid-cols-4', 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4')
        
        # Some grids might now say 'grid-cols-1 md:grid-cols-1 md:grid-cols-2' if we ran it twice.
        # Let's clean up accidental doubles
        new_content = new_content.replace('grid-cols-1 md:grid-cols-1 md:', 'grid-cols-1 md:')
        
        # AdviserAnalytics specific side-by-side Layout: "flex gap-8" to "flex flex-col lg:flex-row gap-8"
        if filename == "AdviserAnalytics.jsx":
            new_content = new_content.replace('className="flex gap-8"', 'className="flex flex-col lg:flex-row gap-8"')
            new_content = new_content.replace('className="w-1/3 space-y-6"', 'className="w-full lg:w-1/3 space-y-6"')
            new_content = new_content.replace('className="w-2/3 space-y-6"', 'className="w-full lg:w-2/3 space-y-6"')
            
        # StudentDashboard specific layout
        if filename == "StudentDashboard.jsx":
            new_content = new_content.replace('className="flex gap-8"', 'className="flex flex-col lg:flex-row gap-8"')
            new_content = new_content.replace('className="w-2/3 space-y-6"', 'className="w-full lg:w-2/3 space-y-6"')
            new_content = new_content.replace('className="w-1/3 space-y-6"', 'className="w-full lg:w-1/3 space-y-6"')

        # StudentResults specific layout
        if filename == "StudentResults.jsx":
            new_content = new_content.replace('className="flex items-center justify-between"', 'className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"')
            new_content = new_content.replace('className="flex gap-12"', 'className="flex flex-col sm:flex-row gap-4 sm:gap-12"')

        # Home specific
        if filename == "Home.jsx":
            new_content = new_content.replace('className="flex items-center gap-16"', 'className="flex flex-col md:flex-row items-center gap-8 md:gap-16"')
            
        if content != new_content:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated grids/flex in {filename}")

if __name__ == "__main__":
    process_auth_pages()
    process_tables()
    process_grids_and_flex()
    print("Done!")
