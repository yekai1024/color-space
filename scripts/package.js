const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

console.log('\x1b[36m%s\x1b[0m', '📦 Starting automatic packaging process...');

// 1. Clean up old vsix files
console.log('🧹 Cleaning up old .vsix files...');
let deletedCount = 0;
const files = fs.readdirSync(rootDir);
files.forEach(file => {
    if (file.endsWith('.vsix')) {
        try {
            fs.unlinkSync(path.join(rootDir, file));
            console.log(`   - Deleted ${file}`);
            deletedCount++;
        } catch (err) {
            console.error(`   - Failed to delete ${file}: ${err.message}`);
        }
    }
});

if (deletedCount === 0) {
    console.log('   - No old .vsix files found.');
}

// 2. Run vsce package
console.log('\n🚀 Running vsce package...');
try {
    // Ensure dependencies are installed and code is compiled
    // execSync('npm install', { stdio: 'inherit', cwd: rootDir }); // Optional: ensure deps
    // execSync('npm run compile', { stdio: 'inherit', cwd: rootDir }); // vsce package runs prepublish automatically

    // Execute packaging
    execSync('npx vsce package', { stdio: 'inherit', cwd: rootDir });
    
    console.log('\n\x1b[32m%s\x1b[0m', '✅ Packaging completed successfully!');
    
    // List the new file
    const newFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.vsix'));
    if (newFiles.length > 0) {
        console.log(`\nNew package: \x1b[33m${newFiles[0]}\x1b[0m`);
    }

} catch (error) {
    console.error('\n\x1b[31m%s\x1b[0m', '❌ Packaging failed!');
    process.exit(1);
}
