import * as path from 'path';

import { runTests } from '@vscode/test-electron';

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to test runner
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		const testWorkspace = path.resolve(__dirname, '../../src/test/workspace');

        // Path to Trae executable
        // specific to the user's environment or via env var
        const traeExecutablePath = process.env.TRAE_EXECUTABLE_PATH || 'C:\\Users\\yekai\\AppData\\Local\\Programs\\Trae\\Trae.exe';

		// Download VS Code, unzip it and run the integration test
		await runTests({ 
			extensionDevelopmentPath, 
			extensionTestsPath,
            vscodeExecutablePath: traeExecutablePath,
			launchArgs: [testWorkspace]
		});
	} catch (err) {
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main();
