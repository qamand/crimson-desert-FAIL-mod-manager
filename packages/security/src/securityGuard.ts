// packages/security/src/securityGuard.ts

import { IFileSystem, ISecurityGuard } from '@modmanager/types';
import * as path from 'path';

export class SecurityGuard implements ISecurityGuard {
  constructor(private readonly fs: IFileSystem) {}

  async validateModArchive(archivePath: string): Promise<void> {
    if (!(await this.fs.exists(archivePath))) {
      throw new Error(`Archive not found: ${archivePath}`);
    }
  }

  validatePaths(gameDir: string, modsDir: string): void {
    if (!gameDir || !modsDir) {
      throw new Error('Game directory and Mods directory must not be empty');
    }
  }

  validateModId(modId: string): void {
    if (!modId) {
      throw new Error('modId must not be empty');
    }
  }

  async validateWritableDirectory(dir: string): Promise<void> {
    await this.fs.ensureWritable(dir);
  }
}