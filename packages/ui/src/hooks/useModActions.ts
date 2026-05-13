// packages/ui/src/hooks/useModActions.ts
import { useState, useEffect, useCallback } from 'react';
import type { ModEntry } from '@modmanager/types';

interface Paths { gamePath: string; modsPath: string; }

export function useModActions() {
  const [paths, setPathsState] = useState<Paths>({ gamePath: '', modsPath: '' });

  useEffect(() => {
    window.modManagerAPI.getPaths().then((p: Paths) => {
      if (p) setPathsState(p);
    });
  }, []);

  const setPaths = useCallback(async (gamePath: string, modsPath: string) => {
    await window.modManagerAPI.setPaths(gamePath, modsPath);
    setPathsState({ gamePath, modsPath });
  }, []);

  const listMods = useCallback(async (): Promise<ModEntry[]> => {
    try {
      const result = await window.modManagerAPI.listMods();
      return Array.isArray(result) ? (result as ModEntry[]) : [];
    } catch { return []; }
  }, []);

  const installMod = useCallback(async (archivePath: string) => {
    return window.modManagerAPI.installMod(archivePath);
  }, []);

  const removeMod = useCallback(async (modId: string) => {
    return window.modManagerAPI.removeMod(modId);
  }, []);

  return { paths, setPaths, listMods, installMod, removeMod };
}