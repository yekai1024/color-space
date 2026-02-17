export function getCreativeHtml(isLocal: boolean = false, initialColor: string = '#007aff'): string {
    // Validate initial color
    if (!/^#[0-9A-F]{6}$/i.test(initialColor)) {
        initialColor = '#007aff';
    }
    const cleanInitialColor = initialColor.replace('#', '');
    const vsCodeApiScript = isLocal 
        ? `
        const vscodeApi = {
            postMessage: (msg) => {
                console.log('Mock postMessage:', msg);
                if (msg.command === 'apply') {
                    // alert('Apply color: ' + msg.color);
                    console.log('Apply color: ' + msg.color);
                }
            }
        };
        ` 
        : `const vscodeApi = acquireVsCodeApi();`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Color Space - Creative Mode</title>
    <style>
        :root {
            --bg-color: #f5f5f7;
            --text-color: #1d1d1f;
            --card-bg: #ffffff;
            --editor-bg: #ffffff;
            --editor-line: #e5e5e5;
            --editor-fg: #333333;
            --input-bg: #e5e5e5;
            --button-primary: #007aff;
            --button-text: #ffffff;
        }
        
        body.dark-mode {
            --bg-color: #252526;
            --text-color: #e0e0e0;
            --card-bg: #2d2d2d;
            --editor-bg: #1e1e1e;
            --editor-line: #333;
            --editor-fg: #d4d4d4;
            --input-bg: #3e3e3e;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            height: 100vh;
            box-sizing: border-box;
        }

        .container {
            max-width: 600px;
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        h1 {
            text-align: center;
            font-weight: 600;
            margin-bottom: 5px;
            font-size: 1.5rem;
            margin-top: 5px;
        }

        .controls {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            padding: 15px;
            background-color: var(--card-bg);
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .color-picker-container {
            display: flex;
            flex-direction: row;
            align-items: flex-start;
            gap: 20px;
            width: auto;
            justify-content: center;
        }

        .picker-left {
            display: flex;
            flex-direction: column;
            gap: 12px;
            align-items: center;
        }

        .picker-right {
            display: flex;
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
            justify-content: center;
            height: 100%;
            padding-top: 10px; /* Slight offset to align with canvas center if needed */
        }

        #colorCanvas {
            border-radius: 6px;
            cursor: crosshair;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        #hueSlider {
            -webkit-appearance: none;
            width: 100%;
            height: 12px;
            border-radius: 6px;
            background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
            outline: none;
            cursor: pointer;
        }

        #hueSlider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #ffffff;
            border: 2px solid rgba(0,0,0,0.2);
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            cursor: pointer;
        }

        .hex-input-wrapper {
            display: flex;
            align-items: center;
            gap: 8px;
            background-color: var(--input-bg);
            padding: 4px 8px;
            border-radius: 6px;
            border: 1px solid rgba(128,128,128,0.3);
        }

        input[type="text"] {
            padding: 4px;
            border: none;
            background: none;
            color: var(--text-color);
            font-family: monospace;
            font-size: 14px;
            width: 60px;
            text-align: left;
            outline: none;
        }

        .preview-window {
            width: 100%;
            height: 300px;
            background-color: var(--editor-bg);
            border-radius: 8px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            position: relative;
        }

        .preview-titlebar {
            height: 30px;
            display: flex;
            align-items: center;
            padding: 0 10px;
            font-size: 12px;
            transition: background-color 0.2s, color 0.2s;
        }

        .preview-body {
            flex: 1;
            display: flex;
            overflow: hidden;
        }

        .preview-activitybar {
            width: 48px;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding-top: 10px;
            transition: background-color 0.2s, color 0.2s;
        }

        .preview-sidebar {
            width: 200px;
            background-color: var(--bg-color);
            border-right: 1px solid rgba(128,128,128,0.1);
            display: flex;
            flex-direction: column;
            padding: 10px;
        }

        .preview-editor {
            flex: 1;
            background-color: var(--editor-bg);
            padding: 20px;
            font-family: monospace;
            color: var(--editor-fg);
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .preview-statusbar {
            height: 22px;
            display: flex;
            align-items: center;
            padding: 0 10px;
            font-size: 11px;
            transition: background-color 0.2s, color 0.2s;
        }

        .btn-primary {
            background-color: var(--button-primary);
            color: var(--button-text);
            border: none;
            padding: 8px 24px;
            font-size: 14px;
            font-weight: 500;
            border-radius: 6px;
            cursor: pointer;
            transition: opacity 0.2s;
        }

        .btn-primary:hover {
            opacity: 0.9;
        }

        .mock-line {
            height: 8px;
            background-color: var(--editor-line);
            border-radius: 2px;
            opacity: 0.3;
        }
        
        .mock-icon {
            width: 16px;
            height: 16px;
            background-color: currentColor;
            opacity: 0.5;
            border-radius: 3px;
            margin-bottom: 12px;
        }

        .theme-toggle {
            position: absolute;
            top: 15px;
            right: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--card-bg);
            padding: 6px 12px;
            border-radius: 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            cursor: pointer;
            user-select: none;
            z-index: 10;
            font-size: 12px;
            border: 1px solid rgba(128,128,128,0.1);
            color: var(--text-color);
            opacity: 1;
        }
        
        .theme-toggle:hover {
            opacity: 1;
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        /* Toggle Switch */
        .switch {
            position: relative;
            display: inline-block;
            width: 34px;
            height: 18px;
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
            height: 14px;
            width: 14px;
            left: 2px;
            bottom: 2px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        input:checked + .slider {
            background-color: var(--button-primary);
        }
        input:checked + .slider:before {
            transform: translateX(16px);
        }

    </style>
</head>
<body class="light-mode">
    <div class="container">
        <div class="controls">
            <div class="theme-toggle" id="themeToggleWrapper">
                <span>Dark Background</span>
                <label class="switch">
                    <input type="checkbox" id="themeCheckbox">
                    <span class="slider"></span>
                </label>
            </div>
            <h1>Creative Mode</h1>
            <p style="opacity: 0.7; margin-top: 0;">Pick a base color to generate your theme</p>
            
            <div class="color-picker-container">
                <div class="picker-left">
                    <canvas id="colorCanvas" width="200" height="150"></canvas>
                    <input type="range" id="hueSlider" min="0" max="360" value="210">
                </div>
                <div class="picker-right">
                    <div class="hex-input-wrapper">
                        <span style="opacity: 0.6; font-size: 14px;">#</span>
                        <input type="text" id="hexInput" value="007aff" maxlength="6">
                        <div id="currentColorPreview" style="width: 24px; height: 24px; border-radius: 4px; background-color: #007aff; border: 1px solid rgba(128,128,128,0.2);"></div>
                    </div>
                    <button class="btn-primary" id="applyBtn">Apply Theme</button>
                </div>
            </div>
        </div>

        <div class="preview-window">
            <div class="preview-titlebar" id="p-titlebar">
                <span>Visual Studio Code</span>
            </div>
            <div class="preview-body">
                <div class="preview-activitybar" id="p-activitybar">
                    <div class="mock-icon"></div>
                    <div class="mock-icon"></div>
                    <div class="mock-icon"></div>
                </div>
                <div class="preview-sidebar">
                    <div class="mock-line" style="width: 60%"></div>
                    <div class="mock-line" style="width: 80%; margin-top: 10px"></div>
                    <div class="mock-line" style="width: 50%; margin-top: 10px"></div>
                </div>
                <div class="preview-editor">
                    <div class="mock-line" style="width: 40%"></div>
                    <div class="mock-line" style="width: 70%"></div>
                    <div class="mock-line" style="width: 55%"></div>
                    <div class="mock-line" style="width: 65%"></div>
                </div>
            </div>
            <div class="preview-statusbar" id="p-statusbar">
                <span style="margin-right: 10px">main*</span>
                <span>0 errors</span>
            </div>
        </div>
    </div>

    <script>
        ${vsCodeApiScript}

        // Logic from ColorManager.ts translated to JS
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
            return '#' + f(0) + f(8) + f(4);
        }

        function getContrastColor(hex) {
            const r = parseInt(hex.substring(1, 3), 16);
            const g = parseInt(hex.substring(3, 5), 16);
            const b = parseInt(hex.substring(5, 7), 16);
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            return (yiq >= 128) ? '#000000' : '#ffffff';
        }

        function updatePreview(baseColor) {
            if (!/^#[0-9A-F]{6}$/i.test(baseColor)) return;

            const hsl = hexToHsl(baseColor);

            // Title Bar: Lighter
            const titleL = Math.min(hsl.l + 10, 98);
            const titleColor = hslToHex(hsl.h, hsl.s, titleL);
            const titleFg = getContrastColor(titleColor);

            // Status Bar & Activity Bar: Darker
            const statusL = Math.max(hsl.l - 10, 10);
            const statusColor = hslToHex(hsl.h, hsl.s, statusL);
            const statusFg = getContrastColor(statusColor);

            // Update DOM
            const titleBar = document.getElementById('p-titlebar');
            titleBar.style.backgroundColor = titleColor;
            titleBar.style.color = titleFg;

            const activityBar = document.getElementById('p-activitybar');
            activityBar.style.backgroundColor = statusColor;
            activityBar.style.color = statusFg;

            const statusBar = document.getElementById('p-statusbar');
            statusBar.style.backgroundColor = statusColor;
            statusBar.style.color = statusFg;
        }

        // Event Listeners
        const colorCanvas = document.getElementById('colorCanvas');
        const hueSlider = document.getElementById('hueSlider');
        const hexInput = document.getElementById('hexInput');
        const currentColorPreview = document.getElementById('currentColorPreview');
        const applyBtn = document.getElementById('applyBtn');
        const themeCheckbox = document.getElementById('themeCheckbox');
        const themeToggleWrapper = document.getElementById('themeToggleWrapper');

        const ctx = colorCanvas.getContext('2d');
        let currentHue = 210;
        let currentSat = 100;
        let currentVal = 100; // Value/Brightness

        // Draw the Saturation-Value palette
        function drawPalette() {
            ctx.clearRect(0, 0, colorCanvas.width, colorCanvas.height);
            
            // 1. Fill with current Hue
            ctx.fillStyle = 'hsl(' + currentHue + ', 100%, 50%)';
            ctx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);

            // 2. Horizontal gradient: White -> Transparent
            const whiteGrad = ctx.createLinearGradient(0, 0, colorCanvas.width, 0);
            whiteGrad.addColorStop(0, 'rgba(255,255,255,1)');
            whiteGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = whiteGrad;
            ctx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);

            // 3. Vertical gradient: Transparent -> Black
            const blackGrad = ctx.createLinearGradient(0, 0, 0, colorCanvas.height);
            blackGrad.addColorStop(0, 'rgba(0,0,0,0)');
            blackGrad.addColorStop(1, 'rgba(0,0,0,1)');
            ctx.fillStyle = blackGrad;
            ctx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);

            // 4. Draw cursor
            const x = (currentSat / 100) * colorCanvas.width;
            const y = (1 - currentVal / 100) * colorCanvas.height;
            
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // HSV to Hex
        function hsvToHex(h, s, v) {
            s /= 100;
            v /= 100;
            let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
            const rgb = [f(5), f(3), f(1)].map(x => Math.round(x * 255).toString(16).padStart(2, '0'));
            return '#' + rgb.join('');
        }

        // Helper function to convert hex to HSV (simple implementation or reuse if available)
        function hexToHsv(hex) {
            let r = 0, g = 0, b = 0;
            if (hex.length === 6) {
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
            }
            r /= 255; g /= 255; b /= 255;
            let max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, v = max;
            let d = max - min;
            s = max === 0 ? 0 : d / max;
            if (max === min) h = 0;
            else {
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            return { h: h * 360, s: s * 100, v: v * 100 };
        }

        // Initialize with provided color
        hexInput.value = '${cleanInitialColor}';
        
        // Convert initial hex to HSV
        const initialHsv = hexToHsv('${cleanInitialColor}');
        currentHue = initialHsv.h;
        currentSat = initialHsv.s;
        currentVal = initialHsv.v;

        function updateColorFromInput() {
            const hsv = hexToHsv(hexInput.value);
            currentHue = hsv.h;
            currentSat = hsv.s;
            currentVal = hsv.v;
            hueSlider.value = currentHue;
            drawPalette();
            currentColorPreview.style.backgroundColor = '#' + hexInput.value;
            updatePreview('#' + hexInput.value);
        }

        function updateColorFromPicker() {
            const hex = hsvToHex(currentHue, currentSat, currentVal);
            hexInput.value = hex.replace('#', '');
            currentColorPreview.style.backgroundColor = hex;
            updatePreview(hex);
        }

        // Interactions
        let isDragging = false;
        
        function pickColorAt(x, y) {
            currentSat = Math.max(0, Math.min(100, (x / colorCanvas.width) * 100));
            currentVal = Math.max(0, Math.min(100, 100 - (y / colorCanvas.height) * 100));
            drawPalette();
            updateColorFromPicker();
        }

        colorCanvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            pickColorAt(e.offsetX, e.offsetY);
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const rect = colorCanvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                pickColorAt(x, y);
            }
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
        });

        hueSlider.addEventListener('input', (e) => {
            currentHue = parseFloat(e.target.value);
            drawPalette();
            updateColorFromPicker();
        });

        hexInput.addEventListener('input', (e) => {
            let val = e.target.value;
            if (val.length === 6 && /^[0-9A-F]{6}$/i.test(val)) {
                updateColorFromInput();
            }
        });

        hexInput.addEventListener('blur', () => {
             // Reset to current color if invalid
             const hex = hsvToHex(currentHue, currentSat, currentVal);
             hexInput.value = hex.replace('#', '');
        });

        applyBtn.addEventListener('click', () => {
            vscodeApi.postMessage({
                command: 'apply',
                color: '#' + hexInput.value
            });
        });

        // Toggle when clicking the wrapper (if not clicking the checkbox/label directly)
        themeToggleWrapper.addEventListener('click', (e) => {
            if (e.target !== themeCheckbox && e.target.tagName !== 'LABEL' && e.target.className !== 'slider') {
                themeCheckbox.checked = !themeCheckbox.checked;
                themeCheckbox.dispatchEvent(new Event('change'));
            }
        });

        themeCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.remove('light-mode');
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
                document.body.classList.add('light-mode');
            }
            updatePreview(hexInput.value);
        });

        // Initialize
        updateColorFromInput();

    </script>
</body>
</html>`;
}
