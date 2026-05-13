// packages/types/src/models.ts

export interface AppPaths {
  gamePath: string;
  modsPath: string;
}

export interface IntegrityReport {
  status: 'ok' | 'error';
  message?: string;
}

export interface OverlayBuildResult {
  success: boolean;
  overlayPath?: string;
  errors?: string[];
}

export interface ModManifest {
  name: string;
  patches: any[];
}

export interface OverlayConflict {
  sourceModId: string;
  targetModId: string;
  fileName: string;
}