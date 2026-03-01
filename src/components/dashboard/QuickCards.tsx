import { useAppStore } from '../../store/index.js';

const metrics = [
  { key: 'sleep_hours', label: 'Сон', emoji: '😴', suffix: 'ч' },
  { key: 'energy', label: 'Энергия', emoji: '⚡', suffix: '/10' },
  { key: 'stress', label: 'Стресс', emoji: '😰', suffix: '/10' },
  { key: 'mood', label: 'Настроение', emoji: '😊', suffix: '/10' },
  { key: 'deep_work_hours', label: 'Глубокая работа', emoji: '🎯', suffix: 'ч' },
];

export function QuickCards() {
  const reports = useAppStore((s) => s.reports);

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const todayReport = reports.find((r) => !r.isDraft && r.date.slice(0, 10) === today);
  const yesterdayReport = reports.find((r) => !r.isDraft && r.date.slice(0, 10) === yesterday);

  return (
    <div className="quick-cards">
      {metrics.map((m) => {
        const val = todayReport?.values[m.key];
        const prevVal = yesterdayReport?.values[m.key];
        const hasVal = val !== undefined && val !== '' && val !== null;
        const hasPrev = prevVal !== undefined && prevVal !== '' && prevVal !== null;
        const delta = hasVal && hasPrev ? Number(val) - Number(prevVal) : null;

        return (
          <div key={m.key} className="quick-card">
            <div className="quick-card__emoji">{m.emoji}</div>
            <div className="quick-card__label">{m.label}</div>
            <div className="quick-card__value">
              {hasVal ? `${val}${m.suffix}` : '—'}
            </div>
            {delta !== null && delta !== 0 && (
              <div className={`quick-card__trend ${delta > 0 ? 'quick-card__trend--up' : 'quick-card__trend--down'}`}>
                {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
