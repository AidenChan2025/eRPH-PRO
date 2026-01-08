const fs = require('fs');
const glob = require('glob'); // Need to find files? user grep list is better.
const { execSync } = require('child_process');

function fixConflicts() {
    const files = [
        'pages/Admin.tsx',
        'pages/Admin/ArticleManager.tsx',
        'pages/Admin/Mailbox.tsx',
        'pages/Admin/SystemConfig.tsx',
        'pages/Approval.tsx',
        'pages/CalendarView.tsx',
        'pages/Dashboard.tsx',
        'pages/LessonPlanEditor.tsx',
        'pages/LessonPlanList.tsx',
        'pages/LoginPage.tsx',
        'pages/Portal/SecurityCenter.tsx',
        'pages/ReferenceManager.tsx',
        'pages/TimetableManager.tsx',
        'pages/UserProfile.tsx',
        'pages/Website/KnowledgeBase.tsx',
        'pages/Website/LandingPage.tsx',
        'components/Layout.tsx',
        'components/Modals.tsx',
        'components/PublicFooter.tsx',
        'components/PublicNavbar.tsx'
    ];

    files.forEach(file => {
        try {
            if (!fs.existsSync(file)) return;
            let content = fs.readFileSync(file, 'utf8');

            // Check if useLanguage provides t
            if (content.match(/const\s+\{.*,?\s*t\b.*\}\s*=\s*useLanguage/)) {
                console.log(`Fixing conflict in ${file}`);
                // Remove the injected line
                const newContent = content.replace(/const \{ t \} = useTranslation\(\);\n?/g, '');

                if (newContent !== content) {
                    fs.writeFileSync(file, newContent, 'utf8');
                    console.log(`  -> Fixed.`);
                } else {
                    console.log(`  -> Pattern not matched exactly or already fixed.`);
                }
            } else {
                console.log(`Skipping ${file} - useLanguage does not seem to provide t.`);
            }
        } catch (e) {
            console.error(`Error processing ${file}:`, e);
        }
    });
}

fixConflicts();
