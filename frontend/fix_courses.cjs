const fs = require('fs');

let content = fs.readFileSync('src/pages/AdviserView.jsx', 'utf8');

const oldCourseFetch = /if \(coursesRes\.ok\) \{\s*const fetchedCourses = await coursesRes\.json\(\);\s*setCourses\(\[\.\.\.new Set\(fetchedCourses\)\]\);\s*\}/g;

const newCourseFetch = `if (coursesRes.ok) {
          const raw = await coursesRes.json();
          const normalized = raw
            .map(c => c.replace(/\\s+/g, '').toUpperCase())
            .filter(c => c && c !== 'CHOOSECOURSE');
          setCourses([...new Set(normalized)].sort());
        }`;

content = content.replace(oldCourseFetch, newCourseFetch);

fs.writeFileSync('src/pages/AdviserView.jsx', content, 'utf8');
console.log('Fixed course deduplication.');
