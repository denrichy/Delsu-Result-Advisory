const fs = require('fs');
let content = fs.readFileSync('src/pages/AdviserView.jsx', 'utf8');

// 1. Add Info to lucide imports
if (!content.includes('Info,')) {
    content = content.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, (match, p1) => {
        return `import { Info, ${p1} } from 'lucide-react';`;
    });
}

// 2. Import Tooltip
if (!content.includes('import Tooltip')) {
    content = content.replace(/import \{ cn \} from '\.\.\/lib\/cn';/, "import { cn } from '../lib/cn';\nimport Tooltip from '../components/ui/Tooltip';");
}

// 3. Revert Passing to Cleared and add Tooltip
content = content.replace(
    /<p className="text-\[11px\] font-medium text-neutral-500 uppercase tracking-wider">Passing<\/p>/g,
    `<div className="flex items-center gap-1">
                          <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Cleared</p>
                          <Tooltip content="Number of students in good standing without any carryovers">
                            <Info size={12} className="text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer" />
                          </Tooltip>
                        </div>`
);

// 4. At-Risk
content = content.replace(
    /<p className="text-\[11px\] font-medium text-neutral-500 uppercase tracking-wider">At-Risk<\/p>/g,
    `<div className="flex items-center gap-1">
                          <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">At-Risk</p>
                          <Tooltip content="Students with a CGPA below the safe threshold (2.0)">
                            <Info size={12} className="text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer" />
                          </Tooltip>
                        </div>`
);

// 5. Carryovers (in Hero)
content = content.replace(
    /<p className="text-\[11px\] font-medium text-neutral-500 uppercase tracking-wider">Carryovers<\/p>/g,
    `<div className="flex items-center gap-1">
                          <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Carryovers</p>
                          <Tooltip content="Students with one or more outstanding failed courses">
                            <Info size={12} className="text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer" />
                          </Tooltip>
                        </div>`
);

// 6. Avg CGPA (in KPI Cards)
content = content.replace(
    /<p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Avg\. CGPA<\/p>|<p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Avg CGPA<\/p>/g,
    `<div className="flex items-center gap-1">
                      <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Avg CGPA</p>
                      <Tooltip content="The overall average CGPA across all students in your level">
                        <Info size={12} className="text-neutral-300 hover:text-neutral-500 transition-colors cursor-pointer" />
                      </Tooltip>
                    </div>`
);

fs.writeFileSync('src/pages/AdviserView.jsx', content, 'utf8');
console.log('Tooltips successfully injected into AdviserView.jsx');
