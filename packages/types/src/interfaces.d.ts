export interface IFileSystem {
    exists(path: string): Promise<boolean>;
    pathExists(path: string): Promise<boolean>;
    readFile(path: string): Promise<Buffer>;
    writeFile(path: string, data: Buffer | string): Promise<void>;
    copy(src: string, dest: string): Promise<void>;
    move(src: string, dest: string): Promise<void>;
    mkdir(path: string): Promise<void>;
    remove(path: string): Promise<void>;
    listDir(path: string): Promise<string[]>;
    listFiles(path: string): Promise<string[]>;
    stat(path: string): Promise<any>;
    hashFile(path: string): Promise<string>;
    readJson(path: string): Promise<any>;
    writeJson(path: string, data: any): Promise<void>;
    ensureDir(path: string): Promise<void>;
    ensureWritable(path: string): Promise<void>;
    extractArchive(archivePath: string, destPath: string): Promise<void>;
    getPaths(): {
        basePath: string;
        gamePath: string;
        modsPath: string;
    };
    updatePaths(gamePath: string, modsPath: string): void;
}
export interface ILogger {
    debug(scope: string, message: string, meta?: any): void;
    info(scope: string, message: string, meta?: any): void;
    warn(scope: string, message: string, meta?: any): void;
    error(scope: string, message: string, error?: any): void;
}
export interface ISecurityGuard {
    validateModArchive(archivePath: string): Promise<void>;
    validatePaths(gameDir: string, modsDir: string): void;
    validateModId(modId: string): void;
    validateWritableDirectory(dir: string): Promise<void>;
}
export interface IModEngine {
    installMod(archivePath: string, modsPath?: string): Promise<string>;
    removeMod(modId: string, modsPath?: string): Promise<boolean>;
    listMods(modsPath?: string): Promise<any[]>;
    buildOverlay(modIds: string[], gamePath: string): Promise<any>;
    createBackup(assetPath: string, modsPath?: string, gamePath?: string): Promise<string>;
    restoreBackup(backupId: string, modsPath?: string, gamePath?: string): Promise<boolean>;
}
export interface RegisterAllHandlersServices {
    fs: IFileSystem;
    modEngine: IModEngine;
    logger: ILogger;
    security: ISecurityGuard;
    store: {
        gamePath: string;
        modsPath: string;
    };
}
//# sourceMappingURL=interfaces.d.ts.map