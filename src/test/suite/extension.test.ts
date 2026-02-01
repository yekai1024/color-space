import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension('user.color-space'));
	});

    test('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('colorspace.enable'));
        assert.ok(commands.includes('colorspace.pickColor'));
    });

    test('Status Bar Item should be visible (indirect check)', async () => {
        // We can't directly access the status bar item object from here easily unless we export it
        // But we can check if the internal command is registered
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('colorspace.showMenu'));
    });
});
