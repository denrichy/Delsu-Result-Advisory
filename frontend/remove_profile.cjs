const fs = require('fs');

let content = fs.readFileSync('src/pages/AdviserView.jsx', 'utf8');
let original = content;

// Match {profile && (...)} non-greedily
content = content.replace(/\{profile && \([\s\S]*?<\/div>\s*\)\}/g, '');

if (content !== original) {
    fs.writeFileSync('src/pages/AdviserView.jsx', content, 'utf8');
    console.log('Removed profile block in AdviserView.jsx');
}
