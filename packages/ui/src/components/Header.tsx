// packages/ui/src/components/Header.tsx
import React from 'react';

const Header: React.FC = () => {
  return (
    <header
      style={{
        backgroundColor: 'var(--color-bg-app, #020617)',
        borderBottom: '1px solid #450a0a',
        padding: '0 1.5rem',
        height: '3.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <h1
        style={{
          fontSize: '0.875rem',
          fontWeight: 'bold',
          color: 'var(--color-accent-red, #ef4444)',
          letterSpacing: '0.1em',
        }}
      >
        CRIMSON DESERT — MOD MANAGER v9.9.4
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)' }}>UI</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-cyan, #22d3ee)', fontWeight: 600 }}>
          en
        </span>
        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted, #64748b)',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
          }}
          title="Settings"
        >
          ⚙️
        </button>
      </div>
    </header>
  );
};

export default Header;