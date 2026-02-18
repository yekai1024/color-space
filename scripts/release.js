const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🚀 Starting official release process...');

// Check if git working directory is clean
try {
    const status = execSync('git status --porcelain').toString();
    if (status) {
        console.error('❌ Git working directory is not clean. Please commit or stash changes first.');
        process.exit(1);
    }
} catch (e) { /* ignore */ }

rl.question('Select release type (patch/minor/major) [patch]: ', (answer) => {
    const type = answer.trim() || 'patch';
    
    if (!['patch', 'minor', 'major'].includes(type)) {
        console.error('❌ Invalid release type.');
        rl.close();
        process.exit(1);
    }

    try {
        // 1. Bump version + Git Commit + Git Tag
        console.log(`\n📦 Bumping ${type} version...`);
        execSync(`npm version ${type}`, { stdio: 'inherit' });

        // 2. Push to remote
        console.log('\ncloud ☁️  Pushing to GitHub...');
        execSync('git push && git push --tags', { stdio: 'inherit' });

        console.log('\n✅ Done! GitHub Actions will handle the rest.');
        console.log('🔗 Check status: https://github.com/yekai1024/color-space/actions');

    } catch (error) {
        console.error('\n❌ Release failed:', error.message);
    } finally {
        rl.close();
    }
});
