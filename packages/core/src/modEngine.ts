// packages/core/src/modEngine.ts
import { IFileSystem, ILogger, ISecurityGuard, IModEngine, ModType, ModEntry } from '@modmanager/types';
import * as path from 'path';

function getModType(fileName: string): ModType {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.asi' || ext === '.dll') return 'asi';
  if (ext === '.lang' || ext === '.loc' || ext === '.mo') return 'language';
  return 'data';
}

export class ModEngine implements IModEngine {
  constructor(
    public readonly fs: IFileSystem,
    public readonly logger: ILogger,
    public readonly security: ISecurityGuard,
  ) {}

  private getModsPath(modsPath?: string): string {
    const p = modsPath ?? this.fs.getPaths().modsPath;
    if (!p) throw new Error('Mods path is not set');
    return p;
  }

  private getGamePath(gamePath?: string): string {
    const p = gamePath ?? this.fs.getPaths().gamePath;
    if (!p) throw new Error('Game path is not set');
    return p;
  }

  async installMod(archivePath: string, modsPath?: string): Promise<{ modId: string; entry: ModEntry }> {
    console.log('[ModEngine] installMod:', archivePath);
    await this.security.validateModArchive(archivePath);
    const targetModsPath = this.getModsPath(modsPath);
    const baseName = path.basename(archivePath);
    const ext = path.extname(baseName).toLowerCase();
    let modId: string;
    let entry: ModEntry;

    if (ext === '.zip') {
      const folderName = path.basename(baseName, ext);
      const destDir = path.join(targetModsPath, folderName);
      console.log('[ModEngine] Extracting ZIP to', destDir);
      await this.fs.ensureDir(destDir);
      await this.fs.extractArchive(archivePath, destDir);
      modId = folderName;
      entry = { id: modId, name: folderName, type: getModType(folderName) };
      this.logger.info('ModEngine', `Installed ZIP mod: ${folderName}`);
    } else {
      let destName = baseName;
      let counter = 1;
      while (await this.fs.exists(path.join(targetModsPath, destName))) {
        const parsed = path.parse(baseName);
        destName = `${parsed.name} (${counter})${parsed.ext}`;
        counter++;
      }
      const destPath = path.join(targetModsPath, destName);
      console.log('[ModEngine] Copying file to', destPath);
      await this.fs.copy(archivePath, destPath);
      modId = destName;
      entry = { id: modId, name: destName, type: getModType(destName) };
      this.logger.info('ModEngine', `Installed file mod: ${destName}`);
    }

    return { modId, entry };
  }

  async removeMod(modId: string, modsPath?: string): Promise<boolean> {
    this.security.validateModId(modId);
    const targetModsPath = this.getModsPath(modsPath);
    const modPath = path.join(targetModsPath, modId);
    if (await this.fs.exists(modPath)) {
      await this.fs.remove(modPath);
      this.logger.info('ModEngine', `Removed: ${modId}`);
      return true;
    }
    return false;
  }

  async listMods(modsPath?: string): Promise<ModEntry[]> {
    const targetModsPath = modsPath ?? this.fs.getPaths().modsPath;
    console.log('[ModEngine] listMods from:', targetModsPath);
    if (!targetModsPath) return [];

    const entries: ModEntry[] = [];
    const files = await this.fs.listFiles(targetModsPath);
    console.log('[ModEngine] files in root:', files);
    for (const file of files) {
      if (file.startsWith('.')) continue;
      entries.push({
        id: file,
        name: file,
        type: getModType(file),
      });
    }
    console.log('[ModEngine] listMods result:', entries);
    return entries;
  }

  async buildOverlay(modIds: string[], gamePath: string): Promise<any> {
    return { success: true };
  }

  async createBackup(assetPath: string, modsPath?: string, gamePath?: string): Promise<string> {
    const targetModsPath = this.getModsPath(modsPath);
    const targetGamePath = this.getGamePath(gamePath);
    const backupId = 'backup_' + Date.now();
    const backupDir = path.join(targetModsPath, '..', 'backups', backupId);
    const fileName = path.basename(assetPath);
    await this.fs.ensureDir(backupDir);
    await this.fs.copy(path.join(targetGamePath, fileName), path.join(backupDir, fileName));
    this.logger.info('ModEngine', `Created backup ${backupId} for ${fileName}`);
    return backupId;
  }

  async restoreBackup(backupId: string, modsPath?: string, gamePath?: string): Promise<boolean> {
    const targetModsPath = this.getModsPath(modsPath);
    const targetGamePath = this.getGamePath(gamePath);
    const backupDir = path.join(targetModsPath, '..', 'backups', backupId);
    const files = await this.fs.listFiles(backupDir);
    if (files.length === 0) return false;
    const fileName = files[0];
    await this.fs.copy(path.join(backupDir, fileName), path.join(targetGamePath, fileName));
    this.logger.info('ModEngine', `Restored backup ${backupId} -> ${fileName}`);
    return true;
  }
}