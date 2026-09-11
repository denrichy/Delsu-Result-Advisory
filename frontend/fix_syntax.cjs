const fs = require('fs');
let content = fs.readFileSync('src/pages/AdviserView.jsx', 'utf8');

content = content.replace(/\{dataLoading \? <Skeleton h="h-6" w="w-12" \/> : carryoverCount\}\s*<\/p>/g, '{dataLoading ? <Skeleton h="h-6" w="w-12" /> : carryoverCount}\n                        </div>');

fs.writeFileSync('src/pages/AdviserView.jsx', content, 'utf8');
