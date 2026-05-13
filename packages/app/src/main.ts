// packages/app/src/main.ts
import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { FileSystem } from '@modmanager/fs';
import { FileLogger } from '@modmanager/logger';
import { SecurityGuard } from '@modmanager/security';
import { ModEngine } from '@modmanager/core';
import { registerAllHandlers } from '@modmanager/ipc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appBasePath = app.isPackaged
  ? path.dirname(app.getPath('exe'))
  : path.resolve(__dirname, '..', '..');

const store = { gamePath: '', modsPath: '' };

function sendLog(level: string, message: string) {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    win.webContents.send('log:message', {
      level,
      message,
      time: new Date().toISOString(),
    });
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1024, minHeight: 700,
    backgroundColor: '#0f0f1a',
    webPreferences: {
      preload: path.join(__dirname, '../../ipc/dist/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL;
    if (devServerUrl) {
      mainWindow.loadURL(devServerUrl);
      mainWindow.webContents.openDevTools();
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(async () => {
  const fs = new FileSystem(appBasePath);
  const logger = new FileLogger(path.join(appBasePath, 'logs'));
  const security = new SecurityGuard(fs);
  const modEngine = new ModEngine(fs, logger, security);

  // Загрузка конфига
  try {
    const config = await fs.loadConfig();
    console.log('[Main] Loaded config:', config);
    if (config) {
      if (config.gamePath) store.gamePath = config.gamePath;
      if (config.modsPath) store.modsPath = config.modsPath;
      fs.updatePaths(store.gamePath, store.modsPath);
      console.log('[Main] Store after config:', store);
      sendLog('INFO', `Loaded configuration: game=${store.gamePath || 'not set'}, mods=${store.modsPath || 'not set'}`);
    } else {
      sendLog('INFO', 'No configuration found – using defaults');
    }
  } catch (e) {
    console.error('[Main] Config load error:', e);
    sendLog('ERROR', 'Failed to load configuration');
  }

  if (!store.modsPath) {
    store.modsPath = path.join(appBasePath, 'mods');
    fs.updatePaths(store.gamePath, store.modsPath);
    await fs.ensureDir(store.modsPath);
    console.log('[Main] Default mods path:', store.modsPath);
    sendLog('INFO', `Default mods path set: ${store.modsPath}`);
    try {
      await fs.saveConfig({ gamePath: store.gamePath, modsPath: store.modsPath });
      console.log('[Main] Saved default config');
    } catch (e) {
      console.error('[Main] Failed to save default config:', e);
    }
  }

  registerAllHandlers({ fs, modEngine, logger, security, store });
  createWindow();

  // Отправляем начальное сообщение, когда окно будет готово
  app.on('browser-window-created', () => {
    sendLog('SUCCESS', 'Mod Manager ready');
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});