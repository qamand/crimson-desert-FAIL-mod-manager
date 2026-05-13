# 36 hours without sleep, zero knowledge of code, couldn't get it...  Crimson Desert FAIL Mod Manager

An Electron-based desktop application for managing **Crimson Desert** mods.  
It provides a modern dark UI, drag-and-drop installation, JSON patch editing, and safe deployment through the game's PAPGT registry overlay system.

> **Status:** functional core – JSON mods require an external build step (Crimson Browser) to produce deployable `0.pamt`/`0.paz` folders.

## Features

- **No-Touch Policy** – original game files are never modified directly.
- **Drag & drop** – install mods from `.zip`, `.json`, `.asi`, `.dll` and more.
- **Mod list** with enable/disable toggles and separate tabs for Data, ASI/DLL, and Language mods.
- **Parameter editor** – view and toggle individual patches inside JSON mods.
- **PAPGT deployment** – deploys ready-to-use mod folders into the game using the overlay system.
- **Backup & restore** – automatically backs up `meta/0.papgt` before any change.
- **Event log** – real-time coloured log of all actions (install, deploy, errors).
- **Resizable panels** and dark theme via CSS custom properties.

## Requirements

- **Node.js** 20 LTS or later
- **pnpm** (usually enabled via `corepack`)
- Windows 10/11 x64 (primary target)
- A valid **Crimson Desert** installation that contains `meta/0.papgt`

## Quick start

```bash
# Clone the repository
git clone https://github.com/your-username/crimson-desert-mod-manager.git
cd crimson-desert-mod-manager

# Enable pnpm (first time only)
corepack enable

# Install dependencies
corepack pnpm install

# Run in development mode
corepack pnpm dev

Usage
Set paths – click Browse next to GAME DIR and select your Crimson Desert game folder.
The mods path defaults to a mods/ folder next to the manager. You can change it with Browse next to MODS DIR.

Add mods – drag and drop mod files into the central drop zone, or use the Open button in the mod list.

Enable/Disable – use the green toggles next to each mod. Active state is remembered automatically.

View parameters – click on a JSON mod to see its individual patches; toggle them on/off as desired.

Deploy – click DEPLOY MODS to apply all enabled mods.
The manager will back up 0.papgt, create hardlinked mod packs (0036, 0037, …), and update the registry.

Launch the game – click Launch Game to start CrimsonDesert.exe (found recursively up to 3 folders deep).

Mod formats
Ready-to-use mods (folders with 0.pamt/*.paz)
Place the whole folder inside your mods/ directory. The folder name is used as the mod identifier.
Example structure:

text
mods/
└── My Awesome Mod/
    ├── 0.pamt
    └── 0.paz
These mods are deployed directly without any conversion.

JSON patchers
If you have a .json file with "patches" and "changes" (the format used by many Crimson Desert mods), it will appear in the mod list and its parameters can be edited.
However, these mods cannot be deployed automatically yet – the manager does not extract original game files from .paz archives.

To use them you need to build a deployable mod folder using Crimson Browser (or a similar tool) and then place the resulting folder into mods/.

Project structure (monorepo)
text
modmanager/
├── packages/
│   ├── types/          # shared TypeScript interfaces
│   ├── core/           # mod engine (install, remove, list, backup)
│   ├── fs/             # file system abstraction (fs-extra)
│   ├── security/       # validators
│   ├── logger/         # file & console logger
│   ├── ipc/            # main-process handlers + preload
│   ├── ui/             # React components, Zustand store, hooks
│   ├── app/            # Electron main, Vite config, entry point
│   ├── papgt/          # PAPGT read/write, CRC, deployment
│   └── converter/      # JSON → temporary mod folder converter (experimental)
├── package.json        # root workspace scripts
└── pnpm-workspace.yaml

Building for production
bash
corepack pnpm dist
The output will be in packages/app/release/.

Contributing
This is an early-stage project. Feel free to open issues or pull requests.
