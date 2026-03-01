import { useState } from 'react';
import { FocusTimer } from '../components/focus/FocusTimer.js';
import { FocusBrowser } from '../components/focus/FocusBrowser.js';
import { useAppStore } from '../store/index.js';

export function FocusPage() {
  const [tab, setTab] = useState<'timer' | 'browser'>('timer');
  const currentSession = useAppStore((s) => s.currentFocusSession);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Фокус</h1>
      </div>

      <div className="tabs">
        <button
          className={`tabs__item${tab === 'timer' ? ' tabs__item--active' : ''}`}
          onClick={() => setTab('timer')}
        >
          Таймер
        </button>
        <button
          className={`tabs__item${tab === 'browser' ? ' tabs__item--active' : ''}`}
          onClick={() => setTab('browser')}
        >
          Браузер
        </button>
      </div>

      {tab === 'timer' && <FocusTimer />}
      {tab === 'browser' && <FocusBrowser />}

      {/* Mini timer floating when on browser tab */}
      {tab === 'browser' && currentSession && currentSession.status === 'running' && (
        <div
          style={{
            position: 'fixed',
            top: 12,
            right: 12,
            background: 'var(--accent)',
            color: 'white',
            borderRadius: 'var(--radius)',
            padding: '6px 14px',
            fontSize: 16,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 50,
            cursor: 'pointer',
          }}
          onClick={() => setTab('timer')}
        >
          {Math.floor(currentSession.remainingSeconds / 60)}:
          {(currentSession.remainingSeconds % 60).toString().padStart(2, '0')}
        </div>
      )}
    </div>
  );
}
