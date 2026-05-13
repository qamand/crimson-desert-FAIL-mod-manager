// packages/ui/src/components/FooterToolbar.tsx
import React from 'react';

const FooterToolbar: React.FC = () => {
  const handleLaunchGame = async () => {
    try {
      await window.modManagerAPI.startGame();
    } catch (error) {
      console.error('Launch failed', error);
    }
  };

  const handleRefresh = () => {
    window.dispatchEvent(new CustomEvent('mods-updated'));
  };

  const handleDeploy = async () => {
    try {
      // Получаем список активных модов из localStorage
      const raw = localStorage.getItem('modmanager-enabled-mods');
      const ids: string[] = raw ? JSON.parse(raw) : [];
      if (ids.length === 0) {
        alert('No active mods to deploy.');
        return;
      }
      const result = await window.modManagerAPI.deployMods(ids);
      if (!result.success) {
        alert('Deploy failed: ' + (result.error || 'Unknown error'));
      }
    } catch (e) {
      console.error(e);
      alert('Deploy error');
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--color-bg-app, #020617)',
      borderTop: '1px solid var(--color-border, #1e293b)',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '3.5rem',
    }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={handleLaunchGame}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            backgroundColor: 'transparent',
            color: 'var(--color-text-primary, #f1f5f9)',
            border: '1px solid var(--color-border, #1e293b)',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          ▶ Launch Game
        </button>
        <button
          onClick={handleRefresh}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            backgroundColor: 'transparent',
            color: 'var(--color-text-primary, #f1f5f9)',
            border: '1px solid var(--color-border, #1e293b)',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          ↻ Refresh
        </button>
        <button
          onClick={handleDeploy}
          style={{
            padding: '0.5rem 2rem',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            backgroundColor: 'var(--color-accent-blue, #0078D4)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          DEPLOY MODS
        </button>
      </div>
    </div>
  );
};

export default FooterToolbar;