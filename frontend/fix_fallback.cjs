const fs = require('fs');
let content = fs.readFileSync('src/pages/AdviserView.jsx', 'utf8');

// Replace any fallback using regex targeting average_cgpa
content = content.replace(/average_cgpa \?\? '[^']*'/g, "average_cgpa ?? '—'");

fs.writeFileSync('src/pages/AdviserView.jsx', content, 'utf8');
