import * as assert from 'assert';
import * as vscode from 'vscode';
import { ColorManager } from '../../ColorManager';

suite('ColorManager Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

    const context = {
        subscriptions: [],
        extensionPath: '',
        storagePath: '',
        globalState: {
            get: () => {},
            update: () => Promise.resolve(),
        },
        workspaceState: {
            get: () => {},
            update: () => Promise.resolve(),
        }
    } as unknown as vscode.ExtensionContext;

    const colorManager = new ColorManager(context);

	test('generateColor returns valid hex codes', () => {
        const color1 = colorManager.generateColor('TestWorkspace');
        assert.match(color1, /^#[0-9a-fA-F]{6}$/);
	});

    test('generateColor is deterministic', () => {
        const name = 'MyProject';
        const color1 = colorManager.generateColor(name);
        const color2 = colorManager.generateColor(name);
        assert.strictEqual(color1, color2);
    });

    test('generateColor produces different colors for different inputs', () => {
        const color1 = colorManager.generateColor('ProjectA');
        const color2 = colorManager.generateColor('ProjectB');
        assert.notStrictEqual(color1, color2);
    });

    test('Configuration update test', async () => {
        // This is an integration test really, as it hits the real settings
        const testColor = '#123456';
        await colorManager.applyColor(testColor);

        const config = vscode.workspace.getConfiguration('workbench');
        const customizations = config.get<any>('colorCustomizations');
        
        assert.strictEqual(customizations['titleBar.activeBackground'], testColor);
        assert.strictEqual(customizations['activityBar.background'], testColor);
        
        // Clean up
        await colorManager.clearColor();
        const configAfter = vscode.workspace.getConfiguration('workbench');
        const customizationsAfter = configAfter.get<any>('colorCustomizations');
        assert.strictEqual(customizationsAfter['titleBar.activeBackground'], undefined);
    });
});
