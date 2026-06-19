// Quick PNG generator using Node.js zlib (fast)
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function createPNG(width, height, hexColor) {
  const r = parseInt(hexColor.slice(1,3), 16);
  const g = parseInt(hexColor.slice(3,5), 16);
  const b = parseInt(hexColor.slice(5,7), 16);

  // Build raw pixel rows (each row starts with filter byte 0x00)
  const rowSize = 1 + width * 4; // filter + RGBA per pixel
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const offset = y * rowSize;
    raw[offset] = 0; // no filter
    for (let x = 0; x < width; x++) {
      const px = offset + 1 + x * 4;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
      raw[px + 3] = 255;
    }
  }

  const compressed = zlib.deflateSync(raw);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(typeAndData) >>> 0, 0);
    return Buffer.concat([len, typeAndData, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const assets = path.join(__dirname, '..', 'assets');
const colors = {
  primary: '#FF6F61',
  bg: '#FFF8F0'
};

// Icon: 1024x1024 is ideal but 256x256 is enough for a placeholder
const icon = createPNG(256, 256, colors.primary);
fs.writeFileSync(path.join(assets, 'icon.png'), icon);
fs.writeFileSync(path.join(assets, 'adaptive-icon.png'), icon);

// Splash: small placeholder
const splash = createPNG(256, 400, colors.primary);
fs.writeFileSync(path.join(assets, 'splash.png'), splash);

// Favicon
const favicon = createPNG(48, 48, colors.primary);
fs.writeFileSync(path.join(assets, 'favicon.png'), favicon);

console.log('All assets generated!');
console.log('  icon.png: 256x256');
console.log('  adaptive-icon.png: 256x256');
console.log('  splash.png: 256x400');
console.log('  favicon.png: 48x48');
