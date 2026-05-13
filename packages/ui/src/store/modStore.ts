// packages/ui/src/store/modStore.ts

import { create } from 'zustand';
import { AppPaths, IntegrityReport, OverlayBuildResult } from '@modmanager/types';

interface ModState {
  paths: AppPaths;
  mods: { id: string; name: string }[];
  integrity: IntegrityReport | null;
  overlayResult: OverlayBuildResult | null;
  setPaths: (paths: AppPaths) => void;
  setMods: (mods: { id: string; name: string }[]) => void;
  setIntegrity: (report: IntegrityReport | null) => void;
  setOverlayResult: (result: OverlayBuildResult | null) => void;
}

export const useModStore = create<ModState>((set) => ({
  paths: { gamePath: '', modsPath: '' },
  mods: [],
  integrity: null,
  overlayResult: null,
  setPaths: (paths) => set({ paths }),
  setMods: (mods) => set({ mods }),
  setIntegrity: (integrity) => set({ integrity }),
  setOverlayResult: (overlayResult) => set({ overlayResult }),
}));