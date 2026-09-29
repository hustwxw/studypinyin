import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 5173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};
const publicPaths = new Set([
  '/', '/index.html', '/icon.svg', '/manifest.webmanifest', '/sw.js',
  '/src/main.js', '/src/pinyin-data.js', '/src/voice-examples.js', '/src/styles.css',
  '/assets/noto-sans-pinyin.woff2',
]);

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (!publicPaths.has(pathname)) {
      response.writeHead(404).end('Not found');
      return;
    }
    const requested = path.resolve(root, `.${pathname}`);
    const file = pathname === '/' ? path.join(root, 'index.html') : requested;
    const contents = await readFile(file);
    response.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
    response.end(contents);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`拼音星球已启动：http://localhost:${port}`);
});
