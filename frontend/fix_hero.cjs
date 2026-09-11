const fs = require('fs');

let content = fs.readFileSync('src/pages/AdviserView.jsx', 'utf8');

// The regex matches everything from {/* Student breakdown dots */} down to the closing div of the whole block.
const blockRegex = /\{\/\* Student breakdown dots \*\/\}\s*<div className="flex items-center gap-6">[\s\S]*?dashData\?\.carryover_count \|\| 0\}[\s\S]*?<\/p>\s*<\/div>\s*<\/div>\s*<\/div>/g;

const newBlock = `{/* Student breakdown dots */}
                  <div className="flex items-center justify-between w-full mt-2">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2 h-2 rounded-full bg-neutral-900" />
                        <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Cleared</p>
                      </div>
                      <p className="text-xl font-display font-bold text-neutral-900 tabular-nums leading-none">
                        {dataLoading ? <Skeleton h="h-6" w="w-12" /> : passingCount}
                      </p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">At-Risk</p>
                      </div>
                      <p className="text-xl font-display font-bold text-neutral-900 tabular-nums leading-none">
                        {dataLoading ? <Skeleton h="h-6" w="w-12" /> : atRiskCount}
                      </p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Carryovers</p>
                      </div>
                      <p className="text-xl font-display font-bold text-neutral-900 tabular-nums leading-none">
                        {dataLoading ? <Skeleton h="h-6" w="w-12" /> : carryoverCount}
                      </p>
                    </div>
                  </div>`;

if(blockRegex.test(content)) {
    content = content.replace(blockRegex, newBlock);
    
    // Also, restore the course subtitle!
    // I need to add `<p className="text-xs text-neutral-400 mt-0.5">Select a course to view grade breakdown</p>`
    // under `<h2 className="text-lg font-display font-bold text-neutral-900">Course Performance</h2>`
    const courseTitleRegex = /<h2 className="text-lg font-display font-bold text-neutral-900">Course Performance<\/h2>\s*<\/div>/;
    const restoredSubtitle = `<h2 className="text-lg font-display font-bold text-neutral-900">Course Performance</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Select a course to view grade breakdown</p>
                  </div>`;
    content = content.replace(courseTitleRegex, restoredSubtitle);

    fs.writeFileSync('src/pages/AdviserView.jsx', content, 'utf8');
    console.log('Successfully replaced hero block and restored subtitle');
} else {
    console.log('Regex did not match!');
}
