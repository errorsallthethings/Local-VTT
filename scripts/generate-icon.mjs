import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUTPUT = path.join(ROOT, "build", "icon.ico");
const ICON_SIZES = [16, 24, 32, 48, 64, 128, 256];

function color(r, g, b, a = 255) {
  return { r, g, b, a };
}

function blend(base, over) {
  const alpha = over.a / 255;
  return color(
    base.r * (1 - alpha) + over.r * alpha,
    base.g * (1 - alpha) + over.g * alpha,
    base.b * (1 - alpha) + over.b * alpha,
    255
  );
}

function isInsideRoundedRect(x, y, width, height, radius, pointX, pointY) {
  const cornerX = pointX < x + radius ? x + radius : pointX > x + width - radius ? x + width - radius : pointX;
  const cornerY = pointY < y + radius ? y + radius : pointY > y + height - radius ? y + height - radius : pointY;
  return (pointX - cornerX) ** 2 + (pointY - cornerY) ** 2 <= radius ** 2;
}

function distanceToSegment(pointX, pointY, startX, startY, endX, endY) {
  const dx = endX - startX;
  const dy = endY - startY;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    return Math.hypot(pointX - startX, pointY - startY);
  }
  const t = Math.max(0, Math.min(1, ((pointX - startX) * dx + (pointY - startY) * dy) / lengthSquared));
  return Math.hypot(pointX - (startX + t * dx), pointY - (startY + t * dy));
}

function renderIconPixels(size) {
  const pixels = Array.from({ length: size * size }, () => color(15, 19, 24));
  const scale = size / 256;
  const setPixel = (x, y, nextColor) => {
    if (x < 0 || x >= size || y < 0 || y >= size) {
      return;
    }
    const index = y * size + x;
    pixels[index] = blend(pixels[index], nextColor);
  };
  const fillRoundedRect = (x, y, width, height, radius, nextColor) => {
    for (let py = Math.floor(y); py < Math.ceil(y + height); py += 1) {
      for (let px = Math.floor(x); px < Math.ceil(x + width); px += 1) {
        if (isInsideRoundedRect(x, y, width, height, radius, px + 0.5, py + 0.5)) {
          setPixel(px, py, nextColor);
        }
      }
    }
  };
  const strokeRoundedRect = (x, y, width, height, radius, thickness, nextColor) => {
    for (let py = 0; py < size; py += 1) {
      for (let px = 0; px < size; px += 1) {
        const insideOuter = isInsideRoundedRect(x, y, width, height, radius, px + 0.5, py + 0.5);
        const insideInner = isInsideRoundedRect(
          x + thickness,
          y + thickness,
          width - thickness * 2,
          height - thickness * 2,
          Math.max(0, radius - thickness),
          px + 0.5,
          py + 0.5
        );
        if (insideOuter && !insideInner) {
          setPixel(px, py, nextColor);
        }
      }
    }
  };
  const fillRect = (x, y, width, height, nextColor) => {
    for (let py = Math.floor(y); py < Math.ceil(y + height); py += 1) {
      for (let px = Math.floor(x); px < Math.ceil(x + width); px += 1) {
        setPixel(px, py, nextColor);
      }
    }
  };
  const strokeLine = (startX, startY, endX, endY, thickness, nextColor) => {
    for (let py = 0; py < size; py += 1) {
      for (let px = 0; px < size; px += 1) {
        if (distanceToSegment(px + 0.5, py + 0.5, startX, startY, endX, endY) <= thickness / 2) {
          setPixel(px, py, nextColor);
        }
      }
    }
  };

  fillRoundedRect(24 * scale, 24 * scale, 208 * scale, 208 * scale, 30 * scale, color(23, 32, 43));
  strokeRoundedRect(24 * scale, 24 * scale, 208 * scale, 208 * scale, 30 * scale, Math.max(1, 10 * scale), color(122, 162, 247));
  for (const coordinate of [72, 112, 152, 192]) {
    strokeLine(coordinate * scale, 64 * scale, coordinate * scale, 192 * scale, Math.max(1, 6 * scale), color(51, 65, 85, 210));
    strokeLine(64 * scale, coordinate * scale, 192 * scale, coordinate * scale, Math.max(1, 6 * scale), color(51, 65, 85, 210));
  }
  fillRect(74 * scale, 78 * scale, 20 * scale, 100 * scale, color(238, 243, 249));
  fillRect(74 * scale, 158 * scale, 64 * scale, 20 * scale, color(238, 243, 249));
  strokeLine(136 * scale, 80 * scale, 172 * scale, 178 * scale, 18 * scale, color(238, 243, 249));
  strokeLine(216 * scale, 80 * scale, 180 * scale, 178 * scale, 18 * scale, color(238, 243, 249));

  const centerX = 186 * scale;
  const centerY = 174 * scale;
  const radius = 18 * scale;
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      if (Math.hypot(px + 0.5 - centerX, py + 0.5 - centerY) <= radius) {
        setPixel(px, py, color(246, 211, 101));
      }
    }
  }

  return pixels;
}

