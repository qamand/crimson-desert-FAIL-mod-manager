// packages/papgt/src/crc.ts
// Реализация алгоритма lookup3, используемого в PAPGT/PAMT
// Основана на C++ коде из QT_ModManager

function rot32(value: number, bits: number): number {
  return ((value << bits) | (value >>> (32 - bits))) >>> 0;
}

function finalizeLookup3(a: number, b: number, c: number): [number, number, number] {
  c = (c ^ b) >>> 0;
  c = (c - rot32(b, 14)) >>> 0;
  a = (a ^ c) >>> 0;
  a = (a - rot32(c, 11)) >>> 0;
  b = (b ^ a) >>> 0;
  b = (b - rot32(a, 25)) >>> 0;
  c = (c ^ b) >>> 0;
  c = (c - rot32(b, 16)) >>> 0;
  a = (a ^ c) >>> 0;
  a = (a - rot32(c, 4)) >>> 0;
  b = (b ^ a) >>> 0;
  b = (b - rot32(a, 14)) >>> 0;
  c = (c ^ b) >>> 0;
  c = (c - rot32(b, 24)) >>> 0;
  return [a >>> 0, b >>> 0, c >>> 0];
}

export function calculatePAChecksum(data: Buffer): number {
  let length = data.length;
  let a = (0xDEBA1DCD + length) >>> 0;
  let b = a;
  let c = a;
  let offset = 0;
  const ptr = data;

  while (length > 12) {
    a = (a + ptr.readUInt32LE(offset)) >>> 0;
    b = (b + ptr.readUInt32LE(offset + 4)) >>> 0;
    c = (c + ptr.readUInt32LE(offset + 8)) >>> 0;
    a = (a - c) >>> 0; a = (a ^ rot32(c, 4)) >>> 0; c = (c + b) >>> 0;
    b = (b - a) >>> 0; b = (b ^ rot32(a, 6)) >>> 0; a = (a + c) >>> 0;
    c = (c - b) >>> 0; c = (c ^ rot32(b, 8)) >>> 0; b = (b + a) >>> 0;
    a = (a - c) >>> 0; a = (a ^ rot32(c, 16)) >>> 0; c = (c + b) >>> 0;
    b = (b - a) >>> 0; b = (b ^ rot32(a, 19)) >>> 0; a = (a + c) >>> 0;
    c = (c - b) >>> 0; c = (c ^ rot32(b, 4)) >>> 0; b = (b + a) >>> 0;
    offset += 12;
    length -= 12;
  }

  if (length === 0) return c >>> 0;

  const tail = Buffer.alloc(12);
  ptr.copy(tail, 0, offset, offset + length);
  if (length >= 1) a = (a + tail.readUInt32LE(0)) >>> 0;
  if (length >= 5) b = (b + tail.readUInt32LE(4)) >>> 0;
  if (length >= 9) c = (c + tail.readUInt32LE(8)) >>> 0;
  [, , c] = finalizeLookup3(a, b, c);
  return c >>> 0;
}