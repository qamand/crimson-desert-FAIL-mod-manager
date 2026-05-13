// packages/ui/src/components/ModListPanel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useModActions } from '../hooks/useModActions.js';
import type { ModEntry } from '@modmanager/types';

const buttonStyle: React.CSSProperties = {
  padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 500,
  backgroundColor: 'var(--color-bg-card, #1e293b)', color: 'var(--color-text-secondary, #94a3b8)',
  border: '1px solid var(--color-border, #1e293b)', borderRadius: '4px',
  cursor: 'pointer', whiteSpace: 'nowrap',
};

const deleteButtonStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--color-text-muted, #64748b)',
  cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0.25rem',
  opacity: 0.6, flexShrink: 0,
};

const ENABLED_MODS_KEY = 'modmanager-enabled-mods';

function loadEnabledMods(): Set<string> {
  try {
    const raw = localStorage.getItem(ENABLED_MODS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
}

function saveEnabledMods(mods: Set<string>) {
  localStorage.setItem(ENABLED_MODS_KEY, JSON.stringify([...mods]));
}

const ModListPanel: React.FC = () => {
  const { paths, listMods } = useModActions();
  const [mods, setMods] = useState<ModEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'data' | 'asi' | 'language'>('data');
  const [selectedModId, setSelectedModId] = useState<string | null>(null);
  const [localGamePath, setLocalGamePath] = useState<string>(paths.gamePath);
  const [localModsPath, setLocalModsPath] = useState<string>(paths.modsPath);
  const [enabledMods, setEnabledMods] = useState<Set<string>>(() => loadEnabledMods());

  useEffect(() => {
    setLocalGamePath(paths.gamePath);
    setLocalModsPath(paths.modsPath);
  }, [paths.gamePath, paths.modsPath]);

  useEffect(() => {
    window.modManagerAPI.getPaths().then((p: any) => {
      if (p) {
        setLocalGamePath(p.gamePath || '');
        setLocalModsPath(p.modsPath || '');
      }
    });
  }, []);

  const refreshLocalPaths = useCallback(async () => {
    const fresh = await window.modManagerAPI.getPaths();
    if (fresh) {
      setLocalGamePath(fresh.gamePath);
      setLocalModsPath(fresh.modsPath);
    }
  }, []);

  const loadMods = useCallback(async () => {
    console.log('[ModListPanel] loadMods called');
    const result = await listMods();
    console.log('[ModListPanel] mods:', result);
    setMods(Array.isArray(result) ? result : []);
  }, [listMods]);

  useEffect(() => {
    loadMods();
    const handler = () => loadMods();
    window.addEventListener('mods-updated', handler);
    return () => window.removeEventListener('mods-updated', handler);
  }, [loadMods]);

  useEffect(() => {
    saveEnabledMods(enabledMods);
  }, [enabledMods]);

  const handleToggleMod = (modId: string) => {
    setEnabledMods(prev => {
      const next = new Set(prev);
      if (next.has(modId)) next.delete(modId);
      else next.add(modId);
      return next;
    });
  };

  const handleDeleteMod = async (modId: string) => {
    await window.modManagerAPI.removeMod(modId);
    setEnabledMods(prev => {
      const next = new Set(prev);
      next.delete(modId);
      return next;
    });
    loadMods();
  };

  const handleSelectMod = (mod: ModEntry) => {
    console.log('[ModListPanel] Selected mod:', mod.name, 'dispatching event');
    setSelectedModId(mod.id);
    window.dispatchEvent(new CustomEvent('mod-selected', { detail: mod }));
  };

  // Фильтрация по вкладкам
  const displayedMods = activeTab === 'data'
    ? mods.filter(m => m.type === 'data')
    : activeTab === 'asi'
    ? mods.filter(m => m.type === 'asi')
    : mods.filter(m => m.type === 'language');

  const activeCount = displayedMods.filter(m => enabledMods.has(m.id)).length;

  const handleOpenGameFolder = () => {
    if (!localGamePath) return alert('Game path not set');
    window.modManagerAPI.openPath(localGamePath).catch((e: any) => alert(e.message));
  };
  const handleBrowseGameFolder = async () => {
    const selected = await window.modManagerAPI.openDirectoryDialog();
    if (selected) {
      await window.modManagerAPI.setPaths(selected, localModsPath);
      await refreshLocalPaths();
      loadMods();
    }
  };
  const handleOpenModsFolder = () => {
    if (!localModsPath) return alert('Mods path not set');
    window.modManagerAPI.openPath(localModsPath).catch((e: any) => alert(e.message));
  };
  const handleBrowseModsFolder = async () => {
    const selected = await window.modManagerAPI.openDirectoryDialog();
    if (selected) {
      await window.modManagerAPI.setPaths(localGamePath, selected);
      await refreshLocalPaths();
      loadMods();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-bg-app, #020617)' }}>
      <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--color-border, #1e293b)', backgroundColor: 'var(--color-bg-panel, #0f172a)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #94a3b8)', margin: 0, wordBreak: 'break-word', lineHeight: 1.4 }}>
              <span style={{ fontWeight: 600, color: 'var(--color-accent-yellow, #eab308)', whiteSpace: 'nowrap' }}>GAME DIR</span>
              <span style={{ marginLeft: '0.5rem', color: 'var(--color-accent-green, #22c55e)' }}>{localGamePath || 'Not set'}</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
            <button onClick={handleOpenGameFolder} style={buttonStyle}>Open</button>
            <button onClick={handleBrowseGameFolder} style={buttonStyle}>Browse</button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #94a3b8)', margin: 0, wordBreak: 'break-word', lineHeight: 1.4 }}>
              <span style={{ fontWeight: 600, color: 'var(--color-accent-yellow, #eab308)', whiteSpace: 'nowrap' }}>MODS DIR</span>
              <span style={{ marginLeft: '0.5rem', color: 'var(--color-accent-cyan, #22d3ee)' }}>{localModsPath || 'Not set'}</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
            <button onClick={handleOpenModsFolder} style={buttonStyle}>Open</button>
            <button onClick={handleBrowseModsFolder} style={buttonStyle}>Browse</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border, #1e293b)', padding: '0 0.5rem' }}>
        {(['data', 'asi', 'language'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              color: activeTab === tab ? 'var(--color-text-primary, #f1f5f9)' : 'var(--color-text-muted, #64748b)',
              borderBottom: activeTab === tab ? '2px solid var(--color-accent-cyan, #22d3ee)' : '2px solid transparent',
              backgroundColor: activeTab === tab ? 'var(--color-bg-card, #1e293b)' : 'transparent',
              transition: 'all 0.2s', cursor: 'pointer',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
            }}>
            {tab === 'data' && `Data Mods (${mods.filter(m => m.type === 'data').length})`}
            {tab === 'asi' && `ASI / DLL (${mods.filter(m => m.type === 'asi').length})`}
            {tab === 'language' && `Language (${mods.filter(m => m.type === 'language').length})`}
          </button>
        ))}
      </div>

      <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--color-border, #1e293b)', height: '2.5rem', display: 'flex', alignItems: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)', textTransform: 'uppercase', fontWeight: 600, margin: 0 }}>
          ACTIVE ({activeCount} / {displayedMods.length})
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {displayedMods.map(mod => {
          const isEnabled = enabledMods.has(mod.id);
          const isSelected = selectedModId === mod.id;
          return (
            <div key={mod.id} onClick={() => handleSelectMod(mod)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderBottom: '1px solid rgba(30, 41, 59, 0.5)',
                backgroundColor: isSelected ? 'var(--color-bg-card, #1e293b)' : 'transparent',
                transition: 'background-color 0.2s', cursor: 'pointer',
              }}>
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleMod(mod.id); }}
                style={{
                  position: 'relative', width: '2rem', height: '1rem',
                  borderRadius: '9999px',
                  backgroundColor: isEnabled ? 'var(--color-accent-green, #22c55e)' : 'var(--color-bg-muted, #475569)',
                  border: 'none', cursor: 'pointer', flexShrink: 0,
                  transition: 'background-color 0.3s',
                }}
                title={isEnabled ? 'Disable mod' : 'Enable mod'}
              >
                <span style={{
                  position: 'absolute', top: '0.125rem',
                  left: isEnabled ? '1.125rem' : '0.125rem',
                  width: '0.75rem', height: '0.75rem', borderRadius: '50%',
                  backgroundColor: isEnabled ? '#fff' : 'var(--color-text-secondary, #94a3b8)',
                  transition: 'left 0.3s',
                }} />
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: isSelected ? 'var(--color-accent-cyan, #22d3ee)' : 'var(--color-text-primary, #f1f5f9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {mod.name}
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteMod(mod.id); }}
                style={deleteButtonStyle}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-accent-red, #ef4444)'; e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted, #64748b)'; e.currentTarget.style.opacity = '0.6'; }}>
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ModListPanel;