function createDib(size) {
  const pixels = renderIconPixels(size);
  const headerSize = 40;
  const xorSize = size * size * 4;
  const maskStride = Math.ceil(size / 32) * 4;
  const andSize = maskStride * size;
  const buffer = Buffer.alloc(headerSize + xorSize + andSize);
  let offset = 0;
  buffer.writeUInt32LE(headerSize, offset);
  offset += 4;
  buffer.writeInt32LE(size, offset);
  offset += 4;
  buffer.writeInt32LE(size * 2, offset);
  offset += 4;
  buffer.writeUInt16LE(1, offset);
  offset += 2;
  buffer.writeUInt16LE(32, offset);
  offset += 2;
  buffer.writeUInt32LE(0, offset);
  offset += 4;
  buffer.writeUInt32LE(xorSize + andSize, offset);
  offset += 4;
  buffer.writeInt32LE(0, offset);
  offset += 4;
  buffer.writeInt32LE(0, offset);
  offset += 4;
  buffer.writeUInt32LE(0, offset);
  offset += 4;
  buffer.writeUInt32LE(0, offset);
  offset += 4;

  for (let y = size - 1; y >= 0; y -= 1) {
    for (let x = 0; x < size; x += 1) {
      const pixel = pixels[y * size + x];
      buffer[offset] = Math.round(pixel.b);
      buffer[offset + 1] = Math.round(pixel.g);
      buffer[offset + 2] = Math.round(pixel.r);
      buffer[offset + 3] = Math.round(pixel.a);
      offset += 4;
    }
  }

  return buffer;
}

function createIco() {
  const images = ICON_SIZES.map((size) => ({ size, dib: createDib(size) }));
  const header = Buffer.alloc(6 + images.length * 16);
  let offset = 0;
  header.writeUInt16LE(0, offset);
  offset += 2;
  header.writeUInt16LE(1, offset);
  offset += 2;
  header.writeUInt16LE(images.length, offset);
  offset += 2;
  let imageOffset = header.length;

  for (const image of images) {
    const encodedSize = image.size === 256 ? 0 : image.size;
    header[offset] = encodedSize;
    header[offset + 1] = encodedSize;
    header[offset + 2] = 0;
    header[offset + 3] = 0;
    offset += 4;
    header.writeUInt16LE(1, offset);
    offset += 2;
    header.writeUInt16LE(32, offset);
    offset += 2;
    header.writeUInt32LE(image.dib.length, offset);
    offset += 4;
    header.writeUInt32LE(imageOffset, offset);
    offset += 4;
    imageOffset += image.dib.length;
  }

  return Buffer.concat([header, ...images.map((image) => image.dib)]);
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, createIco());
console.log(`Generated ${path.relative(ROOT, OUTPUT)}`);
