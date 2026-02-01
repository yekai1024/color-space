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

    public async applyColor(baseColor: string) {
        const config = vscode.workspace.getConfiguration('workbench');
        const colorCustomizations = { ...(config.get<any>('colorCustomizations') || {}) };
        
        const hsl = this.hexToHsl(baseColor);

        // Title Bar: Lighter
        const titleL = Math.min(hsl.l + 10, 98);
        const titleColor = this.hslToHex(hsl.h, hsl.s, titleL);
        const titleFg = this.getContrastColor(titleColor);

        // Status Bar & Activity Bar: Darker
        const statusL = Math.max(hsl.l - 10, 10);
        const statusColor = this.hslToHex(hsl.h, hsl.s, statusL);
        const statusFg = this.getContrastColor(statusColor);

        const newColors = {
            ...colorCustomizations,
            "titleBar.activeBackground": titleColor,
            "titleBar.activeForeground": titleFg,
            "activityBar.background": statusColor,
            "activityBar.foreground": statusFg,
            "statusBar.background": statusColor,
            "statusBar.foreground": statusFg,
        };

        await config.update('colorCustomizations', newColors, vscode.ConfigurationTarget.Workspace);
    }

    private hexToHsl(hex: string): { h: number, s: number, l: number } {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        return { h: h * 360, s: s * 100, l: l * 100 };
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
