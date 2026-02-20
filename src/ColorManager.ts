import * as vscode from 'vscode';

export class ColorManager {
    private context: vscode.ExtensionContext;
    private configPrefix = 'colorspace';

    private readonly rawPresets = [
        { labelEn: 'Morandi Light', labelZh: '莫兰迪浅色系', kind: vscode.QuickPickItemKind.Separator },
        { labelEn: 'Haze Blue', labelZh: '雾霾蓝', description: '#93A2BA' },
        { labelEn: 'Sage Green', labelZh: '鼠尾草绿', description: '#BCCFBF' },
        { labelEn: 'Bean Paste Pink', labelZh: '豆沙粉', description: '#E4C6C6' },
        { labelEn: 'Oatmeal', labelZh: '燕麦色', description: '#DED7C8' },
        { labelEn: 'Lilac', labelZh: '藕荷紫', description: '#CDBFD4' },
        { labelEn: 'Glacier Gray', labelZh: '冰川灰', description: '#C4D3D9' },
        { labelEn: 'Almond Yellow', labelZh: '杏仁黄', description: '#F0E6CC' },
        { labelEn: 'Linen', labelZh: '亚麻色', description: '#E6DCCD' },
        { labelEn: 'Dusty Orange', labelZh: '脏橘色', description: '#E8C3B0' },
        { labelEn: 'Milk Tea', labelZh: '奶茶色', description: '#D6C8B5' },
        
        { labelEn: 'Morandi Dark', labelZh: '莫兰迪深色系', kind: vscode.QuickPickItemKind.Separator },
        { labelEn: 'Iron Gray', labelZh: '铁灰色', description: '#5D6169' },
        { labelEn: 'Prussian Blue Gray', labelZh: '普鲁士蓝灰', description: '#4A5D70' },
        { labelEn: 'Olive Gray', labelZh: '橄榄灰绿', description: '#5E665B' },
        { labelEn: 'Burgundy Gray', labelZh: '勃艮第灰红', description: '#705353' },
        { labelEn: 'Smoky Purple', labelZh: '烟熏紫', description: '#61596B' },
        { labelEn: 'Deep Sea Blue', labelZh: '深海蓝灰', description: '#455666' },
        { labelEn: 'Caramel Brown', labelZh: '焦糖褐灰', description: '#806A5E' },
        { labelEn: 'Forest Gray', labelZh: '森林灰绿', description: '#48594E' },
        { labelEn: 'Slate Rock', labelZh: '岩石灰', description: '#585F63' },
        { labelEn: 'Eggplant Gray', labelZh: '茄皮紫灰', description: '#5E5363' },

        { labelEn: 'Dunhuang Classic', labelZh: '敦煌色', kind: vscode.QuickPickItemKind.Separator },
        { labelEn: 'Sky Cyan', labelZh: '天青', description: '#B5CECE' },
        { labelEn: 'Moon White', labelZh: '月白', description: '#D6ECF0' },
        { labelEn: 'Crab Shell Green', labelZh: '蟹壳青', description: '#BBCDC5' },
        { labelEn: 'Lovesick Gray', labelZh: '相思灰', description: '#61649F' },
        { labelEn: 'Agarwood', labelZh: '沉香', description: '#867069' },
        { labelEn: 'Muted Cinnabar', labelZh: '朱砂红-灰', description: '#9A4C39' },
        { labelEn: 'Mineral Green', labelZh: '石绿', description: '#4A8F78' },
        { labelEn: 'Lapis Blue', labelZh: '青金石', description: '#5D6185' },
        { labelEn: 'Desert Gold', labelZh: '大漠金', description: '#C9B780' },
        { labelEn: 'Tea White', labelZh: '茶白', description: '#F3F4E6' },
    ];

