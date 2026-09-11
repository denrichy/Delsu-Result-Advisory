const fs = require('fs');
const path = require('path');
const files = fs.readdirSync('src/pages').map(f => path.join('src/pages', f)).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace any placeholder that consists entirely of weird non-alphanumeric characters
    content = content.replace(/placeholder="[^a-zA-Z0-9\s\.\@]*"/g, (match) => {
        if (match === 'placeholder=""') return match;
        return 'placeholder="••••••••"';
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed placeholders in:', file);
    }
});
