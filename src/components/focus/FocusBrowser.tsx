import { useState } from 'react';
import { useAppStore } from '../../store/index.js';
import { BlockScreen } from './BlockScreen.js';

export function FocusBrowser() {
  const [url, setUrl] = useState('');
  const [loadedUrl, setLoadedUrl] = useState('');
  const [blocked, setBlocked] = useState(false);

  const isUrlBlocked = useAppStore((s) => s.isUrlBlocked);
  const blockRules = useAppStore((s) => s.blockRules);
  const settings = useAppStore((s) => s.settings);

  const findMatchingRule = (checkUrl: string) => {
    const hostname = extractHostname(checkUrl);
    for (const rule of blockRules) {
      if (!rule.enabled) continue;
      for (const domain of rule.domains) {
        if (hostname.includes(domain)) return rule;
      }
      for (const kw of rule.keywords) {
        if (checkUrl.toLowerCase().includes(kw.toLowerCase())) return rule;
      }
    }
    return blockRules[0];
  };

  const handleGo = () => {
    if (!url.trim()) return;
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;

    if (isUrlBlocked(fullUrl)) {
      setLoadedUrl(fullUrl);
      setBlocked(true);
    } else {
      setLoadedUrl(fullUrl);
      setBlocked(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleGo();
  };

  if (blocked && loadedUrl) {
    const rule = findMatchingRule(loadedUrl);
    return (
      <BlockScreen
        url={loadedUrl}
        rule={rule}
        onClose={() => { setBlocked(false); setLoadedUrl(''); setUrl(''); }}
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          className="input"
          type="url"
          placeholder="Введите URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ flex: 1 }}
        />
        <button className="btn btn--primary btn--sm" onClick={handleGo}>→</button>
      </div>

      {!settings.blockerSettings.enabled && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--warning)', fontSize: 13 }}>
          Блокировщик отключён
        </div>
      )}

      {loadedUrl && !blocked && (
        <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <iframe
            src={loadedUrl}
            title="Focus Browser"
            style={{ width: '100%', height: '60dvh', border: 'none' }}
            sandbox="allow-scripts allow-same-origin allow-forms"
            onError={() => {}}
          />
          <div style={{ padding: 8, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            Некоторые сайты могут не загружаться во встроенном браузере.{' '}
            <a href={loadedUrl} target="_blank" rel="noopener noreferrer">Открыть в новой вкладке</a>
          </div>
        </div>
      )}

      {!loadedUrl && (
        <div className="empty-state">
          <div className="empty-state__icon">🔍</div>
          <div className="empty-state__text">Введите URL для проверки</div>
        </div>
      )}
    </div>
  );
}

function extractHostname(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
  } catch {
    return url.toLowerCase();
  }
}
