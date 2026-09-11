const fs = require('fs');
let content = fs.readFileSync('src/pages/AdviserView.jsx', 'utf8');

// 1. Remove Profile block
content = content.replace(
  /\{profile && \(\s*<div className="mb-6">\s*<p className="text-sm font-semibold text-neutral-800">\{profile\.name\}<\/p>\s*<p className="text-xs text-neutral-400">\{profile\.department\} · Level \{dashData\?\.adviser\?\.level \|\| '—'\}<\/p>\s*<\/div>\s*\)\}/g,
  ''
);

// 2. Fix passing calculation logic
content = content.replace(
  /const passRate = totalStudents > 0 \? Math\.round\(\(\(totalStudents - atRiskCount\) \/ totalStudents\) \* 100\) : 0;/g,
  `const carryoverCount = dashData?.carryover_count || 0;
  const passingCount = Math.max(0, totalStudents - carryoverCount);
  const passRate = totalStudents > 0 ? Math.round((passingCount / totalStudents) * 100) : 0;`
);

// 3. Fix Course fetch logic to remove duplicates
content = content.replace(
  /if \(coursesRes\.ok\) setCourses\(await coursesRes\.json\(\)\);/g,
  `if (coursesRes.ok) {
          const fetchedCourses = await coursesRes.json();
          setCourses([...new Set(fetchedCourses)]);
        }`
);

// 4. Update the Passing/At-Risk/Carryover UI
const oldHeroUIRegex = /<div className="flex items-center gap-6 mt-4">[\s\S]*?dashData\?\.carryover_count \|\| 0\}[\s\S]*?<\/p>\s*<\/div>\s*<\/div>/g;

const newHeroUI = `<div className="flex items-center justify-between w-full mt-4">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-2 h-2 rounded-full bg-neutral-900" />
                            <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Cleared</p>
                          </div>
                          <p className="text-xl font-display font-bold text-neutral-900 tabular-nums leading-none">
                            {dataLoading ? '—' : passingCount}
                          </p>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                            <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">At-Risk</p>
                          </div>
                          <p className="text-xl font-display font-bold text-neutral-900 tabular-nums leading-none">
                            {dataLoading ? '—' : atRiskCount}
                          </p>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-2 h-2 rounded-full bg-red-400" />
                            <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Carryovers</p>
                          </div>
                          <p className="text-xl font-display font-bold text-neutral-900 tabular-nums leading-none">
                            {dataLoading ? '—' : carryoverCount}
                          </p>
                        </div>
                      </div>`;

content = content.replace(oldHeroUIRegex, newHeroUI);

// 5. Update KPI Cards UI 
content = content.replace(
  /<div className="grid grid-cols-3 divide-x divide-neutral-100 w-full h-full">/g,
  '<div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-100 w-full h-full">'
);
content = content.replace(
  /<div className="px-5 py-4 flex flex-col justify-center">/g,
  '<div className="px-4 py-3 sm:px-5 sm:py-4 flex flex-col justify-center">'
);
content = content.replace(/TOTAL STUDENTS/g, 'STUDENTS');
content = content.replace(/AVG\. CGPA/g, 'AVG CGPA');

// 6. Remove redundant course subtitle
content = content.replace(
  /<p className="text-xs text-neutral-400 mt-0\.5">Select a course to view grade breakdown<\/p>/g,
  ''
);

fs.writeFileSync('src/pages/AdviserView.jsx', content);
console.log('AdviserView updated successfully.');
