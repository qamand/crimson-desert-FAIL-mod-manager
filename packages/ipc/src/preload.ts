const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('modManagerAPI', {
  // Системные
  getState: () => ipcRenderer.invoke('app:getPaths'),

  // Диалоги
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  openDirectoryDialog: () => ipcRenderer.invoke('dialog:openDirectory'),

  // Управление модами
  installMod: (archivePath: string) => ipcRenderer.invoke('mods:install', archivePath),
  removeMod: (modId: string) => ipcRenderer.invoke('mods:remove', modId),
  applyOverlay: (modIds: string[]) => ipcRenderer.invoke('overlay:apply', modIds),
  verifyOverlay: () => ipcRenderer.invoke('overlay:verify'),

  // Бэкапы
  createBackup: (assetPath: string) => ipcRenderer.invoke('backup:create', assetPath),
  restoreBackup: (backupId: string) => ipcRenderer.invoke('backup:restore', backupId),

  // Игра
  startGame: () => ipcRenderer.invoke('game:start'),

  // События
  onOverlayProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('overlay:progress', (_event: any, value: any) => callback(value));
  }
});