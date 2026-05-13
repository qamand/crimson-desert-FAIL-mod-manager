// packages/ui/src/components/ModManagerApp.tsx
import React from 'react';
import Header from './Header.js';
import HeroArea from './HeroArea.js';
import PathBar from './PathBar.js';
import ModListPanel from './ModListPanel.js';
import PatchPanel from './PatchPanel.js';
import LogPanel from './LogPanel.js';
import FooterToolbar from './FooterToolbar.js';
import StatusBar from './StatusBar.js';

const ModManagerApp: React.FC = () => {
  return (
    <>
      <style>{`
        :root {
          --color-bg-app: #020617;
          --color-bg-panel: #0f172a;
          --color-bg-card: #1e293b;
          --color-bg-hover: #334155;
          --color-bg-muted: #475569;
          --color-border: #1e293b;
          --color-text-primary: #f1f5f9;
          --color-text-secondary: #94a3b8;
          --color-text-muted: #64748b;
          --color-accent-cyan: #22d3ee;
          --color-accent-red: #ef4444;
          --color-accent-green: #22c55e;
          --color-accent-yellow: #eab308;
          --color-accent-purple: #8b5cf6;
          --font-family: 'Segoe UI', system-ui, sans-serif;
        }
      `}</style>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: 'var(--color-bg-app, #020617)',
        color: 'var(--color-text-primary, #f1f5f9)',
        fontFamily: 'var(--font-family, "Segoe UI", system-ui, sans-serif)',
      }}>
        <Header />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: '280px', borderRight: '1px solid var(--color-border, #1e293b)', display: 'flex', flexDirection: 'column' }}>
            <ModListPanel />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <HeroArea />
            <PathBar />
            <PatchPanel />
          </div>

          <div style={{ width: '320px', borderLeft: '1px solid var(--color-border, #1e293b)', display: 'flex', flexDirection: 'column' }}>
            <LogPanel />
          </div>
        </div>

        <FooterToolbar />
        <StatusBar />
      </div>
    </>
  );
};

export default ModManagerApp;