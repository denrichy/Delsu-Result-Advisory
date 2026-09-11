const fs = require('fs');

function patchFile(filepath, replacements) {
    let content = fs.readFileSync(filepath, 'utf8');
    let original = content;
    for (const { search, replace } of replacements) {
        content = content.replace(search, replace);
    }
    if (content !== original) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`Updated ${filepath}`);
    } else {
        console.log(`No changes made to ${filepath}`);
    }
}

// 1. Navbar.jsx
patchFile('src/components/Navbar.jsx', [
    {
        search: /<div className="flex items-center justify-between h-\[56px\] px-\[20px\]">/g,
        replace: '<div className="flex items-center justify-between h-[56px] px-[20px] max-w-md mx-auto w-full">'
    },
    {
        search: /<div className="flex items-center h-\[72px\] px-\[12px\]">/g,
        replace: '<div className="flex items-center h-[72px] px-[12px] max-w-md mx-auto w-full">'
    }
]);

// 2. StudentDashboard.jsx
patchFile('src/pages/StudentDashboard.jsx', [
    {
        search: /<div className="px-\[20px\] pt-safe">/g,
        replace: '<div className="px-[20px] pt-safe max-w-md mx-auto w-full">'
    }
]);

// 3. StudentSettings.jsx
patchFile('src/pages/StudentSettings.jsx', [
    {
        search: /<div className="px-\[20px\] pt-\[28px\]">/g,
        replace: '<div className="px-[20px] pt-[28px] max-w-md mx-auto w-full">'
    }
]);

// 4. StudentResults.jsx
patchFile('src/pages/StudentResults.jsx', [
    {
        search: /<div className="max-w-\[600px\] mx-auto">/g,
        replace: '<div className="max-w-md mx-auto w-full">'
    }
]);

// 5. StudentNotifications.jsx
patchFile('src/pages/StudentNotifications.jsx', [
    {
        search: /<div className="max-w-\[800px\] mx-auto">/g,
        replace: '<div className="max-w-md mx-auto w-full">'
    }
]);

// 6. StudentAdvisor.jsx
patchFile('src/pages/StudentAdvisor.jsx', [
    {
        search: /<div className="flex items-center justify-between h-\[56px\] px-\[16px\]" style=\{\{ background: '#F5F3F3' \}\}>/g,
        replace: '<div className="flex items-center justify-between h-[56px] px-[16px] max-w-md mx-auto w-full" style={{ background: \'#F5F3F3\' }}>'
    },
    {
        search: /<div className="flex-1 flex flex-col pt-safe" style=\{\{ paddingTop: '56px' \}\}>/g,
        replace: '<div className="flex-1 flex flex-col pt-safe max-w-md mx-auto w-full" style={{ paddingTop: \'56px\' }}>'
    },
    {
        search: /<div\s*className="max-w-\[800px\] mx-auto rounded-\[20px\] p-\[6px\] flex items-end gap-\[6px\]"/g,
        replace: '<div\n            className="max-w-md mx-auto w-full rounded-[20px] p-[6px] flex items-end gap-[6px]"'
    }
]);
