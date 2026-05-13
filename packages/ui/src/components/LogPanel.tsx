// packages/ui/src/components/LogPanel.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface LogEntry {
  time: string;
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
}

const levelColors: Record<string, string> = {
  INFO: 'var(--color-text-secondary, #94a3b8)',
  SUCCESS: 'var(--color-accent-green, #22c55e)',
  WARNING: 'var(--color-accent-yellow, #eab308)',
  ERROR: 'var(--color-accent-red, #ef4444)',
};

const MAX_LOG_ENTRIES = 200;

const LogPanel: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((entry: LogEntry) => {
    setLogs(prev => {
      const next = [...prev, entry];
      return next.length > MAX_LOG_ENTRIES ? next.slice(-MAX_LOG_ENTRIES) : next;
    });
  }, []);

  useEffect(() => {
    if (window.modManagerAPI?.onLog) {
      window.modManagerAPI.onLog((entry: LogEntry) => {
        addLog(entry);
      });
    }
  }, [addLog]);

  // Автопрокрутка вниз
  useEffect(() => {
    const el = logContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-bg-app, #020617)' }}>
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border, #1e293b)' }}>
        <h2 style={{
          fontSize: '0.75rem',
          fontWeight: 'bold',
          color: 'var(--color-text-secondary, #94a3b8)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: 0,
        }}>
          Event Log
        </h2>
      </div>
      <div
        ref={logContainerRef}
        style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.7rem' }}
      >
        {logs.length === 0 ? (
          <div style={{ color: 'var(--color-text-muted, #64748b)', padding: '1rem', textAlign: 'center' }}>
            No events yet
          </div>
        ) : (
          logs.map((entry, idx) => (
            <div key={idx} style={{ marginBottom: '0.25rem', lineHeight: 1.4 }}>
              <span style={{ color: 'var(--color-text-muted, #64748b)' }}>{entry.time.slice(11, 19)} </span>
              <span style={{ color: levelColors[entry.level] || 'var(--color-text-muted)', fontWeight: 'bold' }}>
                [{entry.level}]
              </span>{' '}
              <span style={{ color: 'var(--color-text-secondary, #94a3b8)' }}>{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogPanel;