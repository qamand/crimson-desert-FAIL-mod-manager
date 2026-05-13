// packages/ui/src/components/PatchPanel.tsx
import React, { useState, useEffect, useRef, memo } from 'react';

interface ModParameter {
  id: string;        // уникальный ключ
  name: string;      // текст для отображения
  enabled: boolean;
}

interface ModDetail {
  id: string;
  name: string;
  type: 'data' | 'asi' | 'language';
}

// Максимальное число отображаемых параметров (защита от зависаний)
const MAX_PARAMS = 500;

// Мемоизированная строка параметра, чтобы не перерисовывать весь список
const ParameterRow = memo(function ParameterRow({
  param,
  isEnabled,
  onToggle,
}: {
  param: ModParameter;
  isEnabled: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem',
        borderRadius: '4px',
        backgroundColor: 'var(--color-bg-card, #1e293b)',
      }}
    >
      <button
        onClick={() => onToggle(param.id)}
        style={{
          position: 'relative',
          width: '2rem',
          height: '1rem',
          borderRadius: '9999px',
          backgroundColor: isEnabled
            ? 'var(--color-accent-green, #22c55e)'
            : 'var(--color-bg-muted, #475569)',
          border: 'none',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        title={isEnabled ? 'Disable' : 'Enable'}
      >
        <span
          style={{
            position: 'absolute',
            top: '0.125rem',
            left: isEnabled ? '1.125rem' : '0.125rem',
            width: '0.75rem',
            height: '0.75rem',
            borderRadius: '50%',
            backgroundColor: isEnabled
              ? '#fff'
              : 'var(--color-text-secondary, #94a3b8)',
            transition: 'left 0.3s',
          }}
        />
      </button>
      <span
        style={{
          fontSize: '0.875rem',
          color: 'var(--color-text-primary, #f1f5f9)',
        }}
      >
        {param.name}
      </span>
    </div>
  );
});

const PatchPanel: React.FC = () => {
  const [selectedMod, setSelectedMod] = useState<ModDetail | null>(null);
  const [parameters, setParameters] = useState<ModParameter[]>([]);
  const [paramStates, setParamStates] = useState<Record<string, boolean>>({});
  const loadingModIdRef = useRef<string | null>(null);

  // Подписка на событие выбора мода
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as ModDetail;
      setSelectedMod(detail);
    };
    window.addEventListener('mod-selected', handler);
    return () => window.removeEventListener('mod-selected', handler);
  }, []);

  // При изменении selectedMod загружаем параметры
  useEffect(() => {
    if (!selectedMod) {
      setParameters([]);
      setParamStates({});
      return;
    }

    // Сброс перед загрузкой
    setParameters([]);
    setParamStates({});

    const id = selectedMod.id;
    loadingModIdRef.current = id;

    // Загружаем сохранённые состояния
    const key = `mod-params-${id}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        setParamStates(JSON.parse(saved));
      }
    } catch {}

    if (
      selectedMod.type !== 'data' ||
      !selectedMod.name.toLowerCase().endsWith('.json')
    ) {
      return;
    }

    if (typeof window.modManagerAPI?.readModContent !== 'function') {
      console.error('[PatchPanel] readModContent not available');
      return;
    }

    const loadContent = async () => {
      try {
        const content = await window.modManagerAPI.readModContent(id);
        if (loadingModIdRef.current !== id) return;

        if (!content) {
          setParameters([]);
          return;
        }

        const json = JSON.parse(content);
        let parsedParams: ModParameter[] = [];
        let idx = 0;

        if (Array.isArray(json.patches)) {
          for (const patch of json.patches) {
            if (Array.isArray(patch.changes)) {
              for (const change of patch.changes) {
                // Прерываем, если уже набрали лимит
                if (idx >= MAX_PARAMS) break;
                if (change && typeof change.label === 'string') {
                  parsedParams.push({
                    id: `param-${idx}`,   // уникальный ключ, не зависящий от текста
                    name: change.label,
                    enabled: true,
                  });
                  idx++;
                }
              }
            }
            if (idx >= MAX_PARAMS) break;
          }
        } else if (Array.isArray(json.parameters)) {
          parsedParams = json.parameters
            .filter((p: any) => p && typeof p.id === 'string')
            .slice(0, MAX_PARAMS)
            .map((p: any, i: number) => ({
              id: p.id || `param-${i}`,
              name: p.name || p.id,
              enabled: p.enabled !== undefined ? p.enabled : true,
            }));
        } else {
          // Ключи с булевыми значениями
          const keys = Object.keys(json).filter(
            key => typeof json[key] === 'boolean'
          );
          parsedParams = keys.slice(0, MAX_PARAMS).map((key, i) => ({
            id: key,
            name: key,
            enabled: json[key],
          }));
        }

        if (loadingModIdRef.current !== id) return;

        setParameters(parsedParams);

        // Инициализируем state, если ещё нет сохранения
        const storageKey = `mod-params-${id}`;
        if (!localStorage.getItem(storageKey) && parsedParams.length > 0) {
          const initial: Record<string, boolean> = {};
          parsedParams.forEach(p => (initial[p.id] = p.enabled));
          localStorage.setItem(storageKey, JSON.stringify(initial));
          setParamStates(initial);
        }
      } catch (err) {
        console.error('[PatchPanel] Error reading mod:', err);
        if (loadingModIdRef.current === id) setParameters([]);
      }
    };

    loadContent();
  }, [selectedMod]);

  const handleToggleParam = (paramId: string) => {
    if (!selectedMod) return;
    setParamStates(prev => {
      const next = { ...prev, [paramId]: !prev[paramId] };
      localStorage.setItem(
        `mod-params-${selectedMod.id}`,
        JSON.stringify(next),
      );
      return next;
    });
  };

  if (!selectedMod) {
    return (
      <div
        style={{
          flex: 1,
          backgroundColor: 'var(--color-bg-panel, #0f172a)',
          borderTop: '1px solid var(--color-border, #1e293b)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <p
          style={{
            color: 'var(--color-text-muted, #64748b)',
            fontSize: '0.875rem',
          }}
        >
          Select a mod to view details
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: 'var(--color-bg-panel, #0f172a)',
        borderTop: '1px solid var(--color-border, #1e293b)',
        overflowY: 'auto',
      }}
    >
      <div style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2
            style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--color-text-primary, #f1f5f9)',
              marginBottom: '0.5rem',
            }}
          >
            {selectedMod.name}
          </h2>
          {parameters.length > 0 && (
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary, #94a3b8)',
              }}
            >
              {parameters.length} editable parameter(s)
              {parameters.length === MAX_PARAMS ? ' (limited to 500)' : ''}
            </p>
          )}
          {parameters.length === 0 && (
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-muted, #64748b)',
              }}
            >
              No editable parameters found.
            </p>
          )}
        </div>

        {parameters.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary, #f1f5f9)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1rem',
              }}
            >
              Parameters
            </h4>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
            >
              {parameters.map(param => {
                const isEnabled =
                  paramStates[param.id] !== undefined
                    ? paramStates[param.id]
                    : param.enabled;
                return (
                  <ParameterRow
                    key={param.id}
                    param={param}
                    isEnabled={isEnabled}
                    onToggle={handleToggleParam}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatchPanel;