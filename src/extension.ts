import * as vscode from 'vscode';
import { ColorManager } from './ColorManager';
import { getPreviewHtml } from './getPreviewHtml';

let myStatusBarItem: vscode.StatusBarItem;
let currentPanel: vscode.WebviewPanel | undefined = undefined;

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

    const showPreviewCmd = vscode.commands.registerCommand('colorspace.showPreview', () => {
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
            'colorSpacePreview',
            'Color Space Preview',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        currentPanel.webview.html = getPreviewHtml();

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
        const items: vscode.QuickPickItem[] = [
            { label: 'Morandi Light (Soft & Muted)', kind: vscode.QuickPickItemKind.Separator },
            { label: 'Haze Blue (雾霾蓝)', description: '#93A2BA' },
            { label: 'Sage Green (鼠尾草绿)', description: '#BCCFBF' },
            { label: 'Bean Paste Pink (豆沙粉)', description: '#E4C6C6' },
            { label: 'Oatmeal (燕麦色)', description: '#DED7C8' },
            { label: 'Lilac (藕荷紫)', description: '#CDBFD4' },
            { label: 'Glacier Gray (冰川灰)', description: '#C4D3D9' },
            { label: 'Almond Yellow (杏仁黄)', description: '#F0E6CC' },
            { label: 'Linen (亚麻色)', description: '#E6DCCD' },
            { label: 'Dusty Orange (脏橘色)', description: '#E8C3B0' },
            { label: 'Milk Tea (奶茶色)', description: '#D6C8B5' },
            
            { label: 'Morandi Dark (Deep & Elegant)', kind: vscode.QuickPickItemKind.Separator },
            { label: 'Iron Gray (铁灰色)', description: '#5D6169' },
            { label: 'Prussian Blue Gray (普鲁士蓝灰)', description: '#4A5D70' },
            { label: 'Olive Gray (橄榄灰绿)', description: '#5E665B' },
            { label: 'Burgundy Gray (勃艮第灰红)', description: '#705353' },
            { label: 'Smoky Purple (烟熏紫)', description: '#61596B' },
            { label: 'Deep Sea Blue (深海蓝灰)', description: '#455666' },
            { label: 'Caramel Brown (焦糖褐灰)', description: '#806A5E' },
            { label: 'Forest Gray (森林灰绿)', description: '#48594E' },
            { label: 'Slate Rock (岩石灰)', description: '#585F63' },
            { label: 'Eggplant Gray (茄皮紫灰)', description: '#5E5363' },

            { label: 'Classic Premium (Chinese & Dunhuang)', kind: vscode.QuickPickItemKind.Separator },
            { label: 'Sky Cyan (天青)', description: '#B5CECE' },
            { label: 'Moon White (月白)', description: '#D6ECF0' },
            { label: 'Crab Shell Green (蟹壳青)', description: '#BBCDC5' },
            { label: 'Lovesick Gray (相思灰)', description: '#61649F' },
            { label: 'Agarwood (沉香)', description: '#867069' },
            { label: 'Muted Cinnabar (朱砂红-灰)', description: '#9A4C39' },
            { label: 'Mineral Green (石绿)', description: '#4A8F78' },
            { label: 'Lapis Blue (青金石)', description: '#5D6185' },
            { label: 'Desert Gold (大漠金)', description: '#C9B780' },
            { label: 'Tea White (茶白)', description: '#F3F4E6' },
        ];
        
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
    myStatusBarItem.tooltip = "Manage Color Space";
    myStatusBarItem.show();

    // Helper command for status bar click
    const showMenuCmd = vscode.commands.registerCommand('colorspace.showMenu', async () => {
        const items = [
            { label: '$(preview) Show Color Preview', command: 'colorspace.showPreview' },
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

    context.subscriptions.push(enableCmd, disableCmd, showPreviewCmd, pickColorCmd, randomizeCmd, clearCmd, showMenuCmd, myStatusBarItem);

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
