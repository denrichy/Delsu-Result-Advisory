const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('src/pages').map(f => path.join('src/pages', f)).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Look for lines containing placeholder="..." that look like corrupted unicode
    // They usually have "Ã¢â‚¬" or "A," or "??A"
    content = content.replace(/placeholder="[^"]*Ã¢â‚¬[^"]*"/g, 'placeholder="••••••••"');
    content = content.replace(/placeholder="[^"]*A,[^"]*"/g, 'placeholder="••••••••"');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed placeholders in:', file);
    }
});
