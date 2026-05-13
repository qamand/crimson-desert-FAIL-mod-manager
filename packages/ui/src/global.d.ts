import type { ModManagerAPI } from './types/modManagerAPI';

declare global {
  interface Window {
    modManagerAPI: ModManagerAPI;
  }
}