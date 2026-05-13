// packages/ui/src/components/PathBar.tsx
import React from 'react';

const PathBar: React.FC = () => {
  const patchCount = 0; // в будущем можно динамически

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-app, #020617)',
        borderBottom: '1px solid var(--color-border, #1e293b)',
        padding: '0.5rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        height: '2.5rem',
        fontSize: '0.875rem',
        color: 'var(--color-text-secondary, #94a3b8)',
      }}
    >
      <span>PATCHES</span>
      <span style={{ color: 'var(--color-text-muted, #64748b)' }}>({patchCount})</span>
    </div>
  );
};

export default PathBar;