    public get presets(): vscode.QuickPickItem[] {
        const isChinese = vscode.env.language.toLowerCase().startsWith('zh');
        return this.rawPresets.map(p => ({
            label: isChinese ? p.labelZh : p.labelEn,
            kind: p.kind,
            description: p.description
        }));
    }

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public async autoColor() {
        if (!this.isEnabled()) {
            return;
        }

        // Check if user manually cleared color for this workspace
        if (this.context.workspaceState.get('colorspace.manuallyCleared')) {
            return;
        }

        const workspaceName = vscode.workspace.name;
        if (!workspaceName) {
            return; // No workspace open
        }

        if (this.isIgnored(workspaceName)) {
            return;
        }

        // Check if colors are already configured in settings
        const config = vscode.workspace.getConfiguration('workbench');
        const colorCustomizations = config.get<any>('colorCustomizations');
        if (colorCustomizations && (
            colorCustomizations['titleBar.activeBackground'] ||
            colorCustomizations['activityBar.background'] ||
            colorCustomizations['statusBar.background']
        )) {
            return; // Already configured, do not overwrite
        }

        const color = this.generateColor(workspaceName);
        await this.applyColor(color);
    }

    public async applyColor(baseColor: string) {
        // Reset manually cleared flag since we are applying a color
        await this.context.workspaceState.update('colorspace.manuallyCleared', false);

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
        // Calculate inactive foreground with opacity based on contrast color
        const statusInactiveFg = statusFg === '#ffffff' ? '#ffffff66' : '#00000066';
        // Add a subtle border to separate activity bar
        const activityBorder = statusFg === '#ffffff' ? '#ffffff33' : '#00000033';

        const newColors = {
            ...colorCustomizations,
            "titleBar.activeBackground": titleColor,
            "titleBar.activeForeground": titleFg,
            "activityBar.background": statusColor,
            "activityBar.foreground": statusFg,
            "activityBar.inactiveForeground": statusInactiveFg,
            "activityBar.border": activityBorder,
            "statusBar.background": statusColor,
            "statusBar.foreground": statusFg,
        };

        await config.update('colorCustomizations', newColors, vscode.ConfigurationTarget.Workspace);
    }

    public isValidHex(hex: string): boolean {
        return /^#?([0-9A-F]{3}|[0-9A-F]{6})$/i.test(hex);
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
        // Set manually cleared flag
        await this.context.workspaceState.update('colorspace.manuallyCleared', true);

        const config = vscode.workspace.getConfiguration('workbench');
        const colorCustomizations = { ...(config.get<any>('colorCustomizations') || {}) };

        // Remove our keys
        const keysToRemove = [
            "titleBar.activeBackground",
            "titleBar.activeForeground",
            "activityBar.background",
            "activityBar.foreground",
            "activityBar.inactiveForeground",
            "activityBar.border",
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

        // Determine current theme type (Dark or Light)
        const themeKind = vscode.window.activeColorTheme.kind;
        const isLightTheme = themeKind === vscode.ColorThemeKind.Light || themeKind === vscode.ColorThemeKind.HighContrastLight;

        // Filter presets based on theme
        // If theme is Light, we want Light colors (where contrast color is black)
        // If theme is Dark, we want Dark colors (where contrast color is white)
        const validPresets = this.presets.filter(item => {
            if (item.kind === vscode.QuickPickItemKind.Separator || !item.description) {
                return false;
            }
            const contrast = this.getContrastColor(item.description);
            // contrast === '#000000' means background is Light
            // contrast === '#ffffff' means background is Dark
            return isLightTheme ? (contrast === '#000000') : (contrast === '#ffffff');
        });

        if (validPresets.length > 0) {
            // Pick deterministically from valid presets based on hash
            const index = Math.abs(hash) % validPresets.length;
            return validPresets[index].description!;
        }
        
        // Fallback to algorithmic generation if no matching presets found
        // Generate HSL: Hue 0-360, Saturation 65-80%, Lightness 35-55% (Darker/Richer colors look better on dark themes usually, but Pastel looks good too)
        // Let's go for specific ranges to avoid ugly colors.
        const h = Math.abs(hash % 360);
        const s = 60 + Math.abs((hash >> 8) % 20); // 60-80%
        const l = 40 + Math.abs((hash >> 16) % 20); // 40-60%

        return this.hslToHex(h, s, l);
    }

    public getRandomColor(): string {
        // Filter out separators and items without description (color)
        const validPresets = this.presets.filter(item => item.kind !== vscode.QuickPickItemKind.Separator && item.description);
        
        if (validPresets.length > 0) {
            const randomIndex = Math.floor(Math.random() * validPresets.length);
            return validPresets[randomIndex].description!;
        }

        // Fallback to random generation if no presets found (should not happen)
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
