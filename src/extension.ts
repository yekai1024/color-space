import * as vscode from 'vscode';
import { ColorManager } from './ColorManager';
import { getPreviewHtml } from './getPreviewHtml';
import { getCreativeHtml } from './getCreativeHtml';

let myStatusBarItem: vscode.StatusBarItem;
let currentPanel: vscode.WebviewPanel | undefined = undefined;
let creativePanel: vscode.WebviewPanel | undefined = undefined;

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

    const colorThemeCmd = vscode.commands.registerCommand('colorspace.colorTheme', () => {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (currentPanel) {
            currentPanel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        currentPanel = vscode.window.createWebviewPanel(
            'colorTheme',
            'Color Theme',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        currentPanel.webview.html = getPreviewHtml(colorManager.presets);

        // Handle messages from the webview
        currentPanel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'applyColor':
                        await colorManager.applyColor(message.color);
                        break;
                }
            },
            undefined,
            context.subscriptions
        );

        currentPanel.onDidDispose(
            () => {
                currentPanel = undefined;
            },
            null,
            context.subscriptions
        );
    });

    const pickColorCmd = vscode.commands.registerCommand('colorspace.pickColor', async () => {
        const items = colorManager.presets;
        
        // Save current configuration to restore if cancelled
        const config = vscode.workspace.getConfiguration('workbench');
        const originalColors = config.get<any>('colorCustomizations');

        const quickPick = vscode.window.createQuickPick();
        quickPick.items = items;
        quickPick.placeholder = 'Select a preset color (Arrow keys to preview)';
        
        quickPick.onDidChangeActive(async active => {
            if (active[0] && active[0].description) {
                await colorManager.applyColor(active[0].description);
            }
        });

        quickPick.onDidAccept(async () => {
            const selected = quickPick.selectedItems[0];
            if (selected && selected.description) {
                await colorManager.applyColor(selected.description);
            }
            quickPick.hide();
        });

        quickPick.onDidHide(async () => {
            // If no item was selected (accepted), restore original colors
            // We can check if the current applied color is one of the items
            // But simpler is to check if we are "accepted". 
            // However, createQuickPick doesn't expose "accepted" state directly after hide.
            // We can just rely on the fact that if we accepted, we are done.
            // But wait, onDidHide triggers even after accept/hide.
            // So we need a flag.
        });
        
        let accepted = false;
        quickPick.onDidAccept(() => {
            accepted = true;
            quickPick.hide();
        });

        quickPick.onDidHide(async () => {
            if (!accepted) {
                // Restore original colors
                await config.update('colorCustomizations', originalColors, vscode.ConfigurationTarget.Workspace);
            }
            quickPick.dispose();
        });

        quickPick.show();
    });

    const creativeModeCmd = vscode.commands.registerCommand('colorspace.creativeMode', () => {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (creativePanel) {
            creativePanel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        creativePanel = vscode.window.createWebviewPanel(
            'colorSpaceCreative',
            'Creative Mode',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // Get current activity bar color or fallback
        const config = vscode.workspace.getConfiguration('workbench');
        const colorCustomizations = config.get<any>('colorCustomizations') || {};
        const initialColor = colorCustomizations['activityBar.background'] || '#007aff';

        creativePanel.webview.html = getCreativeHtml(false, initialColor);

        // Handle messages from the webview
        creativePanel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'apply':
                        await colorManager.applyColor(message.color);
                        // vscode.window.showInformationMessage(`Color Space: Applied ${message.color}`);
                        break;
                }
            },
            undefined,
            context.subscriptions
        );

        creativePanel.onDidDispose(
            () => {
                creativePanel = undefined;
            },
            null,
            context.subscriptions
        );
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
    myStatusBarItem.text = `$(symbol-color)`;
    myStatusBarItem.tooltip = "Color Workpace";
    myStatusBarItem.show();

    // Helper command for status bar click
    const showMenuCmd = vscode.commands.registerCommand('colorspace.showMenu', async () => {
        const items = [
            { label: '$(preview) Color Theme', command: 'colorspace.colorTheme' },
            { label: '$(color-mode) Pick Color', command: 'colorspace.pickColor' },
            { label: '$(paintcan) Creative Mode', command: 'colorspace.creativeMode' },
            { label: '$(refresh) Suprise Me', command: 'colorspace.randomize' },
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

    context.subscriptions.push(enableCmd, disableCmd, colorThemeCmd, pickColorCmd, creativeModeCmd, randomizeCmd, clearCmd, showMenuCmd, myStatusBarItem);

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
