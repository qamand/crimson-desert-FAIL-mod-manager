// packages/papgt/src/papgt.ts
import * as fs from 'fs';
import * as path from 'path';
import { calculatePAChecksum } from './crc.js';

export interface PapgtEntry {
  is_optional: number;   // uint8
  language: number;      // uint16
  zero: number;          // uint8
  group_name_offset: number; // uint32
  pack_meta_checksum: number; // uint32
}

export interface PapgtFile {
  unknown: number;       // uint32
  checksum: number;      // uint32
  entry_count: number;   // uint8
  unknown1: number;      // uint8
  unknown2: number;      // uint16
  entries: PapgtEntry[];
  group_names: string[];  // соответствующие имена (обычно папки "0036" и т.д.)
}

export const PAPGT_LANG_ALL = 0xFFFF;
export const BASE_PACK_START = 0x0036;

function readCString(buffer: Buffer, offset: number): string {
  let end = offset;
  while (end < buffer.length && buffer[end] !== 0) end++;
  return buffer.toString('utf8', offset, end);
}

export function readPAPGT(filePath: string): PapgtFile | null {
  try {
    const data = fs.readFileSync(filePath);
    if (data.length < 12) return null;

    const unknown = data.readUInt32LE(0);
    const checksum = data.readUInt32LE(4);
    const entry_count = data.readUInt8(8);
    const unknown1 = data.readUInt8(9);
    const unknown2 = data.readUInt16LE(10);

    const entries: PapgtEntry[] = [];
    let offset = 12;
    for (let i = 0; i < entry_count; i++) {
      if (offset + 12 > data.length) return null;
      const is_optional = data.readUInt8(offset);
      const language = data.readUInt16LE(offset + 1);
      const zero = data.readUInt8(offset + 3);
      const group_name_offset = data.readUInt32LE(offset + 4);
      const pack_meta_checksum = data.readUInt32LE(offset + 8);
      entries.push({ is_optional, language, zero, group_name_offset, pack_meta_checksum });
      offset += 12;
    }

    // Чтение строкового блока
    if (offset + 4 > data.length) return null;
    const stringSize = data.readUInt32LE(offset);
    offset += 4;

    if (offset + stringSize > data.length) return null;
    const stringBlock = data.slice(offset, offset + stringSize);

    const group_names: string[] = [];
    for (const entry of entries) {
      group_names.push(readCString(stringBlock, entry.group_name_offset));
    }

    return { unknown, checksum, entry_count, unknown1, unknown2, entries, group_names };
  } catch {
    return null;
  }
}

export function writePAPGT(filePath: string, papgt: PapgtFile): boolean {
  // Строим строковый блок
  const nameChunks: Buffer[] = [];
  const nameOffsets: number[] = [];
  let currentOffset = 0;

  for (const name of papgt.group_names) {
    const enc = Buffer.from(name + '\0', 'utf8');
    nameOffsets.push(currentOffset);
    nameChunks.push(enc);
    currentOffset += enc.length;
  }

  const stringBlock = Buffer.concat(nameChunks);

  // Строим тело (entry + string size + string block)
  const bodyParts: Buffer[] = [];
  for (let i = 0; i < papgt.entries.length; i++) {
    const entry = papgt.entries[i];
    const buf = Buffer.alloc(12);
    buf.writeUInt8(entry.is_optional, 0);
    buf.writeUInt16LE(entry.language, 1);
    buf.writeUInt8(entry.zero, 3);
    buf.writeUInt32LE(nameOffsets[i], 4);
    buf.writeUInt32LE(entry.pack_meta_checksum, 8);
    bodyParts.push(buf);
  }

  // Добавляем размер строк и сам строковый блок
  const stringSizeBuf = Buffer.alloc(4);
  stringSizeBuf.writeUInt32LE(stringBlock.length, 0);
  bodyParts.push(stringSizeBuf);
  bodyParts.push(stringBlock);

  const body = Buffer.concat(bodyParts);

  // Вычисляем CRC тела
  const crc = calculatePAChecksum(body);

  // Формируем заголовок
  const header = Buffer.alloc(12);
  header.writeUInt32LE(papgt.unknown, 0);
  header.writeUInt32LE(crc, 4);
  header.writeUInt8(papgt.entry_count, 8);
  header.writeUInt8(papgt.unknown1, 9);
  header.writeUInt16LE(papgt.unknown2, 10);

  const finalData = Buffer.concat([header, body]);

  try {
    fs.writeFileSync(filePath, finalData);
    return true;
  } catch {
    return false;
  }
}

// Функция для проверки и исправления CRC в PAMT
export function verifyAndFixPAMT(pamtPath: string): number {
  try {
    const fd = fs.openSync(pamtPath, 'r+');
    const data = fs.readFileSync(fd);
    if (data.length < 12) {
      fs.closeSync(fd);
      return 0;
    }
    const headerCrc = data.readUInt32LE(0);
    const bodyData = data.slice(12);
    const actualCrc = calculatePAChecksum(bodyData);

    if (headerCrc !== actualCrc) {
      // Записываем правильный CRC
      const crcBuf = Buffer.alloc(4);
      crcBuf.writeUInt32LE(actualCrc, 0);
      fs.writeSync(fd, crcBuf, 0, 4, 0);
      console.log(`[PAPGT] Fixed PAMT CRC for ${path.basename(pamtPath)}`);
    }
    fs.closeSync(fd);
    return actualCrc;
  } catch {
    return 0;
  }
}