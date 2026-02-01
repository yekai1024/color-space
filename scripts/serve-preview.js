const http = require('http');
const path = require('path');

const PORT = 4000;
const MODULE_PATH = path.resolve(__dirname, '../out/getPreviewHtml');

const server = http.createServer((req, res) => {
    try {
        // Clear cache to allow hot-reloading of the compiled module
        delete require.cache[require.resolve(MODULE_PATH)];
        
        const { getPreviewHtml } = require(MODULE_PATH);
        const html = getPreviewHtml(true); // true for isLocal
        
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Error rendering preview:\n' + err.stack);
        console.error(err);
    }
});

server.listen(PORT, () => {
    console.log(`Preview server running at http://localhost:${PORT}/`);
    console.log('Tip: Run "npm run watch" in parallel to enable hot-reloading.');
});
