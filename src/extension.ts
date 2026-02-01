import * as vscode from 'vscode';
import { ColorManager } from './ColorManager';

let myStatusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    const colorManager = new ColorManager(context);

    // Register Commands
    const enableCmd = vscode.commands.registerCommand('colorspace.enable', async () => {
        await vscode.workspace.getConfiguration('colorspace').update('enabled', true, vscode.ConfigurationTarget.Global);
        await colorManager.autoColor();
        vscode.window.showInformationMessage('Color Space Enabled');
    });

    const disableCmd = vscode.commands.registerCommand('colorspace.disable', async () => {
        await vscode.workspace.getConfiguration('colorspace').update('enabled', false, vscode.ConfigurationTarget.Global);
        await colorManager.clearColor();
        vscode.window.showInformationMessage('Color Space Disabled');
    });

    const pickColorCmd = vscode.commands.registerCommand('colorspace.pickColor', async () => {
        // Simple palette of presets
        const presets = [
            { label: 'Red', description: '#FF5733' },
            { label: 'Green', description: '#33FF57' },
            { label: 'Blue', description: '#3357FF' },
            { label: 'Yellow', description: '#F3FF33' },
            { label: 'Purple', description: '#8333FF' },
            { label: 'Cyan', description: '#33FFF6' },
        ];
        
        const selected = await vscode.window.showQuickPick(presets, { placeHolder: 'Select a preset color' });
        if (selected && selected.description) {
            await colorManager.applyColor(selected.description);
        }
    });

    const randomizeCmd = vscode.commands.registerCommand('colorspace.randomize', async () => {
        const color = colorManager.getRandomColor();
        await colorManager.applyColor(color);
    });

    const clearCmd = vscode.commands.registerCommand('colorspace.clear', async () => {
        await colorManager.clearColor();
    });

    // Status Bar Item
    myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    myStatusBarItem.command = 'colorspace.showMenu'; // Internal helper command
    myStatusBarItem.text = `$(paint-can) Color Space`;
    myStatusBarItem.tooltip = "Manage Color Space";
    myStatusBarItem.show();

    // Helper command for status bar click
    const showMenuCmd = vscode.commands.registerCommand('colorspace.showMenu', async () => {
        const items = [
            { label: '$(refresh) Randomize Color', command: 'colorspace.randomize' },
            { label: '$(color-mode) Pick Preset Color', command: 'colorspace.pickColor' },
            { label: '$(trash) Clear Color', command: 'colorspace.clear' },
            { label: '$(gear) Configure', command: 'workbench.action.openSettings', arguments: ['colorspace'] }
        ];

        const selection = await vscode.window.showQuickPick(items, { placeHolder: 'Color Space Actions' });
        if (selection && selection.command) {
            if (selection.arguments) {
                vscode.commands.executeCommand(selection.command, ...selection.arguments);
            } else {
                vscode.commands.executeCommand(selection.command);
            }
        }
    });

    context.subscriptions.push(enableCmd, disableCmd, pickColorCmd, randomizeCmd, clearCmd, showMenuCmd, myStatusBarItem);

    // Initial check
    colorManager.autoColor();

    // Listen for config changes (if user manually edits ignore list)
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('colorspace.enabled')) {
            const enabled = vscode.workspace.getConfiguration('colorspace').get('enabled');
            if (enabled) {
                colorManager.autoColor();
            } else {
                colorManager.clearColor();
            }
        }
    }));
}

export function deactivate() {
    if (myStatusBarItem) {
        myStatusBarItem.dispose();
    }
}
