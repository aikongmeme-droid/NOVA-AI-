import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

export interface ZipEntryInput {
  name: string;
  data: Buffer;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC32_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function createZipBuffer(entries: readonly ZipEntryInput[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  const now = new Date();
  const dosTime =
    ((now.getHours() & 0x1f) << 11) |
    ((now.getMinutes() & 0x3f) << 5) |
    ((now.getSeconds() >> 1) & 0x1f);
  const dosDate =
    (((Math.max(1980, now.getFullYear()) - 1980) & 0x7f) << 9) |
    (((now.getMonth() + 1) & 0x0f) << 5) |
    (now.getDate() & 0x1f);

  for (const entry of entries) {
    const cleanName = entry.name.replace(/\\/g, '/').replace(/^\/+/, '');
    const nameBuf = Buffer.from(cleanName, 'utf8');
    const uncompressed = entry.data;
    const compressed = zlib.deflateRawSync(uncompressed, { level: 6 });
    const useDeflate = compressed.length < uncompressed.length;
    const payload = useDeflate ? compressed : uncompressed;
    const method = useDeflate ? 8 : 0;
    const crc = crc32(uncompressed);

    // Local file header (30 bytes + filename)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 filename flag
    localHeader.writeUInt16LE(method, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(payload.length, 18);
    localHeader.writeUInt32LE(uncompressed.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra length

    localParts.push(localHeader, nameBuf, payload);

    // Central directory header (46 bytes + filename)
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // signature
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0x0800, 8); // UTF-8 flag
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(payload.length, 20);
    centralHeader.writeUInt32LE(uncompressed.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30); // extra length
    centralHeader.writeUInt16LE(0, 32); // comment length
    centralHeader.writeUInt16LE(0, 34); // disk number start
    centralHeader.writeUInt16LE(0, 36); // internal attrs
    centralHeader.writeUInt32LE(0, 38); // external attrs
    centralHeader.writeUInt32LE(offset, 42); // relative offset of local header

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + payload.length;
  }

  const centralDirBuf = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // central dir disk
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDirBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...localParts, centralDirBuf, eocd]);
}

function walkFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full));
    } else if (entry.isFile()) {
      results.push(full);
    }
  }
  return results.sort();
}

const TEXT_CODE_EXTS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.css',
  '.html',
  '.json',
  '.webmanifest',
]);

export function buildExportBundles(rootDir: string, distDir: string): void {
  const builtHtmlPath = path.resolve(distDir, 'index.html');
  if (!fs.existsSync(builtHtmlPath)) {
    return;
  }

  // 1. Assemble self-contained single-file dist/singlefile/index.html
  let html = fs.readFileSync(builtHtmlPath, 'utf8');
  html = html.replace(
    /<link\b[^>]*rel=["']stylesheet["'][^>]*href=["'](\/assets\/[^"']+)["'][^>]*>/gi,
    (match, relPath: string) => {
      const filePath = path.resolve(distDir, relPath.replace(/^\/+/, ''));
      if (!fs.existsSync(filePath)) return match;
      const css = fs.readFileSync(filePath, 'utf8').replace(/<\/style/gi, '<\\/style');
      return `<style>${css}</style>`;
    }
  );

  const manifestPath = path.resolve(rootDir, 'public/manifest.webmanifest');
  if (fs.existsSync(manifestPath)) {
    const manifestB64 = fs.readFileSync(manifestPath).toString('base64');
    html = html.replace(
      /href=["']\/manifest\.webmanifest["']/i,
      `href="data:application/manifest+json;base64,${manifestB64}"`
    );
  }

  const inlineModules: string[] = [];
  html = html.replace(
    /<script\b[^>]*type=["']module["'][^>]*src=["'](\/assets\/[^"']+)["'][^>]*><\/script>/gi,
    (match, relPath: string) => {
      const filePath = path.resolve(distDir, relPath.replace(/^\/+/, ''));
      if (!fs.existsSync(filePath)) return match;
      const js = fs
        .readFileSync(filePath, 'utf8')
        .replace(/<\/script/gi, '<\\/script')
        .replace(/<!--/g, '\\x3C!--');
      inlineModules.push(`<script type="module">${js}</script>`);
      return '';
    }
  );

  if (inlineModules.length > 0) {
    const moduleBlock = inlineModules.join('\n');
    html = html.replace(/<\/body>/i, () => `${moduleBlock}</body>`);
  }

  const singleFileDir = path.resolve(distDir, 'singlefile');
  fs.mkdirSync(singleFileDir, { recursive: true });
  const singleFilePath = path.resolve(singleFileDir, 'index.html');
  fs.writeFileSync(singleFilePath, html, 'utf8');

  // 2. Collect all project source files (frontend + backend + config + portrait + manifest)
  const rootFiles = [
    '.env.example',
    'index.html',
    'metadata.json',
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'server.ts',
  ];

  const candidatePaths: string[] = [];
  for (const rel of rootFiles) {
    const abs = path.resolve(rootDir, rel);
    if (fs.existsSync(abs)) candidatePaths.push(abs);
  }

  for (const folder of ['src', 'server', 'scripts', 'public/assets']) {
    candidatePaths.push(...walkFiles(path.resolve(rootDir, folder)));
  }

  if (fs.existsSync(manifestPath)) {
    candidatePaths.push(manifestPath);
  }

  const uniqueAbsPaths = Array.from(new Set(candidatePaths)).sort();

  const zipEntries: ZipEntryInput[] = [];
  const textSections: string[] = [
    '====================================================================',
    'NOVA AI — COMPLETE APPLICATION SOURCE CODE BUNDLE',
    'Includes: Frontend (src/), Backend (server.ts, server/), Configs',
    '====================================================================\n',
  ];

  for (const abs of uniqueAbsPaths) {
    const rel = path.relative(rootDir, abs).replace(/\\/g, '/');
    const data = fs.readFileSync(abs);
    zipEntries.push({ name: `nova-ai/${rel}`, data });

    const ext = path.extname(rel).toLowerCase();
    if (TEXT_CODE_EXTS.has(ext) || rel === '.env.example') {
      textSections.push(
        `\n// ====================================================================\n` +
          `// FILE: ${rel}\n` +
          `// ====================================================================\n` +
          data.toString('utf8')
      );
    }
  }

  // Include compiled standalone single-file HTML inside the ZIP as well
  zipEntries.push({
    name: 'nova-ai/singlefile/index.html',
    data: fs.readFileSync(singleFilePath),
  });

  // Include manifest of required video clips in public/videos/ (222 MB total MP4s kept external)
  const videosDir = path.resolve(rootDir, 'public/videos');
  if (fs.existsSync(videosDir)) {
    const videoFiles = fs
      .readdirSync(videosDir)
      .filter((f) => f.endsWith('.mp4'))
      .sort();
    const videoReadme =
      `NOVA AI Emotion Video Assets (${videoFiles.length} MP4 clips)\n` +
      `Place these .mp4 files under public/videos/ on your hosting server:\n\n` +
      videoFiles.join('\n') +
      '\n';
    zipEntries.push({
      name: 'nova-ai/public/videos/VIDEOS_MANIFEST.txt',
      data: Buffer.from(videoReadme, 'utf8'),
    });
  }

  const bundleDir = path.resolve(distDir, 'bundle');
  fs.mkdirSync(bundleDir, { recursive: true });
  fs.writeFileSync(path.resolve(bundleDir, 'nova-ai-code.zip'), createZipBuffer(zipEntries));
  fs.writeFileSync(path.resolve(bundleDir, 'nova-ai-all-code.txt'), textSections.join('\n'), 'utf8');
}
