// packages/fs/src/fsManager.ts
import { IFileSystem } from '@modmanager/types';
import fse from 'fs-extra';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { createHash } from 'crypto';

export class FileSystem implements IFileSystem {
  private basePath: string;
  private gamePath: string;
  private modsPath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
    this.gamePath = '';
    this.modsPath = '';
  }

  updatePaths(gamePath: string, modsPath: string): void {
    this.gamePath = gamePath;
    this.modsPath = modsPath;
  }

  getPaths(): { basePath: string; gamePath: string; modsPath: string } {
    return { basePath: this.basePath, gamePath: this.gamePath, modsPath: this.modsPath };
  }

  async exists(p: string): Promise<boolean> {
    return fse.pathExists(p);
  }

  async pathExists(p: string): Promise<boolean> {
    return fse.pathExists(p);
  }

  async readFile(p: string): Promise<Buffer> {
    return fse.readFile(p);
  }

  async writeFile(p: string, data: Buffer | string): Promise<void> {
    return fse.writeFile(p, data);
  }

  async copy(src: string, dest: string): Promise<void> {
    return fse.copy(src, dest);
  }

  async move(src: string, dest: string): Promise<void> {
    return fse.move(src, dest);
  }

  async mkdir(p: string): Promise<void> {
    return fse.mkdir(p);
  }

  async remove(p: string): Promise<void> {
    return fse.remove(p);
  }

  async listDir(p: string): Promise<string[]> {
    // Используем fs.promises.readdir через fse
    const entries = await fse.readdir(p, { withFileTypes: true });
    return entries.filter((e: any) => e.isDirectory()).map((e: any) => e.name);
  }

  async listFiles(p: string): Promise<string[]> {
    const entries = await fse.readdir(p, { withFileTypes: true });
    return entries.filter((e: any) => e.isFile()).map((e: any) => e.name);
  }

  async stat(p: string): Promise<any> {
    return fse.stat(p);
  }

  async hashFile(p: string): Promise<string> {
    const data = await fse.readFile(p);
    return createHash('md5').update(data).digest('hex');
  }

  async readJson(p: string): Promise<any> {
    return fse.readJson(p);
  }

  async writeJson(p: string, data: any): Promise<void> {
    return fse.writeJson(p, data);
  }

  async ensureDir(p: string): Promise<void> {
    return fse.ensureDir(p);
  }

  async ensureWritable(p: string): Promise<void> {
    await fse.ensureDir(p);
    const testFile = path.join(p, '.writetest');
    await fse.writeFile(testFile, 'test');
    await fse.remove(testFile);
  }

  async extractArchive(archivePath: string, destPath: string): Promise<void> {
    const zip = new AdmZip(archivePath);
    zip.extractAllTo(destPath, true);
  }

  async loadConfig(): Promise<{ gamePath?: string; modsPath?: string } | null> {
    const configPath = path.join(this.basePath, 'modmanager-config.json');
    console.log('[FS] loadConfig from', configPath);
    if (await this.exists(configPath)) {
      try {
        return await this.readJson(configPath);
      } catch {
        return null;
      }
    }
    return null;
  }

  async saveConfig(data: { gamePath: string; modsPath: string }): Promise<void> {
    const configPath = path.join(this.basePath, 'modmanager-config.json');
    await this.ensureDir(this.basePath);
    console.log('[FS] saveConfig to', configPath, data);
    await this.writeJson(configPath, data);
  }
}