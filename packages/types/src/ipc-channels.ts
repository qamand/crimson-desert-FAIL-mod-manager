// packages/types/src/ipc-channels.ts

export const IPC_CHANNELS = {
  APP_GET_PATHS: 'app:getPaths',
  APP_SET_PATHS: 'app:setPaths',
  DIALOG_OPEN_FILE: 'dialog:openFile',
  DIALOG_OPEN_DIRECTORY: 'dialog:openDirectory',
  MODS_INSTALL: 'mods:install',
  MODS_REMOVE: 'mods:remove',
  MODS_LIST: 'mods:list',
  OVERLAY_APPLY: 'overlay:apply',
  OVERLAY_VERIFY: 'overlay:verify',
  BACKUP_CREATE: 'backup:create',
  BACKUP_RESTORE: 'backup:restore',
  GAME_START: 'game:start',
} as const;