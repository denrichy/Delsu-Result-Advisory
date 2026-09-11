const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('src/pages').map(f => path.join('src/pages', f)).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Specifically target corrupted strings
    content = content.replace(/placeholder=" {8}"/g, 'placeholder="••••••••"');
    content = content.replace(/placeholder="\?\?A\?\?A\?\?A\?\?A\?\?A\?\?A\?\?A\?\?A"/g, 'placeholder="••••••••"');
    content = content.replace(/placeholder="A,A,A,A,A,A,A,A,"/g, 'placeholder="••••••••"');
    content = content.replace(/placeholder=""""""”"/g, 'placeholder="••••••••"');
    content = content.replace(/placeholder="""""""""/g, 'placeholder="••••••••"');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed placeholders in:', file);
    }
});
