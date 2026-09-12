import re

with open("frontend/src/pages/StudentDashboard.jsx", "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(
    r"const \{ user, loading, session \} = useAuth\(\);",
    r"const { session, user, loading: authLoading, signOut, userProfile: profile } = useAuth();",
    content
)

with open("frontend/src/pages/StudentDashboard.jsx", "w", encoding="utf-8") as f:
    f.write(content)
