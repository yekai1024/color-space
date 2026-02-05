import * as vscode from 'vscode';

export function getPreviewHtml(presets: vscode.QuickPickItem[], isLocal: boolean = false): string {
    // Transform presets to groups structure
    const groups: { title: string; colors: { name: string; hex: string }[] }[] = [];
    let currentGroup: { title: string; colors: { name: string; hex: string }[] } | null = null;

    for (const item of presets) {
        if (item.kind === vscode.QuickPickItemKind.Separator) {
            currentGroup = {
                title: item.label,
                colors: []
            };
            groups.push(currentGroup);
        } else if (currentGroup && item.description) {
            currentGroup.colors.push({
                name: item.label,
                hex: item.description
            });
        }
    }

    const vsCodeApiScript = isLocal 
        ? `
        window.vscode = {
            postMessage: (msg) => {
                console.log('Mock postMessage:', msg);
                // alert('Apply color: ' + msg.color);
            }
        };
        ` 
        : `const vscode = acquireVsCodeApi();`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Color Space - Window Preview</title>
    <style>
        :root {
            --bg-color: #f5f5f7;
            --text-color: #1d1d1f;
            --card-bg: #ffffff;
            --editor-bg: #1e1e1e;
            --editor-line: #333;
            --editor-fg: #d4d4d4;
        }
        
        body.dark-mode {
            --bg-color: #1e1e1e;
            --text-color: #e0e0e0;
            --card-bg: #2d2d2d;
            --editor-bg: #1e1e1e;
            --editor-line: #333;
            --editor-fg: #d4d4d4;
        }

        body.light-mode {
            --bg-color: #f5f5f7;
            --text-color: #1d1d1f;
            --card-bg: #ffffff;
            --editor-bg: #ffffff;
            --editor-line: #e0e0e0;
            --editor-fg: #333;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            margin: 0;
            padding: 20px;
            transition: background-color 0.3s, color 0.3s;
        }

        .header-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            position: sticky;
            top: 0;
            background-color: var(--bg-color);
            z-index: 100;
            padding: 10px 0;
            border-bottom: 1px solid rgba(0,0,0,0.1);
        }

        h1 {
            font-weight: 600;
            margin: 0;
            font-size: 24px;
        }
        
        h2 {
            margin-top: 30px;
            margin-bottom: 20px;
            font-weight: 500;
            border-bottom: 1px solid rgba(128,128,128,0.2);
            padding-bottom: 10px;
        }

        .theme-toggle {
            display: flex;
            align-items: center;
            gap: 10px;
            background: var(--card-bg);
            padding: 8px 16px;
            border-radius: 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            cursor: pointer;
            user-select: none;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 25px;
        }

        .preview-card {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            transition: transform 0.2s, box-shadow 0.2s;
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
            border: 2px solid transparent;
        }

        .preview-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 20px rgba(0,0,0,0.15);
            border-color: #007acc;
        }
        
        .ide-window {
            width: 100%;
            height: 160px;
            border-radius: 6px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            border: 1px solid rgba(128,128,128,0.2);
            font-size: 10px;
            pointer-events: none; /* Let clicks pass to card */
        }
        
        .title-bar {
            height: 22px;
            display: flex;
            align-items: center;
            padding: 0 10px;
            font-weight: 500;
        }
        
        .window-body {
            flex: 1;
            display: flex;
            overflow: hidden;
        }
        
        .activity-bar {
            width: 30px;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding-top: 10px;
            gap: 10px;
        }
        
        .activity-icon {
            width: 14px;
            height: 14px;
            border-radius: 2px;
            opacity: 0.8;
        }
        
        .editor-area {
            flex: 1;
            background-color: var(--editor-bg);
            padding: 10px;
            color: var(--editor-fg);
            font-family: monospace;
            display: flex;
            flex-direction: column;
            gap: 6px;
            transition: background-color 0.3s;
        }
        
        .editor-line {
            height: 6px;
            border-radius: 2px;
            background-color: var(--editor-line);
            width: 60%;
        }
        .editor-line.short { width: 30%; }
        .editor-line.long { width: 80%; }
        
        .status-bar {
            height: 18px;
            display: flex;
            align-items: center;
            padding: 0 10px;
            font-size: 9px;
            justify-content: space-between;
        }

        .info {
            margin-top: 12px;
            text-align: center;
            width: 100%;
        }
        
        .name {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 5px;
        }
        
        .hex-info {
            font-family: monospace;
            font-size: 10px;
            opacity: 0.7;
        }

        /* Toggle Switch */
        .switch {
            position: relative;
            display: inline-block;
            width: 40px;
            height: 20px;
        }
        .switch input { 
            opacity: 0;
            width: 0;
            height: 0;
        }
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 20px;
        }
        .slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 2px;
            bottom: 2px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        input:checked + .slider {
            background-color: #2196F3;
        }
        input:checked + .slider:before {
            transform: translateX(20px);
        }

    </style>
