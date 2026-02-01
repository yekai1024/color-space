import * as vscode from 'vscode';

export class ColorManager {
    private context: vscode.ExtensionContext;
    private configPrefix = 'colorspace';

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public async autoColor() {
        if (!this.isEnabled()) {
            return;
        }

        const workspaceName = vscode.workspace.name;
        if (!workspaceName) {
            return; // No workspace open
        }

        if (this.isIgnored(workspaceName)) {
            return;
        }

        const color = this.generateColor(workspaceName);
        await this.applyColor(color);
    }

    public async applyColor(color: string) {
        const config = vscode.workspace.getConfiguration('workbench');
        const colorCustomizations = { ...(config.get<any>('colorCustomizations') || {}) };
        
        // Calculate contrasting foreground color (black or white)
        const foreground = this.getContrastColor(color);

        const newColors = {
            ...colorCustomizations,
            "titleBar.activeBackground": color,
            "titleBar.activeForeground": foreground,
            "activityBar.background": color,
            "activityBar.foreground": foreground,
            "statusBar.background": color,
            "statusBar.foreground": foreground,
            // Also color inactive to maintain theme, or leave it? 
            // Usually titleBar.inactiveBackground is handled by theme, but consistent branding might want a washed out version.
            // Let's stick to active elements for now.
        };

        await config.update('colorCustomizations', newColors, vscode.ConfigurationTarget.Workspace);
    }

    public async clearColor() {
        const config = vscode.workspace.getConfiguration('workbench');
        const colorCustomizations = { ...(config.get<any>('colorCustomizations') || {}) };

        // Remove our keys
        const keysToRemove = [
            "titleBar.activeBackground",
            "titleBar.activeForeground",
            "activityBar.background",
            "activityBar.foreground",
            "statusBar.background",
            "statusBar.foreground"
        ];

        keysToRemove.forEach(key => delete colorCustomizations[key]);

        await config.update('colorCustomizations', colorCustomizations, vscode.ConfigurationTarget.Workspace);
    }

    public generateColor(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // Generate HSL: Hue 0-360, Saturation 65-80%, Lightness 35-55% (Darker/Richer colors look better on dark themes usually, but Pastel looks good too)
        // Let's go for specific ranges to avoid ugly colors.
        const h = Math.abs(hash % 360);
        const s = 60 + Math.abs((hash >> 8) % 20); // 60-80%
        const l = 40 + Math.abs((hash >> 16) % 20); // 40-60%

        return this.hslToHex(h, s, l);
    }

    public getRandomColor(): string {
        const h = Math.floor(Math.random() * 360);
        const s = 60 + Math.floor(Math.random() * 20);
        const l = 40 + Math.floor(Math.random() * 20);
        return this.hslToHex(h, s, l);
    }

    private isEnabled(): boolean {
        return vscode.workspace.getConfiguration(this.configPrefix).get<boolean>('enabled', true);
    }

    private isIgnored(name: string): boolean {
        const list = vscode.workspace.getConfiguration(this.configPrefix).get<string[]>('ignoreList', []);
        return list.includes(name);
    }

    private hslToHex(h: number, s: number, l: number): string {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = (n: number) => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    private getContrastColor(hex: string): string {
        // Convert hex to RGB
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        
        // YIQ equation
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#ffffff';
    }
}
