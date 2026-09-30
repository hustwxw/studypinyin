import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { AUDIO_FILES } from './src/audio-data.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 5173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.mp3': 'audio/mpeg',
  '.md': 'text/markdown; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};
const publicPaths = new Set([
  '/', '/index.html', '/icon.svg', '/manifest.webmanifest', '/sw.js',
  '/src/main.js', '/src/pinyin-data.js', '/src/voice-examples.js', '/src/audio-data.js', '/src/styles.css',
  '/assets/pinyin-regular.woff2',
  '/assets/audio/README.md', '/assets/audio/audio-cmn-manifest.json',
  ...Object.values(AUDIO_FILES).map((filename) => `/assets/audio/audio-cmn/${filename}`),
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
    const headers = { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'content-length': contents.length };
    if (path.extname(file) === '.mp3') {
      headers['accept-ranges'] = 'bytes';
      if (request.headers.range) {
        const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
        const start = range?.[1] ? Number(range[1]) : Math.max(contents.length - Number(range?.[2]), 0);
        const end = range?.[1] && range[2] ? Math.min(Number(range[2]), contents.length - 1) : contents.length - 1;
        if (!range || (!range[1] && !range[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= contents.length || end < start) {
          response.writeHead(416, { 'content-range': `bytes */${contents.length}` }).end();
          return;
        }
        response.writeHead(206, { ...headers, 'content-length': end - start + 1, 'content-range': `bytes ${start}-${end}/${contents.length}` });
        response.end(contents.subarray(start, end + 1));
        return;
      }
    }
    response.writeHead(200, headers);
    response.end(contents);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`拼音星球已启动：http://localhost:${port}`);
});