</head>
<body class="light-mode">

    <div class="header-controls">
        <h1>Select a Theme</h1>
        <div class="theme-toggle" onclick="toggleTheme()">
            <span>Dark Background</span>
            <label class="switch">
                <input type="checkbox" id="themeCheckbox">
                <span class="slider"></span>
            </label>
        </div>
    </div>

    <div id="app"></div>

    <script>
        ${vsCodeApiScript}

        function toggleTheme() {
            const body = document.body;
            const checkbox = document.getElementById('themeCheckbox');
            
            // If function called by click on wrapper (not checkbox), toggle checkbox
            // But checkbox click propagates, so we need to be careful not to double toggle
            // Simplified: just read checkbox state if clicked on label, or toggle class manually
        }
        
        document.querySelector('.switch input').addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.remove('light-mode');
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
                document.body.classList.add('light-mode');
            }
        });

        function applyColor(hex) {
            vscode.postMessage({
                command: 'applyColor',
                color: hex
            });
        }

        // --- Color Logic ---
        function hexToHsl(hex) {
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

        function hslToHex(h, s, l) {
            l /= 100;
            const a = s * Math.min(l, 1 - l) / 100;
            const f = (n) => {
                const k = (n + h / 30) % 12;
                const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                return Math.round(255 * color).toString(16).padStart(2, '0');
            };
            return \`#\${f(0)}\${f(8)}\${f(4)}\`;
        }

        function getContrastColor(hex) {
            const r = parseInt(hex.substring(1, 3), 16);
            const g = parseInt(hex.substring(3, 5), 16);
            const b = parseInt(hex.substring(5, 7), 16);
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            return (yiq >= 128) ? '#000000' : '#ffffff';
        }

        function calculateColors(baseColor) {
            const hsl = hexToHsl(baseColor);
            // Title Bar: Lighter
            const titleL = Math.min(hsl.l + 10, 98);
            const titleColor = hslToHex(hsl.h, hsl.s, titleL);
            const titleFg = getContrastColor(titleColor);
            // Status Bar: Darker
            const statusL = Math.max(hsl.l - 10, 10);
            const statusColor = hslToHex(hsl.h, hsl.s, statusL);
            const statusFg = getContrastColor(statusColor);
            return {
                base: baseColor,
                title: { bg: titleColor, fg: titleFg },
                status: { bg: statusColor, fg: statusFg }
            };
        }

        const groups = ${JSON.stringify(groups)};

        const app = document.getElementById('app');
        groups.forEach(group => {
            const h2 = document.createElement('h2');
            h2.textContent = group.title;
            app.appendChild(h2);

            const grid = document.createElement('div');
            grid.className = 'grid';

            group.colors.forEach(colorItem => {
                const c = calculateColors(colorItem.hex);
                const card = document.createElement('div');
                card.className = 'preview-card';
                card.onclick = () => applyColor(colorItem.hex);
                
                card.innerHTML = \`
                    <div class="ide-window">
                        <div class="title-bar" style="background-color: \${c.title.bg}; color: \${c.title.fg}">
                            <span>\${colorItem.name.split(' ')[0]} - Code</span>
                        </div>
                        <div class="window-body">
                            <div class="activity-bar" style="background-color: \${c.status.bg}; color: \${c.status.fg}">
                                <div class="activity-icon" style="background-color: \${c.status.fg}"></div>
                                <div class="activity-icon" style="background-color: \${c.status.fg}"></div>
                            </div>
                            <div class="editor-area">
                                <div class="editor-line long"></div>
                                <div class="editor-line"></div>
                                <div class="editor-line short"></div>
                            </div>
                        </div>
                        <div class="status-bar" style="background-color: \${c.status.bg}; color: \${c.status.fg}">
                            <span>main*</span>
                            <span>UTF-8</span>
                        </div>
                    </div>
                    <div class="info">
                        <div class="name">\${colorItem.name}</div>
                        <div class="hex-info">\${colorItem.hex}</div>
                    </div>
                \`;
                grid.appendChild(card);
            });
            app.appendChild(grid);
        });
    </script>
</body>
</html>`;
}
