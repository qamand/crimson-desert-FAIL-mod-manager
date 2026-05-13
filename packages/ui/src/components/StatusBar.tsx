// packages/ui/src/components/StatusBar.tsx
import React from 'react';

const StatusBar: React.FC = () => {
  return (
    <div style={{
      backgroundColor: 'var(--color-bg-app, #020617)',
      borderTop: '1px solid var(--color-border, #1e293b)',
      padding: '0.25rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '2rem',
      fontSize: '0.75rem',
      color: 'var(--color-text-muted, #64748b)',
    }}>
      <span>Ready</span>
      <div>{/* в будущем здесь может быть статус или прогресс */}</div>
    </div>
  );
};

export default StatusBar;