// packages/papgt/src/deploy.ts
import * as path from 'path';
import * as fs from 'fs';
import { readPAPGT, writePAPGT, PapgtEntry, verifyAndFixPAMT, BASE_PACK_START, PAPGT_LANG_ALL } from './papgt.js';
import { convertJsonModToFolder } from '@modmanager/converter';

export interface DeployOptions {
  gamePath: string;
  modsPath: string;
  activeMods: string[];
  log: (msg: string) => void;
}

export async function deployMods(options: DeployOptions): Promise<void> {
  const { gamePath, modsPath, activeMods, log } = options;

  const backupDir = path.join(gamePath, 'mod_backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const recordFile = path.join(backupDir, 'deployed.json');

  // 1. Очистка предыдущего деплоя
  log('Cleaning up previous deployment...');
  if (fs.existsSync(recordFile)) {
    const prevRecord = JSON.parse(fs.readFileSync(recordFile, 'utf-8'));
    if (prevRecord.injected_folders) {
      for (const folder of prevRecord.injected_folders) {
        const targetDir = path.join(gamePath, folder);
        if (fs.existsSync(targetDir)) {
          fs.rmSync(targetDir, { recursive: true, force: true });
        }
      }
    }
    // Восстанавливаем оригинальный papgt
    const papgtBackup = path.join(backupDir, 'meta', '0.papgt');
    const papgtTarget = path.join(gamePath, 'meta', '0.papgt');
    if (fs.existsSync(papgtBackup)) {
      fs.rmSync(papgtTarget, { force: true });
      fs.copyFileSync(papgtBackup, papgtTarget);
    }
  }

  if (activeMods.length === 0) {
    if (fs.existsSync(recordFile)) fs.rmSync(recordFile);
    log('Restored vanilla state.');
    return;
  }

  // 2. Бэкап оригинального papgt
  const papgtPath = path.join(gamePath, 'meta', '0.papgt');
  if (!fs.existsSync(papgtPath)) {
    throw new Error('meta/0.papgt not found in game directory');
  }
  const papgtBackupDir = path.join(backupDir, 'meta');
  if (!fs.existsSync(papgtBackupDir)) {
    fs.mkdirSync(papgtBackupDir, { recursive: true });
  }
  const papgtBackupPath = path.join(papgtBackupDir, '0.papgt');
  if (!fs.existsSync(papgtBackupPath)) {
    fs.copyFileSync(papgtPath, papgtBackupPath);
    log('Backed up original 0.papgt');
  }

  // 3. Читаем текущий papgt
  const papgtFile = readPAPGT(papgtPath);
  if (!papgtFile) {
    throw new Error('Failed to read papgt file');
  }

  const injectedFolders: string[] = [];
  const tempDirs: string[] = [];

  // 4. Обрабатываем каждый активный мод
  for (let i = 0; i < activeMods.length; i++) {
    let rawId = activeMods[i];

    // Если имя содержит расширение .json, отрезаем его для поиска
    let modId = rawId.endsWith('.json') ? rawId.slice(0, -5) : rawId;
    let modDir = path.join(modsPath, modId);
    let isTemp = false;

    // Если путь не существует, возможно, это файл, а не папка
    if (!fs.existsSync(modDir)) {
      // Ищем файл с расширением .json
      const jsonPath = path.join(modsPath, modId + '.json');
      if (fs.existsSync(jsonPath)) {
        log(`Converting JSON mod: ${modId}`);
        const converted = await convertJsonModToFolder(jsonPath, gamePath, modsPath);
        if (converted) {
          modDir = converted;
          modId = path.basename(converted);
          isTemp = true;
          tempDirs.push(converted);
        } else {
          log(`Warning: Failed to convert JSON mod: ${modId}`);
          continue;
        }
      } else {
        // Ищем файл с оригинальным rawId (вдруг это папка с json-подобным именем)
        const altJsonPath = path.join(modsPath, rawId);
        if (fs.existsSync(altJsonPath) && fs.statSync(altJsonPath).isFile() && rawId.toLowerCase().endsWith('.json')) {
          log(`Converting JSON mod: ${rawId}`);
          const converted = await convertJsonModToFolder(altJsonPath, gamePath, modsPath);
          if (converted) {
            modDir = converted;
            modId = path.basename(converted);
            isTemp = true;
            tempDirs.push(converted);
          } else {
            log(`Warning: Failed to convert JSON mod: ${rawId}`);
            continue;
          }
        } else {
          log(`Warning: mod not found: ${rawId}`);
          continue;
        }
      }
    }

    // Проверяем, что это папка
    const stat = fs.statSync(modDir);
    if (!stat.isDirectory()) {
      log(`Warning: skipping non-folder mod: ${modId}`);
      continue;
    }

    const packNum = BASE_PACK_START + i;
    const packStr = packNum.toString(16).toUpperCase().padStart(4, '0');
    const targetDir = path.join(gamePath, packStr);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    injectedFolders.push(packStr);

    // Ищем 0.pamt
    const pamtPath = path.join(modDir, '0.pamt');
    if (fs.existsSync(pamtPath)) {
      const newChecksum = verifyAndFixPAMT(pamtPath);
      const destPamt = path.join(targetDir, '0.pamt');
      try {
        fs.linkSync(pamtPath, destPamt);
      } catch {
        fs.copyFileSync(pamtPath, destPamt);
      }

      const entry: PapgtEntry = {
        is_optional: 0,
        language: PAPGT_LANG_ALL,
        zero: 0,
        group_name_offset: 0,
        pack_meta_checksum: newChecksum,
      };
      papgtFile.entries.unshift(entry);
      papgtFile.group_names.unshift(packStr);
      papgtFile.entry_count = papgtFile.entries.length & 0xFF;
    } else {
      log(`Warning: no 0.pamt found in ${modId}, skipping PAPGT entry`);
    }

    // Копируем PAZ файлы
    const pazFiles = fs.readdirSync(modDir).filter(f => f.endsWith('.paz'));
    for (const pazFile of pazFiles) {
      const src = path.join(modDir, pazFile);
      const dst = path.join(targetDir, pazFile);
      try {
        fs.linkSync(src, dst);
      } catch {
        fs.copyFileSync(src, dst);
      }
    }

    log(`Linked [${modId}] -> ${packStr}`);
  }

  // 5. Записываем обновлённый papgt
  if (!writePAPGT(papgtPath, papgtFile)) {
    throw new Error('Failed to write papgt file');
  }

  // 6. Сохраняем запись о деплое
  const record = { injected_folders: injectedFolders };
  fs.writeFileSync(recordFile, JSON.stringify(record, null, 2));

  // 7. Удаляем временные папки конвертера
  for (const tmp of tempDirs) {
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch (e) {
      console.warn('[Deploy] Failed to remove temp dir:', tmp, e);
    }
  }

  log(`Successfully deployed ${injectedFolders.length} mod(s).`);
}