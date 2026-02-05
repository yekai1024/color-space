const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const svgPath = process.argv[2] 
    ? (path.isAbsolute(process.argv[2]) ? process.argv[2] : path.join(process.cwd(), process.argv[2]))
    : path.join(__dirname, '../images/icon.svg');

const pngPath = process.argv[2]
    ? path.join(path.dirname(svgPath), path.basename(svgPath, path.extname(svgPath)) + '.png')
    : path.join(__dirname, '../images/icon.png');

async function convert() {
    try {
        if (!fs.existsSync(svgPath)) {
            console.error('Error: Input file not found at', svgPath);
            process.exit(1);
        }

        console.log(`Converting ${path.basename(svgPath)} to ${path.basename(pngPath)}...`);
        
        await sharp(svgPath)
            .resize(512, 512) // Resize to 512x512 for high quality
            .png()
            .toFile(pngPath);

        console.log(`Successfully converted ${path.basename(svgPath)} to ${path.basename(pngPath)}`);
    } catch (err) {
        console.error('Conversion failed:', err);
        process.exit(1);
    }
}

convert();
