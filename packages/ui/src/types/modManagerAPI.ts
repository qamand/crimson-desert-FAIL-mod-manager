export interface ModManagerAPI {
  getPaths(): Promise<{ gamePath: string; modsPath: string }>;
  getState(): Promise<{ gamePath: string; modsPath: string }>;
  setPaths(paths: { gamePath?: string; modsPath?: string }): Promise<{ success: boolean }>;

  openFileDialog(): Promise<{ filePath: string | null }>;
  openDirectoryDialog(): Promise<{ dirPath: string | null }>;

  installMod(archivePath: string): Promise<{ modId: string }>;
  removeMod(modId: string): Promise<{ success: boolean }>;
  listMods(): Promise<{ mods: { id: string; name: string }[] }>;
  applyOverlay(modIds: string[]): Promise<{ report: any }>;
  verifyOverlay(): Promise<{ integrity: string }>;

  createBackup(assetPath: string): Promise<{ backupId: string }>;
  restoreBackup(backupId: string): Promise<{ success: boolean }>;
  startGame(): Promise<{ success: boolean }>;

  getFilePath(file: File): string;

  onOverlayProgress(callback: (progress: any) => void): void;
}