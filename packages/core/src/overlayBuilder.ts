import type { IFileSystem } from '@modmanager/types';
export async function buildOverlay(fs: IFileSystem, gamePath: string, modsWithManifests: any[]): Promise<any> {
  const overlayDir = gamePath + '_overlay';
  await fs.ensureDir(overlayDir);
  let count = 0;
  for (const { modId } of modsWithManifests) {
    const paths = fs.getPaths();
    const modPath = `${paths.modsPath}/${modId}`;
    const files = await fs.listFiles(modPath);
    for (const file of files) {
      await fs.copy(`${modPath}/${file}`, `${overlayDir}/${file}`);
      count++;
    }
  }
  return { appliedModIds: modsWithManifests.map(m => m.modId), copiedFileCount: count };
}