import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Minimal pure Node PNG generator
function createPNG(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression: 0
  ihdrData[11] = 0; // Filter: 0
  ihdrData[12] = 0; // Interlace: 0
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data: scanline filter byte (0) + RGBA pixels
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type None
    for (let x = 0; x < width; x++) {
      // Create a nice gradient with desktop browser accents
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const maxDist = Math.sqrt(cx ** 2 + cy ** 2);
      const ratio = dist / maxDist;

      // Dark navy slate background with vibrant cyan/violet center
      const inFrame = x > width * 0.15 && x < width * 0.85 && y > height * 0.2 && y < height * 0.75;
      const inHeader = inFrame && y < height * 0.32;

      let pixelR = Math.round(r * (1 - ratio * 0.4));
      let pixelG = Math.round(g * (1 - ratio * 0.4));
      let pixelB = Math.round(b * (1 - ratio * 0.2));

      if (inHeader) {
        pixelR = 15;
        pixelG = 23;
        pixelB = 42;
      } else if (inFrame) {
        pixelR = Math.round(30 + 30 * (x / width));
        pixelG = Math.round(41 + 60 * (x / width));
        pixelB = Math.round(59 + 120 * (x / width));
      }

      rawData[offset++] = Math.min(255, Math.max(0, pixelR));
      rawData[offset++] = Math.min(255, Math.max(0, pixelG));
      rawData[offset++] = Math.min(255, Math.max(0, pixelB));
      rawData[offset++] = 255; // Alpha
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const crcPayload = Buffer.concat([typeBuf, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(calculateCRC32(crcPayload), 0);

  return Buffer.concat([length, typeBuf, data, crc]);
}

function calculateCRC32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      if ((crc & 1) !== 0) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc >>>= 1;
      }
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Generate the required PWA and Apple icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, 14, 165, 233));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, 14, 165, 233));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, 14, 165, 233));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, 14, 165, 233));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(32, 32, 14, 165, 233));

console.log('Icons successfully generated in public directory.');
