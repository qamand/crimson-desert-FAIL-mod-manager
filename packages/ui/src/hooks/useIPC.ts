import type { ModManagerAPI } from '../types/modManagerAPI.js';

const useIPC = (): ModManagerAPI => {
  if (!window.modManagerAPI) {
    throw new Error('modManagerAPI is not available in the renderer context');
  }
  return window.modManagerAPI;
};

export default useIPC;