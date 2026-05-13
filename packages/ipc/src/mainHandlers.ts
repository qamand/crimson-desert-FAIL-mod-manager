// packages/ipc/src/mainHandlers.ts
import { ipcMain, dialog, shell, BrowserWindow } from 'electron';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { RegisterAllHandlersServices } from '@modmanager/types';
import { deployMods } from '@modmanager/papgt';

function findFileRecursive(
  dir: string, targetName: string, maxDepth: number, currentDepth = 0
): string | null {
  if (currentDepth > maxDepth) return null;
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return null; }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isFile() && entry.name === targetName) return full;
    if (entry.isDirectory()) {
      const found = findFileRecursive(full, targetName, maxDepth, currentDepth + 1);
      if (found) return found;
    }
  }
  return null;
}

function sendLog(level: string, message: string) {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    win.webContents.send('log:message', { level, message, time: new Date().toISOString() });
  }
}

export function registerAllHandlers(services: RegisterAllHandlersServices) {
  const { fs: fsService, modEngine, logger, security, store } = services;

  ipcMain.handle('app:getPaths', () => ({
    gamePath: store.gamePath,
    modsPath: store.modsPath,
  }));

  ipcMain.handle('app:setPaths', async (_event, gamePath: string, modsPath: string) => {
    store.gamePath = gamePath;
    store.modsPath = modsPath;
    fsService.updatePaths(gamePath, modsPath);
    logger.info('paths', `Set: game=${gamePath}, mods=${modsPath}`);
    sendLog('INFO', `Paths updated: game=${gamePath}, mods=${modsPath}`);
    try {
      await fsService.saveConfig({ gamePath, modsPath });
    } catch (e) {
      sendLog('ERROR', 'Failed to save configuration');
    }
    return { success: true };
  });

  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Mods', extensions: ['zip', 'json', 'asi', 'dll', 'lang', 'loc', 'xml', 'txt'] }],
    });
    return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
  });

  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
  });

  ipcMain.handle('shell:open', async (_event, targetPath: string) => {
    if (!targetPath) throw new Error('Path is empty');
    const resolved = path.resolve(targetPath);
    if (!fs.existsSync(resolved)) throw new Error(`Path does not exist: ${resolved}`);
    const error = await shell.openPath(resolved);
    if (error) throw new Error(error);
    sendLog('INFO', `Opened path: ${resolved}`);
    return { success: true };
  });

  ipcMain.handle('mods:install', async (_event, archivePath: string) => {
    if (!store.modsPath) throw new Error('Mods path not set');
    try {
      const result = await modEngine.installMod(archivePath, store.modsPath);
      sendLog('SUCCESS', `Mod installed: ${result.entry.name}`);
      return { success: true, ...result };
    } catch (error) {
      sendLog('ERROR', `Failed to install mod: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('mods:remove', async (_event, modId: string) => {
    try {
      const removed = await modEngine.removeMod(modId, store.modsPath);
      sendLog('INFO', `Mod removed: ${modId}`);
      return { success: true, removed };
    } catch (error) {
      sendLog('ERROR', `Failed to remove mod: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('mods:list', async () => {
    try {
      if (!store.modsPath) return [];
      return await modEngine.listMods(store.modsPath);
    } catch (error) {
      sendLog('ERROR', 'Failed to retrieve mod list');
      return [];
    }
  });

  ipcMain.handle('mods:readContent', async (_event, modId: string) => {
    if (!modId || modId.includes('/') || modId.includes('\\') || modId.includes('..')) {
      sendLog('ERROR', 'Invalid modId for reading content');
      throw new Error('Invalid modId');
    }
    const fullPath = path.join(store.modsPath, modId);
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) return null;
    try {
      return fs.readFileSync(fullPath, 'utf-8');
    } catch (error) {
      sendLog('ERROR', `Could not read mod file: ${modId}`);
      return null;
    }
  });

  // Деплой модов – реальная работа с PAPGT
  ipcMain.handle('mods:deploy', async (_event, activeModIds: string[]) => {
    try {
      if (!store.gamePath || !store.modsPath) throw new Error('Paths not set');
      // Подробные логи идут из deployMods
      await deployMods({
        gamePath: store.gamePath,
        modsPath: store.modsPath,
        activeMods: activeModIds,
        log: (msg: string) => sendLog('INFO', msg),
      });
      sendLog('SUCCESS', 'Deployment completed');
      return { success: true };
    } catch (error) {
      sendLog('ERROR', `Deploy failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('overlay:apply', async () => ({ success: true }));

  ipcMain.handle('overlay:verify', async () => ({ success: true }));

  ipcMain.handle('backup:create', async (_event, assetPath: string) => {
    try {
      const backupId = await modEngine.createBackup(assetPath, store.modsPath, store.gamePath);
      sendLog('INFO', `Backup created: ${backupId}`);
      return { success: true, backupId };
    } catch (error) {
      sendLog('ERROR', 'Failed to create backup');
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('backup:restore', async (_event, backupId: string) => {
    try {
      const restored = await modEngine.restoreBackup(backupId, store.modsPath, store.gamePath);
      sendLog('INFO', `Backup restored: ${backupId}`);
      return { success: true, restored };
    } catch (error) {
      sendLog('ERROR', 'Failed to restore backup');
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('game:start', async () => {
    if (!store.gamePath) {
      sendLog('ERROR', 'Game path is not set');
      throw new Error('Game path is not set');
    }
    const GAME_EXE = 'CrimsonDesert.exe';
    const exePath = findFileRecursive(store.gamePath, GAME_EXE, 3);
    if (!exePath) {
      sendLog('ERROR', `Game executable '${GAME_EXE}' not found`);
      throw new Error(`${GAME_EXE} not found in ${store.gamePath} (up to 3 levels)`);
    }
    if (!fs.statSync(exePath).isFile()) throw new Error(`Not a file: ${exePath}`);
    spawn(exePath, [], { detached: true, stdio: 'ignore', cwd: path.dirname(exePath) });
    sendLog('SUCCESS', `Game launched: ${exePath}`);
    return { success: true, exePath };
  });
}