import type { IFileSystem } from '@modmanager/types';
export async function parseManifest(fs: IFileSystem, modPath: string): Promise<any> {
  if (!(await fs.pathExists(modPath))) throw new Error('Mod path not found');
  return { name: 'unknown', patches: [] };
}