import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const output = path.join(root, 'dist');
const files = [
  'index.html',
  'icon.svg',
  'manifest.webmanifest',
  'sw.js',
  'src/main.js',
  'src/pinyin-data.js',
  'src/voice-examples.js',
  'src/audio-data.js',
  'src/styles.css',
  'assets/pinyin-regular.woff2',
  'assets/OFL-Pinyin-Font.txt',
];

if (path.dirname(output) !== root) throw new Error('打包目录必须位于项目根目录下');

await rm(output, { recursive: true, force: true });
for (const file of files) {
  const target = path.join(output, file);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(path.join(root, file), target);
}

async function copyDirectory(source, target) {
  await mkdir(target, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) await copyDirectory(from, to);
    else await copyFile(from, to);
  }
}

await copyDirectory(path.join(root, 'assets/audio'), path.join(output, 'assets/audio'));

console.log(`打包完成：dist/（${files.length} 个文件）`);
