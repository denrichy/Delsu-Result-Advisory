const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./src', (filePath) => {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.css') || filePath.endsWith('.js') || filePath.endsWith('.cjs')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;
        
        // Fix general mojibake
        content = content.replace(/ðŸ‘‹/g, ''); 
        content = content.replace(/👋/g, ''); 
        content = content.replace(/â€”/g, '—');
        content = content.replace(/Â·/g, '·');
        content = content.replace(/â€œ/g, '“');
        content = content.replace(/â€ /g, '”');
        content = content.replace(/â€™/g, '’');
        
        // specific to index.css and other heavily corrupted files
        content = content.replace(/AAA\?sAA,A\?/g, '—');
        content = content.replace(/A,\?\?/g, '—');
        content = content.replace(/\?"/g, '—');
        content = content.replace(/"\?/g, '-');
        content = content.replace(/A\?\?/g, '—');
        content = content.replace(/â€/g, '”'); // leftover
        content = content.replace(/Â/g, ''); // leftover

        // Fix AdviserView.jsx specifically
        if (filePath.endsWith('AdviserView.jsx')) {
            const profileRegex = /\{profile && \([\s\S]*?<div className="mb-6">[\s\S]*?<p className="text-sm font-semibold text-neutral-800">\{profile\.name\}<\/p>[\s\S]*?<p className="text-xs text-neutral-400">\{profile\.department\}[\s\S]*?dashData\?\.adviser\?\.level[\s\S]*?<\/p>[\s\S]*?<\/div>\s*\)\}/g;
            content = content.replace(profileRegex, '');
            
            // Fix course fetching deduplication
            const oldCourseFetch = /if \(coursesRes\.ok\) \{\s*const fetchedCourses = await coursesRes\.json\(\);\s*setCourses\(\[\.\.\.new Set\(fetchedCourses\)\]\);\s*\}/g;
            
            const newCourseFetch = `if (coursesRes.ok) {
          const raw = await coursesRes.json();
          const normalized = raw
            .map(c => c.replace(/\\s+/g, '').toUpperCase())
            .filter(c => c && c !== 'CHOOSECOURSE');
          setCourses([...new Set(normalized)].sort());
        }`;
            
            content = content.replace(oldCourseFetch, newCourseFetch);
            
            const oldCourseFetch2 = /if \(coursesRes\.ok\) setCourses\(await coursesRes\.json\(\)\);/g;
            content = content.replace(oldCourseFetch2, newCourseFetch);
        }

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed encoding and content in:', filePath);
        }
    }
});
