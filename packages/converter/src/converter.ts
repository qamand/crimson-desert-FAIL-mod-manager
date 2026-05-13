// packages/converter/src/converter.ts
import * as fs from 'fs';
import * as path from 'path';
import { calculatePAChecksum } from './crc.js'; // берём из собственного crc.ts

const TMP_PREFIX = 'tmp_json_mod_';

export async function convertJsonModToFolder(
  jsonModPath: string,
  gamePath: string,
  outputBaseDir: string
): Promise<string | null> {
  if (!fs.existsSync(jsonModPath)) return null;

  const raw = fs.readFileSync(jsonModPath, 'utf-8');
  let json: any;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    console.error('[Converter] Invalid JSON:', jsonModPath);
    return null;
  }

  let patches: any[] = [];
  if (Array.isArray(json)) {
    patches = json;
  } else if (Array.isArray(json.patches)) {
    patches = json.patches;
  } else {
    // Нет структуры patches – конвертация невозможна
    return null;
  }

  if (patches.length === 0) return null;

  // Создаём временную папку для мода
  const modId = path.basename(jsonModPath, '.json');
  const tmpDir = path.join(outputBaseDir, TMP_PREFIX + modId);
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tmpDir, { recursive: true });

  const pazFiles: Map<string, Buffer> = new Map(); // game_file -> буфер
  const pazPatches: Map<string, number[]> = new Map(); // game_file -> список смещений

  for (const patch of patches) {
    if (!patch.game_file || !Array.isArray(patch.changes)) continue;
    const gameFileName = patch.game_file;
    if (!pazFiles.has(gameFileName)) {
      const origPath = path.join(gamePath, gameFileName);
      if (!fs.existsSync(origPath)) {
        console.warn('[Converter] Original file not found:', origPath);
        continue;
      }
      pazFiles.set(gameFileName, fs.readFileSync(origPath));
      pazPatches.set(gameFileName, []);
    }
    const buffer = pazFiles.get(gameFileName)!;
    const offsets = pazPatches.get(gameFileName)!;

    for (const change of patch.changes) {
      if (typeof change.offset !== 'number' || typeof change.patched !== 'string') continue;
      const offset = change.offset;
      if (offsets.includes(offset)) continue; // избегаем дублирования
      const patchedHex = change.patched;
      const bytes = Buffer.from(patchedHex, 'hex');
      if (offset + bytes.length <= buffer.length) {
        bytes.copy(buffer, offset);
        offsets.push(offset);
      } else {
        console.warn('[Converter] Offset out of range:', change.label, offset);
      }
    }
  }

  // Записываем изменённые PAZ-файлы во временную папку
  let pamtData: Buffer | null = null;
  for (const [gameFileName, buffer] of pazFiles.entries()) {
    const dest = path.join(tmpDir, path.basename(gameFileName));
    fs.writeFileSync(dest, buffer);
    if (!pamtData) {
      pamtData = buffer;
    }
  }

  if (!pamtData) {
    // Ничего не пропатчили
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return null;
  }

  // Создаём 0.pamt
  const pamtPath = path.join(tmpDir, '0.pamt');
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0, 0); // временный CRC
  const body = pamtData.slice(12); // остальное после заголовка
  const fullPamt = Buffer.concat([header, body]);
  const actualCrc = calculatePAChecksum(body);
  fullPamt.writeUInt32LE(actualCrc, 0);
  fs.writeFileSync(pamtPath, fullPamt);

  console.log('[Converter] Generated temporary mod folder:', tmpDir);
  return tmpDir;
}