const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Starting local development build...');

try {
    // 1. Bump patch version without git tag
    console.log('📈 Bumping patch version...');
    execSync('npm version patch --no-git-tag-version', { stdio: 'inherit' });

    // 2. Run existing package script
    const packageScriptPath = path.join(__dirname, 'package.js');
    execSync(`node "${packageScriptPath}"`, { stdio: 'inherit' });

    console.log('\n✨ Local build cycle completed!');

} catch (error) {
    console.error('❌ Local build failed:', error.message);
    process.exit(1);
}
