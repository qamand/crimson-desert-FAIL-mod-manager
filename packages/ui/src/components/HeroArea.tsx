// packages/ui/src/components/HeroArea.tsx
import React, { useState } from 'react';

const SUPPORTED_EXTENSIONS = ['.zip', '.json', '.asi', '.dll', '.lang', '.loc', '.xml', '.txt'];

const HeroArea: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setStatus(null);

    const file = e.dataTransfer.files[0];
    if (!file) {
      setStatus('No file detected');
      return;
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setStatus('Unsupported file type');
      return;
    }

    setStatus('Installing...');

    try {
      const filePath = window.modManagerAPI.getFilePath(file);
      if (!filePath) {
        setStatus('Could not resolve file path');
        return;
      }

      const result = await window.modManagerAPI.installMod(filePath);
      if (result.success) {
        setStatus('Mod installed successfully');
        window.dispatchEvent(new CustomEvent('mods-updated'));
      } else {
        setStatus('Installation failed: ' + (result.error || 'unknown error'));
      }
    } catch (error) {
      console.error(error);
      setStatus('Installation error');
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: '100%',
        padding: '2rem 1.5rem',
        borderBottom: `2px dashed ${isDragging ? 'var(--color-accent-cyan, #22d3ee)' : 'var(--color-bg-card, #1e293b)'}`,
        backgroundColor: isDragging ? 'var(--color-bg-card, #1e293b)' : 'var(--color-bg-panel, #0f172a)',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        cursor: 'pointer',
      }}
    >
      <div style={{ fontSize: '1.5rem', color: 'var(--color-text-muted, #64748b)' }}>
        {isDragging ? '📂' : '📁'}
      </div>
      <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary, #94a3b8)' }}>
        {status || 'Drop mods here to install'}
      </h3>
      {status && (
        <p style={{ fontSize: '0.75rem', color: 'var(--color-accent-cyan, #22d3ee)' }}>
          {status}
        </p>
      )}
    </div>
  );
};

export default HeroArea;