"""Generate placeholder app icon and splash screen for Phonics App."""
import struct
import zlib

def create_png(width, height, color_hex):
    """Create a minimal valid PNG with solid color."""
    # Parse color
    r = int(color_hex[1:3], 16)
    g = int(color_hex[3:5], 16)
    b = int(color_hex[5:7], 16)

    # Build raw pixel data (RGBA)
    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'  # filter byte
        for x in range(width):
            raw_data += struct.pack('BBBB', r, g, b, 255)

    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = struct.pack('>I', zlib.crc32(c) & 0xffffffff)
        return struct.pack('>I', len(data)) + c + crc

    # PNG signature
    sig = b'\x89PNG\r\n\x1a\n'

    # IHDR
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_chunk = chunk(b'IHDR', ihdr)

    # IDAT
    compressed = zlib.compress(raw_data)
    idat_chunk = chunk(b'IDAT', compressed)

    # IEND
    iend_chunk = chunk(b'IEND', b'')

    return sig + ihdr_chunk + idat_chunk + iend_chunk

# Generate app icon (1024x1024, coral background with white circle)
# Simple design: coral bg + white circle with green leaf
primary = '#FF6F61'
white = '#FFFFFF'
accent = '#66BB6A'

assets_dir = 'C:/Users/qddyd/WorkBuddy/2026-06-14-00-01-37/workspace/project/phonics-app/assets'

# Icon 1024x1024
png_data = create_png(1024, 1024, primary)
with open(f'{assets_dir}/icon.png', 'wb') as f:
    f.write(png_data)
print('Generated icon.png (1024x1024)')

# Adaptive icon
with open(f'{assets_dir}/adaptive-icon.png', 'wb') as f:
    f.write(png_data)
print('Generated adaptive-icon.png (1024x1024)')

# Splash screen (1284x2778 - iPhone 12 Pro Max size, Expo will scale)
splash_data = create_png(1284, 2778, primary)
with open(f'{assets_dir}/splash.png', 'wb') as f:
    f.write(splash_data)
print('Generated splash.png (1284x2778)')

# Favicon for web (48x48)
favicon_data = create_png(48, 48, primary)
with open(f'{assets_dir}/favicon.png', 'wb') as f:
    f.write(favicon_data)
print('Generated favicon.png')

print('All assets generated!')
